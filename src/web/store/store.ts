import { createWrapper } from "next-redux-wrapper";
import { configureStore } from "@reduxjs/toolkit";
import { createRootReducer } from "@/extension/background/common/reducer";
import { reduxBatch } from "@manaflair/redux-batch";
import logger from "redux-logger";
import createSagaMiddleware from "redux-saga";
import { middleware as sagaThunkMiddleware } from "redux-saga-thunk";
import { isClient, isServer } from "@/common/client-utils";
import { rootWebSaga } from "./saga";

const makeStore = () => {
  const sagaMiddleware = isClient() ? createSagaMiddleware() : undefined;
  const store = configureStore({
    reducer: createRootReducer(),
    devTools: {
      trace: true,
    },
    middleware: [
      isClient() ? sagaThunkMiddleware : undefined,
      sagaMiddleware,
      isServer() || process.env.NODE_ENV == "production" ? undefined : logger,
    ].filter(Boolean),
    // @ts-ignore
    enhancers: [reduxBatch],
  });

  if (sagaMiddleware) {
    sagaMiddleware.run(rootWebSaga);
  }
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;

// export an assembled wrapper
export const wrapper = createWrapper<AppStore>(makeStore, { debug: false });
