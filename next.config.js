const { i18n } = require("./next-i18next.config");
const withImages = require("next-images");
const withAntdLess = require("next-plugin-antd-less");
const dotenv = require("dotenv");
const webpack = require("webpack");

module.exports = withAntdLess(
  withImages({
    i18n,
    cssLoaderOptions: {
      modules: true,
    },
    modifyVars: { "@primary-color": "#ffa62b" },
    // webpack: (config, { dev }) => {
    //   const envFileConfig = dotenv.config(
    //     dev ? undefined : { path: "./.env.prod" }
    //   );
    //   if (envFileConfig) {
    //     const envFile = envFileConfig.parsed;
    //     const envKeys = Object.keys(envFile).reduce((prev, next) => {
    //       prev[`process.env.${next}`] = JSON.stringify(envFile[next]);
    //       return prev;
    //     }, {});
    //     config.plugins = [...config.plugins, new webpack.DefinePlugin(envKeys)];
    //   }
    //   return config;
    // },
  })
);
