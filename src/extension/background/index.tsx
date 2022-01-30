import React, { ReactNode, useEffect, useRef } from "react";
import { Provider, useDispatch } from "react-redux";
import ReactDOM from "react-dom";
import {
  BackgroundRequest,
  ChromeMessage,
  ChromeMessageType,
} from "@/common/types";
import { autoLogin } from "@/common/feature/login/actions";
import debounce from "lodash/debounce";
import { closeTab, requestFreshTabData } from "@/common/feature/video/actions";
import { initFirebase } from "./firebase";
import * as firebase from "firebase/app";
import "firebase/auth";
import "./common/provider";
import { storeInitPromise } from "./common/store";
import { performBackendProviderRequest } from "@/common/providers/provider-utils";

// Clear reduxed
chrome.runtime.onStartup.addListener(() => {
  console.log("Extension started");
  chrome.storage.local.remove("reduxed", () => {
    console.log("Cleared reduxed");
  });
});

window.skipAutoLogin = false;
// Firebase for auth
initFirebase();

const BackgroundPage = ({ children }: { children?: ReactNode }) => {
  const dispatch = useDispatch();
  // Keep track of whether an auto login has been attempted to prevent anoter auto login after the auto login
  const autoLoggedIn = useRef<boolean>(false);
  useEffect(() => {
    // Perform auto login if a user exists
    // Calling onAuthStateChanged at any time will always trigger the callback if a user exists,
    // even if the auth process completed before the addition of this callback
    firebase.auth().onAuthStateChanged((user) => {
      if (user && user.uid && !autoLoggedIn.current && !window.skipAutoLogin) {
        autoLoggedIn.current = true;
        dispatch(autoLogin.request());
      }
    });
  }, []);
  return <>{children}</>;
};

async function performBackgroundRequest(options: BackgroundRequest) {
  const { url, method, responseType } = options;
  const response = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    xhr.responseType = responseType;
    xhr.onload = function () {
      if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) {
        if (options.responseType === "arraybuffer") {
          // @ts-ignore
          resolve(Array.from(new Uint8Array(xhr.response)));
        } else {
          resolve(xhr.response);
        }
        return;
      }
      reject("[Background request] Invalid status or response");
    };
    xhr.onerror = reject;
    xhr.send(null);
  });
  return response;
}

async function initStore() {
  return storeInitPromise;
}

chrome.runtime.onMessage.addListener(
  (request: ChromeMessage, sender, sendResponse) => {
    if (request.type === ChromeMessageType.GetTabId) {
      sendResponse(sender.tab?.id);
    } else if (request.type === ChromeMessageType.GetProviderType) {
      sendResponse(window.backendProvider.type());
    } else if (request.type === ChromeMessageType.Request) {
      const response = { data: null, error: null };
      performBackgroundRequest(request.payload)
        .then((data) => {
          response.data = data;
          sendResponse(response);
        })
        .catch((error) => {
          response.error = error;
          sendResponse(response);
        });
      return true;
    } else if (request.type === ChromeMessageType.ProviderRequest) {
      performBackendProviderRequest(request.payload).then((response) => {
        sendResponse(response);
      });
      return true;
    }
  }
);

chrome.tabs.onRemoved.addListener(async (tabId: number, removeInfo) => {
  const { store } = await initStore();
  store.dispatch(closeTab({ tabId }));
});

// Youtube fires multiple history update events in quick succession when opening a video.
// Throttle the updates so that multiple contents scripts will not get added
const debouncedHistoryUpdateListener = debounce(async (details) => {
  const { store } = await initStore();
  const { tabId, url } = details;
  chrome.tabs.sendMessage(
    tabId,
    { type: ChromeMessageType.ContentScriptUpdate },
    (res) => {
      res = res || {};
      const newPageType = res.pageType;
      const newVideoId = res.videoId;
      const newVideoSource = res.videoSource;
      const currentUrlString =
        store.getState().video?.tabData[tabId]?.currentUrl || "";
      try {
        // We don't want to refresh if the url is the same
        const currentUrl = new URL(currentUrlString);
        const newUrl = new URL(url);
        // In case the user used a url that loads the caption directly
        currentUrl.searchParams.delete("nekocap");
        newUrl.searchParams.delete("nekocap");
        if (
          currentUrl.origin === newUrl.origin &&
          currentUrl.pathname === newUrl.pathname &&
          currentUrl.search === newUrl.search
        ) {
          return;
        }
      } catch (e) {
        console.log("Error parsing url", e);
      }

      store.dispatch(
        requestFreshTabData({
          tabId,
          newVideoId,
          newVideoSource,
          newPageType,
          currentUrl: url,
        })
      );
    }
  );
}, 1000);

chrome.webNavigation.onHistoryStateUpdated.addListener(
  debouncedHistoryUpdateListener
);

storeInitPromise.then(({ store }) => {
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
});
