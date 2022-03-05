<template>
    <r-minipopup :visible.sync="visiblePopup" :title="title" icon="quora">
        <div class="sqlDisplay">
            <div class="sql" v-html="htmlSql"></div>
        </div>        
    </r-minipopup>
</template>

<script>
import { sqlToHtml } from '@/utility/utility'

export default {
    props:{
        visible:{
            type:Boolean,
            required:true
        },
        title:{
            type:String,
            required:true
        },
        sql:{
            type:String,
            required:true
        }
    },
    computed:{
        htmlSql(){
            return sqlToHtml(this.sql)
        },
        visiblePopup:{
            get(){
                return this.visible
            },
            set(value){
                this.$emit('update:visible',value)
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.sqlDisplay{
    width: 600px;
    padding: 10px;
    padding-right: 5px;
    div.sql{
        display: inline-block;
        height: 300px;
        width: 100%;
        overflow: auto;
    }
}
</style>