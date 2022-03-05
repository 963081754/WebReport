import { throttle } from '@/utility/utility'
import Vue from 'vue'

// const vhSize = 12
// const barScope = 20
const v_minHeight = 25

const getTbodyHeight = function(el) {
    const tfoot = el.querySelector('table > tfoot')
    return parseInt(el.clientHeight - 30 - (tfoot ? 30 : 0))
    // return parseInt(el.clientHeight - el.querySelector('table > thead').clientHeight - (tfoot ? tfoot.clientHeight : 0))
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
                  height: e.target.document.documentElement.clientHeight
              }
              callback(size)
           })
      })
      el.appendChild(iframe)
}

const setVBarSite = function(el,top=null){
    // if(el._list.length <= el._pageSize) return
    // top = top || (el._cHeight * (el._rowIndex / el._list.length))
    top = top || (el._maxTop * (el._rowIndex / (el._list.length - el._pageSize)))
    if(top < 0) top = 0 // 最高的位置
    if(top > el._maxTop) top = el._maxTop
    el._v.style.top = `${top}px`
}
const setVBarSize = function(el){
    if(el._list.length > el._pageSize){
        let height = el._cHeight * (el._pageSize / el._list.length)
        if(height < v_minHeight) height = v_minHeight
        el._maxTop = el._cHeight - height // 最底的位置
        el._v.style.height = `${height}px`
        el._v.addClass('show')
    }else{
        el._v.removeClass('show')
    }
}

const vScrolling = function(rowIndex,el,force = false){
    if(el._list.length <= el._pageSize) { // 最后一页 有时条数很少  // return
        rowIndex = 0
    }else if(rowIndex < 0){
        rowIndex = 0
    }else if(rowIndex > el._list.length - el._pageSize){ // 滚动到最后一条
        rowIndex = el._list.length - el._pageSize
    }
    if(!force && rowIndex === el._rowIndex) return

    const pageSize = el._setting ? el._pageSize - 2 : el._pageSize // // 设计页 修改报表时,加了2行 配置行
    el._rowIndex = rowIndex
    Array.prototype.forEach.call(el._trs,(tr,i)=>{
        if(i < el._rowIndex || i >= (el._rowIndex + pageSize)){
            tr.removeClass('show')
        }else{
            tr.addClass('show')
        }
    }) // 小于1000行,更优
    // 滚动性能，跟列数 关系最大(不是行)，要优化！！！！

    {
        // {
        //     el._lastNs.forEach(n=>{
        //         const tr = document.getElementById(`${el._tableId}_${n}`)
        //         if(tr){
        //             tr.removeClass('show')
        //         }
        //     })
        //     el._lastNs = []
        // }

        // el._rowIndex = rowIndex
        // {
        //     const t = el._rowIndex + el._pageSize
        //     for(let i = el._rowIndex; i < el._list.length && i < t; i++){
        //         const n = el._list[i].n
        //         const tr = document.getElementById(`${el._tableId}_${n}`)
        //         if(tr){
        //             tr.addClass('show')
        //         }
        //         el._lastNs.push(n)
        //     }
        // } >1000,IE死掉；谷歌5000都轻松。
    }
}
const hScrolling = function(el,sLeft,force = false){
    if(el._sWidth <= el._cWidth){
        el._columns.forEach((c,i)=>{
            const col = el._cols[i+1]
            col.style.cssText = ''
        })
        return
    } // 列宽的和<滚动框的宽=全部显示
    // el.firstNode.style.display = 'none'
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
            col.style.cssText = 'width:0'
            sLeft = sLeft - c.width
        }
    })
    let sRight = el._sWidth - el._cWidth - el._sLeft
    if(sRight >= 0){
        for(let i = el._columns.length-1; i >= 0; i--){
            const c = el._columns[i]
            const col = el._cols[i+1]
            if(c.fixed) continue
            if(sRight === 0) return
            if(c.width <= sRight){
                col.style.cssText = `width:0`
                sRight = sRight - c.width
            }else{
                col.style.cssText = `width:${c.width - sRight}px`
                sRight = 0
            }
        }
    }
    // el.firstNode.style.display = ''
}
const setHBarSite = function(el,sLeft = null){
    if(el._sWidth <= el._cWidth) return

    const left = sLeft || (el._sLeft * (el._cWidth / el._sWidth))
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
Vue.directive('table2', {
    inserted: function (el,{value:{tableId,rowHeight,setting}}) {
        // console.log('inserted')
        const pagePace = 3    // 3行，滚动 大小
        el._setting = setting
        el._tableId = tableId
        el._lastNs = []
        el._rowIndex = 0
        el._rowHeight = rowHeight
        el._columns = []
        el._list = []
        el._cols = []
        el._trs = []
        el._sWidth = 0
        el._cWidth = 0
        el._cHeight = 0 // el._cHeight = tbody.clientHeight
        el._maxTop = 0
        el._sLeft = 0
        const v = el._v = el.querySelector('.v')
        const h = el._h = el.querySelector('.h')

        onResize(el,()=>{            
            el._cWidth = el.clientWidth            
            el._cHeight = getTbodyHeight(el)
            el._pageSize = parseInt(el._cHeight / el._rowHeight)
           
            // console.log('onResize',el._pageSize)
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
            const handler = throttle((rowIndex,el)=>{vScrolling(rowIndex,el)},80) // 滚动条 与 滚动 不同步，体验超好
            v.moveForPress(({y})=>{
                const top = (y - startY + startTop)
                const rowIndex = parseInt(top * rate)
                setVBarSite(el,top)  // 1.体验超好
                handler(rowIndex,el)  // 2.体验超好
                // vScrolling(rowIndex,el)
            },({y})=>{
                document.body.addClass('optimize2')
                el.addClass('optimize2')
                v.addClass('run')
                startY = y
                startTop = parseInt(v.style.top) || 0
                const h = v.clientHeight
                // rate = el._list.length / el._cHeight
                rate = (el._list.length-el._pageSize) / (el._cHeight - h)
            },()=>{
                document.body.removeClass('optimize2')
                el.removeClass('optimize2')
                v.removeClass('run')
                setVBarSite(el) // vbar与滚动 同步
            },0,false)
        }
        {
            let startX = null
            let startLeft = null
            h.moveForPress(({x})=>{
                const sLeft = (startLeft + x - startX) * (el._sWidth / el._cWidth)                
                hScrolling(el,sLeft)                
                setHBarSite(el)
            },({x})=>{
                document.body.addClass('optimize2')
                el.addClass('optimize2')
                h.addClass('run')
                startX = x
                startLeft = (parseInt(h.style.left) || 0)
            },()=>{
                document.body.removeClass('optimize2')
                el.removeClass('optimize2')
                h.removeClass('run')
            },80,false)
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
    componentUpdated(el,{value:{list,columns,setting}}){        
        // console.log('componentUpdated')
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
            setHBarSize(el)
            hScrolling(el,el._sLeft,true) // 列改变时
            setHBarSite(el)            
        } // 列 信息 + 列改变时。这里要优化吧，执行太多!!!!!

        const oldSetting = el._setting
        el._setting = setting
        if(el._list !== list || el._setting !== oldSetting){
            el._list = list
            el._trs = el.querySelectorAll('table > tbody > tr')            
            el._cHeight = getTbodyHeight(el)
            if(el._trs.length > 0)
            {
                el._pageSize = parseInt(el._cHeight / el._rowHeight)
            }
            // console.log(el._cHeight,el._pageSize)
            setVBarSize(el)
            vScrolling(el._rowIndex,el,true)  // 行改变时
            setVBarSite(el)
        } // 行 信息 + 行改变时
        
        // if(el._setting !== setting){
        //     el._setting = setting
        //     vScrolling(el._rowIndex,el,true)
        // } // 设计页 修改报表时
    },
    unbind(el){
        delete el._setting
        delete el._tableId
        delete el._lastNs
        delete el._rowIndex
        delete el._rowHeight
        delete el._columns
        delete el._list
        delete el._cols
        delete el._trs
        delete el._sWidth
        delete el._cWidth
        delete el._cHeight
        delete el._maxTop
        delete el._sLeft       
        delete el._v
        delete el._h
    }
})
