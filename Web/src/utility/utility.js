import { MemoryCache } from '@/utility/MemoryCache'
const mCache = new MemoryCache(1000*60*30) // 30分钟

function throttle (func, wait) {
    let lastTime = null
    let timeout
    let newestArguments
    return function () {
        // console.log(1)
        newestArguments = arguments // 始终使用最新的 arguments
        let context = this
        let now = new Date()
        // 如果上次执行的时间和这次触发的时间大于一个执行周期，则执行
        if (now - lastTime - wait > 0) {        
            if (timeout) {
                clearTimeout(timeout)
                timeout = null
            } // 如果之前有了定时任务则清除
            func.apply(context, newestArguments)
            lastTime = now
            // console.log(2)
        } else if (!timeout) {
            timeout = setTimeout(() => {          
                // console.log(3)
                func.apply(context, newestArguments) // 改变执行上下文环境
            }, wait)
        }
    }
}

const onResize = function(el,callback){
    if(el.getStyle('position') === 'static'){
        el.style.position = 'relative'
      }
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.top = '0px'
      iframe.style.left = '0px'
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.style.border = 'none'
      iframe.style.pointerEvents = 'none'
      iframe.style.zIndex = '-1'    
    //   iframe.style.opacity = '0'
    //   iframe.style.background = '#eee'
      iframe.addEventListener('load',({target})=>{
          target.contentWindow.addEventListener('resize', () => {
              callback()
           })
      })
      el.appendChild(iframe)
}
const isEmpty = function(value){
    return value === undefined || value === null || value === ''  
}

const dataProcessApplyWorker = function(scripts,data,workerUrl){    
    return new Promise(function(resolve, reject) {
        // const worker = new Worker(workerUrl)
        let worker = mCache.get(workerUrl)
        if(!worker){
            worker = new Worker(workerUrl)
            mCache.set(workerUrl,worker,{callback:()=>{
                worker.terminate()
            }})
        }
        worker.onmessage = function (event) {
            // debugger
            // worker.terminate()
            delete worker.onmessage
            delete worker.onerror
            resolve(event.data)
        }
        worker.onerror = function (event) {
            // worker.terminate()
            console.log(event)
            delete worker.onmessage
            delete worker.onerror
            reject(event)
        }
        worker.postMessage({scripts,data})
    })
}

const deepCopy = function(obj){
    return JSON.parse(JSON.stringify(obj))
}

const sqlToHtml = function(sql){
    return sql.replace(/\r|\n/img,'<br/>')
    
    .replace(/\t/img,'\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0') // 制表符，Tab
    .replace(/\s/img,'\xa0') // 空格
    .replace(/([)()])/img,'<big><b>$1</b></big>')
    .replace(/\b(select|from|top|where|order\s+by|group\s+by|like|desc|asc|as|and|or|is\s+not|is|count|sum|max|min|avg|union|not exists|exists|distinct|all|not|on|inner\s+join|left\s+join|right\s+join|outer\s+join|natural join|join|having)\b/img,'<b>$1</b>')
}

function Base64() {
    // private property  
    const _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/="  
   
    // public method for encoding  
    this.encode = function (input) {  
        let output = ""  
        let chr1, chr2, chr3, enc1, enc2, enc3, enc4  
        let i = 0  
        input = _utf8_encode(input)  
        while (i < input.length) {  
            chr1 = input.charCodeAt(i++)  
            chr2 = input.charCodeAt(i++)  
            chr3 = input.charCodeAt(i++)  
            enc1 = chr1 >> 2  
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)  
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)  
            enc4 = chr3 & 63  
            if (isNaN(chr2)) {  
                enc3 = enc4 = 64  
            } else if (isNaN(chr3)) {  
                enc4 = 64  
            }  
            output = output +  
            _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +  
            _keyStr.charAt(enc3) + _keyStr.charAt(enc4)  
        }  
        return output  
    }  
   
    // public method for decoding  
    this.decode = function (input) {  
        let output = ""  
        let chr1, chr2, chr3  
        let enc1, enc2, enc3, enc4  
        let i = 0  
        input = input.replace(/[^A-Za-z0-9+/=]/g, "")  
        while (i < input.length) {  
            enc1 = _keyStr.indexOf(input.charAt(i++))  
            enc2 = _keyStr.indexOf(input.charAt(i++))  
            enc3 = _keyStr.indexOf(input.charAt(i++))  
            enc4 = _keyStr.indexOf(input.charAt(i++))  
            chr1 = (enc1 << 2) | (enc2 >> 4)  
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2)  
            chr3 = ((enc3 & 3) << 6) | enc4  
            output = output + String.fromCharCode(chr1)  
            if (enc3 != 64) {  
                output = output + String.fromCharCode(chr2)  
            }  
            if (enc4 != 64) {  
                output = output + String.fromCharCode(chr3)  
            }  
        }  
        output = _utf8_decode(output)  
        return output  
    }  
   
    // private method for UTF-8 encoding  
    const _utf8_encode = function (string) {  
        string = string.replace(/\r\n/g,"\n")  
        let utftext = ""  
        for (let n = 0; n < string.length; n++) {  
            let c = string.charCodeAt(n)  
            if (c < 128) {  
                utftext += String.fromCharCode(c)  
            } else if((c > 127) && (c < 2048)) {  
                utftext += String.fromCharCode((c >> 6) | 192)  
                utftext += String.fromCharCode((c & 63) | 128)  
            } else {  
                utftext += String.fromCharCode((c >> 12) | 224)  
                utftext += String.fromCharCode(((c >> 6) & 63) | 128)  
                utftext += String.fromCharCode((c & 63) | 128)  
            }  
   
        }  
        return utftext  
    }  
   
    // private method for UTF-8 decoding  
    const _utf8_decode = function (utftext) {  
        let string = ""  
        let i = 0  
        let c,c2,c3
        c = c2 = 0  
        while ( i < utftext.length ) {  
            c = utftext.charCodeAt(i)  
            if (c < 128) {  
                string += String.fromCharCode(c)  
                i++  
            } else if((c > 191) && (c < 224)) {  
                c2 = utftext.charCodeAt(i+1)  
                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63))  
                i += 2  
            } else {  
                c2 = utftext.charCodeAt(i+1)  
                c3 = utftext.charCodeAt(i+2)  
                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63))  
                i += 3  
            }  
        }  
        return string  
    }  
}
const base64 = new Base64()

/**
 * 格式化代码函数,已经用原生方式写好了不需要改动,直接引用就好
 * @param {*} json 
 * @param {*} options 
 */
const formatJson = function (json, options) {
    let reg = null
    let formatted = ''
    let pad = 0
    let PADDING = '    '
    options = options || {}
    options.newlineAfterColonIfBeforeBraceOrBracket = (options.newlineAfterColonIfBeforeBraceOrBracket === true) ? true : false
    options.spaceAfterColon = (options.spaceAfterColon === false) ? false : true
    if (typeof json !== 'string') {
        json = JSON.stringify(json)
    } else {
        json = JSON.parse(json)
        json = JSON.stringify(json)
    }
    reg = /([{}])/g
    json = json.replace(reg, '\r\n$1\r\n')
    reg = /([[]])/g
    json = json.replace(reg, '\r\n$1\r\n')
    reg = /(,)/g
    json = json.replace(reg, '$1\r\n')
    reg = /(\r\n\r\n)/g
    json = json.replace(reg, '\r\n')
    reg = /\r\n,/g
    json = json.replace(reg, ',')
    if (!options.newlineAfterColonIfBeforeBraceOrBracket) {
        reg = /:\r\n\{/g
        json = json.replace(reg, ':{')
        reg = /:\r\n\[/g
        json = json.replace(reg, ':[')
    }
    if (options.spaceAfterColon) {
        reg = /:/g
        json = json.replace(reg, ':')
    }
    (json.split('\r\n')).forEach(function (node) {
                let i = 0
                let indent = 0
                let padding = ''

                if (node.match(/\{$/) || node.match(/\[$/)) {
                    indent = 1
                } else if (node.match(/\}/) || node.match(/\]/)) {
                    if (pad !== 0) {
                        pad -= 1
                    }
                } else {
                    indent = 0
                }

                for (i = 0; i < pad; i++) {
                    padding += PADDING
                }

                formatted += padding + node + '\r\n'
                pad += indent
            }
    )
    return formatted
}

export {
    throttle,
    onResize,
    isEmpty,
    dataProcessApplyWorker,
    deepCopy,
    sqlToHtml,
    base64,
    formatJson
}