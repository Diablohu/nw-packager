"use strict"

// const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// const externals = [
//     'fs',
//     'path',
//     'buffer',
//     'zlib',

//     'nw',
//     'nw.gui'
// ]

module.exports = {
    entry: './source-launcher/main.js',
    output: {
        path: path.resolve(__dirname, './app/launcher'),
        filename: '____launcher____.js'
    },
    target: "node-webkit",
    // externals: externals.map(value => {
    //     let o = {}
    //     o[value] = 'commonjs ' + value
    //     return o
    // }),
    module: {
        rules: [
            {
                test: /.js?$|\.jsx$/,
                exclude: /node_modules/,
                use: `babel-loader?presets[]=latest&plugins[]=transform-class-properties`
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './source-launcher/main.html',
            filename: '____launcher____.html',
            inject: 'body',
            minify: {
                removeComments: true,
                collapseWhitespace: true
            }
        })
    ]
};