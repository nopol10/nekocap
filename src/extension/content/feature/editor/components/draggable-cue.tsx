import React, {
  CSSProperties,
  HTMLProps,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import styled from "styled-components";
import { colors } from "@/common/colors";
import { clearSelection } from "@/common/utils";
import { CUE_HEIGHT, TRACK_BASE_HEIGHT } from "../constants";

type DragHandleProps = {
  left?: boolean;
};

const DragHandle = styled.span<DragHandleProps>`
  position: absolute;
  top: 0;
  bottom: 0;
  width: 10px;
  background-color: ${colors.cueItemEdge};
  height: 100%;
  opacity: 0;
  transition: opacity 200ms;
  ${({ left }: DragHandleProps) => {
    return left ? "left: 0" : "right: 0";
  }};

  &:hover {
    opacity: 1;
  }
`;

type DraggableCueProps = HTMLProps<HTMLDivElement> & {
  style?: CSSProperties;
  children?: ReactNode;
  className?: string;
  trackId: number;
  trackCount: number;
  videoDurationMs: number;
  timelineWidth: number;
  containerYOffset: number;
  onClick: () => void;
  onCueDragStart: (startX: number, endX: number, trackId: number) => void;
  onCueDrag: (startX: number, endX: number, trackId: number) => void;
  onCueDragEnd: (startMs: number, endMs: number, trackId: number) => void;
  getTrackVerticalScrollOffset: () => number;
};

type DraggableProps = {
  left: number;
  width: number;
  right: number;
};

const DEFAULT_DRAGGABLE_PROPS: DraggableProps = { left: 0, width: 0, right: 0 };

const CLICK_DURATION = 100;

export const DraggableCue = ({
  style,
  children,
  className,
  trackId,
  trackCount,
  timelineWidth,
  videoDurationMs,
  onCueDragStart,
  onCueDrag,
  onCueDragEnd,
  onClick,
  containerYOffset,
  getTrackVerticalScrollOffset,
  ...rest
}: DraggableCueProps) => {
  const isDraggingElement = useRef<boolean>(false);
  const isDraggingLeft = useRef<boolean>(false);
  const isDraggingRight = useRef<boolean>(false);
  const dragStartX = useRef<number>(0);
  const clickStartTime = useRef<number>(0);
  const propertiesBeforeDragging = useRef<DraggableProps>(
    DEFAULT_DRAGGABLE_PROPS
  );
  const containerElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      handleDragLeft(event);
      handleDragRight(event);
      handleDragElement(event);
    };
    const handleMouseUp = (event: MouseEvent) => {
      handleDragLeftStop(event);
      handleDragRightStop(event);
      handleDragElementStop(event);
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [style, containerYOffset]);

  const resetDragVariables = () => {
    isDraggingLeft.current = false;
    isDraggingRight.current = false;
    isDraggingElement.current = false;
    clickStartTime.current = 0;
    dragStartX.current = 0;
    propertiesBeforeDragging.current = DEFAULT_DRAGGABLE_PROPS;
  };

  const handleDragCueStart = (event: React.MouseEvent) => {
    clearSelection();
    isDraggingElement.current = true;
    clickStartTime.current = Date.now();
    dragStartX.current = event.clientX;
    const left = parseFloat(style?.left?.toString() || "0");
    const width = parseFloat(style?.width?.toString() || "0");
    propertiesBeforeDragging.current = {
      left,
      width,
      right: left + width,
    };

    if (onCueDragStart) onCueDragStart(left, left + width, trackId);
  };

  const getHoveredTrackId = (mouseY: number) => {
    const relativeY =
      mouseY - containerYOffset + getTrackVerticalScrollOffset();
    return Math.floor(relativeY / TRACK_BASE_HEIGHT);
  };

  const handleDragElement = (event: MouseEvent) => {
    if (!isDraggingElement.current || !containerElementRef.current) {
      return;
    }
    const dragDistance = event.clientX - dragStartX.current;
    const newLeft = propertiesBeforeDragging.current.left + dragDistance;
    const hoveredTrackId = getHoveredTrackId(event.clientY);
    if (trackCount > 1 && hoveredTrackId >= 0 && hoveredTrackId < trackCount) {
      containerElementRef.current.style.top = `${
        hoveredTrackId * TRACK_BASE_HEIGHT + CUE_HEIGHT / 2
      }px`;
    }
    containerElementRef.current.style.left = `${newLeft}px`;
    const endX = newLeft + propertiesBeforeDragging.current.width;
    if (onCueDrag) onCueDrag(newLeft, endX, hoveredTrackId);
  };

  const handleDragElementStop = (event: MouseEvent) => {
    if (!isDraggingElement.current) {
      return;
    }
    if (Date.now() - clickStartTime.current <= CLICK_DURATION) {
      // The duration is short enough to be a click
      // We don't want both drag and click events to happen within one drag
      if (onClick) onClick();
      resetDragVariables();
      return;
    }
    const dragDistance = event.clientX - dragStartX.current;
    const finalLeft = propertiesBeforeDragging.current.left + dragDistance;
    const finalRight = finalLeft + propertiesBeforeDragging.current.width;
    const hoveredTrackId = getHoveredTrackId(event.clientY);

    if (onCueDragEnd) {
      onCueDragEnd(finalLeft, finalRight, hoveredTrackId);
    }
    resetDragVariables();
  };

  const handleDragLeftStart = (event: React.MouseEvent) => {
    clearSelection();
    isDraggingLeft.current = true;
    dragStartX.current = event.clientX;
    const left = parseFloat(style?.left?.toString() || "0");
    const width = parseFloat(style?.width?.toString() || "0");
    propertiesBeforeDragging.current = {
      left,
      width,
      right: left + width,
    };
    if (onCueDragStart) onCueDragStart(left, left + width, trackId);
    event.stopPropagation();
  };

  const handleDragLeftStop = (event: MouseEvent) => {
    if (!isDraggingLeft.current) {
      return;
    }
    const dragDistance = Math.min(
      event.clientX - dragStartX.current,
      propertiesBeforeDragging.current.width
    );
    const finalLeft = propertiesBeforeDragging.current.left + dragDistance;

    if (onCueDragEnd) {
      onCueDragEnd(finalLeft, propertiesBeforeDragging.current.right, trackId);
    }
    resetDragVariables();
  };

  const handleDragLeft = (event: MouseEvent) => {
    if (!isDraggingLeft.current) {
      return;
    }
    if (!containerElementRef.current) {
      return;
    }
    const dragDistance = Math.min(
      event.clientX - dragStartX.current,
      propertiesBeforeDragging.current.width
    );
    const newLeft = propertiesBeforeDragging.current.left + dragDistance;
    const newWidth = propertiesBeforeDragging.current.width - dragDistance;
    containerElementRef.current.style.left = `${newLeft}px`;
    containerElementRef.current.style.width = `${newWidth}px`;

    const endX = newLeft + newWidth;
    if (onCueDrag) onCueDrag(newLeft, endX, trackId);
  };

  const handleDragRightStart = (event: React.MouseEvent) => {
    clearSelection();
    isDraggingRight.current = true;
    dragStartX.current = event.clientX;
    const left = parseFloat(style?.left?.toString() || "0");
    const width = parseFloat(style?.width?.toString() || "0");
    const right = left + width;
    propertiesBeforeDragging.current = {
      left,
      width,
      right,
    };
    if (onCueDragStart) onCueDragStart(left, right, trackId);
    event.stopPropagation();
  };

  const handleDragRight = (event: MouseEvent) => {
    if (!isDraggingRight.current) {
      return;
    }
    if (!containerElementRef.current) {
      return;
    }
    const dragDistance = Math.max(
      event.clientX - dragStartX.current,
      -propertiesBeforeDragging.current.width
    );
    const newWidth = propertiesBeforeDragging.current.width + dragDistance;
    containerElementRef.current.style.width = `${newWidth}px`;
    const endX = propertiesBeforeDragging.current.left + newWidth;
    if (onCueDrag)
      onCueDrag(propertiesBeforeDragging.current.left, endX, trackId);
  };

  const handleDragRightStop = (event: MouseEvent) => {
    if (!isDraggingRight.current) {
      return;
    }
    const dragDistance = Math.max(
      event.clientX - dragStartX.current,
      -propertiesBeforeDragging.current.width
    );
    const finalRight = propertiesBeforeDragging.current.right + dragDistance;

    if (onCueDragEnd) {
      onCueDragEnd(propertiesBeforeDragging.current.left, finalRight, trackId);
    }
    resetDragVariables();
  };
  return (
    <div
      style={{ ...style }}
      className={className}
      {...rest}
      onMouseDown={handleDragCueStart}
      ref={containerElementRef}
    >
      <DragHandle left={true} onMouseDown={handleDragLeftStart} />
      {children}
      <DragHandle onMouseDown={handleDragRightStart} />
    </div>
  );
};
