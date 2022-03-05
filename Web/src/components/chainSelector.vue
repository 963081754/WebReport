<template>
    <r-minipopup ref="minipopup1" :visible.sync="visiblePopup" :title="title" @close="$emit('close')" :shade="true">
        <div class="wall chainSelector" :class="{isLittle,isConfig}">
            <r-declare v-if="isConfig" class="explain" :left="-230" :content="explain"/>
            <div class="tools" v-if="isConfig && !isLittle">
                <button class="r-fresh noQuerys" v-if="noQuerys.length>0" raw>
                    <i class="fa fa-search-plus"/>添加条件
                    <ul>
                        <li v-for="field in noQuerys" @click.stop="addQuery(field.name)" :key="field.name">
                            {{field.cname}}
                        </li>
                    </ul>
                </button>
                <!-- <button class="r-fresh" @click.stop="openMebinder" raw>
                    <i class="fa fa-user-circle-o userSearch"><label class="handle"></label></i>前台类型+登录约束
                </button> -->
            </div>
            <ul class="searcher" v-if="!isLittle">
                <li v-for="field in querys" :key="field.name">
                    <i class="fa fa-search-minus" @click.stop="removeQuery(field.name)" hint="移除该条件" v-if="isConfig"></i>
                    <label>{{field.cname}}：</label>
                    <input v-model.trim="desires[field.name]" @keydown.enter="search" class="r-fresh" raw>
                </li>
                <li v-if="querys.length > 0">
                    <button class="small" @click.stop="search" raw>
                        <i class="fa fa-search"/>搜索(enter)
                    </button>
                </li>
            </ul>
            <div class="tableWrap" :class="{loading}" v-if="instance.fields.length > 0">
                <table class="table">
                    <thead>
                        <tr>
                            <td class="radio">单选</td>
                            <td v-for="(field,index) in fields" :class="`td${index+1}`" :key="field.name" title="单击：修改名称">
                                <span class="cname">
                                    {{field.cname}}
                                </span>
                                <input class="r-fresh cname" v-model.trim.lazy="field.cname" :placeholder="field.cname || field.name" @change="changeCname(field)" v-if="isConfig" @focus="$event.target.select()" raw>
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in list" :class="{checked:checkedValue==row[majorKey]}" :key="row[majorKey]">
                            <td class="radio">
                                <label>
                                    <input type="radio" v-model="checkedValue" :value="row[majorKey]" :disabled="isConfig" >
                                </label>
                            </td>
                            <td v-for="(field,index) in fields" :class="`td${index+1}`" :key="field.name">                                
                                <template v-if="index === 1">                                    
                                    <label class="status" :style="getColorStyle(colors[row[majorKey]])">{{row[field.name]}}</label>
                                    <i class="fa fa-pied-piper" v-if="isConfig" @click.stop="openColorPicker(row[majorKey],$event)" hint2l2 hint2="单击:分配颜色"/>
                                </template>
                                <template v-else>{{row[field.name]}}</template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <pagingbar class="pager" v-if="!isLittle" @refresh="loadPaging" :page.sync="page" :pageTotal="data.pageTotal" :asyncTotal="data.total" />
        </div>
        <!-- <chainMebinder v-if="isConfig && visible_chainMebinder" :visible.sync="visible_chainMebinder" :instance="instance" /> -->
        <colorPicker v-if="picker.visible" :visible.sync="picker.visible" :value.sync="colors[picker.value]" :site="picker.site" @update:visible="submit" />
    </r-minipopup>
</template>

<script>
import mixin from '@/components/chainPopup/mixin'
const pagingbar  = () => import('@/components/paging.vue')

export default {
    components:{ pagingbar },
    mixins:[mixin],
    props:{
        isConfig:{
            type:Boolean,
            required:false,
            default:false
        }
    },
    data(){
        return {
            data:{
                list:[],
                pageIndex:1,
                pageSize:50,
                total:0,
                pageTotal:0,
                pageCount:0
            },
            list:[],
            desires:{},
            checkedValue:null,
            isLittle:false
        }
    },
    computed:{
        title(){
            if(!this.instance.id) return '选择器 缺失！'

            if(this.isConfig){
                if(!this.isLittle){
                    return `${this.instance.name} 选择器(设置 查询栏、列名、标签颜色)`
                }else{
                    return `${this.instance.name} 下拉数据(设置 列名、标签颜色)`
                }
            }else{
                return `${this.instance.name} 选择器`
            }            
        },
        page:{
            get(){
                return {
                    pageIndex: this.data.pageIndex,
                    pageSize: this.data.pageSize
                }
            },
            set({ pageIndex, pageSize }){
                this.data.pageIndex = pageIndex
                this.data.pageSize = pageSize
                this.loadPaging()
            }
        },
        explain(){
            if(!this.isLittle){
                return [`单击<i class='fa fa-search-plus'></i>与<i class='fa fa-search-minus'></i>可以添加、移除查询条件`,'每个条件都是<模糊匹配>。','单击表头的列名，可以<修改列名称>',`单击第2列的<i class='fa fa-pied-piper' style='color:#f00;'></i>，可以给它<分配颜色>`]
            }else{
                return ['单击表头的列名，可以<修改列名称>',`单击第2列的<i class='fa fa-pied-piper' style='color:#f00;'></i>，可以给它<分配颜色>`]
            }
        },
        querys(){
            return this.instance.fields.filter(f=>
            !this.instance.noQuerys.find(t=>t===f.name)
            )
        },
        noQuerys(){
            return this.instance.fields.filter(f=>this.instance.noQuerys.find(t=>t===f.name))
        },
        desiresSign(){
            return JSON.stringify(Object.entries(this.desires).filter(t=>t[1]))
        } // 如果desires=空，则demanSign='[]'
    },
    watch:{
        id:{
            async handler(){
                this.desires = {}
                delete this.__desiresSigns
                
                await this.loadPaging()
                if(this.$refs.minipopup1){
                    this.$refs.minipopup1.toMiddle()
                }
            },
            immediate:true
        }, // 加载完 居中
        checkedValue(){
            const item = this.list.find(t=>t[this.majorKey] === this.checkedValue)
            this.$emit('select',{
                id: this.checkedValue,
                name: item[this.instance.nameField.name]
            })
        },
        desires:{
            handler(){
                if(!this.isLittle) return // 小于等于50条，才使用下面的代码（客户端搜索）

                let list = [...this.data.list]
                Object.entries(this.desires).filter(t=>t[1]).forEach(([key,value])=>{
                    const val = value.toLowerCase()
                    list = list.filter(t=>t[key] === null || t[key] === undefined || t[key].toString().toLowerCase().includes(val))
                })
                this.list = list
            },
            deep:true
        }, // 根据 查询条件，在客户端 过滤列表
        'getters.tstUser':{
            handler(){
                this.loadPaging()
            }
        } // 管理后台 用到，真郁闷。
    },
    methods:{
        loadPaging(){
            this.__desiresSigns = this.__desiresSigns || {}
            const desiresSign = this.desiresSign
            let asyncTotal = this.__desiresSigns[desiresSign]
            const withTotal = asyncTotal === undefined
            const sign = this._sign = Math.random()

            if(withTotal){
                this.data.total = -1
                asyncTotal = this.__desiresSigns[desiresSign] = this.chainApi.getPagingTotal({sign}).then(total=>{
                    this.__desiresSigns[desiresSign] = total
                    this.isLittle = desiresSign === '[]' && total <= 50
                    if(this.isLittle){
                        this.$emit('onIsLittleSqlChain',this.id)
                    }
                    return total
                }).catch(error=>{
                    delete this.__desiresSigns[desiresSign]
                    throw error
                })
            }
            
            this.loading = true
            return this.chainApi.dataPaging(this.id, this.data.pageIndex, this.data.pageSize,this.desires, sign,this.getters.tstUser,withTotal,asyncTotal)
            .then(({paging})=>{
                if(this._sign !== sign) return // 不是最新请求，抛弃

                paging.total = asyncTotal
                this.data = paging
                this.list = [...this.data.list]
            }).catch(error=>{
                if(this._sign !== sign) return // 不是最新请求，抛弃

                if(this.data.total === -1){
                    this.data.total = Object.freeze(Promise.reject({message:'超时'}))
                }
                throw error
            }).finally(()=>{
                if(this._sign !== sign) return // 不是最新请求，抛弃
                
                this.loading = false
            })
        },
        async loadPaging_旧的_合并了总条数(){
            // this.loading = true
            // this._sign = Math.random()
            // try{
            //     const { paging, sign } = await this.chainApi.dataPaging(this.id, this.data.pageIndex, this.data.pageSize,this.desires, this._sign,this.isConfig ? this.getters.tstUser:null)
            //     if(this._sign !== sign) return // 不是最新请求，抛弃

            //     this.data = paging
            //     this.list = [...this.data.list]
            //     if(JSON.stringify(this.desires) === '{}'){
            //         this.enabledSearchButton = this.data.total > 50
            //     } // 只有50条，搜索按钮 不出现
            // }finally{
            //     this.loading = false
            // }
        },
        search(){
            this.page = {
                pageIndex:1,
                pageSize:this.data.pageSize
            }
        },
        async removeQuery(name){
            await this.chainApi.removeQuery(this.id,name)
            this.$delete(this.desires,name)
        },
        async addQuery(name){
            await this.chainApi.addQuery(this.id,name)
        }
    }
}
</script>

<style lang="scss" scoped src="@/components/chainPopup/css.scss"></style>
<style lang="scss" scoped>
.chainSelector{
    // > .explain{
    // }
    > .tools{
        border: 1px solid #dee;
        border-left: none;
        background: #fee;
        border-right: none;
        button.noQuerys{
            >ul{
                display: none;
                position: fixed;
                z-index: 10;
                background: #fff;
                box-shadow: 1px 1px 4px 0px #333;
                text-align: left;
                > li{
                    cursor: pointer;
                    min-width: 100px;
                    padding: 2px 10px;
                    &:nth-child(odd){
                        background: #fee;
                    }
                }
            }
            &:hover{
                >ul{
                    display: block;
                }
            }
        }
    }
    > .searcher{
        > li{
            display: inline-block;
            padding: 3px;
            > label{
                display: inline-block;
                height: 25px;
                line-height: 25px;
            }
            > input{
                max-width: 100px;
            }
            > i.fa{
                cursor: pointer;
                padding: 0px 3px;
            }
        }
    }
    > .tableWrap{
        .table{
            tbody{ 
                tr.checked > td{
                    background: #ddf;
                }
            }
        }
    }
    > .pager{
        background: #fee;
    }
}
</style>