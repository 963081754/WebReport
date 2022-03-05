<template>
    <select raw class="r-fresh" :value="value" @change="onChange">
        <template v-if="type==='n'">
            <option value=''></option>
            <option value='sum'>求和</option>
            <option value='avg'>平均值</option>
            <option value='max'>最大值</option>
            <option value='min'>最小值</option>
        </template>
        <template v-if="type==='d'">
            <option value=''></option>
            <option value='max'>最大值</option>
            <option value='min'>最小值</option>
        </template>
    </select>
</template>
<script>
export default {
    model: {
        prop: 'value',
        event: 'change'
    },
    props:{
        type:{
            type:String,
            required:true
        },
        value:{
            type:String,
            required:true
        }
    },
    methods:{
        onChange(event){
            this.$emit('change', event.target.value)
        }
    }
}
</script>
<style scoped>
</style>