<template>
    <contextmenu v-if="contextmenuAttrs.visible" :isFront="true" :visible.sync="contextmenuAttrs.visible" :site="contextmenuAttrs.site" :operations="contextmenuAttrs.operations" />
</template>

<script>
const contextmenu = ()=> import('@/components/report.vue/contextmenu.vue')

export default {
    components:{ contextmenu },
    computed:{
        contextmenuAttrs(){
            return this.$parent.contextmenuAttrs || {}
        }
    }
}
</script>