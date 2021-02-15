export type ChromeMessage = {
  type: ChromeMessageType;
  payload: any;
};

export enum ChromeMessageType {
  Route,
  GetProviderType,
  GetTabId,
  ContentScriptUpdate,
  SaveFile,
  InfoMessage,
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

export type ResponseStatus = "success" | "error";

export type ServerResponse = {
  status: ResponseStatus;
  error?: string;
};

export type UploadResponse = ServerResponse;

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
};

export type Dimension = {
  width: number;
  height: number;
};
