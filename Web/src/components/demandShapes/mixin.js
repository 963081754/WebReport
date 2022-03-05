import {compareChar} from '@/models'
// const errorSym = Symbol()

const mixin = {
    props:{
        value:{
            type:Object,
            required:true
        },
        nullable:{
            type:Boolean,
            required:false,
            default:true
        }
    }
}

const mixinShape = {
    props:{
        shape:{
            type:String,
            required:false
        },
        options:{
            type:Array,
            required:false
        }
    },
    computed:{
        compareChars(){
            const list = {...compareChar}
            delete list.null
            return Object.keys(list)
        }
    },
    created(){
        if(!this.value.way){
            this.$set(this.value,'way',this.way)
            // this.value.way = this.way // 这BUG找的我好痛苦
        }
    }
}

export {
    mixin,
    mixinShape
}