const { i18n } = require("./next-i18next.config");
const withAntdLess = require("next-plugin-antd-less");
const { withSentryConfig } = require("@sentry/nextjs");

const moduleExports = {
  i18n,
  cssLoaderOptions: {
    modules: true,
  },
  modifyVars: { "@primary-color": "#ffa62b" },
};

const sentryWebpackPluginOptions = {};

module.exports = withSentryConfig(
  withAntdLess(moduleExports),
  sentryWebpackPluginOptions
);
