<template>
    <ul class="querybar" v-if="priorDemands.length" :class="{empty:!priorDemands.length}" ref="ul">
        <li v-for="(d) in priorDemands" :key="d.ename"
         :class="{lighted:getLightState(d),hideInput:!inputVisibles[d.ename]}"
         @mouseover.stop="showInput_onMouseenter($event,d)" @mousedown.stop="$set(inputVisibles,d.ename,true)">
            <div class="name toff">
                {{d.nullable?'':'*'}}
                <template v-if="d.type !== 'cn'">{{d.cname}}</template>                    
                <r-select v-else class="valueLv" v-model.trim="d.value.lv" :nullable="false">
                    <r-option v-for="item in d.items" :value="item.ename" :text="item.rename || item.cname" :key="item.ename"/>
                </r-select>
            </div>
            <span class="colon">：</span>
            <demandsDom :demand="d" />
            <i class="fa fa-sort" hint="全表排序"/>
        </li>
    </ul>
</template>

<script>
import common from '@/components/querybar/mixin'
export default common.extend({})
</script>
