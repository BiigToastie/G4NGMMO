const path = require('path');

module.exports = {
    entry: {
        main: './src/client/index.ts'
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public/dist'),
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        alias: {
            'three': path.resolve(__dirname, 'node_modules/three')
        }
    },
    mode: 'development',
    devtool: 'source-map'
}; 