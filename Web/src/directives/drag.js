import Vue from 'vue'

const classs = {
    h:{
        forward:'dragLeft',
        aback:'dragRight'
    },
    v:{
        forward: 'dragTop',
        aback: 'dragbottom'
    },
    cloner:'cloneMove',
    noSelectText:'noSelectText' // 禁止选择文本
}
 // fixed与float不能一起用，会有问题
class dragHandler {
    constructor(parentEl,endHandler,dir,hand){
        this.parentEl = parentEl
        this.endHandler = endHandler
        this.dir = dir
        this.hand = hand

        this.startXY = {x:null,y:null,w:null,h:null}
        this.startIndex = null
        this.cloneTarget = null
        this.succeed = false
        const that = this

        document.addEventListener('mouseup',()=>{
            if(that.startIndex===null) return

            that.parentEl.removeClass(classs.noSelectText)
            if(that.cloneTarget)
                that.cloneTarget.parentNode.removeChild(that.cloneTarget)        
    
            let el = that.parentEl.querySelector(`.${classs[that.dir].forward}`)
            if(el) el.removeClass(classs[that.dir].forward)
            el = that.parentEl.querySelector(`.${classs[that.dir].aback}`)
            if(el) el.removeClass(classs[that.dir].aback)
    
            if(!that.succeed)
            {
                that.endHandler({startIndex:that.startIndex,endIndex:null})
            }
            that.startIndex = null
            that.succeed = false
        })
        document.addEventListener('mousemove',(e)=>{
            const {clientX:x,clientY:y} = e
            if(that.startIndex===null) return
            that.cloneTarget.style.marginTop = `${y - that.startXY.y}px`
            that.cloneTarget.style.marginLeft = `${x - that.startXY.x}px`
        })
    }
    
    start(index,e){
        const {clientX:x,clientY:y,target} = e
        const el = this.parentEl.childNodes.item(index)
        if(this.hand){
            const handEl = el.querySelector(this.hand)
            if(!target.isParent(handEl)) return
        }
        this.parentEl.addClass(classs.noSelectText)
        this.startXY = {x,y}
        this.startIndex = index                    
        {
            this.cloneTarget = el.cloneNode(true)     
            el.parentNode.insertBefore(this.cloneTarget,el)
            this.cloneTarget.addClass(classs.cloner)
            this.cloneTarget.style.top = 'auto'
            this.cloneTarget.style.left = 'auto'
            console.log(this.startXY)
            
            // // console.log(e)
        }
    }
    enter(index){
        if(this.startIndex===null) return
        const target = this.parentEl.childNodes.item(index)
        target.addClass(this.startIndex > index ? classs[this.dir].forward:classs[this.dir].aback)
    }
    leave(index){
        if(this.startIndex===null) return
        const target = this.parentEl.childNodes.item(index)  
        target.removeClass(classs[this.dir].forward).removeClass(classs[this.dir].aback)        
    }
    end(index){
        if(this.startIndex===null) return
        // debugger
        this.succeed = true
        this.cloneTarget.parentNode.removeChild(this.cloneTarget)
        this.cloneTarget = null   
        this.endHandler({startIndex:this.startIndex,endIndex:index})
    }
}
const handlerSym = Symbol()
const listenerSym = Symbol()

const bind = function(el,endHandler,dir,hand){
    el[handlerSym].endHandler = endHandler
    el[handlerSym].dir = dir
    el[handlerSym].hand = hand
    const handlers = el[listenerSym]

    for(let i=0;i<el.childNodes.length;i++){
        const handler = {
            down:(e)=>{el[handlerSym].start(i,e)},
            up:()=>{el[handlerSym].end(i)},
            enter:()=>{el[handlerSym].enter(i)},
            leave:()=>{el[handlerSym].leave(i)}
        }
        handlers.push({el:el.childNodes[i],handler})
        el.childNodes[i].addEventListener('mousedown',handler.down)
        el.childNodes[i].addEventListener('mouseup',handler.up)
        el.childNodes[i].addEventListener('mouseenter',handler.enter)
        el.childNodes[i].addEventListener('mouseleave',handler.leave)
    }  
}

Vue.directive('dragSort', {
    inserted: function (el, binding) {
        // binding.value={end:dragEnd,list:columns,dir:'h/v',hand:'selector'} end:function({startIndex,endIndex}) endIndex=null表示……
        if(typeof(binding.value.end)!=='function') return
        
        el[listenerSym] = []
        el[handlerSym] = new dragHandler(el,binding.value.end,binding.value.dir,binding.value.hand)

        bind(el,binding.value.end,binding.value.dir,binding.value.hand)
    },
    update (el) {
        // debugger
        let handlers = el[listenerSym]
        handlers.forEach(({el,handler})=>{
            el.removeEventListener('mousedown',handler.down)
            el.removeEventListener('mouseup',handler.up)
            el.removeEventListener('mouseenter',handler.enter)
            el.removeEventListener('mouseleave',handler.leave)
        })
        handlers = el[listenerSym] = []
        // console.log(binding)
    },
    componentUpdated(el, binding){        
        // debugger
        // console.log('v-dragSort:componentUpdated',binding)
        if(typeof(binding.value.end)!=='function') return
        bind(el,binding.value.end,binding.value.dir,binding.value.hand)
    }
})
