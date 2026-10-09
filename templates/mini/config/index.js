const path = require('path');
module.exports = {
  projectName: 'sprout-mini-project', date: '2026-09-30', designWidth: 375,
  deviceRatio: { 375: 2, 640: 1.17, 750: 1, 828: 0.905 },
  sourceRoot: 'src', outputRoot: 'dist/' + (process.env.TARO_ENV || 'h5'),
  framework: 'react', compiler: 'webpack5',
  plugins: ['@tarojs/plugin-platform-h5', '@tarojs/plugin-platform-weapp'],
  cache: { enable: false },
  mini: { postcss: { pxtransform: { enable: true }, url: { enable: true, config: { limit: 1024 } } } },
  h5: {
    publicPath: './', staticDirectory: 'static', router: { mode: 'hash' },
    htmlPluginOption: { template: path.resolve(__dirname, '../src/index.html') },
    postcss: { pxtransform: { enable: true }, autoprefixer: { enable: true } }
  }
};
