<template>
    <li :disabled="item.disabled" :selected="selected">        
        <div @click.stop="onChoose(item)">
            <slot v-bind:data="item">{{getItemTxt(item)}}</slot>
        </div>
        <ul v-if="item.children && item.children.length">
            <comboboxItem v-for="child in item.children" :item="child" @choose="onChoose" :vField="vField" :tField="tField" :key="child[vField]">
                <template v-slot:default="{data}">
                    <slot v-bind:data="data">{{getItemTxt(data)}}</slot>
                </template>
            </comboboxItem>
        </ul>
    </li>
</template>

<script>
export default {
    name:'comboboxItem',
    inject:['selectedValue'],
    props:{
        item:{
            type:Object,
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
        }
    },
    computed:{
        selected(){
            if(this.item.disabled) return false
            
            const selectedValue = this.selectedValue()
            if(selectedValue instanceof Array){
                return selectedValue.includes(this.item[this.vField])
            }else{
                return selectedValue === this.item[this.vField]
            }
        }
    },
    methods:{
        onChoose(item){
            if(item.disabled) return
            this.$emit('choose',item)
        },
        getItemTxt(item){
            return typeof(this.tField) === 'function' ? this.tField(item) : item[this.tField]
        }
    }
}
</script>