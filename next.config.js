const { i18n } = require("./next-i18next.config");
const withImages = require("next-images");
const withAntdLess = require("next-plugin-antd-less");

module.exports = withAntdLess(
  withImages({
    i18n,
    lessLoaderOptions: {
      javascriptEnabled: true,
    },
    lessVarsFilePath: "./src/theme.less",
  })
);
