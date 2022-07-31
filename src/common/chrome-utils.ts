import {
  getEditorRawCaptionStorageKey,
  getRawCaptionStorageKey,
} from "@/extension/common/raw-caption-keys";
import { isInExtension } from "./client-utils";
import { videoSourceToProcessorMap } from "./feature/video/utils";
import { ChromeMessageType } from "./types";

export const requestBackgroundPageVariable = async (
  variableNames: string[]
) => {
  if (!chrome) {
    return undefined;
  }
  return new Promise<void>((resolve) => {
    chrome.runtime.getBackgroundPage((page) => {
      variableNames.forEach((variableName) => {
        window[variableName] = page[variableName];
      });
      resolve();
    });
  });
};

export const requestContentPageVariable = async (
  tabId: number,
  variableNames: string[]
) => {
  if (!chrome) {
    return undefined;
  }
  return new Promise<void>((resolve) => {
    chrome.tabs.sendMessage(
      tabId,
      {
        type: ChromeMessageType.GetContentScriptVariables,
        payload: variableNames,
      },
      (response) => {
        window.tabId = response;
        // Initialize the tab data once we have the id
        if (!response) {
          resolve();
          return;
        }
        response.forEach((value, index) => {
          window[variableNames[index]] = value;
        });
        resolve();
      }
    );
  });
};

/**
 * Syncs various window variables to the popup so that it can retrieve and submit captions correctly
 * @param tabId Tab id of the page the popup is opened on
 */
export const syncWindowVarsToPopup = async (tabId: number) => {
  if (!chrome) {
    return undefined;
  }
  await requestContentPageVariable(tabId, [
    "videoId",
    "videoSource",
    "videoName",
    "pageType",
    "tabId",
  ]);
  window.selectedProcessor = videoSourceToProcessorMap[window.videoSource];
  // Restore loaded raw captions so that they can be submitted
  const rawCaptionKey = getRawCaptionStorageKey(tabId);
  const editorRawCaptionKey = getEditorRawCaptionStorageKey(tabId);
  window.rawCaption = (await chromeProm.storage.local.get([rawCaptionKey]))?.[
    rawCaptionKey
  ];
  window.editorRawCaption = (
    await chromeProm.storage.local.get([editorRawCaptionKey])
  )?.[editorRawCaptionKey];
};

/**
 * Safe way to get an image's link in both the website and the extension
 * @param imageName
 */
export const getImageLink = (imageName: string | { src: string }): string => {
  if (isInExtension()) {
    return chrome.runtime.getURL(`${imageName}`);
  }
  return (imageName as { src: string }).src;
};

export const chromeProm = {
  storage: {
    local: {
      get: async (items: string[]): Promise<any> => {
        if (!chrome) {
          return undefined;
        }
        return new Promise((resolve) => {
          chrome.storage.local.get(items, (result) => {
            resolve(result);
          });
        });
      },
      setByAppending: async (items, incomingObject) => {
        if (!chrome) {
          return undefined;
        }
        const result = await new Promise((resolve) => {
          chrome.storage.local.get(items, (result) => {
            resolve(result);
          });
        });
        const mergedResult = Object.assign(result || {}, incomingObject);
        return new Promise<void>((resolve) =>
          chrome.storage.local.set(mergedResult, () => {
            resolve();
          })
        );
      },
    },
  },
};
