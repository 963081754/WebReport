<template>
    <span :class="`demandOneBox demandOneBox_${shape || 'e'}`">
        <template v-if="shape === 'f'">
            <!-- <label>从：</label> -->
            <input class="r-fresh valueF" v-model.trim.lazy="value.f" raw/>
            <label class="goto">到</label>
            <input class="r-fresh valueT" v-model.trim.lazy="value.t" raw/>
        </template>

        <template v-else-if="shape === 'v'">
            <r-select class="valueWay like" v-model.trim="value.way" :nullable="false">
                <r-option v-for="item in likeChars" :value="item" :text="item" :key="item"/>
            </r-select>
            <input class="r-fresh valueV" v-model.trim.lazy="value.v" raw/>
        </template>

        <template v-else>
            <!-- <label>含：</label> -->
            <input class="r-fresh valueE" v-model.trim.lazy="value.e" raw/>
        </template>
        <span class="error">值不能为空</span>
    </span>
</template>
<script>
import {likes} from '@/models'
import {mixin,mixinShape} from './mixin'
export default {
    mixins: [mixin,mixinShape],
    data(){
        return {
            way:Object.freeze('包含')
        }
    },
    computed:{
        likeChars(){
            const list = {...likes}
            delete list.null
            return Object.keys(list)
        }
    }
}
</script>
<style scoped>
</style>
