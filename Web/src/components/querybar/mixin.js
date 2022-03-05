import Vue from 'vue'
import demandsDom from '@/components/demandShapes/demands.vue'

const isEmpty = (value)=>(value === '' || value === null || value === undefined)

export default Vue.extend({
    inject:['getters'],
    components:{ demandsDom },
    props:{
        demands:{
            type:Array,
            required:true
        }
    },
    data(){
        return{
            inputVisibles:{}, // 输入框可见状态
        }
    },
    computed:{
        priorDemands(){
            return this.demands.filter(t => t.enabled && t.prior)
        }
    },
    methods:{
        /**
         * Mouseenter时显示条件的输入框，但快速“划过”不会显示。
         * @param {*} param0 
         * @param {*} param1 
         */
        showInput_onMouseenter({target},{ename}){
            const the = this
            const timeoutKey = setTimeout(() => {
                the.$set(the.inputVisibles,ename,true)           
                const hideItem = ()=>{
                    the.$delete(the.inputVisibles,ename)
                    document.removeEventListener('mousedown',hideItem)
                }
                document.addEventListener('mousedown',hideItem)
            }, 400)

            {
                const time1 = new Date().getTime()
                target.addEventListener('mouseout',()=>{
                    if(new Date().getTime() - time1 < 400){
                        clearTimeout(timeoutKey)
                    }
                })
            } // 如果是快速“划过”则不显示
        },
        /**
         * 获取 条件的高亮状态（有值|必填 = 高亮）
         * @param {*} param0 
         */
        getLightState({kv,nullable,shape,value}){
            if(!nullable) return true
            if(kv && !isEmpty(value.e)) return true
            if(shape === 'f' && (!isEmpty(value.t) || !isEmpty(value.f))) return true
            if(shape === 'e' && !isEmpty(value.e)) return true
            if(shape === 'v' && !isEmpty(value.way) && !isEmpty(value.v)) return true
        }
    }
})