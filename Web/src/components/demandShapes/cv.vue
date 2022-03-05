<template>
    <span class="demandOneBox demandOneBox_cv">
        <r-select class="r-fresh valueE" v-model.trim="value.e" :nullable="nullable">
            <r-option v-for="item in items" :value="item.id" :text="item.rename || item.cname" :key="item.id"/>
            <!-- <r-option v-for="item in items" :value="item.ename" :text="item.rename || item.cname" :key="item.ename"/> -->
        </r-select>
        <span class="error">值不能为空</span>
    </span>
</template>

<script>
import {mixin} from './mixin'
export default {
    mixins: [mixin],
    props:{
        items:{
            type:Array,
            required:true
        }
    }
}
</script>
<style scoped>

</style>
