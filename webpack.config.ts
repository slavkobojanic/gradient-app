import * as path from "path";
import * as webpack from "webpack";
import * as ngrok from "ngrok";
import FriendlyErrorsWebpackPlugin from "friendly-errors-webpack-plugin";

const DIST_DIR = path.resolve(__dirname, "dist");
const SRC_DIR = path.resolve(__dirname, "src");

const config: webpack.Configuration = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              allowTsInNodeModules: true,
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".js", ".json", ".jsx", ".ts", ".tsx"],
  },
  devServer: {
    contentBase: [DIST_DIR, SRC_DIR],
    https: true,
    stats: "errors-only",
    noInfo: true,
    disableHostCheck: true,
    after: async (app, server, compiler) => {
      const port = compiler.options.devServer?.port || 8080;
      await ngrok.authtoken(
        "1ZeSA8C1SOhTu0ZJqSQAhXDMHyp_4Ej3n4KWNjbkuhdJQTNGC"
      );
      const url = await ngrok.connect({
        subdomain: "slavko",
        host: "http",
        addr: `https://localhost:${port}`,
      });
      console.log("---");
      console.log("Development URL:", url);
      console.log("---");
    },
  },
  plugins: [new FriendlyErrorsWebpackPlugin()],
};

export default config;
