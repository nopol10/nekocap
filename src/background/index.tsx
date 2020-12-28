import React, { ReactNode, useEffect, useRef } from "react";
import { wrapStore } from "webext-redux";

import { Provider, useDispatch } from "react-redux";
import ReactDOM from "react-dom";
import { ChromeMessage, ChromeMessageType } from "@/common/types";
import { autoLogin } from "@/common/feature/login/actions";
import debounce from "lodash/debounce";
import { closeTab, requestFreshTabData } from "@/common/feature/video/actions";
import { initFirebase } from "./firebase";
import * as firebase from "firebase/app";
import "firebase/auth";
import "./common/provider";
import { store } from "./common/store";

// Firebase for auth
initFirebase();

wrapStore(store);

const BackgroundPage = ({ children }: { children?: ReactNode }) => {
  const dispatch = useDispatch();
  // Keep track of whether an auto login has been attempted to prevent anoter auto login after the auto login
  const autoLoggedIn = useRef<boolean>(false);
  useEffect(() => {
    // Perform auto login if a user exists
    // Calling onAuthStateChanged at any time will always trigger the callback if a user exists,
    // even if the auth process completed before the addition of this callback
    firebase.auth().onAuthStateChanged((user) => {
      if (user && user.uid && !autoLoggedIn.current) {
        autoLoggedIn.current = true;
        dispatch(autoLogin.request());
      }
    });
  }, []);
  return <>{children}</>;
};

document.addEventListener("DOMContentLoaded", function () {
  const Wrapper = window.backendProvider.wrapper;
  ReactDOM.render(
    <Provider store={store}>
      <Wrapper providerProps={window.backendProvider.getWrapperProps(store)}>
        <BackgroundPage>NekoCap</BackgroundPage>
      </Wrapper>
    </Provider>,
    document.getElementById("background")
  );
});

chrome.runtime.onMessage.addListener(
  (request: ChromeMessage, sender, sendResponse) => {
    if (request.type === ChromeMessageType.GetTabId) {
      sendResponse(sender.tab?.id);
    } else if (request.type === ChromeMessageType.GetProviderType) {
      sendResponse(window.backendProvider.type());
    }
  }
);

chrome.tabs.onRemoved.addListener((tabId: number, removeInfo) => {
  store.dispatch(closeTab({ tabId }));
});

// Youtube fires multiple history update events in quick succession when opening a video.
// Throttle the updates so that multiple contents scripts will not get added
const debouncedHistoryUpdateListener = debounce((details) => {
  const { tabId } = details;
  chrome.tabs.sendMessage(
    tabId,
    { type: ChromeMessageType.ContentScriptUpdate },
    (res) => {
      res = res || {};
      const newPageType = res.pageType;
      const newVideoId = res.videoId;
      const newVideoSource = res.videoSource;
      store.dispatch(
        requestFreshTabData({ tabId, newVideoId, newVideoSource, newPageType })
      );
    }
  );
}, 1000);

chrome.webNavigation.onHistoryStateUpdated.addListener(
  debouncedHistoryUpdateListener
);
