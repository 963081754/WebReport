<template>
    <div class="home">
        <catalog v-show="user" class="category" :treeData="catalogs" :stars="reportBranchs.filter(t=>t.icon && t.icon !== 'file')" :popups="popups" @openReport="openPopup" @logout="logout" />
        <taskbar ref="taskbar1" :popups="popups" :active="active" @closeOne="closeOne" @closeAll="closeAll" @switchPopupVisible="switchPopupVisible" />

        <template v-for="(item) in popups">
            <popup ref="popups" class="reportPopup" :visible.sync="item.visible" :title="item.name" :getPoint="getTaskAnchorPoint(item.id)" :icon="item.icon" 
            @update:visible="lookActive" v-bind="item.model.popupAttrs" @close="closeOne(item)" @toTopmost="onToTopmost(item)" @aloneShow="openAloneWindow(item)" :shade="false" :closeable="true" :fix="true" :aloneWindow="true" :star="false" :key="item.id">
                <displayer v-bind="item.model.attr" v-on="item.model.event"
                 @frameLoaed="onFrameLoaed(item,$event)" @dataLoaded="onReportPageLoaded(item,$event)"
                 @print="print(item,$event)" @openContextmenu="openContextmenu" />
            </popup>
        </template>
        
        <contextmenu v-if="contextmenuAttrs.visible" :isFront="true" :visible.sync="contextmenuAttrs.visible" :site="contextmenuAttrs.site" :operations="contextmenuAttrs.operations" />

        <router-view/>
    </div>
</template>

<script>
import common from '@/components/home/base'
import { TreeItem } from '@/models'
import catalog from '@/home/components/home.catalog.vue'
import taskbar from '@/components/taskbar.vue'
// import displayer from '@/home/pages/displayer.vue'
const displayer = ()=>import('@/home/pages/displayer.vue')

const getLessList = function(categoryBranchs,reportBranchs){
    let list = []            
    const recall = function(pid){
        const category = categoryBranchs.find(t=>t.id === pid)
        if(category){
            list.push(category)
            recall(category.pid)
        }
    }
    reportBranchs.forEach(t=>recall(t.pid))
    list = [...new Set(list)].concat(reportBranchs)
    return list
} // 获取 存在报表的目录+报表

export default common.extend({
    components:{ catalog, taskbar, displayer },
    // inject: ['getters','reportApi','userApi'],
    data(){
        return {
            reports: Object.freeze([])
        }
    },
    computed:{
        user(){
            if(this.getters.user){
                this.loadReportLess()
            }
            return this.getters.user
        },
        categoryBranchs(){
            return this.getters.categorys.map(t=>new TreeItem({
                ...t,
                icon:'folder-o',
                icon_open:'folder-open-o',
                moveable:false,
                acceptable:false
            }))
        },
        reportBranchs(){
            return Object.freeze(this.reports.map(report=>(new TreeItem({
                id:`r${report.id}`,
                pid:report.category_id,
                icon:report.star || 'file',
                name:report.name,
                moveable:false,
                acceptable:false,
                seq:report.seq || 0,
                visible:true,
                model:{
                    attr:{id:report.id},
                    event:{openLinkReport:this.openLinkReport}
                }
            }))))
        },
        catalogs(){
            if(this.categoryBranchs.length === 0 || this.reportBranchs.length === 0) return []

            const resultTree = getLessList(this.categoryBranchs,this.reportBranchs)
                .sort(((a,b)=>!a.model === !b.model ? (a.pid === b.pid ? a.seq - b.seq : a.pid - b.pid) : !a.model - !b.model))
                .buildTree(0)
            return resultTree
        },
        windowTitleHepler(){
            return {
                userName: (this.user || {}).name || '',
                userTypeName: this.getters.userType.name || ''
            }
        }
    },
    watch:{
        windowTitleHepler({userName,userTypeName}){
            document.title = `${userName}-${userTypeName}-通用web报表试用版`
        }  // 浏览器 标题
    },
    created(){
        this._isFrontDesk = true
    },
    methods:{
        async loadReportLess(){
            const reports = await this.reportApi.getListAsSimple()
            this.reports = Object.freeze(reports)
        },
        async openLinkReport({id,link,row,title}){
            const reportId = link.target
            try{
                const linkReport = await this.reportApi.getAdapter(reportId)
                if(linkReport){
                    this._openLinkReport({id,link,row,linkReport,title})
                } 
            }catch(error){
                this.$$message.error(error.message)
            }   
        },
        logout(){
            this.$message.confirm('确定退出吗？').then(async ()=>{
                await this.userApi.logout()
                this.popups = []
            }).catch(()=>{})
        },
        openAloneWindow(item){
            const url = `/${this.getters.hash}/${item.model.attr.id}`
            window.open(url,'_blank')
        } // 独立 浏览器窗口
    }
})
</script>

<style lang="scss" scoped src="@/components/home/scoped.scss"></style>


