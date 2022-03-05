import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)
//#region 

import {
    Config as ConfigApi,
    User as UserApi,
    Category as CategoryApi,
    Chain as ChainApi,
    Report as ReportApi,
    Faulter as FaulterApi
}  from '@/api/index.readonly'
import { ChainType } from '@/models'
import Cache from '@/utility/cache'
import { getColorStyle } from '@/components/widgets'

function clearState (state){
    state.categorys = null
    state.chains = null
    state.littleEnumChainValueEnums = {}
    state.littleSqlChainValueEnums = {}
    state.littleSqlChainDatas = {}
}

const signs = {}
let adapterCache = {}

function buildStore(CategoryApi,ChainApi,options = {state:{},getters:()=>({}),mutations:()=>({})}) {
    let cache = { case: new Cache() }
    const storeWrap = { case:null}
    const store = storeWrap.case = new Vuex.Store({ // getList其实不需要这两个参数，参数hash、user是关联改变用的，
        state: {
            hash: null,
            userType: null,
            user: null,     // 前台用的
            setting: null,  // 后台用的，相当 前台的user，放在这里是为了给getters建立关系
            categorys: null,
            chains: null, // 只有最初为null // chians也应该 存到sessionStorage
            littleEnumChainValueEnums: {},
            littleSqlChainValueEnums: {}, 
            littleSqlChainDatas: {}, // {kv:[{f1,f2,f3,……}]} 完整数据
            clientHeight:document.body.clientHeight,
            clientWidth:document.body.clientWidth,
            ...options.state
        },
        getters:{
            hash(state){
                return state.hash
            },
            userType(state){
                if(!state.userType){
                    const sign = signs.userType = Math.random()
                    new ConfigApi().getUserType(state.hash).then(obj=>{
                        if(sign !== signs.userType) return // 不是最新请求，抛弃
                        state.userType = Object.freeze(obj)
                    })
                }
                return state.userType || {}
            },
            user(state){
                if(!state.user){
                    store.commit('user',cache.case.get('user'))
                }
                if(!state.user){
                    const sign = signs.user = Math.random()
                    new UserApi().getLoginInfo(state.hash).then(model=>{
                        if(sign !== signs.user) return // 不是最新请求，抛弃
                        store.commit('user',model)
                    }).catch(()=>{})
                }
                adapterCache = {} // 登录用户变了，清除 adapterCache
                return state.user
            },
            categorys(state){
                if(state.categorys === null){
                    const sign = signs.category = Math.random()
                    new CategoryApi().getList(state.hash,state.user,state.setting).then(d=>{ // 后面删掉参数hash、user 试试
                        if(sign !== signs.category) return // 不是最新请求，抛弃
                        state.categorys = d || []
                    })
                }
                return state.categorys || []
            },        
            chains(state){
                if(!state.chains){
                    const sign = signs.chains = Math.random()
                    new ChainApi().getList(state.hash,state.user,state.setting).then(d=>{
                        if(sign !== signs.chains) return // 不是最新请求，抛弃
                        state.chains = d
                    })
                }
                return state.chains || []
            }, // chains太重要、关联的太多，不先加载很难写！！！！
            publicChains(){
                return store.getters.chains.filter(t=>!t.userType)
            },
            userChains(state){
                return store.getters.chains.filter(t=>t.userType == state.hash)
            },
            littleSqlChainKeys(state){
                return Object.keys(state.littleSqlChainValueEnums).map(t=>parseInt(t))
            }, // 前端已存在的sql chain
            littleChainValueEnums(){
                const littleEnumChainValueEnums = store.state.littleEnumChainValueEnums
                const littleSqlChainValueEnums  = store.state.littleSqlChainValueEnums
                return (id)=>{
                    let obj = littleEnumChainValueEnums[id] || littleSqlChainValueEnums[id]
                    if(!obj){
                        const item = store.getters.chains.find(t=>t.id == id)
                        if(!item) return null //{}
                        if(item.type == ChainType.sql) return null
                        
                        obj = littleEnumChainValueEnums[id] = Object.freeze(Object.fromEntries(store.getters.littleEnumChainDatas(id).map(t=>[t.id,t.name])))
                    }
                    return obj
                }
            }, // {id:value,……}：state缓存：给“页面”绑定的形式
            littleEnumChainDatas(){
                const chains = store.getters.chains
                return (id)=>{
                    const model = chains.find(t=>t.id == id)
                    if(!model){
                        return []
                    }else{
                        return Object.freeze((model.values.split(/\r|\n/img).map(str=>str.split('|')).map(t=>({id:t[0],name:t[1]}))))
                    }
                }
            },  // [{id,name},……]:没state缓存：给“条件:下拉列表”绑定的形式
            littleSqlChainDatas(state){
                const littleSqlChainDatas = state.littleSqlChainDatas
                return (id)=>{
                    return littleSqlChainDatas[id] || []
                }
            }, // [{field1,field2,field3,……}]：，values数据不做删减，给“条件:多列下拉列表”绑定的形式
            chainColorStyleEnumss(){
                const enumss = store.getters.chains.filter(t=>t.colors && t.colors.length > 0).reduce((obj,chain)=>{
                    obj[chain.id] = Object.fromEntries(chain.colors.map(t=>([t.id,getColorStyle(t.value)])))
                    return obj
                },{})
                return enumss || {}
            }, // chain 的 HTML的style
            cSize(state){
                return {
                    w: state.clientWidth,
                    h: state.clientHeight
                }
            },
            ...options.getters(storeWrap,cache)
        },
        mutations:{
            hash(state,value){
                if(state.hash == value) return
                state.hash = Object.freeze(value)
    
                cache.case = new Cache(state.hash)
                clearState(state)
                state.user = null
            },
            user(state, model){
                if(state.user == model) return
    
                state.user = Object.freeze(model)
                cache.case.set('user',state.user)
                if(model){
                    clearState(state)
                }
            },
            littleSqlChainValueEnums(state,model){
                state.littleSqlChainValueEnums = model
            }, // 用mutations更新，getters才会跟着更新？？？？
            littleSqlChainDatas(state,model){
                state.littleSqlChainDatas = model
            },
            ...options.mutations(storeWrap,cache)
        }
    })
    {
        const setMaxSize = function(){
            store.state.clientHeight = document.body.clientHeight
            store.state.clientWidth = document.body.clientWidth
        }
        window.addEventListener('load',setMaxSize)
        window.addEventListener('resize',setMaxSize)
    }
    return store
}

const store = buildStore(CategoryApi,ChainApi)

const getters = store.getters

class hashApi {
    setHash(hash){
        store.commit('hash',hash)
    }
    out(){
        store.commit('user',null)
    }
}

function buildClass(store1, UserApi, ChainApi,ReportApi) {
    /**
     *  添加小的sql chain 加到store缓存中
     * @param {Number|string} kv chain.id
     * @param {Boolean} fulled 
     * @param {Array} list 
     * @returns 
     */
    const addFulledSqlChainToStore = function(kv,fulled,list,masterKeys){
        const obj = Object.freeze(Object.fromEntries(list.map(t=>([t[masterKeys.id],t[masterKeys.name]]))))
        if(fulled){
            const stateModel1 = Object.assign({},store1.state.littleSqlChainValueEnums,{[kv]:obj})
            store1.commit('littleSqlChainValueEnums',stateModel1)

            const stateModel2 = Object.assign({},store1.state.littleSqlChainDatas,{[kv]:Object.freeze(list)})
            store1.commit('littleSqlChainDatas',stateModel2)
        }        
        return obj
    }
    const addFulledSqlChainToStoreByPagingData = function(id,list,asyncTotal,searchers){
        const values = Object.values((searchers || {})).filter(t=>t)
        if(values.length > 0) return

        asyncTotal = asyncTotal instanceof Promise ? asyncTotal : Promise.resolve(asyncTotal)
        asyncTotal.then(total=>{
            if(total <= 50 && list.length <=50){
                const chain = getters.chains.find(t=>t.id == id)
                if(!chain) return // 有时候，chains还未加载，因为都是用异步，麻烦。
                addFulledSqlChainToStore(id,true,list,chain.masterKeys)
            }
        })
    }

    class userApi extends UserApi{
        constructor(){
            super()
        }
        async login(parmas){
            const model = await super.login(parmas)
            if(model){
                store1.commit('user',model)
            }
            return model
        }
        async logout(){
            const result = await super.logout()
            store1.commit('user',null)
            return result
        }
        async getLoginInfo(){
            throw Error()
            // const model = await super.getLoginInfo()
            // store1.commit('user',model)
            // return store1.getters.user
        }
    }

    class chainApi extends ChainApi{
        constructor(){
            super()
        }
        getList(){
            throw Error(undefined)
        }
        async getValuesOfSql(kv, itemIds, user){
            itemIds = [...new Set(itemIds)]
            const { fulled, list, masterKeys } = await super.getDataItems(kv, itemIds, user)
            if(!masterKeys) return {}
            return addFulledSqlChainToStore(kv,fulled,list,masterKeys)
        }
        async dataPaging(id, pageIndex, pageSize,searchers,sign,user,withTotal,asyncTotal){            
            return super.dataPaging(id, pageIndex, pageSize,searchers,sign,user,withTotal).then(({paging,sign})=>{
                addFulledSqlChainToStoreByPagingData(id,paging.list,asyncTotal,searchers)
                return {paging,sign}
            })
        }
    }
    
    class reportApi extends ReportApi{
        constructor(){
            super()
        }
        async getPagingChains(sign){
            const data = await super.getPagingChains(sign)
            data.filter(t=>t.data && t.data.fulled).forEach(({kv,data:{list,fulled,masterKeys}})=>{
                addFulledSqlChainToStore(kv,fulled,list,masterKeys)
            }) // 符合条件，缓存
            const list = data.filter(t=>t.data && !t.data.fulled)
                .map(t=>[t.kv,addFulledSqlChainToStore(t.kv,t.data.fulled,t.data.list,t.data.masterKeys)])
            return Object.fromEntries(list) // 返回不符合缓存条件的
        }
    }

    return { userApi, chainApi, reportApi }
}

const { userApi, chainApi, reportApi:_reportApi } = buildClass(store, UserApi, ChainApi, ReportApi)

const faulterApi = new FaulterApi()
class reportApi extends _reportApi{
    constructor(){
        super()
    }
    async getAdapter(id){
        if(adapterCache[id]){
            return await super.getFull(adapterCache[id],true)
        }else{
            const data = await super.getAdapter(id)
            adapterCache[id] = data.id
            return data
        }
    }
}

export{
    // Cache,
    buildStore,
    buildClass,

    hashApi,
    getters,
    userApi,
    chainApi,
    reportApi,
    faulterApi
}

//#endregion
