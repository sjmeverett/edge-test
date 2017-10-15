const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');


module.exports = {
  entry: [
    './src/lib',
    './src/styles/style'
  ],

  devtool: 'sourcemap',

  output: {
    path: __dirname + '/dist/public',
    publicPath: '/',
    filename: 'bundle.js'
  },

  module: {
    loaders: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader'
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract([{
          loader: 'css-loader'
        }, {
          loader: 'sass-loader',
          options: {
            precision: 10
          }
        }])
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract([{
          loader: 'css-loader',
          options: {
            modules: true,
            importLoaders: 1,
            localIdentName: '[name]__[local]___[hash:base64:5]'
          }
        }])
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)$/,
        use: [{
          loader: 'file-loader',
          options: {
            name: 'public/fonts/[name].[ext]'
          }
        }]
      }
    ]
  },

  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json', '.scss', '.css']
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: __dirname + '/src/index.html',
      inject: 'body'
    }),

    new ExtractTextPlugin({
      filename: 'style.css',
      allChunks: true
    })
  ]
};
