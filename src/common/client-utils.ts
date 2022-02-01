export const isInExtension = () => {
  if (isServer()) {
    return false;
  }
  return !!(
    isInServiceWorker() ||
    globalThis.isInExtension ||
    (globalThis.chrome &&
      globalThis.chrome.runtime &&
      globalThis.chrome.runtime.id) ||
    globalThis.isInExtension
  );
};

export const isInBackgroundScript = () => {
  if (
    !globalThis.chrome ||
    !globalThis.chrome.extension ||
    !globalThis.chrome.extension.getBackgroundPage
  ) {
    return false;
  }
  return (
    globalThis.isPopupScript ||
    globalThis.chrome.extension.getBackgroundPage() === window
  );
};

export const isFirefoxExtension = () => {
  return location.protocol === "moz-extension:";
};

export const isFirefoxContentScript = () => {
  if (isFirefoxExtension()) {
    return false;
  }
  if (isInBackgroundScript()) {
    return false;
  }
  return navigator && navigator.userAgent.toLowerCase().indexOf("firefox") > -1;
};

export const isClient = () => {
  return typeof window !== "undefined";
};

export const isServer = () => {
  if (isInServiceWorker()) {
    return false;
  }
  return typeof window === "undefined";
};

export const isInServiceWorker = () => {
  return globalThis.constructor?.name.indexOf("ServiceWorker") >= 0;
};

export const getNekoCapWebsiteUrl = () => {
  return process.env.NEXT_PUBLIC_WEBSITE_URL;
};
