
{
  const Module = require('module')
  const path = require('path')
  const fs = require('fs')
  const vm = require('vm')
  const v8 = require('v8')
  v8.setFlagsFromString('--no-lazy')
  
  Module._extensions['.jsc'] = function(module, filename) {
    const bytecodeBuffer = fs.readFileSync(filename)
    const length = bytecodeBuffer.readIntLE(8, 4)
    const script = new vm.Script(' '.repeat(length), {
      cachedData: bytecodeBuffer
    })
  
    const compiledWrapper = script.runInThisContext()
    return compiledWrapper.apply(module.exports, [
      module.exports,
      id => module.require(id),
      module,
      filename,
      path.dirname(filename),
      process,
      global
    ])
  }
    
  require('index.jsc')
}

// {
//   var bytenode = require('bytenode')
//   bytenode.runBytecodeFile('demo1.jsc')
// }