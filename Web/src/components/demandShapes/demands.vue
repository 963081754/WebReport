<template>
    <kv     :value="demand.value" :nullable="nullable" :kvKey="demand.kv" :columnName="demand.cname" :error="error" v-if="demand.type === 'kv'" />
    <date   :value="demand.value" :nullable="nullable" :shape="shape" :options="options" :error="error" v-else-if="demand.type === 'd'" />
    <num    :value="demand.value" :nullable="nullable" :shape="shape" :options="options" :error="error" v-else-if="demand.type === 'n'" />
    <cn     :value="demand.value" :nullable="nullable" :shape="shape" :options="options" :error="error" v-else-if="demand.type === 'cn'" :type="demand.itemType" />
    <cv     :value="demand.value" :nullable="nullable" :items="demand.items" :error="error" v-else-if="demand.type === 'cv'" />
    <str    :value="demand.value" :nullable="nullable" :shape="shape" :error="error" v-else />
</template>

<script>
import date from './date.vue'
import num from './num.vue'
import str from './str.vue'
import kv from './kv.vue'
import cv from './cv.vue'
import cn from './cn.vue'

export default {
    name:'demands',
    components:{ date, num, str, kv, cv, cn },
    inject:['getFields'],
    props:{
        demand:{
            type:Object,
            required:true
        },
        anotherShape:{
            type:String,
            required:false
        }
    },
    computed:{
        shape(){
            return this.anotherShape || this.demand.shape
        },
        nullable(){
            if(this.demand.type === 'kv'){
                return this.demand.nullable
            }else{
                return this.shape === this.demand.shape ? this.demand.nullable : true
            }
        },
        options(){
            if(this.demand.type !== 'cn'){
                return this.getFields().filter(t=>t.dataType === this.demand.dataType && t.ename !== this.demand.ename)
            }else if(this.demand.selectItem){
                return this.getFields().filter(t=>t.dataType === this.demand.selectItem.dataType && t.ename !== this.demand.selectItem.ename)
            }else{
                return []
            }
        },
        error(){
            return this.demand.getError(this.nullable)
        }
    }
}
</script>
