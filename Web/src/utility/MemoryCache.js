const __cache = {} // 用来存放缓存的全局变量。
const __clears = {}

class MemoryCache{
    constructor(defaultTime){
        this._prefix = parseInt(Math.random()*100000)
        this._defaultTime = defaultTime // 默认超时时间
    }
    _getKey(key){
        return `${this._prefix}_${key}`
    }
    set(key,value,{ callback = null,time = null } = {callback: null,time: null}){
        key = this._getKey(key)
        time = time ? time : this._defaultTime
        __cache[key] = value
        this._setTimeout(key,{callback,time})
    }
    get(key){
        key = this._getKey(key)
        this._setTimeout(key)
        return __cache[key]
    }
    remove(key){
        key = this._getKey(key)
        delete __cache[key]
    }
    _setTimeout(key,{callback = null,time = null} = {callback: null,time: null}){
        const item = __clears[key]
        if(item) clearTimeout(item.id)

        time = time || (item && item.time)
        callback = callback || (item && item.callback)
        if(time){
            const id = setTimeout(function(){ //使用TIMEOUT来处理超时时的删除。
                if(typeof(callback) === 'function') callback()
                delete __cache[key]
                delete __clears[key]
            },time)
            __clears[key] = {id,time,callback}
        }
    }
}

export{
    MemoryCache
}

// exports.memoryCache  =  new MemoryCache(1000*60*5) // 5分钟