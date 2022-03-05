const fs = require('fs')
const utility = require('../utility')

const fileCaches = {} // 把数据文件都“缓存一份副本(冻结)”起来，读取时不用读硬盘，因为不大。{path:[数据，……]，……}

/**
 * AES加密的配置 
 * 1.密钥 
 * 2.偏移向量 
 * 3.算法模式CBC 
 * 4.补全值
 */
const aesKey1 = {
    key: `BGR9d@%`, //密钥 16位
    iv: '30921541759' //偏移向量 1012132405963708 16位
}

const aesKey2 = {
    key: `&koe20()*`, //密钥 16位
    iv: '82709' //偏移向量 1012132405963708 16位
}

const saveList = function(list,path){
    // const path = this.Path
    const content = JSON.stringify(list)
    return new Promise(function(resolve, reject) {
        const _content = utility.aes.encrypt(content,aesKey1.key+aesKey2.key,aesKey1.iv+aesKey2.iv)
        fs.writeFile(`${path}b`, _content,{ flag: 'w+' }, err => {
            if(err){
                reject(err)
            }else{
                fileCaches[`${path}b`] = utility.deepFreeze(utility.deepCopy(list))
                resolve(list)
            }
        })
        fs.writeFile(path,content,{ flag: 'w+' },error=>{
            if(error){
                throw error
            }
        }) // 明文（备份）
    })
} // saveList不能公开，后果不可测。
const getList = function(paths){
    // const path = this.Path
    const path = paths[0].path
    let list = fileCaches[path]
    if(list)
    {
        // console.log(`使用缓存：${path}`)
        return Promise.resolve(utility.deepCopy(list))
    }
    return new Promise(function(resolve, reject) {
        fs.readFile(path,'utf8',(err, data) => {
            // console.log(`使用文件：${path}`)
            if (err) {
                if (err.code === 'ENOENT') {
                    if(paths.length > 1){
                        return getList(paths.slice(1)).then(d=>resolve(d)).catch(e=>reject(e))
                    }
                    list = []
                }else{
                    return reject(err)
                }
            }
            if(data){
                data = paths[0].callback(data)
            }                
            list = data ? JSON.parse(data) : []
            fileCaches[path] = utility.deepFreeze(utility.deepCopy(list))
            resolve(list)
        })
    })
}

 // @更新：不应该用 新的替换旧的，应该给旧的属性赋值，这样保证不会出问题，因为新Model的属性可能是残缺的；后面再改吧！！！！！！！！！！！！
class Base{
    constructor(path,cacheable = false) {
        {
            // // const dateParts = (new Date().setDate(new Date().getDate()+14).toString()).split('').map(t=>t.charCodeAt().toString(2)).join(',')
            // const dateParts = '110001,110110,110011,110100,111001,110110,110010,111000,110100,110001,110100,110011,110101'
            // const nextTime = parseInt(dateParts.split(',').map(t=>parseInt(t,2)).map(t=>String.fromCharCode(t)).join(''))
            // const nowTime = new Date().getTime()
            // if(nowTime > nextTime){
            //     this.get = async ()=>({})
            //     this.getList = async ()=>[]
            //     this.add = async (a)=>a
            //     this.addBatch = async (a)=>a
            //     this.update = async (a)=>a
            //     this.updateBatch = async (a)=>a
            //     this.updateBatchBy = async (a)=>a
            //     this.delete = async ()=>{}
            //     this.deleteBatches = async ()=>{}
            //     this.sortBySeq = async ()=>{}
            //     this.sortByIndex = async ()=>{}
            //     return
            // }
        } // 试用版过期了，啥也不做，呵呵。
        this.Path = path
        this.Cacheable = cacheable
    }
    async get(id) {
        const list = await this.getList()
        const model = list.find(t=>t.id == id)
        return model
    }
    getList() {
        return getList([{
                            path:`${this.Path}b`,
                            callback:(data)=>utility.aes.decrypt(data,aesKey1.key+aesKey2.key,aesKey1.iv+aesKey2.iv)
                        },
                        {
                            path:this.Path,
                            callback:(data)=>data
                        }])
    }
    /**
     * 
     * @param {*} model 
     * @param {Boolean} dir 添加的方向（第一个/最后一个）
     * @returns 
     */
    async add(model){
        let list = await this.getList()
        if(!model.id){
            model.id = this._maxId(list) + 1
        }
        list.push(model)
        await saveList(list,this.Path)
        return model
    }
    async addBatch(models){
        let list = await this.getList()
        const maxId = this._maxId(list)
        models.forEach(model=>{
            if(!model.id){
                maxId = maxId + 1
                model.id = maxId
            }
            list.push(model)
        })        
        await saveList(list,this.Path)
        return models
    }       
    async update(model){
        const list = await this.getList()
        const index = list.findIndex(t=>t.id == model.id)
        if(index === -1){
            throw Error(`对象不存在（${model.name}）`)
        }
        list.splice(index,1,model) // 删除旧的+添加新的
        await saveList(list,this.Path)
        return model
    } // 更新：不应该用 新的替换旧的，应该给旧的属性赋值，这样保证不会出问题，因为新Model的属性可能是残缺的。
    async updateBatch(models){
        const list = await this.getList()
        models.forEach(model=>{
            const index = list.findIndex(t=>t.id == model.id)
            if(index !== -1){
                list.splice(index,1)     // delete             
            }
            list.push(model)           // add  
        })
        await saveList(list,this.Path)
        return models
    }
    async updateBatchBy(getItem,setProps){
        const list = await this.getList()
        const updatingModels = list.map(t=>({old:t,new:getItem(t)})).filter(t=>t.new)
        updatingModels.forEach(t=>setProps(t.old,t.new))
        await saveList(list,this.Path)
    }
    async delete(id){
        const list = await this.getList()
        const index = list.findIndex(t=>t.id == id)
        if(index === -1) return
        list.splice(index,1)
        await saveList(list,this.Path)
    }
    async deleteBatches(ids){
        const list = await this.getList()
        ids.forEach(id=>{
            const index = list.findIndex(t=>t.id == id)
            if(index !== -1){
                list.splice(index,1)
            }
        })
        await saveList(list,this.Path)
    }
    /**
     * 根据seq排序；调用者先排好，这里只是seq属性。
     * @param {array} seqs 如：[{id,seq},……]
     */
    async sortBySeq(seqs,setProps){
        const list = await this.getList()
        seqs.forEach(item=>{
            const model = list.find(t=>t.id == item.id)
            if(model){
                model.seq = item.seq
                setProps(model,item)
            }
        })
        await saveList(list,this.Path)
    }
    /**
     * 根据索引排序
     * @param {*} id 
     * @param {number} index 序号
     */
    async sortByIndex(id,index){
        const list = await this.getList()
        const item = list.splice(list.findIndex(t=>t.id === id),1)[0]
        list.splice(index,0,item)
        await saveList(list,this.Path)
    }

    _maxId(list){
        if(list.length) {
            return list.sort((a,b)=>a.id-b.id)[list.length-1].id
        }else{
            return 0
        }
    }
}

module.exports = Base