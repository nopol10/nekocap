import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { initStore } from "@/common/store/store";
import { ParseProvider } from "@/common/providers/parse/parse-provider";
import "../ant.less";
import { Main } from "./feature/home/main";
import { initFirebase } from "@/extension/background/firebase";
import "@/web/styles/index.scss";
import { rootWebSaga } from "./store/saga";
import * as Parse from "parse";

window.skipAutoLogin = false;

// Firebase for auth
initFirebase();

document.addEventListener("DOMContentLoaded", async function () {
  const initializeProviders = () => {
    window.backendProvider = new ParseProvider(Parse);
  };

  initializeProviders();
  const { store } = await initStore(
    rootWebSaga,
    window.backendProvider.getReducers(),
    window.backendProvider.getMiddlewares(),
    false
  );

  const Wrapper = window.backendProvider.wrapper;
  ReactDOM.render(
    <Provider store={store}>
      <Wrapper providerProps={window.backendProvider.getWrapperProps(store)}>
        <Main />
      </Wrapper>
    </Provider>,
    document.getElementById("root")
  );
});
