<template>
    <div class="catalog">
        <div class="side" v-move>
            <i class="fa fa-align-justify"/>
            报表目录
            <i class="fa fa-sign-out signout" @click.stop="$emit('logout')" hint="退出" hintl0 />
        </div>        
        <!-- 可拉(靠边) -->
        <div ref="main1" class="main" :class="{visible}" @mouseout.stop="visible=undefined">
            <div class="header">
                <span class="title" @click.stop="foldeTree" :hint="allFolded ? '展开目录':'折叠目录'" hintb hintl0>
                    <i v-if="allFolded" class="fa fa-folder-o"/>
                    <i v-else class="fa fa-folder-open-o"/>
                    报表目录
                </span>
                <i class="fa fa-sign-out signout" @click.stop="$emit('logout')" hint="退出" hintb />
            </div>
            <div class="fastList" v-show="stars.length > 0">
                <div>
                    <span v-for="(item) in stars" :class="{active:popups.includes(item)}" @click.stop="openReport(item)" :hint="item.name" :key="item.id">
                        <i :class="`fa fa-${item.icon}`"></i>
                    </span>
                </div>
            </div>
            <r-tree ref="tree1" class="tree1" :list="treeData" :style="{maxHeight:`calc(${getters.clientHeight}px - 30px - 30px - 10px)`}">
                <template v-slot:default="{item}">
                    <div v-if="!item.model" class="treeTr toff isCatelog">{{item.name}}</div>
                    <div v-else class="treeTr toff isReport" @click.stop="openReport(item)" :title="item.name">{{item.name}}</div>                    
                </template>
            </r-tree>    
        </div>        
    </div>
</template>

<script>
export default {
    inject:['getters'],
    props:{
        treeData:{
            type:Array,
            required:true
        },
        stars:{
            type:Array,
            required:true
        },
        popups:{
            type:Array,
            required:true
        }
    },
    data(){
        return {
            allFolded:false,
            visible:true
        }
    },
    methods:{
        openReport(item){
            this.$emit('openReport',item)
        },
        foldeTree(){
            this.allFolded = !this.allFolded
            this.treeData.forEach(item=>{
                item.folded = this.allFolded
            })
            this.$refs.tree1.$forceUpdate()
        }
    }
}
</script>

<style lang="scss" scoped>
.catalog{
    display: inline-block;
    // height: 100%;
    position: fixed;
    z-index: 10000;
    top: 0;
    left: 0;
    > .side{  
        width: 25px;
        background: #fff;
        box-shadow: 2px 2px 2px 0 #432,0 0 0 1px #dcb;
        text-align: center;
        cursor: move;
        padding-top: 5px;

        position: fixed;
        z-index: 2;
        top: calc(50% - 150px);
        left: 0px !important;
        > i.fa{
            cursor: pointer;
            &.signout{
                // padding: 8px 0px;
                width: 25px;
                height: 25px;
                line-height: 25px;
                text-align: center;
            }
        }
        &:hover{
            z-index: 2 !important;
        }
    }
    > .main{
        min-width: 150px;
        height: 100%;
        max-height: 100%;
        overflow: auto;

        position: fixed;
        z-index: 1;
        left: -1000px;
        top: 0;

        transition: left 300ms;
        background: #fff;
        box-shadow: 0 0 2px 0 #765;
        // box-shadow: 2px 2px 2px 0 #432,0 0 0 1px #dcb;
        &.visible{
            left: 0px;
        }
        > .header{
            height: 30px;
            line-height: 30px;
            // padding: 0px 5px;
            background: #ecb;
            border: 1px solid #dba;            

            display: flex;
            > .title{
                flex-grow: 1;
                display: block;
                font-size: 1.1em;
                cursor: pointer;
            }
            > .title > i.fa,
            > i.signout{
                cursor: pointer;
                width: 25px;
                height: 30px;
                line-height: 30px;
                text-align: center;
                font-size: 1.1em;
            }
            // > i.fa-thumb-tack{                
            //     float: right;
            //     cursor: pointer;
            //     line-height: 30px;
            // }
        }
        > .fastList{
            height: 30px;
            line-height: 30px;
            padding: none;
            position: relative;
            > div{
                position: absolute; // absolute使宽度 不超出.fastList
                z-index: 1;
                height: 30px;
                width: 100%;
                overflow: hidden;

                display: flex;
                flex-wrap: wrap;

                background: #fff;
                box-shadow: 0px 1px 1px 0px #987;
                &:hover{
                    height: auto;
                    overflow: visible;
                }
                > span{
                    min-width: 20px;
                    width: calc(20% - 2px);
                    margin: 1px;
                    padding: 0px 5px;
                    height: 28px;
                    line-height: 28px;
                    border-radius: 2px;
                    text-align: center;
                    cursor: pointer;
                    > i.fa{
                        display: inline-block;
                        font-size: 1.2em;                        
                    }
                    &:hover,
                    &.active{
                        background: #231;
                        > i.fa{
                            color: #fff;
                        }
                    }
                }
                &::before{
                    content:'快 捷 图 标';
                    position: absolute;
                    top: calc(50% - .7em);
                    left: 0;
                    display:block;
                    width:100%;
                    text-align: center;
                    word-spacing: .5em;
                    font-size: 1.5em;
                    // color: #eee;
                    opacity: .1;
                }
            }
        }
        > .tree1{
            height: calc(100% - 30px - 30px);
            width: 100%;
            overflow: auto;

            // border-bottom: none;
            // white-space: nowrap; // 保证不隐藏 
            .treeTr{
                max-width: 200px;
                // padding: 0px 10px;
                padding-right: 10px;
                vertical-align: middle;
                &.isReport{
                    cursor: pointer;
                }
            }
        }
    }
    &:hover{
        > .main{
            left: 0px;
        }
        > .side{
            z-index: 0;
        }
    }
}
</style>

<style lang="scss">
.catalog{
    ul.tree li > div.treeLiContent{
        border-bottom:none !important;
    }
}
</style>

