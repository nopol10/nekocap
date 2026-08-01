import { EDITOR_PORTAL_ELEMENT_ID } from "@/common/constants";
import {
  clearHistory,
  createNewCaption,
  setEditorCaptionAfterEdit,
} from "@/common/feature/caption-editor/actions";
import {
  isUserCaptionLoadedSelector,
  tabEditorDataSelector,
  tabEditorRawDataSelector,
} from "@/common/feature/caption-editor/selectors";
import { setVideoDimensions } from "@/common/feature/video/actions";
import { useHandleFontsLoaded } from "@/common/feature/video/hooks/use-handle-fonts-loaded";
import {
  fontListSelector,
  tabVideoDataSelector,
} from "@/common/feature/video/selectors";
import { VideoSource } from "@/common/feature/video/types";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { delay } from "@/common/utils";
import EditorContainer from "@/extension/content/containers/editor-container";
import { VideoPlayer } from "@/extension/content/feature/editor/video-player/video-player";
import { useForceUpdate } from "@/hooks";
import React, { Suspense, useEffect, useState } from "react";
import { batch, useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { parsePreviewHash } from "../viewer/preview-data";
import { Viewer } from "../viewer/viewer";

const InPageVideoContainer = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  height: 100%;

  & > div {
    width: 100%;

    & > div {
      height: 100%;
    }

    & iframe {
      height: 100%;
    }
  }
  .nekocap-cap-container {
    width: 100%;
  }
  .libassjs-canvas-parent {
    height: 0;
  }
`;

const EditorContainerLazy = React.lazy<typeof EditorContainer>(
  () => import("@/extension/content/containers/editor-container"),
);

const TAB_ID = 0;

type CaptionEditorPageProps = {
  videoSource?: VideoSource;
  videoId: string;
};

export const CaptionEditorPage = ({
  videoId,
  videoSource,
}: CaptionEditorPageProps) => {
  const dispatch = useDispatch();
  const videoData = useSelector(tabVideoDataSelector(TAB_ID));
  const editorData = useSelector(tabEditorDataSelector(TAB_ID));
  const rawEditorData = useSelector(tabEditorRawDataSelector(TAB_ID));
  const isUserCaptionLoaded = useSelector(isUserCaptionLoadedSelector(TAB_ID));

  const [isLoading, setIsLoading] = useState(true);
  const [player, setPlayer] = useState<VideoPlayer>();
  const triggerForceUpdate = useForceUpdate();
  const { renderer, videoDimensions } = videoData || {};
  const fontList = useSelector(fontListSelector());
  const handleFontsLoaded = useHandleFontsLoaded();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    globalThis.tabId = 0;
    globalThis.videoSource = videoSource ?? VideoSource.NekoCapYoutube;
    globalThis.videoId = videoId;
    globalThis.selectedProcessor =
      videoSourceToProcessorMap[VideoSource.NekoCapYoutube];
    // A caption sent over from the preview page rides along in the url hash.
    // Decoding starts here but is only applied after the new caption is created,
    // so the editor never flashes an empty caption before the imported one.
    const importedCaption = parsePreviewHash(globalThis.location.hash).catch(
      () => undefined,
    );
    dispatch(
      createNewCaption.request({
        videoId: globalThis.videoId,
        videoSource: globalThis.videoSource,
        tabId: TAB_ID,
      }),
    ).then(async () => {
      const result = await importedCaption;
      if (cancelled) {
        return;
      }
      if (
        result?.status === "success" &&
        result.caption.videoId === globalThis.videoId &&
        result.caption.videoSource === globalThis.videoSource
      ) {
        batch(() => {
          // Clearing first makes the imported caption the undo baseline
          // instead of letting undo wipe it back to an empty caption
          dispatch(clearHistory(TAB_ID));
          dispatch(
            setEditorCaptionAfterEdit({
              caption: result.caption,
              tabId: TAB_ID,
            }),
          );
        });
      }
      setIsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch, videoId, videoSource]);

  const renderLoading = () => {
    return <div>Loading...</div>;
  };
  const caption =
    isUserCaptionLoaded && editorData && editorData.caption
      ? editorData.caption
      : videoData?.caption;

  const handleSetPlayer = async (newPlayer?: VideoPlayer) => {
    if (!player) {
      setPlayer(newPlayer);
      while (!newPlayer?.element()) {
        await delay(100);
      }
      const videoDimensions = await newPlayer.dimensions();
      dispatch(
        setVideoDimensions({ tabId: TAB_ID, dimensions: videoDimensions }),
      );
      triggerForceUpdate();
    }
  };

  return (
    <div>
      <div id={EDITOR_PORTAL_ELEMENT_ID} />
      {!isLoading && (
        <Suspense fallback={renderLoading()}>
          <EditorContainerLazy playerOverride={player}>
            <InPageVideoContainer className="editor-video-container">
              <Viewer
                caption={caption}
                fontList={fontList}
                rawCaption={rawEditorData}
                renderer={renderer}
                videoDimensions={videoDimensions}
                onSetVideoPlayer={handleSetPlayer}
                videoPlayerPreferences={{ fontSizeMultiplier: 1 }}
                retrieveVideoData={true}
                onFontsLoaded={handleFontsLoaded}
                autoplay={true}
              />
            </InPageVideoContainer>
          </EditorContainerLazy>
        </Suspense>
      )}
      {isLoading && renderLoading()}
    </div>
  );
};
