<template>
    <div class="manage">
        <div class="tools">
            <button class="r-fresh switchTreeState" @click.stop="switchTreeState" raw>
                <i :class="`fa fa-${treeState?'folder-open':'folder'}`"/>
                <template v-if="treeState">折叠目录</template>
                <template v-else>展开目录</template>
            </button>
            <button class="r-fresh" @click.stop="startAdd(null)" raw>
                <i class="fa fa-plus"/>添加根目录
            </button>
            <r-declare class="explain" :left="-110" :content="['拖拉重归类/排序','修改名称','添加新目录','删除目录']"/>
        </div>
        <div class="treeTable" :class="{loading}">
            <div class="treeHeader">
                <div><label>名称</label></div>
                <div class="opt">操作</div>
            </div>
            <r-tree ref="tree1" :list="list" :rootOptions="{id:0}" @sorted="updateSeq">
                <template v-slot:default="{item}">
                    <div class="treeTr">
                        <div hint2t hint2="双击修改名称；按住上下拖拉排序。">
                            <span  v-if="!editStates[item.id]" @dblclick.stop="startUpdate(item)">{{item.name}}</span>
                            <input v-else class="r-fresh" v-model.trim.lazy="item.name" @blur="updateModel(item)" :error="!item.name" placeholder="名称不能为空" raw>
                        </div>
                        <div class="opt">
                            <i class="create fa fa-plus" @click.stop="startAdd(item)" hint2l hint2="添加子类"/>
                            <i class="edit fa fa-pencil-square-o" @click.stop="startUpdate(item)" hint2l hint2="编辑"/>
                            <i class="del fa fa-trash-o" @click.stop="del(item)" hint2l hint2="删除"/>
                        </div>
                    </div>
                </template>  
            </r-tree>
        </div>
    </div>
</template>

<script>
import { deepCopy, Category, TreeItem } from '@/models'

export default {
    inject:['getters','categoryApi'],
    data(){
        return {
            list: [],
            loading:true,
            editStates:{},
            treeState:true
        }
    },
    watch:{
        'getters.hash':{
            handler(){
                this.list = [] // 重新加载，因为 前台类型 变了。
                this.loading = true
            },
            immediate:true
        },
        'getters.categorys':{
            handler(origins){
                // if(this.list.length > 0) return // 不重复加载
                if(this._selfOperate){
                    delete this._selfOperate
                    return
                } // 自己页面的操作，无需重新加载

                this.list = deepCopy(origins).sort(((a,b)=>a.pid === b.pid ? a.seq - b.seq : a.pid - b.pid))
                    .map((item)=>new TreeItem(item))
                    .buildTree(0)
                this.loading = this.list.length === 0
                if(this.loading){
                    setTimeout(() => {
                        this.loading = false
                    }, 5000)
                } // 限制一个时间吧
            },
            immediate:true
        }
    },
    methods:{
        setFocus(itemId){
            this.$nextTick(()=>{
                const input = this.$refs.tree1.$el.querySelector(`[item_itemid="${itemId}"] input`)
                if(input) input.select()
            })
        },
        startUpdate(item){
            if(Object.prototype.hasOwnProperty.call(this.editStates,item.id)){
                // this.editStates[item.id] = !this.editStates[item.id]
                this.$delete(this.editStates,item.id)
            }else{
                this.$set(this.editStates,item.id,true)
            }
            this.setFocus(item.id)
        },
        startAdd(item){
            let children = this.list
            let obj = {id:0,pid:0}
            if(item){
                children = item.children
                item.folded = false // 必须显示出来
                obj = {id:0,pid:item.id}
            }
            const model = new Category(obj)
            const newTreeItem = new TreeItem({...model})
            children.splice(0,0,newTreeItem)
            this.$set(this.editStates,newTreeItem.id,true)
            this.setFocus(newTreeItem.id)
        },
        async updateModel(item){
            if(!this.editStates[item.id]) return

            if(!item.id) return this.addModel(item) // 这是添加，下面是修改

            if(!item.name){
                this.$message.error('名称不能为空')
                this.setFocus(item.id)
                return
            }
            this._selfOperate = true
            await this.categoryApi.update(new Category({...item}))
            this.$delete(this.editStates,item.id)
        },
        async addModel(item){
            if(!this.editStates[item.id]) return

            const children = item.pid === 0 ? this.list : this.list.findFromTree(item.pid).children
            if(!item.name){
                children.splice(children.indexOf(item),1)
            }else{
                this._selfOperate = true
                const oldId = item.id
                const model = await this.categoryApi.add(new Category({...item,id:null}))                
                const newItem = new TreeItem({...item,id:model.id})
                children.splice(children.indexOf(item),1,newItem)
                this.$delete(this.editStates,oldId)
            }
        },
        async updateSeq({item1,index}){
            this._selfOperate = true
            // item1.seq = index // 冻结了，不能改也不需要改
            await this.categoryApi.sort(new Category({...item1,seq:index}))
        },
        async del(item){
            const children = item.pid === 0 ? this.list : this.list.findFromTree(item.pid).children
            if(item.id === null){
                children.splice(children.indexOf(item),1)
                return
            }

            let ask = `删除该目录(<b>${item.name}</b>)将把该目录上的报表一起删除，<br/>且不可恢复，确定删除吗？`
            if(item.children.length > 0){
                ask = `删除该目录将把该目录(<b>${item.name}</b>)的子目录及它们的报表一起删除，<br/>且不可恢复。确定删除吗？`
            }
            this.$message.confirm(ask).then(async()=>{
                this._selfOperate = true
                await this.categoryApi.delete(item.id)
                children.splice(children.indexOf(item),1)
            }).catch(()=>{})
        },
        switchTreeState(){
            this.treeState = !this.treeState
            this.list.eachTree(item=>{
                item.folded = !this.treeState
            })            
        }
    }
}
</script>

<style lang="scss" scoped>
.manage{
    min-width: 300px;
    > .tools{
        position: relative;
        > .explain{
            position: absolute;
            right: 0px;
            top: 0px;
        }
    }
    > .treeTable{
        .treeTr > div,
        > .treeHeader > div{
            &:nth-child(1){
                min-width: calc(100% - 80px);
                text-align: left;
                > label{
                    padding-left: 42px;
                }
            }
            &:nth-child(2){
                width: 80px;
            }
        }
        .treeTr > div{
            &:nth-child(1){
                > input{
                    height: 100%;
                    line-height: 100%;
                    padding: 0px;
                }
            }
        }
    }
}
</style>