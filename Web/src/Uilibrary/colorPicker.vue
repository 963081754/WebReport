<template>
    <colorSnapper class="colorPicker" :value.sync="colorValue" v-show="visible" :style="position" @click.native.stop />
</template>

<script>
import colorSnapper from '@/Uilibrary/colorSnapper.vue'
const appendToBody = function(el){
    const body = document.querySelector("body")
    if (body.append) {
        body.append(el)
    } else {
        body.appendChild(el)
    }
}

export default {
    components:{ colorSnapper },
    props:{
        visible:{
            type:Boolean,
            rrequired:true
        },
        value:{
            type:[String,Object],
            rrequired:false
        },
        site:{
            type:Element,
            rrequired:false
        }
    },
    computed:{
        colorValue:{
            get(){
                return this.value
            },
            set(value){
                this.$emit('update:value',value)
            }
        },
        position(){
            if(!this.site) return null
            const rect = this.site.getBoundingClientRect()
            return {
                left: `${rect.x}px`,
                top: `${rect.y + (rect.bottom - rect.top)}px`
            }
        }
    },
    watch:{
        visible:{
            handler(){
                if(this.visible){
                    document.addEventListener('click',this.close,false)
                }else{
                    document.removeEventListener('click',this.close,false)
                }
            },
            immediate:true
        }
    },
    mounted(){
        appendToBody(this.$el)
    },
    beforeDestroy(){
        document.removeEventListener('click',this.close,false)
        if(this.$el.parentNode){
            this.$el.parentNode.removeChild(this.$el)
        }
    }, // 移除HTML
    methods:{
        close(){
            this.$emit('update:visible',false)
        }
    }
}
</script>

<style lang="scss" scoped>
.colorPicker{
    box-shadow: -1px 2px 10px 0px #336;
    position: absolute;
    z-index: 100000;
    // top: 0px;
    // left: 0px;    
}
</style>