import Typography from "antd/lib/typography";
import * as dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import React from "react";
import {
  CaptionListFields,
  VideoFields,
  VideoSource,
} from "@/common/feature/video/types";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { languages } from "@/common/languages";
import CaretRightOutlined from "@ant-design/icons/CaretRightOutlined";
import EyeOutlined from "@ant-design/icons/EyeOutlined";
import PlayCircleOutlined from "@ant-design/icons/PlayCircleOutlined";
import { Space, Tooltip } from "antd";
import { getVideoSourceIcon } from "@/common/processor-utils";
import { Link as RouterLink } from "react-router-dom";
import { hasTag } from "@/common/caption-utils";
import { captionTags } from "@/common/constants";
import { AudioDescribedTag } from "@/common/components/ws-tag";
import { routeNames } from "../../route-types";
import { Processor } from "@/extension/content/processors/processor";
const { Link } = Typography;
dayjs.extend(relativeTime);

export const getTooltippedDate = (unixSeconds: number) => {
  const dayjsDate = dayjs.unix(unixSeconds);
  const date = dayjsDate.format("YYYY-MM-DD HH:mm:ss");
  const display = dayjsDate.fromNow();
  return <Tooltip title={date}>{display}</Tooltip>;
};

export const captionColumns = {
  videoName: {
    title: "Video Name",
    dataIndex: "videoName",
    key: "videoName",
    render: function render(text, record: CaptionListFields) {
      const processor: Processor =
        videoSourceToProcessorMap[record.videoSource];
      if (!processor) {
        return text;
      }
      const link = processor.generateVideoLink(record.videoId);
      return (
        <>
          {record.translatedTitle && <div>{record.translatedTitle}</div>}
          {record.videoName}
          {hasTag(record.tags, captionTags.audioDescribed) && (
            <AudioDescribedTag />
          )}
          <div>
            <Space>
              {processor.canWatchInNekoCapSite && (
                <Tooltip title="Watch here">
                  <Link
                    href={`${routeNames.caption.view.replace(
                      ":id",
                      record.id
                    )}`}
                    target="_blank"
                  >
                    <EyeOutlined />
                  </Link>
                </Tooltip>
              )}
              <Tooltip title={`Watch on ${processor.name}`}>
                <Link href={link} target="_blank" rel="noreferrer">
                  <PlayCircleOutlined />
                </Link>
              </Tooltip>
            </Space>
          </div>
        </>
      );
    },
  },
  thumbnail: {
    title: "",
    key: "thumbnail",
    render: function render(text, record: CaptionListFields) {
      const processor = videoSourceToProcessorMap[record.videoSource];
      if (!processor) {
        return text;
      }
      return <img style={{ maxWidth: "64px" }} src={record.thumbnailUrl} />;
    },
  },
  videoSource: {
    title: "Source",
    dataIndex: "videoSource",
    key: "videoSource",
    align: "center",
    render: (text, record: CaptionListFields): string => {
      const processor: Processor =
        videoSourceToProcessorMap[record.videoSource];
      return processor.name;
    },
  },
  createdDate: {
    title: "Uploaded",
    dataIndex: "createdDate",
    key: "createdDate",
    render: (text) => {
      return getTooltippedDate(text);
    },
  },
  videoLanguage: {
    title: "Video Language",
    dataIndex: "videoLanguage",
    key: "videoLanguage",
    render: (text, record, index) => {
      return languages[record.videoLanguage];
    },
  },
  captionLanguage: {
    title: "Caption Language",
    dataIndex: "language",
    key: "language",
    render: (text, record, index) => {
      return languages[record.language];
    },
  },
  fromToLanguage: {
    title: "Language",
    key: "language",
    render: function render(text, record, index) {
      const fromLanguage = languages[record.videoLanguage];
      const toLanguage = languages[record.language];
      return (
        <span>
          {fromLanguage} <CaretRightOutlined /> <b>{toLanguage}</b>
        </span>
      );
    },
  },
  updatedDate: {
    title: "Updated",
    dataIndex: "updatedDate",
    key: "updatedDate",
    render: (text, record, index) => {
      return getTooltippedDate(text);
    },
  },
  captioner: {
    title: "Captioner",
    dataIndex: "creatorName",
    key: "creatorName",
    render: function render(text, record, index) {
      return (
        <Link
          href={`${routeNames.profile.main.replace(":id", record.creatorId)}`}
        >
          {text}
        </Link>
      );
    },
  },
};

export const videoColumns = {
  videoName: {
    title: "Video Name",
    dataIndex: "name",
    key: "name",
    render: function render(text, record: VideoFields, index) {
      const processor = videoSourceToProcessorMap[record.source];
      if (!processor) {
        return text;
      }
      const link = processor.generateVideoLink(record.sourceId);
      return (
        <>
          <Link href={link} target="_blank" rel="noreferrer">
            {text}
          </Link>
        </>
      );
    },
  },
  captionCount: {
    title: "Caption count",
    dataIndex: "captionCount",
    key: "captionCount",
    render: function render(text, record: VideoFields, index) {
      const processor = videoSourceToProcessorMap[record.source];
      if (!processor) {
        return text;
      }
      const link = processor.generateVideoLink(record.sourceId);
      return (
        <>
          <Link href={link} target="_blank" rel="noreferrer">
            {text}
          </Link>
        </>
      );
    },
  },
};
