<template>
    <r-minipopup :visible.sync="visiblePopup" :title="title" :resizeable="true" :closeable="true" icon="quora">
        <sqlCreator :sql="sql" :db_id="db_id" @parse="parse" @close="visiblePopup=false" />      
    </r-minipopup>
</template>

<script>
import sqlCreator from '@/admin/components/sqlCreator.vue'

export default {
    components:{sqlCreator},
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
    computed:{
        visiblePopup:{
            get(){
                return this.visible
            },
            set(value){
                this.$emit('update:visible',value)
            }
        }
    },
    methods:{
        parse(event){
            if(this.visiblePopup){
                this.$emit('parse',event)
            }  // 如果未 关闭
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
    > div.sql{
        box-shadow: 0 0 0 1px inset #edc;
    }
    > textarea.sql{
        border:none;
        box-shadow: 0px 0px 3px 0px inset #654;
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