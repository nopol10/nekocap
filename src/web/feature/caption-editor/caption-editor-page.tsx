import React, { useEffect, Suspense, useState, useRef } from "react";
import { Typography } from "antd";
import styled from "styled-components";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import YouTubeToHtml5 from "@thelevicole/youtube-to-html5-loader";
import { videoSourceToProcessorMap } from "@/common/feature/video/utils";
import { CaptionRendererType, VideoSource } from "@/common/feature/video/types";
import { EDITOR_PORTAL_ELEMENT_ID } from "@/common/constants";
import { createNewCaption } from "@/common/feature/caption-editor/actions";
import { CaptionRenderer } from "@/extension/content/containers/caption-renderer";
import { isAss } from "@/common/caption-utils";
import {
  isUserCaptionLoadedSelector,
  tabEditorDataSelector,
  tabEditorRawDataSelector,
} from "@/common/feature/caption-editor/selectors";
import { tabVideoDataSelector } from "@/common/feature/video/selectors";
import { OctopusRenderer } from "@/extension/content/containers/octopus-renderer";
const InPageVideoContainer = styled.div`
  display: flex;
  justify-content: center;
`;

const InPageVideo = styled.video`
  max-width: 800px;
`;

const EditorContainerLazy = React.lazy(
  () => import("@/extension/content/containers/editor-container")
);

export const CaptionEditorPage = () => {
  const dispatch = useDispatch();
  const videoData = useSelector(tabVideoDataSelector(window.tabId));
  const editorData = useSelector(tabEditorDataSelector(window.tabId));
  const rawEditorData = useSelector(tabEditorRawDataSelector(window.tabId));
  const isUserCaptionLoaded = useSelector(
    isUserCaptionLoadedSelector(window.tabId)
  );
  const [isLoading, setIsLoading] = useState(true);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const { renderer, showCaption = true } = videoData || {};

  useEffect(() => {
    // TODO get the video details
    setIsLoading(true);
    const player = new YouTubeToHtml5({
      selector: ".editor-video",
      autoload: false,
      withAudio: true,
    });
    player.load();
    window.tabId = 0;
    window.videoElement = videoElementRef.current; //await getVideoElement(window.selectedProcessor);
    window.captionContainerElement = window.videoElement.parentElement;
    window.videoSource = VideoSource.NekoCap;
    window.selectedProcessor = videoSourceToProcessorMap[VideoSource.NekoCap];
    dispatch(
      createNewCaption.request({
        videoId: window.videoId,
        videoSource: window.videoSource,
        tabId: window.tabId,
      })
    ).then(() => {
      setIsLoading(false);
    });
  }, [videoElementRef.current]);

  const renderLoading = () => {
    return <div>Loading...</div>;
  };
  const caption =
    isUserCaptionLoaded && editorData && editorData.caption
      ? editorData.caption
      : videoData?.caption;
  const rawCaption =
    isUserCaptionLoaded && rawEditorData && rawEditorData.rawCaption?.data
      ? rawEditorData.rawCaption.data
      : videoData?.rawCaption?.data;
  const rawType =
    isUserCaptionLoaded && rawEditorData && rawEditorData.rawCaption?.type
      ? rawEditorData.rawCaption.type
      : videoData?.rawCaption?.type;

  const isUsingAdvancedRenderer =
    renderer === CaptionRendererType.AdvancedOctopus && isAss(rawType);

  return (
    <div>
      <InPageVideoContainer className="editor-video-container">
        <InPageVideo
          ref={videoElementRef}
          className="editor-video"
          data-yt2html5="https://www.youtube.com/watch?v=w_RhwmbH9Lw"
        ></InPageVideo>
      </InPageVideoContainer>
      <div id={EDITOR_PORTAL_ELEMENT_ID} />
      {!isLoading && (
        <Suspense fallback={renderLoading()}>
          <EditorContainerLazy />
          {renderer === CaptionRendererType.Default && (
            <CaptionRenderer
              caption={caption}
              videoElement={videoElementRef.current}
              captionContainerElement={window.captionContainerElement}
              showCaption={showCaption}
            />
          )}
          {isUsingAdvancedRenderer && (
            <OctopusRenderer
              rawCaption={rawCaption}
              videoElement={videoElementRef.current}
              captionContainerElement={window.captionContainerElement}
              showCaption={showCaption}
            />
          )}
        </Suspense>
      )}
      {isLoading && renderLoading()}

      {/* <EditorContainer /> */}
    </div>
  );
};
