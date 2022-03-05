<template>
    <div class="contextmenu" v-show="visible" :style="{top:`${site.y}px`,left:`${site.x}px`}" @mousedown.stop>
        <ul>
            <template v-if="!isFront">                
                <li class="users" v-delayHover>
                    <i class="fa fa-users"></i>
                    切换 模拟用户
                    <i class="fa fa-angle-right"></i>
                    <simulateUserSelector class="simulateUserSelector1" :dir="false" @selected="tstUserSelected" />                   
                </li>
                <li class="split"></li>
            </template>
            <li @click.stop="onOperate('query')">
                <i class="fa fa-search"></i>
                立即查询
            </li>
            <li @click.stop="onOperate('openQuerier')">
                <i class="fa fa-window-maximize"></i>
                打开高级查询
            </li>   
            <li @click.stop="onOperate('print')">
                <i class="fa fa-print"></i>
                打印</li>
            <li @click.stop="onOperate('download')">
                <i class="fa fa-download"></i>
                下载</li>
            <li class="split"></li> 
            <li @click.stop="onVisible('visible_querybar')">
                <i :class="`fa fa-eye${operations.visible_querybar.get() ? '-slash':''}`"/>                
                <template v-if="operations.visible_querybar.get()">隐藏查询栏</template>
                <template v-else>显示查询栏</template>
            </li>
            <li @click.stop="onVisible('visible_headbar')">
                <i :class="`fa fa-eye${operations.visible_headbar.get() ? '-slash':''}`"/>                
                <template v-if="operations.visible_headbar.get()">隐藏工具栏</template>
                <template v-else>显示工具栏</template>
            </li>
            <li @click.stop="onVisible('visible_pagingbar')">
                <i :class="`fa fa-eye${operations.visible_pagingbar.get() ? '-slash':''}`"/>                
                <template v-if="operations.visible_pagingbar.get()">隐藏分页栏</template>
                <template v-else>显示分页栏</template>
            </li>
            <li @click.stop="onOperate('openColumnsDisplayer')">
                <i class="fa fa-columns"></i>
                打开表头管理器
            </li>
        </ul>
    </div>
</template>

<script>
const simulateUserSelector = ()=> import('@/admin/components/simulateUserSelector.vue')

export default {
    components:{ simulateUserSelector },
    props:{
        isFront:{
            type:Boolean,
            required:true
        },
        visible:{
            type:Boolean,
            required:true
        },
        site:{
            type:Object,
            required:true,
            validator({x,y}={}){
                return typeof(x) === 'number' && typeof(y) === 'number'
            }
        },
        operations:{
            type:Object,
            required:true
        }
    },
    watch:{
        visible:{
            handler(val){
                if(val){
                    document.addEventListener('mousedown',this.close)
                }else{
                    document.removeEventListener('mousedown',this.close)
                }
            },
            immediate:true
        }
    },
    beforeDestroy(){
        document.removeEventListener('mousedown',this.close)
    },
    methods:{
        close(){
            this.$emit('update:visible',false)
        },
        onOperate(code){
            this.close()
            this.operations[code]()
        },
        onVisible(code){
            // this.close()
            this.operations[code].set()
        },
        tstUserSelected(){
            this.close()
        }
    }
}
</script>

<style lang="scss" scoped>
.contextmenu{
    z-index: 10000;
    position: fixed;
    // border: 1px solid #dcb;
    box-shadow: 2px 2px 2px 0px #432,0px 0px 0px 1px #dcb;
    background: #fff;
    > ul{
        > li{
            display: block;
            height: 30px;
            line-height: 30px;
            padding: 0px 10px;
            cursor: pointer;
            > i.fa{
                width: 20px;
                text-align: center;
                font-size: 1.1em;
                &.fa-users,
                &.fa-user-circle-o{
                    color: #f00;
                }
            }
            &.split{
                width: 90%;
                height: .5px;
                overflow: hidden;
                margin: 3px auto;
                background: #cba;
                // border-bottom: 1px solid #cba;
            }            
            &:hover{
                background: #fcb;
                > i.fa{
                    transform: scale(1.2,1.2);
                }
            }
            &.users{
                position: relative;  
                > .simulateUserSelector1{
                    display: none;
                    position: absolute;
                    left: 100%;
                    top: 0;
                }            
                &.delayHover{
                    > .simulateUserSelector1{
                        display: flex;
                    }
                }
            }
        }
    }
}
</style>