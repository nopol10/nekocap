const path = require("path");
const LanguageDetector = require("i18next-browser-languagedetector");
module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fa-IR", "ja-JP", "pt-BR", "vi-VN", "zh-TW"],
    reloadOnPrerender: process.env.NODE_ENV == "production" ? null : true,
  },
  localePath: path.resolve("./public/locales"),
  customDetectors: [LanguageDetector],
  serializeConfig: false,
  detection: {
    order: [
      "querystring",
      "cookie",
      "localStorage",
      "sessionStorage",
      "navigator",
      "htmlTag",
      "path",
      "subdomain",
    ],
  },
};
