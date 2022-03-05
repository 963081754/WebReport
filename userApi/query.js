const sqlserver = require('mssql')
const connectString = 'mssql://reader1:~a123456@localhost:1433/ERP_FULL'
// const connectString = `mssql://reader2:~a12345@localhost,1433/SQLEXPRESS2012/ERP_EMP`

async function executeSql(sql,params) {
    let request = await sqlserver.connect(connectString)
    if(params && params.length > 0){
        request = new sqlserver.Request()
        params.forEach(param=>{
            request.input(param.name,param.value)
        })
    }
    try{
        const result = await request.query(sql)
        return result
    }catch(err){
        console.log(sql)
        throw Error(err.message)
    }
}

exports.executeSql = executeSql