const path = require("path");
const webpack = require("webpack");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const LicenseWebpackPlugin =
  require("license-webpack-plugin").LicenseWebpackPlugin;
const BundleAnalyzerPlugin =
  require("webpack-bundle-analyzer").BundleAnalyzerPlugin;
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");

module.exports.optimization = {
  minimize: true,
  minimizer: [
    new TerserPlugin({
      parallel: true,
      terserOptions: {
        output: { ascii_only: true },
      },
    }),
    new CssMinimizerPlugin(),
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
    exclude: [/node_modules/, /\.less$/],
    test: /\.scss$/,
    use: [
      MiniCssExtractPlugin.loader,
      { loader: "css-loader", options: { modules: true } },
      "sass-loader",
    ],
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
    type: "javascript/auto",
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
    // new OptimizeCssAssetsPlugin(),
    analyze && new BundleAnalyzerPlugin(),
  ].filter(Boolean);
