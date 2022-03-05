<template>
    <div class="taskbar" v-move="'li.move'">
        <ul :class="{hide:hide,hide2}" v-sort="{list,offset:2}" @mouseenter.stop="hide2=false" @mouseleave.stop="hide2=true">
            <li class="move" hint="按住移动" v-show="popups.length > 0">
                <i class="fa fa-arrows"></i>
            </li>
            <li ref="fixed" class="fixed" @click.stop="toHide" v-if="popups.length > 0">
                <i class="fa fa-thumb-tack" hint="显示/隐藏 任务栏"/>
            </li>
            <li ref="items" v-for="(item) in list" :keyId="item.id" @click.stop="switchPopupVisible(item)" :class="{item:true, active:item === active}" :hint="item.name" :key="item.id">
                <i v-if="item.icon" :class="`fa fa-${item.icon} icon`"></i>
                <span class="toff">{{item.name}}</span>
                <i class="fa fa-times-circle close" @click.stop="close(item)"/>
            </li>
            <li class="closeAll" v-if="popups.length > 1" @click.stop="closeAll" hint3="全部关闭">
                <i class="fa fa-times-circle"/>
            </li>
        </ul>
    </div>
</template>

<script>
export default {
    props:{
        popups:{
            type:Array,
            required:true
        }, // 不能直接用popups绑v-for来v-sort,外面的popup的html是手动改变了的；所以需要data.list做中介
        active:{
            type:Object,
            required:false
        }
    },
    data(){
        return {
            hide:false,
            hide2:false,
            list:[],
        }
    },
    watch:{
        popups:{
            handler(){
                this.list = this.list || this.popups.map(t=>Object.freeze(t))
                this.list = this.list.filter(t=>this.popups.indexOf(t) !== -1)
                this.popups.filter(t=>this.list.indexOf(t) === -1).forEach(newItem=>{
                    this.list.push(Object.freeze(newItem))
                })
            },
            immediate:true
        } // 为了 排序(v-sort)不影响外面的HTML(popups对应的列表绑定)，所以重新建立一个LIST,不直接用popups
    },
    methods:{
        toHide(){
            this.hide = !this.hide
            this.hide2 = true
        },
        switchPopupVisible(item){
            this.$emit('switchPopupVisible',item)
        },
        close(item){
            this.$emit('closeOne',item)
        },
        closeAll(){
            this.$message.confirm('确定关闭所有窗口吗？').then(()=>{
                this.$emit('closeAll')
            }).catch(()=>{})
        },
        getPoint(id){
            // const index = this.list.findIndex(t=>t.id === id) // 拖拉后，位置与index不对应，不能用index。
            return new Promise((resolve)=>{
                this.$nextTick(()=>{
                    const el = this.hide ? this.$refs.fixed : this.$refs.items.find(t=>t.getAttribute('keyId') == id) // 如果隐藏了，那就用li.fixed的位置
                    const point = el.getBoundingClientRect() //this.$refs.items[index].getBoundingClientRect()
                    resolve({
                        left:point.left,
                        top:point.top,
                        height:point.bottom - point.top,
                        width:point.right - point.left
                    })
                })
            })            
        }
    }
}
</script>

<style lang="scss" scoped>
.taskbar{
    z-index: 10000;
    position: fixed;
    top: auto !important;
    bottom: 0px !important;
    left: 40%;    
    > ul{
        display: inline-block;
        background: #fff;
        box-shadow: 0 0 2px 0px #765;
        border: 1px solid #765;
        // border-bottom: none;
        > li{
            display: inline-block;
            padding: 0px 5px;
            margin: 0px 1px;
            height: 30px;
            line-height: 30px;
            cursor: pointer;
            // border-radius: 2px;
            position: relative;            
            &:first-child{
                margin-left: 0px;
            }
            &:last-child{
                margin-right: 0px;
            }
            > *{
                vertical-align: middle;
            }
            > span.toff{
                display: inline-block;
                max-width: 100px;                
            }
            > .icon{
                margin-right: 3px;
            }
            > .close{
                display: none;
                position: absolute;
                top: 0px;
                right: 0px;
            }
            &.item:hover,
            &.item.active{
                background: #ecb;                
                // > *{
                //     color: #fff;
                // }
            }
            &.item:hover{
                > .close{
                    display: block;
                }
            }
        }
        &.hide.hide2{
            > li.fixed{
                height: 25px;
                line-height: 25px;
            }
            > li.item,
            > li.closeAll{
                display: none;
            }
        }
    }
}
</style>