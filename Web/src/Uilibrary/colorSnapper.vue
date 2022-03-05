<template>
    <div class="colorSnapper">
        <ul class="fasts">
            <li v-for="c in fasts" :key="c" :style="{background:c}" @click.stop="fastSelect(c)"></li>
        </ul>
        <div class="colorBox">
            <div ref="colorPanel1" class="colorPanel">
                <div :style="{background:panelHex}"></div><div></div><div></div>
                <label ref="dot1"></label>
            </div>
            <div ref="colorBar1" class="colorBar">
                <label ref="dot2"></label>
            </div>
            <div class="textbox">
                <div class="show" :style="{background:hex}"></div>
                <div class="hexMode" v-if="mode === 1">
                    <input :value="hex.toUpperCase()" readonly @focus="$event.target.select()">
                    <div class="modeName">HEX</div>
                </div>
                <div class="rgbMode" v-else>
                    <div>
                        <span>{{rgb.r}}</span>
                        <span>{{rgb.g}}</span>
                        <span>{{rgb.b}}</span>
                    </div>
                    <div class="modeName">
                        <span>R</span>
                        <span>G</span>
                        <span>B</span>
                    </div>
                </div>
                <div class="icon" @click.stop="switchMode">
                    <svg viewBox="0 0 24 24" style="width: 24px; height: 24px; border: 1px solid transparent; border-radius: 5px;"><path fill="#333" d="M12,5.83L15.17,9L16.58,7.59L12,3L7.41,7.59L8.83,9L12,5.83Z"></path><path fill="#333" d="M12,18.17L8.83,15L7.42,16.41L12,21L16.59,16.41L15.17,15Z"></path></svg>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { Color } from '@/utility/color'

export default {
    props:{
        value:{
            type:String, // [String,Array]
            rrequired:false,
            // default(){
            //     return '#ff0000'// {r:0,g:120,b:0}  //'#ff8888',
            // },
            validator: function (value) {
                if(typeof(value) === 'string' && (/^#[abcdef0-9]{6}$/i).test(value)){
                    return true
                // }else if(Object.prototype.hasOwnProperty.call(value,'h') && Object.prototype.hasOwnProperty.call(value,'s') && Object.prototype.hasOwnProperty.call(value,'b')){
                //     return true
                // }else if(Object.prototype.hasOwnProperty.call(value,'r') && Object.prototype.hasOwnProperty.call(value,'g') && Object.prototype.hasOwnProperty.call(value,'b')){
                //     return true
                }else{
                    throw Error(`颜色值不正确：${value}。必须是HEX的格式，如：#00000`)
                    // return false
                }
            }
        }
    },
    data(){
        return {
            panelSize:Object.freeze({w:200,h:140}),
            fasts:Object.freeze(['#000000','#FF0000','#00FF00','#0000FF','#FFFF00','#00FFFF','#FF00FF','#888888','#000080','#006400','#008080','#00BFFF','#00FA9A','#48D1CC','#4682B4','#7CFC00','#800000','#FFFFFF','#E6E6FA','#570000','#F0E68C','#7FFFD4','#87CEFA','#ADFF2F','#B8860B','#D87093','#DCDCDC','#DC143C','#FF6347','#FFA500','#FFFACD','#708090','#556B2F','#191970','#454545','#FF7A7A','#E00000','#2E615E','#5930FF','#7AFF83']),                                              
            hsb: {h:0,s:0,b:0},
            mode:1 // 1:hex;2:rgb
        }
    },
    computed:{
        hex(){
            return `#${Color.rgbToHex(this.rgb)}`
        },
        rgb(){
          return Color.hsbToRgb(this.hsb)
        },
        panelHex(){
            return `#${Color.rgbToHex(Color.hsbToRgb({h:this.hsb.h, s: 100, b: 100}))}`
        }
    },
    watch:{
        value:{
            handler(){
                if(!this.value) return
                if(this.value !== this.hex){
                    this.toPlace(this.value)
                }
            },
            immediate:true
        }
    },
    mounted(){
        {
            let firstPoint = {}
            let firstXY = {}

            this.$refs.colorPanel1.moveForPress(({x,y})=>{
                const left = x - firstXY.x + firstPoint.left
                const top  = y - firstXY.y + firstPoint.top
                this.setDot1Place(left,top)
            },({x,y})=>{
                const {x:left,y:top} = this.$refs.dot1.getBoundingClientRect()
                firstPoint = {
                    left:parseInt(this.$refs.dot1.getStyle('left')) + (x - left) -7,
                    top:parseInt(this.$refs.dot1.getStyle('top')) + (y - top) -7
                }
                this.setDot1Place(firstPoint.left,firstPoint.top)
                firstXY = {x,y}
            },null,10,false)

            this.$refs.colorBar1.moveForPress(({x})=>{
                const left = x - firstXY.x + firstPoint.left
                this.setBar1Place(left)
            },({x})=>{
                const {x:left} = this.$refs.dot2.getBoundingClientRect()
                firstPoint = {
                    left:parseInt(this.$refs.dot2.getStyle('left')) + (x - left) - 6
                }
                this.setBar1Place(firstPoint.left)
                firstXY = {x}
            },null,10,false)
        }
    },
    methods:{
        updateValue(){
            this.$emit('update:value',this.hex)
        },
        setDot1Place(left,top){
            left = left < 0 ? 0 : left
            left  = left > this.panelSize.w ? this.panelSize.w : left
            this.$refs.dot1.setStyle({left:`${left}px`})

            top = top < 0 ? 0 : top
            top  = top > this.panelSize.h ? this.panelSize.h : top
            this.$refs.dot1.setStyle({top:`${top}px`})

            this.hsb.s = parseInt(100 * left / this.panelSize.w)
            this.hsb.b = parseInt(100 * (this.panelSize.h - top) / this.panelSize.h)

            this.updateValue()
        },
        setBar1Place(left){
            left = left < 0 ? 0 : left
            left  = left > this.panelSize.w ? this.panelSize.w : left
            
            this.$refs.dot2.setStyle({left:`${left}px`})
            this.hsb.h = parseInt(360 * left / this.panelSize.w) 
            
            this.updateValue()
        },
        fastSelect(hex){
            this.toPlace(hex)
            this.updateValue()
        },
        switchMode(){
            this.mode = this.mode === 1 ? 2 : 1
        },
        toPlace(hex){
            this.hsb = Color.hexToHsb(hex)
            this.$nextTick(()=>{
                this.setBar1Place(this.panelSize.w * this.hsb.h/360)
                this.setDot1Place(this.panelSize.w * this.hsb.s/100, this.panelSize.h - this.panelSize.h * this.hsb.b/100)
            })
        }
    }
}
</script>

<style lang="scss" scoped>
.colorSnapper{    
    float: left;
    // width: 385px;
    display: flex;    
    padding: 10px 10px 5px 5px;
    border: 1px solid #ddd;
    background: #eee;    
    user-select:none;
    -ms-user-select:none;  
    div,input,li{
        border-radius: 2px;
    }
    > .fasts{
        width: 158px;
        display: flex;
        justify-content: space-between;
        flex-wrap: wrap;
        // border: 1px solid #ddd;
        margin-right: 10px;        
        li{
            cursor: pointer;
            // display: inline-block;
            width: 20px;
            height: 20px;
            border: 1px solid #bbb;
            margin: 4px;
            // &.active{
            //     box-shadow: 0px 0px 3px 0px #000;
            // }
        }
    }
    > .colorBox{
        width: 200px;        
        > .colorPanel{
            width: 100%;
            height: 140px;
            position: relative;
            > div{
                width: 100%;
                height: 100%;
                position: absolute;
                top: 0px;
                left: 0px;
            }
            > div:nth-child(1){
                z-index: 1;
                background: #f00;
            }
            > div:nth-child(2){
                z-index: 2;
                background:linear-gradient(to right, #fff, rgba(255,255,255,0));
            }
            > div:nth-child(3){
                z-index: 3;
                background:linear-gradient(to top, #000, rgba(0,0,0,0));
            }
            > label{
                z-index: 5;
                position: absolute;
                top: 0px;
                left: 0px;
                width: 14px;
                height: 14px;
                transform: translate(-7px,-7px);
                border: 1px solid #fff;
                background: #000;
                border-radius: 7px;
            }
        }
        > .colorBar{
            margin: 14px auto;
            height: 10px;
            background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%);
            position: relative;
            > label{
                z-index: 5;
                position: absolute;
                top: -1px;
                left: 0px;
                width: 12px;
                height: 12px;
                transform: translateX(-6px);
                background: #fff;
                border-radius: 6px;
                box-shadow: 0px 1px 3px 1px #336;
            }
        }
        > .textbox{
            display: flex;
            justify-content: space-between;
            margin: 0px 5px;
            > .show{
                width: 23px;
                height: 23px;
                background: #666 0px 0px 2px 0px;
                border: 1px solid #ddd;
            }
            > .hexMode,> .rgbMode{
                width: calc(100% - 60px);
                text-align: center;
                > *{
                    height: 23px;
                    line-height: 23px;
                }
                .modeName{
                    color: #999;
                }
            }
            > .hexMode{
                > input{
                    width:100%;
                    text-align: center;
                    outline: none;
                    background: none;
                    border: 1px solid #ccc;
                }
            }
            > .rgbMode{
                > div{
                    display: flex;
                    justify-content: space-between;
                    > span{
                        width: 35px;
                        border: 1px solid #ccc;
                    }
                }
                > div:nth-child(2) span{
                    border: none;
                }
            }
            > .icon{
                width: 20px;
                cursor: pointer;
            }
        }
    }
}
</style>