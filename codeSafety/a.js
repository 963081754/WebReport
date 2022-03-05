
{
    const path = require('path')
    const fs = require('fs')
    // const vm = require('vm')
    // const Module = require('module')
    const glob = require('glob')
    const v8 = require('v8')
    v8.setFlagsFromString('--no-lazy')
    const obfuscator = require('javascript-obfuscator')
    const bytenode = require('bytenode')

    const srcPath = path.resolve(__dirname, '../')
    const destPath = path.resolve(__dirname, '../dist')

    {
        if (!fs.existsSync(destPath)){
            fs.mkdirSync(destPath)
        }
    }

    const obf = false // true
    const byte = true
    glob.sync('!(dist|userApi|public|node_modules|Web|.vscode|.git|codeSafety|data)/**/*.js', { cwd: srcPath })
    .concat(['index.js','config.js'])
    .forEach((filePath) => {
        const fullFilePath = path.join(srcPath, filePath)
        const fullDestPath = path.join(destPath, filePath)

        let dirs = fullDestPath.split('\\')
        dirs = dirs.slice(0,dirs.length-1).join('\\')
        if (!fs.existsSync(dirs)){
            fs.mkdirSync(dirs)
        }

        let code = fs.readFileSync(fullFilePath, 'utf8')
        if(obf){
            const obfuscationResult = obfuscator.obfuscate(code,{
                compact: false,
                selfDefending: false, // 混淆后的代码,不能使用代码美化,同时需要配置 cpmpat:true;
                controlFlowFlattening: false, //是否启用控制流扁平化(降低1.5倍的运行速度)
                controlFlowFlatteningThreshold: .0, //应用概率;在较大的代码库中，建议降低此值，因为大量的控制流转换可能会增加代码的大小并降低代码的速度。
                numbersToExpressions: false,
                simplify: false,
                shuffleStringArray: false,
                splitStrings: false,
                stringArrayThreshold: 1,
                stringArrayEncoding: ['rc4'],
                stringArray:true, // 删除字符串文字并将它们放在一个特殊的数组中
                identifierNamesGenerator: 'hexadecimal', // 标识符的混淆方式 hexadecimal(十六进制) mangled(短标识符)
                deadCodeInjection: false, // 随机的死代码块(增加了混淆代码的大小)                
                deadCodeInjectionThreshold: .0, // 死代码块的影响概率
                renameGlobals: true, // 是否启用全局变量和函数名称的混淆
                debugProtectionInterval: true,
            })
            code = obfuscationResult.getObfuscatedCode()
            fs.writeFileSync(
                fullDestPath.replace(/\.js$/, '.obf.js'),
                code
            ) // 保存 混淆后的JS
        } // 混淆
        if(byte){
            bytenode.compileFile({
                filename: obf ? fullDestPath.replace(/\.js$/, '.obf.js') : fullFilePath,
                output: fullDestPath.replace(/\.js$/, '.jsc'),
                compileAsModule: true
            })
            // 自己写的运行时 常出bug
            // const script = new vm.Script(Module.wrap(code), {
            //     produceCachedData: true
            // })
            // fs.writeFileSync(
            //     fullDestPath.replace(/\.js$/, '.jsc'),
            //     script.cachedData
            // )
        } // 编码
    })
}

// pkg app.js -o ./dist/app
// {
//     var bytenode = require('bytenode')
    // bytenode.compileFile({
    //     filename: 'demo1.js',
    //     output: 'dist/demo1.js',
    //     compileAsModule: true
    // })
// }