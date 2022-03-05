<template>
    <r-minipopup :visible.sync="visiblePopup" :title="obj.id ? `修改 ${obj.name}` : '创建别针'" :shade="true">
        <div>
            <component :is="computedId"  :model="model" @succeeded="succeeded">
                <div class="row" v-if="!obj.id">
                    <label>数据源：</label>
                    <div class="radiogroup">
                        <label>
                            <input type="radio" v-model="obj.type" :value="ChainType.enum" name="type" raw>{{ChainType.enum}}
                        </label>
                        <label>
                            <input type="radio" v-model="obj.type" :value="ChainType.sql" name="type" raw>{{ChainType.sql}}
                        </label>
                    </div>
                </div>
                <div class="row">
                    <label style="word-spacing: .7em;">名 称：</label>
                    <div class="name">
                        <input raw class="r-fresh" v-model.trim="model.name" placeholder="请输入名称" maxlength="100">
                    </div>
                </div>
            </component>
        </div>
    </r-minipopup>
</template>

<script>
import { Chain, SqlChain } from '@/models'
import enumCreator from '@/admin/components/chainDesigner/enumCreator.vue'
import sqlCreator from '@/admin/components/chainDesigner/sqlCreator.vue'

export default {
    components:{ enumCreator, sqlCreator },
    inject:['getters','chainApi'],
    props:{
        visible:{
            type:Boolean,
            required:true
        },
        obj:{
            type:Object,
            required:true
        }
    },
    data(){
        return {
            model:null
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
        },
        computedId(){
            return this.obj.type === this.ChainType.enum ? 'enumCreator' : 'sqlCreator'
        }
    },
    watch:{
        'obj.type':{
            handler(){
                if(this.obj.type === this.ChainType.enum){
                    this.model = new Chain(this.obj)
                }else{
                    this.model = new SqlChain(this.obj)
                }
            },
            immediate:true
        }
    },
    methods:{
        succeeded(event){
            if(this.obj.id){
                this.visiblePopup = false
            }
            this.$emit('succeeded',event)
        }
    }
}
</script>

<style lang="scss" scoped>
.row{    
    > div.name{
        > input{
            width: 100%;
        }
    }
}
</style>