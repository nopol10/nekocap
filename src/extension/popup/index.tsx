import "@/antd-override.css";
import { syncWindowVarsToPopup } from "@/common/chrome-utils";
import { storeInitPromise } from "@/common/store/store-non-background";
import { ChromeMessage, ChromeMessageType } from "@/common/types";
import "@/extension/content/provider";
import "@/extension/popup/common/styles/index.scss";
import { getAuth } from "firebase/auth/web-extension";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { Router, Switch } from "react-router-dom";
import "../../ant.less";
import { initFirebase } from "../background/firebase";
import { PopupProvider } from "../common/popup-context";
import { appHistory } from "./common/store";
import LoginRoutes from "./feature/login/containers/routes";
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
    const container = document.getElementById("popup");
    const root = createRoot(container!);
    root.render(
      <Provider store={store}>
        <Router history={appHistory}>
          <PopupProvider>
            <Switch>
              <LoginRoutes />
            </Switch>
          </PopupProvider>
        </Router>
      </Provider>,
    );
  });
});
