import { Color } from '@/utility/color'

const getColorStyle = function(hex){
    if(hex){
        const rgb = Color.hexToRgb(hex)
        let color = {
            r: 255 - rgb.r,
            g: 255 - rgb.g,
            b: 255 - rgb.b
        }
        // color = {
        //     r: color.r > 50 && color.r < 200 ? (color.r < 127 ? 0 : 255) : color.r,
        //     g: color.g > 50 && color.g < 200 ? (color.g < 127 ? 0 : 255) : color.g,
        //     b: color.b > 50 && color.b < 200 ? (color.b < 127 ? 0 : 255) : color.b
        // }
        color = {
            r: color.r < 127 ? 0 : 255,
            g: color.g < 127 ? 0 : 255,
            b: color.b < 127 ? 0 : 255
        }
        return {
            background: hex,
            color: `rgb(${color.r},${color.g},${color.b})`,
        }
    }
    return undefined
}

const resizeReportPopup = function($popup,csize,{w,c,h2 = 0},minWidth = 840){ // 840是设计页面的最小 宽度
    const size = {w:0,h:0}
    const xy = {x:0,y:0}
    {           
        const ch = $popup.clientHeight - h2 // - (38 * c2)
        size.h = Math.min(ch + (38 * c),csize.h - 40)
        size.w = Math.max(Math.min(w + 12,csize.w - 40),minWidth)  // 12是弹窗的padding+border
        xy.y = (csize.h - size.h)/2
        xy.x = (csize.w - size.w)/2

        $popup.style.height = `${ch}px`
    }
    // if($popup.__setTimeoutKey) clearTimeout($popup.__setTimeoutKey)
    $popup.addClass('effect2')
    {
        const styles = Object.fromEntries($popup.style.cssText.split(';').filter(t=>t).map(t=>t.split(':')))
        styles.opacity = 1
        styles.height = `${size.h}px`
        styles.width = `${size.w}px`
        styles.top = `${xy.y}px`
        styles.left = `${xy.x}px`
        $popup.style.cssText = Object.entries(styles).map(t=>t.join(':')).join(';')
    }
    $popup.__setTimeoutKey = setTimeout(() => {
        $popup.removeClass('effect2')
    }, 200)
    // popup.toMiddle()
} // 报表list数据第一次加载完成后，重设弹窗的大小。

export{
    getColorStyle,
    resizeReportPopup
}