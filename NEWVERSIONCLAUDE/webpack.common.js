const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    popup: './src/popup/index.tsx',
    background: './src/background/index.ts',
    contentScript: './src/content/index.tsx',
    styles: './src/styles.css'
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
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/i,
        type: 'asset/resource',
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/popup/index.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new CopyPlugin({
      patterns: [
        { 
          from: 'src/manifest.json',
          transform(content) {
            return Buffer.from(JSON.stringify({
              ...JSON.parse(content.toString()),
              version: process.env.npm_package_version || '1.0.0'
            }, null, 2));
          },
        },
        { from: 'src/assets', to: 'assets' },
        { from: 'src/styles.css', to: 'styles.css' },
      ],
    }),
  ],
};
