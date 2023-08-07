import path from 'path'
import webpack from 'webpack'
import CopyPlugin from "copy-webpack-plugin"

const config: webpack.Configuration = {
  mode: 'development',
  devtool: 'inline-source-map',

  entry: './src/index.ts',

  output: {
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js',
    clean: true
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      }
    ]
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.js']
  },

  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./manifest.json", to: "./" },
        { from: "./icons", to: "./icons" }
      ]
    })
  ]
}

export default config