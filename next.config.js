const { i18n } = require("./next-i18next.config");
const withImages = require("next-images");
const withLess = require("@zeit/next-less");

module.exports = withLess(
  withImages({
    i18n,
    images: {
      domains: ["picsum.photos"],
    },
    lessLoaderOptions: {
      javascriptEnabled: true,
    },
    webpack: (config, options) => {
      config.module.rules.push({
        exclude: /node_modules/,
        test: /\.scss$/,
        issuer: {
          exclude: /\.less$/,
        },
        use: [
          { loader: "css-loader", options: { modules: true } },
          "sass-loader",
        ],
      });
      return config;
    },
  })
);
