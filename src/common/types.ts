export type ChromeMessage = {
  type: ChromeMessageType;
  payload: any;
};

export type BackgroundRequest = {
  url: string;
  method: string;
  responseType: XMLHttpRequestResponseType;
};

export enum ChromeMessageType {
  Route,
  GetProviderType,
  GetTabId,
  ContentScriptUpdate,
  SaveFile,
  RawCaption,
  InfoMessage,
  GetContentScriptVariables,
  Request, // Make a XMLHttpRequest from the background script
  ProviderRequest, // Run a request through the backend provider from the background script
  VideoIframeToBackground, // Message sent from a video page's inner iframe containing the video element to the parent page
  VideoIframeToContent, // Message sent from a video page's inner iframe containing the video element to the parent page
}

export enum ChromeExternalMessageType {
  GoogleAuthCredentials,
}

export type NotificationMessage = {
  message: string;
  duration?: number;
};

export type TabbedType = {
  tabId: number;
};

export enum ProviderType {
  Parse,
  Firebase,
}

export type ResponseStatus = "success" | "error" | "deferred";

export type ServerResponse = {
  status: ResponseStatus;
  error?: string;
};

// Provider to backend layer
export type UploadResponse = ServerResponse & {
  captionId?: string;
};

// View layer
export type UploadResult = {
  status: ResponseStatus;
  error?: string;
  captionId?: string;
};

export type OffsetRequest = {
  limit?: number;
  offset?: number;
};

export type PagedType = {
  pageNumber: number;
  pageSize: number;
};

export type UndoComponentProps = {
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
};

/**
 * x & y are from 0 to 1, representing a percentage
 */
export type Coords = {
  x: number;
  y: number;
};

export type CSSPosition = {
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
};

export const CaptionFileFormat = {
  srt: "srt",
  ass: "ass",
  ssa: "ssa",
  vtt: "vtt",
  sbv: "sbv",
  txt: "txt",
};

export type Dimension = {
  width: number;
  height: number;
};
