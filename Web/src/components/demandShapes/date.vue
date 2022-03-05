<template>
    <span :class="`demandOneBox demandOneBox_${shape || 'f'}`">
        <template v-if="shape === 'e'">
            <r-date-picker class="r-fresh valueE" v-model.trim.lazy="value.e" :defaultShortcuts="true" :hint="dateHint" raw/>   
        </template>

        <template v-else-if="shape === 'v'">
            <r-select class="valueWay" v-model.trim.lazy="value.way" :nullable="false">
                <r-option v-for="item in compareChars" :value="item" :text="item" :key="item"/>
            </r-select>
            <r-select class="r-fresh valueV" v-model.trim.lazy="value.v" :nullable="nullable">
                <r-option v-for="item in options" :value="item.ename" :text="item.cname" :key="item.ename" />
            </r-select>
        </template>
        
        <template v-else>
            <r-date-picker class="r-fresh valueF" v-model.trim.lazy="value.f" :defaultShortcuts="true" :hint="dateHint"/>
            <label class="goto">到</label>
            <r-date-picker class="r-fresh valueT" v-model.trim.lazy="value.t" :defaultShortcuts="true" :hint="dateHint"/>  
        </template> 
        <span class="error">值不能为空</span>
    </span>
</template>

<script>
import {mixin,mixinShape} from './mixin'
export default {
    mixins: [mixin,mixinShape],
    inject:['isRelativeDate'],
    data(){
        return {
            way:Object.freeze('大于')
        }
    },
    computed:{
        dateHint(){
            return this.isRelativeDate ? '时间值会根据用户登录时间变化' : false // '这里设置的时间值是“相对值”'
        }
    }
}
</script>
<style scoped>

</style>
