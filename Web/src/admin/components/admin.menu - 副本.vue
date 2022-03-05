<template>
    <div class="menu" :class="{hide,moment}" v-move="'.min > span'">
        <div class="main">
            <div class="list">
                <i class="fa fa-users simulateUserSelector">
                    <ul class="users">
                        <li class="title">【登录用户】模拟
                        </li>
                        <li class="title">
                            <label class="tof">选择</label>
                            <label class="tof">角色</label>
                            <label class="tof">
                                用户名<i class="fa fa-refresh" @click.stop="settingApi.refreshTstUsers" hint="重新获取【模拟用户】"/>
                            </label>
                        </li>
                        <template v-if="getters.tstUsers.length > 0">
                            <li v-for="item in getters.tstUsers" @click.stop="tstUserid=item.id" :key="item.id">
                                <label>
                                    <input type="radio" :checked="item.id === tstUserid" :value="item.id" name="tstUser">
                                </label>
                                <label class="tof">{{getRole(item.roles[0]).name}}</label>
                                <label class="tof">{{item.username}}</label>
                            </li>
                        </template>
                        <template v-else>
                            <li class="error">未设置{{getters.currentUserType.name}}【用户接口】或 返回值为空！</li>
                        </template>
                    </ul>
                </i>
                <i class="fa fa-file-o" @click.stop="openManager('sqlCreator')" :hint="`创建报表(${currentUserType.name})`" >
                    <i class="fa fa-user"/>
                </i> 
                <i class="fa fa-align-justify" @click.stop="openManager('categoryManage')" :hint="`目录管理(${currentUserType.name})`" >
                    <i class="fa fa-user"/>
                </i>
                <i class="fa fa-file-text" @click.stop="openManager('reportManage')" :hint="`报表管理(${currentUserType.name})`" >
                    <i class="fa fa-user"/>
                </i>
                <i class="fa fa-paperclip" @click.stop="openManager('userChainManage')" :hint="`别针管理(${currentUserType.name})`" >
                    <i class="fa fa-user"/>
                </i>
                <i class="fa fa-paperclip" @click.stop="openManager('chainManage')" hint="别针管理" ></i>            
                <i class="fa fa-database" @click.stop="openManager('databaseManage')" hint="数据库管理" ></i>
                <i class="fa fa-gear" @click.stop="openManager('settingEditor')" hint="基本设置" >
                </i>                                 
                <!-- <i class="fa fa-sign-out" @click.stop="logout" hint="退出"></i> -->
            </div>
        </div>
        <div class="min" @dblclick.stop="setHide" @mouseenter.stop="moment=false">
            <i class="fa fa-thumb-tack" @click.stop="setHide" hintb :hint="hide?'固定显示':'隐藏'"></i>
            <span>{{currentUserType.name}}</span>
            <i class="fa fa-angle-double-down" hint="切换前台类型">
                <div class="userTypes">
                    <span v-for="item in (getters.setting || {}).userTypes" @click.stop="$emit('update:hash',item.id)" :key="item.id">{{item.name}}</span>
                </div>
            </i>
            <a class="openWeb" :href="`/home#/${currentUserType.path}`" target="_blank">
                <i class="fa fa-hand-o-right" :hint="`打开前台(${currentUserType.name})`"></i>
            </a>
            <i class="fa fa-sign-out" @click.stop="logout" hint="退出"></i>
        </div>
    </div>
</template>

<script>
export default {
    inject:['getters','settingApi'],
    props:{
        hash:{
            type:[String,Number],
            required:true
        }
    },
    data(){
        return{
            hide:false,
            moment:false
        }
    },
    computed:{
        currentUserType(){
            return this.getters.currentUserType
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
        setHide(){
            this.hide = !this.hide
            this.moment = this.hide
        },
        openManager(name){
            this.$emit('openManager',name)
        },
        openCreator(){
            this.$emit('openCreator')
        },
        logout(){
            this.$emit('logout')
        },
        getRole(roleid){
            return this.getters.roles.find(t=>t.id == roleid) || {}
            // return this.getters.roles.filter(t=>roleids.includes(t.id))
        }
    }
}
</script>

<style lang="scss" scoped>
.menu{
    display: inline-block;
    z-index: 10000;
    position: fixed;
    top: 10%;
    left: 0px !important;
    transition: left 200ms;
    text-align: center;

    user-select:none;
    -ms-user-select:none;
    > .main{
        // transition: left 300ms;
        // position: absolute;
        // left: 0px;
        > .list{
            padding: 5px;
            border: 1px solid #ddd;
            border-left: none;
            background:#fff;
            box-shadow: 0px 2px 8px 0px #336;
            > i.fa{
                display: block;
                font-size: 2em;
                cursor: pointer;
                padding: 3px;
                margin: 5px 0px;
                text-align: center;
                text-shadow: 1px 1px 1px #888;
                color: #432;
                // &.fa-sign-out{
                //     color: #999;
                //     text-shadow: 1px 1px 1px #333;
                // }
                > i.fa-user{
                    top: -3px;
                    text-shadow: 1px 0px 0px #fff, -1px 0px 0px #fff, 0px 1px 0px #fff, 0px -1px 0px #fff;
                }
            }
            > i.fa.simulateUserSelector{
                color: #f00;
                background: none;
                font-size: 1.7em;
                user-select: text;
                > ul.users{
                    display: none;
                    position: absolute;
                    z-index: 1;
                    top: 10px;
                    left: 10px;
                                        
                    padding: 5px;
                    background: #fff;
                    border: 1px solid #eee;
                    box-shadow: 1px 1px 5px 0px #333;
                    text-shadow: none;
                    text-align: left;
                    > li{
                        padding: 5px;
                        display: flex;
                        cursor: pointer;
                        > label:nth-child(1){
                            width: 35px;
                            // text-align: center;
                        }
                        > label:nth-child(2){
                            width: 90px;
                        }
                        &.title{
                            background: #220;
                            color: #fff;
                            > label{
                                color: inherit;
                                > i.fa-refresh{
                                    position: static;
                                    color: #ff0;
                                    cursor: pointer;
                                    padding-left: 5px;
                                }
                            }
                            &:first-child{
                                font-size: 1.1em;
                                font-weight: bold;
                                display: block;
                                background: none;
                                color: #333;
                            }
                        }
                        &:not(.error):not(.title):hover{
                            background: #330;
                            > label{
                                color:#fff;
                            }
                        }
                        &.error{
                            color: #f00;
                        }
                    }
                }
                &:hover > ul.users{
                    display: block;
                }
            }
        }
    }
    > .min{
        position: absolute;
        top: 0;
        left: 42px;
        width: 25px;
        padding: 5px;
        border-radius: 2px;
        background: #fff;
        border: 1px solid #ddd;
        border-left: none;
        // border-right: none;
        box-shadow: 1px 0px 1px 0px #999;
        > *{
            display: block;
            padding: 3px 0px;
        }
        > i.fa{
            cursor: pointer;
        }
        > i.fa-angle-double-down{
            position: relative;
            > .userTypes{
                display: none;
                z-index: 1;
                position: absolute;
                top: 10px;
                left: 7px;
                // left: calc(100% - 2px);
                padding: 5px;                
                word-break: keep-all;
                text-align: left;
                cursor: default;
                line-height: 20px;
                background: #fff;
                box-shadow: 0 0 5px 1px #336;
                > span{
                    display: block;
                    cursor: pointer;
                }
            }
            &:hover{
                > .userTypes{
                    display: block;
                }
            }
        }
    }
    &.hide{
        left: -43px !important;
        // > .main{
        //     left: -100px;
        // }
        > .min{
            box-shadow: 0px 2px 8px 0px #555;
            > i.fa-thumb-tack{
                color: #999;
            }
        }
    }
    &:hover:not(.moment){
        left: 0px !important;
        // > .main{
        //     left: 25px;
        // }
        > .min{
            box-shadow: 1px 0px 1px 0px #999;
        }
    }
}
/**
.menu{
    display: inline-block;
    position: fixed;
    top: 0;
    left: 0;
    text-align: center;
    background:#efe;
    > fieldset{
        display: block;
        padding: 5px 0px;
        margin: 0px 5px;            
        border:none;
        border-radius: 2px;
        border-top: 1px solid #bbb;
        user-select:none;
        -ms-user-select:none;
        > legend{
            display: none;
            margin: 0px 20px;
            line-height: 25px;
            text-align: left;
            color: #999;
            > i.fa{
                font-weight: bold;
                cursor: pointer;
            }
        }
        > i.fa{
            display: block;
            font-size: 2em;
            cursor: pointer;
            padding: 3px;
            margin: 0px 12px;
            text-shadow: 1px 1px 1px #000;
            &.fa-sign-out{
                color: #aaa;
                text-shadow: 1px 1px 1px #888;
            }
            &.has{
                color:#f00
            }
        }
    }  
    &:hover{
        z-index: 1000000;
    }
}
 */
</style>