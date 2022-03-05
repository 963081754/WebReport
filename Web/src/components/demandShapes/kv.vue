<template>
    <span class="demandOneBox demandOneBox_kv" :class="{demandOneBox_kv_cascader:layer}">
        <template v-if="layer">
            <cascader class="valueE" v-model.trim="value.e" :chainId="kvKey" :nullable="nullable" @revise="onReviseValue" />
        </template>
        <template v-else-if="getters.littleChainValueEnums(kvKey)">
            <chainCombobox ref="chainCombobox1" class="valueE" v-model.trim="value.e" :chainId="kvKey" :nullable="nullable" @revise="onReviseValue" />            
        </template>
        <template v-else>
            <chainSearcher class="valueE" v-model.trim="value.e" :id="kvKey" :title="columnName" :nullable="nullable"
             @onIsLittleSqlChain="onIsLittleSqlChain" @revise="onReviseValue"/>
        </template>
        <span class="error">值不能为空</span>
    </span>
</template>

<script>
import chainSearcher from '@/components/chainSearcher.vue'
import chainCombobox from '@/components/chainCombobox.vue'
const cascader = ()=>import('@/components/cascader.vue')
import {mixin} from './mixin'

export default {
    components:{ chainSearcher, chainCombobox, cascader },
    mixins: [mixin],
    inject: ['getters'],
    props:{
        kvKey:{
            type:[String,Number],
            required:true
        },
        columnName:{
            type:String,
            required:true
        }
    },
    computed:{
        layer(){
            const chain = this.getters.chains.find(t=>t.id === this.kvKey)
            if(!chain) return 0
            if(chain.type === this.ChainType.sql){
                if(chain.masterKeys.pid){
                    return chain.masterKeys.layer
                }
            }
            return 0
        }
    },
    methods:{
        onIsLittleSqlChain(){
            this.$nextTick(()=>{
                setTimeout(() => {
                    if(this.$refs.chainCombobox1){
                        this.$refs.chainCombobox1.visibleDropdown(true)
                    }
                }, 500)                
            })
        }, // 如果是 缓存到store的小chain，则等弹窗关闭、chainCombobox组件加载后，自动显示下拉列表，提示用户选择。
        onReviseValue(msg){
            this.$message.error(`${this.columnName} 赋值错误：${msg}`)
        }
    }
}
</script>

<style scoped>

</style>
