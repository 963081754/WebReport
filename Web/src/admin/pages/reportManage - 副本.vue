<template>
    <div class="manage reportManage" v-onresize="{callback:onresize,dir:'w'}">
        <div class="tools">
            <button class="r-fresh switchTreeState" @click.stop="switchTreeFoldState" raw>
                <i :class="`fa fa-${foldTree?'folder-open-o':'folder-o'}`"/>
                <template v-if="foldTree">折叠</template>
                <template v-else>展开</template>
            </button>
            <r-toggle class="switch" v-model="lockCategory" :label="lockCategory?'解锁目录':'锁定目录'" :iconMode="2" hint="锁定：不能拖拉排序" />
            <r-toggle class="switch" v-model="lockReport" :label="lockReport?'解锁报表':'锁定报表'" :iconMode="2" hint="锁定：不能拖拉排序" />
            <r-toggle class="switch" v-model="roleGrouped" label="角色分组" :iconMode="3" />
            <label>角色：</label>
            <r-select class="roleSelect" v-model.number="querys.role_ids" :multiple="true">
                <r-option v-for="item in getters.roles" :value="item.id" :text="item.name" :key="item.id"/>
            </r-select>
            <label>目录：</label>
            <r-select class="categorySelect" v-model.number="querys.category_id" :parentSelectable="true" :nullable="true">
                <r-option v-for="item in categoryTree" :children="item.children" :value="item.id" :text="item.name" :key="item.id"/>
            </r-select>
            <label>名称：</label>
            <input class="r-fresh nameInput" v-model.trim="querys.name" raw>                       
            <label>数据库：</label>   
            <r-select class="dbSelect" v-model.number="querys.db_id">
                <r-option v-for="item in getters.databases" :value="item.id" :text="item.cname" :key="item.id"/>
            </r-select>
            <r-declare class="explain" :left="-620" :content="[`单击 <i class='fa fa-copy'/> 可以<复制报表>，复制报表与源报表<共享SQL>语句，权限、约束、表头、条件等可独立重新设置`]"/>
        </div>
        <div class="treeTable" :class="{loading}">
            <div class="treeHeader">
                <div><label class="titleName">名 称</label></div>
                <div :style="{width:`${roleColumnWidth}px`}">角 色</div>
                <div>登录用户约束</div>
                <div>数据库</div>
                <div class="opt">操 作</div>
            </div>
            <r-tree ref="tree1" class="tree1" :list="treeData" :rootOptions="{id:0,acceptable:true,acceptSigns:['category']}" @sorted="updateSeq">
                <template v-slot:default="{item}">
                    <div class="treeTr" :class="{from:item.model && item.model.from_id, hide:item.model && item.model.hide,disabled:item.model && !item.model.enabled}">
                        <template v-if="item.model">
                            <div class="toff" :title="item.name">
                                {{item.name}}
                                <template v-if="item.children && item.children.length">
                                    <i :class="`folded fa fa-angle-double-${item.folded?'up':'down'}`" @click.stop="item.folded=!item.folded"></i>
                                </template>
                                {{item.children | count2}}
                            </div>
                            <div class="toff" :title="getNamesByKeys('role',item.model.role_ids)" :style="{width:`${roleColumnWidth}px`}">{{getRoleGroupName(item.model.role_ids)}}</div>
                            <div class="toff" :title="getNamesByKeys('user',[item.model.userKeys,item.model.sqlKeys])"></div>
                            <div class="toff" :title="getNamesByKeys('db',item.model.db_id)"></div>
                            <div class="opt">
                                <i :class="`fa fa-${item.model.star || 'file'} starIcon`" @click.stop="openIconSelector(item.model)" hint2="选择图标"></i>
                                <r-toggle class="show" :checked="!item.model.hide" :iconMode="1" @change="hide(item.model)" :hint2="item.model.hide?'显示':'隐藏'"/>
                                <r-toggle class="enable" :checked="item.model.enabled" :iconMode="0" @change="enable(item.model)" :hint2="item.model.enabled?'禁用':'启用'"/>
                                <i class="sqlIcon fa fa-quora" @click.stop="showSql(item.model)" hint2l hint2="查看SQL语句"></i>
                                <i class="copy fa fa-copy" @click.stop="copy(item.model)" hint2l hint2="复制报表(SQL共享)"/>
                                <i class="edit fa fa-pencil-square-o" @click.stop="openEditer(item.model)" hint2l hint2="修改报表"/>
                                <i class="del fa fa-trash-o" @click.stop="del(item.model)" hint2l hint2="删除报表"/>
                            </div>
                            <div class="disabledLine"></div>
                        </template>
                        <template v-else>
                            <div class="category" @click.stop="item.folded=!item.folded">{{item.name}}{{item.children | count}}</div>
                        </template>
                    </div>
                </template>
            </r-tree>
            <div class="notDataMsg" v-if="treeData.length === 0">没有数据</div>
        </div>
        <sqlDisplay v-if="sqlAttrs.visible" :visible.sync="sqlAttrs.visible" :sql="sqlAttrs.sql" :title="sqlAttrs.name"/>
        <iconSelector v-if="iconAttrs.visible" :visible.sync="iconAttrs.visible" @select="addIcon" />
    </div>
</template>

<script>
import { deepCopy } from '@/utility/utility'
import { Report, TreeItem } from '@/models'
const sqlDisplay  = () => import('@/admin/components/sqlDisplay.vue')
const iconSelector = ()=> import('@/components/iconSelector.vue')

const getReportCount = function(children){
    if(children.length === 0) return 0
    const count = children.filter(t=>t.model).length
    return children.map(item=>{
        return getReportCount(item.children)
    }).reduce((total,n)=>(total+=n),0) + count
}
const buildRawReportLeaf = function(item,lockReport,hasSourceReport){
    return {
        id: `r${item.id}`,
        pid: (!item.from_id || !hasSourceReport()) ? item.category_id : `r${item.from_id}`,
        name: item.name,
        icon: item.star || 'file',
        acceptable: false,
        moveable: item.from_id ? false : !lockReport,
        class: 'reportItem',
        model: item,
        seq: item.seq || 0
    }
}
const roleColumnWidth = 150

export default {
    components:{ sqlDisplay, iconSelector },
    inject: ['getters','reportApi','categoryApi'],
    props:{
        refresh:{
            type:Boolean,
            required:false,
            default:false
        }
    },
    data(){
        return {
            sqlAttrs:{
                visible:false,
                sql:'',
                name:''
            },
            iconAttrs:{
                visible:false,
                report:null
            },
            querys:{
                name:'',
                category_id: null,                
                role_ids: [],
                db_id: null
            },
            list:[], // 报表列表，冻结的
            loading:false,
            foldTree:true,
            lockCategory:true,
            lockReport:true,
            roleGrouped:true, // 角色分组
            
            treeData:[],

            roleColumnWidth:roleColumnWidth
        }
    },
    computed:{
        treeDataWatchObjects(){
            return JSON.stringify({
                loading:this.loading,
                categorys:this.getters.categorys.length === 0,
                querys:this.querys
            })
        },
        categoryTree(){
            return deepCopy(this.getters.categorys).buildTree(0)
        },
        getNamesByKeys(){
            return (type,value)=>{
                switch(type){
                    case 'db':
                        return (this.getters.databases.find(t=>t.id === parseInt(value || 0)) || { cname:'不存在' }).cname
                    case 'role':
                        return (!value || value.length === 0) ? '无限制'
                                : this.getters.roles.filter(t=>value.includes(t.id)).map(t=>t.name).join('\n')
                    // case 'category':
                    //     return (this.getters.categorys.find(t=>t.id === parseInt(value || 0)) || { name:null }).name
                    case 'user':
                        // value = value[0].map(t=>t.ufield).concat((value[1] || []).map(t=>`@${t}`))
                        // return value.length > 0 ? value.join(',') : '无约束' //userKeys + sqlKeys
                        value = value[0].map(({ufield,field})=>`${field}=${ufield}`).concat((value[1] || []).map(t=>`@user_${t}`))
                        return value.length > 0 ? value.join('\n') : '无约束' //userKeys + sqlKeys
                }
                return null
            }
        }
    },
    watch:{
        refresh(){
            this.loadReportLess()
        },
        'getters.hash':{
            async handler(){
                this.loadReportLess()
            },
            immediate:true
        },
        treeDataWatchObjects:{
            handler(){
                // if(val === oldVal) return
                if(this._categorySort){
                    delete this._categorySort
                    return
                } // 自己页面排序的，不需要重新加载
                if(this.list.length === 0 || this.getters.categorys.length === 0){
                    this.treeData = []
                     return
                } // 干脆点

                let list = this.list
                if(this.querys.category_id){
                    const ids = this.getters.categorys.filterChildrenForflat(this.querys.category_id).map(t=>t.id).concat(this.querys.category_id)
                    list = list.filter(t=>ids.includes(t.category_id))
                }
                if(this.querys.db_id){
                    list = list.filter(t=>t.db_id == this.querys.db_id)
                }
                if(this.querys.role_ids.length){
                    list = list.filter(t=>!t.role_ids.length || this.querys.role_ids.find(id=>t.role_ids.includes(id)))
                    // list = list.filter(item=>{
                    //     const copys = list.filter(t=>t.from_id === item.id)
                    //     const has = copys.find(t=>t.role_ids.length === 0 || !!this.querys.role_ids.find(id=>t.role_ids.includes(id)))
                    //     return has || item.role_ids.length === 0 || !!this.querys.role_ids.find(id=>item.role_ids.includes(id))
                    // })
                }
                if(this.querys.name){
                    list = list.filter(t=>t.name.includes(this.querys.name))
                    // list = list.filter(item=>{
                    //     const copys = list.filter(t=>t.from_id === item.id)
                    //     const has = copys.find(t=>t.name.includes(this.querys.name))
                    //     return has || item.name.includes(this.querys.name)
                    // })
                }
                const reportLeafs = list.map(item=>(buildRawReportLeaf(item,this.lockReport,()=>(!!list.find(t=>t.id === item.from_id)))))
                const categoryLeafs = deepCopy(this.getters.categorys).map(item=>{
                    item.sign = 'category'
                    item.moveable = !this.lockCategory
                    item.icon = 'folder-o'
                    item.icon_open = 'folder-open-o'
                    item.class = item.pid === 0 ? 'rootCategory' : undefined
                    return item
                })
                let treeData = categoryLeafs.concat(reportLeafs)
                            .sort(((a,b)=>!a.model === !b.model ? (a.pid === b.pid ? a.seq - b.seq : a.pid - b.pid) : !a.model - !b.model))
                            .map(t=>new TreeItem(t))
                            .buildTree(0)
                this.treeData = treeData
            },
            immediate:true,
            deep:true
        },
        lockReport:{
            handler(){
                this.treeData.eachTree(item=>{
                    if(item.model && !item.model.from_id){
                        item.moveable = !this.lockReport
                    }
                })
            },
            immediate:true
        },
        lockCategory:{
            handler(){
                this.treeData.eachTree(item=>{
                    if(!item.model){
                        item.moveable = !this.lockCategory
                    }
                })
            },
            immediate:true
        }
    },
    mounted(){
        this.$nextTick(()=>{
            if(this.$parent && this.$parent.$parent && this.$parent.$parent.toMiddle){
                this.$parent.$parent.toMiddle()
            }
        }) // 解决：异步加载的缘故，无法居中加载的BUG
    },
    methods:{
        loadReportLess(){
            this.loading = true
            this.reportApi.getListAsSimple().then(data=>{
                this.list = data // deepCopy(data)
                this._roleGroups = [...new Set(this.list.map(t=>t.role_ids).filter(t=>t.length > 1).map(t=>t.sort().join('|')))]
            }).catch(()=>{}).finally(()=>{
                this.loading = false
            })
        },
        openEditer(report){
            let from_name = null
            if(report.from_id){
                from_name = this.list.find(t=>t.id == report.from_id).name
            }
            this.$emit('edit',{ report, from_name})
        },
        async del(report){
            let ask = `确定删除该报表(<b>${report.name}</b>)吗？删除后不可恢复。`
            if(this.list.find(t=>t.from_id === report.id)){
                ask = `删除该报表(<b>${report.name}</b>)将同源自它的复制报表一起删除，<br/>且不可恢复。确定删除吗？`
            }
            this.$message.confirm(ask).then(async ()=>{
                await this.reportApi.delete(report.id)
                {
                    this.treeData.removeTreeItem(`r${report.id}`)
                    this.list.splice(this.list.indexOf(report),1)
                } // 删除treeItem和report model
            }).catch(()=>{})
        },
        copy(report){
            this.$message.prompt(`请输入新报表的名称（复制自：${report.name}）`,report.name,true).then(async (newName)=>{
                const report2 = await this.reportApi.copy(report.id,newName)
                {
                    report2.columns = report2.demands = []
                    const rawLeaf = buildRawReportLeaf(report2,false,()=>true)
                    const treeItem1 = this.treeData.findFromTree(`r${report.from_id || report.id}`)
                    treeItem1.children.splice(treeItem1.children.length,0,new TreeItem(rawLeaf))
                } // 添加到 tree
            }).catch(()=>{})
        },
        async enable(report){
            this._updateModel(report,async (report)=>{
                report.enabled = !report.enabled
                await this.reportApi.enable(report.id,report.enabled)
            })
        },
        async hide(report){
            this._updateModel(report,async (report)=>{
                report.hide = !report.hide
                await this.reportApi.hide(report.id,report.hide)
            })
        },
        showSql(report){
            if(report.from_id){
                const source = this.list.find(t=>t.id === report.from_id)
                report = {sql:source.sql,name:`${report.name}（源自 ${source.name}）`}
            }
            this.sqlAttrs.sql = report.sql
            this.sqlAttrs.name = report.name
            this.sqlAttrs.visible = true
        },
        switchTreeFoldState(){
            this.foldTree = !this.foldTree
            this.treeData.eachTree(item=>{
                // if(!item.model){
                //     item.folded = !this.foldTree
                // }
                item.folded = !this.foldTree
            })           
        },
        async updateSeq({item, seq}){
            if(item.model){
                // item.model.pid = item.pid // 冻结了，不能改；这个页面也不用显示，就不改。
                await this.reportApi.sort({...item.model,category_id:item.pid,seq})  // 报表排序
            }else{
                this._categorySort = true  
                const model = {...this.getters.categorys.find(t=>t.id === item.id),pid:item.pid,seq}
                await this.categoryApi.sort(model) // 目录排序
            }
            // console.log('sort2',item, seq)
        },
        openIconSelector(report){
            this.iconAttrs.visible = true
            this.iconAttrs.report = report
        },
        addIcon(icon){
            this._updateStar(this.iconAttrs.report,icon)

            this.iconAttrs.visible = false
            this.iconAttrs.report = null
        },
        async _updateStar(report,star){
            this._updateModel(report,async (report)=>{
                report.star = star         
                await this.reportApi.updateStar(report.id,report.star)
            })
        },
        _updateModel(report,callback){ // this.list是冻结的(非响应式object)，所以要写这一段来 替换旧的report model
            const index = this.list.indexOf(report)
            report = new Report(deepCopy(report))
            callback(report)
            this.list.splice(index,1,Object.freeze(report))

            {
                const treeItem = this.treeData.findFromTree(`r${report.id}`)
                const children = this.treeData.findFromTree(treeItem.pid).children
                const newTreeItem = new TreeItem({...treeItem,icon:report.star,model:report})                
                children.splice(children.indexOf(treeItem),1,newTreeItem)
            } // 替换treeItem
        },
        getRoleGroupName(role_ids){
            if(!this.roleGrouped) return undefined

            const index = this._roleGroups.findIndex(t=>t === role_ids.join('|'))
            if(index > -1){
                return `角色分组${index + 1}（${role_ids.length}个）`
                // return `<label class="roleGroup">角色分组<b>${index + 1}-${role_ids.length}</b></label>`
            }
            return undefined
        },
        onresize(el){
            this.roleColumnWidth = Math.max(roleColumnWidth,roleColumnWidth + (el.clientWidth - 950)*(4/5))
            console.log(this.roleColumnWidth)
        } // 没法子，用JS控制 角色列的宽
    },
    filters:{
        count(children){
            const n = getReportCount(children)
            return n === 0 ? null : `（${n}）`
        },
        count2(children){
            const n = getReportCount(children)
            return n === 0 ? null :  `（${n+1}）`
        }
    }
}
</script>

<style lang="scss" scoped>
.manage{
    min-width: 950px;
    .tools{
        > button.switchTreeState{
            padding: 2px 10px 2px 0px;
        }
        > label + *{
            margin-right: 15px;
        }
        > label + * + *{
            margin-right: 0px;
        }
        > .nameInput,
        > .dbSelect,
        > .roleSelect,
        > .categorySelect{
            width: 100px;
        }
        .switch{
            cursor: pointer;
            width: 80px;
            display: inline-block;
        }
        position:relative;
        > .explain{
            position: absolute;
            right: 0px;
            top: 0px;
        }
    }
    > .treeTable{
        > .treeHeader,.treeTr{
            display: flex;
            > div{
                flex-grow: 0;
                padding: 0px 5px;
                text-align: left;
                &:nth-child(1){
                    flex-grow: 1;
                    padding: 0px;
                    > label.titleName{
                        padding-left: 1.5em;
                    }
                }
                &:nth-child(2){
                    width: 150px;
                }
                &:nth-child(3){
                    width: 200px;
                }
                &:nth-child(4){
                    width: 140px;
                }
                &:nth-child(5){
                    width: 200px;
                    text-align: center;
                }
            }
        }
        .treeTr{
            position: relative;
            > div{
                &:nth-child(1){
                    i.fa.folded{
                        cursor: pointer;
                    }
                }
                &:nth-child(2):empty:before,
                &:nth-child(3):empty::before,
                &:nth-child(4):empty::before{
                    content: attr(title);
                } // 缺点::before用户无法选择
                // &[title="无限制"],
                &[title="不存在"]
                // &[title="同上"]
                {
                    color: #888;
                }
                &[title="无约束"]{
                    visibility: hidden;
                }
            }
            > div.disabledLine{
                display: none;
                pointer-events: none;
                position: absolute;
                top: 50%;
                left: -25px;

                width: calc(100% + 25px);
                height: 1px;
                border-bottom: 2px dotted #aaa;
            }
            &.disabled *,
            &.hide *{
                color: #aaa;
            }
            &.disabled > div.disabledLine{
                display: block;
            }
            > div.category{
                cursor: pointer;
            }
            &.from{
                > div:nth-child(4),
                .sqlIcon{
                    color: #ccc;
                }
            }
        }
    }
    
}
</style>

<style lang="scss">
.reportManage{    
    .tree1 {
        .treeLi{
            &.rootCategory{
                // background: #987;
                // padding: 0px 3px 3px 3px;
                // border: 1px solid #dcb;
                // border-top: 1px solid #987;
                margin-bottom: 5px;
                > ul{
                    background: #fff;
                }
                > .treeLiContent{
                    background: #edc;
                    // border-top: 1px solid #cba;
                    border-bottom: 1px solid #ba9;
                    // *{
                    //     color: #fff !important;
                    // }
                }
            }
            &.reportItem{
                > ul.tree{
                    padding-left: 0;
                }                
            }
        }
    }
}
</style>