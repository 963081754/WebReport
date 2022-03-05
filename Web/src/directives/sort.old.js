import Vue from 'vue'

let share = {} // 根据group,跨列表 共享
const sym = Symbol()
const bindedDownSym = Symbol()
const downEventSym = Symbol()
const class1 = 'childs-none-events' // .childs-none-events > * > *{ pointer-events: none;  } // 辅助 v-sort

const sharedHandlers = function(el){
    return {
        dragenter(event){ // 好复杂！！！，要不要这样？？？
            event.preventDefault()

            if(event.target === el){
                return
            }
                            
            const targetIndex = el.getChildIndex(event.target) - el[sym].offset
            const item = el[sym].list[targetIndex]
            if(share.item === item) return
            {
                const i1 = el[sym].list.indexOf(share.item)
                const i2 = el[sym].list.indexOf(item)
                if(i1 === -1){  // 当前list不存在的
                    if(el[sym].sorter){
                        el[sym].sorter(-1,i2,share.item)
                    }else{
                        el[sym].list.splice(i2,0,share.item)
                    }                
                }else{ // 当前list存在的，调换位置
                    if(el[sym].sorter){
                        el[sym].sorter(i1,i2,share.item)
                    }else{
                        el[sym].list.splice(i1,1)
                        el[sym].list.splice(i2,0,share.item)
                    }
                }
            } // 调换
        },
        drop(event){
            event.preventDefault()
            const i2 = el.getChildIndex(event.target) - el[sym].offset
            if(el[sym].callback){
                el[sym].callback(-1,i2,share.item)
            }
        }
    }
}

const unsharedHandlers = function(el){
    return {
        dragstart(event){
            el[sym].started = true
            el[sym].child = event.target // 需要 借助 class='childs-none-events'
            el.addClass(class1)           
            const i1 = el.getChildIndex(event.target) - el[sym].offset
            share = { 
                name: el[sym].name, 
                i1,
                item: el[sym].list[i1]
            }  // 跨列表 设置
        },
        dragover(event){
            if(!el[sym].started) return            
            event.preventDefault()
        },
        dragenter(event){
            if(!el[sym].started) return            
            event.preventDefault()

            if(event.target === el){  // event.target也可能===el
                const i2 = el[sym].list.indexOf(share.item)
                if(i2 === share.i1) return
                el[sym].list.splice(i2,1)
                el[sym].list.splice(share.i1,0,share.item) // 调回 原来的位置
                return
            }
                            
            const targetIndex = el.getChildIndex(event.target)
            const item = el[sym].list[targetIndex - el[sym].offset]
            if(share.item === item) return
            {
                const i1 = el[sym].list.indexOf(share.item)
                const i2 = el[sym].list.indexOf(item)
                if(el[sym].sorter){
                    el[sym].sorter(i1,i2,share.item)
                }else{
                    el[sym].list.splice(i1,1)[0]
                    el[sym].list.splice(i2,0,share.item)
                }
            } // 调换
        },
        drop(event){
            if(!el[sym].started) return            
            event.preventDefault()
    
            const i2 = el.getChildIndex(event.target) - el[sym].offset // 因为offset可能越界，需要的。
            // const i2 = el[sym].list.indexOf(share.item)
            if(el[sym].callback){
                el[sym].callback(share.i1,i2,share.item)
            }
            share = {} // 表示 drop执行过了
        },
        dragend(){                     
            if(!el[sym].started) return
            if(share.item){ // drop未执行
                if(el[sym].callback){
                    el[sym].callback(share.i1,null,share.item) // 拉出了 框框(el)之外
                }   
                share = {}             
            }           
            el.removeClass(class1) 
            if(el[sym] && el[sym].child && el[sym].child.removeAttribute){
                el[sym].child.removeAttribute('draggable')
            } 
            delete el[sym].hand
            el[sym].started = false             
        }
    }
} 

const isShared = function(el){
    return !!(el[sym].accepts && el[sym].accepts.includes(share.name))
}

const handlers = function(el){
    const shared = sharedHandlers(el)
    const unshared = unsharedHandlers(el)
    return {
        ...unshared,
        dragover(event){
            if(el[sym].started || isShared(el)){
                event.preventDefault()
            }
        },
        dragenter(event){
            if(el[sym].started){
                unshared.dragenter(event)
            }else if(isShared(el)){
                shared.dragenter(event)
            }
        },
        dragleave(){},
        drop(event){
            if(el[sym].started){
                unshared.drop(event)
            }else if(isShared(el)){
                shared.drop(event)
            }
        }
    }
}
const bindChild = function(el){
    if(!el[sym].handlers){
        el[sym].handlers = handlers(el)
        el.addEventListener('dragstart',el[sym].handlers.dragstart)
        el.addEventListener('dragover',el[sym].handlers.dragover)
        el.addEventListener('dragenter',el[sym].handlers.dragenter)
        el.addEventListener('drop',el[sym].handlers.drop)
        el.addEventListener('dragend',el[sym].handlers.dragend)
    }
    for(let i = 0 + el[sym].offset;i < el[sym].list.length; i++){
        const child = el.childNodes[i]
        if(child[bindedDownSym]) continue
        child[bindedDownSym] = true
        // const target = el[sym].hand ? (child.querySelector(el[sym].hand) || child) : child
        const target = el[sym].hand ? child.querySelector(el[sym].hand) : child
        if(!target && target[downEventSym]) continue

        target[downEventSym] = {
            mousedown:()=>{
                // console.log(target === child)
                child.setAttribute('draggable',true)
            },
            mouseup:()=>{
                child.removeAttribute('draggable')
            }
        }            
        target.addEventListener('mousedown',target[downEventSym].mousedown)  
        target.addEventListener('mouseup',target[downEventSym].mouseup)        
    }
}
const unbind = function(el){
    // console.log('unbind1')
    Array.prototype.forEach.call(el.childNodes,child=>{
        if(!child[bindedDownSym]) return        
        // console.log('unbind2')
        // const target = el[sym].hand ? (child.querySelector(el[sym].hand) || child) : child
        const target = el[sym].hand ? child.querySelector(el[sym].hand) : child
        if(target && target[downEventSym]){
            target.removeEventListener('mousedown',target[downEventSym].mousedown)  
            target.removeEventListener('mouseup',target[downEventSym].mouseup)
            delete target[downEventSym]  
            // console.log('unbind3')
        }
        delete child[bindedDownSym]         
        // console.log('unbind4')
    })
    if(el[sym] && el[sym].handlers){
        el.removeEventListener('dragstart',el[sym].handlers.dragstart)
        el.removeEventListener('dragenter',el[sym].handlers.dragenter)
        el.removeEventListener('dragover',el[sym].handlers.dragover)
        el.removeEventListener('drop',el[sym].handlers.drop)
        el.removeEventListener('dragend',el[sym].handlers.dragend)
    }
    delete el[sym]
    // console.log('unbind5')
}

/**
 * 借助IE11以下不支持的CSS childs-none-events
 */
Vue.directive('oldSort', {
    bind(el,binding){
        const { disable,list, hand, offset, callback, sorter, name , accepts } = binding.value
        if(disable){
            return
        }
        el[sym] = {}
        el[sym].disable = !!disable
        el[sym].list = list // Array：必需，绑定的列表。
        el[sym].hand = hand // string：允许按住的 el
        el[sym].offset = offset || 0 // 偏移几个项 可以拖拉
        el[sym].sorter = sorter // function：排序函数
        el[sym].name = name // string：列表名称
        el[sym].accepts = accepts // Array：接受别的 列表名称
        el[sym].callback = callback  // function：拖拉结束后的回调函数
    
        bindChild(el)
    },
    componentUpdated(el,binding){
        const { disable, list, hand, offset, callback, sorter, name, accepts } = binding.value        
        el[sym] = el[sym] || {}
        el[sym].disable = !!disable
        el[sym].list = list
        el[sym].hand = hand
        el[sym].offset = offset || 0
        el[sym].sorter = sorter
        el[sym].name = name
        el[sym].accepts = accepts
        el[sym].callback = callback 
        if(disable){
            return unbind(el)
        }
        
        bindChild(el)
    },
    unbind(el){
        unbind(el)
    }
})