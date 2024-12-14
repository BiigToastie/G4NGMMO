const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/client/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                        experimentalWatchApi: true
                    }
                },
                exclude: /node_modules/,
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif|glb|gltf)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/[name][ext]'
                }
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        fallback: {
            "path": false,
            "fs": false
        },
        modules: [
            path.resolve(__dirname, 'node_modules'),
            'node_modules'
        ]
    },
    output: {
        filename: '[name].[contenthash].js',
        path: path.resolve(__dirname, 'dist/client'),
        clean: true,
        publicPath: ''
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'public/index.html',
                    to: 'index.html',
                    transform(content) {
                        return content
                            .toString()
                            .replace(/src="\/([^"]+)"/g, 'src="$1"');
                    }
                },
                {
                    from: 'src/client/assets',
                    to: 'assets'
                },
                {
                    from: 'public/models',
                    to: 'models',
                    noErrorOnMissing: true
                }
            ]
        })
    ],
    optimization: {
        minimize: true,
        minimizer: [new TerserPlugin({
            terserOptions: {
                format: {
                    comments: false,
                },
            },
            extractComments: false,
        })],
        runtimeChunk: 'single',
        splitChunks: {
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                },
            },
        },
    },
    performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
}; 