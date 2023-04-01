import { isClient, isInBackgroundScript, isInExtension } from "../client-utils";
import { BackendProvider } from "../providers/backend-provider";
import { ParseProvider } from "../providers/parse/parse-provider";

import * as Parse from "parse";
import { RootState } from "../store/types";
import { PassthroughProvider } from "../providers/passthrough-provider";

export const Locator = {
  provider(): BackendProvider<RootState> {
    if (isClient()) {
      if (!globalThis.backendProvider) {
        if (isInBackgroundScript() || !isInExtension()) {
          globalThis.backendProvider = new ParseProvider(Parse);
        } else {
          globalThis.backendProvider = new PassthroughProvider();
        }
      }
      return globalThis.backendProvider;
    } else {
      return globalThis.backendProvider;
    }
  },
};
