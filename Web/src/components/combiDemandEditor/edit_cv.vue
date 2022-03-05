<template>
    <div class="createCombiDemand_second">
        <div class="sortArea" v-sort="{list:cd.items,sorter:itemsSorter,callback:addOrRemoveItem,accepts: ['columns']}" emptyHint="请从左边 把需要组合的条件 拉到这里。允许【复合条件】外的所有条件列。">
            <template v-for="(item,i) in cd.items">
                <queryInputsFactory :index="i+1" :demand="item" @remove="removeItem(item)" :key="item.id" />
            </template>
        </div>
        <fieldset class="previewbox">
            <legend>预览</legend>
            <input class="r-fresh label" v-model.trim="cd.cname" placeholder="请输入名称" raw :error="isEmpty(cd.cname)">：
            <r-combobox class="combobox combobox_cn value" v-model.trim="cd.value.e" :items="cd.items" vField="id" :tField="(item)=>(item.rename || item.cname)" :nullable="false">
                <template v-slot:header>
                    <div class="header">
                        <label>选择</label>
                        <label>重命名</label>
                    </div>
                </template>
                <template v-slot:default="{data}">
                    <div class="item">
                        <label v-if="data.id === cd.value.e">✓</label>
                        <label v-else></label>
                        <label>
                            <input class="r-fresh rename" v-model.trim="data.rename" :placeholder="`${data.cname}(单击 重命名)`" maxlength="30" @click.stop raw>
                        </label>
                    </div>
                </template>
            </r-combobox>
            <!-- <r-select class="r-fresh value" v-model.trim="cd.value.e" :nullable="true">
                <r-option v-for="(item,i) in cd.items" :value="item.id" :text="`${item.rename || item.cname}`" :key="item.id" >
                {{i+1}} <input class="r-fresh rename" v-model.trim="item.rename" :placeholder="`${item.cname}(单击 重命名)`" @click.stop @dblclick.stop="selectItem(item)" maxlength="30" raw>
                </r-option>
            </r-select> -->
        </fieldset>
        <template id="a"/>
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
import queryInputsFactory from '@/components/demandShapes/factory.vue'
import mixin from './editMixin'

export default {
    components:{ queryInputsFactory },
    mixins:[mixin],
    methods:{
        finish(){
            if(!this.finishVerify()) return
            this.$emit('finish')
        },
        finishVerify(){
            if(this.cd.items.length < 2){
                this.$message.error('需要至少2个条件')
                return
            }
            if(this.isEmpty(this.cd.cname)){
                this.$message.error('请输入条件名称')
                return false
            }
            if(this.cd.items.find(t=>t.getError())){
                this.$message.error('请输入各个条件的值')
                return false
            }
            return true
        },
        addOrRemoveItem(i1,i2,item){
            mixin.methods.addOrRemoveItem.call(this,i1,i2,item,true)
        },
        selectItem(item){
            this.cd.value.e = item.id
            this.$forceUpdate() // r-select不自动更新，不得不加这句
        }
    }
}
</script>

<style lang="scss" scoped src="@/components/chainSelect/css.scss"></style>
<style lang="scss" scoped>
.createCombiDemand_second{
    .sortArea{
        fieldset{
            float: left;
            width: calc(100% - 15px);
            margin: 5px 7px;
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