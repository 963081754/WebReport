import Vue from 'vue'

const vhSize = 12
const increment = 90

/**
 * wheel+(position:relative)，IE的样子也可以。
 */
const setStillSite = function(el,dir=null){
    if(!dir || dir === 'v'){
        const theads = el.querySelectorAll('thead > tr > th')
        Array.prototype.forEach.call(theads,(cell)=>{
            cell.style.top = `${el.scrollTop}px`
        })
    

        const tfoots = el.querySelectorAll('tfoot > tr > td')
        Array.prototype.forEach.call(tfoots,(cell)=>{
            cell.style.bottom = `${el.scrollHeight - el.clientHeight - el.scrollTop}px`
        })
    }

    if(!dir || dir === 'h'){
        const cells1 = el.querySelectorAll('td[fixed*=l],th[fixed*=l]')
        Array.prototype.forEach.call(cells1,(cell)=>{
            cell.style.left = `${el.scrollLeft}px`
        })

        const cells2 = el.querySelectorAll('td[fixed*=r],th[fixed*=r]')
        Array.prototype.forEach.call(cells2,(cell)=>{
            cell.style.right = `${el.scrollWidth - el.clientWidth - el.scrollLeft}px`
        })
    }
}
const onWheel = function(el,x,y){
    if(y !== 0){        
        if(y > 0){
            el.scrollTop += increment
        }else{
            el.scrollTop -= increment
        }
    }
    if(x !== 0){
        if(x > 0)
        {
            el.scrollLeft += increment
        }else{
            el.scrollLeft -= increment
        }
    }    
}
const setBarSite = function(el,v,h,vhHand){
    if(v){
        if(el.scrollHeight > el.clientHeight){
            const h = (el.clientHeight - vhSize*4) * (el.clientHeight / el.scrollHeight)
            v.style.height = `${h}px`
            v.style.marginTop = `${(el.clientHeight - vhSize*4) * (el.scrollTop / el.scrollHeight) + vhSize*2}px`
            v.style.marginLeft = `${el.clientWidth - vhSize}px`
            v.addClass('show')
        }else{
            v.style.height = '0px'
            v.removeClass('show')
        }
    }

    if(h){
        if(el.scrollWidth > el.clientWidth){
            h.style.width = `${(el.clientWidth - vhSize*4) * (el.clientWidth / el.scrollWidth)}px`        
            h.style.marginLeft = `${(el.clientWidth - vhSize*4) * (el.scrollLeft / el.scrollWidth) + vhSize*2}px`
            h.style.marginTop = `${el.clientHeight - vhSize}px`
            h.addClass('show')
        }else{
            h.style.width = '0px'
            h.removeClass('show')
        }
    }

    if(vhHand){
        if(el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth){
            vhHand.style.marginLeft = `${el.clientWidth - vhSize*2}px`
            vhHand.style.marginTop = `${el.clientHeight - vhSize*2}px`
            vhHand.addClass('show')
        }else{
            vhHand.removeClass('show')
        }
    }
}
const onDrag = function(target,moveHandler)
{
    target.moveForPress(moveHandler)
}
const onDragVH = function(vhHand,el,moveHandler)
{
    const tbody = el.querySelector('tbody')
    vhHand.addEventListener('click',()=>{
        vhHand._enabled = !vhHand._enabled
        if(vhHand._enabled){
            el.addClass('hand')
            tbody._unMoveForPress = tbody.moveForPress(moveHandler)
        }else{
            el.removeClass('hand')
            if(tbody._unMoveForPress) tbody._unMoveForPress()
        }
    })
}
const onResize = function(el,callback){
    if(el.getStyle('position') === 'static'){
        el.style.position = 'relative'
      }
      const iframe = document.createElement('iframe')
      iframe.style.position = 'absolute'
      iframe.style.top = '0px'
      iframe.style.left = '0px'
      iframe.style.width = '100%'
      iframe.style.height = '100%'
      iframe.style.border = 'none'
      iframe.style.pointerEvents = 'none'
      iframe.style.zIndex = '-1'    
    //   iframe.style.opacity = '0'
    //   iframe.style.background = '#eee'
      iframe.addEventListener('load',({target})=>{
          target.contentWindow.addEventListener('resize', e => {
              const size = {
                  width: e.target.document.documentElement.clientWidth,
                  hegiht: e.target.document.documentElement.clientHeight
              }
              callback(size)
           })
      })
      el.appendChild(iframe)
}
// console.log(onDrag,onDragVH,onResize,onWheel)
Vue.directive('table', {
    inserted: function (el) {
        const v = document.createElement('div').addClass('vertical')
        const h = document.createElement('div').addClass('Horizontal')
        const vhHand = document.createElement('div').addClass('vhHand')
        const hand = document.createElement('i').addClass('fa').addClass('fa-hand-paper-o')//.addClass('h80')
        hand.setAttribute('hint','相当于同时按住横向与竖向滚动条 滚动表格')
        vhHand.appendChild(hand)
        el.insertBefore(v,el.firstChild)
        el.insertBefore(h,el.firstChild)
        el.insertBefore(vhHand,el.firstChild)

        onDrag(v,({y})=>{
            el.scrollTop += y * (el.scrollHeight / el.clientHeight)
            setStillSite(el,'v')
            setBarSite(el,v,null,null)
        })
        onDrag(h,({x})=>{
            el.scrollLeft += x * (el.scrollWidth / el.clientWidth)
            setStillSite(el,'h')
            setBarSite(el,null,h,null)
        })
        onDragVH(vhHand,el,({x,y})=>{
            el.scrollTop -= y * (el.scrollHeight / el.clientHeight)
            el.scrollLeft -= x * (el.scrollWidth / el.clientWidth)
            setStillSite(el)
            setBarSite(el,v,h,null)
        })

        const wheelEvent = function({deltaX:x,deltaY:y}){
            console.log(1)
            const dir = (x!==0 && y!==0) ? null :(x!==0 ? 'h' : 'v')
            onWheel(el,x,y)
            setStillSite(el,dir)
            setBarSite(el, (y!==0?v:null), (x!==0?h:null), vhHand)
        }  
        el.addEventListener('wheel',wheelEvent) // 监听 滚动事件

        onResize(el,()=>{
            setStillSite(el)
            setBarSite(el,v,h,vhHand)
        })  // 监听el的clientWidth、clientHeight
        onResize(el.querySelector('table'),()=>{
            setStillSite(el)
            setBarSite(el,v,h,vhHand)
        })  // 监听el的scrollWidth、scrollHeight
    }
    // ,componentUpdated(){
    //     console.log(1)
    // }
})


/**
 if(!el2){
                setStillSite(el)
                const point = el.getBoundingClientRect()
                const scrollbarWidth = el.offsetHeight - el.clientHeight
                el2 = el.cloneNode(true)

                // const table = el.querySelector('table').cloneNode()
                // const colgroup = el.querySelector('table colgroup').cloneNode(true)
                // const thead = el.querySelector('table thead').cloneNode(true)
                // const tfoot = el.querySelector('table tfoot').cloneNode(true)
                // const tbody = document.createElement('tbody')
                // {
                //     tbody.innerHTML = '<tr><td colspan="1000000"></td></tr>'
                //     tbody.style.opacity = '0'
                // }

                // table.appendChild(colgroup)
                // table.appendChild(thead)
                // table.appendChild(tbody)
                // table.appendChild(tfoot)
                // el2.appendChild(table)
                
                el2.addClass('mirror')
                el2.style.position = 'fixed'
                el2.style.zIndex = '10'
                el2.style.top = `${point.top}px`
                el2.style.left = `${point.left}px`
                el2.style.width = `${point.right - point.left - scrollbarWidth}px`
                el2.style.height = `${point.bottom - point.top - scrollbarWidth}px`
                el2.style.pointerEvents = 'none'
                el2.style.border = '1px solid #000'
                // el2.style.opacity = '.5'                
                // Array.prototype.forEach.call(el2.querySelectorAll('tbody td:not([fixed])'),(cell)=>{
                //     cell.style.opacity = '0'
                // })

                el.parentNode.insertBefore(el2,el)
            }
 */