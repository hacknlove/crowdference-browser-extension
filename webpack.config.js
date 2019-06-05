const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader');
const ChromeExtensionReloader = require('webpack-chrome-extension-reloader');
const ZipPlugin = require('zip-webpack-plugin');

const sourceRootPath = path.join(__dirname, 'src');
const assetsRootPath = path.join(__dirname, 'assets');
const distRootPath = path.join(__dirname, 'dist');

const nodeEnv = process.env.NODE_ENV ? process.env.NODE_ENV : 'development';
const webBrowser = process.env.WEB_BROWSER ? process.env.WEB_BROWSER : 'chrome';

const manifest = require('./assets/manifest.json')

module.exports = {
  entry: {
    // background: path.join(sourceRootPath, 'ts', 'background', 'index.ts'),
    // options: path.join(sourceRootPath, 'ts', 'options', 'index.tsx'),
    // counter: path.join(sourceRootPath, 'ts', 'contentScripts', 'counter', 'index.tsx'),
    popup: path.join(sourceRootPath, 'popup.ts'),
  },
  devtool: 'source-map',
  output: {
    path: distRootPath,
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
  },
  module: {
    rules: [
      {
        test: /\.(js|ts|tsx)?$/,
        loader: "ts-loader",
        exclude: /node_modules/
      },
    ]
  },
  plugins: [
    new CheckerPlugin(),
    new CopyWebpackPlugin([
      {
        from: assetsRootPath,
        to: distRootPath
      },
    ]),
    new webpack.DefinePlugin({
      'API_URL': JSON.stringify(nodeEnv === 'production' ? 'https://api.crowdference.org' : 'http://api.crowdference.org.localhost.hacknlove.org'),
      'NODE_ENV': JSON.stringify(nodeEnv),
      'WEB_BROWSER': JSON.stringify(webBrowser),
    }),
  ],
}

if (nodeEnv === 'production') {
  module.exports.plugins.push(new CleanWebpackPlugin({ verbose: true, dry: false }));
  module.exports.plugins.push(new ZipPlugin({
    path: __dirname,
    filename: `${manifest.name}-${manifest.version}.zip`
  }))
}
