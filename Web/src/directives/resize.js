import Vue from 'vue'
const bindedSym = Symbol()

const resizeHandler = function(enabled,el){
    if(!enabled){
      if(el[bindedSym]){
        Array.prototype.forEach.call(el.querySelectorAll('.resize-stick'),child=>{
          if(child.parentNode){
            child.parentNode.removeChild(child)
          }
        })
        Array.prototype.forEach.call(el.querySelectorAll('.resize-angle-stick'),child=>{
          if(child.parentNode){
            child.parentNode.removeChild(child)
          }
        })
        delete el[bindedSym]
      }
      return
    }

    if(el[bindedSym]) return // 避免重复
  
    const minWidth = 100
    const minHeight = 80
  
    if(el.getStyle('position') === 'static'){
      el.style.position = 'relative'
    }
  
    const stick1 = document.createElement('span')    
    const stick2 = stick1.cloneNode(true)
    const stick3 = stick1.cloneNode(true)
    const stick4 = stick1.cloneNode(true)
    stick1.className = 'resize-stick resize-stick1'
    stick2.className = 'resize-stick resize-stick2'
    stick3.className = 'resize-stick resize-stick3'
    stick4.className = 'resize-stick resize-stick4'
    el.appendChild(stick1)
    el.appendChild(stick2)
    el.appendChild(stick3)
    el.appendChild(stick4)

    {
      {
        const noSelectText =function(){
          document.body.addClass('noSelectText')
        }
        stick1.addEventListener('mousedown', noSelectText)
        stick2.addEventListener('mousedown', noSelectText)
        stick3.addEventListener('mousedown', noSelectText)
        stick4.addEventListener('mousedown', noSelectText)
        document.addEventListener('mouseup', () => document.body.removeClass('noSelectText'))
      }
    
      {
        const move = function({clientY:y}){
          const addedValue = stick1._startInfo.y - y
          const h = stick1._startInfo.h + addedValue
          if(h<minHeight) return
          el.style.height = `${h}px`
          el.style.top = `${stick1._startInfo.top - addedValue}px`        
        }
        stick1.addEventListener('mousedown', ({clientY:y}) => {
          const top = parseInt(el.getStyle('top'))
          const h = parseInt(el.getStyle('height'))
          stick1._startInfo = {y,h,top}
          document.addEventListener('mousemove', move)
          console.log(h)
        })
        document.addEventListener('mouseup', () => {   
          delete stick1._startInfo
          document.removeEventListener('mousemove', move)
        })
      }
    
      {
        const move = function({clientX:x}){
          const w = stick2._startInfo.w + x - stick2._startInfo.x
          if(w<minWidth) return
          el.style.width = `${w}px`
        }    
        stick2.addEventListener('mousedown', ({clientX:x}) => {
          const w = parseInt(el.getStyle('width'))
          stick2._startInfo = {x,w}
          document.addEventListener('mousemove', move)
        })
        document.addEventListener('mouseup', () => {   
          delete stick2._startInfo
          document.removeEventListener('mousemove', move)
        })
      }
    
      {
        const move = function({clientY:y}){
          const h = stick3._startInfo.h + y - stick3._startInfo.y
          if(h<minHeight) return
          el.style.height = `${h}px`
        }
        stick3.addEventListener('mousedown', ({clientY:y}) => {
          const h = parseInt(el.getStyle('height'))
          stick3._startInfo = {y,h}
          document.addEventListener('mousemove', move)
        })
        document.addEventListener('mouseup', () => {   
          delete stick3._startInfo
          document.removeEventListener('mousemove', move)
        })
      }
    
      {
        const move = function({clientX:x}){
          const w = stick4._startInfo.w - x + stick4._startInfo.x
          if(w<minWidth) return
          el.style.width = `${w}px`
          el.style.left = `${stick4._startInfo.left + + x - stick4._startInfo.x}px`
        }    
        stick4.addEventListener('mousedown', ({clientX:x}) => {
          const left = parseInt(el.getStyle('left'))
          const w = parseInt(el.getStyle('width'))
          stick4._startInfo = {x,w,left}
          document.addEventListener('mousemove', move)
        })
        document.addEventListener('mouseup', () => {   
          delete stick4._startInfo
          document.removeEventListener('mousemove', move)
        })
      }
    }

    const stick11 = stick1.cloneNode(true)    
    const stick22 = stick11.cloneNode(true)
    const stick33 = stick11.cloneNode(true)
    const stick44 = stick11.cloneNode(true)
    stick11.className = 'resize-angle-stick resize-angle-stick1'
    stick22.className = 'resize-angle-stick resize-angle-stick2'
    stick33.className = 'resize-angle-stick resize-angle-stick3'
    stick44.className = 'resize-angle-stick resize-angle-stick4'
    el.appendChild(stick11)
    el.appendChild(stick22)
    el.appendChild(stick33)
    el.appendChild(stick44)
    {
      {
        const noSelectText =function(){
          document.body.addClass('noSelectText')
        }
        stick11.addEventListener('mousedown', noSelectText)
        stick22.addEventListener('mousedown', noSelectText)
        stick33.addEventListener('mousedown', noSelectText)
        stick44.addEventListener('mousedown', noSelectText)
        document.addEventListener('mouseup', () => document.body.removeClass('noSelectText'))
      }

      {
        const move = function({clientY:y,clientX:x}){
          const w = stick11._startInfo.w - x + stick11._startInfo.x
          const h = stick11._startInfo.h - y + stick11._startInfo.y
          if(w >= minWidth){
            el.style.width = `${w}px`
            el.style.left = `${stick11._startInfo.left + x - stick11._startInfo.x}px`
          }
          if(h >= minHeight){
            el.style.height = `${h}px`
            el.style.top = `${stick11._startInfo.top + y - stick11._startInfo.y}px`
          }
        }    
        stick11.addEventListener('mousedown', ({clientY:y,clientX:x}) => {
          const left = parseInt(el.getStyle('left'))
          const top = parseInt(el.getStyle('top'))
          const w = parseInt(el.getStyle('width'))
          const h = parseInt(el.getStyle('height'))
          stick11._startInfo = {x,y,w,h,top,left}
          document.addEventListener('mousemove', move)
        })
        document.addEventListener('mouseup', () => {   
          delete stick11._startInfo
          document.removeEventListener('mousemove', move)
        })
      }
      {
        const move = function({clientY:y,clientX:x}){
          const w = stick22._startInfo.w + x - stick22._startInfo.x
          const h = stick22._startInfo.h - y + stick22._startInfo.y
          if(w >= minWidth){
            el.style.width = `${w}px`
            // el.style.left = `${stick22._startInfo.left + x - stick22._startInfo.x}px`
          }
          if(h >= minHeight){
            el.style.height = `${h}px`
            el.style.top = `${stick22._startInfo.top + y - stick22._startInfo.y}px`
          }
        }    
        stick22.addEventListener('mousedown', ({clientY:y,clientX:x}) => {
          const top = parseInt(el.getStyle('top'))
          const w = parseInt(el.getStyle('width'))
          const h = parseInt(el.getStyle('height'))
          stick22._startInfo = {x,y,w,h,top}
          document.addEventListener('mousemove', move)
        })
        document.addEventListener('mouseup', () => {   
          delete stick22._startInfo
          document.removeEventListener('mousemove', move)
        })
      }
      {
        const move = function({clientY:y,clientX:x}){
          const w = stick33._startInfo.w + x - stick33._startInfo.x
          const h = stick33._startInfo.h + y - stick33._startInfo.y
          if(w >= minWidth){
            el.style.width = `${w}px`
            // el.style.left = `${stick33._startInfo.left + + x - stick33._startInfo.x}px`
          }
          if(h >= minHeight){
            el.style.height = `${h}px`
            // el.style.left = `${stick33._startInfo.left + + x - stick33._startInfo.x}px`
          }
        }    
        stick33.addEventListener('mousedown', ({clientY:y,clientX:x}) => {
          // const left = parseInt(el.getStyle('left'))
          const w = parseInt(el.getStyle('width'))
          const h = parseInt(el.getStyle('height'))
          stick33._startInfo = {x,y,w,h}
          document.addEventListener('mousemove', move)
        })
        document.addEventListener('mouseup', () => {   
          delete stick33._startInfo
          document.removeEventListener('mousemove', move)
        })
      }
      {
        const move = function({clientY:y,clientX:x}){
          const w = stick44._startInfo.w - x + stick44._startInfo.x
          const h = stick44._startInfo.h + y - stick44._startInfo.y
          if(w >= minWidth){
            el.style.width = `${w}px`
            el.style.left = `${stick44._startInfo.left + + x - stick44._startInfo.x}px`
          }
          if(h >= minHeight){
            el.style.height = `${h}px`
            // el.style.left = `${stick44._startInfo.left + + x - stick44._startInfo.x}px`
          }
        }    
        stick44.addEventListener('mousedown', ({clientY:y,clientX:x}) => {
          const left = parseInt(el.getStyle('left'))
          const w = parseInt(el.getStyle('width'))
          const h = parseInt(el.getStyle('height'))
          stick44._startInfo = {x,y,w,h,left}
          document.addEventListener('mousemove', move)
        })
        document.addEventListener('mouseup', () => {   
          delete stick44._startInfo
          document.removeEventListener('mousemove', move)
        })
      }
    }
    el[bindedSym] = true
}
  
Vue.directive('resize', {
  componentUpdated (el, binding) {  // binding.value=true|false
    resizeHandler(!!binding.value,el)
  },
  unbind(el){
    resizeHandler(false,el)
  }
})
  