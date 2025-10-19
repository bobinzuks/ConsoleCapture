const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    entry: {
      background: './src/background/index.ts',
      content: './src/content/index.ts',
      injected: './src/injected/index.ts',
      popup: './src/popup/index.tsx',
      devtools: './src/devtools/index.ts',
      'devtools-panel': './src/devtools/panel.tsx',
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'manifest.json', to: 'manifest.json' },
          { from: 'icons', to: 'icons' },
        ],
      }),
      new HtmlWebpackPlugin({
        template: './src/popup/popup.html',
        filename: 'popup.html',
        chunks: ['popup'],
      }),
      new HtmlWebpackPlugin({
        template: './src/devtools/devtools.html',
        filename: 'devtools.html',
        chunks: ['devtools'],
      }),
      new HtmlWebpackPlugin({
        template: './src/devtools/panel.html',
        filename: 'panel.html',
        chunks: ['devtools-panel'],
      }),
    ],
    devtool: isDevelopment ? 'inline-source-map' : false,
    optimization: {
      minimize: !isDevelopment,
    },
  };
};
