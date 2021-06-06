import { EDITOR_PORTAL_ELEMENT_ID } from "@/common/constants";
import { createNewCaption } from "@/common/feature/caption-editor/actions";
import {
  isUserCaptionLoadedSelector,
  tabEditorDataSelector,
  tabEditorRawDataSelector,
} from "@/common/feature/caption-editor/selectors";
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
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
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

  useEffect(() => {
    // TODO get the video details
    setIsLoading(true);
    globalThis.tabId = 0;
    globalThis.videoSource = videoSource ?? VideoSource.NekoCapYoutube;
    globalThis.videoId = videoId;
    globalThis.selectedProcessor =
      videoSourceToProcessorMap[VideoSource.NekoCapYoutube];
    dispatch(
      createNewCaption.request({
        videoId: globalThis.videoId,
        videoSource: globalThis.videoSource,
        tabId: TAB_ID,
      }),
    ).then(() => {
      setIsLoading(false);
    });
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
