<template>
    <ul class="querybar" :class="{empty:!priorDemands.length,setting:setting}" ref="ul" v-sort="{...vSort,list:priorDemands}">
        <li v-for="(d) in priorDemands" :key="d.ename"
         :class="{lighted:getLightState(d),hideInput:!inputVisibles[d.ename]}"
         @mouseover.stop="showInput_onMouseenter($event,d)" @mousedown.stop="$set(inputVisibles,d.ename,true)">
            <div class="name toff" hint="按住拖拉排序">
                <template v-if="setting">
                    <span class="switchShapeIcon" v-if="d.type !== 'kv' && d.type !== 'cv'" @click.stop="d.transformShape(d.value)" hint="单击切换输入方式">
                        <i  :class="`fa fa-repeat rotate_${d.shape}`" />
                    </span>
                    <r-toggle class="nullableIcon" v-model="d.nullable" :reverse="true" :iconMode="4" :hint="`${d.nullable?'可空':'必填'}`"/>
                </template>
                <template v-else>
                    {{d.nullable?'':'*'}}
                </template>                    
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
import { Column, DemandBase } from '@/models'
import common from '@/components/querybar/mixin'
export default common.extend({  
    props:{
        setting:{
            type:Boolean,
            required:true
        }
    },
    created(){
        this.vSort = {
                sorter: this.sorter.bind(this),
                accepts: ['columns'],
                callback: this.addOrRemove.bind(this),
                // hand: null
                hand: 'div.name'
            }
    },
    methods:{
        sorter(i1,i2,item){
            if(!(item instanceof DemandBase) && !(item instanceof Column)){
                console.log(`sorter出意外了`,item)
                return 
            } // 出意外了
            if(this.demands.indexOf(item) === -1) return

            i1 = this.demands.indexOf(this.priorDemands[i1])
            i2 = this.demands.indexOf(this.priorDemands[i2])
            const d = this.demands.splice(i1,1)[0]
            if(!(d instanceof DemandBase) || i1 < 0 || i2 < 0){
                console.log(`sorter出意外了`,d)
                return 
            } // 出意外了
            this.demands.splice(i2,0,d)
        },
        addOrRemove(i1,i2,item){
            if(!(item instanceof DemandBase) && !(item instanceof Column)){
                console.log(`sorter出意外了`,item)
                return 
            } // 出意外了
            if(item.isCustom && item instanceof Column){
                this.$message.info(`自定义列(${item.cname})不能作为查询条件`)
                return
            }
            let demand = item
            let oldIndex,newIndex
            if(i2 === null){  // 移除
                demand.prior = false
                demand.nullable = true
                demand.value = {}

                oldIndex = this.demands.indexOf(demand)
                newIndex = this.priorDemands.length
            }else if(i1 === -1){  // 添加
                demand = this.demands.find(d=>d.ename === item.ename)
                demand.enabled = true
                demand.prior = true

                oldIndex = this.demands.indexOf(demand)
                newIndex = this.priorDemands.length - 1
            }
            if(oldIndex !== newIndex){                
                this.demands.splice(oldIndex,1)
                this.demands.splice(newIndex,0,demand)
            } // 位置顺序 改变时
        }
    }
})
</script>

<style lang="scss" scoped></style>