const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ForkTsCheckerWebpackPlugin = require("fork-ts-checker-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const WebpackShellPlugin = require("webpack-shell-plugin");
const dotenv = require("dotenv");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {
  getPlugins,
  getRules,
  optimization,
  resolveExtensions,
  resolvePlugins,
} = require("./config/common");

module.exports = (env, argv, customEnv = {}) => {
  const devMode = argv.mode !== "production";
  const analyze = argv.analyze === "true";
  const envFile = dotenv.config(devMode ? undefined : { path: "./.env.prod" })
    .parsed;

  const envKeys = Object.keys(envFile).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(envFile[next]);
    return prev;
  }, {});

  return {
    mode: devMode ? "development" : "production",
    entry: {
      index: path.join(__dirname, "src", "web", "index.tsx"),
      editor: path.join(
        __dirname,
        "src",
        "extension",
        "content",
        "containers",
        "editor-container"
      ),
    },
    output: {
      path: path.join(__dirname, "dist", "web"),
      filename: devMode ? "[name].js" : "[name].[contenthash].js",
      publicPath: "/",
    },
    module: {
      rules: getRules(devMode, __dirname),
    },
    plugins: [
      ...getPlugins(devMode, envKeys, analyze),
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin({
        filename: devMode ? "[name].css" : "[name].[contenthash].css",
      }),
      new HtmlWebpackPlugin({
        inject: true,
        template: path.join(__dirname, "src", "web", "index.html"),
        excludeChunks: ["editor"],
      }),
      new CopyPlugin({
        patterns: [
          {
            from: "server-fonts/*.woff2",
            to: path.resolve(__dirname, "dist", "web", "fonts"),
            flatten: true,
          },
          {
            from: "src/libs/subtitle-octopus/*.{js,data,mem,wasm}",
            to: path.resolve(
              __dirname,
              "dist",
              "web",
              "js",
              "subtitle-octopus"
            ),
            flatten: true,
          },
          {
            from: "src/libs/subtitle-octopus/assets/*.*",
            to: path.resolve(__dirname, "dist", "web", "sub-assets"),
            flatten: true,
          },
        ],
      }),
      devMode && new ForkTsCheckerWebpackPlugin(),
    ].filter(Boolean),
    resolve: {
      plugins: resolvePlugins,
      extensions: resolveExtensions,
    },
    ...(!devMode && {
      optimization: {
        ...optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            defaultVendors: {
              test: /[\\/]node_modules[\\/]/,
              priority: -10,
              reuseExistingChunk: true,
            },
          },
        },
      },
    }),
    ...(devMode && {
      devtool: "",
      devServer: {
        contentBase: path.join(__dirname, "dist", "web"),
        compress: false,
        port: 12341,
        watchContentBase: true,
        hot: true,
        writeToDisk: false,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods":
            "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          "Access-Control-Allow-Headers":
            "X-Requested-With, content-type, Authorization",
        },
        historyApiFallback: {
          index: "/",
        },
      },
    }),
  };
};
