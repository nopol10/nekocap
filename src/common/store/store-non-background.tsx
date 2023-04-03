import { initStore } from "@/common/store/store";
import { rootSaga } from "@/extension/background/common/saga";

export const storeInitPromise = initStore(
  rootSaga,
  globalThis.backendProvider.getReducers(),
  globalThis.backendProvider.getMiddlewares(),
  false
);
