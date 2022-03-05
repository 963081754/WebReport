const common = require('./common')

const express = common.express
const cookieSession = common.cookieSession
const format = common.format

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

const nullstr = common.nullstr
const chainPageSize = common.chainPageSize
const chainPipes = common.chainPipes

const ReportWidget = common.ReportWidget
const wrap = common.wrap

const userRouter = express.Router()
{
  const sessionKey = 'user-session'
  const router = userRouter

  router.use(wrap(async function (req, res, next) {
    req.userTypeHash = req.headers['user-type-hash'] // url hash
    if(req.userTypeHash){
        const setting = await settingDll.get(1)
        const userType = setting.userTypes.find(t=>t.path === req.userTypeHash)
        if(!userType){
            throw Error('URL路由 不正确')
        }
        req.headers.userType = userType
    }else{
        throw Error('URL路由 不正确')
    }
    await next()
  })) // URL 把关 + 获取 用户类型ID

  router.use(cookieSession({
    name: sessionKey,
    keys: ['U相互A）-23RUIJICyg&^82','SCIO*(w81JXpmcrb,2[3p'],
    // Cookie Options
    maxAge: 24*60*60*1000 // 24小时
  }))

  router.get('/userType',wrap(async function(req,res){    
    res.json({
      id: req.headers.userType.id,
      name: req.headers.userType.name,
      path: req.headers.userType.path
    })
  }))

  router.post('/login',wrap(async function(req,res){
    const { username, password } = req.body
    const setting = await settingDll.get(1)
    const userType = setting.userTypes.find(t=>t.id == req.headers.userType.id)
    if(userType.userApi){
        const url = userType.userApi.replace('{username}',username).replace('{pwd}',password)
        const str = await utility.loadPage(url)
        const { error,msg,data } = JSON.parse(str || '')
        if(!error){
          req.session[req.userTypeHash] = data // 以此：支持多用户类型 登录。
          res.json(data)
        }else{
            throw Error(msg)
        }
    }else{
        res.json({error:true,msg:'未设置用户登录接口',data:{}})
    }
  })) // 调用登录接口 登录：支持多用户类型 登录。
  router.get('/logout', wrap(async function(req, res){
    req.session[req.userTypeHash] = null
    res.json(true)
  })) // 退出
  router.get('/loginInfo', wrap(async function(req, res){
    const model = req.session[req.userTypeHash] 
    if(model){
      res.json(model)  
    }else{
      throw Error('请先登录')
    }
  })) // 从session获取用户的登陆信息 

  router.use(wrap(async function (req, res, next) {
    req.loginUser = req.session[req.userTypeHash]
    if(req.loginUser){      
      // req.session.nowInMinutes = Math.floor(Date.now() / 5*60e3) // 5分钟重新发送一次 // Date.now() // 滑动过期
      await next()
    }else{
      throw Error('请先登录')
    }  
  })) // 登录验证

  router.get('/roles',wrap(async function (req, res) {
    const setting = await settingDll.get(1)
    const userType = setting.userTypes.find(t=>t.id == req.headers.userType.id)
    if(userType.roleApi){
      const data = await utility.loadPage(userType.roleApi)
      res.json(JSON.parse(data || '[]'))
    }else{
      res.json([])
    }
  })) // 远程 获取角色

  router.use('/category',express.Router()
    .get('/list',wrap(async function (req, res) {
      const list = await new dll.Category(req.headers.userType.id).getList()
      list.sort((a,b)=>a.pid === b.pid ? a.seq - b.seq : a.pid - b.pid)
      res.json(list)
    }))
  )

  router.use('/chain',express.Router()
    .all('*', wrap(async function (req, res,next) {
      const id = req.method === 'GET' ? req.query.id : req.body.id
      if(id){
        const model = await await chainDll.get(id)
        if(model && !models.Chain.new(model).userTypeVerify(req.headers.userType.id)){
          throw Error(`没有访问权限`)
        }
        // req.model = model // 给后面的处理函数用，丢掉浪费
      }
      next()
    })) // 用户类型验证
    .get('/list',wrap(async function (req, res) {
      let list = await chainDll.getList()
      list = list.map(t=>models.Chain.new(t))
        .filter(t=>!t.userType || t.userType == req.headers.userType.id)
        .filter(t=>t.userTypeVerify(req.headers.userType.id)) // 用户类型过滤
        .map(t=>t.toUserJson())
      res.json(list)
    }))
    .post('/data/paging',wrap(async function (req, res) {
      const { id, sign, pageIndex = 1, pageSize = chainPageSize, searchers = {}, withTotal } = req.body      

      const releaseTotalData = { key: `${sign}_total`, data: null } // 回应“/paging/total”请求的数据
      let paging,asyncTotal
      try{
        const  { paging:paging2, asyncTotal:asyncTotal2 } = await chainDll.dataPaging(id, parseInt(pageIndex), parseInt(pageSize), searchers,req.loginUser,withTotal)
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
      const { id, itemIds } = req.body
      const  data = await chainDll.getValueItems(id, itemIds,req.loginUser)
      res.json(data)
    }))
    .post('/data/layerByDid',wrap(async function (req, res) {
      const { id,descendantId } = req.body
      const  data = await chainDll.dataLayerByDid(id,req.loginUser,descendantId)
      res.json(data)
    }))
    .post('/data/layerByPid',wrap(async function (req, res) {
      const { id,pid } = req.body
      const  data = await chainDll.dataLayerByPid(id,req.loginUser,pid)
      res.json(data)
    }))
  )

  router.use('/report',express.Router()
    .get('/list/less',wrap(async function (req, res) {
      let list = await new dll.Report(req.headers.userType.id).getListless()
      list = list.filter(t=>t.enabled && !t.hide).filter(t=>ReportWidget.roleVerify(t,req.loginUser)) // 权限过滤
        .map(t=>new models.Report(t)).sort((a,b)=>a.category_id === b.category_id ? a.seq - b.seq : a.category_id - b.category_id)
        .map(t=>t.toUserJson2())
      res.json(list)
    }))
    .post('/paging',wrap(async function (req, res) {
      const { pageSize, pageIndex, model:clientModel, sign, withTotal } = req.body // clientModel只需要id+demands的value

      const releaseChainsData = { key: sign, data: null } // 回应“/paging/chains”请求的数据
      const releaseTotalData = { key: `${sign}_total`, data: null } // 回应“/paging/total”请求的数据

      let paging, columns, asyncTotal
      try{
        {
          const model = await new dll.Report(req.headers.userType.id).get(clientModel.id)
          if(!model || !model.enabled){
            throw Error(`报表不存在(id:${clientModel.id})`)
          }
        } // enabled判断

        const { paging:paging2, columns:columns2, asyncTotal:asyncTotal2 } = await ReportWidget.pagingForUser(req.headers.userType.id,req.loginUser,{id:clientModel.id,demands:clientModel.demands},pageSize,pageIndex,withTotal)
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
      ReportWidget.pagingChains(columns,paging.list,existedSqlChains, req.loginUser).then(data=>{
        releaseChainsData.data = data
      }).finally(()=>{
        chainPipes.release(releaseChainsData)
      })  // 分页有关的chains 提交到chainPipes 给“/paging/chains”请求接收
      // releaseChainsData.data = await ReportWidget.pagingChains(columns,paging.list,existedSqlChains,req.loginUser) // 分页有关的chains 提交到chainPipes 给“/paging/chains”请求接收
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
      chainPipes.consume(sign).then(data=>{
        res.json(data || [])
      })
    }))
    .get('/full',wrap(async function (req, res) {
      const { id } = req.query
      const model = await new dll.Report(req.headers.userType.id).get(id)
      if(!model || !model.enabled){
        throw Error(`报表不存在(id:${id})`)
      }

      if(!ReportWidget.roleVerify(model,req.loginUser)){
        throw Error(`没有查看该报表的权限`)
      } // 权限判断

      res.json(ReportWidget.getReportAsUserJson(model))

      // const instance = new models.ServerReport(model) // json 转为 实例
      // instance.renewValueFromDefaultValue() // 默认值 设置
      // instance.makeUpDemands()
      // res.json(instance.toUserJson())
    }))
    .post('/adapter',wrap(async function (req, res) {
      const { id } = req.body
      let list = await new dll.Report(req.headers.userType.id).getList()
      list = list.filter(t=>ReportWidget.roleVerify(t,req.loginUser)) // 权限过滤
      let model = list.find(t=>t.id == id)
      if(!model){        
        model =  await new dll.Report(req.headers.userType.id).get(id) // 不判断权限
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
        model = await new dll.Report(req.headers.userType.id).get(model.id)
      }

      res.json(ReportWidget.getReportAsUserJson(model))
    })) // 获取报表，如果没有权限，则获取与它共享SQL的有权限的报表，否则throw。
    .post('/download',wrap(async function (req, res) {
      let { model } = req.body // model只需要id+demands的value
      if(!model.enabled){
        throw Error(`报表不存在(${model.id})`)
      }
      const data = await ReportWidget.download(req.headers.userType.id,req.loginUser,model)

      const buffer = common.xlsx.build([{name: model.name, data }])
      res.set('Content-Type', 'application/octet-stream')
      res.send(buffer)
    })) // 解决了“别针”，还需要“格式化”+“自定义列”！！！！！！
  )
  
}

module.exports = userRouter