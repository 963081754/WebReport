<template>
    <span :class="`demandOneBox demandOneBox_${shape || 'f'}`">
        <template v-if="shape === 'e'">
            <!-- <label>等：</label> -->
            <input class="r-fresh valueE" v-model.trim.number.lazy="value.e" raw type="number" />
        </template>

        <template v-else-if="shape === 'v'">
            <r-select class="valueWay" v-model.trim.lazy="value.way" :nullable="false">
                <r-option v-for="item in compareChars" :value="item" :text="item" :key="item"/>
            </r-select>
            <r-select class="r-fresh valueV" v-model.trim.lazy="value.v" :nullable="nullable">
                <r-option v-for="item in options" :value="item.ename" :text="item.cname" :key="item.ename"/>
            </r-select>
        </template>

        <template v-else>
            <!-- <label>从：</label> -->
            <input class="r-fresh valueF" v-model.trim.number.lazy="value.f" raw type="number" />
            <label class="goto">到</label>
            <input class="r-fresh valueT" v-model.trim.number.lazy="value.t" raw  type="number" />
        </template>
        <span class="error">值不能为空</span>
    </span>
</template>

<script>
import {mixin,mixinShape} from './mixin'
export default {
    mixins: [mixin,mixinShape],
    data(){
        return {
            way:Object.freeze('大于')
        }
    }
}
</script>
<style scoped>

</style>
