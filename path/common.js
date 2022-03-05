

const express = require('express')
const cookieSession = require('cookie-session')
const xlsx = require('node-xlsx')

const format = require('custompackages').format
const config = require('../config')
const ChainPipes = require('../utility/ChainPipes')

const query = require('../dll/query')
const dll = require('../dll/index')
// const models = require('../models/index')
const models = require('custompackages').models
const Paging = require('../utility/Paging')
const SqlParser = require('../utility/SqlParser')
const utility = require('../utility/index')
const { Promise } = require('mssql')
const { DataAttrs } = require('custompackages/models')

const dbDll = new dll.Db()
const chainDll = new dll.Chain()
const settingDll = new dll.Setting()
const chinesizeDll = new dll.Chinesize()

const nullstr = ''
const chainPageSize = 50
const chainPipes = new ChainPipes() // 给report/paging与report/paging/chains结合用

const wrap = function (fu,errorHandle) {
    return function(...args) {
      fu(...args).catch(error=>{
        if(typeof(errorHandle) === 'function'){
          errorHandle(error)
        }
        args[2](error)
      }) // args[2]=next函数
    }
}

class ReportWidget {
  static async _paging(params,pageSql,countSql,db_id,_pageSize, _pageIndex, user, withTotal){
    const pageSize = parseInt(_pageSize) || SqlParser.PageSize
    const pageIndex = parseInt(_pageIndex) || 1 
    
    {
      const { params:params2 } = dll.Report.buildUserSqlParams(pageSql,user)
      params = params.concat(params2)
    } // 解析user@参数
    // console.log(pageSql,params)
    const db = await dbDll.get(db_id)
    if(!db){
      throw Error('数据库 不存在')
    }
    let pageQuery
    // let countQuery
    let asyncTotal
    try{
      pageQuery = query.executeSql(db,pageSql,params)
      // countQuery = query.executeSql(db,countSql,params)
      // countQuery = Promise.resolve(10000*100)
      if(withTotal){
        asyncTotal = query.executeSql(db,countSql,params).then(({recordset:[{c:total}]})=>{
          return {total}
        }).catch(error=>{             
          return {error:error.message}     
        })
      }
    }catch(error){
      if(error.message.includes('is not a function')){ // 明显了！！！
        return {
          paging:new Paging([],0,30,1),
          asyncTotal: Promise.resolve(0)
        }
      }else{
        throw error
      }
    }
    // const [{recordset:list},{recordset:[{c:total}]}] = await Promise.all([pageQuery,countQuery]) // countQuery统计条数 拖累了速度，不合理！total要独立查。
    // const [{recordset:list},total] = await Promise.all([pageQuery,countQuery])
    const {recordset:list} = await pageQuery

    list.forEach(row=>delete row[SqlParser.RowNumFieldName])
    return {
      // paging: new Paging(list,total,pageSize,pageIndex),
      paging: new Paging(list,-1,pageSize,pageIndex),
      asyncTotal
    }
  }

  static async pagingForUser(userTypeId,loginUser, { id, demands },pageSize, pageIndex,withTotal){
    let { sqlParams, pageSql, countSql, db_id, columns } = await ReportWidget.buildSearchParts_user(userTypeId,loginUser,{id,demands},pageIndex,pageSize)
    columns = columns.filter(t=>t.enabled && !t.func)
    pageSql = SqlParser.Class.getRealSql(pageSql,columns,sqlParams.$params)
    countSql = SqlParser.Class.getRealSql(countSql,undefined,sqlParams.$params)

    const { paging, asyncTotal } = await ReportWidget._paging(sqlParams.params, pageSql, countSql, db_id, pageSize, pageIndex, loginUser,withTotal)
    return {
      paging,
      asyncTotal,
      columns
    }
  }

  static async pagingForAdmin(model, pageSize, pageIndex, user, withTotal){
    let { sqlParams, pageSql, countSql, db_id, columns } = await ReportWidget.buildSearchParts_admin(model,pageIndex,pageSize,user)
    pageSql = SqlParser.Class.getRealSql(pageSql,undefined,sqlParams.$params)
    countSql = SqlParser.Class.getRealSql(countSql,undefined,sqlParams.$params)

    const { paging, asyncTotal } = await ReportWidget._paging(sqlParams.params, pageSql, countSql, db_id, pageSize, pageIndex,user,withTotal)
    return {
      paging,
      asyncTotal,
      columns
    }
  }

  static async buildSqlParams(instance,pageIndex,pageSize){
    // const error = instance.getDemandError() // 获取“查询条件”错误信息(如果有)
    // if(error){
    //   throw Error(error.msg)
    // } // 由前端判断吧，因为有时候（如：打开链接报表）不需要默认值与非空
    let fragments = []
    let sqlParams = [
      {name:SqlParser.SqlPlaceholders.startPage,value:pageSize*(pageIndex - 1)},
      {name:SqlParser.SqlPlaceholders.endPage,value:pageSize * pageIndex}
    ]

    const chains = await chainDll.getList()
    const layerDemands = []
    const sqlParamFragments = instance.buildSqlWhereAndParams((demand,column)=>{
      const chain = chains.find(t=>t.id == column.kv)
      if(chain && chain.masterKeys && chain.masterKeys.pid){
        layerDemands.push({demand,column})
        return true
      }else{
        return false
      }
    }) // 构造 sql的查询条件+参数

    for(let i=0; i< layerDemands.length; i++){
      const { demand,column } = layerDemands[i]
      const { params,fragment } = await ReportWidget.buildLayerParam(demand,column)
      sqlParams = sqlParams.concat(params)
      fragments = fragments.concat([fragment])
    }

    sqlParams = sqlParams.concat(sqlParamFragments.params)
    fragments = fragments.concat(sqlParamFragments.fragments)
    {
      const aa = fragments.map(t=>({fragment:t,sort:models.getWhereFragmentPriority(t)}))
      aa.sort((a,b)=>a.sort-b.sort)
      fragments = aa.map(t=>t.fragment)
    } // 数据库会不会自动优化呢？

    return {
      params: sqlParams,
      $params: fragments
    }
  }

  static async buildLayerParam(demand,column){
    const chain = await chainDll.get(column.kv)
    if(!chain || !chain.masterKeys || !chain.masterKeys.pid) return null // 该条件不处理

    const childrenIds = await chainDll.dataLayer_findChildren(column.kv,demand.value.e)
    childrenIds.push(demand.value.e)
    const baseName = `id${parseInt((Math.random()+1)*1000)}`
    const params = childrenIds.map((id,i)=>({name:`${baseName}_${i}`,value:id}))
    if(params.length > 900){
      throw Error(`【${column.cname || column.name}】的子项已超过900个`)
    }
    let fragment
    if(params.length === 1){
      fragment = `${column.expr} = @${params[0].name}`
    }else{
      fragment = `${column.expr} in (${params.map(t=>`@${t.name}`).join(',')})`
    }
    
    return { params, fragment } // 该条件已处理
  }

  static async buildSearchParts_admin(model,pageIndex,pageSize,user){
    if(!ReportWidget.roleVerify(model,user)){
      throw Error(`用户的角色没有权限`)
    } // 权限判断

    {
      const sqlParser = new SqlParser.Class(model.sql)
      // if(model.userKeys && model.userKeys.length > 0){
      //   sqlParser.top = 10000 // 绑定了登录用户约束的 由于在管理后台 SQL并没有用上这个条件，所以只需要取1万条做个样子即可；前台要给出提示。 
      // }      
      model._pageSql = sqlParser.getPagingSql(1,SqlParser.PageSize,false)
      model._countSql = sqlParser.getCountSql(false)
      
      model.columns.filter(t=>!t.func).forEach(column=>{
        const field = sqlParser.outputFields.find(t=>t.alias === column.ename)
        if(!field){
          throw Error(`列(${column.cname})不存在`)
        }
        column.expr = field.expr
      })
    }  // 补全model的_pageSql、_countSql和_expr
    const instance = new models.ServerReport(model) // json 转为 实例
    instance.makeUpDemands()
    instance.demands.filter(t=>!t.enabled).forEach(d=>d.value = {}) // 禁用条件，客户端不能给值。
    instance.addUserKeysToDemand(user) // 添加 登录用户绑定 到查询条件

    return {
      sqlParams: await ReportWidget.buildSqlParams(instance,pageIndex,pageSize),
      pageSql: model._pageSql,
      countSql: model._countSql,
      db_id: model.db_id,
      columns: model.columns
    }
  }

  static async buildSearchParts_user(userTypeId,loginUser,{id,demands},pageIndex,pageSize){
    const model = await new dll.Report(userTypeId).get(id)
    
    if(!ReportWidget.roleVerify(model,loginUser)){
      throw Error(`用户的角色没有权限`)
    } // 权限判断
    const instance = new models.ServerReport(model) // json 转为 实例
    instance.makeUpDemands()
    instance.demands.filter(t=>!t.enabled).forEach(d=>d.value = {}) // 禁用条件，客户端不能给值。
    {
      instance.demands.forEach(demand=>{
        const clientDemand = demands.find(t=>t.ename === demand.ename)
        if(clientDemand){
          demand.value = clientDemand.value
        }
      })
    } // 拷贝客户端查询条件的值
    instance.addUserKeysToDemand(loginUser) // 添加 登录用户绑定 到查询条件

    return {
      sqlParams: await ReportWidget.buildSqlParams(instance,pageIndex,pageSize),
      pageSql: model._pageSql,
      countSql: model._countSql,
      db_id: model.db_id,
      columns: model.columns
    }
  }

  static async pagingChains(columns,list,existedSqlChains,loginUser = null){ // list必须限制length，否则拼接的SQL语句会超出长度。
    // const existedSqlChains = JSON.parse(req.headers['existed-sql-chains'] || '[]')
    const kvFields = columns.filter(c=>c.kv && !existedSqlChains.includes(c.kv)).reduce((ary,c)=>{
      let item = ary.find(t=>t.kv === c.kv)
      if(!item){
        item = {kv:c.kv,fields:[]}
        ary.push(item)
      }
      item.fields.push(c.ename)
      return ary
    },[]) // 结果：[{kv,fields:[ename,……]},……]

    if(kvFields.length === 0) return null // 没有“别针”

    const querys = kvFields.map(async (item)=>{
      let itemIds = item.fields.map(field=>list.map(row=>row[field])).reduce((ary,values)=>ary.concat(values),[]).filter(t=>t)
      if(itemIds.length === 0) return null  // “别针”列没有值
      itemIds = itemIds.unique() // [...new Set(itemIds)]
      return await chainDll.getValueItems(item.kv, itemIds,loginUser) //{kv:item.kv,itemIds}
    }).filter(t=>t) // 构造id+itemIds，查询

    if(querys.length === 0) return null // “别针”列没有值，没有查询

    try{
      let datas = await Promise.allSettled(querys) // datas=[{ status: 'fulfilled', value },……]
      datas = datas.filter(t=>t.value && t.value.msg !== 'notSqlChainError').map(data=>{
        return {
          kv: data.value.id,
          data: data.status === 'fulfilled' ? data.value : [],          
        }
      })      
      return datas
    }catch(error){
      // throw error // 必须记录错误日志
      return null
    }
  } // 处理“别针”，提交到chainPipes，由“'/paging/chains'”请求获取

  static roleVerify(model,user){    
    if(!model.role_ids || model.role_ids.length === 0) return true
    if(!user.roles){
      throw Error(`没有登录用户`)
    }
    return !!model.role_ids.find(roleId=>user.roles.find(t=>t === roleId))
  }  // 权限判断

  /**
   * "别针"与list同一个数据库的处理
   * @param {*} userTypeId 
   * @param {*} loginUser 
   * @param {*} param2 
   */
  static async getData_joinChain_sameDb(userTypeId,loginUser,{id,db_id,sql,columns,demands,userKeys},isAdmin){
    let sqlParams
    if(!isAdmin){
      const { sqlParams:_sqlParams } = await ReportWidget.buildSearchParts_user(userTypeId,loginUser,{id,demands},1,config.download.maxRowCount)
      sqlParams = _sqlParams
    }else{
      const { sqlParams:_sqlParams } = await ReportWidget.buildSearchParts_admin({id,db_id,sql,columns,demands,userKeys},1,config.download.maxRowCount,loginUser)
      sqlParams = _sqlParams
    }
    columns = columns.filter(t=>t.enabled && !t.hide && !t.func) // 启用的列
    
    const mainParser = new SqlParser.Class(sql)
    mainParser.includeFields = columns.map(t=>t.ename) // 排除 禁用列
    mainParser.appendWhere(sqlParams.$params.join(' and '))
    const mainSql = mainParser.getPagingSql(1,config.download.maxRowCount,true,false)

    const chains = await chainDll.getList()
    const chainColumns = columns.filter(t=>t.kv).map((column,index)=>{
      const obj = chains.find(t=>t.id === column.kv)
      return {
        key:index, // 区分 相同 left 表
        column,
        chain:obj && models.Chain.new(obj)
      }
    }).filter(t=>t.chain)
    const sqlChainColumns = chainColumns.filter(t=>t.chain.type === models.ChainType.sql && t.chain.db_id === db_id).map(chainColumn=>{
      // const { param, where } = chainDll.buildUserFilterSqlParams(chainColumn.chain,loginUser) // 错误，这个条件是in 不是 =；不加这个条件，数据可能不准确
      const sqlParser = new SqlParser.Class(chainColumn.chain.values)
      sqlParser.includeFields = [ chainColumn.chain.idField.name, chainColumn.chain.nameField.name ]
      // if(where) {
      //   sqlParser.appendWhere(where)
      // }
      const joinSql_part = sqlParser.toJoinString()
      return {
        key:chainColumn.key,
        column:chainColumn.column,
        chain:chainColumn.chain,
        joinSql_part,
        params: []
        // params: param ? [param] : []
      }
    }) // 必须是同一个数据库

    const sqlFields = columns.map(column=>{
      const scc = sqlChainColumns.find(t=>t.column === column)
      return scc ? `b${scc.key}.${scc.chain.nameField.name} ${column.ename}` : `a.${column.ename}`
    })
    let allParams = sqlParams.params
    const leftSqls = sqlChainColumns.map(item=>{
      allParams = allParams.concat(item.params)
      return `left join (${item.joinSql_part}) b${item.key} on a.${item.column.ename}=b${item.key}.${item.chain.idField.name}`
    })
    const joinSql = `select a.${SqlParser.RowNumFieldName},${sqlFields} 
from (${mainSql}) a 
${leftSqls.join(' \n')} 
order by a.${SqlParser.RowNumFieldName} asc`
    const { params } = dll.Report.buildUserSqlParams(joinSql,loginUser) // sql @参数
    allParams = allParams.concat(params)

    const db = await dbDll.get(db_id)
    if(!db){
      throw Error('数据库 不存在')
    }
    const { recordset:list } = await query.executeSql(db,joinSql,allParams)

    // console.log(joinSql)
    // console.log(allParams)
    return list
  } // download用

  /**
   * "别针"与list不是同一个数据库的处理
   * @param {*} list 
   * @param {*} loginUser 
   * @param {*} sqlChainColumns 
   */
  static async dataJoinChain_unsameDb(list,loginUser,sqlChainColumns){
    sqlChainColumns = sqlChainColumns.map(scc=>{
      const _itemIds = list.reduce((obj,row)=>{
        scc.enames.forEach(ename=>{
          const key = row[ename]
          if(!(key === null || key === undefined || key === '')){
            obj[key] = undefined
          }
        })
        return obj
      },{})
      const itemIds = Object.keys(_itemIds)
      
      const querys = []
      let startIndex = 0          
      while(startIndex < itemIds.length){
        const itemIds_slice = itemIds.slice(startIndex,startIndex + config.download.maxItemsIdCount)
        querys.push(chainDll.getValueItems(scc.chain.id, itemIds_slice,loginUser))
        startIndex = startIndex + config.download.maxItemsIdCount
      }

      return {
        chain:scc.chain,
        enames:scc.enames,
        querys
      }
    })
    
    const promises = sqlChainColumns.map(async scc=>{
      const enums = await Promise.allSettled(scc.querys)
      enums.filter(t=>t.status === 'fulfilled' && t.value).forEach(({value:{list:enumList,masterKeys}})=>{
        list.forEach(row=>{
          scc.enames.forEach(ename=>{
            const key = row[ename]
            if(key === null || key === undefined || key === '') return
            const item = enumList.find(t=>t[masterKeys.id] === key)
            if(item){
              row[ename] = item[masterKeys.name]
            }
          })
        })
      })
    })

    await await Promise.allSettled(promises)
    return list
  } // download用

  static async download(userTypeId,loginUser,model,isAdmin){ // model只需要id+demands的value+columns
    if(!isAdmin){
      const demands = JSON.parse(JSON.stringify(model.demands))
      const columns = [...model.columns]
      model = await new dll.Report(userTypeId).get(model.id)
      model.demands = demands // 保留 客户端的 查询条件
      model.columns.sort((a,b)=>{
        return columns.findIndex(t=>t.ename === a.ename) - columns.findIndex(t=>t.ename === b.ename)
      }) // 复制 列的顺序，因为用户是可以 调整顺序的。
    } // 前台
    const columns = new models.Report(model).columns.filter(t=>t.enabled && !t.hide)

    const chains = await chainDll.getList()
    const _chainColumns = columns.filter(t=>t.kv).reduce((obj,column)=>{
      const chainObj = chains.find(t=>t.id === column.kv)
      if(!chainObj) return obj
      obj[column.kv] = obj[column.kv] || {
        chain: models.Chain.new(chainObj),
        enames: []
      }
      obj[column.kv].enames.push(column.ename)
      return obj
    },{})
    const chainColumns = Object.values(_chainColumns)
    const sqlChainColumns_unsameDb = chainColumns.filter(t=>t.chain.type === models.ChainType.sql && t.chain.db_id !== model.db_id)

    const list = await ReportWidget.getData_joinChain_sameDb(userTypeId,loginUser,model,isAdmin) // 与model同数据库的sql chain
    await ReportWidget.dataJoinChain_unsameDb(list,loginUser,sqlChainColumns_unsameDb) // 与model不同数据库的sql chain

    chainColumns.filter(t=>t.chain.type === models.ChainType.enum).forEach(ecc=>{
      const enums = ecc.chain.values.split(/\n/img).reduce((obj,_item)=>{
        const item = _item.split('|')
        obj[item[0]] = item[1]
        return obj
      },{})
      ecc.enames.forEach(ename=>{
        list.forEach(row=>{
          row[ename] = enums[row[ename]]
        })
      })
    }) // 枚举 的

    columns.filter(t=>t.format && !t.kv).forEach(column=>{
      list.forEach(row=>{
        row[column.ename] = format.commonFormat(row[column.ename],{format:column.format,type:column.type})
      })
    }) // 格式化,有 对齐问题。

    const data = list.map(row=>columns.map(c=>row[c.ename]))
    data.splice(0,0,columns.map(t=>t.cname)) // 表头

    return data

    // const buffer = common.xlsx.build([{name: model.name, data }])
    // res.set('Content-Type', 'application/octet-stream')
    // res.send(buffer)
  } // 做了“别针”、“格式化”，“自定义列”、“样式”先不搞。

  static getReportAsUserJson(model){
    const instance = new models.ServerReport(model) // json 转为 实例
    instance.renewValueFromDefaultValue() // 默认值 设置
    instance.makeUpDemands()
    return instance.toUserJson()
  }

  static getReportAsClientReport(model){
    const instance = new models.ServerReport(model) // json 转为 实例
    instance.renewValueFromDefaultValue() // 默认值 设置
    instance.makeUpDemands()
    return instance.toClientReport()
  }
}

module.exports = {
    express,
    cookieSession,
    xlsx,
    format,
    
    config,
    wrap,
    query,
    dll,
    models,
    Paging,
    SqlParser,
    utility,
    dbDll,
    chainDll,
    settingDll,
    chinesizeDll,
    chainPipes,
    chainPageSize,
    nullstr,

    ReportWidget
}
// exports.wrap = wrap