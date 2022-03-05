/**
 * 文件说明：API调用+客户端<->服务端 数据转换。
 */

 import request from '@/utility/request'
import { deepCopy } from 'custompackages/models'

 //#region 

 class Base{
   constructor(urlPrefix){
     this.pref = urlPrefix
   }
 }

class Faulter{
  write(obj) {
    return request.post('/error',obj).catch(()=>{}) // catch：避免错误请求死循环
  }
}

class Config extends Base{
  getUserType() {
    return request.get('/api/userType')
  }
}
 
 class User extends Base{
  constructor(){
    super()
  }
  login(model) {
    return request.post('/api/login',model)
  }
  logout() {
    return request.get('/api/logout')
  }
  getLoginInfo() {
    return request.get('/api/loginInfo')
  } // 从session获取用户的登录信息，null为不存在
 }

 class Category extends Base{
   constructor(){
     super('/api/category')
   }
   getList() {
     return request.get(`${this.pref}/list`).then((list) => {      
       list.forEach(row => {
        row.children = []
        Object.freeze(row)
       })
       return list
     })
   }
 }
 
 class Chain extends Base{
   constructor(){
     super('/api/chain')
   }
   getList(){
     return request.get(`${this.pref}/list`).then((list) => {
       list.forEach(row => Object.freeze(row))
       return list
     })
   }
   getDataItems(id, itemIds, user){
     return request.post(`${this.pref}/data/items`,{id, itemIds, user}).then(({fulled,list,masterKeys}) => {
       list.forEach(item=>Object.freeze(item))
       return {fulled,list,masterKeys}
     })
   }
   dataPaging(id, pageIndex, pageSize,searchers,sign,user,withTotal){
     return request.post(`${this.pref}/data/paging`,{id, pageIndex, pageSize, searchers,sign,user,withTotal})
     .then(({paging}) => {
       paging.list.forEach(item=>Object.freeze(item))
       return {paging,sign}
     })
   }
   getPagingTotal({sign}) {
    return request.post(`${this.pref}/paging/total`,{sign})
   }
   /**
    * 根据某层的某个值，查 多层次数据{所有祖级、父级+直接子级（如果有）}；返回值=[[祖级],……,[父级],[己级],[子级]]，子级没有侧=[]
    * @param {*} id 
    * @param {object} user 模拟登录用户：前台不需要传这个参数
    * @param {*} descendantId 
    * @param {*} sign 
    */
   dataLayerByDid(id,user,descendantId,sign){
    return request.post(`${this.pref}/data/layerByDid`,{id,user,descendantId}).then((list) => {
      list.forEach(items=>items.forEach(item=>Object.freeze(item)))
      return {lists:list,sign}
    })
  }
  /**
   * 
   * @param {*} id 
   * @param {object} user 模拟登录用户：前台不需要传这个参数
   * @param {*} pid 
   * @param {*} sign 
   * @param {*} unfreeze 不冻结
   */
  dataLayerByPid(id,user,pid,sign,unfreeze = true){
    return request.post(`${this.pref}/data/layerByPid`,{id,user,pid}).then((list) => {
      if(!unfreeze) list.forEach(item=>Object.freeze(item))
      return {list,sign}
    })
  }
 }

 class Report extends Base{
   constructor(){
     super('/api/report')
     this._cache = {}
   }
   getListAsSimple(){
     return request.get(`${this.pref}/list/less`).then((list) => {
       list.sort((a,b)=>a.category_id === b.category_id ? a.seq - b.seq : a.category_id - b.category_id)
         .forEach(row => Object.freeze(row))
       return list
     })
   }
   paging({pageIndex,pageSize,model,sign,user=null,withTotal}) {
    if(withTotal){
      model = deepCopy(model) // 有个奇怪的BUG，找不到原因，需要这样解决。
    }    
    return request.post(`${this.pref}/paging`,{pageIndex,pageSize,model,sign,user,withTotal}).then((obj) => {
    if(!obj.error){
      obj.paging.list.forEach((row,i) => {
        row.n = i+1
        // Object.freeze(row)
      })
    }
    return {...obj,sign}
    })
   }
   getPagingTotal({sign}) {
    return request.post(`${this.pref}/paging/total`,{sign})
   }
   getPagingChains(sign){
     return request.post(`${this.pref}/paging/chains`,{sign})
   } // 配合paging，加载paging 列表的“别针”
   getFull(id, cache){ // 这个API调用频繁，缓存起来；只要修改了任何报表，都会清除this._cache（在api/index.js文件）。
     if(cache && this._cache[id]){
       return this._cache[id]
     }
     return request.get(`${this.pref}/full`,{params:{id}}).then(data=>{
       if(cache){
        this._cache[id] = data
       }
       return data
     })
   }
  /**
   * 获取报表，如果没有权限，则获取与它共享SQL的有权限的报表。
   * @param {*} id 
   * @param {*} user 后台的 模拟登录用户
   */
   getAdapter(id,user){
    return request.post(`${this.pref}/adapter`,{id,user}).then(data=>{
      this._cache[data.id] = data
      return data
    })
   }
   download(model,user){
    return request.post(`${this.pref}/download`,{model,user},{responseType:'arraybuffer'})
   }
 }
 
 //#endregion

 export{
  request,
  Config,
  Base,
  User,
  Chain,
  Category,
  Report,
  Faulter
 }