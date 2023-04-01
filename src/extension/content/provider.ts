import { PassthroughProvider } from "@/common/providers/passthrough-provider";

const initializeContentProviders = () => {
  globalThis.backendProvider = new PassthroughProvider();
};

initializeContentProviders();
