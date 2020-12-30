import { PageType, VideoSource } from "./common/feature/video/types";
import { BackendProvider } from "./common/providers/backend-provider";
import { Processor } from "./extension/content/processors/processor";

declare global {
  interface Window {
    tabId: number;
    pageType: PageType;
    videoId: string;
    videoSource: VideoSource;
    videoName: string;
    videoElement: HTMLVideoElement;
    selectedProcessor: Processor;
    captionContainerElement: HTMLElement;
    backendProvider: BackendProvider<any>;
    backupHotkeyParentElement: Node | null;
    backupHotkeyElement: Node | null;
  }
}
