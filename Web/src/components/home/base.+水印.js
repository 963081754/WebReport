import Vue from 'vue'
import { Manager } from '@/models'
import { resizeReportPopup } from '@/components/widgets'
import { base64 } from '@/utility/utility'

let setWatermark_content = null
let setWatermark_alone = true
const buildStyle = function(left,top,content){
    if(content) setWatermark_content = content
    content = setWatermark_content || content
    // debugger
    // const str = base64.encode(base64.encode(base64.encode(base64.encode(base64.encode(base64.encode('通用Web表格报表试用版'))))))
    // console.log(str)
    const str = 'VmtjeE5HTXhTa2RpUmxaWFZrVmFWMVJYY0hOWFJsSllaVWRHYWxKVVZubGFSVlp2WVZkV2MxZHFVbFpYU0VKMVZGWmtTbVZzU25WVWF6bG9UVEZLU2xkWE5YZFpWbEpHWXpOb1dGWkZXbEJXYlhNeFRXeFNjMVZzVG10U2F6VlRWVVpSZDFCUlBUMD0='
    return `
    content: '${content || base64.decode(base64.decode(base64.decode(base64.decode(base64.decode(base64.decode(str))))))}' !important;
    position: fixed !important;
    top: ${top} !important;
    left: ${left} !important;
    z-index: 100000000 !important;
    padding: 5px !important;
    text-align: center !important;
    font-size: 3em !important;
    opacity: .15 !important;
    pointer-events: none !important;
    transform: rotate(-30deg) !important;
    // font-style: oblique !important;
    color: #212 !important;
    text-shadow: #fff 1px 1px 1px !important;
    user-select: none !important;
    height: auto !important;
    width: auto !important;
    max-width: 100% !important;
    max-height: 100% !important;
    background: none !important;    
    visibility: visible !important;`
}

const setWatermark = Vue.prototype.__inheritAttrs = function(content){
    let styleEl = document.head.querySelector('style#style1')
    if(!styleEl){
        styleEl = document.createElement("style")
        styleEl.id = 'style1'
        document.getElementsByTagName('head')[0].appendChild(styleEl)
    }
    let styles = ''
    {
        // const str = base64.encode(base64.encode(base64.encode(base64.encode('Copyright 2021-2023 开发者 版权所有 热线：17701142185 粤ICP备2021091428号'))))
        const str = 'VlZSSk5XUXlWbGxUYmtKaFRXMW5kMU5WVWtwa01ERnhVbGhTVG1GclJqVlVXR3hGWWtoYVNsSkhlSEZPVldoMldqQnNWbHA2VlRCaVZXc3hZMFJLUlU1WE9YUlJWRlozWlZWd1NsUXlWa1ZqYlZac1RtNVpja3Q2YUhSaGExVjZWRzV3UW1WRk1WVlZXR3hPVmtkamVGTlZPV3hsV0VKR1lrVlNWbFF4WkhKaFNIQktaREF4Y1ZKWVpGQldSVlYzVkZkd2NXSkhiek5aZWpBOQ=='
        // console.log(str)
        styles += `body::after{
        content: '${base64.decode(base64.decode(base64.decode(base64.decode(str))))}' !important;
        position: fixed !important;
        top: 0px !important;
        left: 0px !important;
        z-index: 100000000 !important;
        width: 100% !important;
        padding: 2px !important;
        text-align: center !important;
        font-size: 1em !important;
        opacity: 1 !important;
        pointer-events: none !important;
        transform: rotate(0deg) !important;
        user-select: none !important;
        color: #fff !important;
        text-shadow: none !important;
        visibility: visible !important;
        height: auto !important;
        max-width: 100% !important;
        max-height: 100% !important;
        background: none !important;}`  // copyright
        // 设置visibility height max-width max-height 是为了防止被覆盖。
    } // "copyright"水印
    // styles = ''
    {
        styles += `body > #app::after{${buildStyle('3%','30%',content)}}
        body > #app > .admin::after,body > #app > .home::after{${buildStyle('40%','50%',content)}}
        body > #app > .admin > .menu::after,body > #app > .home > .catalog::after{${buildStyle('70%','70%',content)}}`
        if(setWatermark_alone){
            styles += `body > #app > .designer::after{${buildStyle('40%','50%',content)}}
            body > #app > .designer > .headbar::after{${buildStyle('70%','70%',content)}}
            body > #app > .designer + .businessInfos{display: none;}
            body::after{color: #333 !important;text-shadow: none !important;}`
        }
        styleEl.innerHTML = styles
    } // "试用版"水印
}
setInterval(setWatermark, 1000*60) // 即使“用户”修改了这个style element，60秒后自动还原回来（强制，呵呵）。

const popupManage = Vue.extend({
    data(){
        return{
            popups: [],
            active: undefined
        }
    },
    mounted(){
        {
            setWatermark_alone = false
            setWatermark()
        }
    }, // copyright+水印+过期时间
    methods:{
        openPopup(_item){
            let item = this.popups.find(t=>t.id === _item.id)
            if(item){
                // item.visible = true
                this.switchPopupVisible(item)
                // this.$refs.popups[this.popups.indexOf(item)].toTopmost()
            }else{
                if(_item.type !== 'm'){
                    _item.visible = true
                }
                this.popups.push(_item)
            }
        },
        closeOne(item){
            this.popups.splice(this.popups.indexOf(item),1)
        },
        closeAll(){
            this.popups = []
            this.active = undefined
        },
        switchPopupVisible(item){
            const index = this.popups.indexOf(item)
            if(this.active === item){
                this.$refs.popups[index].min()
            }else{
                this.$refs.popups[index].fadeVisible()
            }
        },
        onToTopmost(item){
            const index = this.popups.indexOf(this.active)
            if(index !== -1 && item.visible){
                const $popup = this.$refs.popups[index]
                if($popup && $popup.fixed){
                    return
                }
            } // 如果上一个是“固定的”，active便不变。
            this.active = item
        },
        lookActive(){
            this.$nextTick(()=>{
                if(this.popups.length === 0){
                    this.active = undefined
                    return
                }
                const indexs = this.$refs.popups.map(t=>({
                    zIndex:t.getZIndex(),
                    id:t._id,
                    visible:t.visible
                }))
                const visibleIndexs = indexs.filter(t=>t.visible)
                if(visibleIndexs.length === 0){
                    this.active = undefined
                }else{
                    const maxIndex = visibleIndexs.reduce((a,b)=>(a.zIndex > b.zIndex ? a : b))
                    this.active = this.popups[indexs.indexOf(maxIndex)]
                }
            })
        }, // 找出 当前 最前的 窗口
        getTaskAnchorPoint(id){
            return ()=>{
                return this.$refs.taskbar1.getPoint(id)
            }
        } // 给 弹窗 找到 任务栏的“锚点”
    }
})

const contextmenu = ()=> import('@/components/report.vue/contextmenu.vue')
const common = popupManage.extend({
    components:{ contextmenu },
    inject: ['getters','reportApi','userApi'],
    data(){
        return {
            contextmenuAttrs:{}, // { visible,operations,site:{x, y}}
        }
    },
    methods:{
        onFrameLoaed(){
            // this.onReportPageLoaded(item,{w,c})
        },
        onReportPageLoaded(item,{w,c,h2 = 0}){
            const popup = this.$refs.popups[this.popups.indexOf(item)]
            const $popup = popup.$el

            const csize = this.getters.cSize
            resizeReportPopup($popup,csize,{w,c,h2},this._isFrontDesk ? 600 : undefined)
        }, // 报表list数据第一次加载完成后，重设弹窗的大小。
        async _openLinkReport({id,link,row,linkReport,title}){
            let itemId = `link_${id}_${link.column}_${link.target}`  // 共享窗口的标识；link_报表ID_链接列_链接目标报表ID
            // const params = (link.params || []).map(t=>({name:t.name,value:{v:row[t.value],way:equalWay},shape:'v'}))
            const params = (link.params || []).map(t=>({name:t.name,value:row[t.value]}))
            const paramObj = {
                isCover:link.isCover,
                params
            }
            if(!link.isOne && params.length > 0){
                itemId = `${itemId}_${params.map(t=>`${t.name}:${t.value}`).join('_')}`
            }  // 不共享窗口的标识
            let item = this.popups.find(t=>t.id === itemId)
            if(!item){
                const report = linkReport
                item = new Manager({
                    type:'r', 
                    id:itemId,
                    name:title || report.name,
                    icon:report.star || 'file',
                    visible:true,
                    model:{
                        popupAttrs:{
                            linkReport:true
                        },
                        attr:{
                            id:report.id,
                            params:paramObj,
                            isMini:link.isMini
                        },
                        event:{
                            update:this.onReportUpdated,
                            openLinkReport:this.openLinkReport
                        }
                    }
                })
            }else{
                item.name = title || item.name
                const index = this.popups.indexOf(item)
                this.$refs.popups[index].$children[0].loadPaging(paramObj)
            }
            this.openPopup(item)
        },
        onReportUpdated(){
            throw Error('由子类实现')
        }, // 接口，由子类实现
        openLinkReport(){
            throw Error('由子类实现')
        }, // 接口，由子类实现
        print(item,printing){
            const index = this.popups.indexOf(item)
            printing(this.$refs.popups[index].$el)
        }, // 报表打印(限于CSS的编写，子弹窗 不能打印)
        openContextmenu({site,operations}){
            this.contextmenuAttrs = {
                visible:true,
                operations,
                site
            }
        }
    }
})

export default common