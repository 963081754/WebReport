<template>
    <div class="admin">
        <adminMenu :hash.sync="hash" @openManager="openManager" @logout="logout" />
        <taskbar ref="taskbar1" :popups="popups" :active="active" @closeOne="closeOne" @closeAll="closeAll" @switchPopupVisible="switchPopupVisible" />

        <template v-for="item in popups">
            <popup ref="popups" :class="{reportPopup:item.type==='r'}" :visible.sync="item.visible" :title="getPopupTitle(item)" :getPoint="getTaskAnchorPoint(item.id)" :icon="item.icon"
             @update:visible="lookActive" v-bind="item.model.popupAttrs" @close="closeOne(item)" @toTopmost="onToTopmost(item)" @aloneShow="openAloneWindow(item)" :shade="false" :closeable="true" :fix="true" :aloneWindow="item.type === 'r'" :key="item.id">
                <component v-if="item.type==='m'" :is="item.id" v-bind="item.model.attr" v-on="item.model.event" v-onInserted="{callback:onManagerInserted(item)}"/>
                <designer v-else-if="item.type==='r'" v-bind="item.model.attr" v-on="item.model.event" v-onInserted="{callback:onDesignerInserted(item)}" @dataLoaded="onReportPageLoaded(item,$event)"
                 @print="print(item,$event)" @openContextmenu="openContextmenu" />
            </popup>
        </template>

        <contextmenu v-if="contextmenuAttrs.visible" :isFront="false" :visible.sync="contextmenuAttrs.visible" :site="contextmenuAttrs.site" :operations="contextmenuAttrs.operations" />
        
        <router-view/>
    </div>
</template>

<script>
import common from '@/components/home/base'
import { Manager } from '@/models'
import adminMenu from '@/admin/components/admin.menu.vue'
import taskbar from '@/components/taskbar.vue'
// import simulateUserSelector from '@/admin/components/simulateUserSelector.vue'
const databaseManage = () => import('@/admin/pages/databaseManage.vue')
const chainManage = () => import('@/admin/pages/chainManage.vue')
const userChainManage = () => import('@/admin/pages/chainManage.vue')
const categoryManage = () => import('@/admin/pages/categoryManage.vue')
const reportManage = () => import('@/admin/pages/reportManage.vue')
const designer = () => import('@/admin/pages/designer.vue')
const settingEditor = () => import('@/admin/pages/setting.vue')
const sqlCreator = () => import('@/admin/components/sqlCreator.vue')

let designerLoaded = false // 是否 已经加载了designer

export default common.extend({
    components:{ taskbar,adminMenu,sqlCreator,settingEditor,databaseManage,chainManage,userChainManage,categoryManage,reportManage,designer},
    inject:['getters'],
    computed:{
        hash:{
            get(){
                return this.getters.hash || ''
            },
            set(id){
                if(this.$route.params.hash != id){
                    this.popups.filter(t=>t.type === 'r').forEach(item=>{
                        this.popups.splice(this.popups.indexOf(item),1)
                    }) // 关闭 不是当前 userType的报表
                    this.$router.push({ name: 'admin', params: { hash: id }})
                }
            }
        },
        windowTitleHepler(){
            return {
                typeName: (this.getters.currentUserType || {}).name || '',
                userName: (this.getters.tstUser || {}).name || ''
            }
        }
    },
    watch:{
        windowTitleHepler({userName,typeName}){
            document.title = `${userName}(模拟)-${typeName}-后台管理-通用web报表试用版`
        }  // 浏览器 标题
        // 'getters.setting'(obj){
        //     if(obj){
        //         setTimeout(() => {
        //             this.openManager('reportManage')
        //         }, 400)     
        //     }
        // }
    },
    created(){
        this.catalogs = [
            new Manager({type:'m', id:'settingEditor',name:'基本设置',icon:'gear',loaded:false,visible:false,model:{popupAttrs:{enableMax:false,resize:false,autoHeight:true}}}),
            new Manager({type:'m', id:'chainManage',name:'别针管理',icon:'paperclip',loaded:false,visible:false,model:{popupAttrs:{autoHeight:false}}}),
            new Manager({type:'m', id:'userChainManage',name:'别针管理',icon:'paperclip',loaded:false,visible:false,model:{popupAttrs:{autoHeight:false},attr:{basics:false}}}),
            new Manager({type:'m', id:'databaseManage',name:'数据库管理',icon:'database',loaded:false,visible:false,model:{popupAttrs:{autoHeight:true}}}),
            new Manager({type:'m', id:'categoryManage',name:'目录管理',icon:'th-large',loaded:false,visible:false,model:{popupAttrs:{autoHeight:false}}}),
            new Manager({type:'m', id:'reportManage',name:'报表管理',icon:'file-text',loaded:false,visible:false,model:{popupAttrs:{autoHeight:false}, attr:{}, event:{edit:this.openReportEditor}}}),
            new Manager({type:'m', id:'sqlCreator',name:'创建报表SQL语句',icon:'quora',loaded:false,visible:false,model:{popupAttrs:{autoHeight:true}, attr:{sql:''}, event:{parse:this.openReportCreator}}})
        ]
    },
    methods:{
        logout(){
            this.$message.confirm('确定退出吗？').then(async ()=>{
                this.popups = []
                await this.userApi.logout()
                this.$router.push({ name: 'login' })
            }).catch(()=>{})       
        },
        getPopupTitle(item){
            if(item.type === 'm'){
                if(['categoryManage','reportManage','userChainManage'].includes(item.id)){
                    return `${item.name}（${this.getters.currentUserType.name}）`
                }
            }
            return item.name
        },
        openManager(id){
            const item = this.catalogs.find(t=>t.id === id)
            // item.name = item.name.replace(/(.+?)/,`(${this.getters.currentUserType.name})`)
            item.visible = item.loaded
            this.openPopup(item)
        },
        openReportEditor({report}){ // {report,from_name}
            let item = this.popups.find(t=>t.id === report.id)
            if(!item){
                // const name = report.from_id ? `修改：${report.name}（源自：${from_name}）` : `修改：${report.name}`
                const name = `修改：${report.name}`
                item = new Manager({type:'r', id:report.id,name,icon:report.star || 'file',visible:false,model:{attr:{id:report.id},event:{update:this.onReportUpdated,openLinkReport:this.openLinkReport}}})
            }
            item.visible = designerLoaded //true，解决 异步加载的问题
            this.openPopup(item)
        },
        openReportCreator(newModel){
            const creator = this.popups.find(t=>t.id === 'sqlCreator')
            if(!creator) return
            
            this.closeOne(creator)
            this.$nextTick(()=>{
                const item = new Manager({type:'r', id:Math.random().toString(), name:'创建报表',icon:'file-o',visible:designerLoaded,model:{popupAttrs:{}, attr:{newModel}, event:{update:this.onReportUpdated}}})
                this.openPopup(item)
            })
        },
        onReportUpdated(){
            const index = this.popups.findIndex(t=>t.id === 'reportManage')
            if(index !== -1){
                this.$refs.popups[index].$children[0].loadReportLess()
            }
        }, // 修改/添加 了报表后，刷新 管理窗口。
        async openLinkReport({id,link,row,title}){
            try{
                const linkReport = await this.reportApi.getAdapter(link.target)
                if(linkReport){
                    this._openLinkReport({id,link,row,linkReport,title})
                } 
            }catch(error){
                this.$$message.error(error.message)
            }
        },
        onDesignerInserted(){ // item // 不用写了，小问题。
            // if(!designerLoaded){
            //     setTimeout(() => {
            //         item.visible = true
            //         this.$nextTick(()=>{
            //             this.$refs.popups[this.popups.indexOf(item)].toMiddle()
            //         })
            //     }, 100)
            //     designerLoaded = true
            // }
        }, // 解决：异步加载designer.vue导致 不能居中的问题
        onManagerInserted(item){
            if(!item.loaded){
                setTimeout(() => {
                    item.loaded = item.visible =true
                }, 100)
            }
        },  // 解决：异步加载xx.vue导致 不能居中的问题
        openAloneWindow(item){
            const url = `/${this.getters.currentUserType.path}/${item.model.attr.id}`
            window.open(url,'_blank')
        } // 独立 浏览器窗口
    }
})
</script>

<style lang="scss" scoped src="@/components/home/scoped.scss"></style>

