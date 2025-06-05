/* eslint-disable no-var */
import type { FirebaseApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import { Action } from "redux";
import { PutEffect } from "redux-saga/effects";
import VimeoPlayer from "vimeo__player";
import {
  PageType,
  RawCaptionData,
  VideoSource,
} from "./common/feature/video/types";
import { BackendProvider } from "./common/providers/backend-provider";
import { Processor } from "./extension/content/processors/processor";

declare global {
  namespace NodeJS {
    interface Global {
      backendProvider: BackendProvider<any>;
    }
  }

  var tabId: number;
  var pageType: PageType;
  var skipAutoLogin: boolean;
  var isInExtension: boolean;
  var isPopupScript: boolean;
  var selectedProcessor: Processor | undefined;
  var captionContainerElement: HTMLElement | null;
  var backendProvider: BackendProvider<any>;
  var backupHotkeyParentElement: Node | null;
  var backupHotkeyElement: Node | null;
  var rawCaption: RawCaptionData | undefined;
  var editorRawCaption: RawCaptionData | undefined;
  var backgroundRawCaption: { [id: string]: RawCaptionData } | null;
  var backgroundEditorRawCaption: { [id: string]: RawCaptionData } | null;
  var firebaseApp: FirebaseApp;
  var firebaseAuth: Auth;
  var kofiWidgetOverlay: {
    draw: (name: string, options: Record<string, string>) => void;
  };
  var Vimeo: { Player: typeof VimeoPlayer };
  var dailymotion: {
    createPlayer: (videoId: string, options: { video: string }) => any;
  };
  var videoElement: HTMLVideoElement;
  var videoId: string;
  var videoSource: VideoSource;
  var videoName: string;
  var OriginalWorker: Worker;
}

declare module "redux-saga/effects" {
  export function put<A extends Action>(action: A): PutEffect<A>;
  export function put(actions: Action[]): PutEffect;
}
