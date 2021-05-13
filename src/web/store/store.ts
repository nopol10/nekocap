import { createWrapper, HYDRATE } from "next-redux-wrapper";
import { configureStore, createAction } from "@reduxjs/toolkit";
import { AppState } from "./type";
import { createRootReducer } from "@/extension/background/common/reducer";
import { reduxBatch } from "@manaflair/redux-batch";

const makeStore = () =>
  configureStore({
    reducer: createRootReducer(),
    devTools: {
      trace: true,
    },
    enhancers: [reduxBatch],
  });

export type AppStore = ReturnType<typeof makeStore>;

// export an assembled wrapper
export const wrapper = createWrapper<AppStore>(makeStore, { debug: true });
