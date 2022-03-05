const http = require('http')

const port = 3000
const express = require('express')
const app = express()

app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.use(express.static('public'))
const query = require('./dll/query')
const { createCipher } = require('crypto')

function loadPage(url) {
  var pm = new Promise(function (resolve, reject) {
      http.get(url,{headers:{
        referer: 'http://www.oklabs.cn/',
        host: 'www.oklabs.cn',
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.3 Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36'
      }}, function (res) {
          var html = ''
          res.on('data', function (d) {
              html += d.toString()
          })
          res.on('end', function () {
              resolve(html)
          })
      }).on('error', function (e) {
          reject(e)
      })
  })
  return pm
}
function loadList(id,page=1) {
  return new Promise(async function (resolve, reject) {
    try{
      let result = []
      const html = await loadPage(`http://www.oklabs.cn/category.php?id=${id}&page=${page}`)
      const reg = /<a href="javascript:collect\((\d+?)\);" class="choose-btn-coll"><i class="iconfont icon-zan-alt"><\/i>收藏<\/a>/img
      const hrefs = html.match(reg)
      // if(page === 1) console.log(`${id}：`)
      if(hrefs){
        result = hrefs.map(t=>t.match(/\d+/)).map(t=>t[0])
        result = result.unique()
        // console.log(JSON.stringify(result))
        if(page === 1){
          const pageReg = /<div class="item"><a href="http:\/\/www.oklabs.cn\/category.php\?id=3103&amp;page=\d+&amp;sort=last_update&amp;order=DESC">\d+<\/a><\/div>/img
          const pages = html.match(pageReg)
          if(pages){
            const pageIndexs = pages.map(t=>t.match(/page=\d+/)[0]).map(t=>t.match(/\d+/)[0])
            for(let i=0;i<pageIndexs.length;i++){
              const nums = await loadList(id,pageIndexs[i])
              result = result.concat(nums)
              // console.log(result.length)
            }
          }
        }
      }
      resolve(result)
    }catch(err){
      reject(err)
    }
  })
}
function loadDetail(id) {
  return new Promise(async function (resolve, reject) {
    try{                         //http://www.oklabs.cn/goods.php?id=776168
      const html = await loadPage(`http://www.oklabs.cn/goods.php?id=${id}`)
      const name = (html.match(/<h1 style="font-size:16px;">.+?<\/h1>/) || [''])[0].replace(/(<.+?>|<\/.+?>)/img,'')
      const summary = (html.match(/<h3 style="font-size:14px;">.+?<\/h3>/) || [''])[0].replace(/(<.+?>|<\/.+?>)/img,'')
      const detail = (html.match(/<div class="gm-f-item gm-f-details" ectype="gm-item">(.|\r|\n)+?<!-- <div class="gm-f-item gm-f-comment" ectype="gm-item">/) || [''])[0]
        .replace('<div class="gm-f-item gm-f-details" ectype="gm-item">','')
        .replace(/<\/div>\s+?<!-- <div class="gm-f-item gm-f-comment" ectype="gm-item">/,'')
        .replace(/<div class="gm-title">(.|\r|\n)+?<\/div>/,'')
        .replace(/<div class="goods-para-list">(.|\r|\n)+?<\/div>/,'')
      const price = (html.match(/<strong class="shop-price" id="ECS_SHOPPRICE" ectype="SHOP_PRICE">(\s|\S)+?<\/strong>/) || [''])[0].match(/(\d|\.)+/)[0]
      const content = (html.match(/<div class="summary-basic-info">((.|\r|\n)+?)<div class="summary-item is-stock">/img) || [''])[0].replace(/<!--.+?-->/img,'')
      const names = content.match(/<div class="si-tit">(.+?)<\/div>/img).map(t=>t.replace(/(<.+?>|<\/.+?>)/img,''))
      const values = content.match(/<div class="si-warp">(.+?)<\/div>/img).map(t=>t.replace(/(<.+?>|<\/.+?>)/img,''))

      const obj = {'名称':name,'简述':summary,'描述':detail,'价格':price,'别名':'','单位':'','品牌':'','大包装':''}
      names.forEach((name,i)=>obj[name]= values[i])
      resolve(obj)
    }catch(err){
      reject(err)
    }    
  })
}

app.get('/g2',async function(req, res) {
  // const obj = await loadDetail(7713612)
  // res.json(obj) 
  loadDetail(771361).then(obj=>{
    res.json(obj)
  }).catch(err=>{
    console.log(err)
    res.json(err.message)
  })
})

app.get('/g',async function(req, res) {
  const id = req.query.id
  const nums = await loadList(id)
  res.json(nums) 
})

app.get('/grab',function(req, res) {
  const url = req.query.url
  
  loadPage(url).then(function (d) {
    res.send(d)
    console.log(url)
  })
})

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send(`${err.message}，${err.stack}`)
})

app.listen(port, async () => {
  console.log(`Example app listening on port ${port}!`)
  return
  
  let k = 0
  const f = async function() {
    console.log(`开始:${k}`)
    const db = {account:'sa',password:'12345',host:'.',name:'erp2'}
    const {recordset:list} = await query.executeSql(db,'select id from goods where name is null')
    let total = list.length
    if(total.length === 0){
      console.log(`结束`)
      return
    }
    console.log(`total:${total}`)
    list.forEach(({id},i)=>{
      // console.log(`index:${i}`)
      try{
        loadDetail(id).then(obj=>{
          const params = Object.entries(obj).map(([key,value])=>({name:key,value}))
          try{
            query.executeSql(db,`update goods set [unit]=@单位,[alias]=@别名,[price]=@价格,[name]=@名称,[brand]=@品牌,[BigPackage]=@大包装,[mediumPackage]=@中包装,[describe]=@描述,[sketch]=@简述,[Specifications]=@规格 where id=${id}`,params)
            console.log(`成功：${id}`)
          }catch(err){
            // console.log(`sql error:${err.message}(${id})`)
            throw Error({message:`sql:${err.message}(${id})`})
          }
        }).catch(err=>{
          console.log(`抓取error:${err.message}(${id})`)
        }).finally(()=>{
          total = total - 1
          console.log(`倒数：${total}`)
          if(total<=0){
            f(++k)
          }
        })
      }catch(err){
        total = total - 1
        if(total<=0){
          f(++k)
        }
      }
    })
  }
  f(++k)

  const fun = async function(){
    const db = {account:'sa',password:'12345',host:'.',name:'erp2'}
    const {recordset:list} = await query.executeSql(db,'select * from goodsType2')
    console.log(`个数：${list.length}`)
    let total = 0
    list.forEach(({id},i)=>{
      console.log(`index:${i}`)
      loadList(id).then(goodIds=>{
        total += goodIds.length
        if(!goodIds.length) return
        console.log(`type成功：${id}`,goodIds)      
        try{
          const sql = goodIds.map(goodId=>(`(${goodId},${id})`)).join(',')
          // console.log(`insert into goods(id,typeId) values ${sql}`)
          query.executeSql(db,`insert into goods(id,typeId) values ${sql}`)
          console.log(`sql 成功(${id},${i})`)
        }catch(err){
          console.log(`sql error:${err.message}(typeId:${id})`)
        }
        // goodIds.forEach(goodId=>{        
        //   loadDetail(goodId).then(obj=>{
        //     obj.id = goodId
        //     const params = Object.entries(obj).map(([key,value])=>({name:key,value}))
        //     try{
        //       query.executeSql(db,`insert into goods values (@id,@价格,@别名,@价格,@名称,@品牌,@大包装,@中包装,@描述,@简述,@规格`,params)
        //       console.log(`good成功：${id,goodId}`)
        //     }catch(err){
        //       console.log(`error sql:${err.message}(goodId:${goodId})`)
        //     }
        //   }).catch(err=>{
        //     console.log(`error:${err.message}(goodId:${goodId})`)
        //   })
        // })      
      }).catch(err=>{
        console.log(`type error:${err.message}(:${id})`)
      }).finally(()=>{
        console.log(`index:${i},${total}`)
      })
    })
  }

  // fun()
})