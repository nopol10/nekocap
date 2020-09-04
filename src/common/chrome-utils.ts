import { isInExtension } from "./client-utils";

export const requestBackgroundPageVariable = async (variableName: string) => {
  if (!chrome) {
    return undefined;
  }
  return new Promise<void>((resolve) => {
    chrome.runtime.getBackgroundPage((page) => {
      window[variableName] = page[variableName];
      resolve();
    });
  });
};

/**
 * Safe way to get an image's link in both the website and the extension
 * @param imageName
 */
export const getImageLink = (imageName: string) => {
  if (isInExtension()) {
    return chrome.extension.getURL(`${imageName}`);
  }
  return `${imageName}`;
};

export namespace chromeProm {
  export const storage = {
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
  };
}
