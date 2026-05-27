import { createNestJsProvider } from "@/common/providers/nestjs/nestjs-provider";
import { ParseProvider } from "@/common/providers/parse/parse-provider";
import Parse from "parse";

const initializeProviders = () => {
  globalThis.backendProvider = createNestJsProvider(new ParseProvider(Parse));
};

initializeProviders();
