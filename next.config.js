const { i18n } = require("./next-i18next.config");
const withImages = require("next-images");
const withAntdLess = require("next-plugin-antd-less");

module.exports = withAntdLess(
  withImages({
    i18n,
    cssLoaderOptions: {
      modules: true,
    },
    modifyVars: { "@primary-color": "#ffa62b" },
  })
);
