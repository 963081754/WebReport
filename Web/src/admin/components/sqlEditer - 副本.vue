<template>
    <popup :visible.sync="visiblePopup" :title="title" :resize="true" :enableMax="true" :fix="true" :closeable="true" :autoHeight="true" icon="file-o">
        <div class="sqlEditer">
            <div v-if="!editing" class="sql" v-html="htmlSql" @dblclick.stop="switchEditState" :title="sql && '双击：编辑'"></div>
            <textarea v-else class="sql" v-model.trim="newSql" @dblclick.stop="switchEditState" :placeholder="sqlPlaceholder" :title="sql && '双击：取消编辑'" raw></textarea>
            <div class="toolbar">
                <r-select v-model.number="dbId" :nullable="false" placeholder="请选择数据库">
                    <r-option v-for="item in getters.databases" :value="item.id" :text="item.cname" :key="item.id"/>
                </r-select>
                <r-button class="small" @click="parse" :disabled="!newSql" raw>
                    <i class="fa fa-check"/>解析SQL
                </r-button>
                <button class="small" @click.stop="restore" :disabled="newSql===sql" v-if="!!sql" raw>
                    <i class="fa fa-undo"/>还原
                </button>
                <button class="small" @click.stop="close" v-if="!!sql" raw>
                    <i class="fa fa-close"/>取消
                </button>
            </div>
        </div>        
    </popup>
</template>

<script>
import { sqlToHtml } from '@/utility/utility'

export default {
    inject: ['getters','reportApi'],
    props:{
        visible:{
            type:Boolean,
            required:true
        },        
        sql:{
            type:String,
            required:true
        },
        db_id:{
            type:[String,Number],
            required:false
        },
        title:{
            type:String,
            required:true
        }
    },
    data(){
        return {
            newSql: this.sql,
            dbId: this.db_id,
            editing: this.sql.length === 0,
            sqlPlaceholder: Object.freeze(`请输入SQL语句，可以用*号代替 所有查询字段（select * from），会自动一一列出 查询字段，但不能重名，其它没限制；另外不要写分页，系统会自动分页。`)
        }
    },
    computed:{
        htmlSql(){
            return sqlToHtml(this.newSql)
        },
        visiblePopup:{
            get(){
                return this.visible
            },
            set(value){
                this.$emit('update:visible',value)
            }
        }
    },
    watch:{
        sql(){
            this.newSql = this.sql
            this.editing = this.sql.length === 0
        },
        db_id(){
            this.dbId = this.db_id
        }
    },
    methods:{
        switchEditState(){
            if(!this.sql) return
            this.editing = !this.editing
        },
        close(){
            this.visiblePopup = false
        },
        restore(){
            this.newSql = this.sql
        },
        async parse({unlock}){
            try{
                if(!this.newSql) return
                if(!this.dbId){
                    this.$message.error('请选择数据库')
                    return
                }

                const model = await this.reportApi.parseSql(this.dbId, this.newSql)
                this.$emit('parse',model)
            }catch(err){
                this.$message.error(err.message)
            }finally{
                unlock()
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.sqlEditer{
    // width: 600px;
    width: 100%;
    height: 100%;
    > div.sql,
    > textarea.sql{
        display: block;
        height: calc(100% - 33px);
        width: 100%;
        min-width: 600px;
        min-height: 200px;
        overflow: auto;
    }
    > textarea.sql{
        border:none;
        box-shadow: 0px 0px 3px 0px inset #666;
        resize: none;
    }
    > .toolbar{
        padding: 5px;
        text-align: right;
        background: #ffedea;
        > *{
            margin-left: 15px;
        }
        > .r-select{
            text-align: left;
            width: auto;
        }
    }
}
</style>