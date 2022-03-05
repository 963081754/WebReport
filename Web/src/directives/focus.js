import Vue from 'vue'
// 注册一个全局自定义指令 `v-focus`
Vue.directive('focus', {
  // 当被绑定的元素插入到 DOM 中时……
  inserted(el,{value}) {
    if(value)
    {
      el.focus()
    }
  },
  update(el,{value}) {
    if(value)
    {
      el.focus()
    }
  }
})

// 注册一个全局自定义指令 `v-focus-select`
Vue.directive('focus-select', {
  inserted(el) {
    el.addEventListener('focus',()=>{
      el.select()
    })
  }
})