import { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";
import YoutubeFilled from "@ant-design/icons/YoutubeFilled";
import { Typography } from "antd";
import React, { ReactNode } from "react";
import { css } from "styled-components";
import { Processor } from "../content/processors/processor";
import { EDITOR_PORTAL_ELEMENT_ID } from "./constants";
import { VideoSource } from "./feature/video/types";
import { videoSourceToProcessorMap } from "./feature/video/utils";

export const getVideoSourceIcon = (
  videoSource: VideoSource,
  props?: AntdIconProps & React.RefAttributes<HTMLSpanElement>
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
  processor: Processor
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

export const darkModeSelector = (
  styles: ReturnType<typeof css> | string
): ReturnType<typeof css> | string => {
  const selector = Object.values(videoSourceToProcessorMap)
    .map((processor) => processor.darkModeSelector)
    .filter(Boolean)
    .join(",");
  if (!selector) {
    return "";
  }
  return css`
    ${selector} .use-site-dark-mode&, ${selector} .use-site-dark-mode & {
      ${styles}
    }
  `;
};
