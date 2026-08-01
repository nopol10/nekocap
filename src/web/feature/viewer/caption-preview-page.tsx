import { WSButton } from "@/common/components/ws-button";
import { exportCaption } from "@/common/feature/caption-editor/export-caption";
import {
  clearTabData,
  setLoadedCaption,
  setRenderer,
  setVideoDimensions,
} from "@/common/feature/video/actions";
import {
  CaptionContainer,
  CaptionRendererType,
} from "@/common/feature/video/types";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import DownloadOutlined from "@ant-design/icons/DownloadOutlined";
import { Alert, Spin, Typography } from "antd";
import { useTranslation } from "next-i18next";
import { useEffect, useRef, useState } from "react";
import { batch, useDispatch } from "react-redux";
import styled from "styled-components";
import {
  getPreviewSupportedSiteNames,
  parsePreviewHash,
  PreviewCaptionError,
} from "./preview-data";
import { ViewerPage } from "./viewer-page";

const { Title, Paragraph, Text } = Typography;

const TAB_ID = 0;

const MessageWrapper = styled.div`
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  padding: 40px 20px;
`;

const ActionsWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 16px 20px;
`;

const SampleShape = styled.pre`
  overflow-x: auto;
  padding: 12px;
  border-radius: 4px;
  border: 1px solid rgba(128, 128, 128, 0.35);
`;

const SAMPLE_PAYLOAD_SHAPE = `{
  "videoId": "<video id>",
  "videoSource": 0, // 0: YouTube, 2: Vimeo, 14: Dailymotion
  "data": {
    "tracks": [
      {
        "cues": [
          { "start": 1000, "end": 4000, "text": "First caption" },
          { "start": 5000, "end": 9000, "text": "Second caption" }
        ]
      }
    ]
  }
}`;

type PreviewState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; caption: CaptionContainer }
  | { status: "error"; error: PreviewCaptionError };

type CaptionPreviewPageProps = {
  isEmbed: boolean;
};

export const CaptionPreviewPage = ({
  isEmbed,
}: CaptionPreviewPageProps): JSX.Element => {
  const dispatch = useDispatch();
  const { t } = useTranslation("common");
  const [state, setState] = useState<PreviewState>({ status: "idle" });
  const lastHashRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Parsing is asynchronous for compressed payloads, so a slow parse of an
    // old hash must not overwrite the result of a newer one
    let currentHash: string | undefined;
    let disposed = false;
    const readHash = () => {
      const hash = globalThis.location.hash;
      if (hash === lastHashRef.current) {
        return;
      }
      lastHashRef.current = hash;
      currentHash = hash;
      setState({ status: "loading" });
      parsePreviewHash(hash)
        .then((result) => {
          if (disposed || currentHash !== hash) {
            return;
          }
          setState(result === undefined ? { status: "idle" } : result);
        })
        .catch(() => {
          if (disposed || currentHash !== hash) {
            return;
          }
          setState({
            status: "error",
            error: PreviewCaptionError.InvalidCompressedData,
          });
        });
    };
    readHash();
    globalThis.addEventListener("hashchange", readHash);
    return () => {
      disposed = true;
      globalThis.removeEventListener("hashchange", readHash);
    };
  }, []);

  useEffect(() => {
    if (state.status !== "success") {
      return;
    }
    const { caption } = state;
    batch(() => {
      dispatch(setLoadedCaption({ tabId: TAB_ID, caption }));
      dispatch(
        setRenderer({ tabId: TAB_ID, renderer: CaptionRendererType.Default }),
      );
      // Set default dimensions immediately so the player is not zero-sized
      // while the real aspect ratio is being fetched
      dispatch(
        setVideoDimensions({
          tabId: TAB_ID,
          dimensions: { width: 16, height: 9 },
        }),
      );
    });
    let cancelled = false;
    const processor = videoSourceToProcessorMap[caption.videoSource];
    processor.retrieveVideoDimensions(caption.videoId).then((dimensions) => {
      if (!cancelled) {
        dispatch(setVideoDimensions({ tabId: TAB_ID, dimensions }));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch, state]);

  // Prevent a preview caption from lingering at tab 0 when navigating to a
  // regular /view/[id] page in the same client-side session
  useEffect(() => {
    return () => {
      dispatch(clearTabData({ tabId: TAB_ID }));
    };
  }, [dispatch]);

  const supportedSites = getPreviewSupportedSiteNames().join(", ");

  if (state.status === "error") {
    const errorMessage = (() => {
      switch (state.error) {
        case PreviewCaptionError.TooLarge:
          return t("viewer.preview.tooLargeError");
        case PreviewCaptionError.InvalidBase64:
        case PreviewCaptionError.InvalidCompressedData:
        case PreviewCaptionError.InvalidJson:
          return t("viewer.preview.decodeError");
        case PreviewCaptionError.UnsupportedSource:
          return t("viewer.preview.unsupportedSourceError", {
            sites: supportedSites,
          });
        case PreviewCaptionError.InvalidShape:
        default:
          return t("viewer.preview.invalidFormatError");
      }
    })();
    return (
      <MessageWrapper>
        <Alert
          type="error"
          showIcon={true}
          message={t("viewer.preview.title")}
          description={errorMessage}
        />
      </MessageWrapper>
    );
  }

  if (state.status === "loading") {
    return (
      <MessageWrapper>
        <Spin size="large" tip={t("viewer.preview.loading")}>
          <div style={{ minHeight: "80px" }} />
        </Spin>
      </MessageWrapper>
    );
  }

  if (state.status === "idle") {
    return (
      <MessageWrapper>
        <Title>{t("viewer.preview.title")}</Title>
        <Paragraph>{t("viewer.preview.instructions")}</Paragraph>
        <Paragraph>
          <Text code>{"/view/preview#dataz=<deflate-raw base64 JSON>"}</Text>
        </Paragraph>
        <Paragraph type="secondary">
          {t("viewer.preview.uncompressedNote")}
        </Paragraph>
        <Paragraph>
          <Text code>{"/view/preview#data=<base64 caption JSON>"}</Text>
        </Paragraph>
        <SampleShape>{SAMPLE_PAYLOAD_SHAPE}</SampleShape>
        <Paragraph>
          {t("viewer.preview.supportedSites", { sites: supportedSites })}
        </Paragraph>
        <Paragraph type="secondary">
          {t("viewer.preview.urlLengthNote")}
        </Paragraph>
      </MessageWrapper>
    );
  }

  const handleDownloadSrt = () => {
    exportCaption({ caption: state.caption, rawCaption: null });
  };

  return (
    <>
      <ViewerPage
        hasRawCaption={false}
        isEmbed={isEmbed}
        showDetails={false}
      ></ViewerPage>
      {!isEmbed && (
        <ActionsWrapper>
          <WSButton icon={<DownloadOutlined />} onClick={handleDownloadSrt}>
            {t("viewer.preview.downloadSrt")}
          </WSButton>
        </ActionsWrapper>
      )}
    </>
  );
};
