import Vue from 'vue'

Vue.directive('onInserted', {  
  inserted(el,{ value:{callback} }) { // 当被绑定的元素插入到 DOM 中时……
    if(typeof(callback) === 'function'){
        Vue.nextTick(()=>{
            callback()
        })
    }
  }
})