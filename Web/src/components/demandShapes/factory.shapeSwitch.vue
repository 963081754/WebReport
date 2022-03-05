<template>
    <fieldset class="demandFieldset">
        <span class="close" @click.stop="$emit('remove')">✗</span>
        <legend>
            <!-- {{demand.cname}} -->
            <template v-if="!demand.combi || demand.combi!=='cn'">
                {{demand.cname}}：
            </template>
            <r-select v-else class="valueLv" v-model.trim="demand.value.lv" :nullable="false">
                <r-option v-for="item in demand.items" :value="item.ename" :text="item.rename || item.cname" :key="item.ename"/>
            </r-select>

            <span class="switchShapeIcon" @click.stop="transformShape" hint="切换输入方式" v-if="!['kv','cv'].includes(demand.type)">
                <i :class="`fa fa-repeat rotate_${shape}`"/>
            </span>
        </legend>

        <demands :demand="demand" :anotherShape="shape"/>  
        
        
    </fieldset>
</template>

<script>
import demands from './demands.vue'

export default {
    components:{ demands },
    props:{
        demand:{
            type:Object,
            required:true
        }
    },
    data(){
        return {
            shape: this.demand.shape
        }
    },
    methods:{
        transformShape(){
            this.demand.transformShape.call(this,this.demand.value)
        }
    }
}
</script>
<style scoped></style>
