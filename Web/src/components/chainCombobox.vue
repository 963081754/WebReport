<template>
    <r-combobox ref="combobox1" class="combobox" v-model.trim="value" :items="items" :vField="vField" :tField="tField" :nullable="nullable">
        <template v-slot:header v-if="otherFields.length">
            <div class="header">
                <!-- <label>编号</label> -->
                <label>{{nameFieldCname}}</label>
                <label v-for="field in otherFields" :key="field.name">{{field.cname || field.name}}</label>
            </div>
        </template>
        <template v-slot:default="{data}" v-if="otherFields.length">
            <div class="item">
                <!-- <label>{{data[vField]}}</label> -->
                <label>{{data[tField]}}</label>
                <label v-for="field in otherFields" :key="field.name">{{data[field.name]}}</label>
            </div>
        </template>
    </r-combobox>
</template>

<script>
export default {
    inject:['getters'],
    model: {
        prop: 'selectedValue',
        event: 'change'
    },
    props:{
        chainId:{
            type:[Number,String],
            required:true
        },
        selectedValue:{
            // type:Boolean,
            required:false
        },
        nullable:{
            type:Boolean,
            required:false,
            default:true
        }
    },
    computed:{
        value:{
            get(){
                return this.selectedValue
            },
            set(val){
                this.$emit('change',val)
            }
        },
        model(){
            return this.getters.chains.find(t=>t.id == this.chainId)
        },
        items(){
            let list = []
            if(!this.model) return list
            if(this.model.type === this.ChainType.enum){
                list = this.getters.littleEnumChainDatas(this.chainId)
            }else{
                list = this.getters.littleSqlChainDatas(this.chainId)
            }
            this.reviseValue(list) // 判断值是否存在列表中
            return list
        },
        vField(){
            if(!this.model) return 'a'
            if(this.model.type === this.ChainType.enum){
                return 'id'
            }else{
                return this.model.masterKeys.id
            }
        },
        tField(){
            if(!this.model) return 'a'
            if(this.model.type === this.ChainType.enum){
                return 'name'
            }else{
                return this.model.masterKeys.name
            }
        },
        nameFieldCname(){
            return (this.model && this.model.fields ? 
                    this.model.fields.find(t=>t.name === this.model.masterKeys.name).cname : '') || '名称'
        },
        otherFields(){
            return this.model && this.model.fields ? 
                this.model.fields.filter(t=>![this.vField,this.tField].includes(t.name))
                : []
        }
    },
    methods:{
        visibleDropdown(value){
            this.$refs.combobox1.switchVisible(!!value)
        },
        /**
         * 消除错误值：判断值是否存在列表中，不存在则 更新selectedValue=null
         */
        reviseValue(list){
            let correctValue
            if(!this.multiple){
                if(this.selectedValue === undefined || this.selectedValue === null || this.selectedValue === '') return

                const item = list.find(t=>t[this.vField] == this.selectedValue)
                if(!item){
                    correctValue = null
                }
            }else{
                if(!this.selectedValue || this.selectedValue.length === 0) return

                const selectedItems = list.filter(t=>this.selectedValue.find(v=>v == t[this.vField]))
                if(selectedItems.length < this.selectedValue.length){
                    correctValue = selectedItems.map(t=>t[this.vField])
                }
            }
            if(correctValue !== undefined){
                console.error(`值不在下拉列表中`,this.selectedValue,list)
                this.$emit('change',correctValue)

                const msg = correctValue === null ? '值不在下拉列表中' : (correctValue.length > 0 ? '值不完全在下拉列表中' : '值不在下拉列表中')
                this.$emit('revise',msg)
            }
            
        } // 如果 selectedValue与列表不对应，则更新它为正确值
    }
}
</script>

<style lang="scss" scoped src="@/components/chainSelect/css.scss"></style>
<style lang="scss" scoped>
</style>