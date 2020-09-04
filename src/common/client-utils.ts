export const isInExtension = () => {
  return !!(window.chrome && window.chrome.runtime && window.chrome.runtime.id);
};
