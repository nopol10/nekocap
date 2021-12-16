import * as React from "react";
import * as ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { Switch, Router } from "react-router-dom";
import LoginRoutes from "./feature/login/containers/routes";
import { Store } from "webext-redux";
import { ChromeMessage, ChromeMessageType } from "@/common/types";
import { appHistory } from "./common/store";
import "../../ant.less";
import {
  requestBackgroundPageVariable,
  syncWindowVarsToPopup,
} from "@/common/chrome-utils";
import "@/extension/popup/common/styles/index.scss";
import { PopupProvider } from "../common/popup-context";

chrome.runtime.onMessage.addListener(
  (request: ChromeMessage, sender, sendResponse) => {
    if (request.type === ChromeMessageType.Route) {
      appHistory.push(request.payload);
    }
  }
);

chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
  const store = new Store();

  store.ready().then(async () => {
    await requestBackgroundPageVariable(["backendProvider"]);
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
