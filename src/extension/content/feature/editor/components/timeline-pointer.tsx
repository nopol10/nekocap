import * as React from "react";
import {
  DependencyList,
  ReactElement,
  useEffect,
  useRef,
  useState,
} from "react";

import styled from "styled-components";
import { colors } from "@/common/colors";

interface TimelinePointerProps {
  hoverElements: HTMLElement[];
  onMouseUp?: (x: number, y: number) => void;
  onDoubleClick?: (x: number, y: number) => void;
  dependencies?: DependencyList;
}

const Pointer = styled.div`
  position: absolute;
  width: 1px;
  background-color: ${colors.base};
  pointer-events: none;
`;

export const TimelinePointer = ({
  hoverElements,
  onMouseUp,
  onDoubleClick,
  dependencies = [],
}: TimelinePointerProps): ReactElement => {
  const pointerRef = useRef<HTMLDivElement>(null);
  const isActive = useRef<boolean>(false);
  const [, setRerender] = useState<number>(0);

  const handleMouseOver = (event: MouseEvent) => {
    if (pointerRef.current) {
      pointerRef.current.style.left = `${event.clientX}px`;
      pointerRef.current.style.opacity = `1`;
      isActive.current = true;
    }
  };

  const handleMouseLeave = (event: MouseEvent) => {
    if (pointerRef.current) {
      pointerRef.current.style.opacity = `0`;
      isActive.current = false;
    }
  };

  const handleClick = (event: MouseEvent) => {
    if (!isActive || !onMouseUp) {
      return;
    }
    onMouseUp(event.clientX, event.clientY);
  };

  const handleDoubleClick = (event: MouseEvent) => {
    if (!isActive || !onDoubleClick) {
      return;
    }
    onDoubleClick(event.clientX, event.clientY);
    event.preventDefault();
  };

  useEffect(() => {
    hoverElements.forEach((element) => {
      if (!element) {
        return;
      }
      element.addEventListener("mousemove", handleMouseOver);
      element.addEventListener("mouseout", handleMouseLeave);
      element.addEventListener("mouseup", handleClick);
      element.addEventListener("dblclick", handleDoubleClick);
    });

    return () => {
      hoverElements.forEach((element) => {
        if (!element) {
          return;
        }
        element.removeEventListener("mousemove", handleMouseOver);
        element.removeEventListener("mouseout", handleMouseLeave);
        element.removeEventListener("mouseup", handleClick);
        element.removeEventListener("dblclick", handleDoubleClick);
      });
    };
  }, [...hoverElements, onMouseUp, onDoubleClick, ...dependencies]);

  // Effect to force a rerender after dependencies change as doing so at the moment of change will
  // yield the previous height instead of the latest height
  useEffect(() => {
    const timeout = setTimeout(() => setRerender((r) => r + 1));
    return () => {
      clearTimeout(timeout);
    };
  }, [...dependencies]);

  const height = hoverElements.reduce((acc, element) => {
    if (!element) {
      return acc;
    }
    return acc + element.offsetHeight;
  }, 0);

  return <Pointer style={{ height: `${height}px` }} ref={pointerRef} />;
};
