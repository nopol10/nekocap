const { i18n } = require("./next-i18next.config");
const withAntdLess = require("next-plugin-antd-less");

module.exports = withAntdLess({
  i18n,
  cssLoaderOptions: {
    modules: true,
  },
  modifyVars: { "@primary-color": "#ffa62b" },
});
