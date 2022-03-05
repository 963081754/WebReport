<template>
    <button :class="{unagainButton: true, lock}" :disabled="lock" @click.stop="submit">
        <slot></slot>
    </button>
</template>

<script>
export default {
    data(){
        return{
            lock:false
        }
    },
    methods:{
        submit(){
            this.lock = true
            this.$emit('click',{unlock:()=>{
                this.lock = false
            }})
        }
    }
}
</script>

<style lang="scss" scoped>

</style>