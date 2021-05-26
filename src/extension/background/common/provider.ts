import { ParseProvider } from "@/common/providers/parse/parse-provider";
import * as Parse from "parse";

const initializeProviders = () => {
  window.backendProvider = new ParseProvider(Parse);
};

initializeProviders();
