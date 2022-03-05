import Vue from 'vue'
import Vuex from 'vuex'
Vue.use(Vuex)

import {
    User as UserApi,
    Setting as SettingApi,
    Database as DatabaseApi,
    Chinesize as ChinesizeApi,
    Chain as ChainApi,
    Category as CategoryApi,
    Report as ReportApi,
    Faulter as FaulterApi
}  from '@/api'
import { Category } from '@/models'
const deepCopy = obj=>((obj === undefined || obj === null || obj === '') ? obj : JSON.parse(JSON.stringify(obj)))

import {
    // Cache,
    buildStore,
    buildClass
} from '@/stores/index.readonly'

const api = {
    // user: new UserApi(),
    setting: new SettingApi(),
    database: new DatabaseApi(),
    // chinesize: new ChinesizeApi(),
    // chain: new ChainApi(),
    // category: new CategoryApi()
}
const signs = {}
let adapterCache = {}

/**
 * 清除与模拟“登录用户”有关的数据
 * @param {*} state 
 */
function clearState (store){
    // state.categorys = null
    // state.chains = null
    // state.littleEnumChainValueEnums = {}
    // state.littleSqlChainValueEnums = {}
    // state.littleSqlChainDatas = {}
    adapterCache = {} // 模拟用户变了，清除adapterCache

    const ids = (store.state.chains || []).filter(t=>(t.sqlParamKeys && t.sqlParamKeys.length > 0) || (t.masterKeys && t.masterKeys.fid)).map(t=>t.id)
    if(ids.length > 0){
        let has = false
        ids.forEach(id=>{
            delete store.state.littleSqlChainDatas[id]
            delete store.state.littleSqlChainValueEnums[id]
            has = true
        })
        if(has){
            store.commit('littleSqlChainDatas',{...store.state.littleSqlChainDatas})
            store.commit('littleSqlChainValueEnums',{...store.state.littleSqlChainValueEnums})
        }
    }
}

// const cache = new Cache()
const store = buildStore(CategoryApi,ChainApi,{
    state: {
        // hash: null,
        // setting: null,        
        databases: null, // 只有最初为null
        // chains: null, // 只有最初为null // chians也应该 存到sessionStorage
        // littleChainValueEnums: {},
        // littleSqlChainValueEnums: {},
        // categorys: null, // 最初、重置 都为null
        roles: null, // 最初、重置 都为null
        // userMetadata: null, // 最初、重置 都为null
        tstUsersLoading:false, // tstUsers加载中状态；显示一个提示 体验好些。
        tstUsers:null,
        tstUser:null
    },
    getters(storeWrap,cache){
        return {
            hash(state){
                const store = storeWrap.case
                if(!state.hash){
                    store.commit('hash',cache.case.get('hash'))
                } // 从缓存拿
                if(!state.hash){
                    store.commit('hash',store.getters.setting && store.getters.setting.userTypes[0].id)
                } // 从setting拿
                return state.hash
            },
            userType(){
                throw Error()
            },
            user(){
                return null
            },
            setting(state){
                const store = storeWrap.case
                if(!state.setting){
                    store.commit('setting',cache.case.get('setting'))
                }
                if(!state.setting){
                    const sign = signs.setting = Math.random()
                    new UserApi().getLoginInfo(state.hash).then(model=>{
                        if(sign !== signs.setting) return  // 不是最新请求，抛弃
                        store.commit('setting',model)
                    }).catch(()=>{})
                }
                return state.setting ? deepCopy(state.setting) : null
            },
            currentUserType(state){
                if(!state.setting || !state.hash) return {}
                return state.setting.userTypes.find(t=>t.id == state.hash)
            },
            databases(state){  // getList接口没用到store.getters.hash，纯粹用vuex的 改变触发机制
                // const store = storeWrap.case
                if(state.databases === null){
                    const sign = signs.databases = Math.random()
                    api.database.getList(state.hash,state.setting).then(d=>{ 
                        if(sign !== signs.databases) return  // 不是最新请求，抛弃
                        state.databases = d || []
                    })
                }
                return state.databases || []
                // return deepCopy(state.databases || [])
            },
            chainNames(){
                const store = storeWrap.case
                return store.getters.chains
                    .filter(t=>!t.userType || t.userType == store.getters.currentUserType.id)
                    .map(t=>({id:t.id,name:t.name}))
            },
            roles(state){
                const store = storeWrap.case
                if(state.roles === null){
                    if(store.getters.setting){
                        const sign = signs.roles = Math.random()
                        api.setting.getRoles(store.getters.setting.id,store.getters.hash).then(d=>{
                            if(sign !== signs.roles) return  // 不是最新请求，抛弃
                            state.roles = d || []
                        })
                    }
                }
                return state.roles || []
                // return deepCopy(state.roles || [])
            },
            userMetadata(){
                const user = deepCopy(store.getters.tstUser)
                delete user.roles
                return user
            },
            tstUsers(state){
                const store = storeWrap.case
                if(!state.tstUsers && store.getters.setting){
                    state.tstUsersLoading = true
                    const sign = signs.tstUsers = Math.random()
                    api.setting.getTstUsers(store.getters.setting.id,state.hash).then(data=>{
                        if(sign !== signs.tstUsers) return  // 不是最新请求，抛弃
                        state.tstUsers = data || []
                    }).catch(()=>{
                        state.tstUsers = []
                    }).finally(()=>{
                        state.tstUsersLoading = false
                        clearState(store)
                    })
                }
                return state.tstUsers || []
            },
            tstUsersLoading(state){
                return state.tstUsersLoading
            },
            tstUser(state){
                if(!state.tstUser){
                    if(state.tstUsers && state.tstUsers.length > 0){
                        state.tstUser = state.tstUsers[0]
                    }
                }
                return state.tstUser || {}
            }
        }
    },
    mutations(storeWrap,cache){
        return {
            hash(state,value){
                if(state.hash == value) return

                state.categorys = null // 重置：不同前台类型 对应 不同报表目录
                state.roles = null // 重置
                // state.userMetadata = null // 重置
                state.tstUser = null
                state.tstUsers = null
                clearState(store)

                state.hash = value 
                cache.case.set('hash')
            },
            user(){},
            setting(state, model){
                const store = storeWrap.case
                if(state.setting == model) return

                state.setting = model
                cache.case.set('setting',state.setting)

                if(!state.setting){
                    store.commit('hash',null)
                }else{
                    const hash = store.getters.hash
                    if(hash && !state.setting.userTypes.find(t=>t.id == hash)){
                        store.commit('hash',state.setting.userTypes[0].id)
                    } // 如果hash不在setting中(被删除了)，更新hash    
                }
            },
            tstUser(state,user){
                state.tstUser = user

                clearState(store)
            }
            // littleSqlChainValueEnums(state,model){
            //     state.littleSqlChainValueEnums = model
            // } // 用mutations更新，getters才会跟着更新？？？？
        }
    }
})

const getters = store.getters

const { chainApi:chainApiReadonly, reportApi:reportApiReadonly } = buildClass(store,UserApi,ChainApi,ReportApi)

class userApi extends UserApi {
    constructor(){
        super()
    }
    async login(params){
        const model = await super.login(params)
        if(model){
            store.commit('setting',model)
        }
        return model
    }
    async logout(){
        const result = await super.logout()
        store.commit('setting',null)
        return result
    }
    async getLoginInfo(){
        throw Error()
        // const model = await super.getLoginInfo()
        // store.commit('setting',model)
        // return store.getters.setting
    }
}
class settingApi extends SettingApi {
    constructor(){
        super()
    }
    async update(model){
        const oldCurrentUserType = getters.currentUserType
        model = await super.update(model)
        store.commit('setting',model)
        {
            if(oldCurrentUserType.roleApi !== getters.currentUserType.roleApi){
                store.state.roles = null
            } // 如果角色接口 改了，重新获取角色
            if(oldCurrentUserType.userTstApi !== getters.currentUserType.userTstApi){
                store.state.tstUsers = null
                store.state.tstUser = null
            } // 如果 模拟用户 接口 改了，重新获取 模拟用户
        }
        return model
    }
    updateHash(id){
        store.commit('hash',id)
    }
    switchTstUser(userid){
        if(store.state.tstUsers && store.state.tstUsers.length > 0){
            const user = store.state.tstUsers.find(t=>t.id == userid)
            store.commit('tstUser',user)
        }else{
            throw Error(`测试用户不存在（id:${userid}）`)
        }        
    } // 切换 当前 模拟登录用户
    refreshTstUsers(){
        store.state.tstUsers = store.state.tstUsers === null ? '' : null // 确保tstUsers与上次的值不同
        store.state.tstUser = null
    } // 刷新（重新获取）模拟用户
}
class databaseApi extends DatabaseApi {
    constructor(){
        super()
    }
    getList(){
        throw Error(undefined)
    }
    async add(model){
        const m = await super.add(model)
        store.state.databases.push(m)
        return m
    }
    async update(model){
        const index = store.state.databases.findIndex(t=>t.id === model.id)
        if(index === -1) return null
        const m = await super.update(model)
        store.state.databases.splice(index,1,m)
        return m
    }
    async delete(id){
        const index = store.state.databases.findIndex(t=>t.id === id)
        if(index === -1) return

        await super.delete(id)
        store.state.databases.splice(index,1)
    }
}
class chainApi extends chainApiReadonly {
    constructor(){
        super()
    }
    async add(model){
        const m = await super.add(model)
        store.state.chains.push(Object.freeze(m))
        return m
    }
    async update(model){
        const m = await super.update(model)
        store.state.chains.splice(store.state.chains.findIndex(t=>t.id === model.id),1,Object.freeze(m))
        return m
    }
    async delete(id){
        const result = await super.delete(id)
        store.state.chains.splice(store.state.chains.findIndex(t=>t.id === id),1)
        return result
    }
    _updateStoreChain(id,callback){
        const i = store.state.chains.findIndex(t=>t.id === id)
        const model = deepCopy(store.state.chains[i])
        callback(model)
        store.state.chains.splice(i,1,Object.freeze(model))
    }
    async addQuery(id,name){        
        const noQuerys = await super.addQuery(id,name)
        this._updateStoreChain(id,model=>{
            model.noQuerys = noQuerys
        })
    }
    async removeQuery(id,name){        
        const noQuerys = await super.removeQuery(id,name)
        this._updateStoreChain(id,model=>{
            model.noQuerys = noQuerys
        })
    }
    async updateFieldCname(id,field){
        field = await super.updateFieldCname(id,field)
        this._updateStoreChain(id,model=>{
            model.fields.splice(model.fields.findIndex(t=>t.name === field.name),1,field)
        })
    }
    async updateColors(id,colors){
        colors = await super.updateColors(id,colors)
        this._updateStoreChain(id,model=>{
            model.colors = colors
        })
    }
    // async updateUserKeys(id,_userType,_userKeys){
    //     const { userType, userKeys } = await super.updateUserKeys(id,_userType,_userKeys)
    //     this._updateStoreChain(id,model=>{
    //         model.userType = userType
    //         model.userKeys = userKeys
    //     })
    // }
}
class categoryApi extends CategoryApi {
    constructor(){
        super()
    }
    _sort(model){
        const categorys = store.state.categorys
        let list = categorys.filter(t=>t.pid === model.pid).sort((a,b)=>a.seq - b.seq)
        list = deepCopy(list)
        list.forEach((item,i)=>{item.seq = i})
        list.filter(t=>t.seq >= model.seq).forEach((item,i)=>item.seq = model.seq + i + 1)
        list.forEach(item=>{
            categorys.splice(categorys.findIndex(t=>t.id === item.id),1,Object.freeze(item))
        })

        const oldIndex = categorys.findIndex(t=>t.id === model.id)
        const instance = Object.freeze(new Category(model)) // 用json会不会好点吗？
        if(oldIndex !== -1) categorys.splice(oldIndex,1)
        categorys.push(instance)
    }
    async add(model) {        
        const m = await super.add(model)
        // store.state.categorys.splice(0,0,m)
        this._sort(m)
        return m
    }
    async update(model) {        
        const m = await super.update(model)
        const categorys = store.state.categorys
        categorys.splice(categorys.findIndex(t=>t.id === m.id),1,Object.freeze(m))
        return m
    }
    async sort(model){
        await super.sort(model)
        this._sort(model)
    }
    async delete(id) {
        const model = await super.delete(id)
        this._deleteChildren(store.state.categorys,model.id)
        store.state.categorys.splice(store.state.categorys.findIndex(t=>t.id === id),1)
        return model
    }
    _deleteChildren(list,pid){
        let deletes = []
        const children = list.filter(t=>t.pid === pid)
        deletes = deletes.concat(children)
        children.forEach(item=>{
            list.splice(list.indexOf(item),1)
            deletes = deletes.concat(this._deleteChildren(list,item.id))
        })
        return deletes
    }
}
class chinesizeApi extends ChinesizeApi{}
class reportApi extends reportApiReadonly{
    constructor(){
        super()
    }
    async getAdapter(id){
        if(adapterCache[id]){
            return await super.getFull(adapterCache[id],true)
        }else{
            const data = await super.getAdapter(id,getters.tstUser)
            adapterCache[id] = data.id
            return data
        }
    }
}

const faulterApi = new FaulterApi()

export{
    getters,
    userApi,
    settingApi,
    databaseApi,
    chinesizeApi,
    chainApi,
    categoryApi,
    reportApi,
    faulterApi
}