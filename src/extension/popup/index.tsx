import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Switch, Router } from "react-router-dom";
import LoginRoutes from "./feature/login/containers/routes";
import { ChromeMessage, ChromeMessageType } from "@/common/types";
import { appHistory } from "./common/store";
import "../../ant.less";
import { syncWindowVarsToPopup } from "@/common/chrome-utils";
import "@/extension/popup/common/styles/index.scss";
import "@/extension/background/common/provider";
import { PopupProvider } from "../common/popup-context";
import { storeInitPromise } from "@/extension/background/common/store";
import { initFirebase } from "../background/firebase";
window.isPopupScript = true;

initFirebase();

chrome.runtime.onMessage.addListener((request: ChromeMessage) => {
  if (request.type === ChromeMessageType.Route) {
    appHistory.push(request.payload);
  }
});

chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
  storeInitPromise.then(async ({ store }) => {
    await syncWindowVarsToPopup(tab[0].id);
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
      document.getElementById("popup")
    );
  });
});
