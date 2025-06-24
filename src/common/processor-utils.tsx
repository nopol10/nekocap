import { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";
import YoutubeFilled from "@ant-design/icons/YoutubeFilled";
import { Typography } from "antd";
import React, { ReactNode } from "react";
import { css } from "styled-components";
import { Processor } from "../extension/content/processors/processor";
import { isClient } from "./client-utils";
import { VideoSource } from "./feature/video/types";
import { videoSourceToProcessorMap } from "./feature/video/utils";
import { isElementOfType } from "./utils";

export const getVideoSourceIcon = (
  videoSource: VideoSource,
  props?: AntdIconProps & React.RefAttributes<HTMLSpanElement>,
): ReactNode => {
  switch (videoSource) {
    case VideoSource.Youtube:
    default:
      return <YoutubeFilled {...props} />;
  }
};

export const getClickableVideoLink = (
  videoName: string,
  sourceId: string,
  processor: Processor,
) => {
  if (!processor) {
    return videoName;
  }
  const link = processor.generateVideoLink(sourceId);
  return (
    <Typography.Link href={link} target="_blank" rel="noreferrer">
      {videoName}
    </Typography.Link>
  );
};

export const getDirectCaptionLoadLink = (
  processor: Processor,
  videoId: string,
  captionId: string,
): string => {
  const linkString = processor.generateVideoLink(videoId);
  try {
    const link = new URL(linkString);
    link.searchParams.append("nekocap", captionId);
    return link.toString();
  } catch (e) {
    return linkString;
  }
};

export const darkModeSelector = (
  styles: ReturnType<typeof css> | string,
): ReturnType<typeof css> | string => {
  if (isClient() && !globalThis.isInExtension) {
    return css`
      @media (prefers-color-scheme: dark) {
        ${styles}
      }
    `;
  }
  const selector = Object.values(videoSourceToProcessorMap)
    .map((processor) => processor.darkModeSelector)
    .filter(Boolean);

  if (!selector || selector.length === 0) {
    return css`
      @media (prefers-color-scheme: dark) {
        ${styles}
      }
    `;
  }
  return css`
    ${selector
      .map(
        (s) => `${s}&, ${s} & {
      ${styles}
    }`,
      )
      .join("\n")}
  `;
};

export const getVideoElementTime = (
  element: HTMLVideoElement | HTMLIFrameElement,
  processor: VideoSource = VideoSource.NekoCapYoutube,
): number => {
  if (isElementOfType<HTMLVideoElement>(element)) {
    return element.currentTime;
  } else if (isElementOfType<HTMLIFrameElement>(element)) {
    // TODO: Get based on selected processor
    return 0;
  }
  return 0;
};
