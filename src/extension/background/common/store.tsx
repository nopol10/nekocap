import { initStore } from "@/common/store/store";
import { rootSaga } from "@/extension/background/common/saga";

export const storeInitPromise = initStore(
  rootSaga,
  window.backendProvider.getReducers(),
  window.backendProvider.getMiddlewares(),
  false
);
