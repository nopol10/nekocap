export const captionTags = {
  audioDescribed: "audioDescribed",
  hasEmail: "hasEmail", // email addresses detected inside caption data. For use in future if caption content scanning is done to prevent spam
  hasUrl: "hasUrl", // urls detected inside caption data
};

export const Z_INDEX = {
  EDITOR: 5000,
  MODAL: 5500, // overridden in antd-override.css for antd
  DROPDOWN_OPTIONS: 6000, // overridden in antd-override.css for antd
  MESSAGE: 9000, // overridden in antd-override.css for antd
};

export const TIME = {
  MS_TO_SECONDS: 0.001,
  SECONDS_TO_HALF_SECONDS: 2,
  SECONDS_TO_QUARTER_SECONDS: 4,
  SECONDS_TO_EIGHTH_SECONDS: 8,
  SECONDS_TO_MS: 1000,
  HOURS_TO_MINUTES: 60,
  MINUTES_TO_SECONDS: 60,
  SECONDS_TO_MINUTES: 0.0166666666,
  MINUTES_TO_HOURS: 0.0166666666,
};

export const EDITOR_PORTAL_ELEMENT_ID = "nekocap-caption-editor";
export const VIDEO_ELEMENT_CONTAINER_ID = "nekocap-video-page-container";
export const EDITOR_OPEN_ATTRIBUTE = "nekocap-editor-open";

/**
 * webext-redux adds this error prefix when errors are thrown from the background.
 * We can use this constant to remove it from an actual error message that we intentionally throw from the background
 */
export const WEBEXT_ERROR_MESSAGE =
  "Looks like there is an error in the background page. You might want to inspect your background page for more details.";

export const DISCORD_INVITE_URL = "https://discord.gg/xZ9YEXY5pd";

export const CHROME_DOWNLOAD_URL =
  "https://chrome.google.com/webstore/detail/nekocap/gmopgnhbhiniibbiilmbjilcmgaocokj";

export const GITHUB_URL = "https://github.com/nopol10/nekocap";
