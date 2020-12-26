import {
  configureStore,
  Middleware,
  ReducersMapObject,
} from "@reduxjs/toolkit";
import { createRootReducer } from "../../background/common/reducer";
import createSagaMiddleware from "redux-saga";
import { middleware as sagaThunkMiddleware } from "redux-saga-thunk";
import { reduxBatch } from "@manaflair/redux-batch";
import logger from "redux-logger";
import { persistStore } from "redux-persist";

export const initStore = (
  rootSaga,
  reducers?: ReducersMapObject,
  middleware?: Middleware[]
) => {
  const sagaMiddleware = createSagaMiddleware();
  const store = configureStore({
    reducer: createRootReducer(reducers),
    devTools: {
      trace: true,
    },
    middleware: [
      sagaThunkMiddleware,
      sagaMiddleware,
      process.env.PRODUCTION ? undefined : logger,
      ...middleware,
    ].filter(Boolean),
    enhancers: [reduxBatch],
  });

  sagaMiddleware.run(rootSaga);
  return { store, persistor: persistStore(store) };
};
