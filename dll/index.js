const fs = require('fs')
const os = require("os")
const query = require('./query')
const Base = require('./base')
const models = require('custompackages').models
const SqlParser = require('../utility/SqlParser')
const Paging = require('../utility/Paging')
const mCache = require('../utility/MemoryCache').memoryCache
const utility = require('../utility')
const config = require('../config')
const { SqlChain } = require('custompackages/models')

const deleteFile = async function(path){
    return new Promise(function(resolve, reject) {
        fs.unlink(path, (err) => {
            if (err && err.code !== 'ENOENT'){
                reject(err)
            }else{
                resolve()
            }                
        })
    })
}

{    
    /**
    fa:16:3e:73:51:0b；networkInterfaces['以太网 3'][0].mac
    const dateParts = 'fa:16:3e:73:51:0b'.split('').map(t=>t.charCodeAt().toString(2)).join(',')
    */

    // const mac_binary = '1100110,1100001,111010,110001,110110,111010,110011,1100101,111010,110111,110011,111010,110101,110001,111010,110000,1100010'
    // const myMac = mac_binary.split(',').map(t=>parseInt(t,2)).map(t=>String.fromCharCode(t)).join('')
    
    // const prop = '以太网 3'
    // const networkInterfaces = os.networkInterfaces()
    // if(!networkInterfaces[prop] || !networkInterfaces[prop][0] || networkInterfaces[prop][0].mac !== myMac){
    //     setTimeout(() => {
    //         query.executeSql = undefined
    //     }, 1000*60*5) // 延迟5分钟执行，增加迷惑。
    // }    

} // 不是我的电脑休想运行，哼。 '30:10:b3:84:33:9f' ；自己给自己挖的坑！！！！


const basePath = './data/'
const paths = {
    chinesize:`${basePath}chinesize.json`,
    chain:`${basePath}chain.json`,
    // category:`${basePath}category.json`,
    db:`${basePath}db.json`,
    // report:`${basePath}report.json`,
    // column:`${basePath}column.json`,
    // demand:`${basePath}demand.json`,
    // user:`${basePath}user.json`,
    // role:`${basePath}role.json`,
    setting:`${basePath}setting.json`
}

const userProps = ['id','username','name']
const roleProps = ['id','name','state']
/**
 * 解析 登录用户 的@SQL参数
 * @param {string} sql 
 * @param {object} user 登录用户 对象
 * @param {bool} ignoreValueError 忽略user key 不存在的错误
 */
const buildUserSqlParams = function(sql,user,ignoreValueError = false){
    // if(!user) return {sql,params:[]}
    const params = []
    sql = sql.replace(/(@user_.+?)(\s|$|\)|\])/,(words,word)=>{
        const key = word.substring(6).trim()
        if(!ignoreValueError && !Object.prototype.hasOwnProperty.call(user,key)){
            throw Error(`【登录用户】 对象不存在属性【${key}】`)
        }
        const value = user[key]
        const name = word.substring(1).trim()
        params.push({name,value})

        return words
    })
    return {sql,params} // sql没变
}

class Chinesize extends Base{
    constructor() {
        super(paths.chinesize,true)
    }
    async getList(){
        const sources = await new Db().getFields()
        const list = await super.getList()
        const result = sources.map(name=>{
          const item = list.find(t=>t.name === name)
          return new models.Chinesize({name,cname:item && item.cname})
        })
        return result
    }
    async updateCnames(list){
        await super.updateBatchBy(model=>list.find(t=>t.name === model.name),(model,item)=>{
            model.cname = item.cname
        })
    }
}
class Chain extends Base{
    constructor(key) {
        super(paths.chain, true)
        // super(`${basePath}chain.${key}.json`)
        // this.key = key
    }
    async add(model){
        model = await this._beforeSave(model)
        // const instance = models.Chain.new(model,{isSave:true})
        return await super.add(model)
    }
    async update(model){
        model = await this._beforeSave(model,true)
        // const instance = models.Chain.new(model,{isSave:true})
        return await super.update(model)
    }
    async _beforeSave(model,isUpdate = false){
        if(model.type === models.ChainType.sql)
        {
            const sqlParser = new SqlParser.Class(model.values)
            model._pageSql = sqlParser.getPagingSql(1,0,false)
            model._countSql = sqlParser.getCountSql(false)
            model.fields = sqlParser.outputFields.sort((a,b)=>a.i - b.i).map(t=>(new models.Field({name:t.alias,cname:t.alias,expr:t.expr})))
            {
                const { params } = buildUserSqlParams(model.values,{},true)
                model.sqlParamKeys = params.map(t=>t.name.substring(5))
            }
            if(isUpdate){
                const old = await this.get(model.id)
                model.fields.forEach(field=>{
                    field.cname = ((old.fields || []).find(t=>t.name === field.name) || {cname:field.name}).cname
                })
                model.noQuerys =(old.noQuerys || []).filter(name=>model.fields.find(t=>t.name === name))
                model.noColumns = (old.noColumns || []).filter(name=>model.fields.find(t=>t.name === name))
                model.userKeys = (old.userKeys || []).filter(userKey=>model.fields.find(t=>t.name === userKey.field))
                model.userType = old.userType
            }else{
                const cnames = await (new Chinesize()).getList()
                model.fields.forEach(field=>{
                const item = cnames.find(t=>t.name === field.name)
                if(item){
                    field.cname = item.cname
                }
            })
            }
        }else{
            if(model.values.length > 300){
                throw Error('枚举值不能多于300字')
            }
        }
        return models.deepCopy(models.Chain.new(model,{isSave:true}))
    }
    async delete(id){
        return await super.delete(id)
    }
    async addQuery(id,name){
        const model = await this.get(id)
        if(!model) throw Error(`别针 不存在(${id})`)

        if(model.type !== models.ChainType.sql){
            throw Error(`不是“${models.ChainType.sql}”类型`)
        }
        if(!model.noQuerys) {
            model.noQuerys = []
        }
        if(model.noQuerys.indexOf(name) !== -1){
            model.noQuerys.splice(model.noQuerys.indexOf(name),1)
        }        
        await super.update(model)
        return model.noQuerys
    }
    async removeQuery(id,name){
        const model = await this.get(id)
        if(!model) throw Error(`别针 不存在(${id})`)

        if(model.type !== models.ChainType.sql){
            throw Error(`不是“${models.ChainType.sql}”类型`)
        }
        if(!model.noQuerys) {
            model.noQuerys = []
        }
        if(model.noQuerys.indexOf(name) === -1){
            model.noQuerys.push(name)
        }
        await super.update(model)
        return model.noQuerys
    }
    async updateFieldCname(id,field){
        const model = await this.get(id)
        if(!model) throw Error(`别针 不存在(${id})`)

        if(model.type !== models.ChainType.sql){
            throw Error(`不是${models.ChainType.sql}类型`)
        }
        const old = model.fields.find(t=>t.name === field.name)
        if(!old){
            throw Error(`列不存在(${field.name})`)
        }
        old.cname = field.cname || field.name
        await super.update(model)
        return old
    }
    async updateColors(id,colors){
        const model = await this.get(id)
        if(!model) throw Error(`别针 不存在(${id})`)
        model.colors = colors || []
        await super.update(model)
        return model.colors
    }
    async updateUserKeys(id,userType,userKeys){
        const model = await this.get(id)
        if(!model) throw Error(`别针 不存在(${id})`)

        if(model.type !== models.ChainType.sql){
            throw Error(`不是${models.ChainType.sql}类型`) // [{ufield:'',field:''}，……]
        }
        model.userType = userType
        model.userKeys = (userKeys || []).map(t=>({ufield:t.ufield,field:t.field})).filter(t=>t.ufield && t.field)
        await super.update(model)
        return {userType,userKeys:model.userKeys}
    }
    /**
     * 用left join 一次查所有子孙级
     * @param {*} chainId 
     * @param {*} value 
     */
    async dataLayer_findChildren(chainId,value){
        const model = await this.get(chainId)
        if(!model){
            throw Error(`【别针】(id:${chainId})不存在`)
        }
        if(!model.masterKeys || !model.masterKeys.pid){
            throw Error(`该【别针】(id:${chainId})不是层级数据结构`)
        }
        const keys = model.masterKeys
        let sql = model.values
        const param = {name:`id${parseInt((Math.random()+1)*10000)}`,value}
        const tableSql = new SqlParser.Class(sql).toString(null,false)

        sql =`select
                b.${keys.id},
                c.${keys.id},
                d.${keys.id},
                e.${keys.id}
            from (${tableSql}) a 
            left join (${tableSql}) b on b.${keys.pid}=a.${keys.id}
            left join (${tableSql}) c on c.${keys.pid}=b.${keys.id}
            left join (${tableSql}) d on d.${keys.pid}=c.${keys.id}
            left join (${tableSql}) e on e.${keys.pid}=d.${keys.id}
            where a.${keys.id}=@${param.name}`
        // console.log(sql)

        let list = []
        const db = await new Db().get(model.db_id)
        const { recordset } = await query.executeSql(db,sql,[param])
        recordset.map(obj=>((obj[keys.id] || []).filter(t=>t))).forEach(items=>{
            list = list.concat(items)
        })
        return list
    }
    /**
     * 用left join 一次查所有父级；只是大量left join(sql) 有没有性能问题？
     * @returns [[祖级|rootId],……,[父级],[己级],[子级]]，子级没有侧=[]
     * @param {*} model 
     * @param {*} user 
     * @param {*} rootId 
     * @param {*} descendantId 
     */
    async dataLayer_findFathers(model,user,rootId,descendantId){
        if(!model.masterKeys || !model.masterKeys.pid){
            throw Error(`该【别针】不是层级数据结构`)
        }
        const db = await new Db().get(model.db_id)
        let sql = model.values
        let params = []
        if(model.userType){
            const { params:params2 } = buildUserSqlParams(sql,user) // user 参数
            params = params.concat(params2)
        } // 条件1：有userType才解析 user @SQL参数

        const keys = model.masterKeys
        sql = new SqlParser.Class(sql).toString(null,false)
        sql = `select 
                        --a.${keys.pid}, --如果为NULL，下面的b.${keys.id}取不到。
                        b.${keys.id}, 
                        c.${keys.id},
                        d.${keys.id},
                        e.${keys.id}
                    from (${sql}) a
                    left join (${sql}) b on b.${keys.id}=a.${keys.pid}
                    left join (${sql}) c on c.${keys.id}=b.${keys.pid}
                    left join (${sql}) d on d.${keys.id}=c.${keys.pid}
                    left join (${sql}) e on e.${keys.id}=d.${keys.pid}
                    where a.${model.masterKeys.id}=@descendantId` // 5层了
        params.push({name:'descendantId',value:descendantId})
        // console.log(sql)

        let { recordset:[ids] } = await query.executeSql(db,sql,params)
        ids = ids[keys.id]

        if(!ids) return [] // 没有上级

        if(rootId){
            const index = ids.findIndex(t=>t == rootId)
            if(index === -1){
                throw Error(`层级错误`)
            }
            return ids.slice(0,index+1).map(t=>({[keys.id]:t})).reverse()
        }else{
            return ids.filter(t=>t).map(t=>({[keys.id]:t})).reverse()
        }
    }
    /**
     * 一条一条向上查 父级
     * @param {*} model 
     * @param {*} user 
     * @param {*} rootId 
     * @param {*} descendantId 
     */
    async dataLayer_findFathers_未用(model,user,rootId,descendantId){
        if(!model.masterKeys || !model.masterKeys.pid){
            throw Error(`该【别针】不是层级数据结构`)
        }
        const db = await new Db().get(model.db_id)
        let sql = model.values
        let params = []
        if(model.userType){
            const { params:params2 } = buildUserSqlParams(sql,user) // user 参数
            params = params.concat(params2)
        } // 条件1：有userType才解析 user @SQL参数

        const result = []
        while(true){
            const param = {name:`id${parseInt((Math.random()+1)*10000)}`,value:descendantId}
            // const sql1 = `select ${model.fields.map(t=>t.name).join(',')} from (${sql}) a where ${model.masterKeys.id}=@${param.name}`
            const params1 = params.concat([param])
            const sql1 = new SqlParser.Class(sql).appendWhere(`${model.masterKeys.id}=@${param.name}`).toString()

            const { recordset:[item] } = await query.executeSql(db,sql1,params1)
            if(!item) break

            result.push(item)
            if(rootId && item[model.masterKeys.pid] == rootId){
                return result
            }
            descendantId = item[model.masterKeys.pid]
        }
        if(rootId){
            // return []
            throw Error(`层级错误`)
        }else{
            return result
        }
    }
    /**
     * 根据某层的某个值，查 多层次数据{所有祖级、父级+直接子级（如果有）}
     * @param {*} id 
     * @param {*} user 
     * @param {*} descendantId 
     */
    async dataLayerByDid(id,user,descendantId){
        const model = await this.get(id)
        if(!model || model.type !== models.ChainType.sql ){
            throw Error(`不是“${models.ChainType.sql}”类型`)
        }
        if(!model.masterKeys || !model.masterKeys.pid){
            throw Error(`该【别针】不是层级数据结构`)
        }
        let sql = model.values
        let params = []
        let sqls = []
        if(model.userType){
            const { params:params2 } = buildUserSqlParams(sql,user) // user 参数
            params = params.concat(params2)
        } // 条件1：有userType才解析 user @SQL参数
        {
            const rootId = model.masterKeys.fid ? user[model.masterKeys.fid] : null // 不严谨（因为传来的pid可以是第一层的任意ID，过滤约束 就被翘过去了）
            const items = await this.dataLayer_findFathers(model,user,rootId,descendantId)
            const pids = items.map(t=>t[model.masterKeys.id])
            pids.push(descendantId)
            
            sqls = pids.map(pid=>{
                const name = `pid${parseInt((Math.random()+1)*10000)}`
                params.push({name,value:pid})
                return new SqlParser.Class(sql).appendWhere(`pid=@${name}`).toString()
            })
        }

        const db = await new Db().get(model.db_id)   
        const querys = sqls.map(sql=>query.executeSql(db,sql,params))
        querys.splice(0,0,this.dataLayerByPid(id,user,undefined).then(data=>({recordset:data}))) // 加上根级
             
        let list = await Promise.all(querys)
        return list.map(t=>t.recordset)
    }
    /**
     * 根据PID，查PID等于该值的该层数据
     * @param {*} id 
     * @param {*} user 
     * @param {*} pid 
     */
    async dataLayerByPid(id,user,pid){
        const model = await this.get(id)
        if(!model || model.type !== models.ChainType.sql ){
            throw Error(`不是“${models.ChainType.sql}”类型`)
        }
        if(!model.masterKeys || !model.masterKeys.pid){
            throw Error(`该【别针】不是层级数据结构`)
        }
        let sql = model.values
        let params = []
        if(model.userType){
            const { params:params2 } = buildUserSqlParams(sql,user) // user 参数
            params = params.concat(params2)
        } // 条件1：有userType才解析 user @SQL参数
        {
            //pid：不严谨（因为传来的pid可以是第一层的任意ID，过滤约束 就被翘过去了）
            pid = pid || (model.masterKeys.fid ? user[model.masterKeys.fid] : null) // 有个BUG(当user不巧为空时，pid就=null了，层级就会出错)
            if(pid){
                const name = `pid${parseInt((Math.random()+1)*10000)}`
                params.push({name,value:pid})
                // sql = `select ${model.fields.map(t=>t.name).join(',')} from (${sql}) a where pid=@${name}` // 不对，如果原sql包含order by，那就出错了。
                sql = new SqlParser.Class(sql).appendWhere(`pid=@${name}`).toString()
            }else{                
                sql = new SqlParser.Class(sql).toString(null,false)
                const keys = model.masterKeys
                const selectFields = model.fields.map(t=>`a.${t.name}`).join(',')
                sql = `select ${selectFields} from (${sql}) a 
                        left join 
                        (${sql}) b on a.${keys.pid}=b.${keys.id}
                        where b.${keys.id} is null`
            }
        }

        const db = await new Db().get(model.db_id)
        let { recordset:list } = await query.executeSql(db,sql,params)
        return list
    }
    /**
     * 查 单层数据(非多层次)(异步 total)
     * @param {*} id 
     * @param {*} pageIndex 
     * @param {*} pageSize 
     * @param {*} searchers 
     * @param {*} loginUser 
     * @param {bool} withTotal 是否 查 总条数
     */
    async dataPaging(id, pageIndex, pageSize, searchers, loginUser,withTotal){
        const model = await this.get(id)
        if(!model){
            throw Error(`失效【别针】`)
        }
        if(model.type !== models.ChainType.sql ){
            throw Error(`不是“${models.ChainType.sql}”类型`)
        }
        if(model.masterKeys.pid){
            throw Error(`多层级数据【别针】不能调用该函数`)
        }

        let searchParams = Object.entries(searchers).filter(t=>t[1]).map(([key,value])=>{
            const field = model.fields.find(t=>t.name === key)
            return {name:field.name,value:`%${value}%`,expr:field.expr}
        })
        let $searchParams = searchParams.map(t=>`${t.expr} like @${t.name}`)  // 条件1：查询条件
        let sqlParams = []

        // const userBindSqlParams = this.getUserBindSqlParams(model,loginUser)
        // if(userBindSqlParams){
        //     searchParams = searchParams.concat(userBindSqlParams.params)
        //     $searchParams = $searchParams.concat(userBindSqlParams.$params)
        // }  // 条件3（取消了）：加上 登录用户绑定 条件

        let pageSql = SqlParser.Class.getRealSql(model._pageSql,undefined,$searchParams)
        let countSql = SqlParser.Class.getRealSql(model._countSql,undefined,$searchParams)
        sqlParams = searchParams.concat([
            {name:SqlParser.SqlPlaceholders.startPage,value:pageSize * (pageIndex - 1)},
            {name:SqlParser.SqlPlaceholders.endPage,value:pageSize * pageIndex}
        ])  // 条件4：加上 分页 页数 参数

        if(model.userType){
            const { params:params2 } = buildUserSqlParams(pageSql,loginUser) // user 参数
            sqlParams = sqlParams.concat(params2)
            searchParams = searchParams.concat(params2)
        } // 条件5：有userType才解析 user @SQL参数 

        const db = await new Db().get(model.db_id)

        let asyncTotal
        if(withTotal){
            asyncTotal = query.executeSql(db,countSql,searchParams)
        }        
        const { recordset:list } = await query.executeSql(db,pageSql,sqlParams)

        list.forEach(row=>delete row[SqlParser.RowNumFieldName])
        return { 
            paging: new Paging(list,-1,pageSize,pageIndex),
            asyncTotal
        }
    }
    /**
     * 查 单层数据(非多层次)(同步查list+total)
     * @param {*} id 
     * @param {*} pageIndex 
     * @param {*} pageSize 
     * @param {*} searchers 
     * @param {*} loginUser 
     */
    async dataPagingWithTotal(id, pageIndex, pageSize, searchers, loginUser){
        const model = await this.get(id)
        if(!model){
            throw Error(`失效【别针】`)
        }
        if(model.type !== models.ChainType.sql ){
            throw Error(`不是“${models.ChainType.sql}”类型`)
        }

        let searchParams = Object.entries(searchers).filter(t=>t[1]).map(([key,value])=>{
            const field = model.fields.find(t=>t.name === key)
            return {name:field.name,value:`%${value}%`,expr:field.expr}
        })
        let $searchParams = searchParams.map(t=>`${t.expr} like @${t.name}`)  // 条件1：查询条件
        let sqlParams = []

        // const userBindSqlParams = this.getUserBindSqlParams(model,loginUser)
        // if(userBindSqlParams){
        //     searchParams = searchParams.concat(userBindSqlParams.params)
        //     $searchParams = $searchParams.concat(userBindSqlParams.$params)
        // }  // 条件3（取消了）：加上 登录用户绑定 条件

        let pageSql = SqlParser.Class.getRealSql(model._pageSql,undefined,$searchParams)
        let countSql = SqlParser.Class.getRealSql(model._countSql,undefined,$searchParams)
        sqlParams = searchParams.concat([
            {name:SqlParser.SqlPlaceholders.startPage,value:pageSize * (pageIndex - 1)},
            {name:SqlParser.SqlPlaceholders.endPage,value:pageSize * pageIndex}
        ])  // 条件4：加上 分页 页数 参数

        if(model.userType){
            const { params:params2 } = buildUserSqlParams(pageSql,loginUser) // user 参数
            sqlParams = sqlParams.concat(params2)
            searchParams = searchParams.concat(params2)
        } // 条件5：有userType才解析 user @SQL参数 

        const db = await new Db().get(model.db_id)

        let [{recordset:list},{recordset:[{c:totatl}]}] = await Promise.all([query.executeSql(db,pageSql,sqlParams),query.executeSql(db,countSql,searchParams)])
        if(list.length === 0){
            const pageCount = parseInt((totatl-1)/pageSize)+1
            if(pageIndex > pageCount){
                pageIndex = pageCount
                const sqlParams2 = searchParams.concat([
                    {name:SqlParser.SqlPlaceholders.startPage,value:pageSize * (pageIndex - 1)},
                    {name:SqlParser.SqlPlaceholders.endPage,value:pageSize * pageIndex}
                ])
                const {recordset:list2} = await query.executeSql(db,pageSql,sqlParams2)
                list = list2
            }
        } // 如果 pageIndex > pageCount，要把pageIndex设为1、再查一次
        list.forEach(row=>delete row[SqlParser.RowNumFieldName])

        return { 
            paging: new Paging(list,totatl,pageSize,pageIndex) 
        }
    }
    async getValueItems(id, itemIds, loginUser = undefined){
        const _obj = await this.get(id)
        const model = _obj && new SqlChain(_obj)
        const result = {
            id,
            fulled:false,
            list:[],
            masterKeys:undefined,
            error:false,
            msg:null
        }
        if(!model || model.type !== models.ChainType.sql){
            result.error = true
            result.msg = 'notSqlChainError' //'不是 别针(SQL) 类型'
            return result
        }
        result.masterKeys = { id:model.masterKeys.id, name:model.masterKeys.name }   
        
        const maxCount = config.little_sql_chain_cache.max_count
        const cacheKey = config.little_sql_chain_cache.getKey(id)
        const total = mCache.get(cacheKey)

        let searched = false
        if(!(model.sqlParams && model.sqlParams.length > 0) && !(model.masterKeys && model.masterKeys.pid && model.masterKeys.fid))
        {
            if(!total || total <= maxCount)
            {
                const { paging } = await this.dataPagingWithTotal(id,1,maxCount,[],loginUser)
                if(paging.total <= maxCount){
                    result.list = paging.list
                    result.fulled = true
                    searched = true
                }
                // if(!model.userKeys || model.userKeys.length === 0){
                mCache.set(cacheKey,paging.total,{time:config.little_sql_chain_cache.time})
                // }
            }
        } // “非登录用户绑定”的“小”的sql chain每次都会用dataPagingWithTotal查（前端必须缓存起来，减少请求）；大的sql chain只会用dataPagingWithTotal查一次(直到缓存过期)。
        if(!searched && itemIds.length > 0){
            const $ids = itemIds.map((itemId,i)=>`@id${i}`)
            let $sqlParams = $ids.length > 0 ? [`${model.idField.expr} in (${$ids.join(',')})`] : []
            let sqlParams = itemIds.map((itemId,i)=>({name:`id${i}`,value:itemId}))

            // const userBindSqlParams = this.getUserBindSqlParams(model,loginUser)
            // if(userBindSqlParams){
            //     sqlParams = sqlParams.concat(userBindSqlParams.params)
            //     $sqlParams = $sqlParams.concat(userBindSqlParams.$params)
            // }  // 条件1：登录用户绑定 条件
            $sqlParams = $sqlParams.join(' and ')

            const sqlParser = new SqlParser.Class(model.values).appendWhere($sqlParams)
            sqlParser.includeFields = [model.idField.name,model.nameField.name]
            let sql = sqlParser.toString()
            const db = await new Db().get(model.db_id)

            if(model.userType){
                const { params:params2 } = buildUserSqlParams(sql,loginUser) // user 参数
                sqlParams = sqlParams.concat(params2)
            } // 条件2：登录用户的@参数
            {

            } // 条件2：layer chain的过滤条件，未写
            const { recordset:list } = await query.executeSql(db,sql,sqlParams)
            // this._resetKeyName(list,model.fields)
            result.list = list
        }
        
        return result
    }
    // getUserBindSqlParams(model,loginUser){
    //     // return null // 这个函数不要了
    //     if(!loginUser || !model.userKeys || model.userKeys.length === 0) return null

    //     const userBinds = (model.userKeys || []).map(ukey=>({field:ukey.field,value:loginUser[ukey.ufield]}))
    //     const searchParamsUserBinds = (userBinds || []).map(item=>{
    //         const field = model.fields.find(t=>t.name === item.field)
    //         return {name:`${field.name}_${parseInt(Math.random()*1000000)}`,value:item.value,expr:field.expr}
    //     })
    //     const $searchParamsUserBinds = searchParamsUserBinds.map(t=>`${t.expr} = @${t.name}`)
    //     return {params:searchParamsUserBinds,$params:$searchParamsUserBinds}
    // } // 获取 登录用户绑定 条件
    async testSql(sql,db,user){
        sql = new SqlParser.Class(sql).appendWhere('1=2').toString()
        const { params } = buildUserSqlParams(sql,user) // user 参数
        const {recordset:list} = await query.executeSql(db,sql,params)
        const fields = Object.values(list.columns).sort((a,b)=>a.index - b.index).map(t=>({name:t.name,cname:t.name}))
        if(fields.length < 2){
            throw Error('至少需要两个字段:键值、名称.')
        }
        return fields
    }
    buildUserFilterSqlParams__用等会有问题(model,user){
        if(!model.masterKeys || !model.masterKeys.pid || !model.masterKeys.fid) return {}

        const param = {
            name: `pid${parseInt((Math.random()+1)*100000)}`, // model.masterKeys.id,
            value: user[model.masterKeys.fid]
        }
        const where = `${model.masterKeys.pid}=@${param.name}`

        return { param, where }
    }
}
class Category extends Base{
    constructor(key) {
        super(`${basePath}category.${key}.json`)
        this.key = key
    }
    async add(model){
        model = await super.add(model)
        this.sort(model)
        return model
    }
    async sort(model){
        const list = await this.getList()
        const brothers = list.filter(t=>t.pid === model.pid)
        model.seq = model.seq < 0 ? 0 : model.seq
        model.seq = model.seq > brothers.length ? brothers.length : model.seq
        // model.name = old.name // 不能改了 名称

        brothers.sort((a,b)=>a.seq - b.seq)
            .forEach((item,i)=>{item.seq = i})
        brothers.filter(t=>t.seq >= model.seq).forEach((item,i)=>item.seq = model.seq + i + 1)

        const seqs = brothers.concat([model])
        await super.sortBySeq(seqs,(model,newModel)=>{
            model.pid = newModel.pid
        })
    }
    async delete(id){
        const list = await this.getList()
        const item = list.find(t=>t.id == id)
        if(!item){
            throw Error('目录不存在')
        }
        const descendants = this._getDescendants(list,id) // 还要删报表
        // list.splice(list.indexOf(item),1)
        descendants.push(item)
        const descendantIds = descendants.map(t=>t.id)
        await new Report(this.key).deleteByCategorys(descendantIds)
        await super.deleteBatches(descendantIds)
        // await this.saveList(list)
        return item
    }
    _getDescendants(list,pid){
        let result = []
        const children = list.filter(t=>t.pid === pid)
        result = result.concat(children)
        children.forEach(item=>{
            // list.splice(list.indexOf(item),1)
            result = result.concat(this._getDescendants(list,item.id))
        })
        return result
    }
    async deleteAll(){
        await deleteFile(this.Path)
    }
} // 删除 目录 时，要判断有没有报表用到这个目录。
class Db extends Base{
    constructor() {
        super(paths.db,true)
    }
    async delete(id,userTypeIds){
        // userTypeIds.forEach(utid=>{
        //     new Report(utid).deleteByDatabase(id)
        // })
        await super.delete(id)
    }
    async testConnect(host,username,password,db,instance,port){
        const result = await query.testConnect(host,username,password,db,instance,port)
        return result
    }
    async getFields(){
        const list = await this.getList()
        const querys = list.map(db=>query.executeSql(db,'select distinct name from syscolumns'))
        let results = await Promise.allSettled(querys)
        results = results.filter(t=>t.status === 'fulfilled')
                .map(({status,value:{recordset}})=>recordset.filter(t=>t.name).map(t=>t.name))
                .reduce((ary,data)=>ary.concat(data),[])
        return [...new Set(results)].sort()
    }
}
class Report extends Base{
    constructor(key) {
        super(`${basePath}report.${key}.json`)
        // super(paths.report)
    }
    /**
     * 如果是复制报表，则要带上 源报表的基本信息
     * @param {*} id 
     */
    async get(id) {
        id = parseInt(id)
        const list = await this.getList()
        const model = list.find(t=>t.id === id)
        if(!model){
            throw Error(`报表不存在(${id})`)
        }
        if(model.from_id){
            const source = list.find(t=>t.id === model.from_id)
            if(!source){
                throw Error(`源报表不存在`)
            }
            model.sql = source.sql
            model._pageSql = source._pageSql
            model._countSql = source._countSql
            model.db_id = source.db_id
            model.category_id = source.category_id
            model.columns = model.columns.map(c=>{
                const column = source.columns.find(t=>t.ename === c.ename)
                if(!column) return null
                models.DataAttrs.forEach(key=>c[key] = column[key])
                return c
            }).filter(t=>t) // 从源报表补充column的信息，并过滤不存在的column
        }
        return model
    }
    async getListless(){
        const list = await this.getList()
        list.forEach(t=>{
            t.columns = []
            t.demands = []
        })
        list.filter(t=>t.from_id).forEach(item=>{
            const parent = list.find(t=>t.id === item.from_id)
            item.db_id = parent.db_id
            item.category_id = parent.category_id
        })
        return list
    }
    /**
     * 复制报表，SQL语句共享于 源报表
     * @param {Number} sourceId 
     */
    async copy(sourceId,newName=null){
        let model = await this.get(sourceId)
        if(!model){
            throw Error(`源报表不存在(id:${sourceId})`)
        }

        model.from_id = model.from_id || sourceId
        model.name = newName || model.name
        model.id = null
        model.sql = model.db_id = model.category_id = model._pageSql = model._countSql = null
        model.columns.forEach(c=>{
            models.DataAttrs.forEach(key=>delete c[key])
        })
        model = super.add(model)
        return model
    }
    async add(model){
        model = await this._beforeSave(model)
        await super.add(model)
        return await this.get(model.id)
    }
    async update(model){
        model = await this._beforeSave(model)
        await super.update(model)
        return await this.get(model.id) // 为什么要重新get？？？？？？
    }
    async _beforeSave(model){
        model = utility.deepCopy(model)
        if(!model.from_id)
        {
            const sqlParser = new SqlParser.Class(model.sql)
            model._pageSql = sqlParser.getPagingSql(1,SqlParser.PageSize,false)
            model._countSql = sqlParser.getCountSql(false)
            sqlParser.outputFields.forEach(f=>{
                const column = model.columns.find(t=> t.ename === f.alias)
                column.expr = f.expr
            })
            const { params } = Report.buildUserSqlParams(model._pageSql,{},true)
            model.sqlKeys = params.length ? params.map(t=>t.name.substring(5)) : null // user@参数
            {
                const db = await new Db().get(model.db_id)
                const pagingSql = SqlParser.Class.getRealSql(model._pageSql,undefined,['1=2'])
                let sqlParams = [
                    {name:SqlParser.SqlPlaceholders.startPage,value:0},
                    {name:SqlParser.SqlPlaceholders.endPage,value:0}
                ]
                sqlParams = sqlParams.concat(params)

                const {recordset:data} = await query.executeSql(db,pagingSql,sqlParams)
                delete data.columns[SqlParser.RowNumFieldName]
                Object.values(data.columns).forEach(sqlField=>{
                    const obj = {
                        dataType:sqlField.type.name,
                        dataLength:sqlField.length,
                        dataPrecision:sqlField.precision,
                        dataScale:sqlField.dataScale
                    }
                    const c = model.columns.find(c=>c.ename === sqlField.name)
                    Object.assign(c,obj)
                })
            } // 通过查询数据库获取fields来完善columns
        }else{
            model.sql = model.db_id = model.category_id = null
        }

        const instance = new models.ServerReport(model)
        instance.setRelativeDate() // 完善时间默认值的“相对值”设置
        instance.demands = instance.demands.filter(d=>d.prior || d.isCustom || !d.enabled) // 保存“优先”、“自定义条件”和“不启用”的，最少保存原则
        instance.userKeys = instance.userKeys.filter(t=>!!t.field)
        return utility.deepCopy(instance)
    } // 还要过滤 SQL语句的 危险字符！！！！
    async enable(id,value){
        const model = await this.get(id)
        if(!model) throw Error(`报表 不存在(${id})`)

        model.enabled = !!value
        return await super.update(model)
    }
    async hide(id,value){
        const model = await this.get(id)
        if(!model) throw Error(`报表 不存在(${id})`)

        model.hide = !!value
        return await super.update(model)
    }
    async sort(category_id,id1,id2,type){
        const list = await this.getList()
        const model1 = list.find(t=>t.id == id1)
        const model2 = id2 && list.find(t=>t.id == id2)

        model1.category_id = category_id

        if(!model2){
            model1.seq = 0
            super.update(model1)
        }else{
            if(model2.category_id !== model1.category_id) return // 意外错误
            const children = list.filter(t=>t.category_id === category_id)
            children.sort((a,b)=>a.seq - b.seq)
            const index1 = children.indexOf(model1)
            if(index1 !== -1){
                children.splice(index1,1)
            }
            const index2 = children.indexOf(model2)
            if(type === -1){
                children.splice(index2,0,model1)
            }else{
                children.splice(index2 + 1,0,model1)
            }
            children.forEach((item,i)=>item.seq = i)

            await super.sortBySeq(children,()=>{})
        }
    }
    // async sort(model){
    //     const list = await this.getList()
    //     // list.splice(list.findIndex(t=>t.id === model.id),1)

    //     const brothers = list.filter(t=>t.category_id == model.category_id).sort((a,b)=>a.seq - b.seq)
    //     brothers.forEach((item,i)=>{item.seq = i})

    //     model.seq = model.seq < 0 ? 0 : model.seq
    //     model.seq = model.seq > brothers.length ? brothers.length : model.seq

    //     brothers.filter(item=>item.seq >= model.seq).forEach((item,i)=>{
    //         item.seq = model.seq + i + 1
    //     })
        
    //     const seqs = brothers.concat([model])
    //     await super.sortBySeq(seqs,(model,newModel)=>{
    //         model.category_id = newModel.category_id
    //     })

    //     // list.push(model)
    //     // await this.saveList(list)
    // }
    /**
     * 删除：源报表+复制报表
     * @param {*} id 
     */
    async delete(id){
        const list = await this.getList()
        const ids = list.filter(t=>t.id == id || t.from_id == id).map(t=>t.id)
        await super.deleteBatches(ids)
        // ids.forEach(item=>{
        //     list.splice(list.indexOf(item),1)
        // })
        // await this.saveList(list)
    }
    async deleteByDatabase(dbid){
        const list = await this.getList()
        const sourceReports = list.filter(t=>t.db_id === dbid)
        const sourceReportIds = sourceReports.map(t=>t.id)
        const fromReports = list.filter(t=>sourceReportIds.includes(t.from_id))
        const reports = sourceReports.concat(fromReports)

        await super.deleteBatches(reports.map(t=>t.id))

        // reports.forEach(item=>{
        //     list.splice(list.indexOf(item),1)
        // })
        // await this.saveList(list)
    } // 根据 目录ID数组，批量删除报表
    async deleteByCategorys(categoryIds){
        const list = await this.getList()
        const sourceReports = list.filter(t=>categoryIds.includes(t.category_id))
        const sourceReportIds = sourceReports.map(t=>t.id)
        const fromReports = list.filter(t=>sourceReportIds.includes(t.from_id))
        const reports = sourceReports.concat(fromReports)

        await super.deleteBatches(reports.map(t=>t.id))

        // reports.forEach(item=>{
        //     list.splice(list.indexOf(item),1)
        // })
        // await this.saveList(list)
    } // 根据 目录ID数组，批量删除报表
    // update // 如果SQL变了，复制报表 的列也要检查、更新
    // async add(model){
    //     // 比较，删掉 以默认值一样的属性，减少存储空间
    //     super.add(model)
    //     return model
    // }
    async deleteAll(){
        await deleteFile(this.Path)
    }
    async updateStar(id, star){
        const model = await this.get(id)
        if(!model) throw Error(`报表 不存在(${id})`)
        
        if(model){
            model.star = star || undefined
        }
        await super.update(model)
    }
    /**static */
    static buildUserSqlParams(sql,user,ignoreValueError = false){
        return buildUserSqlParams(sql,user,ignoreValueError)
    }
}
class Setting extends Base{
    constructor() {
        super(paths.setting,true)
    }
    async verify(model){
        models.Setting().verify(model)
        let list = await this.getList()
        const existed = list.find(t=>t.mobile === model.mobile && t.id !== model.id)
        if(existed){
            throw Error(`手机号(${model.mobile})已被注册`)
        }
    }
    async add(model){
        await this.verify(model)
        return await super.add(model)
    }
    async update(model){
        await this.verify(model)

        const old = await this.get(model.id)
        if(!model.password){
            model.password = old.password
        }
        {
            const delUserTypes = old.userTypes.filter(t=>!model.userTypes.find(m=>m.id === t.id)) // 被删除的 前台类型
            delUserTypes.forEach(async (item)=>{
                await new Category(item.id).deleteAll()
                await new Report(item.id).deleteAll()
            })
        } // 删除 失效用户类型 对应的所有数据
        return await super.update(model)
    }
    async getAdmin(mobile,password){
        let list = await this.getList()
        let model = list.find(t=>t.mobile == mobile && t.password == password)
        if(model){
            model.password = ''
        }
        return model
    }
    async getRoles(id,userTypeId){
      const model = await this.get(id)
      const userType = (model.userTypes || []).find(t=>t.id == userTypeId)
      if(!userType){
          throw Error('用户类型不存在')
      }
      if(userType.roleApi){
        const data = await utility.loadPage(userType.roleApi)
        const obj = JSON.parse(data)
        if(!(obj instanceof Array)){
            throw Error(`${userType.name}的“角色接口”获取到的数据结构不正确（${data}）；请 查看接口详细说明`)
        }
        obj.forEach(item=>{
            if(roleProps.find(t=>!Object.prototype.hasOwnProperty.call(item,t))){
                throw Error(`${userType.name}的“角色接口”获取到的数据结构不正确（${data}）；请 查看接口详细说明`)
            }
        })        
        return obj
      }else{
        return []
      }
    }
    async getTstUsers(id,userTypeId){
        if(!(await this.hasUserTstApi(id,userTypeId))){
            // throw Error('未设置【用户接口】')
            return []
        }
        const roles = await this.getRoles(id,userTypeId)
        if(roles.length === 0){
            roles.push({id:''})
        }
        const promises = roles.map(t=>this.getTstUser(id,userTypeId,t.id))
        const users = await Promise.all(promises)
        return users
    }
    async getTstUser(id,userTypeId,roleid){
        const model = await this.get(id)
        const userType = (model.userTypes || []).find(t=>t.id == userTypeId)
        if(!userType){
            throw Error('用户类型不存在')
        }
        const url = userType.userTstApi.replace('{roleid}',roleid || '')
        const data = await utility.loadPage(url)
        const obj = JSON.parse(data)
        
        if(userProps.find(t=>!Object.prototype.hasOwnProperty.call(obj,t))){
            throw Error(`${userType.name}的“用户接口”获取到的数据结构不正确（${data}）；请 查看接口详细说明`)
        }
        return obj
    }
    async hasRoleApi(id,userTypeId){
        const model = await this.get(id)
        const userType = (model.userTypes || []).find(t=>t.id == userTypeId)
        if(!userType){
            throw Error('用户类型不存在')
        }
        return !!userType.roleApi
    }
    async hasUserTstApi(id,userTypeId){
        const model = await this.get(id)
        const userType = (model.userTypes || []).find(t=>t.id == userTypeId)
        if(!userType){
            throw Error('用户类型不存在')
        }
        return !!userType.userTstApi
    }
}

exports.Chinesize = Chinesize
exports.Chain = Chain
exports.Db = Db
exports.Category = Category
exports.Report = Report
exports.Setting = Setting

/**
// exports.User = User
// exports.Role = Role
class User extends Base{
    constructor() {
        super(paths.user)
    }
    async verify(model){
        models.User.verify(model)
        let list = await this.getList()
        const existed = list.find(t=>t.name === model.name && t.id !== model.id)
        if(existed){
            throw Error(`账号(${model.name})已存在`)
        }
    }
    async add(model){
        await this.verify(model)
        return await super.add(model)
    }
    async update(model){
        await this.verify(model)
        return await super.update(model)
    }
}
class Role extends Base{
    constructor() {
        super(paths.role)
    }
}
 */