const sqlserver = require('mssql') // https://github.com/tediousjs/node-mssql
// const sqlserver = require('mssql/msnodesqlv8')
/** 
Server=localhost,1433;Database=database;User Id=username;Password=password;Encrypt=true
Driver=msnodesqlv8;Server=(local)\INSTANCE;Database=database;UID=DOMAIN\username;PWD=password;Encrypt=true
demo:
mssql://username:password@localhost:1433/database?encrypt=true
mssql://username:password@localhost/INSTANCE/database?encrypt=true&domain=DOMAIN&driver=msnodesqlv8
 */

function getConnectString({host,account:username,password,name:db,instance,port}){
    port = port || 1433
    return instance ? `mssql://${username}:${password}@${host},${port}/${instance}/${db}`
    : `mssql://${username}:${password}@${host}:${port}/${db}`
}

async function testConnect(host,username,password,db,instance,port,sql) {
    const connectString = sql || getConnectString({host,account:username,password,name:db,instance,port})
    console.log(connectString)
    try{
    await sqlserver.connect(connectString)
    await sqlserver.close()
    console.log('成功')
    }catch(error){
        console.log(error)
    }
}

// const sql = 'Server=LSY,1433;Database=ERP_EMP;User Id=sa;Password=12345;Encrypt=false;timeout=5;'
// error: 'Driver={SQL Server Native Client 11.0};Server={LSY\\SQLEXPRESS};Database={YTMaster};Uid={sa};Pwd={12345};Trusted_Connection={false};'
// error:'Driver={SQL Server Native Client 11.0};Server={LSY,1433};Database={ERP_EMP};Uid={sa};Pwd={12345};Trusted_Connection={false};'
// 'Driver={SQL Server Native Client 11.0};Server={LSY,1433};Database={ERP_EMP};Uid={sa};Pwd={12345};Trusted_Connection={true};'
// 'Driver=msnodesqlv8;Server=LSY\\SQLEXPRESS;Database=YTMaster;UID=DOMAIN\\sa;PWD=12345;Encrypt=false'
// 'Server=localhost,1433;Database=ERP_FULL;User Id=sa;Password=12345;Encrypt=false'
// 'mssql://sa:12345@localhost:1433/ERP_FULL?encrypt=false'
// testConnect('.','sa','12345','ERP_FULL','','',null)

{
    // const os = require("os")
    // console.log(os.networkInterfaces())
} // mac

{
    const path = require('path')
    const child = require('child_process')

    // const ls = child.exec('ffplay demo.mp4 -loglevel level+info')
    // const ls = child.spawn('ffplay',['demo.mp4','-loglevel','level+info'],{stdio: 'inherit'})
    const ls = child.spawn('ffplay',['demo.mp4','-loglevel','level+info'])
    console.log(ls)

    // setInterval(() => {
    //     console.log('p')
    //     const t = ls.stdin.write('p')
    //     console.log(t)
    // }, 1000*5)

    process.stdin.on('readable',data=>{
        let chunk;
        while (null !== (chunk = process.stdin.read())) {
            console.log(`读取 ${chunk.length}|${chunk} 字节的数据`)
            ls.stdin.write(chunk)
        }
    })

    ls.stdin.on('data', (data) => {
        console.log(`stdin:${data}`)
    })

    ls.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`)
    })

    ls.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`)
    })

    ls.on('close', (code) => {
        console.log(`子进程退出，退出码 ${code}`)
    })

    // ls.on('message', (code) => {
    //     console.log(`message ${code}`)
    // })
}
