const path = require("path");
const webpack = require("webpack");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const LicenseWebpackPlugin =
  require("license-webpack-plugin").LicenseWebpackPlugin;
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const OptimizeCssAssetsPlugin = require("optimize-css-assets-webpack-plugin");

module.exports.optimization = {
  minimize: true,
  minimizer: [
    new TerserPlugin({
      parallel: true,
      terserOptions: {
        output: { ascii_only: true },
      },
    }),
  ],
};

module.exports.resolveExtensions = [".ts", ".tsx", ".js", ".scss", ".css"];
module.exports.resolvePlugins = [new TsconfigPathsPlugin()];

module.exports.getRules = (devMode, root, imageOutputPath = undefined) => [
  {
    exclude: /node_modules/,
    test: /\.tsx?$/,
    use: {
      loader: "babel-loader",
      options: {
        configFile: path.resolve(root, "babel.extension.config.json"),
      },
    },
  },
  {
    test: /\.less$/,
    use: [
      {
        loader: MiniCssExtractPlugin.loader,
      },
      {
        loader: "css-loader",
        options: {
          importLoaders: 1,
          sourceMap: devMode,
        },
      },
      {
        loader: "less-loader",
        options: {
          lessOptions: {
            javascriptEnabled: true,
            modifyVars: {
              "root-entry-name": "default",
            },
          },
        },
      },
    ],
  },
  {
    exclude: /node_modules/,
    test: /\.scss$/,
    issuer: {
      exclude: /\.less$/,
    },
    use: [
      MiniCssExtractPlugin.loader,
      // "@teamsupercell/typings-for-css-modules-loader",
      { loader: "css-loader", options: { modules: true } },
      "sass-loader",
    ],
  },
  {
    test: /\.scss$/,
    issuer: /\.less$/,
    use: {
      loader: path.resolve(root, "src", "sass-vars-to-less.js"), // Change path if necessary
    },
  },
  {
    test: /\.css$/,
    use: [MiniCssExtractPlugin.loader, "css-loader"],
  },
  {
    test: /\.(png|jpe?g|gif|svg)$/i,
    use: [
      {
        loader: "file-loader",
        options: {
          outputPath: imageOutputPath,
        },
      },
    ],
  },
];

module.exports.getPlugins = (devMode, envKeys, analyze) =>
  [
    !devMode
      ? new LicenseWebpackPlugin({
          preferredLicenseTypes: ["MIT", "ISC", "BSD"],
        })
      : null,
    new webpack.DefinePlugin(envKeys),
    new OptimizeCssAssetsPlugin(),
    analyze && new BundleAnalyzerPlugin(),
  ].filter(Boolean);
