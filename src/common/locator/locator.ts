import { isClient, isInBackgroundScript } from "../client-utils";
import { BackendProvider } from "../providers/backend-provider";
import { ParseProvider } from "../providers/parse/parse-provider";

import * as Parse from "parse";
import { RootState } from "../store/types";
import { PassthroughProvider } from "../providers/passthrough-provider";

export const Locator = {
  provider(): BackendProvider<RootState> {
    if (isClient()) {
      if (!window.backendProvider) {
        if (isInBackgroundScript()) {
          window.backendProvider = new ParseProvider(Parse);
        } else {
          window.backendProvider = new PassthroughProvider();
        }
      }
      return window.backendProvider;
    } else {
      return global.backendProvider;
    }
  },
};
