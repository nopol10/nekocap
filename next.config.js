const { i18n } = require("./next-i18next.config");
const withAntdLess = require("next-plugin-antd-less");
const { withSentryConfig } = require("@sentry/nextjs");

/**
 * @type {import('next').NextConfig}
 */
const moduleExports = {
  i18n,
  output: "standalone",
  cssLoaderOptions: {
    modules: true,
  },
  modifyVars: { "@primary-color": "#ffa62b" },
  async headers() {
    return [
      {
        source: "/fontlist.json",
        headers: [{ key: "access-control-allow-origin", value: "*" }],
      },
    ];
  },
};

const sentryWebpackPluginOptions = {};

const sentrylessConfig = withAntdLess(moduleExports);

module.exports =
  process.env.NODE_ENV === "production"
    ? withSentryConfig(sentrylessConfig, sentryWebpackPluginOptions)
    : sentrylessConfig;
