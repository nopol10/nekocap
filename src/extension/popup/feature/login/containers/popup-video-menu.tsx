import React from "react";
import { VideoPageMenu } from "@/extension/content/containers/video-page-menu";
import { ErrorBoundary } from "react-error-boundary";

export const PopupVideoMenu = () => {
  return (
    <ErrorBoundary
      FallbackComponent={() => (
        <div>
          Open this in a supported site to access the caption menu.
          <br />
          Re-open this menu if you are in a supported site and still see this
          message.
        </div>
      )}
    >
      <VideoPageMenu />
    </ErrorBoundary>
  );
};
