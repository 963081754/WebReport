<template>
    <div class="cascader">
        <template v-for="(n,i) in model.masterKeys.layer">
            <r-combobox class="combobox" v-model="values[n-1]" :items="lists[n-1] || []" @change="onChange(n)" :vField="model.masterKeys.id" :tField="model.masterKeys.name" :loading="loading===n" :nullable="i?true:nullable" :key="n"
             v-show="lists[n-1] && lists[n-1].length" >
                <template v-slot:header v-if="otherFields.length">
                    <div class="header">
                        <label>{{nameField.cname || nameField.name}}</label>
                        <label v-for="item in otherFields" :key="item.name">{{item.cname || item.name}}</label>
                    </div>
                </template>
                <template v-slot:default="{data}" v-if="otherFields.length">
                    <div class="item">
                        <label :title="data[model.masterKeys.name]">{{data[model.masterKeys.name]}}</label>
                        <label v-for="item in otherFields" :key="item.name">{{data[item.name]}}</label>
                    </div>
                </template>
            </r-combobox>
        </template>
    </div>
</template>

<script>
export default {
    inject:['getters','chainApi'],
    model: {
        prop: 'value',
        event: 'change'
    },
    props:{
        chainId:{
            type:[Number,String],
            required:true
        },
        value:{
            type:[Number,String],
            required:false
        },
        nullable:{
            type:Boolean,
            required:false,
            default:true
        },
        placeholder:{
            type:String,
            required:false
        }
    },
    data(){
        return{
            loading: null, // 1,2,3,4，第几层加载的数字
            values: [], // [value1,……]
            lists: [] // [[item,……],……]
        }
    },
    computed:{
        model(){
            return this.getters.chains.find(t=>t.id === this.chainId) || {masterKeys:{}}
        },
        otherFields(){
            const masterFields = [this.model.masterKeys.id,this.model.masterKeys.pid,this.model.masterKeys.name]
            return this.model.fields.filter(t=>!masterFields.includes(t.name))
        },
        nameField(){
            return this.model.fields.find(t=>t.name == this.model.masterKeys.name)
        }
    },
    watch:{
        value:{
            handler(){
                if(this.value && this.value == this.getValueByValues()) return

                if(this.value){ // value有值时
                    const list = this.lists.find(items=> items.find(t=>t[this.model.masterKeys.id] == this.value))
                    if(list){ // value在当前加载列表中 时
                        const index = this.lists.indexOf(list)
                        this.$set(this.values,index,this.value)
                        // this.values[index] = this.value
                        this.onChange(index + 1)
                    }else{ // value不在当前加载列表中 时
                        this.lists = []
                        this.values = []
                        this.loadInitData(this.value)
                    }
                }else{ // value没值时
                    this.lists = []
                    this.values = []
                    this.loadLayerData(1)
                }
            },
            immediate:true
        },
        values(){
            const value = this.getValueByValues()
            if(value == this.value) return
            
            this.$emit('change',value)
        },
        'getters.tstUser':{
            handler(){
                const chain = this.getters.chains.find(t=>t.id == this.chainId)
                if(!chain) return // 预防万一出错
                if((chain.sqlParamKeys && chain.sqlParamKeys.length > 0) || (chain.masterKeys && chain.masterKeys.fid)){
                    this.lists = []
                    this.values = []
                    this._rootList = null
                    this.loadLayerData(1)
                }
            }
        } // 后台用到：如果chain绑定了user,则需要重新加载
    },
    methods:{
        getValueByValues(){
            let value = undefined
            this.values.forEach(t=>value = t || value)
            return value
        },
        loadInitData(value){
            const sign = this._sign = Math.random()     
            this.loading = 1
            return this.chainApi.dataLayerByDid(this.chainId,this.getters.tstUser,value).then(({lists})=>{                
                if(this._sign !== sign) return // 不是最新请求，抛弃

                this._rootList = [...lists[0]] // 缓存第一层的数据，因为第一层是不变的
                
                this.lists = lists.map(t=>Object.freeze(t))
                this.values = []
                for(let i = lists.length - 2 ; i >= 0 ; i--){
                    const item = lists[i].find(t=>t[this.model.masterKeys.id] == value)
                    this.$set(this.values,i,value)
                    value = item[this.model.masterKeys.pid]
                } // 设置values
            }).catch(error=>{
                if(this._sign !== sign) return // 不是最新请求，抛弃
                console.error(error)
                if(error.message === '层级错误'){
                    this.$emit('revise',`值不存在`)
                    // this.$message.error(`${this.model.name} 默认值设置错误`)
                }else{
                    this.$emit('revise',`${error.message}`)
                    // this.$message.error(`${this.model.name} ${error.message}`)
                }
                
                this.loadLayerData(1).then(()=>{
                    this.values = []
                })  // 清掉错误的值，改为加载根层级的数据
            }).finally(()=>{
                if(this._sign !== sign) return // 不是最新请求，抛弃
                this.loading = null
            })
        },
        loadLayerData(layer,pid){
            if(layer === 1 && this._rootList){
                this.lists = [[...this._rootList]]
                return
            }

            const sign = this._sign = Math.random()
            this.loading = layer
            return this.chainApi.dataLayerByPid(this.chainId,this.getters.tstUser,pid,this._sign).then(({list})=>{
                if(this._sign !== sign) return // 不是最新请求，抛弃

                this.$set(this.lists,layer-1,Object.freeze(list))

                if(layer === 1) this._rootList = [...list]  // 缓存第一层的数据，因为第一层是不变的
            }).finally(()=>{
                if(this._sign !== sign) return // 不是最新请求，抛弃
                this.loading = null
            })
        },
        onChange(layer){
            for(let i = this.model.masterKeys.layer ; i > layer ; i--){
                this.lists[i-1] = undefined
                this.values[i-1] = undefined
            }
            if(layer < this.model.masterKeys.layer){
                const pid = this.values[layer -1]
                if(pid){
                    this.loadLayerData(layer+1,pid)
                }
            }
        }
    }
}
</script>

<style lang="scss" scoped src="@/components/chainSelect/css.scss"></style>
<style lang="scss" scoped>
</style>