<template>
    <li :optgroup="children.length>0" :selected="selected" :disabled="disabled">        
        <template v-if="children.length>0">
            <div @click.stop="onChoose">
                <slot name="optgroup" v-bind:item="itemData">{{text}}</slot>
            </div>
            <ul>
                <r-option v-for="child in children" :children="child.children" :value="child.id" :text="child.name" :key="child.id">
                    <template v-slot:default="{item}">
                        <slot v-bind:item="item"></slot>
                    </template>
                    <template v-slot:optgroup="{item}">
                        <slot name="optgroup" v-bind:item="item"></slot>
                    </template>
                </r-option>
            </ul>
        </template>
        <template v-else>
            <div @click.stop="onChoose">
                <slot name="default" v-bind:item="itemData">{{text}}</slot>
            </div>            
        </template>
    </li>
</template>

<script>
export default {
    inject:['choose','selectedValue','addOption','removeOption'],
    props:{
        value:{
            // type:Object,
            required:true
        },
        text:{
            // type:[String,Number],
            required:true
        },        
        disabled:{
            type:Boolean,
            required:false,
            default:false
        },
        children:{
            type:Array,
            required:false,
            default:()=>([])
        }
    },
    computed:{
        itemData(){
            return {value:this.value,text:this.text}
        },
        selected(){
            if(this.disabled) return false
            
            const selectedValue = this.selectedValue()
            if(selectedValue instanceof Array){
                return selectedValue.includes(this.value)
            }else{
                return selectedValue === this.value
            }
        }
    },
    watch:{
        itemData:{
            handler(){
                this.addOption(this)
            },
            immediate:true
        }
    },
    // mounted(){
    //     this.addOption(this)
    // },
    beforeDestroy(){
        this.removeOption(this)
    },
    methods:{
        onChoose(){
            if(this.disabled) return
            this.choose({item:this.itemData,hasChild:this.children.length>0})
        }
    }
}
</script>

<style lang="scss" scoped></style>