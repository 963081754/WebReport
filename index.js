const port = 80
const express = require('express')
const app = express()

const compression = require('compression')
app.use(compression())

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static('public',{index:'default.html'}))
require('./utility/object.extension')
const ulog = require('./utility/log')

app.post('/error',function(req,res){
  const errorObj = req.body
  ulog.log.write(new ulog.ClientError(errorObj.url,errorObj.error))
  res.send()
}) // 客户端 提交 错误日志 的接口

{
  const fs = require('fs')
  const dll = require('./dll/index')
  const settingDll = new dll.Setting()

  app.use(function (req, res, next) {
    console.log(`=> ${new Date().toLocaleString()} ${req.originalUrl}`)
    next()
  }) // 记录请求
  
  // app.get('/video/*', function (req, res){
  //   res.sendFile(`${__dirname}/public/404.html`, {
  //       status: 404,
  //       title: 'NodeBlog'
  //   })
  // }) // 打开视频不需要登陆

  app.post('/feedback',function(req,res){
    const { contact, guestbook } = req.body    
    const content = JSON.stringify({ id:req.id, datetime:new Date().toLocaleString(), contact, guestbook})
    fs.writeFile(`${__dirname}/logs/feedback.txt`, `${content}\r\n`,{ flag: 'a+' }, error => {  
      if(error){
        console.error(`反馈保存失败：${content}`,error)
      }    
    })
    res.send(true)
  })

  app.get([
    /^\/[_0-9a-z]+\/?$/i,  
    /^\/[_0-9a-z]+\/login\/?$/i,
    /^\/[_0-9a-z]+\/\d+\/?$/i,
    /^\/[_0-9a-z]+\/\d+\/login\/?$/i,
  ],async function(req,res,next){
    const userTypeHash = req.originalUrl.split('/')[1].toLowerCase()
    if(['api','frontApi','admin'].includes(userTypeHash)){
      return next()
    }
    const setting = await settingDll.get(1)
    const userType = setting.userTypes.find(t=>t.path.toLowerCase() === userTypeHash)
    if(!userType){
      return next()
    }    
    res.sendFile(`${__dirname}/public/front.html`)
  })
} // 输出 前台的html页面

const adminRouter = require('./path/admin')
const userRouter = require('./path/home')
app.use('/admin',adminRouter)
app.use('/frontApi',userRouter)

app.get('*', function (req, res){
  console.log(`=> 404 handler.. ${req.originalUrl}`)
  ulog.log404.write(req.originalUrl)
  res.sendFile(`${__dirname}/public/404.html`, {
      status: 404,
      title: 'NodeBlog'
  })
}) // 所有路由定义完之后，最后做404处理

app.use(function (error, req, res, next) {
  console.log(`请求错误(${new Date().toLocaleString()})：${req.originalUrl}`)
  if(error.originalError){
    error = error.originalError
  }
  if(error.message !== '请先登录'){
    ulog.log.write(new ulog.ReqError(req.originalUrl,error))
    console.log(`-----------global error：${req.originalUrl} | ${new Date().toTimeString().split(' ')[0]}------------`)
    console.error(error.message,error.stack)
    console.log('-----------end------------')
  }else{
    // console.error(error.message)
  }
  // res.set({
  //   'Content-Type': 'text/html;charset=utf-8'
  // })
  res.status(500).send(`${error.message}`)
  // res.status(500).send(error)
})

app.listen(port, () => {
  process.title = '通用在线报表试用版'
  console.log(`网站监听启动：localhost:${port}`)
})
