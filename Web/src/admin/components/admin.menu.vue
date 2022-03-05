<template>
 <!-- v-move="'.min > span'" -->
    <div class="menu" :class="{hide,moment}" @mouseenter.stop="hide=true">
        <div class="main">
            <ul class="list">
                <li class="head">
                    <i class="fa fa-bars"/>
                    <span class="userType toff">
                        {{currentUserType.name}} 菜单
                    </span>
                    <i class="fa fa-angle-double-down"/>
                    <typeSelector class="typeSelector1" @updateHash="$emit('update:hash',$event)"/>
                </li>
                <li class="users" v-delayHover>
                    <i class="fa fa-users"/>登录用户 模拟 
                    <!-- <label style="font-size:2em;">»</label> -->
                    <simulateUserSelector class="simulateUserSelector1" @selected="tstUserSelected" />
                </li>
                <li @click.stop="openManager('sqlCreator')">
                    <i class="fa fa-quora"/>创建报表<span>（{{currentUserType.name}}）</span>
                </li>
                <li @click.stop="openManager('categoryManage')">
                    <i class="fa fa-th-large"/>目录管理<span>（{{currentUserType.name}}）</span>
                </li>
                <li @click.stop="openManager('reportManage')">
                    <i class="fa fa-file-text"/>报表管理<span>（{{currentUserType.name}}）</span>
                </li>
                <li @click.stop="openManager('userChainManage')">
                    <i class="fa fa-paperclip"/>别针管理<span>（{{currentUserType.name}}）</span>
                </li>
                <li @click.stop="openManager('chainManage')">
                    <i class="fa fa-paperclip"/>别针管理<span>（公共）</span>
                </li>
                <li @click.stop="openManager('databaseManage')">
                    <i class="fa fa-database"/>数据库管理<span>（公共）</span>
                </li>
                <li @click.stop="openManager('settingEditor')">
                    <i class="fa fa-gear"/>基本设置<span>（公共）</span>
                </li>
                <li @click="openFront" class="openFront a">
                    <i class="fa fa-hand-o-right"/>
                    打开前台<span>（{{currentUserType.name}}）</span>
                </li>
                <li class="signout" @click.stop="logout">
                    <i class="fa fa-sign-out"/>退出
                </li>
                <li class="info">
                    <label class="tof">当前模拟 登录用户：</label><br/>
                    <template v-if="getters.tstUser.id">
                        <span>
                            {{currentUserType.name}}
                            <template v-if="getRoleNames(getters.tstUser.roles)">
                                （{{getRoleNames(getters.tstUser.roles)}}）
                            </template>                                
                            <br/>
                            {{getters.tstUser.name || getters.tstUser.username}}
                        </span>
                    </template>
                    <!-- <template v-if="getters.tstUser.id">
                        <span class="info-types" v-delayHover>
                            <span>{{currentUserType.name}} <i class="fa fa-angle-double-up"/> </span>
                            <typeSelector class="typeSelector1" @updateHash="$emit('update:hash',$event)"/>
                        </span><br/>
                        <span class="info-users" v-delayHover>
                            <span>
                                {{getters.tstUser.name || getters.tstUser.username}} <i class="fa fa-angle-double-up"/>
                                <br/>
                                {{getRoleNames(getters.tstUser.roles)}} <i class="fa fa-angle-double-up"/>
                            </span>
                            <simulateUserSelector class="simulateUserSelector1" :dir="true" @selected="tstUserSelected" /> 
                        </span>
                    </template> -->
                    <div v-else>无</div>
                </li>
            </ul>
        </div>
        
        <div class="min"  v-move="" @dblclick.stop="hiding" @mouseenter.stop="moment=false">
            <!-- <i class="fa fa-thumb-tack tack" @click.stop="hiding" :hint="hide?'固定':'隐藏'"></i> -->
            <i class="fa fa-bars"/>
            {{currentUserType.name}}
            <!-- 菜 单 -->
            <!-- <i class="fa fa-hand-o-right" @click="openFront" :hint="`打开前台(${currentUserType.name})`"></i> -->
            <!-- <i class="fa fa-sign-out" @click.stop="logout" hint="退出"></i> -->
        </div>
    </div>
</template>

<script>
const simulateUserSelector = ()=> import('@/admin/components/simulateUserSelector.vue')
const typeSelector = ()=> import('@/admin/components/typeSelector.vue')

export default {
    components:{ simulateUserSelector, typeSelector },
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
            return this.getters.currentUserType || {}
        }
    },
    methods:{
        hiding(){
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
        openFront(){
            window.open(`/${this.currentUserType.path}`,'_blank')
        },
        tstUserSelected(){},
        getRoleNames(roleids = []){
            return this.getters.roles.filter(t=>roleids.includes(t.id)).map(t=>t.name).join('，')
        }
    }
}
</script>

<style lang="scss" scoped>
.menu{
    display: inline-block;
    z-index: 10000;
    position: fixed;
    top: 0;
    left: 0px !important;
    transition: left 200ms;
    text-align: center;

    user-select:none;
    -ms-user-select:none;
    max-width: 200px;
    height: 100%;    
    > .main{
        height: 100%;
        > .list{
            height: 100%;         
            background:#fff;
            // border-right: 1px solid #765;
            box-shadow: 0px 0px 2px 0px #765;

            text-align: left;
            > li{
                display:flex;
                align-items: center;

                height: 30px;
                padding: 0px 20px 0px 0px;
                cursor: pointer;
                > span{
                    color: #bbb;
                    font-size: 0.8em;
                }
                > i.fa{
                    width: 30px;
                    text-align: center;
                }
                &:hover:not(.head):not(.info){
                    background: #fcb;
                }
                &.head{
                    background: #ecb;
                    // background: #765;
                    // color: #fff;
                    padding-right: 0px;
                    // position: relative;
                    > i.fa{
                        color: inherit;
                    }
                    > *:not(ul,li){
                        height: 30px;
                        line-height: 30px;
                    }
                    > span.userType{
                        flex-grow: 1;
                        color: inherit;
                        > i.fa{
                            color: inherit;
                        }
                    }
                    
                    position: relative;
                    > .typeSelector1{
                        display: none;
                        z-index: 1;
                        position: absolute;
                        top: 100%;
                        left: 0;
                        min-width: 100%;
                    }
                    &:hover{
                        > .typeSelector1{
                            display: block;
                        }
                    }
                }
                &.users{
                    color: #f00;
                    > i.fa{
                        color: inherit;
                    }
                    position: relative;
                    > .simulateUserSelector1{
                        display: none;
                        position: absolute;
                        left: 100%;
                        top: 0px;
                    }
                    &.delayHover{
                        > .simulateUserSelector1{
                            display: block;
                        }
                    }
                }
                &.signout{
                    color: #888;
                    > i.fa{
                        color: inherit;
                    }
                }
                &.info{
                    display: block;
                    padding: 10px 10px 0px 10px;  
                    line-height: 1.5em;    
                    > label,> span{
                        // display: block;
                        color: #888;
                    }
                    > span{
                        color: #f00;
                        white-space: normal;
                        line-height: 1.5em;
                        &.info-types,
                        &.info-users{
                            > span{
                                color: inherit;
                            }
                        }
                        &.info-types{
                            position: relative;
                            > .typeSelector1{
                                display: none;
                                position:absolute;
                                bottom: 100%;
                            }
                            &.delayHover > .typeSelector1{
                                display: block;
                            }
                        }
                        &.info-users{
                            position: relative;
                            > .simulateUserSelector1{
                                display: none;
                                position:absolute;
                                bottom: 0;
                                left: calc(100% - 10px);
                            }
                            &.delayHover > .simulateUserSelector1{
                                display: flex;
                            }
                        }
                    }
                }
            }
        }
    }
    > .min{
        z-index: -1;
        position: fixed;
        top: calc(50% - 50px);
        left: 0px !important;
        width: 25px;
        padding: 8px 0px;
        background: #fff;
        border: 1px solid #432;
        border-top-right-radius: 10px;
        border-bottom-right-radius: 7px;
        box-shadow: 0px 0px 2px 0px #432;
        // writing-mode:tb-rl;
        > i.fa{
            // padding: 5px;
            cursor: pointer;
        }
        &:hover{
            z-index: 1 !important;
        }
    }
    &.hide{
        left: -1000px !important;
        > .min{
            // z-index: 1 !important;
            > i.fa-thumb-tack{
                color: #999;
            }
        }
    }
    &:hover:not(.moment){
        left: 0px !important;
        > .min{
            z-index: -1;
        }
    }
}
</style>