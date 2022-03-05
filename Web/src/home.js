import Vue from 'vue'
import request from '@/utility/request'
import router from '@/home/router'
import { 
  hashApi,
  getters,
  userApi,
  // categoryApi,
  chainApi,
  reportApi,
  faulterApi,
} from '@/stores/index.readonly'
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
import errorHandler from '@/utility/globalError'
import apiErrorSetting from '@/api.errorSetting'
import { escapes } from 'custompackages'

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

// Vue.prototype.isEmpty = isEmpty
Vue.prototype.ChainType = ChainType
Vue.prototype.$message = new message()

const hashOpt = new hashApi()

request.responseErrorHandle = request.requestErrorHandle = async function(error,url,method){
  if(error.message === '请先登录'){
    if(['singleDisplayerLogin','singleDisplayer','contextmenu'].includes(router.history.current.name)){
      router.push({ name: 'singleDisplayerLogin' })
    }else{
      router.push({ name: 'login' })
    }    
    // hashOpt.out() // 清掉user
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
      error.message = '超时'
    }
    const errorSetting = apiErrorSetting[`${url.replace(/^\/frontApi\//i,'/api/')}:${method}`]
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
      config.url = config.url.replace(/^\/api\//,'/frontapi/')
    // }else{
    //   config.url = config.url.replace(/^\/api\//,'/api/frontapi/')
    // }    
    config.headers['user-type-hash'] = getters.hash  // 前台类型
    config.headers['existed-sql-chains'] = JSON.stringify(getters.littleSqlChainKeys) // 前端已缓存，告诉后端不需要查询的chain
  }
  router.beforeEach((to, from, next) => {
    hashOpt.setHash(to.params.hash)
    next()
  })
} // store*router*ajax。

errorHandler(error=>{faulterApi.write(error)},true)

new Vue({
  provide:{
    getters,
    userApi:new userApi(),
    // categoryApi,
    chainApi:new chainApi(),
    reportApi:new reportApi(),
    hideGuide:true
  },
  router,
  render: h => h(App)
}).$mount('#app')
