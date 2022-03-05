<template>
    <div class="userParams" :class="{hide:!visible}">
        <div class="title">
            <span>【登录用户】可用SQL参数</span>
            <i v-if="visible"  class="fa fa-angle-double-right" @click.stop="visible=false" hint="隐藏"/>
            <i v-if="!visible" class="fa fa-angle-double-left" @click.stop="visible=true" hint="显示"/>
        </div>
        <span class="errorMsg" v-if="fieldKeys.length === 0">
            未设置 {{getters.currentUserType.name}}【用户接口】 <br/>或接口返回值为空！
        </span>
        <div class="item" v-for="item in fieldKeys" :key="item" hint2l hint2="点击复制">
            <i class="fa fa-copy" @click.stop="$event.target.parentNode.childNodes[1].focus()"/>
            <input :value="`@user_${item}`" readonly @focus.stop="copyParamsName">
        </div>
        <span class="demo" v-if="fieldKeys.length">
            使用示例：<br/>
            select name,address <br/>from staff <br/>where id=@user_{{fieldKeys[0]}}
        </span>

        <span class="hideMsg" @click.stop="visible=true">登陆用户  可用SQL参数</span>
    </div>
</template>

<script>
export default {
    inject:['getters'],
    data(){
        return {
            visible:true
        }
    },
    computed:{
        fieldKeys(){
            return Object.keys(this.getters.userMetadata || {})
        }
    },
    methods:{
        copyParamsName({target}){
            target.select()
            document.execCommand("copy")
            this.$message.success('已复制到剪贴板',500)
        }
    }
}
</script>

<style lang="scss" scoped>
.userParams{
    padding: 5px;
    background: #ffedea;
    > div.title{
        font-size: 1.1em;
        margin-bottom: 5px;
        display: flex;
        align-items: baseline;
        > span{
            font-size: inherit;
            flex-grow: 1;
            // margin-right: 5px;
            position: relative;
            left: -6px;
        }
        > i.fa{
            // color: #006;
            // font-weight: bold;
            cursor: pointer;
            padding: 3px;
        }
    }
    > .errorMsg{
        color: #f00;
    }
    > .item{
        padding: 3px 0px 3px 0em;
        cursor: pointer;
        > i.fa{
            // padding: 5px 5px 5px 0px;
            padding-right: 3px;
            // font-weight: bold;
            color: #006;
        }
        > input{
            border: none;
            outline: none;
            background: none;
            cursor: pointer;
            color: #006;
        }
    }
    > .demo{
        display: block;
        margin-top: 5px;
        color: #666;
        user-select: none;
    }
    > .hideMsg{
        display: none;
        width: 1em;
        word-break:break-all;
        cursor: pointer;
    }
    &.hide{
        > .errorMsg,
        > .item,
        > .demo,
        > div.title > span{
            display: none;
        }
        > .hideMsg{
            display: block;
        }
    }
}
</style>