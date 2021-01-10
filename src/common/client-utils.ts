export const isInExtension = () => {
  return !!(
    (window.chrome && window.chrome.runtime && window.chrome.runtime.id) ||
    window.isInExtension
  );
};

export const isFirefoxExtension = () => {
  return location.protocol === "moz-extension:";
};
