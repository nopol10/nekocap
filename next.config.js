const { i18n } = require("./next-i18next.config");
const withAntdLess = require("next-plugin-antd-less");
const { withSentryConfig } = require("@sentry/nextjs");

const moduleExports = {
  i18n,
  output: "standalone",
  cssLoaderOptions: {
    modules: true,
  },
  modifyVars: { "@primary-color": "#ffa62b" },
};

const sentryWebpackPluginOptions = {};

const sentrylessConfig = withAntdLess(moduleExports);

module.exports =
  process.env.NODE_ENV === "production"
    ? withSentryConfig(sentrylessConfig, sentryWebpackPluginOptions)
    : sentrylessConfig;
