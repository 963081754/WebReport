/**
 * 文件说明：定义VUE指令 v-move
 * VUE自定义指令，看这里：https://cn.vuejs.org/v2/guide/custom-directive.html
 */

import Vue from 'vue'

const sym = Symbol()

const setup = function(el,selecteor){
  if(el[sym]) return
  if(selecteor === false) return

  const target =  selecteor ? el.querySelector(selecteor) : el
  if(!target) return

  if(el.getStyle('position')!=='fixed'){
    el.style.position = 'fixed'
  }
  
  target.style.cursor = 'move'
  target.style.userSelect = 'none'

  // const point = {x:parseInt(el.getStyle('marginLeft')),y:parseInt(el.getStyle('marginTop'))}
  // console.log(point)
  const unhand = target.moveForPress(({x,y})=>{
    // console.log(x,y)
    // point.x += x
    // point.y += y

    el.style.marginTop = `${parseInt(el.getStyle('marginTop')) + y}px`
    el.style.marginLeft = `${parseInt(el.getStyle('marginLeft')) + x}px`
  },null,null,0)
  el[sym] = {selecteor,target,unhand}
}
const clear = function(el){
  if(!el[sym]) return

  el[sym].unhand()
  el[sym].target.style.cursor = ''
  el[sym].target.style.userSelect = ''
}
// IE 拖拽 还是卡，得"节流"
Vue.directive('moveMargin', {
  inserted: function (el, binding) { // binding.value=selector(手柄)|false
    setup(el,binding.value)
  },
  componentUpdated(el, binding) {
    if(binding.value === false){
      clear(el)
    }else{
      if(!el[sym] || binding.value !== el[sym].selecteor){
        clear(el)
        setup(el,binding.value)
      }
    }
  },
  unbind(el){
    clear(el)
  }
})
