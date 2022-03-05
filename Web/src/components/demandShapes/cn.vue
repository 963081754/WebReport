<template>
    <date   :value="value" :nullable="nullable" :shape="shape" :options="options" v-if="type === 'd'" />
    <num    :value="value" :nullable="nullable" :shape="shape" :options="options" v-else-if="type === 'n'" />
    <str    :value="value" :nullable="nullable" :shape="shape" v-else />
</template>

<script>
import date from './date.vue'
import num from './num.vue'
import str from './str.vue'
import {mixin,mixinShape} from './mixin'

export default {
    mixins: [mixin,mixinShape],
    components:{ date, num, str },
    props:{
        type:{
            type:String,
            required:true
        }
    },
    data(){
        return {
            way:Object.freeze('大于')
        }
    }
}
</script>

<style scoped>

</style>
