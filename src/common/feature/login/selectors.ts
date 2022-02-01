import { isServer } from "@/common/client-utils";
import { RootState } from "@/common/store/types";

export const isLoggedInSelector = (state: RootState) => {
  if (isServer() || !globalThis.backendProvider) {
    return false;
  }
  return globalThis.backendProvider.getSelectors().isLoggedInSelector(state);
};

export const userDataSelector = (state: RootState) => {
  if (isServer() || !globalThis.backendProvider) {
    return undefined;
  }
  return globalThis.backendProvider.getSelectors().userSelector(state);
};
