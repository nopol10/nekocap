const { i18n } = require("./next-i18next.config");
const { withSentryConfig } = require("@sentry/nextjs");
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

/**
 * @type {import('next').NextConfig}
 */
const moduleExports = {
  i18n,
  output: "standalone",
  cssLoaderOptions: {
    modules: true,
  },
  transpilePackages: [
    "@ant-design",
    "antd",
    "rc-util",
    "rc-pagination",
    "rc-picker",
    "rc-input",
    "rc-tree",
    "rc-table",
  ],
  async headers() {
    return [
      {
        source: "/fontlist.json",
        headers: [{ key: "access-control-allow-origin", value: "*" }],
      },
    ];
  },
  webpack(config) {
    // Grab the existing rule that handles SVG imports
    const fileLoaderRule = config.module.rules.find((rule) =>
      rule.test?.test?.(".svg"),
    );

    config.module.rules.push(
      // Reapply the existing rule, but only for svg imports without ?react
      {
        ...fileLoaderRule,
        test: /\.svg$/i,
        resourceQuery: { not: /react/ }, // exclude if *.svg?react
      },
      // Convert *.svg?react imports to React components
      {
        test: /\.svg$/i,
        issuer: /\.[jt]sx?$/,
        resourceQuery: /react/, // *.svg?react
        use: ["@svgr/webpack"],
      },
    );

    // Modify the file loader rule to ignore *.svg, since we have it handled now.
    fileLoaderRule.exclude = /\.svg$/i;

    return config;
  },
};

const sentryWebpackPluginOptions = {};

const sentrylessConfig = moduleExports;

module.exports = withBundleAnalyzer(
  process.env.NODE_ENV === "production"
    ? withSentryConfig(sentrylessConfig, sentryWebpackPluginOptions)
    : sentrylessConfig,
);
