import { Action } from "redux";
import { PutEffect } from "redux-saga/effects";
import {
  PageType,
  RawCaptionData,
  VideoSource,
} from "./common/feature/video/types";
import { BackendProvider } from "./common/providers/backend-provider";
import { Processor } from "./extension/content/processors/processor";

declare global {
  interface Window {
    tabId: number;
    pageType: PageType;
    skipAutoLogin: boolean;
    isInExtension: boolean;
    videoId: string;
    videoSource: VideoSource;
    videoName: string;
    videoElement: HTMLVideoElement;
    selectedProcessor: Processor;
    captionContainerElement: HTMLElement;
    backendProvider: BackendProvider<any>;
    backupHotkeyParentElement: Node | null;
    backupHotkeyElement: Node | null;
    rawCaption: RawCaptionData | null;
    editorRawCaption: RawCaptionData | null;
    backgroundRawCaption: { [id: string]: RawCaptionData } | null;
    backgroundEditorRawCaption: { [id: string]: RawCaptionData } | null;
  }

  namespace NodeJS {
    interface Global {
      backendProvider: BackendProvider<any>;
    }
  }
}

declare module "redux-saga/effects" {
  export function put<A extends Action>(action: A): PutEffect<A>;
  export function put(actions: Action[]): PutEffect;
}
