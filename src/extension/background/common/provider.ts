import { ParseProvider } from "@/common/providers/parse/parse-provider";
import * as Parse from "parse";

const initializeProviders = () => {
  globalThis.backendProvider = new ParseProvider(Parse);
};

initializeProviders();
