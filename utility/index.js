const http = require('http')
const crypto = require('crypto')

function loadPage(url) {
    const referer = (url.match(/^(http:\/\/|https:\/\/)?[^\/]+/i) || [])[0]
    const host = (url.match(/^(?:http:\/\/|https:\/\/)?([^\/]+)/i) || [,])[1]
    let statusCode = 200
    const pm = new Promise(function (resolve, reject) {
        http.get(url,{headers:{
          referer,
          host,
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.3 Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
        }}, function (res) {
            let content = ''
            statusCode = res.statusCode
            res.on('data', function (d) {
                content += d.toString()
            })
            res.on('end', function () {
                if(statusCode === 500){
                    reject(Error(content))
                }else{
                    resolve(content)
                }
            })
        }).on('error', function (e) {
            reject(e)
        })
    })
    return pm
}

// 深冻结函数.
function deepFreeze(obj) {
    // 取回定义在obj上的属性名
    const propNames = Object.getOwnPropertyNames(obj)
    // 在冻结自身之前冻结属性
    propNames.forEach(function(name) {
        var prop = obj[name]
        // 如果prop是个对象，冻结它
        if (typeof prop == 'object' && prop !== null)
        deepFreeze(prop)
    })
    // 冻结自身(no-op if already frozen)
    return Object.freeze(obj)
}

function deepCopy(obj){
    if(obj === undefined || obj === null || obj === '') return obj 
    return JSON.parse(JSON.stringify(obj))
}

function guid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random()*16|0
        const v = c == 'x' ? r : (r&0x3|0x8)
        return v.toString(16)
    })
}

const isEmpty = (value)=> (value === null || value === undefined || value === '')

class aes{
    /**
     * AES_128_CBC 加密 
     * 128位 
     * return base64
     */
    static encrypt(data,key,iv) {    
        var cipherChunks = []
        var cipher = crypto.createCipheriv('aes-128-cbc', key, iv)
        cipher.setAutoPadding(true)
        cipherChunks.push(cipher.update(data, 'utf8', 'base64'))
        cipherChunks.push(cipher.final('base64'))
        return cipherChunks.join('')
    }
  
  
  /**
   * 解密
   * return utf8
   */
  static decrypt(data,key,iv){  
    var cipherChunks = []
    var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv)
    decipher.setAutoPadding(true)
    cipherChunks.push(decipher.update(data, 'base64', 'utf8'))
    cipherChunks.push(decipher.final('utf8'))
    return cipherChunks.join('')
  }
  
}


exports.loadPage = loadPage
exports.deepFreeze = deepFreeze
exports.deepCopy = deepCopy
exports.guid = guid
exports.isEmpty = isEmpty
exports.aes = aes