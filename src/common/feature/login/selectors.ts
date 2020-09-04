import { RootState } from "@/common/store/types";

export const isLoggedInSelector = (state: RootState) => {
  if (!window.backendProvider) {
    return false;
  }
  return window.backendProvider.getSelectors().isLoggedInSelector(state);
};

export const userDataSelector = (state: RootState) => {
  if (!window.backendProvider) {
    return undefined;
  }
  return window.backendProvider.getSelectors().userSelector(state);
};
