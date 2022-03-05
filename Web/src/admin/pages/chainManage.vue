<template>
    <div class="manage">
        <div class="tools">                        
            <r-toggle class="switch" v-model="disableSort" :label="disableSort?'解锁排序':'锁定排序'" :iconMode="2" hint="锁定：不能拖拉排序" />
            <button class="r-fresh add" @click.stop="create" raw>
                <i class="fa fa-plus"/>新建
            </button>
            <!-- <span class="remark" v-html="`在报表页面，别针 数据<=50条使用下拉，>50条使用弹窗。`"></span> -->
        </div>
        <div class="mtable" :class="{loading}">
        <table style="width:900px">
            <colgroup >
                <col width="60">
                <col width="150">
                <col width="100%">
                <col width="140">
                <col width="60">
                <col width="100">
            </colgroup>
            <thead>
                <tr>
                    <th>数据源</th>
                    <th>名称</th>                
                    <th>内容</th>
                    <th>数据库</th>
                    <th>数据层级</th>
                    <th>操作</th>
                </tr>
            </thead>
            <tbody v-sort="{list,callback:sorted,disable:disableSort}">
                <tr v-for="(row) in list" :key="row.id">
                    <td>
                        <label class="status const" v-if="row.type === ChainType.enum ">{{row.type}}</label>
                        <label class="status sql" style v-else>{{row.type}}</label>
                    </td>
                    <td>{{row.name}}</td>
                    <td :title="row.values">{{row.values}}</td>
                    <td>
                        {{ row.type === ChainType.sql ? (getters.databases.find(t=>t.id === row.db_id) || {}).cname : null}}
                    </td>
                    <td>{{getLayer(row)}}</td>
                    <td>
                        <i class="edit fa fa-gear" @click.stop="preview(row)" hint2l :hint2="row.type === ChainType.sql ? `预览、设置查询、分配颜色` : `预览、分配颜色`" ></i>
                        <i class="edit fa fa-pencil-square-o" @click.stop="edit(row)" hint2l hint2="修改"></i>
                        <i class="del fa fa-trash-o" @click.stop="del(row)" hint2l hint2="删除"></i>
                    </td>
                </tr>
            </tbody>
        </table>
        </div> 

        <chainColorSetter v-if="previewAttrs.visible && previewAttrs.model.type === ChainType.enum" :visible.sync="previewAttrs.visible" :model="previewAttrs.model" />
        <chainSelector    v-if="previewAttrs.visible && previewAttrs.model.type === ChainType.sql"  :visible.sync="previewAttrs.visible" :id="previewAttrs.model.id" :isConfig="true" />
        <chainCascadePreviewer    v-if="cascadePreviewAttrs.visible"  :visible.sync="cascadePreviewAttrs.visible" :id="cascadePreviewAttrs.model.id" />

        <chainCreator v-if="editAttrs.visible" :visible.sync="editAttrs.visible" :obj="editAttrs.model" @succeeded="succeeded"/>

    </div>
</template>

<script>
import { Chain } from '@/models'
const chainSelector  = () => import('@/components/chainSelector.vue')
const chainCascadePreviewer  = () => import('@/components/chainPopup/cascadePreviewer.vue')
const chainColorSetter  = () => import('@/admin/components/chainColorSetter.vue')
const chainCreator  = () => import('@/admin/components/chainCreator.vue')

export default {
    components:{ chainSelector,chainCascadePreviewer, chainColorSetter, chainCreator },
    inject:['getters','chainApi'],
    props:{
        basics:{
            type:Boolean,
            required:false,
            default:true
        }
    },
    data(){
        return {
            list:[],
            loading:true,
            disableSort:true,
            previewAttrs:{
                visible:false,
                model:null
            },
            cascadePreviewAttrs:{
                visible:false,
                model:null
            },
            editAttrs:{
                visible:false,
                model:null
            }
        }
    },
    computed:{
        listWatchHelper(){
            return {
                a:this.getters.chains,
                b:this.getters.userChains
            }
        }
    },
    watch:{
        listWatchHelper:{
            handler(){
                this.list = this.basics ? this.getters.publicChains : this.getters.userChains
                this.loading = false
            },
            immediate:true
        },
        'previewAttrs.visible'(val){
            if(!val){
                this.previewAttrs.model = null
            }
        },
        'getters.hash'(){
            this.previewAttrs.visible = false
            this.previewAttrs.model = null
            this.editAttrs.visible = false
            this.editAttrs.model = null            
        }
    },
    methods:{
        create(){
            this.editAttrs.model = new Chain({userType:this.basics ? null : this.getters.hash })
            this.editAttrs.visible = true
        },
        edit(row){
            this.editAttrs.model = JSON.parse(JSON.stringify(row))
            this.editAttrs.visible = true
        },
        succeeded(model){
            this.editAttrs.model = null
            this.editAttrs.visible = false
            this.preview(model)
        },
        preview(row){
            if(row.masterKeys && row.masterKeys.pid){
                this.cascadePreviewAttrs.visible = true
                this.cascadePreviewAttrs.model = row
            }else{
                this.previewAttrs.visible = true
                this.previewAttrs.model = row
            }
        },
        del(row){
            this.$message.confirm(`确保没有报表引用到该${row.type}(<b>${row.name}</b>)，删除后引用将失效，但不影响报表运行。<br/>确定删除吗？删除后不可恢复。`)
            .then(()=>{
                this.chainApi.delete(row.id)
            }).catch(()=>{})
        },
        sorted(i1,i2,item){
            // console.log(i1,i2,item)
            this.chainApi.sort(item.id,i2)
        },
        getLayer(row){
            if(row.type === this.ChainType.sql && row.masterKeys.pid){
                return row.masterKeys.layer
            }
            return ''
        }
    }
}
</script>

<style lang="scss" scoped>
.manage{
    > .tools{
        > .remark{
            display: inline-block;
            color: #999;
            margin-left: 10px;
        }
    }
    > .mtable {    
        > table{
            tbody{
                select.preview{
                    min-width: 40px;
                }
                tr.edit{
                    .valuesEditor{
                        transition: height 300ms;
                        width: 100%;
                        height: 25px;
                    }
                }
                label.sql{
                    background: #231;
                    color: #fff;
                }
                label.const{
                    border:1px solid #231;
                    // color: #231;
                    width: 49px;
                    text-align: center;
                }
                tr td:nth-child(1),
                tr td:nth-child(5),
                tr td:nth-child(6){
                    text-align: center;
                }
                tr td:nth-child(3),
                tr td:nth-child(4){
                    padding: 0px 5px;
                    text-align: left;
                }
                tr td:nth-child(2){
                    text-align: right;
                    padding-right: 10px;
                }
                tr td:nth-child(6){
                    overflow: visible;
                }
                tr td:nth-child(5){
                    font-size: 1.1em;
                    font-weight: bold;
                }
            }
        }
    }
}
</style>