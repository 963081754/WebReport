<template>
    <r-minipopup :visible.sync="visiblePopup" title="高级查询" icon="search">
        <div class="querier">
            <ul class="list">
                <li v-for="(d) in list" :key="d.ename">
                    <demandsFactory :demand="d" @remove="removeItem(d)" />
                </li>
            </ul>
            <div class="buttons">
                <button raw class="small" disabled>
                    <i class="fa fa-folder-open"/>打开设置
                </button>
                <button raw class="small" disabled>
                    <i class="fa fa-save"/>保存设置
                </button>
                <button raw class="small" @click.stop="toUse">
                    <i class="fa fa-search"/>应用
                </button>
                <button raw class="small" @click.stop="confirm">
                    <i class="fa fa-search"/>确定
                </button>
                <button raw class="small no" @click.stop="clear">
                    <i class="fa fa-minus"/>清空
                </button>
                <button raw class="small no" @click.stop="visiblePopup=false">
                    <i class="fa fa-close"/>关闭
                </button>
            </div>
            <i class="fa fa-th fa-lg"/>
            <ul class="demands" :class="{hide:hideDemands}" @mouseenter.stop="hideDemands=true">
                <li v-for="d in demands" @click.stop="appendItem(d)" :key="d.ename" title="单击 添加到 高级查询面板">                    
                    <div >{{d.cname}}</div>
                </li>
            </ul>
        </div>
    </r-minipopup>
</template>

<script>
import demandsFactory from '@/components/demandShapes/factory.shapeSwitch.vue'

function resetValue(obj){
    Object.keys(obj).forEach(key=>{
        if(key === 'lv') return
        this.$delete(obj,key)
        // delete obj[key]
    })
}

export default {
    components:{ demandsFactory },
    inject:['getDemands'],
    props:{
        visible:{
            type:Boolean,
            required:true
        }
    },
    data(){
        return {
            list: [],
            hideDemands:false
        }
    },
    computed:{
        visiblePopup:{
            get(){                
                return this.visible
            },
            set(visible){
                this.$emit('update:visible',visible)
            }
        },
        demands(){
            return this.getDemands().filter(d=>d.enabled)
        }
    },
    watch:{
        visible:{
            handler(val){
                if(val){
                    this.loadItems()                  
                }
            },
            immediate:true
        }
    },
    methods:{
        loadItems(){
            const list = this.demands
                .filter(t=>t.value && (t.value.e || t.value.t || t.value.f || t.value.v))
                .filter(item=>!this.list.find(t=>t.ename === item.ename))
            this.list = this.list.concat(list)
        },
        appendItem(d){
            if(this.list.includes(d)) return
            this.list.push(d)
        },
        removeItem(d){
            resetValue.call(this,d.value)   // 清空值
            this.list.splice(this.list.indexOf(d),1)
        },
        clear(){
            this.list.forEach(d=>{
                resetValue.call(this,d.value)   // 清空值
            })
            while(this.list.length){
                this.list.pop()
            }
        },
        confirm(){
            this.$emit('confirm')
            this.visiblePopup = false
        },
        toUse(){
            this.$emit('confirm')
        }
    }
}
</script>

<style lang="scss" scoped>
.querier{
    width: 495px;
    height: 300px;
    position: relative;
    display: flex;
    flex-direction: column;
    .list{
        flex-grow: 1;
        display: flex;
        flex-wrap: wrap;
        align-content: flex-start;
        justify-content: space-between;
        width: 100%;
        padding: 5px 5px 15px 5px;
        overflow: auto;
        li{
            width: 220px;
            margin: 7px;
            vertical-align: top;
        }
    }
    .buttons{
        height: 34px;
        width: 100%;
        text-align: right;
        padding: 5px;
        background:#fee;
        button{
            margin-left: 10px;
        }
    }
    .demands{
        // display: none;
        position: absolute;
        bottom: 12px;
        left: 8px;
        max-height: calc(100% - 20px);
        overflow: auto;
        background: #fff;
        box-shadow: 0px 0px 0px 5px #fff,0px 0px 0px 5.5px #ccc, 0px 0px 14px 0px #aaa;
        // border: 1px solid #000;
        li{
            height: 25px;
            line-height: 25px;    
            padding: 0px 5px;
            cursor: pointer;
            &:nth-child(even){
                background: #fee;
            }
            &:last-child{
                border-bottom: none;
            }
            div{
                // width: calc(100% - 18px);
                height: 100%;
                text-overflow: ellipsis;
                white-space: nowrap;   
                overflow: hidden;
            }
        }
        li:hover{
            background: #fc9;
        }
        &.hide{
            display: none;
        }
        &:hover{
            display: block;
        }
    }
    i.fa-th{
        position: absolute;
        left: 0px;
        bottom: 0px;
        cursor: pointer;
        padding: 9px;
        // border: 1px solid #000;
        &:hover + .demands{
            display: block;
        }
    }
}
</style>