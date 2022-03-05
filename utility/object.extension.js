// Array.prototype.deepClone = function(){
//     debugger
//     // return this
//     return JSON.parse(JSON.stringify(this))
// }

String.prototype.byteLength = function(){
    let length = 0
    let ary = this.split('')
    for(let i=0 ; i<ary.length ; i++){
        if(ary[i].charCodeAt(0)<299){
            length++
        }else{
            length += 2
        }
    }
    return length
}

/**
 * 拉平“树”
 */
 Array.prototype.flatTree = function(){
    let list = []
    this.forEach(item=>{
        list.push(item)
        if(item.children && item.children.length > 0){
            list = list.concat(item.children.flatTree())
        }
    })
    return list
}
/**
 * 创建“树”
 * @param {*} id 
 * @returns 
 */
Array.prototype.buildTree = function(id){
    const children = this.filter(t=>t.pid == id) // 不能用===
    children.forEach(item=>{
        item.children = this.buildTree(item.id)
        // if(item.children){
        //     while(item.children.length > 0) item.children.pop()
        //     this.buildTree(item.id).forEach(t=>item.children.push(t))
        // }else{
        //     item.children = this.buildTree(item.id)
        // }
    })
    return children
}
Array.prototype.findFromTree = function(id){
    let item = this.find(t=>t.id == id) // 不能用===
    if(item) return item
    for(let i = 0; i < this.length; i++){
        item = this[i].children.findFromTree(id)
        if(item) return item
    }
    return null
}
Array.prototype.union = function(comparer,returer){
    return this.map(item=>{
        const item2 = comparer(item)
        return returer(item,item2)
    })
}

Array.prototype.unique = function(){
    return this.filter(function (item, index, self) {
        return self.indexOf(item) == index 
    })
}

Date.prototype.isValid = function(){
    return !isNaN(this.getTime())
}