// import { throttle } from '@/utility/utility'
import Vue from 'vue'

// const vhSize = 12
// const barScope = 20

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
                  height: e.target.document.documentElement.clientHeight
              }
              callback(size)
           })
      })
      el.appendChild(iframe)
}

const setVBarSite = function(el){
    if(el._list.length <= el._pageSize) return

    const top = (el._cHeight - el._rowHeight*2) * (el._rowIndex / el._list.length) + el._rowHeight
    el._v.style.top = `${top}px`
}
const setVBarSize = function(el){
    if(el._list.length > el._pageSize){
        const height = (el._cHeight - el._rowHeight*2) * (el._pageSize / el._list.length)
        el._v.style.height = `${height}px`
        el._v.addClass('show')
    }else{
        el._v.removeClass('show')
    }
}
const vScrolling = function(rowIndex,el,force = false){
    if(el._list.length <= el._pageSize) return

    rowIndex = rowIndex < 0 ? 0 : rowIndex
    rowIndex = rowIndex > el._list.length - el._pageSize ? el._list.length - el._pageSize  : rowIndex
    if(!force && rowIndex === el._rowIndex) return

    el._rowIndex = rowIndex
    Array.prototype.forEach.call(el._trs,(tr,i)=>{
        if(i < el._rowIndex || i >= (el._rowIndex + el._pageSize)){
            tr.removeClass('show')
        }else{
            tr.addClass('show')
        }
    })
    // const oldRowIndex = el._rowIndex // 问题：排序时，原来的顺序就乱了。
    // for(let i = oldRowIndex; i < oldRowIndex + el._pageSize; i++){
    //     el._trs[i].removeClass('show')
    // }
    // for(let i = el._rowIndex; i < el._rowIndex + el._pageSize; i++){
    //     el._trs[i].addClass('show')
    // }    
    // console.log(1)
}
const hScrolling = function(el,sLeft,force = false){
    if(el._sWidth <= el._cWidth) return

    sLeft = sLeft < 0 ? 0 : sLeft
    sLeft = sLeft > el._sWidth - el._cWidth ? el._sWidth - el._cWidth : sLeft
    if(!force && el._sLeft === sLeft) return
    
    el._sLeft = sLeft
    el._columns.forEach((c,i)=>{
        const col = el._cols[i+1]
        if(c.fixed){
            col.style.cssText = ''
        }else 
        if(sLeft === 0){
            col.style.cssText = ''
        }else if(c.width >= sLeft){
            col.style.cssText = `width:${c.width - sLeft}px`
            sLeft = 0
        }else{
            col.style.cssText = 'width:0px'
            sLeft = sLeft - c.width
        }
    })
}
const setHBarSite = function(el){
    if(el._sWidth <= el._cWidth) return

    const left = el._sLeft * (el._cWidth / el._sWidth)
    el._h.style.left = `${left}px`
}
const setHBarSize = function(el){    
    if(el._sWidth > el._cWidth){
        const width = el._cWidth * (el._cWidth / el._sWidth)
        el._h.style.width = `${width}px`
        el._h.addClass('show')
    }else{
        el._h.removeClass('show')
    }
}

/**
 * wheel + (行 滚动：display:none) + (列 滚动：width:0px)
 */
Vue.directive('table3', {
    inserted: function (el,{value:{rowHeight}}) {
        const pagePace = 3    
        el._rowIndex = 0
        el._rowHeight = rowHeight
        el._columns = []
        el._list = []
        el._cols = []
        el._trs = []
        el._sWidth = 0
        el._cWidth = 0
        el._cHeight = 0
        el._sLeft = 0        
        const v = el._v = el.querySelector('.v')
        const h = el._h = el.querySelector('.h')

        onResize(el,()=>{            
            el._cWidth = el.clientWidth
            el._cHeight = el.clientHeight  
            const thead = el.querySelector('table > thead')
            const tfoot = el.querySelector('table > tfoot')
            el._pageSize = parseInt((el._cHeight - thead.clientHeight - tfoot.clientHeight) / el._rowHeight)
           
            console.log('onResize',el._sWidth,el._cWidth,el._cHeight,el._rowHeight,el._pageSize)
            setVBarSize(el)
            setHBarSize(el)

            vScrolling(el._rowIndex,el,true)  
            hScrolling(el,el._sLeft,true)
            setHBarSite(el)
            setVBarSite(el)
        })
        {
            let startY = null
            let startTop = null
            let rate = null
            v.moveForPress(({y})=>{
                const rowIndex = parseInt((y - startY + startTop) * rate)
                setVBarSite(el)
                vScrolling(rowIndex,el)                
            },({y})=>{
                startY = y
                startTop = (parseInt(v.style.top) || el._rowHeight) - el._rowHeight
                rate = el._list.length / (el._cHeight - el._rowHeight*2)
            },null,80,false)
        }
        {
            let startX = null
            let startLeft = null
            h.moveForPress(({x})=>{
                const sleft = (startLeft + x - startX) * (el._sWidth / el._cWidth)
                hScrolling(el,sleft)
                setHBarSite(el) // 要优化，位置不随滚动，滚动怠后，位置立刻：给用户的体验好。
            },({x})=>{
                startX = x
                startLeft = (parseInt(h.style.left) || 0)
            },null,80,false)
        }
        {
            el.addEventListener('wheel',({ deltaX: x, deltaY: y })=>{
                if(y !== 0){
                    const rowIndex = y > 0 ? el._rowIndex + pagePace : el._rowIndex - pagePace
                    vScrolling(rowIndex,el)
                    setVBarSite(el)
                }
                if(x !== 0){
                    const sLeft = x > 0 ? el._sLeft + 20 : el._sLeft - 20
                    hScrolling(el,sLeft)
                    setHBarSite(el)
                }
            }) // 监听 滚动事件
        }
    },
    componentUpdated(el,{value:{list,columns}}){
        {
            if(el._columns !== columns){ // width\fixed改变是，数组columns没变的。
                el._columns = columns            
                el._cols = el.querySelectorAll('table > colgroup > col')
                el._cWidth = el.clientWidth
            }            
            // 用JSON来比较：顺序+ename+width+fixed
            let _sWidth = 50 + columns.map(c=>c.width).reduce((result,value)=>{
                result += value
                return result
            },0) // 50=索引列的宽
            el._sWidth = _sWidth
            hScrolling(el,el._sLeft,true) // 列改变时
            setHBarSite(el)
            setHBarSize(el)
        } // 列 信息 + 列改变时
        if(el._list !== list){
            el._list = list
            el._trs = el.querySelectorAll('table > tbody > tr')            
            el._cHeight = el.clientHeight
            if(el._trs.length > 0)
            {
                const thead = el.querySelector('table > thead')
                const tfoot = el.querySelector('table > tfoot')
                el._pageSize = parseInt((el._cHeight - thead.clientHeight - tfoot.clientHeight) / el._rowHeight)
            }
            vScrolling(el._rowIndex,el,true)  // 行改变时
            setVBarSite(el)
            setVBarSize(el)
        } // 行 信息 + 行改变时
    }
})
