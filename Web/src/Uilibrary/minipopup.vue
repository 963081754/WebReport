<template>
    <div class="minipopup" :class="{hasHead:(title || closeable),shade}" v-show="visible" v-move="'div.head'" v-resize="resizeable"
     :style="{zIndex:zIndex}" @mousedown="toTopmost" @contextmenu.stop>
        <div class="shade" @click.stop="shake" v-if="shade"></div>
        <div class="head" v-if="title || closeable">
            <div v-if="title" class="title">
                <i v-if="icon" :class="`fa fa-${icon}`"/>
                {{title}}
            </div>
            <label v-if="closeable" class="close" @click.stop="close">✕</label>
        </div>
        <div class="content" ref="content" v-onresize="onresize">
            <slot>{{message}}</slot>
        </div>
    </div>
</template>

<script>
let zIndex = 1
// IE 拖拽 还是卡，得"节流"
export default {
    name:'minipopup',
    props:{
        visible:{
            type:Boolean,
            required:true
        },
        closeable:{
            type:Boolean,
            required:false,
            default:true
        },
        resizeable:{
            type:Boolean,
            required:false,
            default:false
        },
        title:{
            type:String,
            required:false,
            default:''
        },
        message:{
            type:String,
            required:false
        },
        shade:{
            type:Boolean,
            required:false
        },
        icon:{
            type:String,
            required:false
        }
    },
    data(){
        return{
            zIndex: ++zIndex
        }
    },
    created(){
        const unwatch = this.$watch('visible',()=>{
            if(this.visible){
                this.$nextTick(()=>{
                    unwatch()
                    this.toMiddle()
                })
            }
        },{immediate:true}) // 第一次打开，设置位置 居中。
    },
    methods:{
        toTopmost(){
            this.zIndex = ++zIndex
        },
        close(){
            this.$emit('update:visible',false)
        },
        onresize(){
            // console.log('minipopup',height)
            const height = this.$refs.content.clientHeight
            if(height > this.$el.clientHeight){
                this.$refs.content.style.height = `${height - (this.$el.scrollHeight - this.$el.clientHeight)}px`
            }
        },
        toMiddle2(){
            if(!this.visible) return

            const docRect = document.documentElement.getBoundingClientRect()
            const elRect = this.$el.getBoundingClientRect()
            const spaceH = (docRect.bottom - (elRect.bottom - elRect.top))/2
            const spaceW = (docRect.right - (elRect.right - elRect.left))/2

            const y = spaceH - elRect.top
            const x = spaceW - elRect.left

            this.$el.style.marginTop = `${y}px`
            this.$el.style.marginLeft = `${x}px`
            // console.log('toMiddle',{spaceH,spaceW,top:elRect.top,left:elRect.left,y,x})
        }, // 设置位置 居中
        toMiddle(){
            if(!this.visible) return

            const docRect = document.documentElement.getBoundingClientRect()
            const elRect = this.$el.getBoundingClientRect()
            const y = (docRect.bottom - (elRect.bottom - elRect.top))/2
            const x = (docRect.right - (elRect.right - elRect.left))/2
            this.$el.style.top = `${y}px`
            this.$el.style.left = `${x}px`
            // console.log('toMiddle',x,y)
        }, // 设置位置 居中
        shake(){
            this.$emit('clickShade')
            
            this.$el.addClass('shake')
            setTimeout(() => {
                this.$el.removeClass('shake')
            }, 100)
        } // 抖动
    }
}
</script>

<style lang="scss" scoped>
.minipopup{
    z-index: 10; 
    min-width: 150px;
    max-width: calc(100% - 20px);
    max-height: calc(100% - 20px);
    padding: 0 5px 5px 5px;
    // background: #effeff;
    background: #fff;
    border: 1px solid #765;
    box-shadow: 2px 2px 2px 0px #432;

    user-select: text;
    
    // transition: top 1s,left 1s;
    &.shade{
        z-index: 10000000000 !important;
    }
    > .head{
        position: relative;
        // display: flex; // 最底兼容IE11
        background: #fff;
        // border-bottom: 1px dotted #accadd;
        white-space: nowrap;
        > .title{
            display: inline-block;
            // flex-grow: 1;
            width: calc(100% - 30px);
            padding: 5px;
            font-size: 1.05em;  
            text-align: left;          
        }
        > .close{
            cursor: pointer;
            // position: absolute;
            // right: 4px;
            // top: 0px;
            padding: 5px 8px;
            font-size: 1.1em;
            // font-style: oblique;
        }
    }
    > .content{
        position: relative; // 不然 遮罩会盖上它。
        width: 100%;
        height:100%;
        overflow: auto;
        // padding: 1px;
        // margin: 1px;
        background: #fff;
        // border: 1px solid #cce;
    }

    > .shade{
        position: fixed;        
        left: 0px;
        right: 0px;
        top: 0px;
        bottom: 0px;
        // background: #fff;
        // opacity: 0;
    }
    &.shake{
        animation: shake 100ms linear;
    }
}
.minipopup.hasHead{
    > .content{
        height:calc(100% - 28px);
    }
}
</style>