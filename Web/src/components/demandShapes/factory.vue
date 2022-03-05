<template>
    <fieldset class="demandFieldset">
        <legend>
            {{index? `${index} `:''}}{{demand.cname}}
            <span class="switchShapeIcon" @click.stop="demand.transformShape(demand.value)" hint="切换输入方式" v-if="!['kv','cv'].includes(demand.type)">
                <i :class="`fa fa-repeat rotate_${demand.shape}`"/>
            </span>
        </legend>

        <demands :demand="demand" />  

        <span class="close" @click.stop="$emit('remove')">✗</span>
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
        },
        index:{
            type:Number,
            required:false
        }
    }
}
</script>

<style scoped></style>
