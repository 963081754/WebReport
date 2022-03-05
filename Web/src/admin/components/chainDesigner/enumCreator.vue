<template>
    <div class="enumCreator">
        <div class="chainCreator">
            <slot></slot>
            <div class="row">
                <label>枚举值：</label>
                <div>
                    <textarea class="values" raw rows="10" v-model.trim.lazy="model.values" :placeholder="placeholders"></textarea>
                </div>
            </div>
            <div class="row">
                <label></label>
                <div>
                    <r-button @click="save" :disabled="!model.values || !model.name" raw class="small">
                        <i class="fa fa-check"></i>保存
                    </r-button>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

export default {
    inject:['chainApi'],
    props:{
        model:{
            type:Object,
            required:true
        }
    },
    data(){
        return {
            placeholders:Object.freeze(`（不区分大小写）
                示例1：
                true|是
                false|否
                示例2：
                1|已创建
                2|已审核
                3|运送中
                4|已签收
                5|结束`.trimRow())
        }
    },
    methods:{
        save({unlock}){
            try{
                 if(!this.model.name){
                    throw Error('请输入名称')
                }
                if(!this.model.values){
                    throw Error(`请输入 枚举值`)
                }
                if(!this.testEnum()){
                    throw null
                }
            }catch(err){
                if(err){
                    this.$message.error(err.message)
                }
                return !!unlock()
            }
            Promise.resolve().then(()=>{
                if(this.model.id){
                    return this.chainApi.update(this.model).then((model)=>{
                        this.$message.success('修改成功')
                        this.$emit('succeeded',model)                    
                    })
                }else{
                    return this.chainApi.add(this.model).then((model)=>{
                        this.$message.success('添加成功')
                        {
                            this.model.name = null
                            this.model.values = null
                        }
                        this.$emit('succeeded',model)
                    })
                }
            }).catch((err)=>{
                this.$message.error(err.message)
            }).finally(()=>{
                unlock()
            })
        },
        testEnum(){
            if(!this.model.values){
                this.$message.error('请输入枚举值！')
                return false
            }
            if(this.model.values.length > 300){
                this.$message.error('枚举值不能多于300字！')
                return false
            }

            const items = this.model.values.split(/\r|\n/img)
            try{
                const options = items.map(itemStr=>{
                    const item = itemStr.split('|')
                    if(item.length<2 || item[0].length===0 || item[1].length===0){
                        throw Error(`枚举输入格式错误（${itemStr}），正确示例：键|名称`)
                    }
                    return {id:item[0], name:item[1]}
                })

                let multipleOption = options.find(t=>options.filter(o=>o.name===t.name).length>1)
                if(multipleOption){
                    throw Error(`存在重复名称（${multipleOption.name}）`)
                }
                multipleOption = options.find(t=>options.filter(o=>o.id===t.id).length>1)
                if(multipleOption){
                    throw Error(`存在重复值（${multipleOption.value}）`)
                }
                return true
            }catch(err){
                this.$message.error(err.message)
                return false
            }
        }
    }
}
</script>

<style lang="scss" scoped src="@/admin/components/chainDesigner/css.scss"></style>
<style lang="scss" scoped>

</style>