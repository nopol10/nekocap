const path = require("path");
const fs = require("fs");
const CopyPlugin = require("copy-webpack-plugin");
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

  let originalManifestString = "";
  const manifestPath = path.join(
    __dirname,
    "extension-statics",
    "manifest.json"
  );
  // Update manifest.json with key for build, remove it afterwards
  if (!devMode) {
    originalManifestString = fs.readFileSync(manifestPath);
    const manifest = JSON.parse(originalManifestString);
    manifest.key = process.env.EXTENSION_KEY || envFile.EXTENSION_KEY || "";
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, undefined, 2));
  }

  return {
    mode: devMode ? "development" : "production",
    entry: {
      "js/popup": path.join(__dirname, "src/extension/popup/index.tsx"),
      "js/background": path.join(
        __dirname,
        "src/extension/background/index.tsx"
      ),
      "js/content": path.join(__dirname, "src/extension/content/index.tsx"),
    },
    output: {
      path: path.join(__dirname, "dist", "extension"),
      filename: "[name].js",
      publicPath: "/",
    },
    module: {
      rules: getRules(devMode, __dirname, "img"),
    },
    plugins: [
      ...getPlugins(devMode, envKeys, analyze),
      new CleanWebpackPlugin({
        cleanOnceBeforeBuildPatterns: [`*.hot-update.*`, "js/*.hot-update.*"],
        dry: false,
        dangerouslyAllowCleanPatternsOutsideProject: true,
      }),
      new MiniCssExtractPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "extension-statics"),
            to: path.resolve(__dirname, "dist", "extension"),
          },
          {
            from: path.resolve(
              __dirname,
              "src",
              "extension",
              "popup",
              "popup.html"
            ),
            to: path.resolve(__dirname, "dist", "extension", "popup.html"),
          },
          {
            from: path.resolve(
              __dirname,
              "src",
              "extension",
              "background",
              "background.html"
            ),
            to: path.resolve(__dirname, "dist", "extension", "background.html"),
          },
          {
            from: "src/libs/subtitle-octopus/*.{js,data,mem,wasm}",
            to: path.resolve(
              __dirname,
              "dist",
              "extension",
              "js",
              "subtitle-octopus"
            ),
            flatten: true,
          },
          {
            from: "src/libs/subtitle-octopus/assets/*.*",
            to: path.resolve(__dirname, "dist", "extension", "sub-assets"),
            flatten: true,
          },
        ],
      }),
      devMode && new ForkTsCheckerWebpackPlugin(),
      !devMode &&
        new WebpackShellPlugin({ onBuildEnd: ["node zip-extension.js"] }),
      !devMode && {
        apply: (compiler) => {
          compiler.hooks.afterEmit.tap("AfterEmitPlugin", (compilation) => {
            // Restore original manifest without the key property
            if (originalManifestString) {
              fs.writeFileSync(manifestPath, originalManifestString);
            }
          });
        },
      },
    ].filter(Boolean),
    resolve: {
      plugins: resolvePlugins,
      extensions: resolveExtensions,
    },
    ...(devMode && {
      devtool: "",
      devServer: {
        contentBase: path.join(__dirname, "dist", "web"),
        compress: false,
        // When used in dev mode, the local server should be started separately as well for the extension to connect to.
        // The server at this port will not be used by the extension
        port: 12345,
        watchContentBase: true,
        hot: true,
        writeToDisk: true,
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
    ...(!devMode && {
      optimization,
    }),
  };
};
