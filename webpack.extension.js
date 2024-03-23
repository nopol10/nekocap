const path = require("path");
const fs = require("fs");
const webpack = require("webpack");
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

const updateManifest = (manifestPath, isChrome) => {
  if (!isChrome) {
    return "";
  }
  const originalManifestString = fs.readFileSync(manifestPath);
  const manifest = JSON.parse(originalManifestString);
  manifest.key = process.env.EXTENSION_KEY || envFile.EXTENSION_KEY || "";
  // Remove localhost from externally_connectable
  if (
    manifest["externally_connectable"] &&
    manifest["externally_connectable"]["matches"]
  ) {
    let matches = manifest["externally_connectable"]["matches"];
    matches = matches.filter((match) => !match.includes("localhost"));
    manifest["externally_connectable"]["matches"] = matches;
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, undefined, 2));
  return originalManifestString;
};

/** @type { import('webpack').ConfigurationFactory } */
const createServiceWorkerConfig = (env, argv) => {
  const devMode = argv.mode !== "production";
  const targetBrowser = env.targetBrowser;
  const isChrome = targetBrowser === "chrome";
  const analyze = argv.analyze === "true";
  const envFile = dotenv.config(
    devMode ? undefined : { path: "./.env.prod" },
  ).parsed;

  const envKeys = Object.keys(envFile).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(envFile[next]);
    return prev;
  }, {});

  return {
    mode: devMode ? "development" : "production",
    target: "webworker",
    entry: {
      "js/background": path.join(
        __dirname,
        "src/extension/background/index.tsx",
      ),
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
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin(),
      devMode && new ForkTsCheckerWebpackPlugin(),
    ].filter(Boolean),
    resolve: {
      plugins: resolvePlugins,
      extensions: resolveExtensions,
    },
    // Dev server is only added to this one as adding to both is not supported yet
    ...(devMode && {
      devtool: "",
      devServer: {
        static: {
          directory: path.join(__dirname, "dist", "extension"),
          watch: true,
        },
        devMiddleware: {
          writeToDisk: true,
        },
        compress: false,
        // When used in dev mode, the local server should be started separately as well for the extension to connect to.
        // The server at this port will not be used by the extension
        port: 12345,
        hot: false,
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

/** @type { import('webpack').ConfigurationFactory } */
const createContentAndPopupConfig = (env, argv) => {
  const devMode = argv.mode !== "production";
  const targetBrowser = env.targetBrowser;
  const isChrome = targetBrowser === "chrome";
  const analyze = argv.analyze === "true";
  const envFile = dotenv.config(
    devMode ? undefined : { path: "./.env.prod" },
  ).parsed;

  const envKeys = Object.keys(envFile).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(envFile[next]);
    return prev;
  }, {});

  let originalManifestString = "";
  const manifestPath = path.join(
    __dirname,
    "extension-statics",
    `manifest-${targetBrowser}.json`,
  );
  // Update manifest.json with key for build, remove it afterwards
  if (!devMode && isChrome) {
    originalManifestString = updateManifest(manifestPath, isChrome);
  }

  return {
    mode: devMode ? "development" : "production",
    target: "web",
    entry: {
      "js/popup": path.join(__dirname, "src/extension/popup/index.tsx"),
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
      new webpack.ProvidePlugin({ process: "process/browser" }),
      ...getPlugins(devMode, envKeys, analyze),
      // Clean plugin is omitted here as the previous config will trigger it already
      new MiniCssExtractPlugin(),
      new CopyPlugin({
        patterns: [
          {
            from: path.resolve(__dirname, "extension-statics"),
            to: path.resolve(__dirname, "dist", "extension"),
            globOptions: {
              ignore: ["**/manifest-*.json"],
            },
          },
          {
            from: path.resolve(
              __dirname,
              "extension-statics",
              `manifest-${targetBrowser}.json`,
            ),
            to: path.resolve(__dirname, "dist", "extension", `manifest.json`),
          },
          {
            from: path.resolve(
              __dirname,
              "src",
              "extension",
              "popup",
              "popup.html",
            ),
            to: path.resolve(__dirname, "dist", "extension", "popup.html"),
          },
          {
            from: path.resolve(
              __dirname,
              "src",
              "extension",
              "background",
              "background.html",
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
              "subtitle-octopus",
              "[name][ext]",
            ),
          },
          {
            from: "src/libs/subtitle-octopus/assets/*.*",
            to: path.resolve(
              __dirname,
              "dist",
              "extension",
              "sub-assets",
              "[name][ext]",
            ),
          },
        ],
      }),
      devMode && new ForkTsCheckerWebpackPlugin(),
      !devMode &&
        new WebpackShellPlugin({
          onBuildEnd: [`node zip-extension.js --target=${targetBrowser}`],
        }),
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
      alias: {
        process: "process/browser",
      },
    },
    ...(!devMode && {
      optimization,
    }),
  };
};

/** @type { import('webpack').MultiConfigurationFactory } */
module.exports = (env, argv) => {
  const serviceWorkerConfig = createServiceWorkerConfig(env, argv);
  const contentAndPopupConfig = createContentAndPopupConfig(env, argv);
  return [serviceWorkerConfig, contentAndPopupConfig];
};
