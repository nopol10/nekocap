import { CaptionContainer } from "@/common/feature/video/types";
import type { CaptionRendererHandle } from "@/extension/content/containers/caption-renderer";

export type ViewerProps = {
  embedWidth: number;
  embedHeight: number;
  caption: CaptionContainer;
  defaultRendererRef: React.MutableRefObject<CaptionRendererHandle>;
  currentTimeGetter: React.MutableRefObject<() => number>;
};
