<template>
    <div class="manage">
        <div class="tools">
            <button class="r-fresh add" @click.stop="create" raw>
                <i class="fa fa-plus"/>添加数据库
            </button>
            <!-- <button class="r-fresh add" @click.stop="openFieldManage" raw>
                <i class="fa fa-etsy"/>字段名翻译
            </button> -->
            <span class="remark"><i class="fa fa-exclamation-circle"/>强烈建议只给数据库链接账号【只读权限】</span>
            <!-- fa-modx fa-exchange -->
        </div>
        <div class="mtable" :class="{loading}">         
            <table style="width:900px">
                <colgroup>
                    <col width="40">
                    <col width="150">
                    <col width="100%">
                    <col width="100%">
                    <col width="100">
                    <col width="50">
                    <col width="80">
                    <col width="80">
                    <col width="100">
                    <col width="50">
                    <col width="90">
                </colgroup>
                <thead>
                    <tr>
                        <th>排序</th>
                        <th>中文名称</th>
                        <th>数据库名</th>
                        <th>服务器地址(IP/名称)</th> 
                        <th>实例名</th>               
                        <th>端口号</th>
                        <th>账号</th>
                        <th>密码</th>
                        <th>测试链接/结果</th>
                        <th>启用</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody v-sort="{list,hand:'td:nth-child(1)',callback:sorted}">
                    <template v-for="(row) in list">
                        <template v-if="editRow && editRow.id===row.id">
                            <tr class="edit" :key="row.id">
                                <td hint2="按住上下拖拉排序"><i class="fa fa-exchange fa-rotate-90" /></td>
                                <td>
                                    <input class="r-fresh" v-model.trim.lazy="editRow.cname" :error="!editRow.cname" raw>
                                </td>
                                <td>
                                    <input class="r-fresh" v-model.trim.lazy="editRow.name" :error="!editRow.name" raw>
                                </td>
                                <td>
                                    <input class="r-fresh" v-model.trim.lazy="editRow.host" :error="!editRow.host" raw>
                                </td>
                                <td>
                                    <input class="r-fresh" v-model.trim.lazy="editRow.instance" raw>
                                </td>
                                <td>
                                    <input class="r-fresh" v-model.trim.lazy="editRow.port" raw>
                                </td>
                                <td>
                                    <input class="r-fresh" v-model.trim.lazy="editRow.account" :error="!editRow.account" raw>
                                </td>
                                <td>
                                    <input class="r-fresh" v-model.trim.lazy="editRow.password" :error="!editRow.password" raw>
                                </td>
                                <td>
                                    <button class="r-fresh" @click.stop="test(row)" :hint="row.result === 1?'链接成功':row.result" raw>
                                        试一试
                                        <i v-if="row.result === 1" class="fa fa-check-circle"/>
                                        <i v-else-if="!!row.result" class="fa fa-times-circle"/>
                                        <i v-else class="fa fa-minus-circle"/>
                                    </button>
                                </td>
                                <td>
                                    <r-toggle v-model="editRow.enabled"/>
                                </td>
                                <td>
                                    
                                    <i class="hidden fa fa-check-circle" ></i>
                                    <i class="complete fa fa-check-circle" @click.stop="complete" ></i>
                                    <i class="cancel fa fa-times-circle" @click.stop="cancel" ></i>
                                </td>
                            </tr>
                        </template>
                        <template v-else>
                            <tr :key="row.id">
                                <td hint2="按住上下拖拉排序"><i class="fa fa-exchange fa-rotate-90" /></td>
                                <td>{{row.cname}}</td>
                                <td :hint="row.name">{{row.name}}</td>
                                <td>{{row.host}}</td>
                                <td>{{row.instance}}</td>
                                <td>{{row.port}}</td>
                                <td>{{row.account}}</td>   
                                <td>{{row.password}}</td> 
                                <td>
                                    <button class="r-fresh" @click.stop="test(row)" :hint="row.result === 1?'链接成功':row.result" raw>
                                        试一试
                                        <i v-if="row.result === 1" class="fa fa-check-circle"/>
                                        <i v-else-if="!!row.result" class="fa fa-times-circle"/>
                                        <i v-else class="fa fa-minus-circle"/>
                                    </button>
                                </td>
                                <td>
                                    <r-toggle v-model="row.enabled" @change="changeEnable(row)"/>
                                </td>
                                <td>
                                    <i class="ch-en fa fa-etsy" @click.stop="openFieldManage" hint="字段名翻译，翻译的中文名自动作为列名"/>
                                    <i class="edit fa fa-pencil-square-o" @click.stop="edit(row)"/>
                                    <i class="del fa fa-trash-o" @click.stop="del(row)"/>
                                </td>
                            </tr>
                        </template>
                    </template>
                </tbody>
            </table>
        </div>
        <fieldManage v-if="fieldAttr.visible" :visible.sync="fieldAttr.visible" />
    </div>
</template>

<script>
import {Db} from '@/models'
const fieldManage  = () => import('@/admin/components/fieldManage.vue')

export default {
    components:{ fieldManage },
    inject:[ 'getters','databaseApi'],
    data(){
        return {
            list:[],
            loading: true,
            editRow:null,
            fieldAttr:{
                visible:false
            }
        }
    },
    watch:{
        'getters.databases':{
            handler:function(list){
                this.list = list ? JSON.parse(JSON.stringify(list)) : []
                this.loading = false
            },
            immediate:true
        }
    },
    methods:{
        create(){
            if(this.list.length && this.list[0].id === null) return // 已有一条新建的

            const row = {...Db}
            this.list.splice(0,0,row)
            this.edit(row)
        },
        edit(row){
            this.cancel()
            this.editRow = row
        },
        async complete(){
            if(this._submiting) return // 禁止重复提交
            this._submiting = true
            try{
                if(!this.editRow.cname){
                    this.$message.error('中文名称不能为空')
                    return
                }
                if(!this.editRow.name){
                    this.$message.error('数据库名不能为空')
                    return
                }
                if(!this.editRow.host){
                    this.$message.error('服务器地址不能为空')
                    return
                }
                if(!this.editRow.account){
                    this.$message.error('账号不能为空')
                    return
                }
                if(!this.editRow.password){
                    this.$message.error('密码不能为空')
                    return
                }
                const model = {...this.editRow}
                delete model.result
                if(model.id){
                    await this.databaseApi.update(model)
                }else{
                    await this.databaseApi.add(model)
                }            
                this.editRow = null
            }finally{
                delete this._submiting
            }
        },
        cancel(){
            if(!this.editRow) return
            if(this.editRow.id === null){
                this.list.splice(0,1)
            }
            this.editRow = null           
        },
        async del(row){
            this.$message.confirm(`删除该数据库后，<br/>所有在这个数据库(<b>${row.cname}</b>)上建立的报表将无法打开，<br/>确定删除吗？`)
            .then(()=>{
                if(row.id == '1'){
                    this.$message.info('测试用的数据库，不能删；你可以添加新的数据库。')
                    return
                }
                this.databaseApi.delete(row.id)
            }).catch(()=>{})
        },
        async changeEnable(model){
            await this.databaseApi.update(model)
        },
        async test(row){
            if(this._testing) return // 禁止重复提交
            this._testing = true
            try{
                const params = {...row}
                delete params.id
                delete params.cname
                delete params.enabled
                delete params.result
                await this.databaseApi.testConnect(row)
                this.$set(row,'result',1)
                this.$message.success('链接成功')
            }catch(err){
                this.$set(row,'result',err.message)
            }finally{
                delete this._testing
            }
        },
        openFieldManage(){
            this.fieldAttr.visible = true
        },
        sorted(i1,i2,item){
            this.databaseApi.sort(item.id,i2)
        }
    }
}
</script>

<style lang="scss" scoped>
.manage{
    > .tools{
        .remark{
            margin-left: 10px;
            vertical-align: middle;
            color: #f00;
            > i.fa{
                color: inherit;
                margin-right: 5px;
            }
        }
    }
    > .mtable{
        > table{
            tr{
                td:nth-child(10),
                td:nth-child(11),
                td:nth-child(9){
                    text-align: center;
                }
                td:nth-child(1){
                    overflow: visible;
                    text-align: center;
                    cursor: pointer;
                }
            }
        }
    }
}
</style>