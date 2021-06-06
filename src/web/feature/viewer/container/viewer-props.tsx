import { CaptionContainer } from "@/common/feature/video/types";
import type { CaptionRendererHandle } from "@/extension/content/containers/caption-renderer";
import { VideoPlayer } from "@/extension/content/feature/editor/video-player/video-player";

export type ViewerProps = {
  embedWidth: number;
  embedHeight: number;
  caption?: CaptionContainer;
  defaultRendererRef: React.MutableRefObject<CaptionRendererHandle | null>;
  currentTimeGetter: React.MutableRefObject<(() => number) | undefined>;
  onVideoPlayerReady?: (videoPlayer: VideoPlayer) => void;
  retrieveVideoData: boolean;
  autoplay: boolean;
};
