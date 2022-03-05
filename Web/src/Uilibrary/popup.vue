<template>
    <div class="popup" :class="classs" :style="{zIndex:zIndex,height:(autoHeight?'auto':'')}" @mousedown.capture="toTopmost"
     v-show="visible" v-move="moveHand" v-resize="resize">
        <div class="shade" v-if="shade" @click.stop="$emit('clickShade')"></div>
        <div class="wrap" :style="{paddingTop:(title || closeable)?'2px':'8px'}">
            <div class="header" ref="header" v-if="title || closeable" @dblclick.stop="fastResize">
                <i :class="`fa fa-${icon} icon`" v-if="icon!==null" />
                <span class="title" v-if="title">{{title}}</span>

                <span class="iconButtons">
                    <i class="fa fa-television alone" v-if="aloneWindow" @click.stop="aloneShow" hint="独立浏览器窗口" hintb/>
                    <i class="tack fa fa-thumb-tack" v-if="fix" @click.stop="fixed=!fixed" :hint="`${fixed?'取消最前':'始终最前'}`" hintb />
                       
                    <template v-if="enableMax">
                        <i class="min" @click.stop="min()">—</i>                        
                        <span class="med" v-if="sizeStatus===2" @click.stop="max"><i/></span>
                        <span class="max" v-if="sizeStatus===3" @click.stop="med"><i/><i/></span>           
                    </template>
                    <span class="close" v-if="closeable" @click.stop="close">✕</span>                    
                </span>
            </div>
            <div class="content" ref="content">
                <slot>{{content}}</slot>
            </div>
        </div>
    </div>
</template>

<script>
import Vue from 'vue'
const activeState = Vue.observable({ zIndex: 1 })

const appendToBody = function(el){
    const body = document.querySelector("body")
    if (body.append) {
        body.append(el)
    } else {
        body.appendChild(el)
    }
}
const csize = {w:0,h:0}
{
    const setMaxSize = function(){
        csize.h = document.body.clientHeight
        csize.w = document.body.clientWidth
    }
    window.addEventListener('load',setMaxSize)
    window.addEventListener('resize',setMaxSize)
}

export default {
    name:'popup',
    props:{
        visible:{
            type:Boolean,
            required:true
        },
        shade:{
            type:Boolean,
            required:false
        },        
        drag:{
            type:Boolean,
            required:false,
            default:true
        },
        resize:{
            type:Boolean,
            required:false,
            default:true
        },
        enableMax:{
            type:Boolean,
            required:false,
            default:true
        },
        autoHeight:{
            type:Boolean,
            required:false,
            default:false
        },
        closeable:{
            type:Boolean,
            required:false
        },
        title:{
            type:String,
            required:false
        },
        content:{
            type:String,
            required:false
        },
        fix:{
            type:Boolean,
            required:false
        },
        aloneWindow:{
            type:Boolean,
            required:false
        },
        icon:{ // 左上角的图标
            type:String,
            required:false
        },
        getPoint:{
            type:Function,
            required:false
        }
    },
    data(){
        return{            
            zIndex:0,
            sizeStatus:2, // 1：隐藏；2：中屏；3：全屏

            fixed:false
        }
    },
    computed:{
        moveHand(){
            return this.drag ? '.header' : false
        },
        // contentHeightClass(){
        //     return {
        //         hasHeader: !!(this.title || this.closeable)
        //     }
        // },
        classs(){
            return {
                max: this.sizeStatus === 3,
                fixed: this.fixed,
                shade: this.shade
            }
        }
    },
    watch:{
        visible:{
            handler(newValue){
                if(newValue) {
                    this.toTopmost()
                }
            },
            immediate:true
        }
    },
    created(){
        this._id = Math.random() // 做个标记吧。

        const unwatch = this.$watch('visible',()=>{
            if(this.visible){
                this.$nextTick(()=>{
                    unwatch()
                    this.toMiddle()
                })
            }
        },{immediate:true}) // 第一次打开(显示)，设置位置 居中。
    },
    mounted(){
        appendToBody(this.$el)
    },
    beforeDestroy(){
        if(this.$el.parentNode){
            this.$el.parentNode.removeChild(this.$el)
        }
    }, // 如果VUE未能自动移除它，则在这里手动移除
    methods:{
        _updateVisible(value){
            this.$emit('update:visible',value)
        },
        toTopmost(){
            if(this.zIndex === activeState.zIndex) return this

            this.zIndex = ++activeState.zIndex
            this.$emit('toTopmost')
            return this
        },
        getZIndex(){
            return parseInt(this.$el.style.zIndex || 0)
            // return parseInt(this.$el.getStyle('zIndex') || 0) // 要重绘，耗资源
        },
        aloneShow(){
            this.$emit('aloneShow')
        },
        close(){
            this._updateVisible(false)
            this.$emit('close')
        },
        max(){
            this.sizeStatus = 3
        },
        med(){
            this.sizeStatus = 2
        },
        async min(){
            if(!this.getPoint) {
                this._updateVisible(false)
                return
            }
            this.$el.addClass('effect')
            const transform = await this.getAnchorTransform()
            this.$el.style.transform = transform
            setTimeout(() => {
                this._updateVisible(false)
                this.$el.removeClass('effect')
            }, 200)
        }, // 最小化到“锚点”(隐藏)
        async fadeVisible(){
            if(this.visible){
                if(this.zIndex === activeState.zIndex){
                    this.min()
                }else{
                    this.toTopmost()
                }
            }else{
                this._updateVisible(true)
                this.toTopmost()

                if(!this.getPoint) return
                {
                    this.$el.style.transform = await this.getAnchorTransform(false)                
                    setTimeout(() => {
                        this.$el.addClass('effect')
                        this.$el.style.transform = ``
                        setTimeout(() => {
                            this.$el.removeClass('effect')
                        }, 200)
                    }, 0) // 0,必需的（解决：与display一起设置而导致的问题）
                }
            }
        },  // 自“锚点”还原(显示); min+fadeVisible = 模拟window渐变收放式的窗口显示/隐藏切换
        async getAnchorTransform(toMin = true){
            const endPoint = await this.getPoint()
            const elPoint = this.$el.getBoundingClientRect()
            const transform = `translate(${endPoint.left - (elPoint.right - elPoint.left)*9/10/2 *(toMin ? 1: 10) - parseInt(this.$el.getStyle('left'))}px,${endPoint.top - (elPoint.bottom - elPoint.top)*9/10/2 *(toMin ? 1: 10) - parseInt(this.$el.getStyle('top'))}px) scale(.1, .1)` // 注意：translate与scale调换位置顺序，translate的值会不一样。
            // console.log(transform,this.$el.style.left,this.$el.getStyle('left'),elPoint,endPoint)
            return transform
        }, // 获取 到“锚点”隐藏/自“锚点”显示 的transform
        fastResize(){
            if(!this.max || !this.enableMax) return

            this.sizeStatus = this.sizeStatus === 2 ? 3 : 2
        },
        toMiddle(){
            if(!this.visible) return

            const elRect = this.$el.getBoundingClientRect()
            const y = (csize.h - (elRect.bottom - elRect.top))/2
            const x = (csize.w - (elRect.right - elRect.left))/2
            this.$el.style.top = `${y}px`
            this.$el.style.left = `${x}px`
        } // 设置位置 居中
    }
}
</script>

<style lang="scss" scoped>
.popup{
    position: fixed; 
    // top: 0px; // JS设置了
    // top: 20px;  // 留点空隙吧；JS设置了
    // left: 20px; // JS设置了
    z-index: 0;
    max-height: 100%;
    max-width: 100%;
    // width: calc(100% - 40px);
    // height: calc(100% - 40px); // 留点空隙吧
    &.shade{
        z-index: 10000 !important;
    }
    > .wrap{
        width: 100%;
        height:100%;
        max-height: 100%;
        max-width: 100%;
        padding: 5px;
        background: #fff;
        border: 1px solid #432;
        box-shadow: 0px 1px 2px 0px #432;
        overflow: auto;

        display: flex;
        flex-direction: column;
        > .header{
            height: 30px;
            // line-height: 30px;
            text-align: left;
            cursor: move;

            display: flex;
            align-items: center;
            > .title{
                flex-grow: 1;                
                font-size: 14px;
            }
            > i.fa.icon{
                margin-right: 5px;
            }
            > .iconButtons{
                display: flex;
                align-items: center;
                // justify-items: center;
                // align-self: center;
                > *{
                    width: 28px;
                    height: 20px;
                    line-height: 20px;
                    text-align: center;
                    // font-style: oblique;
                    cursor: pointer;
                    font-size: 16px;
                    &:hover{
                        border-radius: 2px;
                        background: #432;
                        color: #fff;
                    }
                }
                > .tack{
                    color: #bbb;
                }
                > .alone,
                > .tack{
                    font-size:14px;
                }
                > .min,
                > .close{
                    font-weight: bold;
                }
                > .min{
                    font-size:15px;
                    line-height: 19px;
                }
                > .max,
                > .med{
                    > i{                     
                        display: inline-block;
                        width: 14px;
                        height: 11px;
                        background: #fff;
                        border: 1px solid #000;
                        border-radius: 2px;
                    }
                }
                > .med{
                    > i{
                        border-top: 3px solid #333;
                    }
                    &:hover{
                        > i{
                            border-top: 3px solid #987;
                        }
                    }
                }
                > .max{
                    position: relative;
                    > i{                      
                        position:absolute;
                    }
                    > i:first-child{
                        top: 4px;
                        left: 9px;
                    }
                    > i:last-child{
                        top: 6px;
                        left: 6px;
                        border-top: 3px solid #333;
                    }
                }
            }
        }
        > .content{
            flex-grow: 1;
            min-width: 80px;
            height: 100%;
            max-height: 100%;    
            overflow: auto;
            background: #fff;
            // &.hasHeader{
            //     height: calc(100% - 30px);
            //     max-height: calc(100% - 30px);
            // }
        }
    }
    > .shade{
        position: fixed;
        z-index: -1;
        left: 0px;
        top: 0px;
        right: 0px;
        bottom: 0px;
        background: #000;
        opacity: 0;
        &:active + .wrap{
            animation: shake 100ms linear;
        }
    }
}
.popup.max{
    top: 0px !important;
    left: 0px !important;
    right: 0px !important;
    bottom: 0px !important;
    height: auto !important;
    width: auto !important;
}
.popup.fixed{
    z-index: 1000 !important;
    > .wrap > .header > .iconButtons > .tack{
        color: #000;
        &:hover{
            color: #fff;
        }
    }
}
.popup.effect{
    transition: transform 200ms,left 200ms,top 200ms;
}
.popup.effect2{
    transition: left 100ms,top 100ms,width 100ms,height 100ms;
}
</style>