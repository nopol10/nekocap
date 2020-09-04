import { AntdIconProps } from "@ant-design/icons/lib/components/AntdIcon";
import YoutubeFilled from "@ant-design/icons/YoutubeFilled";
import { Typography } from "antd";
import React, { ReactNode } from "react";
import { Processor } from "../content/processors/processor";
import { VideoSource } from "./feature/video/types";

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
    <Typography.Link href={link} target="_blank">
      {videoName}
    </Typography.Link>
  );
};
