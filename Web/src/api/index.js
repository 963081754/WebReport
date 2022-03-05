/**
 * 文件说明：API调用+客户端<->服务端 数据转换。
 */

import { request, Base, User, Chain as ChainReadonly, Category as CategoryReadonly, Report as ReportReadonly, Faulter } from '@/api/index.readonly'

// class Admin extends User{
//   constructor(){
//     super()
//   }
// }

class Database extends Base{
  constructor(){
    super('/api/db')
  }
  getList(){
    return request.get(`${this.pref}/list`)
  }
  add(model){
    return request.put(this.pref,model)
  }
  update(model){
    return request.post(this.pref,model)
  }
  delete(id){
    return request.delete(this.pref,{params:{id}})
  }
  sort(id,index){
    return request.post(`${this.pref}/sort`,{id,index})
  }
  testConnect(params) {
    return request.get(`${this.pref}/testConnect`,{params})
  }
}

class Chinesize extends Base{
  constructor(){
    super('/api/chinesize')
  }
  getList(){
    return request.get(`${this.pref}/list`)
  }
  saveList(list){
    return request.put(`${this.pref}/list`,list)
  }
}

class Category extends CategoryReadonly{
  constructor(){
    super()
  }
  add(model) {
    return request.put(this.pref,model)
  }
  update(model) {
    return request.post(this.pref,model)
  }
  sort(model){
    return request.post(`${this.pref}/sort`,model)
  }
  delete(id) {
    return request.delete(this.pref,{params:{id}})
  }
}

class Setting extends Base{
  constructor(){
    super('/api/setting')
  }
  update(model) {
    return request.post(this.pref,model)
  }
  getRoles(id,userTypeId){
    return request.get(`${this.pref}/roles`,{params:{id,userTypeId}}).then(list=>{
      list.forEach(t=>Object.freeze(t))
      return Object.freeze(list)
    })
  }
  getUserMetadata(id,userTypeId){
    return request.get(`${this.pref}/userMetadata`,{params:{id,userTypeId}}).then(obj=>{
      delete obj.roles
      Object.freeze(obj)
      return obj
    })
  }
  getTstUsers(id,userTypeId){
    return request.get(`${this.pref}/testUsers`,{params:{id,userTypeId}}).then(obj=>{
      obj.forEach(t=>Object.freeze(t))
      Object.freeze(obj)
      return obj
    })
  }
  testUserApi(type,url) {
    return request.get(`${this.pref}/testUserApi`,{params:{type,url}})
  }
}

class Chain extends ChainReadonly{
  constructor(){
    super()
  }
  sort(id,index){
    return request.post(`${this.pref}/sort`,{id,index})
  }
  removeQuery(id,name){
    return request.delete(`${this.pref}/query`,{params:{id,name}})
  }
  addQuery(id,name){
    return request.put(`${this.pref}/query`,{id,name})
  }
  updateFieldCname(id,field){
    return request.post(`${this.pref}/cname`,{id,field})
  }
  updateColors(id,colors){
    return request.post(`${this.pref}/colors`,{id,colors})
  }
  // updateUserKeys(id,userType,userKeys){
  //   return request.post(`${this.pref}/userKeys`,{id,userType,userKeys})
  // }
  add(model) {
    return request.put(this.pref,model)
  }
  update(model) {
    return request.post(this.pref,model)
  }
  delete(id) {
    return request.delete(this.pref,{params:{id}})
  }
  testSql(sql,db_id,user) {
    return request.post(`${this.pref}/testSql`,{sql,db_id,user})
  }
}

class Report extends ReportReadonly{
  constructor(){
    super()
  }
  _clearCache(id){
    delete this._cache[id]
  } // 后台频繁修改 报表结构，所以要清除缓存
  get(id) {
    return request.get(this.pref,{params:{id}})
  }
  copy(source_id,newName) {
    return request.put(`${this.pref}/copy`,{source_id,newName})
  }
  add(model) {
    return request.put(this.pref,model)
  }
  update(model) {
    this._clearCache(model.id)
    return request.post(this.pref,model)
  }
  enable(id,enable) {
    this._clearCache(id)
    return request.post(`${this.pref}/enable`,{id,enable})
  }
  hide(id,hide) {
    this._clearCache(id)
    return request.post(`${this.pref}/hide`,{id,hide})
  }
  sort(model){
    this._clearCache(model.id)
    return request.post(`${this.pref}/sort`,model)
  }
  delete(id) {
    this._clearCache(id)
    return request.delete(this.pref,{params:{id}})
  }
  updateStar(id,star){
    this._clearCache(id)
    return request.post(`${this.pref}/star`,{id,star})
  }
  parseSql(dbId,sql,user) {
    return request.post(`${this.pref}/parseSql`,{dbId,sql,user}).then(({model,paging,msg}) => {
      paging.list.forEach((row,i) => {
        row.n = i+1
        // Object.freeze(row)
      })
      return {model,paging,msg}
    })
  }
}

export{
  User,
  Setting,
  Database,
  Chinesize,
  Chain,
  Category,
  Report,
  Faulter
}