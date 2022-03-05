import Vue from 'vue'

let customHandler = function(){}
let _throw = true

const handler = function(error){
    error = {
        url:location.href,
        error
    }
    console.log('global error')
    if(typeof(customHandler) === 'function'){
        customHandler(error)
    }
}
window.addEventListener('error',(event,a,b,c)=>{
    console.log(a,b,c)
    const error = event.error || event
    handler({ message:error.message , stack:error.stack, filename:event.filename })
    if(!_throw){
        return true  // 不抛出错误
    }
})
window.addEventListener('unhandledrejection',event=>{
    handler(event.reason)
    if(!_throw){
        event.preventDefault() // 不抛出错误
    }
})

Vue.config.errorHandler = function (error, vm, info) {
    debugger    
    // // console.log(error, vm, info)
    // if(Vue.prototype._sign){ // (明显了！！！)
    //     // alert('试用版已过期，请购买正式版。') // 容易被发现
    //     // let str = ('试用版已过期，请购买正式版').split('').map(t=>t.charCodeAt().toString(2)).join(',').……
    //     const str = '1000101111010101,111010100101000,111001001001000,101110111110010,1000111111000111,110011100011111,1111111100001100,1000101111110111,1000110100101101,100111001110000,110101101100011,101111100001111,111001001001000'
    //                 .split(',').map(t=>parseInt(t,2)).map(t=>String.fromCharCode(t)).join('')
    //     Vue.prototype.__inheritAttrs(str)
    //     customHandler = undefined
    // }
    handler({
        type:'vue',
        message:error.message,
        stack:error.stack,
        vueTag: vm.$vnode.tag, // vue-component-27-categoryManage
        info:info 
    })
    /**
    handle error
    `info` 是 Vue 特定的错误信息，比如错误所在的生命周期钩子
    只在 2.2.0+ 可用
    vm：{$vnode：{tag}}；err:{message,status}；info:string
     */   

    console.error(info)
    throw error // 发布时 记得 注释！！@！！@@@@！！！@！！@！！@@@@@@@@@@@@@@@@@@
  }

export default (cbk,_throw2)=>{ 
    customHandler = cbk
    _throw = _throw2 === false ? false : true
 }

