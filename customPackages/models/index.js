// import {isEmpty} from '@/utility/utility'
///所有表有ID，是为了CURD方便

//#region 

const deepCopy = (obj)=> obj && JSON.parse(JSON.stringify(obj))
const isEmpty = (value)=> (value === undefined || value === null || value === '')
const isGuid = (str)=> (new RegExp(/^[0-9a-zA-Z]{8}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{12}$/).test(str))
const getDaySpan = (value)=>{
    const dt = new Date(new Date(value).toDateString())
    const minDt = dt.toISOString()
    dt.setHours(23)
    dt.setMinutes(59)
    dt.setSeconds(59)
    dt.setMilliseconds(999)
    const maxDt= dt.toISOString()
    return {min:minDt,max:maxDt}
}

const equalWay = '等于'
const likes = {
    包含:function({expr,name,value}){
        return [`${expr} like @${name}`,`%${value}%`]
    },
    null:function({expr,name,value}){
        return [`${expr} like @${name}`,`%${value}%`]
    },
    左包含:function({expr,name,value}){
        return [`${expr} like @${name}`,`${value}%`]
    },
    右包含:function({expr,name,value}){
        return [`${expr} like @${name}`,`%${value}`]
    },
    不包含:function({expr,name,value}){
        return [`${expr} not like @${name}`,`%${value}%`]
    },
    等于:function({expr,name,value}){
        return [`${expr} = @${name}`,value]
    },
    不等于:function({expr,name,value}){
        return [`${expr} <> @${name}`,value]
    }
}

const compareChar = {
    大于:'>',
    大于等于:'>=',
    小于:'<',
    小于等于:'<=',
    null:'=',
    等于:'=',
    不等于:'<>'
}

/**
 * 获取 where条件的优先级
 * @param {String} fragment 
 * @param {any} value 
 */
const getWhereFragmentPriority = function(fragment,value){
    if(fragment.indexOf(' = ') !== -1) return 1
    else if(fragment.indexOf(' > ') !== -1 || fragment.indexOf(' < ') !== -1) return 2
    else if(fragment.indexOf(' >= ') !== -1 || fragment.indexOf(' <= ') !== -1) return 3
    else if(fragment.indexOf(' in (') !== -1) return 4
    else if(fragment.indexOf(' like ') !== -1){
        if((/^[^%].+%$/).test(value)){
            return 5
        }
    }

    return 6
}

const BaseDataTypes = Object.freeze({
    s:'字符类型',
    n:'数字类型',
    d:'日期时间类型',
    null:'枚举类型'
})
const BaseJsDataTypes = Object.freeze({
    s:'String',
    n:'Number',
    d:'Date'
})
const ChainType = Object.freeze({
    enum:'枚举',
    sql:'数据库'
    // sql:'SQL'
    // sql:'别针'
})

class MasterKeys{
    constructor(obj){
        this.id = obj && obj.id
        this.pid = obj && obj.pid
        this.name = obj && obj.name
        this.fid = obj && obj.fid
        this.layer = obj && obj.layer
    }
}

class Chinesize {
    constructor(obj){
        Object.defineProperties(this,{
            name:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.name
            }, // 不可监听，可系列化，不可输入
            cname:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:obj.cname || null
            } // 可监听，可系列化
        })
    }
}

class Field{
    constructor(obj,{isSave = false} = { isSave: false }){
        Object.defineProperties(this,{
            name:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.name
            }, // 可监听，可系列化，唯一值(id)，不可变
            cname:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:obj.cname // 重命名（中文）
            }, // 可监听，可系列化，唯一值(id)，不可变
            expr:{
                configurable:!!isSave,
                enumerable:!!isSave,
                writable:false,
                value:obj.expr
            } // 不可监听，不可系列化
        })
    }
}

class Chain {
    constructor(obj,type = ChainType.enum){
        Object.defineProperties(this,{
            id:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.id || null // `${Math.round(Math.random()*10000000)}`
            }, // 不可监听，可系列化，不可输入
            type:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:obj.type || type
            }, // 可监听，可系列化
            name:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:obj.name
            }, // 可监听，可系列化
            values:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:obj.values // 常量/sql。sql：第一个字段名必须为id,第二个为name,后面的字段名随意
            }, // 不可监听，可系列化
            colors:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:obj.colors || [] // [{id,value},……]
            }, // 可监听，可系列化
            userType:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:obj.userType || null
            } // 可监听，可系列化
        })
    }

    get enumData(){
        return this.values.split(/\n/mg).map(item=>item.split('|')) //[[id,name],……]
    }
    get colorEnums(){
        return Object.fromEntries(this.colors.map(t=>([t.id,t.value])))
    }

    static new(model,{ isSave = false,isDesk = false } = { isSave: false,isDesk: false }){
        return model.type === ChainType.enum ? new Chain(model) : new SqlChain(model,{isSave,isDesk})
    }
    userTypeVerify(){
        return true
    }
    toUserJson(){
        return JSON.parse(JSON.stringify(this))
    }
}
class SqlChain extends Chain{
    constructor(obj,{ isSave = false,isDesk = false } = { isSave: false,isDesk: false }){ // isDesk：true前台；false后台
        super(obj,ChainType.sql)
        Object.defineProperties(this,{
            values:{
                configurable:!!isSave || !isDesk,
                enumerable:!!isSave || !isDesk, // 不系列化输出前台
                writable:true,
                value:obj.values // 常量/sql。sql：第一个字段名必须为id,第二个为name,后面的字段名随意
            }, // 不可监听，可系列化
            db_id:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:obj.db_id
            }, // 不可监听，可系列化
            masterKeys:{
                configurable:!isDesk,
                enumerable:true,
                writable:!isDesk,
                value: new MasterKeys(obj.masterKeys)
            },
            fields:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:(obj.fields || []).map(t=>new Field(t,{isSave}))
            },
            noQuerys:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:obj.noQuerys || []  //排除的搜索条件:['fieldName',……]
            }, // 不可监听，可系列化
            // userKeys:{
            //     configurable:true,
            //     enumerable:true,
            //     writable:true,
            //     value:obj.userKeys || [] // 绑定用户 [{ufield:'',field:''}，……]
            // },
            sqlParamKeys:{
                configurable:false,
                enumerable:true,
                writable:true,
                value:obj.sqlParamKeys || [] // ['user属性']
            },// 不可监听，不可系列化；SQL @参数
            _pageSql:{
                configurable:!!isSave,
                enumerable:!!isSave,
                writable:true,
                value:obj._pageSql  //  type=sql时，_pageSql,_countSql,fields
            }, // 不可监听，不可系列化(后端可系列化)
            _countSql:{
                configurable:!!isSave,
                enumerable:!!isSave,
                writable:true,
                value:obj._countSql  //  type=sql时，_pageSql,_countSql,fields
            } // 不可监听，不可系列化(后端可系列化)
        })
    }

    get idField(){
        return this.fields.find(t=>t.name == this.masterKeys.id)
    }
    get nameField(){
        return this.fields.find(t=>t.name == this.masterKeys.name)
    }
    get pidField(){
        return this.masterKeys.pid ? this.fields.find(t=>t.name == this.masterKeys.pid) : null
    }
    get enumData(){
        throw Error(`不是“${ChainType.enum}”类型`)
    }
    uniqueVerify(){}
    userTypeVerify(userTypeId){
        return !this.userType || this.userType == userTypeId
    }
    toUserJson(){
        const model = JSON.parse(JSON.stringify(this))
        const props = ['values','db_id','userType','userKeys','sql','_pageSql','_countSql']
        props.forEach(key=>{
            delete model[key]
        })
        return model
    }
}

const Db = {
    id:null,
    cname:null,
    name:null,
    host:null,
    instance:null,
    port:null,
    account:null,
    password:null,
    enabled:true
} // 数据库

class Category {
    constructor(obj,live = true){
        Object.defineProperties(this,{
            id:{
                configurable:false,
                enumerable:true,
                writable:!!live,
                value:obj.id
            }, // 不可监听，可系列化
            pid:{
                configurable:false,
                enumerable:true,
                writable:!!live,
                value:obj.pid || 0
            }, // 不可监听，可系列化
            name:{
                configurable:!!live,
                enumerable:true,
                writable:!!live,
                value:obj.name
            }, // 可监听，可系列化
            seq:{
                configurable:false,//!!live,
                enumerable:true,
                writable:!!live,
                value:obj.seq || 0
            } // 可监听，可系列化
        })
    }
}

const Link = function(type = 'report') {
    return {
        column: '', // ename
        type, // report/url
        target: '', // report.id/url模板
        params: [], // type='report'时 [{name:'目标报表.demand.ename',value:'当前报表.column.ename'}]
        isMini: true, // true=迷你窗口
        isOne: true, // true:所有链接共享一个窗口；false:每个链接单独一个窗口
        isChild: true, 
        isCover:true, // 禁用默认值与非空设置
        title:'', //鼠标悬停时的文字提示
    }
}

/**
 * 后端用的(pageSql、countSql可系列化 保存)
 */
 class Report{
    constructor(obj, options = {}){
        const {
            enumer = false, // 是否 configurable、enumerable
            isFront = false // 是否 是前台(前端的前台)，如果是，好多属性可以禁止config、writ，提高性能。
        } = options
        Object.defineProperties(this,{
            id:{
                configurable:false,
                enumerable:true,
                writable:!obj.id,
                value:obj.id
            }, // 不可监听，可系列化
            name:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:obj.name
            }, // 可监听，可系列化
            from_id:{
                configurable:false,
                enumerable:true,
                value:obj.from_id || null  // 复制自那个报表。它的SQL、db_id与category_id都不能改变，共享于 源报表。
            }, // 不可监听，可系列化
            db_id:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:obj.db_id || null
            }, // 可监听，可系列化
            category_id:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:obj.category_id || null
            }, // 可监听，可系列化
            role_ids:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:obj.role_ids || []
            }, // 可监听，可系列化
            userKeys:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:obj.userKeys || []  // 绑定用户相关ID到查询条件。[{key,field}] me Binder
            }, // 可监听，可系列化
            sqlKeys:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.sqlKeys // @sql参数；数组:['@userPropName',……]
            }, // 可监听，可系列化；后端修改它的值。
            links:{
                configurable:!isFront,
                enumerable:!isFront,
                writable:!isFront,
                value:obj.links || [] // [Link,……]
            }, // 可监听，可系列化
            columns:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:[], //this.createColumns(obj.columns || [])
            }, // 可监听，可系列化
            demands:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:[], //this.createDemands(obj.demands || []) // 条件列：prior(true) + combi + enabled(false)，不是保存全部列
            }, // 可监听，可系列化
            sql:{
                configurable:!isFront,
                enumerable:!isFront,
                writable:!isFront,
                value:obj.sql || ''
            }, // 可监听，可系列化
            _pageSql:{
                configurable:!!enumer,
                enumerable:!!enumer,
                writable:true,
                value:obj._pageSql || null
            }, // 可监听？，可系列化？（默认不）
            _countSql:{
                configurable:!!enumer,
                enumerable:!!enumer,
                writable:true,
                value:obj._countSql || null
            }, // 可监听？，可系列化？（默认不）
            hide:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value: !!obj.hide
            }, // 可监听，可系列化
            enabled:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value: Object.prototype.hasOwnProperty.call(obj,'enabled') ? !!obj.enabled : true
            }, // 可监听，可系列化
            star:{ // 收藏
                configurable:true,
                enumerable:true,
                writable:true,
                value: obj.star // true|icon
            }, // 可监听，可系列化；没用到！！
            seq:{
                configurable:false,
                enumerable:true,
                writable:!isFront,
                value: obj.seq || 0
            } // 不可监听，可系列化
            // proc:null, // 存储过程
        })
        this._createColumns(obj.columns || [],{ enumer,isFront }).forEach(c=>this.columns.push(c))
        this._createDemands(obj.demands || [],{ isFront }).forEach(d=>this.demands.push(d))
    }
    _createColumns(objs,options = {}){
        const { 
            enumer = false,
            isFront = false
         } = options
        return objs.map(obj=>(obj instanceof Column ? obj : new Column(obj,{ isServer:enumer, isFront })))
    }
    _createDemands(objs,options = {}){
        const { isFront = false } = options
        return objs.map(obj=>{
            return obj instanceof DemandBase ? obj : (
                !obj.combi 
                ? new Demand(obj,this.columns.find(t=>t.ename === obj.ename),{ isFront })
                : new CombiDemand(obj,this.columns,{ isFront }))
        })        
    }
    getDemandError(){
        const demand = this.demands.filter(t=>t.prior && t.enabled).find(d=>d.getError())
        if(demand){
            return { demand, msg:`${demand.cname} 值不能为空`}
        }else{
            return false
        }
    } // 获取 条件 错误
    makeUpDemands(){
        const objs = this.columns.filter(c=>!c.isCustom && !this.demands.find(d=>d.ename === c.ename)).map(c=>({ename:c.ename}))
        const demands = this._createDemands(objs)
        this.demands = this.demands.concat(demands)
    } // 补全 缺失的条件
    toUserJson(){
        const model = JSON.parse(JSON.stringify(this))
        const props = ['db_id','role_ids','userKeys','sql','_pageSql','_countSql','enabled']
        props.forEach(key=>{
            delete model[key]
        })
        model.demands = model.demands.filter(t=>t.enabled)
        return model
    } // 输出 用户客户端的JSON对象(删掉不需要的属性、未启用的条件)
    toUserJson2(){
        const model = this.toUserJson()
        const props = ['columns','demands','links']
        props.forEach(key=>{
            delete model[key]
        })
        return model
    } // 输出 用户客户端的JSON对象(删掉不需要的属性)，比toUserJson更简洁
}

/**
 * 后端的
 */
class ServerReport extends Report{
    constructor(obj){
        super(obj,{ enumer:true })
    }
    get sqlConfigurable(){
        return Object.getOwnPropertyDescriptor(this,'_pageSql').configurable
    }
    toClientReport(){
        if(this.sqlConfigurable){
            Object.defineProperties(this,{
                _pageSql:{
                    configurable:false,
                    enumerable:false,
                    writable:true,
                    value:this._pageSql
                }, // 不可监听，不可系列化
                _countSql:{
                    configurable:false,
                    enumerable:false,
                    writable:true,
                    value:this._countSql
                } // 不可监听，不可系列化
            }) // 禁止系列化 _pageSql、_countSql
            this.columns.forEach(column=>{
                Object.defineProperties(column,{
                    expr:{
                        configurable:false,
                        enumerable:false,
                        writable:false,
                        value:column.expr
                    } // 不可监听，不可系列化  
                })
            }) // 禁止系列化 expr
        }
        return this
    }
    renewValueFromDefaultValue(){
        this.demands.filter(d=>d.type === 'cv').reduce((ary,d)=>ary.concat(d.items.filter(item=>item.type === 'd')),[]).forEach(d=>{
            if(!d.value.now) return
            ServerReport._forEachDateValue(d.value,(key)=>{
                d.value[key] = new Date(new Date(d.value[key]).getTime() + (new Date() - new Date(d.value.now)))
            })
        }) // 根据默认时间“相对值” 设置value
        this.demands.filter(d=>d.type === 'd' || (d.type === 'cn' && d.itemType === 'd')).forEach(d=>{
            if(!d.value.now) return
            ServerReport._forEachDateValue(d.value,(key)=>{
                d.value[key] = new Date(new Date(d.value[key]).getTime() + (new Date() - new Date(d.value.now)))
            })
        }) // 根据默认时间“相对值” 设置value
    }
    setRelativeDate(){
        this.demands.filter(d=>d.type === 'cv').reduce((ary,d)=>ary.concat(d.items.filter(item=>item.type === 'd')),[]).forEach(d=>{
            ServerReport._forEachDateValue(d.value,()=>{
                d.value.now = new Date()
            })
        })
        this.demands.filter(d=>d.type === 'd' || (d.type === 'cn' && d.itemType === 'd')).forEach(d=>{
            ServerReport._forEachDateValue(d.value,()=>{
                d.value.now = new Date()
            })
        })
    }
    static _forEachDateValue(value,callback){
        return !!['f','t','e'].filter(key=>value[key]).forEach(key=>{
            callback(key)
        })
    }
    addUserKeysToDemand(user){
        if(!user) return
        (this.userKeys || []).forEach(ukey=>{
            const demand = this.demands.find(t=>t.ename === ukey.field)            
            if(demand){
                if(demand.isCustom){
                    throw Error('自定义条件 不能绑定 登录用户 的属性。')
                }
                demand.value.u = user[ukey.ufield] // value.u，是指绑定“登录用户”的值
                // demand.value.way = equalWay
            }
        })
    }
    buildSqlWhereAndParams(isLayerDemand){
        // const demands = this.demands.filter(t=>t.enabled).filter(t=>!isEmpty(t.value.f) || !isEmpty(t.value.t) || !isEmpty(t.value.v) || !isEmpty(t.value.e))    
        const demands = this.demands.filter(t=>!isEmpty(t.value.f) || !isEmpty(t.value.t) || !isEmpty(t.value.v) || !isEmpty(t.value.e) || !isEmpty(t.value.u))
        const columns = this.columns.filter(t=>!t.func)

        const fragments = demands.map((demand)=>ServerReport._buildSqlWhereAndParams(demand,columns,isLayerDemand))
            .filter(t=>t)
            .reduce((ary,item)=>(ary.concat(item)),[])
            .filter(t=>t)
        return {
            params: fragments.filter(t=>t.name).map(t=>({name:t.name,value:t.value})),
            fragments: fragments.map(t=>t.fragment)
        }
    }
    static _buildSqlWhereAndParams(demand,columns,isLayerDemand) {
        if(demand.combi === 'cn'){
            if(!demand.value.lv) return null
            const item = demand.items.find(t=>t.ename === demand.value.lv)
            item.value = deepCopy(demand.value)
            demand = item
        }
        if(demand.combi === 'cv'){
            if(!demand.value.e) return null
            demand = demand.items.find(t=>t.id === demand.value.e) // 不需要dValue；前端应该把相对值设置好
            // demand = demand.items.find(t=>t.ename === demand.value.e) // 不需要dValue；前端应该把相对值设置好
        }
        {
            if(demand.dataType.toLowerCase() === 'uniqueidentifier'  && demand.type === 's' && demand.value && demand.value.way === '等于' 
            && demand.value.v !== '' && demand.value.v !== null && demand.value.v !== undefined){
                if(!isGuid(demand.value.v)){
                    throw Error(`${demand.cname} 不是GUID类型`)
                }
            }
        }  // GUID数据类型 判断；后面要写完整的所有类型的判断。；date和number在前端输入时都有限制，只有string没有。
        const column = columns.find(t=>t.ename === demand.ename)

        if(!column.kv && column.type === 'd' && demand.value && demand.value.e){
            const days = getDaySpan(demand.value.e)
            demand.value.f = days.min
            demand.value.t = days.max
            delete demand.value.e

            // const dt = new Date(new Date(demand.value.e).toDateString())
            // demand.value.f = dt.toISOString()
            // dt.setHours(23)
            // dt.setMinutes(59)
            // dt.setSeconds(59)
            // dt.setMilliseconds(999)
            // demand.value.t = dt.toISOString()
            // delete demand.value.e
        }  // 转化 单个时间输入值 为 from->to的形式。

        const keys = Object.keys(demand.value).filter(key=>['f','t','v','e','u'].includes(key) && (demand.value[key] !== '' && demand.value[key] !== null)) // 有值的f/t/v/e
        if(keys.length === 0) return null
        const paramsAndfragments = keys.map((key)=>{
            let fragment
            let name = `${demand.ename}_${key}_${parseInt((Math.random()+1)*10000)}` // 加“随机数”解决偶尔出现的参数重名
            // if(column.kv && key !== 'e') return null // 解决可能的bug
            if(key === 'u'){ // 绑定“登录用户”的属性
                fragment =  `${column.expr} = @${name}`
            }else if(column.kv){
                const yes = isLayerDemand(demand,column)
                if(!yes){ // 不是 层级条件
                    fragment =  `${column.expr} = @${name}`  // 如果是 下拉（未多选？？？）
                }else{
                    return null
                }
            }else if(key === 'f'){
                fragment =  `${column.expr} >= @${name}`
                if(demand.type === 'd'){
                    demand.value[key] = getDaySpan(demand.value.f).min
                }
            }else if(key === 't'){
                fragment =  `${column.expr} <= @${name}`
                if(demand.type === 'd'){
                    demand.value[key] = getDaySpan(demand.value.t).max
                }
            // }else if(key === 'e' && demand.ename.substring(demand.ename.length-2).toLowerCase() === 'id'){ // 如果是ID，用=比较
            //     fragment =  `${column.expr} = @${name}`
            }else if(key === 'e' && column.type === 's'){
                const [fragment2,value] = likes['包含']({
                    expr:column.expr,
                    name,
                    value:demand.value[key]
                })
                fragment =  fragment2
                demand.value[key] = value
            }else if(key === 'e' && ['n','d'].includes(column.type)){
                fragment =  `${column.expr} = @${name}`
            }else if(key === 'v' && column.type === 's'){
                const [fragment2,value] = likes[demand.value.way]({
                    expr:column.expr,
                    name,
                    value:demand.value[key]
                })
                fragment =  fragment2
                demand.value[key] = value
            }else if(key === 'v' && ['n','d'].includes(column.type)){
                const c = columns.find(t=>t.ename === demand.value[key])
                fragment =  `${column.expr} ${compareChar[demand.value.way]} ${c.expr}`
                name = null // 字段与字段比较，没有 参数名 了。
            }
            return {name,value:demand.value[key],fragment}
        })
        return paramsAndfragments
    }
    
}

const DataAttrs = ['dataType','dataLength','dataPrecision','dataScale','expr']

class Column{ // enumerable=false,vue也不能监听
    constructor(obj,options = {}){
        const { 
            isServer = false,
            isFront = false
         } = options
        Object.defineProperties(this,{
            ename:{
                configurable:false,
                enumerable:true,
                value:obj.ename
            }, // 不可监听，可系列化   
            cname:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:obj.cname
            }, // 可监听，可系列化
            kv:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:obj.kv
            }, // 可监听，可系列化   
            format:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:obj.format || null // 格式化 ? 格式化、kv 能不能共存？？？？
            }, // 可监听，可系列化   
            width:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:obj.width || SetWidth(obj.dataType,obj.dataLength)
            }, // 可监听，可系列化   
            fixed:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:obj.fixed || null // 固定：left/right/无
            }, // 可监听，可系列化   
            align:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:obj.align || SetAlign(obj.dataType,obj.dataLength) // 居中；左；右。
            }, // 可监听，可系列化   
            statsMode:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:obj.statsMode || '' // '':无；1：sum 求和；2：avg 平均；3：max 最大；4：min最小。  
            }, // 可监听，可系列化   
            hide:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:!!obj.hide  // 默认显示
            }, // 可监听，可系列化   
            sort:{
                configurable:!isServer,
                enumerable:!isServer,
                writable:true,
                value:obj.sort || null  //这个仅是 客户端的行为。l:left；r:right
            }, // 可监听，可系列化(前端用的，后端不需要) 
            filters:{
                configurable:!isServer,
                enumerable:!isServer,
                writable:true,
                value:obj.filters || [] // ['分组值1','分组值2',……]
            }, // 可监听，可系列化(前端用的，后端不需要)   
            enableSort:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:Object.prototype.hasOwnProperty.call(obj,'enableSort') ? !!obj.enableSort : true   // 是否启用 sort
            }, // 可监听，可系列化   
            enableFilter:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:Object.prototype.hasOwnProperty.call(obj,'enableFilter') ? !!obj.enableFilter : true  // 默认显示
            }, // 可监听，可系列化   
            enabled:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value: Object.prototype.hasOwnProperty.call(obj,'enabled') ? !!obj.enabled : true //  启用/禁用
            }, // 可监听，可系列化   
            func:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:obj.func
            }, // 可监听，可系列化             
            dataType:{
                configurable:false,
                enumerable:true,
                value:obj.dataType
            }, // 不可监听，可系列化 // 前端不能出现 这几个 属性，安全问题，尽量不能让用户知道表的结构，虽然他可以猜。（用另外的字符代替）
            dataLength:{
                configurable:false,
                enumerable:true,
                value:obj.dataLength
            }, // 不可监听，可系列化  // 前端不能出现 这几个 属性，安全问题，尽量不能让用户知道表的结构
            dataPrecision:{
                configurable:false,
                enumerable:true,
                value:obj.dataPrecision
            }, // 不可监听，可系列化  // 前端不能出现 这几个 属性，安全问题，尽量不能让用户知道表的结构
            dataScale:{
                configurable:false,
                enumerable:true,
                value:obj.dataScale
            }, // 不可监听，可系列化  // 前端不能出现 这几个 属性，安全问题，尽量不能让用户知道表的结构
            expr:{
                configurable:!!isServer,
                enumerable:!!isServer,
                writable:true,
                value:obj.expr
            } // 不可监听，不可系列化（默认不）
        })
    }
    get type(){
        if(this.kv){
            return 'kv'
        }else if(this.func){
            return 'func'
        }else{
            return this.sourceType
            // return SetType(this.dataType)
        }
    }
    get sourceType(){
        return SetType(this.dataType)
    }
    get isCustom(){
        return !!this.func
    }
}

class DemandBase{
    constructor(obj,options = {}){
        const { isFront = false } = options
        Object.defineProperties(this,{
            isFront:{
                configurable:false,
                enumerable:false,
                writable:false,
                value:isFront
            },
            ename:{
                configurable:false,
                enumerable:true,
                value:obj.ename
            }, // 不可监听，可系列化 
            prior:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:!!obj.prior, // 显示在列表页面上
            }, // 可监听，可系列化 
            nullable:{
                configurable:!isFront,
                enumerable:true,
                writable:true,  // 前台，链接报表 会需要改。
                value: Object.prototype.hasOwnProperty.call(obj,'nullable') ? obj.nullable : true, // 是否 允许空值
            }, // 可监听，可系列化 
            value:{
                configurable:true,
                enumerable:true,
                writable:true,
                value: deepCopy(obj.value || {}) // {e:null,f:null,t:null,way:null,v:null, lv:null,now:当前时间,u:绑定登录用户的(不出现在用户输入方式中；SQL用=比较)}, // 统一吧，否则编码太复杂。kv 只用到v。way='包含|大于'。date与num 才用到e；now是给“相对值”用的
            }, // 可监听，可系列化 
            shape:{
                configurable:!isFront,
                enumerable:true,
                writable:true, // 前台，链接报表 会需要改。
                value:obj.shape // 给子类重载： prior的输入方式。(e,f,v三种，默认：kv=v,str=v,date=f,num=f|e)。num:用户可选f|e  
            }, // 可监听，可系列化 
            enabled:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:Object.prototype.hasOwnProperty.call(obj,'enabled') ? obj.enabled : true // 是否作为条件列
            } // 可监听，可系列化 
        })
    }
    //#region 属性+方法
    get isCustom(){
        throw Error()
    }
    get type(){
        throw Error()
    }
    get dataType(){
        throw Error()
    }
    _getShape(){
        throw Error()
    }
    get _copy(){
        throw Error()
    }
    transformShape(value){
        value = value || this.value
        switch(this.shape){
            case 'e':
                this.shape = 'f'
                break
            case 'f':
                this.shape = 'v'
                break
            case 'v':
                this.shape = 'e'
                break
            default:
                this.shape = 'f'
        }
        
        Object.keys(value).forEach(key=>{
            if(key === 'lv') return
            value[key] = null
            delete value[key]  // 要不要用Vue.$delee？？
        })
    } // 切换shape时，清空值
    getError(nullable = null){
        nullable = nullable === null ? this.nullable : !!nullable
        if(nullable) return false

        switch(this.shape){
            case 'f':
                return isEmpty(this.value.f) || isEmpty(this.value.t)
            case 'e':
                return isEmpty(this.value.e)
            case 'v':
                return isEmpty(this.value.v) || isEmpty(this.value.way)
            default:
                return false
        }
    } // 获取 空错误；后面看要不要加其他错误信息，待扩展……
    //#endregion
}
class Demand extends DemandBase{
    constructor(obj,column,options = {}){
        const { isFront = false } = options
        obj.ename = column.ename
        super(obj,{ isFront })
        let _shape = obj.shape
        Object.defineProperties(this,{
            _c:{
                configurable:false,
                enumerable:false,
                writable:false,
                value:column
            } // 不可监听，不可系列化 
        })
        if(!isFront){ // Object.getOwnPropertyDescriptor(this, 'shape').configurable
            Object.defineProperties(this,{
                shape:{
                    configurable:true,
                    enumerable:true,
                    get(){
                        return this._getShape(_shape)
                    },
                    set(value){
                        _shape = value
                    }
                } // 可监听，可系列化 
            })
        }
    }
    //#region 属性+方法
    get cname(){
        return this._c.cname
    }
    get kv(){
        return this._c.kv
    }
    get expr(){
        return this._c.expr
    }
    get isCustom(){
        return false
    }
    get type(){
        return this._c.type
    }
    get dataType(){
        return this._c.dataType
    }
    _getShape(_shape){
        if(this.type === 'kv') return 'e'
        if(!_shape){
            switch(this.type){
                case 's': return 'e'
                case 'd': return 'f'
                case 'n': return 'f'
                default: return 'e' // 不会执行到这里
            }
        }else{
            return _shape
        }
    }
    get _copy(){
        const obj = deepCopy(this)
        return new this.constructor(obj,this._c,{ isFront: this.isFront})
    }
    //#endregion
}
class CombiDemand extends DemandBase{
    constructor(obj,columns = [],options = {}){
        const { isFront } = options
        obj.ename = obj.ename || `a${Math.round(Math.random()*10000000)}` // 此ename不同Demand.ename,只是一个唯一标识,不对应SQL field.
        super(obj,{ isFront })
        let _shape = obj.shape
        Object.defineProperties(this,{
            cname:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:obj.cname || ''  // 这是 name/label
            }, // 可监听，可系列化 
            combi:{
                configurable:false,
                enumerable:true,
                value:obj.combi || 'cv' // (cn,cv) 这个属性 是CombiDemand区别于Demand
            }, // 不可监听，可系列化 
            /**
             * items：
             *  组成 "组合条件" 的 Demand列表。
             *  item比Demand多一个属性rename。
             *  自然prior、enabled用不上
             */
            items:{
                configurable:!isFront,
                enumerable:true,
                writable:false,
                value:obj.items ? obj.items.map(d=>new CombiDemandItem(d,columns.find(t=>t.ename === d.ename),{ isFront })) : []  //[{ ename:'', rename:'', value:{}, shape: null }], 
            } // 可监听，可系列化 
        })
        if(!isFront){
            Object.defineProperties(this,{
                shape:{
                    configurable:true,
                    enumerable:true,
                    get(){
                        return this._getShape(_shape)
                    },
                    set(value){
                        _shape = value
                    }
                } // 可监听，可系列化 
            })
        }
    }
    //#region  属性+方法
    get isCustom(){
        return true
    }
    get type(){
        return this.combi
    }
    get selectItem(){
        return this.items.find(t=>t.ename === this.value.lv) || {}
    }
    get itemType(){
        return this.items[0] ? this.items[0].type : null
    }
    // get dataType(){
    //     return this.items[0].dataType // cv不需要这个属性，也有误。
    // }
    _getShape(_shape){
        if(this.type === 'cv') return 'e'
        if(!_shape){
            switch(this.itemType){
                case 'd': return 'f'
                case 'n': return 'f'
                default: return 'e'
            }
        }else{
            return _shape
        }
    }
    get _copy(){
        const options = { isFront:this.isFront }
        const obj = deepCopy(this)
        obj.items = []
        const instance = new this.constructor(obj,[],options)
        this.items.forEach(t=>instance.items.push(t._copy))
        return instance
    }
    //#endregion
}
class CombiDemandItem extends Demand{
    constructor(obj,column,options = {}){
        const { isFront } = options
        super(obj,column)
        Object.defineProperties(this,{
            id:{
                configurable:!isFront,
                enumerable:true,
                writable:false,
                value:obj.id || `a${parseInt(Math.random()*10000000)}`
            }, // 可监听，可系列化，不可改；cv的item允许重复条件(值不同)，所以需要一个ID来区分。
            rename:{
                configurable:!isFront,
                enumerable:true,
                writable:!isFront,
                value:obj.rename // 下拉重命名
            } // 可监听，可系列化 
        })
    }
}

/**
 * （前端的前台没用到，所以也不需要isFront参数）
 * @param {*} demand 
 */
function NewCombiDemandItemFromDemand(demand){
    const obj = deepCopy(demand)
    return new CombiDemandItem(obj,demand._c)
}

/**
 * 客户端需要的report：删掉需要的属性，加上“缺失”的 条件列
 * @param {*} serverReport 
 */
function  getClientReport(serverReport) {
    const report = deepCopy(serverReport)
    delete report._pageSql
    delete report._countSql

    report.columns.forEach(c=>delete c.expr)

    report.columns = report.columns || []
    report.demands = report.demands || []

    if(report.columns.length === 0) return report

    const missingDemands = report.columns.filter(c=>!c.func).map(c=>{
        if(report.demands.find(d=>d.ename === c.ename)) return false
        return new Demand({},c)
    }).filter(t=>t)
    report.demands = report.demands.concat(missingDemands)
    report.demands.filter(t=>!t.prior && !t.shape).forEach(d=>{
        const c = report.columns.find(t=>t.ename === d.ename)
        SetShape(d,c.type)
    })

    return report
}

function  SetShape(d,type) {
    if(type === 'n'){
        if(d.ename.toLowerCase().lastIndexOf('id') === d.ename.length - 2){
            d.shape = 'e'
        }
    }
} // type='n',且 ename = 'xxxxid',则 shape='e'

function SetType(dataType){
    switch(dataType){
        case 'BigInt':    
        case 'TinyInt':
        case 'Float':
        case 'Int':
        case 'SmallInt':             
        case 'Decimal':
        case 'Numeric':
        case 'Money':
        case 'SmallMoney':
            return 'n'

        case 'Date':
        case 'DateTime':
        case 'SmallDateTime': 
            return 'd'
        
        // case 'UniqueIdentifier':
        //     return 'g'

        default:
            return 's'        
    }
}

function SetWidth(dataType,dataLength=null){
    const minWidth = 60
    dataLength = dataLength || minWidth
    switch(dataType){
        case 'BigInt':
        // return dataLength < minWidth ? minWidth : dataLength
        case 'Char':
        case 'NChar':
        // return dataLength < minWidth ? minWidth : dataLength        
        case 'Float':
        // return dataLength < minWidth ? minWidth : dataLength
        case 'Int':
        // return dataLength < minWidth ? minWidth : dataLength
        case 'SmallInt':
        // return dataLength < minWidth ? minWidth : dataLength
        case 'TinyInt':
        // return dataLength < minWidth ? minWidth : dataLength        
        case 'Bit':
        // return dataLength < minWidth ? minWidth : dataLength
        return minWidth

        case 'Decimal':
        // return dataLength < minWidth ? minWidth : dataLength
        case 'Numeric':
        // return dataLength < minWidth ? minWidth : dataLength
        case 'Money':
        // return dataLength < minWidth ? minWidth : dataLength
        case 'SmallMoney':
        // return dataLength < minWidth ? minWidth : dataLength
        return 80

        case 'VarChar':
        // return dataLength < minWidth ? minWidth : dataLength        
        case 'NVarChar':
        return dataLength < minWidth ? minWidth*2 : dataLength * 2

        case 'DateTime':
        return 130
        case 'SmallDateTime':
        return 100

        case 'UniqueIdentifier':            
        // return dataLength < minWidth ? minWidth : dataLength
        case 'Timestamp':
        // return dataLength < minWidth ? minWidth : dataLength
        return 100

        case 'Text':
        // return dataLength < minWidth ? minWidth : dataLength        
        case 'NText':
        // return dataLength < minWidth ? minWidth : dataLength
        return 300

        default:
            return 100        
        // case 'Real':
        // return dataLength < minWidth ? minWidth : dataLength        
        // case 'Cursor':
        // return dataLength < minWidth ? minWidth : dataLength
        // case 'Sysname':
        // return dataLength < minWidth ? minWidth : dataLength
        // case 'Image':
        // return dataLength < minWidth ? minWidth : dataLength        
        // case 'Binary':
        // return dataLength < minWidth ? minWidth : dataLength
        // case 'VarBinary':
        // return dataLength < minWidth ? minWidth : dataLength
    }
}

function SetAlign(dataType,dataLength){
    if((dataType === 'VarChar' || dataType === 'NVarChar') && dataLength <= 40 ){
        return 'center'
    }
    switch(dataType){
        case 'Char':
        case 'NChar':
        case 'BigInt':       
        case 'Bit':
        case 'TinyInt':  
        case 'DateTime':
        case 'SmallDateTime':
        case 'UniqueIdentifier':   
            return 'center'

              
        case 'Float':
        case 'Int':
        case 'SmallInt':             
        case 'Decimal':
        case 'Numeric':
        case 'Money':
        case 'SmallMoney':
            return 'right'

        case 'VarChar':     
        case 'NVarChar':
        case 'Timestamp':
        case 'Text':       
        case 'NText':
            return 'left'

        default:
            return 'center'        
    }
}

const User = {
    id:null,
    name:null,
    password:null,
    role_ids:[],
    enabled:true, // 是否启用
    keys:[],  // 个人ID，部门ID，分公司ID 等，用来绑定 查询条件。[{key,value}……]
    verify(model){
        if(!model.name || model.name.trim().length === 0){
            throw Error(`账号不能为空`)
        }
        if(!model.password || model.password.trim().length === 0){
            throw Error(`密码不能为空`)
        }
        if(!model.role_ids.length===0){
            throw Error(`角色不能为空`)
        }
    }
}

const Role = {
    id:null,
    name:null,
    // seq:1,
    enabled:true
}

const UserType = function(){
    return {
        id: parseInt(Math.random()*100000),
        name:'', // 员工/客户/供应商
        path:'', // staff/customer/supplier
        // api:{
        //     mode:1, // 1:来自“数据库sql”;2:来自“远程接口”
        //     db:null, 
        //     roleSql:'',
        //     userSql:'',
        //     roleApi:'',
        //     userApi:'',
        //     userTstApi:''
        // }
        roleApi: null,
        userApi: null,
        userTstApi: null
    }
}

const Setting = function(){
    return {
        id:null,
        mobile: null,
        password: null, // 不可系列化(意味着 前后端不可传输)
        // background: null, // 后台桌面背景
        userTypes:[UserType()], // 前台用户类型。[{name:'供应商',path:'supplier'}]
        verify(model){
            if(!model.mobile || model.mobile.trim().length === 0){
                throw Error(`手机号不能为空`)
            }
            // if(!model.password || model.password.trim().length === 0){
            //     throw Error(`密码不能为空`)
            // }
        }
    }
}

class Task{
    constructor(obj){
        Object.defineProperties(this,{
            id:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.id
            }, // 不可监听，可系列化
            name:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:obj.name
            }, // 可监听，可系列化
            icon:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.icon
            }, // 不可监听，可系列化
            visible:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:!!obj.visible
            }, // 可监听，可系列化
            model:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.model
            } // 不可监听，可系列化
        })
    }
}
class TreeItem{
    constructor(obj){
        Object.defineProperties(this,{
            id:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.id
            }, // 不可监听，可系列化
            pid:{
                configurable:false,
                enumerable:true,
                writable:true,
                value:obj.pid
            }, // 不可监听，可系列化
            name:{
                configurable:false,
                enumerable:true,
                writable:true,
                value:obj.name
            }, // 可监听，可系列化
            class:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.class
            }, // 不可监听，可系列化
            icon:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.icon
            }, // 可监听，可系列化
            icon_open:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.icon_open
            }, // 可监听，可系列化
            folded:{ 
                configurable:true,
                enumerable:true,
                writable:true,
                value: !!obj.folded
            },// 可监听，可系列化；折叠/展开            
            moveable:{
                configurable:false,
                enumerable:true,
                writable:true,
                value: Object.prototype.hasOwnProperty.call(obj,'moveable') ? !!obj.moveable : true
            },// 可监听，可系列化；可移动的
            acceptable:{
                configurable:false,
                enumerable:true,
                writable:true,
                value: Object.prototype.hasOwnProperty.call(obj,'acceptable') ? !!obj.acceptable : true
            },// 可监听，可系列化；可接纳的
            acceptSigns:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.acceptSigns || null // ['xxx','yyyy'……]
            },// 可监听，可系列化；可接纳的"标记"列表，acceptable=true时可用，acceptSigns为null则接收所有。
            sign:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.sign || null
            },// 可监听，可系列化；"标记"   
            children:{
                configurable:true,
                enumerable:true,
                writable:true,
                value: obj.children || []
            },         
            model:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.model
            }, // 不可监听，可系列化；节点内容
            seq:{
                configurable:false,
                enumerable:false,
                writable:false,
                value:obj.seq
            } // 不可监听，不可系列化
        })
    }
}

class Manager extends Task{
    constructor(obj){
        super(obj)
        Object.defineProperties(this,{
            type:{
                configurable:false,
                enumerable:true,
                writable:false,
                value:obj.type  // m|r
            }, // 不可监听，可系列化
            loaded:{
                configurable:true,
                enumerable:true,
                writable:true,
                value:obj.loaded  // 异步：组件是否已加载
            }
        })
    }
}

/*
用户相关ID(在3个表里的结构)的说明：
Setting.userKeyNames = [
    {key:'1',name:'自己ID'},
    {key:'2',name:'部门ID'},
    {key:'3',name:'分公司ID'},
    {key:'4',name:'地区ID'},
    {key:'5',name:'集团ID'}
] // key是不会变的,名称、顺序 由用户修改
User.keys = [{key,value},……]  // 用户对应key的值
Report.userKeys = [{key,field},……] // 对应key在这个报表里 用户对应key的值 比较于 报表那个列
这里三者key一致
 */

 //#endregion
 
 module.exports = {
    Chinesize,
    Field,
    ChainType,
    Chain,
    SqlChain,
    Category,
    Db,
    Link,
    Report,
    ServerReport,
    Column,
    DemandBase,
    Demand,
    CombiDemand,
    NewCombiDemandItemFromDemand,

    Task,
    TreeItem,
    Manager,

    Role,
    User,
    Setting,
    UserType,
    deepCopy,
    SetType,
    SetWidth,
    SetAlign,
    SetShape, // 后端用的
    getClientReport,  // 前端 不用，要删。
    DataAttrs, // 前端不需要
    likes,
    compareChar,
    getWhereFragmentPriority,
    equalWay,
    BaseDataTypes,
    BaseJsDataTypes
}