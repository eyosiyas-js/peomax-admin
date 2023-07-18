const path = require("path");

module.exports = {
  entry: "./index.js",
  target: "node",
  mode: "production",
  externals: {
    "aws-sdk": "aws-sdk",
  },
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
};
