const port = 3300
const express = require('express')
const app = express()

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
const query = require('./query')
const { urlencoded } = require('express')

//#region 

const wrap = function (fu) {
  return function(...args) {
    fu(...args).catch(args[2])
  }
}

app.use(function(req, res, next){
  console.log('url:',decodeURI(req.originalUrl))
  next()
})

app.get('/staff/role', wrap(async function(req, res){
  const sql=`select uuid id,name,[state] from role`
  const { recordset } = await query.executeSql(sql)
　res.json(recordset)
}))

app.get('/staff/tst/:roleid?', wrap(async function(req, res){
  const { roleid } = req.params
  const params = [
    {name:'roleid',value:roleid}
  ]
  let sql=`select top 1
    empUuid id,
    empUsername username,
    empName name,
    depUuid 部门id,
    companyId 公司id
    from v_emp_indexed 
    order by newid()`
  if(roleid){
    sql = `SELECT TOP 1
            a.empUuid id,            
            a.empUsername username,
            a.empName name,
            a.depUuid 部门id,
            a.companyId 公司id
          FROM v_emp_indexed a inner join emp_role b on a.empUuid=b.empUuid
          WHERE b.roleUuid = @roleid
          ORDER BY newid()`
  }
  const { recordset } = await query.executeSql(sql,params)
  const model = recordset[0]
  if(model){
    const { recordset } = await query.executeSql(`select * from emp_role where empUuid = '${model.id}'`)
    model.roles = recordset.map(t=>t.roleUuid)
  }
  // throw Error('时光网4 34它34 ')
　res.json(model)
}))

app.get('/staff/:username/:password', wrap(async function(req, res){
  const { username, password } = req.params
  const params = [
    {name:'username',value:username},
    {name:'password',value:password}
  ]
  const sql=`select top 1
    empUuid id,
    empUsername username,
    empName name,
    depUuid 部门id,
    companyId 公司id
    from v_emp_indexed 
    where empUsername=@username and empPwd=@password`
  const { recordset } = await query.executeSql(sql,params)
  const model = recordset[0]
  if(model){
    const { recordset } = await query.executeSql(`select * from emp_role where empUuid = '${model.id}'`)
    model.roles = recordset.map(t=>t.roleUuid)
  }
  const result = {
    error: !model,
    msg: model ? null : '账号或密码不正确',
    data: model || null
    // data: model || {id:null,username:null,name:null,roles:[11,22,33],'部门id':null,'公司id':null}
  }
　res.json(result)
}))

app.get('/customer/tst/:roleid?', wrap(async function(req, res){
  const { roleid } = req.params
  const params = [
    {name:'roleid',value:roleid}
  ]
  const sql=`select top 1 uuid id,account username,name from supplier where type=0 order by newid()`
  const { recordset } = await query.executeSql(sql,params)
  const model = recordset[0]
  if(model){
    model.roles = []
  }
　res.json(model)
}))

app.get('/customer/:username/:password', wrap(async function(req, res){
  const { username, password } = req.params
  const params = [
    {name:'username',value:username},
    {name:'password',value:password}
  ]
  const sql=`select uuid id,account username,name from supplier where account=@username and pwd=@password and type=0`
  const { recordset } = await query.executeSql(sql,params)
  const model = recordset[0]
  if(model){
    model.roles = []
  }
  const result = {
    error:!model,
    msg:model ? null : '账号或密码不正确',
    data: model || null //model || {id:null,username:null,name:null,roles:[11,22,33]}
  }
　res.json(result)
}))

app.get('/supplier/tst/:roleid?', wrap(async function(req, res){
  const { roleid } = req.params
  const params = [
    {name:'roleid',value:roleid}
  ]
  const sql=`select top 1 uuid id,account username,name from supplier where type=1 order by newid()`
  const { recordset } = await query.executeSql(sql,params)
  const model = recordset[0]
  if(model){
    model.roles = []
  }
　res.json(model)
}))

app.get('/supplier/:username/:password', wrap(async function(req, res){
  const { username, password } = req.params
  const params = [
    {name:'username',value:username},
    {name:'password',value:password}
  ]
  const sql=`select uuid id,account username,name from supplier where account=@username and pwd=@password and type=1`
  const { recordset } = await query.executeSql(sql,params)
  const model = recordset[0]
  if(model){
    model.roles = []
  }
  const result = {
    error:!model,
    msg:model ? null : '账号或密码不正确',
    data: model || null // model || {id:null,username:null,name:null,roles:[11,22,33]}
  }
　res.json(result)
}))

app.use(function (err, req, res, next) {
  console.error(err.stack)
  // res.status(500).send(`${err.message}，${err.stack}`)
  res.status(500).send(`${err.message}`)
})

app.listen(port, () => console.log(`UserApi app listening on port ${port}!`))

//#endregion