import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { Action } from "redux";
import { PutEffect } from "redux-saga/effects";
import {
  PageType,
  RawCaptionData,
  VideoSource,
} from "./common/feature/video/types";
import { BackendProvider } from "./common/providers/backend-provider";
import { Processor } from "./extension/content/processors/processor";
import type * as Vimeo from "vimeo__player";

declare global {
  interface Window {
    tabId: number;
    pageType: PageType;
    skipAutoLogin: boolean;
    isInExtension: boolean;
    isPopupScript: boolean;
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
    firebaseApp: FirebaseApp;
    firebaseAuth: Auth;
    kofiWidgetOverlay: {
      draw: (name: string, options: Record<string, string>) => void;
    };
    Vimeo: typeof Vimeo;
    dailymotion: {
      createPlayer: (videoId: string, options: { video: string }) => any;
    };
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
