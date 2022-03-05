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
    // el.style.zIndex = 1
  }
  
  target.style.cursor = 'move'
  target.style.userSelect = 'none'

  const down = function({clientX:x,clientY:y}){      
    el._lastXY = {x,y}
    document.body.addClass('optimize2') 
    document.addEventListener('mousemove', move,true)
    document.addEventListener('mouseup',up,true)
  }
  const move = function ({clientX:x,clientY:y}) {
    el.style.top = `${el.offsetTop + (y - el._lastXY.y)}px`
    el.style.left = `${el.offsetLeft + (x - el._lastXY.x)}px`
    el._lastXY.x = x
    el._lastXY.y = y
  }
  const up = function(){
    document.body.removeClass('optimize2')
    delete el._lastXY
    document.removeEventListener('mousemove', move,true)
    document.removeEventListener('mouseup',up,true)
  }

  target.addEventListener('mousedown', down,true)
  el[sym] = {selecteor,target,down}
}
const clear = function(el){
  if(!el[sym]) return

  el[sym].target.removeEventListener('mousedown', el[sym].down,true)
  el[sym].target.style.cursor = ''
  el[sym].target.style.userSelect = ''
  delete el[sym]
}
// IE 拖拽 还是卡，得"节流"
Vue.directive('move', {
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
