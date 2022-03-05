import Vue from 'vue'

const sym = Symbol()
const sym2 = Symbol()
const startItem = Symbol()
const started = Symbol()
const cbk = Symbol()
let share = null // 跨列表共享

const bindChild = function(parent,child,item,sorter,group){
    child.setAttribute('draggable',true)

    child.addEventListener('dragstart',()=>{
        parent[started] = true
        parent[startItem] = item
        if(group)
        {
            share = { group, index:parent[sym2].indexOf(item) }
        }
    })
    child.addEventListener('dragover',(event)=>{
        if(share.group === group && !parent[started]){
            event.preventDefault()
            return
        } // 来自同名组的 另一个列表
        if(!parent[started]) return
        event.preventDefault()
        
        if(parent[startItem] === item) return
        {
            const i1 = parent[sym2].indexOf(parent[startItem])
            const i2 = parent[sym2].indexOf(item)
            const child1 = parent.childNodes[i1]
            if(i1 > i2){
                parent.insertBefore(child1,parent.childNodes[i2])                        
            }else if(i1 < i2){      
                parent.insertBefore(child1,parent.childNodes[i2+1])                     
            }
            if(sorter){
                sorter(i1,i2)
            }else{
                parent[sym2].splice(i1,1)
                parent[sym2].splice(i2,0,parent[startItem])
            }
        }
    })
    child.addEventListener('drop',(event)=>{
        if(share.group === group && !parent[started]){
            parent[cbk](share.index)
            return
        } // 来自同名组的 另一个列表
        if(!parent[started]) return
        event.preventDefault()
        parent[cbk](parent[sym2].indexOf(parent[startItem]),parent[sym2].indexOf(item))
        parent[startItem] = null // 表示 drop执行过了
    })
    child.addEventListener('dragend',()=>{
        if(!parent[started]) return
        if(parent[startItem]){ // drop未执行
            parent[cbk](parent[sym2].indexOf(parent[startItem]),null)
        }
        parent[startItem] = null
        parent[started] = false      
        share = null          
    }) // 最后执行“清理”工作
}

Vue.directive('sort', {
    bind(el){
        el[sym] = []
        el[sym2] = null
        el[startItem] = null
        el[started] = false
        el[cbk] = ()=>{}
    },
    componentUpdated(el, binding){
        console.log('componentUpdated')
        const { list, callback=()=>{}, sorter, group } = binding.value
        const olds = el[sym].filter(old=>!list.find(n=>n === old))
        const news = list.filter(n=>!el[sym].find(old=>old === n))
        if(olds.length === 0 && news.length === 0) return // 没变

        console.log('@componentUpdated')
        el[cbk] = callback
        el[sym] = [...list] // 备份
        el[sym2] = list

        news.forEach(item=>{
            const child = el.childNodes[list.indexOf(item)]
            bindChild(el,child,item,sorter,group)
        })
        // olds.forEach(item=>{
        //     const child = el.childNodes[list.indexOf(item)]
        //     unbindChild(child,item,callback)
        // })
    },
    unbind(el){
        delete el[sym]
        delete el[sym2]
        delete el[started]
        delete el[startItem]

        // Array.prototype.forEach.call(el.childNodes,(child,i)=>{  
        //     unbindChild(list,el,child,item,callback)
        // }) 解绑 先不写
    }
})
  