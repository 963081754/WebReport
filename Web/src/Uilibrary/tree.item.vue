<template>
    <ul class="tree">
        <li class="treeLi" :class="item.class" v-for="(item) in list" :key="item.id">
            <div class="treeLiContent">
                <div class="before" :before_itemId="item.id"></div>
                <div class="item" :item_itemId="item.id">
                    <div class="icons">
                        <template  v-if="item.children.length > 0">
                            <!-- 不要 三角形，不好看、不对齐。 -->
                            <!-- <i v-if="item.folded" class="fa fa-caret-right" @click.stop="showLeaf(item)"/>
                            <i v-else             class="fa fa-caret-down"  @click.stop="showLeaf(item)"/> -->

                            <i v-if="item.folded" :class="`fa fa-${item.icon || 'folder'} foldedIcon`" @click.stop="showLeaf(item)"/>
                            <i v-else :class="`fa fa-${item.icon_open || item.icon || 'folder-open'} foldedIcon`" @click.stop="showLeaf(item)"/>                        
                        </template>
                        <template v-else>
                            <i v-if="item.icon" :class="`fa fa-${item.icon} foldedIcon`"/>
                            <i v-else           :class="`fa fa-folder-o foldedIcon`"/>
                        </template>
                    </div>
                    <div class="caller">
                        <slot v-bind:item="item">{{item.name}}</slot>
                    </div>
                </div>
                <div class="after" :after_itemId="item.id"></div>
            </div>
            <treeItem v-if="item.children && item.children.length>0" :list="item.children" :class="{hide:item.folded}">
                <template v-slot:default="{item}">
                    <slot v-bind:item="item"></slot>
                </template>
            </treeItem>
        </li>
    </ul>
</template>

<script>
export default {
    name:'treeItem',
    props:{
        list:{
            type:Array,
            required:true
        }
    },
    methods:{
        showLeaf(item){
            item.folded = !item.folded
            this.$forceUpdate()
        }
    }
}
</script>

<style lang="scss" scoped>
ul.tree{
    padding-left: 1.5em; 
    li{
        > .treeLiContent{
            height: 26px;
            transition: height 150ms;
            border-bottom: 1px solid #ddd;  // 每“行”的底线
            > div.before,
            > div.after{
                height: 3px;
                // background: #00f;
            }
            > div.item{
                height: 20px;
                line-height: 20px;
                padding: 0px 3px;
                white-space: nowrap; // 保证不隐藏 

                display: flex;
                align-items: center;
                > div.icons,
                > div.caller{
                    height: inherit;
                    line-height: inherit;
                }
                > div.icons{
                    > i.fa{
                        width: 1.3em;
                        line-height: inherit;
                        &.foldedIcon{
                            cursor: pointer;
                            text-align: left;
                        }
                        // &.fa-caret-right,
                        // &.fa-caret-down{
                        //     display: none;
                        //     font-size: 20px;
                        //     width: 1.1em;
                        //     text-align: center;
                        //     cursor: pointer;
                        // }
                    }
                }
                > div.caller{
                    flex-grow: 1;
                }
            }
            > div.item.active{
                background: #654 !important;   
                border-radius: 2px;         
                // text-align: right;
                // color: #fff !important; 
                // > *{
                //     color: inherit !important; 
                // }
            }
            > div.before.active,
            > div.after.active,
            > div.item.active{
                position: relative;
                &::before{
                    content: "\f061";
                    font: normal normal normal 14px/1 FontAwesome;
                    font-size: 20px;
                    color: #335;

                    position: absolute;
                    top: -11px;
                    left: -20px;
                }
            }
            > div.before.active{
                // background: #f00;
                border-top: 2px solid #335;
            }
            > div.after.active{
                // background: #f00;
                border-bottom: 2px solid #335;
                &::before{
                    top: auto;
                    bottom: -10px;
                }
            }
            > div.item.active{
                &::before{
                    top: 0px;
                }
            }
            &:hover{
                background: #fcb; 
            }
        }
        // &:nth-child(even){
        //     > .before,> .item,> .after{
        //         background: #000;
        //     }            
        // }
    }

    // > li.dragSource div.item,
    // > li.dragSource div.before,
    // > li.dragSource div.after, // 拖拉中的隐藏起来    
    // &.hide li div.item,
    // &.hide li div.before, // 折叠
    // &.hide li div.after

    > li.dragSource > ul > li, // 拖拉中的隐藏起来
    &.hide > li // 折叠
    {
        display: none;
        &:nth-child(1){ // 优化 收缩的性能，不必所有li都应用transition效果。
            display: block;  
            div.treeLiContent{
                height: 0px;
                padding-top: 0px;
                padding-bottom: 0px;
                overflow: hidden;  
                border-bottom:none;
                div{
                    display: none;
                }  // 隐藏所有子元素，让 渲染更少。
                ul{
                    display: none;
                } // 隐藏 子级
            }
        }
    } 
}
</style>