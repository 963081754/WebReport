import {throttle} from '@/utility/utility'

Element.prototype.addClass = function(name){
    let classList = (this.className || '').split(' ')
    if(!classList.includes(name)){
        classList.push(name)
        this.className = classList.join(' ')
    }
    return this
}

Element.prototype.removeClass = function(name){
    let classList = (this.className || '').split(' ')
    if(classList.includes(name)){
        classList = classList.filter(t=>t.toLowerCase() !== name.toLowerCase())
        this.className = classList.join(' ')
    }
    return this
}

Element.prototype.hasClass = function(name){
    let classList = (this.className || '').split(' ')
    return classList.includes(name)
}

/**
 * 查找父节点(包括它自己)
 * @param {*} selector 
 */
Element.prototype.findParentBySelector = function(selector){
    let parent = this
    
    while(parent.parentNode){
        const nodeList = parent.parentNode.querySelectorAll(selector)
        for(let i=0;i<nodeList.length;i++){
            if(nodeList[i] === parent)
            {
                return parent
            }
        }
        parent = parent.parentNode
    }
    return null
}

Element.prototype.isParent = function(targetEl){
    let parent = this
    
    while(parent){
        if(parent === targetEl) return true
        parent = parent.parentNode
    }
    return false
} // 命名有问题

Element.prototype.isParentOrSelf = function(child){
    let parent = child
    
    while(parent){
        if(parent === this) return true
        parent = parent.parentNode
    }
    return false
}

Element.prototype.getChildOrSelf = function(el){
    if(el === this) return this
    let prev = el
    while(prev){
        if(prev === this) return null
        for (let i = 0; i < this.childNodes.length; i++) {
            if(prev === this.childNodes[i]) return prev
        }
        prev = prev.parentNode
    }
    return null
}

Element.prototype.getStyle = function(attr,pseudoElt=null){    
    // if(this.currentStyle) {    //兼容IE
    //     return this.currentStyle[attr]
    // } else {    //兼容火狐谷歌
        return window.getComputedStyle(this,pseudoElt)[attr]
    // }
}

Element.prototype.setStyle = function(styles){    
    for (const key in styles) {
        this.style[key] = styles[key]
    }
}

Element.prototype.getChildIndex = function(child){    
    for(let i=0;i<this.childNodes.length;i++){
        if(this.childNodes[i] === child){
            return i
        }
    }
    return -1
}

/**
 * mousedown->mousemove->mouseup的一个事件 过程。
 * @param {*} moveHandler move事件回调:({x,y})=>{},x/y是与上次的差值
 * @param {*} before  down事件回调({x,y})=>{}
 * @param {*} after  up事件回调()=>{}
 * @param {*} hz move事件回调 频率
 */
Element.prototype.moveForPress  = function(moveHandler,before,after,wait,diff = true){
    let last = {x:0,y:0}
    const moving = diff ? function(e){
        e.stopPropagation()
        const {clientX:x,clientY:y} = e
        moveHandler({
            x: x - last.x, 
            y: y - last.y
        },e)
        last.x = x
        last.y = y
    } : function(e){
        e.stopPropagation()
        const {clientX:x,clientY:y} = e
        moveHandler({x,y},e)
    }
    const downEvent = function({clientY:y,clientX:x}){
        last = {x,y}
        if(typeof(before) === 'function') before({x,y})
        document.body.addClass('optimize2')
        const moveEvent = wait ? throttle(moving,wait) : moving
        const upEvent = function(){
            document.body.removeClass('optimize2')
            document.removeEventListener('mousemove',moveEvent,true)
            document.removeEventListener('mouseup',upEvent,true)
            if(typeof(after) === 'function') after()
        }
        document.addEventListener('mousemove',moveEvent,true)
        document.addEventListener('mouseup',upEvent,true)
    }
    this.addEventListener('mousedown',downEvent,true)

    const unMoveForPress = ()=>{
        this.removeEventListener('mousedown',downEvent,true)
    } // 解除函数
    return unMoveForPress
}