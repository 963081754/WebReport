const common = require('./common')
const { SetWidth } = require('custompackages/models')

const express = common.express
const cookieSession = common.cookieSession

const query = common.query
const dll = common.dll
const models = common.models
const Paging = common.Paging
const SqlParser = common.SqlParser
const utility = common.utility

const dbDll = common.dbDll
const chainDll = common.chainDll
const settingDll = common.settingDll
const chinesizeDll = common.chinesizeDll

const ReportWidget = common.ReportWidget

const nullstr = common.nullstr
const chainPageSize = common.chainPageSize
const chainPipes = common.chainPipes
const wrap = common.wrap

const adminRouter = express.Router()
{
  const sessionKey = 'admin-session'
  const router = adminRouter

  router.use(cookieSession({
    name: sessionKey,
    keys: ['35sds2^*3r233','sd3@#fa5sfsa7f'],
    // Cookie Options
    maxAge: 24*60*60*1000 // 24小时
  }))
  router.post('/login',wrap(async function(req,res){
    const {mobile,password} = req.body
    const model = await settingDll.getAdmin(mobile,password)
    if(model){
      req.session.admin = { id:model.id, guid:`${utility.guid()}${utility.guid()}${utility.guid()}${utility.guid()}${utility.guid()}` } //  只用到model.id,guid是为了生成串的复杂度，没其他用处
    }
  　res.json(model)
  })) // 管理员登录
  router.get('/login',wrap(async function(req,res){
    const {mobile,password} = req.query
    const model = await settingDll.getAdmin(mobile,password)
    if(model){
      req.session.admin = { id:model.id, guid:`${utility.guid()}${utility.guid()}${utility.guid()}${utility.guid()}${utility.guid()}` } //  只用到model.id,guid是为了生成串的复杂度，没其他用处
    }
  　res.json(model)
  })) // 管理员登录，测试用的
  router.get('/logout', wrap(async function(req, res){
    req.session.admin = null
    res.json(true)
  })) // 管理员退出
  router.get('/loginInfo', wrap(async function(req, res){
    let model = null
    const loginInfo = req.session.admin
    if(loginInfo){
      model = await settingDll.get(loginInfo.id)
      if(model){
        model = await settingDll.getAdmin(model.mobile,model.password)
      }
    }
    if(model){
      res.json(model)  
    }else{
      throw Error('请先登录')
    }
  })) // 从session获取用户的登陆信息 

  router.use(wrap(async function (req, res, next) {
    if(req.session.admin){
      if(!req.headers.cuti){
        const model = await settingDll.get(req.session.admin.id)
        req.headers.cuti = model.userTypes[0].id
      }
      // req.session.nowInMinutes = Math.floor(Date.now() / 5*60e3) // 5分钟重新发送一次 // Date.now() // 滑动过期
      await next()
    }else{
      throw Error('请先登录')
    }  
  })) // 管理员登录验证

  router.use('/db',express.Router()    
    .put(nullstr,wrap(async function (req, res) {
      let model = req.body
      model = await dbDll.add(model)
      res.json(model)
    }))
    .post(nullstr,wrap(async function (req, res) {
      let model = req.body
      model = await dbDll.update(model)
      res.json(model)
    }))
    .delete(nullstr,wrap(async function (req, res) {
      const id = req.query.id
      const userTypeIds = (await settingDll.get(req.session.admin.id)).userTypes.map(t=>t.id)
      await dbDll.delete(id,userTypeIds)
      res.json(true)
    }))
    .post('/sort',wrap(async function (req, res) {
      const { id, index } = req.body
      model = await dbDll.sortByIndex(id, index)
      res.json(model)
    }))
    .get('/list',wrap(async function (req, res) {
      const list = await dbDll.getList()
      res.json(list)
    }))
    .get('/testConnect',wrap(async function (req, res) {
      const { host,instance,account:username,password,name:db,port } = req.query
      const data = await dbDll.testConnect(host,username,password,db,instance,port)
      res.json(data)
    }))
  )

  router.use('/chinesize',express.Router()
    .get('/list',wrap(async function (req, res) {
      const list = await chinesizeDll.getList()
      res.json(list)
    }))
    .put('/list',wrap(async function (req, res) {
      const list = req.body || []
      const result = list.map(t=>new models.Chinesize(t))
      await chinesizeDll.updateCnames(result)
      res.json(true)
    }))
  )

  router.use('/category',express.Router()
    .put(nullstr,wrap(async function (req, res) {
      let model = req.body
      model = await new dll.Category(req.headers.cuti).add(new models.Category(model))
      res.json(model)
    }))
    .post(nullstr,wrap(async function (req, res) {
      let model = req.body
      model = await new dll.Category(req.headers.cuti).update(new models.Category(model))
      res.json(model)
    }))
    .post('/sort',wrap(async function (req, res) {
      let model = req.body
      model = await new dll.Category(req.headers.cuti).sort(new models.Category(model))
      res.json(model)
    }))
    .delete(nullstr,wrap(async function (req, res) {
      const id = req.query.id
      const model = await new dll.Category(req.headers.cuti).delete(id)
      res.json(model)
    }))
    .get('/list',wrap(async function (req, res) {
      const list = await new dll.Category(req.headers.cuti).getList()
      list.sort((a,b)=>a.pid === b.pid ? a.seq - b.seq : a.pid - b.pid)
      res.json(list)
    }))
  )

  router.use('/chain',express.Router()
    .get(nullstr,wrap(async function (req, res) {
      const model = await chainDll.get(req.query.id)
      const instance = models.Chain.new(model)
      res.json(instance)
    }))
    .put(nullstr,wrap(async function (req, res) {
      let model = req.body
      model = await chainDll.add(model)
      res.json(models.Chain.new(model))
    }))
    .post(nullstr,wrap(async function (req, res) {
      let model = req.body
      model = await chainDll.update(model)
      res.json(models.Chain.new(model))
    }))
    .delete(nullstr,wrap(async function (req, res) {
      const id = req.query.id
      await chainDll.delete(id)
      res.json(true)
    }))
    .post('/sort',wrap(async function (req, res) {
      const { id, index } = req.body
      await chainDll.sortByIndex(id, index)
      res.json(null)
    }))
    .put('/query',wrap(async function (req, res) {
      const { id, name } = req.body
      const noQuerys = await chainDll.addQuery(id,name)
      res.json(noQuerys)
    }))
    .delete('/query',wrap(async function (req, res) {
      const { id, name } = req.query
      const noQuerys = await chainDll.removeQuery(id,name)
      res.json(noQuerys)
    }))
    .post('/cname',wrap(async function (req, res) {
      const { id, field } = req.body
      const json = await chainDll.updateFieldCname(id,field)
      res.json(new models.Field(json))
    }))
    .post('/colors',wrap(async function (req, res) {
      const { id, colors } = req.body
      const obj = await chainDll.updateColors(id,colors)
      res.json(obj)
    }))
    .post('/userKeys',wrap(async function (req, res) {
      const { id, userType, userKeys } = req.body
      const obj = await chainDll.updateUserKeys(id,userType,userKeys)
      res.json(obj)
    }))
    .get('/list',wrap(async function (req, res) {
      let list = await chainDll.getList()
      list = list.map(t=>models.Chain.new(t))
      res.json(list)
    }))
    .get('/list2',wrap(async function (req, res) {
      let list = await chainDll.getList()
      res.json(list)
    })) // 测试的
    .post('/data/layerByDid',wrap(async function (req, res) {
      const { id,user,descendantId } = req.body
      const  data = await chainDll.dataLayerByDid(id,user,descendantId)
      res.json(data)
    }))
    .post('/data/layerByPid',wrap(async function (req, res) {
      const { id,user,pid } = req.body
      const  data = await chainDll.dataLayerByPid(id,user,pid)
      res.json(data)
    }))
    .post('/data/paging',wrap(async function (req, res) {
      const { id, sign,user,  pageIndex = 1, pageSize = chainPageSize, searchers = {}, withTotal } = req.body      

      const releaseTotalData = { key: `${sign}_total`, data: null } // 回应“/paging/total”请求的数据
      let paging,asyncTotal
      try{
        const  { paging:paging2, asyncTotal:asyncTotal2 } = await chainDll.dataPaging(id, parseInt(pageIndex), parseInt(pageSize), searchers,user,withTotal)
        paging = paging2
        asyncTotal = asyncTotal2
      }catch(error){
        chainPipes.release(releaseTotalData)
        throw error
      }

      res.json({paging})

      if(asyncTotal instanceof Promise)
      {
        asyncTotal.then(({recordset:[{c:total}]})=>{
          releaseTotalData.data = total
        }).catch((error)=>{
          releaseTotalData.data = error.message
        }).finally(()=>{
          chainPipes.release(releaseTotalData)
        }) // 提交total
      }

      // const { id,user, pageIndex = 1, pageSize = chainPageSize, searchers = {} } = req.body
      // const  data = await chainDll.dataPaging(id, parseInt(pageIndex), parseInt(pageSize), searchers,user)
      // res.json(data)
    }))
    .post('/paging/total',wrap(async function (req, res) {
      const { sign } = req.body

      const total = await chainPipes.consume(`${sign}_total`)
      if(typeof(total) !== 'number'){
        throw Error(total)
      }else{
        res.json(total)
      } 
    }))
    .post('/data/items',wrap(async function (req, res) {
      const { id, itemIds, user } = req.body
      const  data = await chainDll.getValueItems(id, itemIds,user)
      res.json(data)
    }))
    .post('/testSql',wrap(async function (req, res) {
      const { sql, db_id,user } = req.body
      const db = await dbDll.get(db_id)
      const result = await chainDll.testSql(sql,db,user)
      res.json(result)
    }))
  )

  router.use('/setting',express.Router()    
    .get('/testUserApi',wrap(async function (req, res) {
      const type = req.query.type
      let url = req.query.url
      switch(type){
        case 'userApi':
          if(!url.includes('{username}') || !url.includes('{pwd}')){
            throw Error('登录接口 需要参数标签{username}和{pwd}')
          }
        break
        case 'userTstApi':
          const roleUrl = url.split(' ')[1].trim()
          url = url.split(' ')[0].trim()
          let roles = null
          if(roleUrl){
            if(!url.includes('{roleid}')){
              throw Error('后台用户测试接口 需要参数标签{roleid}')
            }            
            try{
              roles = await utility.loadPage(roleUrl)
            }catch(error){
              throw error
            }
            try{
              roles = JSON.parse(roles)
            }catch(error){
              throw Error(roles)
            }
          }          
          const roleid = roles ? roles[parseInt(Math.random()*(roles.length-1))+1].id : '' // 随意用一个roleid
          url = url.replace('{roleid}',roleid)
        break
      }

      try{
        const data = await utility.loadPage(url)
        res.send(data)
      }catch(error){
        throw Error(`接口调用失败：${error.message}`)
      }      
    })) // 测试远程接口
    .get('/roles',wrap(async function (req, res) {
      const { id,userTypeId} = req.query
      const data = await settingDll.getRoles(id,userTypeId)
      res.send(data)
    })) // 远程 获取角色
    .get('/userMetadata',wrap(async function (req, res) {
      const { id,userTypeId} = req.query
      if(await settingDll.hasUserTstApi(id,userTypeId)){
        const user = await settingDll.getTstUser(id,userTypeId)
        res.send(user)
      }else{
        res.send(null)
        // throw Error(`未设置【用户接口】`)
      }
    })) // 远程 获取用户（数据结构） 
    .get('/testUsers',wrap(async function (req, res) {
      const { id,userTypeId} = req.query

      const users = await settingDll.getTstUsers(id,userTypeId)
      res.send(users)
    })) // 测试远程接口
    .post(nullstr,wrap(async function (req, res) {
      let model = req.body
      model = await settingDll.update(model)
      res.json(model)
    }))
  )

  router.use('/report',express.Router()
    .get(nullstr,wrap(async function (req, res) {
      const id = req.query.id
      let model = await new dll.Report(req.headers.cuti).get(id)
      model = new models.Report(model)
      res.json(model)
    }))
    .put(nullstr,wrap(async function (req, res) {
      let model = req.body  
      model = await new dll.Report(req.headers.cuti).add(model)
      model = new models.Report(model)
      res.json(model)
    }))
    .post(nullstr,wrap(async function (req, res) {
      let model = req.body
      model = await new dll.Report(req.headers.cuti).update(model)
      model = new models.Report(model)
      res.json(model)
    }))
    .delete(nullstr,wrap(async function (req, res) {
      const id = req.query.id
      await new dll.Report(req.headers.cuti).delete(id)
      res.json(true)
    }))
    .put('/copy',wrap(async function (req, res) {
      const { source_id, newName } = req.body
      model = await new dll.Report(req.headers.cuti).copy(source_id,newName)
      model = new models.Report(model)
      res.json(model)
    }))
    .post('/enable',wrap(async function (req, res) {
      const { id, enable } = req.body
      await new dll.Report(req.headers.cuti).enable(id, enable)
      res.json(true)
    }))
    .post('/hide',wrap(async function (req, res) {
      const { id, hide } = req.body
      await new dll.Report(req.headers.cuti).hide(id, hide)
      res.json(true)
    }))
    .post('/sort',wrap(async function (req, res) {
      const { category_id,id1,id2,type } = req.body
      await new dll.Report(req.headers.cuti).sort(category_id,id1,id2,type)
      res.json(true)
    }))
    // .post('/sort',wrap(async function (req, res) {
    //   const model = req.body
    //   await new dll.Report(req.headers.cuti).sort(model)
    //   res.json(true)
    // }))
    .post('/star',wrap(async function (req, res) {
      const { id, star } = req.body
      await new dll.Report(req.headers.cuti).updateStar(id, star)
      res.json(true)
    }))
    .get('/list',wrap(async function (req, res) {
      const list = await new dll.Report(req.headers.cuti).getList()
      res.json(list)
    })) // 调试用:原始json
    .get('/list/less',wrap(async function (req, res) {
      let list = await new dll.Report(req.headers.cuti).getListless()
      list = list.map(t=>new models.Report(t)).sort((a,b)=>a.category_id === b.category_id ? a.seq - b.seq : a.category_id - b.category_id)
      res.json(list)
    }))
    .post('/parseSql',wrap(async function (req, res) {
      const {sql,dbId,user} = req.body
      const db = await dbDll.get(dbId)

      let big = false
      let list = []
      let totatl = 0
      const execuQuery = async function(top){
        const sqlParser = new SqlParser.Class(sql)
        sqlParser.top = top
        const pagingSql = sqlParser.getPagingSql(1,SqlParser.PageSize)
        const countSql = sqlParser.getCountSql()

        const { params } = dll.Report.buildUserSqlParams(pagingSql,user) // 解析user@参数

        const [{recordset:data},{recordset:[{c}]}] = await Promise.all([query.executeSql(db,pagingSql,params),query.executeSql(db,countSql,params)])
        list = data
        totatl = c
        list.forEach(r=>delete r[SqlParser.RowNumFieldName])
      }

      try{
        await execuQuery(10000) // 解析 只要1万条，不必要全部数据，万一数据量很大呢。
      }catch(error){
        if(error.message.includes('Timeout:')){
          await execuQuery(0) // 数据量太大，只解析结构。
          big = true
        }else{
          throw error
        }
      }

      // if(!list.columns){
      //   throw Error('解析失败，请重试')
      //   return
      // }
  
      const cnames = await chinesizeDll.getList()
      const columns = Object.values(list.columns).map(column=>{
        const item = cnames.find(t=>t.name === column.name)
        return {
          ename:column.name,
          cname:item ? item.cname : column.name,
          dataType:column.type.name,
          dataLength:column.length,
          dataPrecision:column.precision,
          dataScale:column.scale
        }
      })
      columns.splice(0,1)
  
      const instance = new models.Report({db_id: dbId, sql, columns})
      instance.makeUpDemands()
      const paging = new Paging(list,totatl,SqlParser.PageSize)
  
      res.json({
        model:instance, 
        paging, 
        msg:big ? '数据过大，因此只解析结构未查询数据；请设置查询条件，再单击“查询”按钮查询。' : undefined })
    }))
    .post('/paging',wrap(async function (req, res) {
      const { pageSize, pageIndex, model, sign, user, withTotal } = req.body     

      const releaseChainsData = { key: sign, data: null } // 回应“/paging/chains”请求的数据
      const releaseTotalData = { key: `${sign}_total`, data: null } // 回应“/paging/total”请求的数据
      // const errorResult = (msg)=>({
      //   // paging: new Paging([],0,pageSize,pageIndex),
      //   error: true,
      //   msg
      // })

      let paging, columns, asyncTotal
      try{
        const { paging:paging2, columns:columns2, asyncTotal:asyncTotal2 } = await ReportWidget.pagingForAdmin(model, pageSize, pageIndex, user, withTotal)
        paging = paging2
        columns = columns2
        asyncTotal = asyncTotal2
      }catch(error){
        // res.json(errorResult(error.message))
        chainPipes.release(releaseChainsData)  // 提交到一个空的total到chainPipes 给“/paging/total”请求接收
        chainPipes.release(releaseTotalData)  // 提交到一个空的chains到chainPipes 给“/paging/chains”请求接收
        throw error
      }

      res.json({paging}) // error、msg都为假，不必写出来了。

      if(asyncTotal instanceof Promise){
        asyncTotal.then(data=>{
          releaseTotalData.data = data
        }).finally(()=>{
          chainPipes.release(releaseTotalData)
        }) // 提交total
      }

      const existedSqlChains = JSON.parse(req.headers['existed-sql-chains'] || '[]')
      ReportWidget.pagingChains(columns,paging.list,existedSqlChains, user).then(data=>{
        releaseChainsData.data = data
      }).finally(()=>{
        chainPipes.release(releaseChainsData)
      }) // 提交chains

    }))
    .post('/paging/total',wrap(async function (req, res) {
      const { sign } = req.body

      const data = await chainPipes.consume(`${sign}_total`)
      if(!data){
        throw Error('未获取到总数')
      }else if(data.error){
        throw Error(`总数 ${data.error}`)
      }else{
        res.json(data.total)
      }
    }))
    .post('/paging/chains',wrap(async function (req, res) {
      const { sign } = req.body

      const data = await chainPipes.consume(sign)
      res.json(data || [])
    }))
    .get('/full',wrap(async function (req, res) {
      const { id } = req.query
      const model = await new dll.Report(req.headers.cuti).get(id)
      if(!model){
        throw Error(`报表不存在(id:${id})`)
      }
      res.json(ReportWidget.getReportAsClientReport(model))

      // const instance = new models.ServerReport(model) // json 转为 实例
      // instance.renewValueFromDefaultValue() // 默认值 设置
      // instance.makeUpDemands()
      // res.json(instance.toClientReport())
    }))
    .post('/adapter',wrap(async function (req, res) {
      const { id, user } = req.body
      let list = await new dll.Report(req.headers.cuti).getList()
      list = list.filter(t=>ReportWidget.roleVerify(t,user)) // 权限过滤
      let model = list.find(t=>t.id == id)
      if(!model){        
        model =  await new dll.Report(req.headers.cuti).get(id) // 不判断权限
        if(!model){
          throw Error(`报表不存在`)
        }

        const from_id = model.from_id || model.id
        model = list.find(t=>t.from_id === from_id) || 
                list.find(t=>t.id === from_id)
        if(!model){
          throw Error(`没有报表的访问权限`)
        }
      }

      if(model.from_id){  // 如果是 复制报表
        model = await new dll.Report(req.headers.cuti).get(model.id)
      }

      res.json(ReportWidget.getReportAsClientReport(model))
    })) // 获取报表，如果没有权限，则获取与它共享SQL的有权限的报表，否则throw。
    .post('/download',wrap(async function (req, res) {
      let { model,user } = req.body // model只需要id+demands的value
      const data = await ReportWidget.download(req.headers.cuti,user,model,true)

      const buffer = common.xlsx.build([{name: model.name, data }])
      res.set('Content-Type', 'application/octet-stream')
      res.send(buffer)
    },error=>{
      if(error.message && error.message.toLowerCase().includes('timeout of ')){
        error.message = '下载超时'
      }
    })) // 解决了“别针”，还需要“格式化”+“自定义列”！！！！！！
  )
  
}

module.exports = adminRouter