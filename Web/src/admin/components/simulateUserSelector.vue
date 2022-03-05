<template>
    <ul class="simulateUserSelector">
        <li class="title" :class="{reverseOrder:dir}">
            <label class="tof">
                <i class="fa fa-refresh" @click.stop="settingApi.refreshTstUsers" hint="重新获取【模拟用户】"/> 
                <!-- 当前 -->
            </label>
            <label class="tof">角色</label>
            <label class="tof">名称</label>
        </li>
        <template v-if="getters.tstUsers.length > 0">
            <li v-for="(item) in getters.tstUsers" :class="{active:item.id == tstUserid}" @click.stop="select(item)" :key="item.id">
                <label>
                    <span v-if="item.id == tstUserid">✓</span>
                </label>
                <label class="tof" :title="getRoleNames(item.roles)">{{getRoleNames(item.roles) || '----'}}</label>
                <label class="tof" :title="item.name">{{item.name || item.username}}</label>
            </li>
        </template>
        <template v-else-if="getters.tstUsersLoading">
            <li class="loading">
                <i class="fa fa-spinner fa-spin fa-3x fa-fw"/>
            </li>
        </template>
        <template v-else>
            <li class="error">
                未设置{{getters.currentUserType.name}}【用户接口】或 返回值为空！如果不需要绑定 登录用户，则不影响使用。
            </li>
        </template>
    </ul>
</template>

<script>
export default {
    inject:['getters','settingApi'],
    props:{
        dir:{
            type:Boolean,
            required:false
        }
    },
    computed:{
        userTypes(){
            return this.getters.setting ? this.getters.setting.userTypes : []
        },
        currentUserType(){
            return this.getters.currentUserType || {}
        },
        tstUserid:{
            get(){
                return this.getters.tstUser.id
            },
            set(userid){
                this.settingApi.switchTstUser(userid)
            }
        }
    },
    methods:{
        select(item){
            this.tstUserid = item.id
            this.$emit('selected',item)
        },
        getRoleNames(roleids = []){
            return this.getters.roles.filter(t=>roleids.includes(t.id)).map(t=>t.name).join('，')
        }
    }
}
</script>

<style lang="scss" scoped>
ul.simulateUserSelector{
    background: #fff;
    // border: 1px solid #ba9; // 加border总有个 白边，烦死了！！！！！！！！！用box-shadow代替吧。
    // border-top: none;
    box-shadow: 2px 2px 2px 0px #432,0px 0px 0px 1px #dcb;
    text-align: left;
    line-height: auto;

    max-height: 500px;
    overflow: auto;

    display: flex;
    flex-direction: column;
    > li{
        order: 1;
        line-height: auto;
        max-width: 250px;
        height: 30px;
        padding: 0px 5px;

        display: flex;
        align-items: center;                            
        > label{
            padding: 0px 3px;
        }
        > label:nth-child(1){
            min-width: 30px;
            // flex-basis: 30px;
            text-align: center;
        }
        > label:nth-child(2){
            min-width: 40px;
            flex-grow: 1;
            overflow: hidden;                                
        }
        > label:nth-child(3){
            min-width: 90px;
            // flex-basis: 90px;
            padding-right:5px;
            overflow: hidden;
        }
        &:not(.title) > label{
            cursor: pointer;
            &:nth-child(1) > span{
                font-weight: bold;
                font-size: 1.3em;
                color:#f00;
            }
        }
        &.title{            
            position: sticky;
            top: 0;

            background: #ecb;                                
            > label{
                // color: #fff;
                > i.fa-refresh{
                    color: #f00;
                    cursor: pointer;
                }
            }
            &.reverseOrder{
                order: 100000;
                top: auto;
                bottom: 0;
            }
        }                            
        // &:not(.error):not(.title):not(.active):nth-child(odd){
        //     background: #ffedea;
        // }                            
        // &:not(.error):not(.title):not(.active):hover{
        //     background: #fcb;
        // }
        &:not(.error):not(.loading):not(.title):not(.active):hover,
        &.active{
            background:#fcb;
        }
        &.error{
            height: auto;
            padding: 5px;
            color: #f00;
        }
        &.loading{
            height: 52px;
            overflow: hidden;
            text-align: center;
            vertical-align: middle;
            > i.fa{
                margin: auto;
                color:#f00;
            }
        }
    }
}
</style>