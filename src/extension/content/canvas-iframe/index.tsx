import { ReactQueryProvider } from "@/common/providers/react-query-provider";
import { QueryClient } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { CaptionIframeOctopusRenderer } from "../containers/caption-iframe-octopus-renderer";
import "./index.scss";

document.addEventListener("DOMContentLoaded", () => {
  initialize();
});

async function initialize() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnMount: false,
      },
    },
  });
  const container = document.getElementById("root");
  if (!container) {
    console.error("No root element found for the caption iframe renderer.");
    return;
  }
  const root = createRoot(container);
  root.render(
    <>
      <ReactQueryProvider>
        <CaptionIframeOctopusRenderer />
      </ReactQueryProvider>
    </>,
  );
}
