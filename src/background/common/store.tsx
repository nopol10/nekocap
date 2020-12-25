import { initStore } from "@/common/store/store";
import { rootSaga } from "@/background/common/saga";
import { ParseProvider } from "@/common/providers/parse/parse-provider";

const initializeProviders = () => {
  window.backendProvider = new ParseProvider();
};

initializeProviders();

export const { store, persistor } = initStore(
  rootSaga,
  window.backendProvider.getReducers(),
  window.backendProvider.getMiddlewares()
);
