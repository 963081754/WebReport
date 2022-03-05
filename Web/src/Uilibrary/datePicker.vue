<template>
    <span class="r-datepicker">
        <i class="fa fa-calendar-o" @click.stop="switchVisible"/>
        <input v-model.trim.lazy="formatValue" @focus.stop="switchVisible"/>
    </span>
</template>

<script>
import Vue from 'vue'
import datePickerPanelJson from '@/Uilibrary/datePickerPanel.vue'
// const timer = Symbol()
const event = Symbol()
let panel = null
let pickerCount = 0
const mountPanel = function(){
    if(!panel){
        const vueObj = Vue.extend(datePickerPanelJson)
        // const props = { propsData: { value: new Date(), defaultShortcuts:false }}
        panel = new vueObj({}).$mount()
            panel.$el.addClass('fixed').addClass('hide')
            // panel.$el.addClass('top').addClass('right')
            document.body.appendChild(panel.$el)
    }
}
const destroyedPanel = function(){
    if(panel){
        panel.destroy = true
        panel = null
    }
}
const  hidePanelOfGlobalMonitor = function(e){
    if(panel.$el.isParentOrSelf(e.target)) return
    if(this.$el.isParentOrSelf(e.target)) return
    
    this.visible = false
} // 这个函数只监听外部的mousedown；如果mousedown的是自己，就交由onChoose处理
const _setPanelPlace = function(){
    const style = panel.$el.style
    style.bottom = style.top = style.left = style.right = 'unset'

    const anchor = this.$el.getBoundingClientRect()
    const place = panel.$el.getBoundingClientRect() 
    const maxSize = {
        h: document.body.clientHeight,
        w: document.body.clientWidth
    }    
    const size = {
        h:place.bottom - place.top + 11,  // 11px 是那个 角 
        w:place.right - place.left
    }
    
    if(size.h <= (maxSize.h - anchor.bottom)){
        style.top = `${anchor.bottom}px`       
        panel.$el.addClass('top').removeClass('bottom') 
    }else if(size.h <= anchor.top){
        style.top = `${anchor.top - size.h}px` 
        panel.$el.addClass('bottom').removeClass('top') 
    }else if(size.h > maxSize.h){
        style.top = '0px'
        panel.$el.removeClass('top').removeClass('bottom') 
    }else{        
        style.bottom = '0px'
        panel.$el.removeClass('top').removeClass('bottom') 
    } // 设置 竖向 位置

    if(size.w <= (maxSize.w - anchor.left)){
        style.left = `${Math.max(0,anchor.left)}px`  
        panel.$el.addClass('left').removeClass('right')      
    }else if(size.w <= anchor.right){
        style.right = `${Math.max(0,maxSize.w - anchor.right)}px` 
        panel.$el.addClass('right').removeClass('left')  
    }else if(size.w > maxSize.w){
        style.left = '0px'
        panel.$el.removeClass('right').removeClass('left')  
    }else{
        style.right = '0px'
        panel.$el.removeClass('right').removeClass('left')  
    } // 设置 水平 位置
} // 位置设置完美！！！！
const setPanelPlace = function(){
    if(!this[event]) this[event] = hidePanelOfGlobalMonitor.bind(this)

    if(this.visible){
    {
        document.removeEventListener('mousedown',this[event],true)   // 这才安全，addEventListener前先 removeEventListener
        document.addEventListener('mousedown',this[event],true)
        panel.$el.removeClass('hide')
        _setPanelPlace.call(this)
        // clearInterval(this[timer]) // 这才安全，setInterval前先 clearInterval
        // this[timer] = setInterval(() => {
        //     _setPanelPlace.call(this)
        // }, 0)
    }
    }else{
        document.removeEventListener('mousedown',this[event],true)        
        // clearInterval(this[timer])
        panel.$el.addClass('hide')
    }
}  // 设置 下拉框 的位置

const toDate = function(value){
    return value instanceof Date ? value : new Date(value || '') // new Date(null)会=1970-1-1
}

export default {
    model:{
        prop: 'value',
        event: 'change'
    },
    props:{
        value:{
            type:[Date,String,Number],
            required:false,
            // default:function(){
            //     return new Date()
            // },
            validator: function (value) {
                const dt = value instanceof Date ? value : new Date(value)
                return dt.isValid()
            }
        },
        visiblePanel:{
            type:Boolean,
            required:false
        },
        defaultShortcuts:{
            type:Boolean,
            required:false
        },
        shortcuts:{
            type:Array,
            required:false
        }
    },
    data(){
        return {
            visible:false,
            datetime:new Date()
        }
    },
    computed:{
        formatValue:{
            get(){
                const dt = toDate(this.value)
                if(dt.isValid()){
                    return dt.toLocaleDateString().replace(/\//img,'-')
                }else{
                    return null
                }
            },
            set(val){
                if(val===''){
                    this.$emit('change',null)
                    return
                }
                const newVal = new Date(val)
                if(newVal.isValid()){
                    this.$emit('change',newVal)
                }else{  // 输入的值不合法，就用回原来的值
                    this.$emit('change',this.value)
                }
            }
        }
    },
    watch:{
        visiblePanel(val){
            this.visible = val
        },
        value:{
            handler:function(){
                const dt = toDate(this.value)
                if(dt.isValid()){
                    return this.datetime = new Date(dt)
                }
            },
            immediate:true
        }
    },
    beforeCreate(){
        mountPanel()
        pickerCount++
    },
    created(){        
        this.$watch(function(){
            return {
                visible:this.visible,
                datetime:this.datetime,
                defaultShortcuts:this.defaultShortcuts,
                shortcuts:this.shortcuts
                }
        },function(val,oldVal){  
            if(val.visible !== oldVal.visible){   // 因为监听多个值，这里会重复执行；下面一样。
                setPanelPlace.call(this)
            }
            if(this.visible){
                if(panel.value !== this.datetime){
                    panel.value = this.datetime
                }
                if(panel.defaultShortcuts !== this.defaultShortcuts){
                    panel.defaultShortcuts = this.defaultShortcuts
                }
                if(panel.shortcuts !== this.shortcuts){
                    panel.shortcuts = this.shortcuts
                }
                panel.$off('change')
                panel.$on('change',(newValue)=>{
                    this.$emit('change',newValue)
                    this.visible = false
                })
            }else{
                if(panel.value === this.datetime){
                    panel.value = new Date()
                }
                if(panel.defaultShortcuts === this.defaultShortcuts){
                    panel.defaultShortcuts = false
                }
                if(panel.shortcuts === this.shortcuts){
                    panel.shortcuts = null
                }
                panel.$off('change')
            }
        })
    },
    destroyed(){
        pickerCount--
        if(pickerCount <= 0){
            destroyedPanel()
        }
    },
    methods:{
        switchVisible(){
            this.visible = !this.visible
        }
    }
}
</script>

<style lang="scss" scoped></style>