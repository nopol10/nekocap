export const isInExtension = () => {
  if (isServer()) {
    return false;
  }
  return !!(
    (window.chrome && window.chrome.runtime && window.chrome.runtime.id) ||
    window.isInExtension ||
    (globalThis.chrome &&
      globalThis.chrome.runtime &&
      globalThis.chrome.runtime.id) ||
    globalThis.isInExtension
  );
};

export const isFirefoxExtension = () => {
  return location.protocol === "moz-extension:";
};

export const isClient = () => {
  return typeof window !== "undefined";
};

export const isServer = () => {
  return typeof window === "undefined";
};
