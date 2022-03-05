<script>
import Vue from 'vue'
import commonReport,{ printReport } from '@/home/pages/displayer.vue'

export default commonReport.extend({
    name:'displayer', // 嵌套窗口打开的也是这个 singleDisplayer.vue
    data(){
        const the = this
        return {
            contextmenuAttrs: {
                visible:false,
                operations:Object.freeze({
                    visible_headbar:{
                        get(){
                            return the.visible_headbar
                        },
                        set(){
                            the.visible_headbar = !the.visible_headbar
                        }
                    },
                    visible_pagingbar:{
                        get(){
                            return the.visible_pagingbar
                        },
                        set(){
                            the.visible_pagingbar = !the.visible_pagingbar
                        }
                    },
                    visible_querybar:{
                        get(){
                            return the.visible_querybar
                        },
                        set(){
                            the.visible_querybar = !the.visible_querybar
                        }
                    },
                    openColumnsDisplayer:this.openColumnsDisplayer,

                    download:this.download,
                    print:this.print,
                    query:this.query,
                    openQuerier:this.openQuerier
                }),
                site:{
                    x:0,
                    y:0
                }
            }
        }
    },
    computed:{
        user(){
            return this.getters.user
        },
        windowTitleHepler(){
            if(['popup','minipopup'].includes(this.$parent.$options.name)) return undefined // 弹窗窗口 不能改变 window title

            return {
                reportName: (this.report || {}).name || '',
                userName: (this.user || {}).name || '',
                userTypeName: this.getters.userType.name || '',
            }
        }
    },
    watch:{
        user(){
            this.loadReport()
        },
        windowTitleHepler({reportName,userName,userTypeName}){
            document.title = `${reportName}-${userName}-${userTypeName}-通用web报表试用版`
        }  // 浏览器 标题
    },
    mounted(){
        Vue.prototype.__inheritAttrs() // 报表的独立浏览器窗口：版权+水印
    },
    methods:{
        gotoLink(c,row){
            this._gotoLink(c,row,true)
        }, // 不会 有顶级窗口，永远 子窗口 打开。
        print(){
            printReport(this.$el,this.report.name)
        },
        openContextmenu({clientX:x,clientY:y}){
            this.contextmenuAttrs.visible = true
            this.contextmenuAttrs.site = {x,y}
        }
    }
})
</script>

<style lang="scss" scope>
// .barhider{
//     display: none !important;
// }
.tableToolbar > div > div > [hint]::after,
.headbar > .toolbar > [hint]::after{ 
    margin-top: 20px;  // hintb的样式
}
</style>