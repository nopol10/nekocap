import { Middleware, ReducersMapObject } from "@reduxjs/toolkit";
import { createRootReducer } from "../../extension/background/common/reducer";
import { runSaga } from "redux-saga";
import { applyMiddleware, compose, createStore } from "redux";
import { middleware as sagaThunkMiddleware } from "redux-saga-thunk";
import { reduxBatch } from "@manaflair/redux-batch";
import logger from "redux-logger";
import { persistStore } from "redux-persist";
import storeCreatorFactory from "reduxed-chrome-storage";
import { stdChannel } from "redux-saga";
import { ExtendedStore } from "reduxed-chrome-storage/dist/types/store";
import { nekocapApi } from "./api";

function setupSaga() {
  const channel = stdChannel();
  const sagaMiddleware = () => (next) => (action) => {
    const result = next(action);
    channel.put(action);
    return result;
  };

  return { channel, sagaMiddleware };
}

export const initStore = async (
  rootSaga,
  reducers?: ReducersMapObject,
  middleware?: Middleware[],
  usePersist = true
): Promise<{
  store: ExtendedStore;
  persistor?: import("redux-persist").Persistor;
}> => {
  // Setup saga in a way that works with reduxed-chrome-storage https://github.com/hindmost/reduxed-chrome-storage/issues/6#issuecomment-914874307
  const { channel, sagaMiddleware } = setupSaga();
  const asyncStoreCreator = storeCreatorFactory({ createStore });
  const middlewares = [
    process.env.PRODUCTION ? undefined : logger,
    sagaThunkMiddleware,
    sagaMiddleware,
    nekocapApi.middleware,
    ...(middleware || []),
  ].filter(Boolean);
  const enhancers = [reduxBatch];
  const store = await asyncStoreCreator(
    createRootReducer({
      ...reducers,
    }),
    compose(applyMiddleware(...middlewares), ...enhancers)
  );
  runSaga(
    {
      channel,
      dispatch: store.dispatch,
      getState: () => store.getState(),
    },
    rootSaga
  );
  return { store, persistor: usePersist ? persistStore(store) : undefined };
};
