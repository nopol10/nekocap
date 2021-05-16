import { isClient } from "../client-utils";
import { BackendProvider } from "../providers/backend-provider";
import { ParseProvider } from "../providers/parse/parse-provider";

import * as Parse from "parse";
import { RootState } from "../store/types";

export const Locator = {
  provider(): BackendProvider<RootState> {
    if (isClient()) {
      if (!window.backendProvider) {
        window.backendProvider = new ParseProvider(Parse);
      }
      return window.backendProvider;
    } else {
      return global.backendProvider;
    }
  },
};
