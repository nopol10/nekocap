import { ParseProvider } from "@/common/providers/parse/parse-provider";

const initializeProviders = () => {
  window.backendProvider = new ParseProvider();
};

initializeProviders();
