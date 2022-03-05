<template>
    <i class="fa fa-lg" :class="classObj" @click="change" aria-hidden="true">
        <label v-if="label">{{label}}</label>
    </i>
</template>
<script>
const icons = [
    {true:'toggle-on',false:'toggle-off'},  // fa-toggle-on 使用http://www.fontawesome.com.cn/ 的字体图标
    {true:'eye',false:'eye-slash'}, // fa-eye
    {true:'lock',false:'unlock'}, // fa-lock
    {true:'check-square',false:'square-o'}, // fa-check-square
    {true:'circle',false:'circle-o'} // fa-circle
]
export default {
    model: {
        prop: 'checked',
        event: 'change'
    },
    props: {
        checked: Boolean,
        iconMode:{
            type:Number,
            required:false,
            default:0 // 0：toggle-on/toggle-off；1：eye/eye-slash；2：lock/unlock；3：check-square/square-o
        },
        reverse:{
            type:Boolean,
            required:false,
            default:false
        },
        label:{
            type:String,
            required:false
        }
    },
    computed:{
        classObj(){
            const icon = icons[this.iconMode]
            const status = !!(this.reverse ? !this.checked : this.checked)
            const result = {}
            result[`fa-${icon[status]}`] = true
            return result
        }
    },
    methods:{
        change(){
            this.$emit('change',!this.checked)
        }
    }
}
</script>
<style lang="scss" scoped>
// i.fa{
//     &::after{
//         width: 16px;
//     }
// }
label{
    cursor: pointer;
    font-size: 13px;
    vertical-align: top;
    margin-left: 5px;
}
</style>