<template>
    <span class="r-select" :class="{loading}">
        <input v-if="!autoWidth" ref="input1" class="toff" :value="texts" @click.stop="switchVisible" readonly :placeholder="placeholder">
        <div v-else ref="input1" class="input toff" @click.stop="switchVisible">
            <template v-if="texts">{{texts}}</template>
            <label v-else-if="placeholder">{{placeholder}}</label>
        </div>
        <i v-if="visibleClear" class="clear" @click.stop="clear">✗</i>
        <i :class="`fa fa-angle-${dropdownShowed?'up':'down'} ${angleSite && 'left'} dirIcon`" />
        <!-- <span class="width">{{texts}}</span> -->
        <ul ref="dropdown" class="dropdown" :class="{dropdownShowed}">
            <li class="header">
                <slot name="header"></slot>
            </li>
            
            <comboboxItem v-for="item in items" :item="item" @choose="onChoose" :vField="vField" :tField="tField" :key="item[vField]">
                <template v-slot:default="{data}">
                    <slot v-bind:data="data">{{getItemTxt(data)}}</slot>
                </template>
            </comboboxItem>
        </ul>
        <span class="loading" v-if="loading"><i class="fa fa-spinner fa-spin"/></span>
    </span>
</template>

<script>
import comboboxItem from './combobox.item.vue'
// const timer = Symbol()
const rect1 = Symbol()
const event = Symbol()
const verifyPropDataType = function(){
    this.$watch(function(){
        return {selectedValue:this.selectedValue,multiple:this.multiple}
    },function(val){
        if(val.multiple && !(val.selectedValue instanceof Array)){
            throw Error('multiple=true时，绑定的值 必须是Array类型')
        }
    },{immediate:true})
}
const  hideDropdownOfGlobalMonitor = function(e){
    if(this.$el.isParentOrSelf(e.target)) return
    this.dropdownShowed = false
} // 这个函数只监听外部的mousedown；如果mousedown的是自己，就交由onChoose处理。
const _setDropdownPlace = function(){
    const refs = this.$refs
    const style = refs.dropdown.style
    const rect = refs.input1.getBoundingClientRect()
    if(!this[rect1]) this[rect1] = {}    

    // if(rect.bottom !== this[rect1].bottom){
        style.top = `${rect.bottom}px`
    // }
    // if(rect.left !== this[rect1].left){
        style.left = `${rect.left}px`
    // }
    // if(rect.left !== this[rect1].left || rect.right !== this[rect1].right){
        style.minWidth = `${rect.right - rect.left}px`
    // }

    const selfRect = refs.dropdown.getBoundingClientRect()
    if(selfRect.bottom || selfRect.top){
        const maxHeight = document.body.clientHeight
        if(selfRect.bottom > maxHeight){
            style.top = `${Math.max(0,rect.bottom - (selfRect.bottom - maxHeight) - 3)}px`
            // console.log(rect.bottom - (selfRect.bottom - maxHeight))
        }
    }
    this[rect1] = rect
}
const setDropdownPlace = function(){
    if(!this[event]) this[event] = hideDropdownOfGlobalMonitor.bind(this)

    if(this.dropdownShowed){
        this.$nextTick(_setDropdownPlace.bind(this))
        document.addEventListener('mousedown',this[event],true)
        {
            // _setDropdownPlace.call(this)
            // this[timer] = setInterval(() => {
            //    _setDropdownPlace.call(this)
            // }, 0)
        }
    }else{
        document.removeEventListener('mousedown',this[event],true)
        // clearInterval(this[timer])
    }
}  // 设置 下拉框 的位置、minWidth
//parentSelectable

export default {
    components:{ comboboxItem },
    provide: function(){
        return {
            selectedValue:()=>this.selectedValue
        }
    },
    model: {
        prop: 'selectedValue',
        event: 'change'
    },
    props: {
        selectedValue:{
            // type:Boolean,
            required:false
        },
        multiple:{
            type:Boolean,
            required:false,
            default:false
        },
        nullable:{
            type:Boolean,
            required:false,
            default:true
        },
        placeholder:{
            type:String,
            required:false
        },
        items:{
            type:Array, // [{value,text,disabled,children}]
            required:true
        },
        vField:{
            type:String,
            required:false,
            default:'value'
        },
        tField:{
            type:[String,Function],
            required:false,
            default:'text'
        },
        angleSite:{
            type:Boolean,
            required:false
        },
        autoWidth:{
            type:Boolean,
            required:false
        },
        loading:{
            type:Boolean,
            required:false
        }
    },    
    data(){
        return{
            dropdownShowed:false
        }
    },
    computed:{
        list(){
            return this.items.flatTree()
        },
        texts(){
            if(this.multiple){
                return this.list.filter(item=>this.selectedValue.includes(item[this.vField])).map(t=>this.getItemTxt(t)).join(',')
            }else{
                const item = this.list.find(item=>this.selectedValue === item[this.vField])
                if(item){
                    return this.getItemTxt(item)
                }else{
                    return null
                }
            }
        },
        visibleClear(){
            if(!this.nullable) return false
            return this.multiple ? this.selectedValue.length>0 : (this.selectedValue!==null && this.selectedValue!==undefined)
        }
    },
    watch:{
        dropdownShowed:{
            handler(){
                setDropdownPlace.call(this)
            },
            immediate:true
        }
    },
    created(){
        verifyPropDataType.call(this)
    },
    methods:{
        switchVisible(value){
            this.dropdownShowed = (value !== undefined) ? !!value : !this.dropdownShowed
        },
        onChoose(item){
            if(this.multiple){
                const index = this.selectedValue.findIndex(value=>value === item[this.vField])
                if(index === -1){
                    this.selectedValue.push(item[this.vField])
                }else{
                    this.selectedValue.splice(index,1)
                }
            }else{
                if(this.selectedValue !== item[this.vField]){
                    this.$emit('change',item[this.vField])
                }else{
                    // this.$emit('change',null)
                }
            }

            if(!this.multiple) this.dropdownShowed = false
        },
        clear(){
            if(this.multiple){
                while(this.selectedValue.length>0){
                    this.selectedValue.pop()
                }
            }else{
                this.$emit('change',null)
                this.dropdownShowed = false
            }
        },
        getItemTxt(item){
            return typeof(this.tField) === 'function' ? this.tField(item) : item[this.tField]
        }
    }
}
</script>

<style lang="scss" scoped>
</style>
