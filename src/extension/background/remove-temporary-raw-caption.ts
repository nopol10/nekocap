import {
  getRawCaptionStorageKey,
  getEditorRawCaptionStorageKey,
  EDITOR_RAW_CAPTION_STORAGE_PREFIX,
  RAW_CAPTION_STORAGE_PREFIX,
} from "../common/raw-caption-keys";

export const removeTemporaryRawCaptions = (tabId: number) => {
  if (chrome && chrome.storage) {
    chrome.storage.local.remove([getRawCaptionStorageKey(tabId)]);
    chrome.storage.local.remove([getEditorRawCaptionStorageKey(tabId)]);
  }
};

export const removeAllTemporaryRawCaptions = () => {
  if (chrome && chrome.storage) {
    chrome.storage.local.get(null, (items) => {
      Object.keys(items).forEach((key) => {
        if (
          key.startsWith(EDITOR_RAW_CAPTION_STORAGE_PREFIX) ||
          key.startsWith(RAW_CAPTION_STORAGE_PREFIX)
        ) {
          chrome.storage.local.remove([key]);
        }
      });
    });
  }
};
