import Typography from "antd/lib/typography";
import * as dayjs from "dayjs";
import "dayjs/locale/ja";
import relativeTime from "dayjs/plugin/relativeTime";
import React, { ReactElement, ReactNode } from "react";
import { useRouter } from "next/router";
import { i18n } from "next-i18next";
import {
  CaptionListFields,
  LoadCaptionsResult,
  VideoFields,
  VideoSource,
} from "@/common/feature/video/types";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { languages } from "@/common/languages";
import CaretRightOutlined from "@ant-design/icons/CaretRightOutlined";
import EyeOutlined from "@ant-design/icons/EyeOutlined";
import PlayCircleOutlined from "@ant-design/icons/PlayCircleOutlined";
import { Tooltip } from "antd";
import { getDirectCaptionLoadLink } from "@/common/processor-utils";
import { hasTag } from "@/common/caption-utils";
import { captionTags } from "@/common/constants";
import { AudioDescribedTag, YTExternalCCTag } from "@/common/components/ws-tag";
import { routeNames } from "../../route-types";
import { Processor } from "@/extension/content/processors/processor";
import Link from "next/link";
import { WSSpace } from "@/common/components/ws-space";
const { Link: AntdLink } = Typography;
dayjs.extend(relativeTime);

export const getTooltippedDate = (
  unixSeconds: number,
  locale = "en"
): ReactElement => {
  const dayjsDate = dayjs.unix(unixSeconds);
  const date = dayjsDate.locale(locale).format("YYYY-MM-DD HH:mm:ss");
  const display = dayjsDate.locale(locale).fromNow();
  return <Tooltip title={date}>{display}</Tooltip>;
};

export const captionColumns = {
  videoName: {
    title: (): ReactNode => {
      return i18n?.t("home.captionList.columns.videoName");
    },
    dataIndex: "videoName",
    key: "videoName",
    render: function render(text, record: CaptionListFields): ReactElement {
      if (!record) {
        return <></>;
      }
      const processor: Processor =
        videoSourceToProcessorMap[record.videoSource];
      if (!processor) {
        return (
          <div>
            <span dir="auto">{record.translatedTitle}</span>
            <br />
            <span dir="auto">{text}</span>
          </div>
        );
      }

      const link = getDirectCaptionLoadLink(
        processor,
        record.videoId,
        record.id
      );
      return (
        <>
          {record.translatedTitle && (
            <div dir="auto">{record.translatedTitle}</div>
          )}
          <span dir="auto">{record.videoName}</span>
          {hasTag(record.tags, captionTags.audioDescribed) && (
            <AudioDescribedTag />
          )}
          {hasTag(record.tags, captionTags.ytExCC) && <YTExternalCCTag />}
          <div>
            <WSSpace $size="6px">
              {processor.canWatchInNekoCapSite && (
                <Tooltip title="Watch here">
                  <Link
                    href={`${routeNames.caption.view.replace(
                      ":id",
                      record.id
                    )}`}
                    passHref
                  >
                    <AntdLink target="_blank">
                      <EyeOutlined />
                    </AntdLink>
                  </Link>
                </Tooltip>
              )}
              <Tooltip title={`Watch on ${processor.name}`}>
                <AntdLink href={link} target="_blank" rel="noreferrer">
                  <PlayCircleOutlined />
                </AntdLink>
              </Tooltip>
            </WSSpace>
          </div>
        </>
      );
    },
  },
  thumbnail: {
    title: "",
    key: "thumbnail",
    render: function render(text, record: CaptionListFields) {
      if (!record) {
        return null;
      }
      return <img style={{ maxWidth: "64px" }} src={record.thumbnailUrl} />;
    },
  },
  videoSource: {
    title: (): ReactNode => {
      return i18n?.t("home.captionList.columns.source");
    },
    dataIndex: "videoSource",
    key: "videoSource",
    align: "center",
    render: function render(_, record: CaptionListFields) {
      if (!record) {
        return null;
      }
      const processor: Processor =
        videoSourceToProcessorMap[record.videoSource];
      return <span>{processor?.name || ""}</span>;
    },
  },
  createdDate: {
    title: (): ReactNode => {
      return i18n?.t("home.captionList.columns.uploaded");
    },
    dataIndex: "createdDate",
    key: "createdDate",
    render: (text) => {
      const router = useRouter();
      return getTooltippedDate(text, router.locale);
    },
  },
  videoLanguage: {
    title: (): ReactNode => {
      return i18n?.t("home.captionList.columns.videoLanguage");
    },
    dataIndex: "videoLanguage",
    key: "videoLanguage",
    render: (text, record, index) => {
      if (!record) {
        return null;
      }
      return languages[record.videoLanguage];
    },
  },
  captionLanguage: {
    title: (): ReactNode => {
      return i18n?.t("home.captionList.columns.captionLanguage");
    },
    dataIndex: "language",
    key: "language",
    render: (text, record) => {
      if (!record) {
        return null;
      }
      return languages[record.language];
    },
  },
  fromToLanguage: {
    title: (): ReactNode => {
      return i18n?.t("home.captionList.columns.language");
    },
    key: "language",
    render: function render(text, record): ReactElement {
      if (!record) {
        return <></>;
      }
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
    title: (): ReactNode => {
      return i18n?.t("home.captionList.columns.updated");
    },
    dataIndex: "updatedDate",
    key: "updatedDate",
    render: (value: number): ReactElement => {
      const router = useRouter();
      return getTooltippedDate(value, router.locale);
    },
  },
  captioner: {
    title: (): ReactNode => {
      return i18n?.t("home.captionList.columns.captioner");
    },
    dataIndex: "creatorName",
    key: "creatorName",
    render: function render(text, record) {
      if (!record) {
        return null;
      }
      return (
        <Link
          href={`${routeNames.profile.main.replace(":id", record.creatorId)}`}
          passHref
        >
          <AntdLink>{text}</AntdLink>
        </Link>
      );
    },
  },
  views: {
    title: (): ReactNode => {
      return i18n?.t("home.captionList.columns.views");
    },
    dataIndex: "views",
    key: "views",
    render: function render(text) {
      return <span>{text}</span>;
    },
  },
};

export const videoCaptionColumns = (
  videoId: string,
  videoSource: VideoSource
) => ({
  language: {
    title: (): ReactNode => {
      return i18n?.t("home.captionList.columns.captionLanguage");
    },
    dataIndex: "languageCode",
    key: "languageCode",
    render: function render(text, record: LoadCaptionsResult) {
      const t = i18n?.t;
      const processor: Processor = videoSourceToProcessorMap[videoSource];
      if (!processor || !t) {
        return null;
      }
      const language = languages[record.languageCode];
      const link = getDirectCaptionLoadLink(processor, videoId, record.id);
      return (
        <>
          <div style={{ marginBottom: "8px", fontWeight: 700 }}>
            {language}{" "}
            {hasTag(record.tags, captionTags.audioDescribed) && (
              <AudioDescribedTag />
            )}
            {hasTag(record.tags, captionTags.ytExCC) && <YTExternalCCTag />}
          </div>

          <div>
            {processor.canWatchInNekoCapSite && (
              <div style={{ marginBottom: "8px" }}>
                <Tooltip title={t("home.watchHere")}>
                  <AntdLink
                    href={`${routeNames.caption.view.replace(
                      ":id",
                      record.id
                    )}`}
                    target="_blank"
                  >
                    <EyeOutlined />
                    &nbsp;
                    <span>{t("home.watchHere")}</span>
                  </AntdLink>
                </Tooltip>
              </div>
            )}
            <div>
              <Tooltip
                title={t("home.watchOnService", { service: processor.name })}
              >
                <AntdLink href={link} target="_blank" rel="noreferrer">
                  <PlayCircleOutlined />
                  &nbsp;
                  <span>
                    {t("home.watchOnService", { service: processor.name })}
                  </span>
                </AntdLink>
              </Tooltip>
            </div>
          </div>
        </>
      );
    },
  },
  captioner: {
    title: (): ReactNode => {
      return i18n?.t("home.captionList.columns.captioner");
    },
    key: "captionerName",
    render: function render(text, record: LoadCaptionsResult) {
      return (
        <AntdLink
          target="_blank"
          href={`${routeNames.profile.main.replace(":id", record.captionerId)}`}
        >
          {record.captionerName}
        </AntdLink>
      );
    },
  },
});

export const videoColumns = {
  videoName: {
    title: (): ReactNode => {
      return i18n?.t("home.videoList.columns.videoName");
    },
    dataIndex: "name",
    key: "name",
    render: function render(text, record: VideoFields, index): ReactElement {
      const processor = videoSourceToProcessorMap[record.source];
      if (!processor) {
        return text;
      }
      const link = processor.generateVideoLink(record.sourceId);
      return (
        <>
          <AntdLink href={link} target="_blank" rel="noreferrer">
            {text}
          </AntdLink>
        </>
      );
    },
  },
  captionCount: {
    title: (): ReactNode => {
      return i18n?.t("home.videoList.columns.captionCount");
    },
    dataIndex: "captionCount",
    key: "captionCount",
    render: function render(text, record: VideoFields, index): ReactElement {
      const processor = videoSourceToProcessorMap[record.source];
      if (!processor) {
        return text;
      }
      const link = processor.generateVideoLink(record.sourceId);
      return (
        <>
          <AntdLink href={link} target="_blank" rel="noreferrer">
            {text}
          </AntdLink>
        </>
      );
    },
  },
};
