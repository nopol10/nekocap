import { initStore } from "@/common/store/store";
import { rootSaga } from "@/background/common/saga";

export const { store, persistor } = initStore(
  rootSaga,
  window.backendProvider.getReducers(),
  window.backendProvider.getMiddlewares()
);
