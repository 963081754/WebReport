<template>
    <div class="sqlEditer">
        <div class="box1">            
            <div class="writer">
                <div v-if="!editing" class="sql" v-html="htmlSql" @dblclick.stop="switchEditState" :title="sql && '双击：编辑'"></div>
                <textarea v-else ref="textarea1" class="sql" v-model.trim="newSql" @dblclick.stop="switchEditState" :title="sql && '双击：取消编辑'" raw></textarea>
                <ul class="placeholder" v-if="editing && !newSql" @click.stop="$refs.textarea1.focus()">
                    <li class="priority">只读操作，只允许编写<b>SELECT查询语句</b>（distinct、top、where、order by、group by、having、case when then、各种数据库系统提供的函数；注意：<b>不支持union、with</b>)</li>
                    <li class="priority">不允许使用 如select * from t ，请用具体的<b>字段列表代替“*”</b>，不要返回用不到的任何字段。</li>
                    <li class="priority">字段列<b>不允许重名</b>，重名字段请起别名。</li>
                    <li class="priority">尽量使用系统提供的<b>“别针”</b>代替JOIN操作，以提高查询性能、减少SQL复杂度。</li>
                    <li class="priority"><b>无需写分页</b>，系统会自动分页。</li>
                    <li>将查询所有用到的表数据 全部加载到 数据库缓存。</li>
                    <li>索引，是海量数据查询首要解决的问题。避免全表扫描，首先考虑在 where 及 order by 涉及的列上建立索引。</li>
                    <li>善用 聚集索引，参考：<a href="https://blog.csdn.net/weixin_34341229/article/details/93217222" target="_blank">https://blog.csdn.net/weixin_34341229/article/details/93217222</a></li>
                    <li>其它SQL查询优化，参考：<a href="https://www.cnblogs.com/linybo/p/10093753.html" target="_blank">https://www.cnblogs.com/linybo/p/10093753.html</a>  </li>
                </ul>
            </div>
            <userParams/>
        </div>
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
            <button class="small no" @click.stop="close" v-if="!!sql" raw>
                <i class="fa fa-minus"/>取消
            </button>
        </div>
    </div>
</template>

<script>
import { sqlToHtml } from '@/utility/utility'
import userParams from '@/admin/components/userParams.vue'

export default {
    components:{ userParams },
    inject: ['getters','reportApi'],
    props:{      
        sql:{
            type:String,
            required:true
        },
        db_id:{
            type:[String,Number],
            required:false
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
            this.$emit('close')
            // this.visiblePopup = false
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

                const model = await this.reportApi.parseSql(this.dbId, this.newSql,this.getters.tstUser)
                this.$emit('parse',Object.freeze(model))
                if(model.msg){
                    this.$message.info(model.msg)
                }
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
    width: 100%;
    height: 100%;
    min-height: 400px;
    min-width: 700px;
    display: flex;
    flex-direction: column;
    > .box1{
        display: flex;
        flex-grow: 1;
        > .writer{
            flex-grow: 1;
            position: relative;
            > div.sql,
            > textarea.sql{
                // display: block;
                width: 100%;            
                height: 100%;  
                padding: 5px; 
                overflow: auto;
            }
            > div.sql{
                box-shadow: 0 0 0 1px inset #edc;
            }
            > textarea.sql{
                background: none;
                border:none;
                box-shadow: 0px 0px 3px 0px inset #654;
                resize: none;

                // position: relative;
                // z-index: 1;
            }
            > ul.placeholder{
                z-index: 0;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: calc(100% - 33px);
                padding: 5px;
                padding-left: 20px;
                overflow: hidden;
                line-height: 1.7em;
                > li{
                    list-style: decimal outside;
                    color: #aaa;
                    // pointer-events: none;
                    > b{
                        color: #777;
                        font-weight: normal;
                        font-size: 1.1em;
                    }
                    &:not(.priority){
                        font-style: oblique;
                    }
                    // &.priority{
                    //     font-weight: 500;
                    // }
                }
            }
        }
        // > .userParams{}
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