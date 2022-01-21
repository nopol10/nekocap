import { PassthroughProvider } from "@/common/providers/passthrough-provider";

const initializeContentProviders = () => {
  window.backendProvider = new PassthroughProvider();
};

initializeContentProviders();
