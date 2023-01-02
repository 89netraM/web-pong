const path = require("path");
const HtmlPlugin = require("html-webpack-plugin");

module.exports = {
	entry: path.resolve(__dirname, "./src/index.ts"),
	mode: "development",
	module: {
		rules: [
			{
				test: /\.ts?$/,
				use: "ts-loader",
			},
			{
				test: /\.s?css$/,
				use: [
					"style-loader",
					"css-loader",
					"sass-loader",
				],
			},
		]
	},
	resolve: {
		extensions: [".ts", ".js"],
	},
	plugins: [
		new HtmlPlugin({
			template: path.resolve(__dirname, "index.html"),
			title: "TDA352",
			base: process.env["BASE_URL"] ?? "/",
		}),
	],
	ignoreWarnings: [
		{
			module: /styles\/index\.scss$/i,
		},
	],
	output: {
		filename: "index.js",
		path: path.resolve(__dirname, "dist"),
	},
	devServer: {
		port: 9090,
		host: "0.0.0.0",
		historyApiFallback: true,
	},
};
