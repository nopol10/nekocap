import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { setIsLoadingRawCaption } from "../actions";

export function useHandleFontsLoaded() {
  const dispatch = useDispatch();

  return useCallback(
    (progress: number) => {
      if (progress < 1) {
        dispatch(
          setIsLoadingRawCaption({
            loading: true,
            percentage: progress * 100,
            tabId: globalThis.tabId,
          }),
        );
      } else {
        dispatch(
          setIsLoadingRawCaption({ loading: false, tabId: globalThis.tabId }),
        );
      }
    },
    [dispatch],
  );
}
