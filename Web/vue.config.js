// const CompressionPlugin = require("compression-webpack-plugin")
// const JavaScriptObfuscator = require('webpack-obfuscator')

module.exports = {
  productionSourceMap: false,
  publicPath: '/',
  devServer: {
    proxy: {
      '/frontapi': {
        target: 'http://localhost:80/',
        changeOrigin: true,
        // pathRewrite: {
        //   '^/api': ''
        // }
      },
      '/admin': {
        target: 'http://localhost:80/',
        changeOrigin: true
      },
      '/error': {
        target: 'http://localhost:80/',
        changeOrigin: true
      }
    }
  },
  pages: {
    admin:{
      template: 'public/template.html',
      entry: 'src/admin.js',
      title: '后台管理-通用Web表格报表试用版',
      filename: process.env.NODE_ENV !== 'production' ? 'admin/index.html' :'admin/default.html',
    },
    home:{
      template: 'public/template.html',
      entry: 'src/home.js',
      title: '通用Web表格报表试用版',
      filename: process.env.NODE_ENV !== 'production' ? 'index.html' :'front.html',
      // chunks: ['chunk-vendors2', 'chunk-common2', 'home2']
    }
  },
  configureWebpack: config => {
    if(process.env.NODE_ENV !== 'production') return {}
    return {
      plugins: [        
        // //js代码加密
        // new JavaScriptObfuscator({
        //   compact: true,//压缩代码
        //   controlFlowFlattening: true, //是否启用控制流扁平化(降低1.5倍的运行速度)
        //   controlFlowFlatteningThreshold: 0.1, //应用概率;在较大的代码库中，建议降低此值，因为大量的控制流转换可能会增加代码的大小并降低代码的速度。
        //   deadCodeInjection: true,//随机的死代码块(增加了混淆代码的大小)
        //   deadCodeInjectionThreshold: 0.3,//死代码块的影响概率
        //   debugProtection: true,//此选项几乎不可能使用开发者工具的控制台选项卡
        //   debugProtectionInterval: true,//如果选中，则会在“控制台”选项卡上使用间隔强制调试模式，从而更难使用“开发人员工具”的其他功能。
        //   disableConsoleOutput: true,//通过用空函数替换它们来禁用console.log，console.info，console.error和console.warn。这使得调试器的使用更加困难。
        //   identifierNamesGenerator: 'hexadecimal',//标识符的混淆方式 hexadecimal(十六进制) mangled(短标识符)
        //   log: false,
        //   renameGlobals: true,//是否启用全局变量和函数名称的混淆
        //   rotateStringArray: true,//通过固定和随机（在代码混淆时生成）的位置移动数组。这使得将删除的字符串的顺序与其原始位置相匹配变得更加困难。如果原始源代码不小，建议使用此选项，因为辅助函数可以引起注意。
        //   selfDefending: false,//混淆后的代码,不能使用代码美化,同时需要配置 cpmpat:true;
        //   stringArray: true,//删除字符串文字并将它们放在一个特殊的数组中
        //   stringArrayEncoding: ['base64'],
        //   stringArrayThreshold: 1, // 0.75 调整字符串文字将插入stringArray的概率
        //   transformObjectKeys: true,
        //   unicodeEscapeSequence: false
        // }, []), // ['abc.js','xxx.js']里是不混淆的代码
        // // 压缩
        // new CompressionPlugin({
        //   algorithm: 'gzip', //'brotliCompress'
        //   test: /\.js$|\.html$|\.css/, // + $|\.svg$|\.png$|\.jpg
        //   threshold: 10240, //对超过10k的数据压缩
        //   deleteOriginalAssets: false //不删除原文件
        // })
      ]
    }
  }
}