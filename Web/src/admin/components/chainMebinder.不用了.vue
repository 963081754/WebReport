<template>
    <r-minipopup :visible.sync="visiblePopup" title="登录用户的数据约束" :shade="true">
        <div class="chainMebinder">
            <ul class="binds">
                <li class="title">
                    <span>列的值</span>
                    <span>=</span>
                    <span>
                        登录用户
                        （<r-combobox class="userTypes" v-model="userType" :items="getters.setting.userTypes" :vField="'id'" :tField="'name'" :autoWidth="true" :placeholder="'请选择 前台类型'" />）
                    </span>
                </li>
                <li v-for="(item) in binds" :key="item.ufield">
                    <r-combobox class="select" v-model="item.field" :items="instance.fields" :vField="'name'" :tField="'cname'" :angleSite="true" :placeholder="'请选择列'" />
                    <span>=</span>
                    <span>{{item.ufield}}</span>
                </li>
            </ul>            
            <div class="toolbar">
                <span class="explain">注：要看到绑定约束效果，请登陆前台。</span>
                <r-button class="small" @click="submit" raw>
                    <i class="fa fa-check"></i>确定
                </r-button>
            </div>
        </div>
    </r-minipopup>
</template>

<script>
export default {
    inject: ['getters','chainApi','settingApi'],
    props:{
         visible:{
            type:Boolean,
            required:true
        },
        instance:{
            type:Object,
            required:true
        }
    },
    data(){
        return {
            userType:null,
            binds:[]
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
        }
    },
    watch:{
        instance:{
            handler(){
                this.userType = this.instance.userType
            },
            immediate:true
        },
        userType:{
            async handler(){
                if(!this.userType){
                    this.binds = []
                    return
                }

                const metadate = await this.settingApi.getUserMetadata(this.getters.setting.id,this.userType)
                this.binds = Object.keys(metadate).map(userField=>{
                    const obj = { ufield: userField, field: null }
                    const item = this.instance.userKeys.find(t=>t.ufield === userField)
                    if(item){
                        obj.field = item.field
                    }
                    return obj
                })
            },
            immediate:true
        }
    },
    methods:{
        async submit({unlock}){
            try{
                const userKeys = this.binds.filter(t=>t.field)
                await this.chainApi.updateUserKeys(this.instance.id,this.userType,userKeys)
                this.visiblePopup = false
            }finally{
                unlock()
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.chainMebinder{
    // width: 400px;
    > ul.binds{
        li{
            height: 25px;
            border-bottom: 1px solid #ddd;
            > .select{
                height: 25px;
            }
            > *{
                display: inline-block;
            }
            > *:nth-child(2){
                width: 20px;
                text-align: center;
            }
            // > :nth-child(3){
            //     width: calc(50% - 10px);
            // }
            > *:nth-child(1){
                width: 120px;
                text-align: right;
            }
            > *:nth-child(3){
                text-align: left;
                // border-bottom: 1px solid #ddd;
            }
        }
        li.title{
            background: #fee;
            border-bottom: 1px solid #edd;
        }
    }
    > .toolbar{
        margin-top: 5px;
        padding: 5px;
        background: #fee;
        border-top: 1px solid #edd;
        text-align: right;
        > .explain{
            float: left;
            line-height: 25px;
            color: #666;
        }
    }
    // .userTypes{
    //     min-width: 80px;
    // }
}
</style>