
class Cache{
    constructor(prefix = ''){
        this.prefix = prefix && `${prefix}_`
    }
    set(key,value){
        key = this._getKey(key)
        if(value === undefined || value === null || value === ''){
            sessionStorage.removeItem(key)
        }else{
            sessionStorage.setItem(key,JSON.stringify(value))
        }
    }
    get(key){
        key = this._getKey(key)
        const value = sessionStorage.getItem(key)
        if(key === null){
            return null
        }else{
            return JSON.parse(value)
        }
    }
    _getKey(key){
        return `${this.prefix}${key}`
    }
}

export default Cache