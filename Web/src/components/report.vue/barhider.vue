<template>
    <div class="barHider" :style="{marginLeft: `${getIsFrontDesk()? 10 : 40}px`}">
        <!-- <span @mouseenter.stop="floatSearchbar(2)" @mouseleave.stop="floatSearchbar(0)"> -->
        <span class="name">{{name}}</span><!-- 占位符，不显示出来 -->        
        <span>
            <i class="fa fa-fast-backward" @click.stop="switchPagebar"
            :class="`state_${visible_pagingbar}`" :hint2="visible_pagingbar === 0 ? '显示 分页栏' : '隐藏 分页栏'" hint2b>
                <!-- <i class="fa fa-thumb-tack"/> -->
                <i class="fa fa-eye"/>
            </i>
        </span>
        <span>
            <i class="fa fa-search" @click.stop="switchSearchbar"
            :class="`state_${visible_headbar}`" :hint2="visible_headbar === 0 ? '显示 搜索栏' : '隐藏 搜索栏'" hint2b>
                <i class="fa fa-eye"/>
            </i>
        </span>
        <span>
            <i class="fa fa-window-maximize state_0" v-if="!visible_headbar"
             @click.stop="$emit('openQuerier')" hint2="高级查询框" hint2b></i>
        </span>
    </div>
</template>

<script>
export default {
    inject:['getIsFrontDesk'],
    props:{
        visible_headbar:{
            type:Number,
            required:true
        },
        visible_pagingbar:{
            type:Number,
            required:true
        },
        name:{
            type:String,
            required:false
        }
    },
    methods:{
        switchSearchbar(){
            this.$emit('update:visible_headbar',this._getNextVisibleValue(this.visible_headbar))
        },
        switchPagebar(){
            this.$emit('update:visible_pagingbar',this._getNextVisibleValue(this.visible_pagingbar))
        },
        _getNextVisibleValue(val){
            return val === 0 ? 1 : 0
            // switch(val){
            //     case 0:
            //         return 2
            //     case 2:
            //         return 1
            //     default:
            //         return 0
            // }
        }
        // floatSearchbar(value){
        //     if(this.visible_headbar === 1) return

        //     this.$emit('update:visible_headbar', value)
        // },
        // floatPagebar(value){
        //     if(this.visible_pagingbar === 1) return

        //     this.$emit('update:visible_pagingbar', value)
        // }
    }
}
</script>

<style lang="scss" scoped>
.barHider{
    z-index: 1;
    position: fixed;
    margin-top: -24px;
    // margin-left: 20px;    
    height: 30px;
    pointer-events: none;
    > *{
        display: inline-block;
        vertical-align: middle;
    }
    > span{
        pointer-events: auto;
        display: inline-block;
        height: 100%;
        width: 20px;
        text-align: center;
        margin: 0px 6px;
        &.name{
            visibility: hidden;
            width: auto;
            min-width: 20px;
            word-break: keep-all;
            font-size:14px;
            margin-right: 15px;
        }
        > i.fa{
            cursor: pointer;
            font-size: 1em; 
            color: #ddd;            
            padding: 0px 4px 2px 4px;
            &.state_0{
                color: #432;                
                &:not(.fa-window-maximize){
                    border-bottom: 1px solid #000;
                }
                > i.fa-eye{
                    display: none;
                }
            }
            > i.fa-eye{
                color: #555;
                left: 3px;
            }
            // &.state_2,
            // &.state_3{
            //     font-style:oblique;
            // }

            // > i.fa-thumb-tack{
            //     color: #000;
            //     text-shadow: 1px 0px 1px #fff, 0px 1px 1px #fff;
            // }
            // &.fa-search{
            //     > i.fa-thumb-tack{
            //     top: -3px;
            //     left: 0px;
            //     }
            // }
            // &.fa-fast-backward{
            //     > i.fa-thumb-tack{
            //     top: -3px;
            //     left: -5px;
            //     }
            // }
            // &.state_0 > i.fa{
            //     color: #999;
            // }
            // &.state_2 > i.fa,
            // &.state_3 > i.fa{
            //     font-style:oblique;
            // }
        }
    }
    
    &:hover{
        z-index: 2;
    }
}
</style>