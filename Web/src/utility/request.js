/**
 * 文件说明：后端API调用基类，500错误统一处理(instance.requestErrorHandle)。
 */

import axios from 'axios'

const instance = axios.create({
  baseURL: '',
  timeout: 1000 * 60,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json; charset=UTF-8' }
})

instance.interceptors.request.use((config) => {
  config.url = config.url.replace(/\/$/, '') // 去掉最后面的/
  if(typeof (instance.requestConfigHandle) === 'function'){
    instance.requestConfigHandle(config)
  }  
  return config
}, async (error) => {
  if(typeof (instance.requestErrorHandle) === 'function'){
    await instance.requestErrorHandle(error)
  }
  return Promise.reject(error)
})

instance.interceptors.response.use((response) => {
  return response.data
}, async (error) => {
  const url = error.config.url
  const method = error.config.method
  if (error.response) {
    if (error.response.status === 500) {
      if(error.response.data){
        error.message = error.response.data       
      }
    }
  }
  error = { status: -1, message: error.message }
  
  if(typeof (instance.responseErrorHandle) === 'function'){
    await instance.responseErrorHandle(error,url,method)
  } // 非业务逻辑错误 处理统一写在这里
  return Promise.reject(error)
})

export default instance
