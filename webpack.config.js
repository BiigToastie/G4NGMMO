const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: {
        main: './src/client/index.ts'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'public/dist'),
        clean: true,
        publicPath: '/dist/',
        chunkFilename: '[name].[chunkhash].js'
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                            experimentalWatchApi: true
                        }
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.(glb|gltf)$/,
                type: 'asset/resource',
                generator: {
                    filename: 'models/[name][ext]'
                }
            }
        ]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            'three': path.resolve(__dirname, 'node_modules/three')
        }
    },
    optimization: {
        minimize: false,
        splitChunks: {
            chunks: 'all',
            maxInitialRequests: Infinity,
            minSize: 0,
            cacheGroups: {
                vendor: {
                    test: /[\\/]node_modules[\\/]/,
                    name(module) {
                        const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                        return `vendor.${packageName.replace('@', '')}`;
                    },
                    priority: -10
                },
                threejs: {
                    test: /[\\/]node_modules[\\/]three[\\/]/,
                    name: 'threejs',
                    chunks: 'all',
                    priority: 20
                },
                models: {
                    test: /\.(glb|gltf)$/,
                    name: 'models',
                    chunks: 'async',
                    priority: 30
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                }
            }
        }
    },
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                { 
                    from: 'src/client/assets/icons',
                    to: 'icons'
                },
                {
                    from: 'public/models',
                    to: 'models',
                    noErrorOnMissing: true
                }
            ]
        })
    ],
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    devtool: 'source-map',
    performance: {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
        hints: 'warning'
    },
    stats: {
        colors: true,
        modules: true,
        reasons: true,
        errorDetails: true
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        compress: true,
        port: 3000,
        hot: true,
        open: true
    }
}; 