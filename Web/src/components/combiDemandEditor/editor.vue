<template>
    <div class="creatorArea">
        <chooseType v-if="step === 1" @next="newCreate" @cancel="uncreate" />
        <edit_cv v-if="step === 2 && cd.combi === 'cv'" :cd="cd" @finish="finishCreate" @cancel="uncreate"/>
        <edit_cn v-if="step === 2 && cd.combi === 'cn'" :cd="cd" @finish="finishCreate" @cancel="uncreate"/>
    </div>
</template>

<script>
import { CombiDemand } from '@/models'
import chooseType from './chooseType.vue'
import edit_cv from './edit_cv.vue'
import edit_cn from './edit_cn.vue'

export default {
    components:{ chooseType, edit_cv, edit_cn },
    props:{
        combiDemand:{
            type:Object,
            required:false
        },
        // fields:{
        //     type:Array,
        //     required:true
        // }
    },
    data(){
        return {
            step: 1,
            cd: null
        }
    },
    watch:{
        combiDemand:{
            handler(){
                if(!this.combiDemand){
                    this.step = 1
                }else{
                    this.step = 2
                    this.cd = this.combiDemand._copy
                    if(this.cd.type === 'cv'){
                        this.cd.items.forEach(t=>t.nullable = false)
                    }
                }
            },
            immediate:true
        }
    },
    methods:{
        newCreate(type){
            this.cd = new CombiDemand({combi:type})
            this.step = 2
        },
        finishCreate(){
            this.step = 1
            this.$emit('finish', this.cd)
        },
        uncreate(){
            this.cd = null
            this.finishCreate()
        }
    }
}
</script>

<style lang="scss" scoped>

</style>