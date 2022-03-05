import Vue from 'vue'

const sym = Symbol()
Vue.directive('error', {
  // bind(el,binding){},
  // inserted: function (el, binding) { // binding.value=string
  //   if (el.nodeName.toUpperCase() === 'INPUT') {
  //     el.type = binding.value
  //     // 本打算 写一些 处理，不写了。所以跟用HTML原生的 type一样: <input type=binding.value />
  //   }
  // },
  componentUpdated(el,binding){
    if(el[sym] === binding.value) return

    const hint = document.createElement('span')
    el.addEventListener('mouseenter',()=>{
      document.body.appendChild(hint)
    })
  },
  // unbind(el){
})
