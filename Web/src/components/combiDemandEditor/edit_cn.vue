<template>
    <div class="createCombiDemand_second">
        <div class="sortArea" v-sort="{list:cd.items,sorter:itemsSorter,callback:addOrRemoveItem,accepts: ['columns'],offset:0}" emptyHint="请从左边 把需要组合的条件 拉到这里。条件列的数据类型必须相同(字符、数字、时间日期)。绑定了 【下拉或弹窗】 的列不能组合。">            
            <div class="item" v-for="(item) in cd.items" :key="item.ename">
                <span class="close" @click.stop="removeItem(item)">✗</span>
                {{item.cname}}
                <!-- <span v-if="i===0">({{baseDataTypes[item.type]}})</span> -->
                <!-- <input v-model.trim="item.rename" class="r-fresh" style="width:100px" :placeholder="item.cname" raw> -->
            </div>
        </div>
        <fieldset class="previewbox">
            <legend>
                预览 
                <span class="switchShapeIcon" @click.stop="firstDemand.transformShape(firstDemand.value)" hint="切换输入方式" v-if="firstDemand">
                    <i :class="`fa fa-repeat rotate_${firstDemand.shape}`"/>
                </span>
                <input class="cname" v-model="cd.cname" placeholder="请输入条件名称" :error="isEmpty(cd.cname)" raw>
            </legend>
            <r-combobox ref="combobox1" class="combobox combobox_cn label" v-model.trim="cd.value.lv" :items="cd.items" vField="ename" :tField="(item)=>(item.rename || item.cname)" :nullable="false">
                <template v-slot:header>
                    <div class="header">
                        <label>选择</label>
                        <label>重命名</label>
                    </div>
                </template>
                <template v-slot:default="{data}">
                    <div class="item">
                        <label v-if="data.ename === cd.value.lv">✓</label>
                        <label v-else></label>
                        <label>
                            <input class="r-fresh rename" v-model.trim="data.rename" :placeholder="`${data.rename || data.cname}(单击 重命名)`" maxlength="30" @click.stop raw>
                        </label>
                    </div>
                </template>
            </r-combobox>
            <!-- <r-select class="r-fresh label" v-model="cd.value.lv" :nullable="false" :error="isEmpty(cd.value.lv)">
                <r-option v-for="(item,i) in cd.items" :value="item.ename" :text="`${item.rename || item.cname}`" :key="item.ename" >
                {{i+1}} <input class="r-fresh rename" v-model.trim="item.rename" :placeholder="`${item.cname}(单击 重命名)`" @click.stop @dblclick.stop="cd.value.lv=item.ename" maxlength="30" raw>
                </r-option>
            </r-select>： -->
            <demands class="value" v-if="firstDemand" :demand="firstDemand" :shape="firstDemand.shape" />
        </fieldset>
        <div class="toolbar">
            <button @click.stop="finish" raw>
                <i class="fa fa-check"/> 完成
            </button>
            <button @click.stop="$emit('cancel')" raw>
                <i class="fa fa-minus"/> 取消
            </button>
        </div>
    </div>
</template>

<script>
import mixin from './editMixin'
import demands from '@/components/demandShapes/demands.vue'
import { BaseDataTypes } from '@/models'

export default {
    mixins:[mixin],
    components:{ demands },
    data(){
        return {
            baseDataTypes: Object.freeze(BaseDataTypes)
        }
    },
    computed:{
        firstDemand(){
            const result = this.cd.items[0]
            if(!result) return null
            result.nullable = true
            return result
        }
    },
    methods:{
        addOrRemoveItem(i1,i2,item){
            if(item.type === 'kv'){
                this.$message.info('绑定了下拉或弹窗的列不能作为复合组件的项',1000)
                return
            }
            if(this.firstDemand){                
                if(this.firstDemand.type !== item.type){
                    this.$message.info(`不是 ${BaseDataTypes[this.firstDemand.type]}`,1000)
                    return
                }
            }
            mixin.methods.addOrRemoveItem.call(this,i1,i2,item)
        },
        finish(){
            if(this.cd.items.length < 2){
                this.$message.error('需要至少2个条件')
                return
            }
            if(this.isEmpty(this.cd.cname)){
                this.$message.error('请输入条件名称')
                return
            }
            if(this.isEmpty(this.cd.value.lv) || !this.cd.items.map(t=>t.ename).includes(this.cd.value.lv)){
                this.$message.error('请选择默认条件')
                return
            }
            // this.cd.value.lv = null
            this.cd.value = {...this.firstDemand.value, lv:this.cd.value.lv}
            this.cd.shape = this.firstDemand.shape
            this.$emit('finish')
        }
    }
}
</script>

<style lang="scss" scoped src="@/components/chainSelect/css.scss"></style>
<style lang="scss" scoped>
.createCombiDemand_second{
    .sortArea{
        height: calc(100% - 100px);
        padding: 20px 0px;
        div.item{
            margin: auto;
            width: 300px;
            padding: 5px;
            border-bottom: 1px solid #eee;
            cursor: pointer;
            &:nth-child(odd){
                background: #fee;
            }
            .close{
                cursor: pointer;
            }
        }
    }
    .previewbox{
        legend{
            .cname{
                margin-left: 5px;
            }
        }
        > .value{
            border-bottom: 1px solid #876;;
        }
    }
}

.combobox{
    .header,
    .item{
        padding-right:0;
        > label:nth-child(1){
            width: 40px;
            text-align:center;
        }
        > label:nth-child(2){
            width: 160px;
        }
    }
}
</style>
<style lang="scss">
.combobox_cn{
    li > div{
        padding:0 !important;
    }
    li[selected] > div::after{
        content: none !important;
    }
}
</style>