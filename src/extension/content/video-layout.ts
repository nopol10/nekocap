export type VideoContentRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

/**
 * Returns the area the video's picture occupies, relative to the padding box of `relativeTo`
 * (i.e. the coordinates an absolutely positioned child of `relativeTo` should use to cover it).
 * Black bars from the video being letterboxed / pillarboxed inside its element are excluded.
 */
export function getVideoContentRect(
  videoElement: HTMLElement,
  relativeTo: Element | null,
): VideoContentRect | undefined {
  const elementRect = videoElement.getBoundingClientRect();
  if (elementRect.width <= 0 || elementRect.height <= 0) {
    return undefined;
  }
  let rect: VideoContentRect = {
    left: elementRect.left,
    top: elementRect.top,
    width: elementRect.width,
    height: elementRect.height,
  };

  // The video element's box can be a different shape from the video itself, e.g. in fullscreen
  // the element fills the screen while a 4:3 or 21:9 video is centered inside it with black bars.
  // Captions are positioned and sized relative to the picture, so the bars have to be excluded,
  // otherwise captions would drift into the bars and be sized for the wrong area.
  // Only "contain" / "scale-down" letterbox the picture; "fill" stretches it to the element's box
  // and "cover" crops it, so in those cases the element's box is used as is.
  if (videoElement instanceof HTMLVideoElement) {
    const { videoWidth, videoHeight } = videoElement;
    const objectFit = getComputedStyle(videoElement).objectFit;
    if (
      videoWidth > 0 &&
      videoHeight > 0 &&
      (objectFit === "contain" || objectFit === "scale-down")
    ) {
      rect = fitRectToAspect(rect, videoWidth / videoHeight);
    }
  }

  if (relativeTo) {
    const parentRect = relativeTo.getBoundingClientRect();
    rect.left +=
      relativeTo.scrollLeft - parentRect.left - relativeTo.clientLeft;
    rect.top += relativeTo.scrollTop - parentRect.top - relativeTo.clientTop;
  }

  return rect;
}

/**
 * Returns the largest rect with the given aspect ratio that fits inside `rect`, centered in it.
 */
export function fitRectToAspect(
  rect: VideoContentRect,
  aspect: number,
): VideoContentRect {
  if (!(aspect > 0)) {
    return rect;
  }
  let { left, top, width, height } = rect;
  if (width / height > aspect) {
    const fittedWidth = height * aspect;
    left += (width - fittedWidth) / 2;
    width = fittedWidth;
  } else {
    const fittedHeight = width / aspect;
    top += (height - fittedHeight) / 2;
    height = fittedHeight;
  }
  return { left, top, width, height };
}

/**
 * Calls `onChange` whenever the video's on-screen layout may have changed,
 * e.g. when entering / exiting fullscreen, resizing the window or switching to theater mode.
 * Returns a function that stops listening.
 */
export function observeVideoLayout(
  videoElement: HTMLElement,
  onChange: () => void,
): () => void {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  // Some players only finish laying out the video slightly after the event fires
  const handleChange = () => {
    onChange();
    clearTimeout(timeout);
    timeout = setTimeout(onChange, 100);
  };
  const resizeObserver = new ResizeObserver(handleChange);
  resizeObserver.observe(videoElement);
  if (videoElement.parentElement) {
    resizeObserver.observe(videoElement.parentElement);
  }
  document.addEventListener("fullscreenchange", handleChange);
  document.addEventListener("webkitfullscreenchange", handleChange);
  window.addEventListener("resize", handleChange);
  // The video's dimensions (needed to exclude black bars) are only known once metadata loads
  videoElement.addEventListener("loadedmetadata", handleChange);
  return () => {
    clearTimeout(timeout);
    resizeObserver.disconnect();
    document.removeEventListener("fullscreenchange", handleChange);
    document.removeEventListener("webkitfullscreenchange", handleChange);
    window.removeEventListener("resize", handleChange);
    videoElement.removeEventListener("loadedmetadata", handleChange);
  };
}
