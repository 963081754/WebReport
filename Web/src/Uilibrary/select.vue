<template>
    <span class="r-select">
        <input ref="input1" class="toff" :value="texts" @click.stop="switchVisible" readonly :placeholder="placeholder">
        <i v-if="visibleClear" class="clear" @click.stop="clear">✗</i>
        <i :class="`fa fa-angle-${dropdownShowed?'up':'down'} dirIcon`" />
        <ul ref="dropdown" class="dropdown" :class="{dropdownShowed,parentSelectable}">
            <slot></slot>
        </ul>        
    </span>
</template>

<script>
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

export default {
    provide: function(){
        return {
            addOption:(child)=>{
                if(!child.disabled)
                {
                    const oldItem = this.items.find(t=>t.value === child.itemData.value)
                    if(oldItem){
                        this.items.splice(this.items.indexOf(oldItem),1)
                    }
                    this.items.push(child.itemData)
                }
            }, // 加入 option绑定的数据
            removeOption:(child)=>{
                const i = this.items.indexOf(child.itemData)
                if(i !== -1){
                    this.items.splice(i,1)
                }
            },  // 移掉 option绑定的数据
            choose:this.onChoose,
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
        parentSelectable:{
            type:Boolean,
            required:false,
            default:false
        }, // 是否允许选择父节点
        placeholder:{
            type:String,
            required:false
        }
        // alignRight:{
        //     type:Boolean,
        //     required:false
        // }
    },    
    data(){
        return{
            dropdownShowed:false,
            items:[]
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
    computed:{
        texts(){
            if(this.multiple){
                return this.items.filter(item=>this.selectedValue.includes(item.value)).map(t=>t.text).join(',')
            }else{
                const item = this.items.find(item=>this.selectedValue === item.value)
                if(item){
                    return item.text
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
    created(){
        verifyPropDataType.call(this)
    },
    methods:{       
        switchVisible(){
            this.dropdownShowed = !this.dropdownShowed
        },
        onChoose({item,hasChild}){
            if(hasChild && !this.parentSelectable) return

            if(this.multiple){
                const index = this.selectedValue.findIndex(value=>value === item.value)
                if(index === -1){
                    this.selectedValue.push(item.value)
                }else{
                    this.selectedValue.splice(index,1)
                }
            }else{
                if(this.selectedValue !== item.value){
                    this.$emit('change',item.value)
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
        }
    }
}
</script>

<style lang="scss" scoped>
// .alignRight{
//     text-align: right;
// }
</style>
