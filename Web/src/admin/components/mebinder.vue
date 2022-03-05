<template>
    <r-minipopup :visible.sync="visiblePopup" title="登录用户的数据约束" icon="user-secret">
        <ul class="mebinder">
            <li class="title">
                <span>条件列</span>
                <span>=</span>
                <span>登录用户</span>
            </li>
            <li v-for="(item) in binds" :key="item.ufield">
                <r-combobox class="select" v-model="item.field" :items="demands" :vField="'ename'" :tField="'cname'" :angleSite="true" :placeholder="'请选择条件'" />
                <span>=</span>
                <span>{{item.ufield}}</span>
            </li>
            <li class="disabledHint" v-if="binds.length === 0">
                未设置 {{getters.currentUserType.name}}【用户接口】或接口返回值为空！ <br/>
                该功能无法使用。
            </li>
        </ul>
        <div class="toolbar">
            <button class="small" @click.stop="submit" raw>
                <i class="fa fa-check"></i>确定
            </button>
            <!-- <button class="small" raw>
                <i class="fa fa-hand-o-right"></i>去创建组合条件
            </button> -->
        </div>
        <!-- 1.强制应用(用户不可见)；2.创建 组合条件(用户可见、可选) -->
    </r-minipopup>
</template>

<script>
export default {
    inject: ['getters','getDemands'],
    props:{
         visible:{
            type:Boolean,
            required:true
        },
        userKeys:{
            type:Array,
            required:true
        }
    },
    data(){
        return {
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
        },
        demands(){
            return this.getDemands().filter(t=>!t.isCustom)
        }
    },
    watch:{
        'getters.userMetadata':{
            handler(){
                this.binds = Object.keys(this.getters.userMetadata).map(userField=>{
                    const obj = { ufield: userField, field: null }
                    const item = this.userKeys.find(t=>t.ufield === userField)
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
        submit(){
            this.$emit('update:userKeys', this.binds)
            this.visiblePopup = false
        }
    }
}
</script>

<style lang="scss" scoped>
ul.mebinder{
    // width: 500px;
    li{
        height: 25px;
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
        > *:nth-child(1),> :nth-child(3){
            width: calc(50% - 10px);
        }
        > *:nth-child(1){
            text-align: right;
        }
        > *:nth-child(3){
            text-align: left;
        }
    }
    li.title{
        background: #ecb;
    }
    li.disabledHint{
        height: auto;
        padding: 5px;
        color: #f00;
    }
}
.toolbar{
    margin-top: 5px;
    padding: 5px;
    background: #ecb;
    text-align: right;
}
</style>