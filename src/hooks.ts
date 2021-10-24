import debounce from "lodash/debounce";
import {
  DependencyList,
  EffectCallback,
  MutableRefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  MediaQueryAllQueryable,
  MediaQueryMatchers,
  useMediaQuery,
} from "react-responsive";
import { isClient, isServer } from "./common/client-utils";
import { TIME, VIDEO_ELEMENT_CONTAINER_ID } from "./common/constants";
import { Coords, Dimension } from "./common/types";
import { clearSelection } from "./common/utils";
import { getVideoElement } from "./extension/content/processors/processor";

/**
 * Adapted from https://css-tricks.com/using-requestanimationframe-with-react-hooks/
 * @param callback
 */
export const useAnimationFrame = (
  callback: (deltaTime: number) => void,
  dependencies: DependencyList
) => {
  const requestRef = useRef(0);
  const previousTimeRef = useRef(0);

  const frameFunction = (time) => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime);
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(frameFunction);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(frameFunction);
    return () => cancelAnimationFrame(requestRef.current);
  }, dependencies);
};

export const useStateRef = <S>(
  initialState?: S | (() => S)
): [S, (a: S) => void] => {
  const [state, setState] = useState<S>(initialState);

  const refCallback = useCallback((node: S) => {
    if (node) setState(node);
  }, []);
  return [state, refCallback];
};

/**
 * Returns the normal useState variables with a ref that also gets updated with the latest value
 * @param initialState
 */
export const useStateAutoRef = <S>(
  initialState: S
): [S, (a: S) => void, MutableRefObject<S>] => {
  const [state, setState] = useState<S>(initialState);
  const ref = useRef<S>(initialState);

  const setStateExternal = (value: S) => {
    ref.current = value;
    setState(value);
  };

  return [state, setStateExternal, ref];
};

export const useResize = (
  element: HTMLElement,
  callback: (width: number, height: number) => void,
  interval: number,
  dependencies: DependencyList = []
) => {
  useLayoutEffect(() => {
    if (!element) {
      return;
    }
    const debouncedFunction = debounce(callback, interval);
    const updateSize = interval <= 0 ? callback : debouncedFunction;
    const ro = new ResizeObserver((entries) => {
      const size = entries[0].contentRect;
      updateSize(size.width, size.height);
    });
    ro.observe(element);
    return () => {
      debouncedFunction.cancel();
      ro.disconnect();
    };
  }, [element, ...dependencies]);
};

export const useDrag = (
  element: HTMLElement,
  onStart: (x: number, y: number) => { x: number; y: number }, // Callback on start of drag that returns a corrected start coordinates
  onMove: (start: Coords, corrected: Coords, delta: Coords) => void,
  onStop: (start: Coords, corrected: Coords, delta: Coords) => void,
  blockClick = false,
  dependencies: DependencyList = []
) => {
  const isDraggingRef = useRef<boolean>(false);
  const startX = useRef<number>(0);
  const startY = useRef<number>(0);
  const correctedStartX = useRef<number>(0);
  const correctedStartY = useRef<number>(0);
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current) {
        return;
      }
      if (onMove)
        onMove(
          { x: startX.current, y: startY.current },
          { x: correctedStartX.current, y: correctedStartY.current },
          {
            x: event.clientX - startX.current,
            y: event.clientY - startY.current,
          }
        );
      event.stopPropagation();
    };
    const handleMouseUp = (event: MouseEvent) => {
      if (!isDraggingRef.current) {
        return;
      }
      onStop(
        { x: startX.current, y: startY.current },
        { x: correctedStartX.current, y: correctedStartY.current },
        {
          x: event.clientX - startX.current,
          y: event.clientY - startY.current,
        }
      );
      isDraggingRef.current = false;
    };
    const handleMouseDown = (event: MouseEvent) => {
      clearSelection();
      isDraggingRef.current = true;
      const { x, y } = onStart(event.clientX, event.clientY);
      startX.current = event.clientX;
      startY.current = event.clientY;
      correctedStartX.current = x;
      correctedStartY.current = y;
      event.stopPropagation();
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    if (element) {
      element.addEventListener("mousedown", handleMouseDown);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (element) {
        element.removeEventListener("mousedown", handleMouseDown);
      }
    };
  }, [element, onStart, onMove, onStop, ...dependencies]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      event.stopPropagation();
    };
    if (element) {
      element.addEventListener("click", handleClick);
    }

    return () => {
      if (element) {
        element.removeEventListener("click", handleClick);
      }
    };
  }, [element, blockClick, ...dependencies]);
};

export const useVideoPlayPause = (
  videoElement: HTMLVideoElement
): [boolean, (isPlaying: boolean) => void, MutableRefObject<boolean>] => {
  const [isPlaying, setIsPlaying, isPlayingRef] = useStateAutoRef(false);
  useEffect(() => {
    const handleVideoPlay = () => {
      setIsPlaying(true);
    };
    const handleVideoPause = () => {
      setIsPlaying(false);
    };
    if (videoElement) {
      // videoElement.paused might mean the video is still loading but good enough for initialization
      setIsPlaying(!videoElement.paused);
      videoElement.addEventListener("play", handleVideoPlay);
      videoElement.addEventListener("pause", handleVideoPause);
    }
    return () => {
      if (videoElement) {
        videoElement.removeEventListener("play", handleVideoPlay);
        videoElement.removeEventListener("pause", handleVideoPause);
      }
    };
  }, [videoElement]);

  return [isPlaying, setIsPlaying, isPlayingRef];
};

/**
 * Returns a state variable containing the video duration in milliseconds
 * @param videoElement
 */
export const useVideoDurationChange = (
  videoElement: HTMLVideoElement
): [number, MutableRefObject<number>] => {
  const [videoDuration, setVideoDuration, videoDurationRef] = useStateAutoRef(
    0
  );
  useEffect(() => {
    const handleDurationChange = () => {
      setVideoDuration(videoElement.duration * TIME.SECONDS_TO_MS);
    };
    if (videoElement) {
      if (videoElement.duration) {
        // For cases where the video's duration is loaded before this hook runs
        handleDurationChange();
      }
      videoElement.addEventListener("durationchange", handleDurationChange);
      videoElement.addEventListener("loadedmetadata", handleDurationChange);
    }
    return () => {
      if (videoElement) {
        videoElement.removeEventListener(
          "durationchange",
          handleDurationChange
        );
        videoElement.removeEventListener(
          "loadedmetadata",
          handleDurationChange
        );
      }
    };
  }, [videoElement]);

  return [videoDuration, videoDurationRef];
};

export const useVideoVolumeChange = (
  videoElement: HTMLVideoElement
): {
  volume: [number, (volume: number) => void, MutableRefObject<number>];
  mute: [boolean, (mute: boolean) => void, MutableRefObject<boolean>];
} => {
  const [volume, setVolume, volumeRef] = useStateAutoRef(1);
  const [mute, setMute, muteRef] = useStateAutoRef(false);

  const debouncedVolumeChange = useCallback(
    debounce(() => {
      setVolume(videoElement.volume);
      setMute(videoElement.muted);
    }, 200),
    [videoElement]
  );

  useEffect(() => {
    if (videoElement) {
      setVolume(videoElement.volume);
      setMute(videoElement.muted);
      videoElement.addEventListener("volumechange", debouncedVolumeChange);
    }
    return () => {
      if (videoElement) {
        videoElement.removeEventListener("volumechange", debouncedVolumeChange);
      }
    };
  }, [videoElement]);

  return {
    volume: [volume, setVolume, volumeRef],
    mute: [mute, setMute, muteRef],
  };
};

export const useCaptionContainerUpdate = (
  dependencies: DependencyList = []
) => {
  const [_, setDummy] = useState(0);
  useEffect(() => {
    if (
      window.videoElement &&
      window.videoElement.parentElement &&
      window.captionContainerElement !== window.videoElement.parentElement
    ) {
      window.captionContainerElement = window.videoElement.parentElement;
      setDummy(Math.random());
    }
  }, [...dependencies, setDummy]);
};

export const useVideoElementUpdate = (dependencies: DependencyList = []) => {
  const [_, setDummy] = useState(0);
  const mutationObserver = useRef<MutationObserver>();
  useEffect(() => {
    const findVideoElement = () => {
      getVideoElement(window.selectedProcessor).then((element) => {
        window.videoElement = element;
        setDummy(Math.random());
        detectElementRemoval();
      });
    };

    const detectElementRemoval = () => {
      mutationObserver.current = new MutationObserver(function (mutations, me) {
        if (mutations.length <= 0) {
          return;
        }
        mutations.forEach((mutation) =>
          mutation.removedNodes.forEach((removedNode) => {
            if (removedNode.nodeName.toLowerCase() === "video") {
              me.disconnect(); // stop observing
              findVideoElement();
            }
          })
        );
      });

      mutationObserver.current.observe(window.videoElement.parentElement, {
        childList: true,
      });
    };

    if (window.videoElement) {
      // Observe when the element gets removed
      detectElementRemoval();
    } else {
      findVideoElement();
    }
    return () => {
      if (mutationObserver.current) {
        mutationObserver.current.disconnect();
      }
    };
  }, [...dependencies, setDummy]);
};

/**
 * Hook that allows the menu element to work on pages where the element that the menu is
 * added to gets added and removed from the DOM frequently (for e.g. based on the user's interactions).
 * @param dependencies
 * @returns
 */
export const useMenuUIElementUpdate = (
  dependencies: DependencyList = []
): number => {
  const [dummy, setDummy] = useState(0);
  const mutationObserver = useRef<MutationObserver>();
  useEffect(() => {
    if (!window.selectedProcessor.observeChanges) {
      return;
    }

    const detectElementUpdate = () => {
      mutationObserver.current = new MutationObserver(function (mutations, me) {
        if (mutations.length <= 0) {
          return;
        }
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((addedNode) => {
            if (!addedNode["tagName"]) return;
            const element = addedNode as HTMLElement;
            if (
              element.querySelector(
                window.selectedProcessor.observedMenuElementSelector
              )
            ) {
              setDummy(Math.random());
            }
          });
          mutation.removedNodes.forEach((removedNode) => {
            if (!removedNode["tagName"]) return;
            const element = removedNode as HTMLElement;
            if (
              element.querySelector(
                window.selectedProcessor.observedMenuElementSelector
              )
            ) {
              // Our menu element is about to be removed, move the element back to a safe place
              const videoUIElement = element.querySelector(
                `#${VIDEO_ELEMENT_CONTAINER_ID}`
              );
              const videoUIHTMLElement = videoUIElement
                ? (videoUIElement as HTMLElement)
                : null;
              if (videoUIHTMLElement) {
                videoUIHTMLElement.style.display = "none";
                document.body.appendChild(videoUIHTMLElement);
              }
              setDummy(Math.random());
            }
          });
        });
      });

      mutationObserver.current.observe(window.document, {
        childList: true,
        subtree: true,
      });
    };

    detectElementUpdate();

    return () => {
      if (mutationObserver.current) {
        mutationObserver.current.disconnect();
      }
    };
  }, [...dependencies, setDummy]);
  return dummy;
};

export const useMount = (callback: EffectCallback) => {
  useEffect(callback, []);
};

const getScrollPosition = ({
  element,
  useWindow,
}: {
  element?: HTMLElement | null;
  useWindow: boolean;
}): Coords => {
  if (useWindow) {
    return { x: window.scrollX, y: window.scrollY };
  }
  const target = element ? element : document.body;

  if (!target) {
    return { x: 0, y: 0 };
  }
  return { x: target.scrollLeft, y: target.scrollTop };
};

export const useScrollPosition = (
  effectCallback: ({
    prevPos,
    currPos,
  }: {
    prevPos: Coords;
    currPos: Coords;
  }) => void,
  dependencies?: DependencyList,
  element?: HTMLElement | null | undefined,
  useWindow = false,
  wait?: number
): void => {
  if (isServer()) {
    return;
  }
  const position = useRef(getScrollPosition({ useWindow }));

  let throttleTimeout = -1;

  const callback = () => {
    const currPos = getScrollPosition({ element, useWindow });
    effectCallback({ prevPos: position.current, currPos });
    position.current = currPos;
    throttleTimeout = -1;
  };

  useLayoutEffect(() => {
    const handleScroll = () => {
      if (wait) {
        if (throttleTimeout < 0) {
          throttleTimeout = window.setTimeout(callback, wait);
        }
      } else {
        callback();
      }
    };

    const listenerElement = element ? element : window;
    listenerElement.addEventListener("scroll", handleScroll);

    // Do initial check before any scrolling happens.
    handleScroll();
    return () => listenerElement.removeEventListener("scroll", handleScroll);
  }, dependencies);
};

export const useScrolledPastY = (
  element: HTMLElement | null | undefined,
  yBreakpoint: number,
  throttleDuration = 100
) => {
  if (isServer()) {
    return false;
  }
  const [hasScrolledPast, setHasScrolledPast] = useState(false);
  useScrollPosition(
    ({ prevPos, currPos }) => {
      const isShowingNow = currPos.y >= yBreakpoint;
      if (isShowingNow !== hasScrolledPast) {
        setHasScrolledPast(isShowingNow);
      }
    },
    [element, hasScrolledPast],
    element,
    !element,
    throttleDuration
  );
  return hasScrolledPast;
};

export const useSSRMediaQuery = (
  settings: Partial<MediaQueryAllQueryable & { query?: string }>,
  device?: MediaQueryMatchers,
  callback?: (matches: boolean) => void
) => {
  if (isServer()) {
    return false;
  }
  const [isInClient, setIsInClient] = useState(false);

  const isMatch = useMediaQuery(settings, device, callback);

  useLayoutEffect(() => {
    if (isClient()) setIsInClient(true);
  }, []);

  return isInClient ? isMatch : false;
};
