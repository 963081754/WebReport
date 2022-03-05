<template>
    <r-minipopup :visible.sync="visiblePopup" title="链接设计器" icon="anchor">
        <div class="linker">
            <div class="toolbar">                
                <span class="a" @click.stop="visible_keys=!visible_keys" hint="标签 是链接列所在行的各个单元格的值">
                    显示可用{标签}
                </span>
                <span class="h200" hint="如果用户没有打开 目标报表 的权限，系统会查找与该 目标报表 共享SQL的报表，打开有权限的，找不到才提示没有权限。">
                    <i class="fa fa-question-circle-o"/>“目标报表”说明
                </span>
            </div>        
            <table>
                <tr class="head">
                    <td @click.stop="addLink('report')" hint="单击添加“报表链接”">
                        <i class="fa fa-plus"/>
                    </td>
                    <!-- <td>链接类型</td> -->
                    <td>链接列</td>                                
                    <td>目标报表</td>
                    <td style="text-align:center;">
                        目标报表的条件 = 当前报表的列值
                    </td>
                    <td>弹窗模式</td>               
                </tr>
                <template v-for="(item,i) in reportLinks">
                <tr class="body" :key="'report'+i">
                    <td rowspan="2" @click.stop="removeLink(item)" hint="单击删除该“报表链接”">
                        <i class="fa fa-minus"/>
                    </td>
                    <td>
                        <r-combobox class="combobox" v-model="item.column" :items="columns.filter(t=>t.enabled && !t.hide)" :vField="'ename'" :tField="'cname'" :nullable="false" :autoWidth="true">
                            <template v-slot:header>
                                <div class="header">
                                    <label>字段名/编号</label>
                                    <label>中文名</label>
                                </div>
                            </template>
                            <template v-slot:default="{data}">
                                <div class="item">
                                    <label>{{data.ename}}</label>
                                    <label>{{data.cname}}</label>
                                </div>
                            </template>
                        </r-combobox>
                    </td>
                    <td>
                        <r-combobox v-model.trim="item.target" :items="stairReports" :vField="'id'" :tField="'name'" :nullable="false" :autoWidth="true"/>
                    </td>
                    <td>
                        <div v-for="(param,i) in item.params" :key="'param'+i">
                            <r-combobox class="combobox" v-model.trim="param.name" :items="params[item.target] || []" :vField="'ename'" :tField="'cname'" :nullable="false" :autoWidth="true">
                                <template v-slot:header>
                                    <div class="header">
                                        <label>字段名/编号</label>
                                        <label>中文名</label>
                                    </div>
                                </template>
                                <template v-slot:default="{data}">
                                    <div class="item">
                                        <label>{{data.ename}}</label>
                                        <label>{{data.cname}}</label>
                                    </div>
                                </template>
                            </r-combobox>
                            =
                            <r-combobox class="combobox" v-model.trim="param.value" :items="columns.filter(t=>t.enabled)" :vField="'ename'" :tField="'cname'" :nullable="false" :autoWidth="true">
                                <template v-slot:header>
                                    <div class="header">
                                        <label>字段名/编号</label>
                                        <label>中文名</label>
                                    </div>
                                </template>
                                <template v-slot:default="{data}">
                                    <div class="item">
                                        <label>{{data.ename}}</label>
                                        <label>{{data.cname}}</label>
                                    </div>
                                </template>
                            </r-combobox>
                            <span class="remove" @click.stop="removeParam(item.params,param)" hint="单击删除该 参数">
                                <i class="fa fa-minus"/>
                            </span>
                            <span class="add" @click.stop="addParam(item.params)" hint="单击添加 参数">
                                <i class="fa fa-plus"/>
                            </span>
                        </div>
                        <span v-if="item.params.length===0" class="add" @click.stop="addParam(item.params)" hint="单击添加 参数">+</span>
                    </td>
                    <td rowspan="2">
                        <!-- <r-toggle v-model="item.isMini" :iconMode="3" label="迷你窗口" hint="隐藏查询栏和分页栏(如果条数少)" /><br/> -->
                        <!-- <r-toggle v-model="item.isOne" :iconMode="3" label="单弹窗" hint="所有链接共用一个弹窗" /><br/> -->
                        <r-toggle v-model="item.isChild" :iconMode="3" label="子弹窗" hint="子窗口/独立窗口" /><br/>
                        <r-toggle v-model="item.isCover" :iconMode="3" label="禁用默认值" hint="禁用目标报表的默认值与非空设置" />
                    </td> 
                </tr>
                <tr class="body" :key="'report_'+i">
                    <td colspan="3" class="title">
                        <label>弹窗标题：</label>
                        <input class="r-fresh" v-model="item.title" placeholder="请输入鼠标提示（同时为 弹窗标题）" raw>
                    </td>
                </tr>
                <tr class="split" :key="'report__'+i">
                    <td colspan="5"></td>
                </tr>
                </template>

                <tr class="head">
                    <td @click.stop="addLink('url')" hint="单击添加“URL链接”">
                        <i class="fa fa-plus"/>
                    </td>
                    <!-- <td>链接类型</td> -->
                    <td>链接列</td>                                
                    <td class="url" colspan="3">
                        目标URL
                    </td>
                </tr>
                <tr class="body" v-for="(item,i) in urlLinks" :key="'url_'+i">
                    <td @click.stop="removeLink(item)" hint="单击删除该“URL链接”">
                        <i class="fa fa-minus"/>
                    </td>
                    <!-- <td>URL</td> -->
                    <td>
                        <r-combobox v-model="item.column" :items="columns" :vField="'ename'" :tField="'cname'" :nullable="false" :autoWidth="true"/>
                    </td>               
                    <td colspan="3" class="url">
                        <input class="r-fresh" v-model.trim="item.target" :placeholder="urlTemplate" raw/>
                    </td>
                </tr>
            </table>

            <r-minipopup :visible.sync="visible_keys" title="全部可用的{标签}" :shade="true" icon="tags">
                <table class="labels">
                    <tr class="head">
                        <td>{标签}</td>
                        <td>说明</td>
                    </tr>
                    <tr v-for="c in labels" :key="c.key">
                        <td>
                            <input :value="`{${c.key}}`" @click.stop="copyLabel" readonly raw>
                        </td>
                        <td>{{c.name}}</td>
                    </tr>
                </table>
            </r-minipopup> 
        </div>
    </r-minipopup>
</template>

<script>
import { Link } from '@/models'
export default {
    inject: ['getters','reportApi','getColumns'],
    props:{
        visible:{
            type:Boolean,
            required:true
        },
        links:{
            type:Array,
            required:true
        }
    },
    data(){
        return {
            stairReports: [],
            params:{},
            urlTemplate:Object.freeze(`请输入URL，如：https://www.baidu.com/s?wd={标签}`),
            visible_keys:false
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
        reportLinks(){ 
            const list = this.links.filter(t=>t.type === 'report')
            list.forEach(item=>{
                item.isMini = true
                item.isOne = true
            })
            return list
        },
        urlLinks(){
            return this.links.filter(t=>t.type === 'url')
        },
        reportIds(){
            return this.reportLinks.map(t=>t.target)
        },
        columns(){
            return this.getColumns()
        },
        labels(){
            const list = this.columns.map(t=>({key:t.ename,name:t.cname}))
            this.columns.filter(t=>t.kv).forEach(column=>{
                const item = list.find(t=>t.key === column.ename)
                item.name = `${item.name} 编号`
                list.splice(list.indexOf(item)+1,0,{key:`${column.ename}#名称`,name:`${column.cname} 名称`})
            }) // 绑定chain的，多一个{xxx#名称}标签
            this.columns.filter(t=>t.format && !t.kv).forEach(column=>{
                const item = list.find(t=>t.key === column.ename)
                item.name = `${item.name} 原始值`
                list.splice(list.indexOf(item)+1,0,{key:`${column.ename}#格式化值`,name:`${column.cname} 格式化值`})
            }) // 有 格式化的，多一个{xxx#格式化值}标签
            return list
        }
    },
    watch:{
        reportIds:{
            handler(ids){
                ids.forEach(id=>id && this.loadDemands(id))
            },
            immediate:true
        }
    },
    created(){
        this.loadReportsStairMode()
    },
    methods:{
        async loadReportsStairMode(){
            const _reports = await this.reportApi.getListAsSimple()
            const reports = _reports.map(t=>({
                    id:t.id,
                    pid: t.from_id ? t.from_id : `c_${t.category_id}`,
                    name: t.name
                }))
            const categorys = this.getters.categorys.map(t=>({
                    id: `c_${t.id}`,
                    pid: `c_${t.pid}`,
                    name: t.name,
                    disabled: true
                })) // 为了不与report.id冲突
            const list = categorys.concat(...reports)
            
            this.stairReports = Object.freeze(list.buildTree('c_0'))
        },
        async loadDemands(reportId){
            if(this.params[reportId]) return

            const report = await this.reportApi.getFull(reportId,true)
            const params = report.demands.filter(t=>t.enabled).map(d=>{
                const c = report.columns.find(t=>t.ename === d.ename)
                return {ename:d.ename,cname: d.cname || c && c.cname}
            })
            this.$set(this.params,reportId,Object.freeze(params))
        },
        addLink(type){
            this.links.push(Link(type))
        },
        removeLink(item){
            this.links.splice(this.links.indexOf(item),1)
        },
        removeParam(params,param){
            params.splice(params.indexOf(param),1)
        },
        addParam(params){
            params.push({name:'',value:''})
        },
        copyLabel({target}){
            target.select()
            document.execCommand("copy")
            this.$message.success('已复制到剪贴板',500)
            this.visible_keys = false
        }
    }
}
</script>

<style lang="scss" scoped src="@/components/chainSelect/css.scss"></style>
<style lang="scss" scoped>
.linker{
    > .toolbar{
        height: 30px;
        line-height: 30px;
        > span{
            margin-right: 20px;
        }
    }
    > table{
        border-collapse: collapse;
        > tr{
            td{
                padding: 5px;
                vertical-align: top;
                border: 1px solid #bca;
            }
            > td:first-child{
                cursor: pointer;
                font-weight: bold;
            }
        }
        > tr.head{
            background: #ecb;
            // background: #432;
            td.url{
                >span{
                    cursor: pointer;
                    // color: #f00;
                }
                table{
                    border-collapse: collapse;
                    input{
                        border: none;
                        outline: none;
                    }
                }
            }
        }
        > tr.body{                
            td{
                // border-top: 1px solid #987 !important;
                &:nth-child(1),
                &:nth-child(5){
                    vertical-align: middle;
                }
                &.title,
                &.url{
                    // padding: 1px;
                    vertical-align: middle;
                    > input{
                        width: 100%;
                        // border: none;
                    }
                }
                &.title{
                    font-weight: normal;
                    > input{
                        width: calc(100% - 65px);
                    }
                }
                span.remove,span.add{
                    font-weight: bold;
                    font-size: 14px;
                    padding:0px 5px;
                    cursor: pointer;
                }
                span.remove{
                    margin-left: 5px;
                }
                > span.add{
                    float: right;
                }
            }
        }
        > tr.split{
            > td{
                padding: 3px;
                border: none;
            }
        }
    }

    table.labels{
        border-collapse: collapse;
        line-height: au;
        td{
            padding: 3px;
            border: 1px solid #dcb;
        }
        tr.head{                
            > td{
                position: sticky;
                top: 0px;
                background: #ecb;
            }
        }
        tr:not(.head) > td:nth-child(1){
            padding: 1px;
        }
    }
}
</style>