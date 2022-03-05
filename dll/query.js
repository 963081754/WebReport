const sqlserver = require('mssql') // https://github.com/tediousjs/node-mssql
const ulog = require('../utility/log')

/** 
Server=localhost,1433;Database=database;User Id=username;Password=password;Encrypt=true
Driver=msnodesqlv8;Server=(local)\INSTANCE;Database=database;UID=DOMAIN\username;PWD=password;Encrypt=true
demo:
mssql://username:password@localhost:1433/database?encrypt=true
mssql://username:password@localhost/INSTANCE/database?encrypt=true&domain=DOMAIN&driver=msnodesqlv8
 */

const pools = {}

async function getPool(name, config) {
    if (!Object.prototype.hasOwnProperty.call(pools, name)) {
        const pool = new sqlserver.ConnectionPool(config)
        const close = pool.close.bind(pool)
        pool.close = (...args) => {
            delete pools[name]
            return close(...args)
        }
        // pool.config.connectionTimeout = 60000 默认15000 // mssql远程连接总超时，郁闷。
        await pool.connect()
        pools[name] = pool
    }
    const pool = pools[name]
    if(!pool._connected){
        await pool.connect()
    }
    return pool
}

function closeAll() {
    return Promise.all(Object.values(pools).map((pool) => {
        return pool.close()
    }))
}

function getConnectString({host,account:username,password,name:db,instance,port} = {}){
    if(!host){
        throw Error(`数据库不存在`)
    }
    port = port || 1433
    return instance ? `mssql://${username}:${password}@${host},${port}/${instance}/${db}`
    : `mssql://${username}:${password}@${host}:${port}/${db}`
}


async function testConnect(host,username,password,db,instance,port) {
    const connectString = getConnectString({host,account:username,password,name:db,instance,port})
    // console.log(connectString)
    try{
        await sqlserver.connect(connectString)
    }catch(err){
        throw Error(err.message)
    }
    await sqlserver.close()
    return true
}

async function executeSql(db,sql,params) {
    const connectString = getConnectString(db)
    // console.log(connectString)
    let pool
    try{
        pool = await getPool(db.id,connectString)
    }catch(error){
        ulog.log.write(new ulog.SqlError(connectString,undefined,error))
        throw Error(`数据库链接失败(${error.message})`)
    }
    const com = await pool.request()
    if(params && params.length > 0){
        params.forEach(param=>{
            com.input(param.name,param.value)
        })
    }
    try{
        const result = await com.query(sql)
        // console.log(sql,params)
        return result
    }catch(error){
        ulog.log.write(new ulog.SqlError(sql,params,error))
        console.log(sql)
        console.log(params)
        console.error(error)
        throw error
        // throw Error(`SQL执行错误(${error.message})`)
    }
}

exports.executeSql = executeSql
exports.testConnect = testConnect