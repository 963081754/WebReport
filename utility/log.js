// const path = require('path')
const fs = require('fs')

class Log{
    constructor(){
        // this._path = path.join(path.resolve(__dirname, './logs/'), `log_${new Date().toLocaleDateString()}.txt`)
        this._path = `./logs/log_${new Date().toLocaleDateString().replace(/\//img,'-')}.txt`
    }
    write(error){
        if(!(error instanceof ErrorBase)){
            throw Error('content 必须是 ErrorBase的实例')
        }
        error.datetime = new Date()
        const content = JSON.stringify(error)
        fs.writeFile(this._path, `${content},`, { flag: 'a+' }, err => {
            if (err) {
                console.error('log写入失败',err)
            }
        })
    }
}

class Log404{
    constructor(){
        this._path = `./logs/404_${new Date().toLocaleDateString().replace(/\//img,'-')}.txt`
    }
    write(msg){
        msg = `\n\r${new Date().toLocaleString()} ：${msg}`
        fs.writeFile(this._path, `${msg},`, { flag: 'a+' }, err => {
            if (err) {
                console.error('log404写入失败',err)
            }
        })
    }
}

class ErrorBase{
    constructor(type,error,obj = undefined){
        this.obj = obj
        this.error = Object.assign(JSON.parse(JSON.stringify(error)),{message:error.message,stack:error.stack})
        this.type = type
    }
    set datetime(value){
        this._datetime = value
    }
    get datetime(){
        return this._datetime
    }
}
class ReqError extends ErrorBase{
    constructor(url,error,obj){
        super('Req',error,obj)
        this.url = url
    }
}
class SqlError extends ErrorBase{
    constructor(sql,params,error,obj){
        super('Sql',error,obj)
        this.sql = sql
        this.params = params
    }
}
class ClientError extends ErrorBase{
    constructor(url,error,obj){
        super('client',error,obj)
        this.url = url
    }
}
exports.Log = Log
exports.log = new Log()
exports.log404 = new Log404()
exports.ReqError = ReqError
exports.SqlError = SqlError
exports.ClientError = ClientError
