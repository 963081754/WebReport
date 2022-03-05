<template>
    <div class="sqlCreator">
        <div class="chainCreator">
            <slot></slot>
            <div class="row">
                <label>SQL语句：</label>
                <div>
                    <textarea class="values" raw rows="10" v-model.trim.lazy="model.values" :placeholder="placeholders"></textarea>
                </div>
            </div>
            <div class="row">
                <label>数据库：</label>
                <div>
                    <r-combobox class="dbSelect" v-model.number="model.db_id" :items="getters.databases" :vField="'id'" :tField="'cname'" :nullable="false" :autoWidth="true" />
                </div>
            </div>
            <div class="row masterKeys">
                <label>关键字段：</label>
                <div>
                    <span>编号:
                        <select v-model="model.masterKeys.id" beaut>
                            <option v-for="field in fields" :value="field.name" :key="field.name">{{field.name}}</option>
                        </select>
                    </span>

                    <span>名称:
                        <select v-model="model.masterKeys.name" beaut>
                            <option v-for="field in fields" :value="field.name" :key="field.name">{{field.name}}</option>
                        </select>
                    </span>
                    
                    <span>父编号:
                        <select v-model="masterKeys_pid" beaut>
                            <option value="">无</option>
                            <option v-for="field in fields" :value="field.name" :key="field.name">{{field.name}}</option>
                        </select>
                    </span>
                </div>
            </div>            
            <div class="row filter" v-if="masterKeys_pid">
                <label>
                    <input v-model="filterable" type="checkbox"> 筛选：
                </label>
                <div :class="{disabled:!filterable}">
                    编号=
                    <select v-model="model.masterKeys.fid" :disabled="!filterable" beaut>
                        <option v-for="key in Object.keys(getters.userMetadata)" :value="key" :key="key">@user_{{key}}</option>
                    </select>
                    <!-- <r-combobox class="dbSelect" :items="Object.keys(getters.userMetadata).map(key=>({key}))" :vField="'key'" :tField="'key'" :nullable="false" :autoWidth="true" /> -->
                    的子孙后代数据
                </div>
            </div>
            <div class="row" v-if="masterKeys_pid">
                <label>层级数：</label>
                <div class="radiogroup">
                    <!-- <label>
                        <input type="radio" v-model="model.masterKeys.layer" :value="1" name="layer" raw>1层
                    </label> -->
                    <label>
                        <input type="radio" v-model="model.masterKeys.layer" :value="2" name="layer" raw>2层
                    </label>
                    <label>
                        <input type="radio" v-model="model.masterKeys.layer" :value="3" name="layer" raw>3层
                    </label>
                    <label>
                        <input type="radio" v-model="model.masterKeys.layer" :value="4" name="layer" raw>4层
                    </label>
                </div>
            </div>   
            <div class="row">
                <label></label>
                <div>
                    <r-button @click="testSql" :disabled="!model.values || !model.db_id" raw class="small">
                        <i class="fa fa-play-circle"></i>预览、验证SQL
                    </r-button>
                    <r-button @click="save" :disabled="!model.values || !model.db_id" raw class="small">
                        <i class="fa fa-check"></i>保存
                    </r-button>
                </div>
            </div>        
        </div>
    <userParams class="userParams" v-if="model.userType"/>
    </div>
</template>

<script>
import userParams from '@/admin/components/userParams.vue'

export default {
    components:{ userParams },
    inject:['getters','chainApi'],
    props:{
        model:{
            type:Object,
            required:true
        }
    },
    data(){
        return {
            placeholders: Object.freeze(`返回列表的字段说明：至少两个字段，第一个字段是唯一值(主键)，第二个字段作为名称；后面的字段名称任意(如果有)。
                    示例：
                    select id,name,sex  from 员工表 where type=1`.trimRow()),
            pri_fields: null,
            filterable: this.model.masterKeys.fid !== null && this.model.masterKeys.fid !== undefined
        }
    },
    computed:{
        masterKeys_pid:{
            get(){
                return this.model.masterKeys.pid || ''
            },
            set(value){
                this.model.masterKeys.pid = value
            }
        },
        fields(){
            return this.pri_fields ? this.pri_fields : this.model.fields
        }
    },
    methods:{
        save({unlock}){
            try{
                 if(!this.model.name){
                    throw Error('请输入名称')
                }
                if(!this.model.values){
                    throw Error(`请输入sql语句`)
                }
                if(!this.model.db_id){
                    throw Error('请选择数据库')
                }
                if(!this.model.masterKeys.id || !this.model.masterKeys.name){
                    throw Error(`请选择【编号】与【名称】对应的字段`)
                }
                if(this.model.masterKeys.pid && !this.model.masterKeys.layer){
                    throw Error(`请选择数据的层数`)
                }
                if([...new Set([this.model.masterKeys.id,this.model.masterKeys.name,this.model.masterKeys.pid])].length !== 3){
                    throw Error(`关键字段 不能相同`)
                }
            }catch(err){
                if(err){
                    this.$message.error(err.message)
                }
                return !!unlock()
            }
            const exec = this.testSql({})
            exec.then(()=>{
                if(!this.filterable || this.model.masterKeys.pid === null){
                    this.model.masterKeys.fid = null
                }
                if(!this.model.masterKeys.pid){
                    this.model.masterKeys.layer = null
                }
                if(this.model.id){
                    return this.chainApi.update(this.model).then((model)=>{
                        this.$message.success('修改成功')
                        this.$emit('succeeded',model)
                    })
                }else{
                    return this.chainApi.add(this.model).then((model)=>{
                        this.$message.success('添加成功')
                        {
                            this.model.name = null
                            this.model.values = null
                            this.model.db_id = null
                        }
                        this.$emit('succeeded',model)
                    })
                }
            }).catch((err)=>{
                this.$message.error(err.message)
            }).finally(()=>{
                unlock()
            })
        },
        testSql({unlock}){
            return this.chainApi.testSql(this.model.values,this.model.db_id,this.getters.tstUser).then(fields=>{                
                this.$message.success(`sql语句验证成功。`)
                this.pri_fields = Object.freeze(fields)
                if(!this.fields.find(t=>t.name == this.model.masterKeys.id)){
                    this.model.masterKeys.id = this.fields[0].name
                }
                if(!this.fields.find(t=>t.name == this.model.masterKeys.name)){
                    this.model.masterKeys.name = this.fields[1].name
                }                
            }).catch((error)=>{
                if(!unlock){
                     throw error
                }else{
                    this.$message.error(`验证失败：${error.message}`)
                }
            }).finally(()=>{
                if(unlock) unlock()
            })
        }
    }
}
</script>

<style lang="scss" scoped src="@/admin/components/chainDesigner/css.scss"></style>

<style lang="scss" scoped>
.sqlCreator{
    display: flex;
    > div.userParams{
        border-left: 1px solid #cce;
    }
    button{
        margin-top: 5px;
        margin-right: 10px;
    }
    .dbSelect{
        min-width: 100px;
    }
    > .chainCreator{
        > .row{
            &.masterKeys{
                > div{
                    > span{
                        &:not(:nth-child(1)){
                            margin-left: 10px;
                        }
                        > select{
                            min-width: 50px;
                        }
                    }
                }
            }
            &.filter{
                > div.disabled{
                    text-decoration: line-through;
                    color: #999;
                }
            }
        }
    }
}
</style>