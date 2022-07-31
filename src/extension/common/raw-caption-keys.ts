export const EDITOR_RAW_CAPTION_STORAGE_PREFIX = "editorRaw_";
export const RAW_CAPTION_STORAGE_PREFIX = "raw_";

export const getEditorRawCaptionStorageKey = (tabId: number): string => {
  return `${EDITOR_RAW_CAPTION_STORAGE_PREFIX}${tabId}`;
};
export const getRawCaptionStorageKey = (tabId: number): string => {
  return `${RAW_CAPTION_STORAGE_PREFIX}${tabId}`;
};
