
// IE不支持lamda表达式，不支持 对象解构。兼容IE简直让人吐血
const func = function(scripts,list){
    const fs = scripts.map(function(script){
        return new Function('row',script)
    })
    const result = list.map(function(row){
        return fs.map(function(f){
            return f(row)
        })
    })
    return result

    // const fs = scripts.map(script=>(new Function('row',script)))
    // const result = list.map(row=>{
    //     return fs.map(f=>(f(row)))
    // })
    // return result
}

this.addEventListener('message', function (e) {
    const scripts = e.data.scripts
    const data = e.data.data
    const result = func(scripts,data)
    this.postMessage(result)

    // const { scripts, data } = e.data
    // self.postMessage({scripts, data,a:3})
    // const result = func(scripts,data)

    // self.postMessage(result)
    // // self.close() // 需要重复使用，不能关闭
})