const colorPicker  = () => import('@/Uilibrary/colorPicker.vue')
import { getColorStyle } from '@/components/widgets'
import { SqlChain } from '@/models'

export default {
    components:{ colorPicker },
    inject:['getters','chainApi'],
    props:{
        visible:{
            type:Boolean,
            required:true
        },
        id:{
            type:[Number,String],
            required:true
        }
    },
    data(){
        return {
            list:[],
            loading:false,
            colors:{}, // {id:value，……}
            picker:{
                visible:false,
                site:null,
                value:null
            }
        }
    },
    computed:{
        visiblePopup:{
            get(){
                return this.visible
            },
            set(value){
                this.$emit('update:visible',value)
            }
        },
        instance(){
            const obj = this.getters.chains.find(t=>t.id === this.id) || {}
            return new SqlChain(obj)
        },
        majorKey(){
            return this.instance.idField.name
        },
        fields(){
            const _fields = [...this.instance.fields]
            const idField = _fields.find(t=>t.name == this.instance.idField.name)
            const nameField = _fields.find(t=>t.name == this.instance.nameField.name)            

            _fields.splice(_fields.indexOf(idField),1)
            _fields.splice(_fields.indexOf(nameField),1)
            _fields.splice(0,0,idField)
            _fields.splice(1,0,nameField)

            if(this.instance.pidField){
                const pidField = _fields.find(t=>t.name == this.instance.pidField.name)
                pidField && _fields.splice(_fields.indexOf(pidField),1)
            }

            return _fields
        }
    },
    watch:{
        id:{
            async handler(){
                // await this.loadPaging(this.data.pageIndex,this.data.pageSize,true)
                if(this.$refs.minipopup1){
                    this.$refs.minipopup1.toMiddle()
                }
            },
            immediate:true
        }, // 加载完 居中
        instance:{
            handler(){
                this.colors = this.instance.colorEnums
            },
            immediate:true
        }
    },
    methods:{
        changeCname(field){
            this.chainApi.updateFieldCname(this.id,field)
        },
        getColorStyle: getColorStyle,
        openColorPicker(value,{target}){
            this.picker.value = value
            this.picker.site = target
            this.picker.visible = true
        },
        async submit(){
            const colors = Object.entries(this.colors).map(t=>({id:t[0],value:t[1]})).filter(t=>t.value!=='#ffffff')
            await this.chainApi.updateColors(this.instance.id,colors)
        } // bug:如果直接 关闭窗口，这里不会执行
    }
}