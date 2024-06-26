import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Switch, Router } from "react-router-dom";
import LoginRoutes from "./feature/login/containers/routes";
import { ChromeMessage, ChromeMessageType } from "@/common/types";
import { appHistory } from "./common/store";
import "../../ant.less";
import "@/antd-override.css";
import { syncWindowVarsToPopup } from "@/common/chrome-utils";
import "@/extension/popup/common/styles/index.scss";
import "@/extension/content/provider";
import { PopupProvider } from "../common/popup-context";
import { getAuth } from "firebase/auth/web-extension";
import { initFirebase } from "../background/firebase";
import { storeInitPromise } from "@/common/store/store-non-background";
globalThis.isPopupScript = true;

initFirebase(getAuth);

chrome.runtime.onMessage.addListener((request: ChromeMessage) => {
  if (request.type === ChromeMessageType.Route) {
    appHistory.push(request.payload);
  }
});

chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
  storeInitPromise.then(async ({ store }) => {
    const tabId = tab[0].id;
    if (!tabId) {
      throw new Error("No tab id found!");
    }
    await syncWindowVarsToPopup(tabId);
    ReactDOM.render(
      <Provider store={store}>
        <Router history={appHistory}>
          <PopupProvider>
            <Switch>
              <LoginRoutes />
            </Switch>
          </PopupProvider>
        </Router>
      </Provider>,
      document.getElementById("popup"),
    );
  });
});
