import Vue from 'vue'
import request from '@/utility/request'
import router from '@/admin/router'
import { 
  getters,
  userApi,
  settingApi,
  databaseApi,
  chinesizeApi,
  chainApi,
  categoryApi,
  reportApi,
  faulterApi
} from '@/stores'
import App from '@/App.vue'

import { ChainType } from '@/models'
import '@/utility/html.extension'
import '@/utility/object.extension'
import '@/directives'
import '@/assets/font-awesome-4.7.0/css/font-awesome.min.css'
import '@/assets/css/scrollbar.css'
import '@/assets/css/raw.scss'
import '@/assets/css/main.scss'
import popup from '@/Uilibrary/popup.vue'
import minipopup from '@/Uilibrary/minipopup.vue'
import toggle from '@/Uilibrary/toggle.vue'
import combobox from '@/Uilibrary/combobox.vue'
import select from '@/Uilibrary/select.vue'
import option from '@/Uilibrary/option.vue'
import datePicker from '@/Uilibrary/datePicker.vue'
import declare from '@/Uilibrary/declare.vue'
import unagainButton from '@/Uilibrary/unagainButton.vue'
import tree from '@/Uilibrary/tree.vue'
import message from '@/Uilibrary/message.js'
import {isEmpty} from '@/utility/utility'
import globalErrorHandler from '@/utility/globalError'
import apiErrorSetting from '@/api.errorSetting'
import { escapes } from 'custompackages'
// import moment from 'moment'

Vue.config.productionTip = false
Vue.component('popup',popup)
Vue.component('r-minipopup',minipopup)
Vue.component('r-toggle',toggle)
Vue.component('r-combobox',combobox)
Vue.component('r-select',select)
Vue.component('r-option',option)
Vue.component('r-date-picker',datePicker)
Vue.component('r-declare',declare)
Vue.component('r-button',unagainButton)
Vue.component('r-tree',tree)

Vue.prototype.isEmpty = isEmpty
Vue.prototype.ChainType = ChainType
Vue.prototype.$message = new message()

const settingApi1 = new settingApi()

request.responseErrorHandle = request.requestErrorHandle = async function(error,url,method){
  if(error.message === '请先登录'){ // 结合 store里写的getters.setting来实现登录
    router.push({ name: 'login' })
  }else{
    if(error.message instanceof ArrayBuffer){      
      error.message = await escapes.ABEscape.ab2str(error.message)
    }
    if(error.message.includes('timeout of')){
      error.message = '超时'
    }
    if(error.message.includes('Timeout:')){
      error.message = '超时'
    }
    if((/ failed to complete in [\d]+ms/i).test(error.message)){
      error.message = '超时'
    }
    if((/Failed to cancel request in [\d]+ms/i).test(error.message)){
      error.message = '超时' // Failed to connect to 127.0.0.1:1433 in 15000ms
    }
    const errorSetting = apiErrorSetting[`${url.replace(/^\/admin\//i,'/api/')}:${method}`]
    if(errorSetting && !errorSetting.noauto){
      if(errorSetting.msg){
        Vue.prototype.$message.error(`${errorSetting.msg}（${error.message}）`,-1)
      }else{
        Vue.prototype.$message.error(error.message,-1)
      }
    }
    // Vue.prototype.$message.error(error.message)
  }
} // 后端错误 统一处理+登录跳转
{
  request.requestConfigHandle = function(config){
    // if (process.env.NODE_ENV == 'production'){
      config.url = config.url.replace(/^\/api\//,'/admin/')
    // }else{
    //   config.url = config.url.replace(/^\/api\//,'/api/admin/')
    // }
    config.headers.cuti = getters.hash || '' //  当前前台类型。 AJAX的headers设置
    config.headers['existed-sql-chains'] = JSON.stringify(getters.littleSqlChainKeys) // 前端已缓存，告诉后端不需要查询的chain
  }
  router.afterEach((to) => {
    settingApi1.updateHash(to.params.hash)
  })

  // 事实上不需要这个函数，因为store每次都会自动获取testUsers，获取不到(没登陆)会自动登陆的；写在request.responseErrorHandle里。
  // router.beforeEach(async (to, from, next) => {
  //   if (!getters.setting){
  //     const loginInfo = await userApi.getLoingInfo()
  //     if(!loginInfo)
  //     next({ name: 'login' })
  //   }else{
  //     next()
  //   }
  // }) // 登录跳转
} // store*router*ajax。

globalErrorHandler(error=>{faulterApi.write(error)},true)

new Vue({
  provide:{
    getters,
    userApi:new userApi(),
    settingApi:new settingApi(),
    databaseApi:new databaseApi(),
    chinesizeApi:new chinesizeApi(),
    chainApi:new chainApi(),
    categoryApi:new categoryApi(),
    reportApi:new reportApi(),
    hideGuide:false
  },
  router,
  render: h => h(App),
}).$mount('#app')
