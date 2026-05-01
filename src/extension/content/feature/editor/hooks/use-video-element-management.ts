import { useCallback, useEffect, useRef, MutableRefObject } from "react";
import { useMount, useResize, useStateRef } from "@/hooks";
import { Coords } from "@/common/types";
import { VideoPlayer } from "../video-player/video-player";

/**
 * Manages moving the video element into/out of the editor container,
 * and tracks the video element's dimensions via a resize observer.
 */
export function useVideoElementManagement(
  showEditor: boolean,
  videoPlayer: VideoPlayer | undefined,
  captionContainerElement: HTMLElement | null,
  hasChildren: boolean,
) {
  const [editorVideoContainer, editorVideoContainerRef] =
    useStateRef<HTMLDivElement>();
  const originalCaptionContainerParent = useRef<HTMLElement | null>();
  const videoDimensions = useRef<Coords>({ x: 0, y: 0 });

  /**
   * Effect for moving the video element to the editor and back
   */
  useEffect(() => {
    if (!videoPlayer || !editorVideoContainer || !captionContainerElement) {
      return;
    }
    if (hasChildren) {
      return;
    }

    if (showEditor) {
      // Move the video in
      if (editorVideoContainer.contains(captionContainerElement)) {
        return;
      }
      originalCaptionContainerParent.current =
        captionContainerElement.parentElement;
      editorVideoContainer.appendChild(captionContainerElement);
      // TODO: Fix host website overriding this property
      document.body.style.overflow = "hidden";
    } else {
      if (!editorVideoContainer.contains(captionContainerElement)) {
        return;
      }
      if (originalCaptionContainerParent.current) {
        originalCaptionContainerParent.current.appendChild(
          captionContainerElement,
        );
      }
      document.body.style.overflow = "unset";
    }
  }, [
    showEditor,
    captionContainerElement,
    editorVideoContainer,
    videoPlayer,
    hasChildren,
  ]);

  useMount(() => {
    return () => {
      document.body.style.overflow = "unset";
    };
  });

  const updateVideoDimensions = useCallback((width: number, height: number) => {
    videoDimensions.current = {
      x: width,
      y: height,
    };
  }, []);

  useResize(videoPlayer?.element(), updateVideoDimensions, 0, [
    videoPlayer?.element(),
  ]);

  return {
    editorVideoContainer,
    editorVideoContainerRef,
    videoDimensions,
  };
}
