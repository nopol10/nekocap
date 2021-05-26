import { isServer } from "@/common/client-utils";
import { RootState } from "@/common/store/types";

export const isLoggedInSelector = (state: RootState) => {
  if (isServer() || !window.backendProvider) {
    return false;
  }
  return window.backendProvider.getSelectors().isLoggedInSelector(state);
};

export const userDataSelector = (state: RootState) => {
  if (isServer() || !window.backendProvider) {
    return undefined;
  }
  return window.backendProvider.getSelectors().userSelector(state);
};
