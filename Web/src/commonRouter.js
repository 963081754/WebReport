import Vue from 'vue'
import Router from 'vue-router'

{
  const originalPush = Router.prototype.push
  const originalReplace = Router.prototype.replace
  //修改原型对象中的push方法
  Router.prototype.push = function push(location) {
    return originalPush.call(this, location).catch(error=>error)
  } // 解决路由重复进入时的报错：NavigationDuplicated: Avoided redundant navigation to current location

  // replace
  Router.prototype.replace = function push (location, onResolve, onReject) {
    if (onResolve || onReject) return originalReplace.call(this, location, onResolve, onReject)
    return originalReplace.call(this, location).catch(err => err)
  }
}
Vue.use(Router)

export default Router
