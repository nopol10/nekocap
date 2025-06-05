import type { IFrameProps } from "@/common/feature/video/types";
import { useFontList } from "@/common/hooks/use-fontlist";
import {
  CanvasIframeToParentMessage,
  CanvasIframeToParentMessageType,
  ParentToCanvasIframeMessage,
  ParentToCanvasIframeMessageType,
} from "@/common/types";
import { useStateRef } from "@/hooks";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { CaptionRendererHandle } from "./caption-renderer";
import { OctopusRenderer } from "./octopus-renderer";

/**
 * This should be used in the web accessible iframe's script to render an advanced caption
 * based on caption id information from the parent page.
 * The canvas in the iframe will be read and converted to an image that is postMessaged
 * back to the parent page for display.
 */
export const CaptionIframeOctopusRenderer = () => {
  const rendererRef = useRef<CaptionRendererHandle>(null);
  const [captionContainerElement, captionContainerElementRef] =
    useStateRef<HTMLDivElement>();
  // Getting it here as the parent page might block fetching the font list
  const { data: fontList, isFetching } = useFontList();
  const { width, height, rawCaption } = useListenParentVideoProps();
  const currentTimeRef = useRef(0);
  useParentVideoUpdates(currentTimeRef, rendererRef);
  const handleFontsLoaded = useCallback((progress: number) => {
    window.parent.postMessage(
      {
        type: CanvasIframeToParentMessageType.FontLoadProgress,
        progress,
      } satisfies CanvasIframeToParentMessage,
      "*",
    );
  }, []);
  const iframeProps = React.useMemo<IFrameProps>(() => {
    return {
      width: width,
      height: height,
      left: 0,
      top: 0,
      getCurrentTime: () => {
        return currentTimeRef.current;
      },
    };
  }, [width, height]);
  if (isFetching || !fontList) {
    return <>Fetching fontlist</>;
  }
  if (!rawCaption) {
    return <>No caption data provided</>;
  }

  return (
    <>
      <div
        ref={captionContainerElementRef}
        style={{ width: `100%`, height: `100%` }}
      ></div>
      <OctopusRenderer
        ref={rendererRef}
        rawCaption={rawCaption}
        captionContainerElement={captionContainerElement}
        useExactCanvasDimensions={true}
        onFontsLoaded={handleFontsLoaded}
        showCaption={true}
        fontList={fontList}
        isIframe={true}
        iframeProps={iframeProps}
      />
    </>
  );
};

/**
 * Hook to listen for messages related to video properties from the parent page.
 */
function useListenParentVideoProps() {
  const [properties, setProperties] = useState(() => {
    return {
      width: 0,
      height: 0,
      rawCaption: "",
    };
  });
  useEffect(() => {
    function handleMessage(event: MessageEvent<ParentToCanvasIframeMessage>) {
      if (event.source !== window.parent) {
        return;
      }
      if (
        event.data.type ===
        ParentToCanvasIframeMessageType.UpdateContentIframeVideoProperties
      ) {
        setProperties({
          width: event.data.width,
          height: event.data.height,
          rawCaption: event.data.rawCaption,
        });
      }
    }
    window.parent.postMessage(
      { type: CanvasIframeToParentMessageType.Ready },
      "*",
    );
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);
  return properties;
}

function useParentVideoUpdates(
  timeRef: React.MutableRefObject<number>,
  captionRendererRef: React.MutableRefObject<CaptionRendererHandle | null>,
) {
  useEffect(() => {
    function handleMessage(event: MessageEvent<ParentToCanvasIframeMessage>) {
      if (event.source !== window.parent) {
        return;
      }
      if (event.data.type === ParentToCanvasIframeMessageType.UpdateVideoTime) {
        timeRef.current = event.data.timeSeconds;
      } else if (
        event.data.type === ParentToCanvasIframeMessageType.PlayVideo
      ) {
        captionRendererRef.current?.onVideoPlay?.();
      } else if (
        event.data.type === ParentToCanvasIframeMessageType.PauseVideo
      ) {
        captionRendererRef.current?.onVideoPause?.();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [captionRendererRef, timeRef]);
}
