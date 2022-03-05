<template>
    <span class="chainSearcher">
        <input class="r-fresh" :value="selectItem.name" @click.stop="openSelecter" readonly :placeholder="placeholder" raw>
        <i class="clearIcon" @click.stop="clear" v-if="nullable && selectItem.name">✗</i>
        <i class="fa fa-ellipsis-h"  @click.stop="openSelecter" />
        <keep-alive>
            <chainSelector v-if="visible" :visible.sync="visible" :id="id" :title="title" @select="emit" @onIsLittleSqlChain="$emit('onIsLittleSqlChain',$event)" />
        </keep-alive>
    </span>
</template>

<script>
const chainSelector  = () => import('@/components/chainSelector.vue')

export default {
    components:{ chainSelector },
    inject:['getters','chainApi','getColumns'],
    model: {
        prop: 'value',
        event: 'change'
    },
    props:{
        id:{
            type:[Number,String],
            required:true
        },
        title:{
            type:String,
            required:true
        },
        value:{
            type:[Number,String],
            required:false
        },
        nullable:{
            type:Boolean,
            required:false,
            default:true
        },
        placeholder:{
            type:String,
            required:false
        }
    },
    data(){
        return {
            visible:false,
            selectItem:{}
        }
    },
    watch:{
        value:{
            handler(){
                if(this.selectItem.id === this.value) return
                this.selectItem = { id: this.value }
                if(this.value === null || this.value === undefined || this.value === '') return
                                
                // this.selectItem.id = this.value
                this.chainApi.getValuesOfSql(this.id,[this.value],this.getters.tstUser).then(obj=>{
                    if(Object.prototype.hasOwnProperty.call((obj || {}),this.value)){
                    // if(obj[this.value]){
                        this.selectItem = { id:this.value, name:obj[this.value] }
                    }else{
                        this.$emit('change',null)
                        this.$emit('revise','值不存在')
                    }
                })
            },
            immediate:true
        }
    },
    methods:{
        openSelecter(){
            this.visible = true
        },
        clear(){
            this.emit({})
        },
        emit(item){
            this.selectItem = item
            this.$emit('change',item.id)
            this.visible = false
        }
    }
}
</script>

<style lang="scss" scoped>
.chainSearcher{
    display: block;
    position: relative;
    border-bottom: 1px solid #666;
    height: 100%;
    > input[readonly]{
        width: 100%;
        // border-color: #555 !important;
        border: none;
        cursor: pointer;
    }    
    > i.fa,> .clearIcon{
        position: absolute;
        z-index: 1;
        top: calc(50% - 4px);
        right: 0px;
        cursor: pointer;
    }
    > i.fa{
        color: #bbb;
    }
    > .clearIcon{
        display: none;
        top: calc(50% - 8px);
    }
    &:hover > .clearIcon{
        display: block;
        + i.fa{
            display: none;
        }
    }
}
.chainSearcher[error]{
    border-bottom: 1px dashed #f00;
}
</style>