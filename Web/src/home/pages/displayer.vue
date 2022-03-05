<template>
  <div class="designer" :class="classs_disabled" @contextmenu.prevent.stop="openContextmenu">
    <!-- <barhider class="barhider" :name="report.name" :visible_headbar.sync="visible_headbar" :visible_pagingbar.sync="visible_pagingbar" @openQuerier="openQuerier" /> -->

    <div class="headbar" ref="headbar">
      <div class="toolbar" v-show="visible_headbar">
        <button class="r-fresh" @click.stop="visible_querybar=!visible_querybar" hint="也可以用右键菜单操作" raw>
            <template v-if="visible_querybar">
              <i class="fa fa-eye-slash"/>隐藏
            </template>
            <template v-else>
              <i class="fa fa-eye"/>显示
            </template>
        </button>
        <button class="r-fresh print" @click.stop="print" hint="打印 当前页" raw>
            <i class="fa fa-print"/>打印                 
        </button>
        <r-button class="r-fresh" @click="download" hint="下载 整个报表(不能多于5万行)" raw>
            <i class="fa fa-download"/>下载                 
        </r-button>        
        <button class="r-fresh" :class="{using:complexQuerys.length}" @click.stop="openQuerier" hint="打开高级查询框" raw>
            <i class="fa fa-window-maximize"/>高级查询
        </button>
        <button class="r-fresh query" @click.stop="query" hint="立即查询" raw>
            <i class="fa fa-search"/>查询
        </button>
      </div>
      <querybar class="querybar" v-show="visible_querybar" :demands="report.demands" />
    </div>

    <div class="tableToolbar">
      <div>
        <div>
          <span class=" fa fa-columns fa-lg fixColumnIcon" @click.stop="columnFixator" hint="固定列" hintl50>
            <i class="fa fa-thumb-tack"/>
          </span>
          <i class="fa fa-columns fa-lg" @click.stop="openColumnsDisplayer" hint="隐藏/显示 列" hintl90/>        
        </div>
      </div>
    </div>

    <div ref="vtable" class="vtable2" :class="{loading,loadError:!!loadError}" v-table2="{tableId:vtableId,list:list,columns:VOColumns,rowHeight:30}">
      <table :class="{empty:list.length===0}">
        <colgroup >
          <col width="50" fixed="l">
          <col v-for="c in VOColumns" :width="c.width" :fixed="c.fixed?c.fixed:false" :key="c.ename">
          <col>
        </colgroup>
        <thead>
          <tr v-sort="{...theadSort, list:VOColumns}">
            <th fixed="l">行号</th>
            <th v-for="(c) in VOColumns" :key="c.ename" :fixed="c.fixed || false" :align="c.align"> 
              <div class="label">
                <i v-if="c.enableSort" :class="`fa fa-long-arrow-${c.sort==='l'?'up':'down'} ${!c.sort && 'disabled'} sortIcon`" hint="当前页排序" @click.stop="sortDataByColumn(c)" @mousedown.stop/>
                {{c.cname}}
                <i v-if="c.enableFilter" :class="`fa fa-filter ${!c.filter && 'disabled'}`" @click.stop="filterDataByColumn(c)" @mousedown.stop/>
              </div>            
              <span class="columnResizeBar" @mousedown.stop="resizeColumnHandler(c,$event)"/>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row) in list" :id="`${vtableId}_${row.n}`" :key="row.n">
            <td fixed="l">{{row.n}}</td>
            <td v-for="(c) in VOColumns" :key="c.ename" :fixed="c.fixed || false" :align="c.align" :link="c.hasLink" @click="c.hasLink? gotoLink(c,row) : undefined">
              <template v-if="c.kv">
                <label class="status" :style="(getters.chainColorStyleEnumss[c.kv] || {})[row[c.ename]]">
                  {{ (getters.littleChainValueEnums(c.kv) || bigChainValueEnums[c.kv] || {})[row[c.ename]] || row[c.ename] }}
                </label>
              </template>
              <template v-else-if="c.format">
                {{row[c.ename] | commonFormat(c)}}
              </template>
              <template v-else-if="c.isCustom">
                <span v-html="row[c.ename]"></span>
              </template>
              <template v-else>
                {{row[c.ename]}}
              </template>
            </td>
            <td></td>
          </tr>

          <!-- 补充空白的行 -->
          <tr class="fillGapTr" :class="{empty:list.length === 0}" ref="fillGapTr">
            <td fixed="l"></td>
            <td v-for="(c) in VOColumns" :fixed="c.fixed || false" :key="c.ename"></td>
            <td></td>
          </tr>
        </tbody>
        <tfoot v-if="Object.keys(statistics).length > 0">
          <tr>
            <td fixed="l">合计</td>
            <td v-for="(c) in VOColumns" :key="c.ename" :fixed="c.fixed || false" :align="c.align">
              <span class="stats" v-if="statistics[c.ename]" :hint3="`${statistics[c.ename].name}：${statistics[c.ename].value}`">
                {{statistics[c.ename].value}}
              </span>
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
      <div class="h"></div>
      <div class="v"></div> 
      <i class="fa fa-exclamation-triangle loadErrorIcon" :hint2="loadError"></i>
    </div>

    <pagingbar v-show="visible_pagingbar" class="pagingbar" ref="querier" @refresh="loadPaging" :page.sync="page" :pageTotal="paging.pageTotal" :asyncTotal="paging.total" />

    <!-- 链接报表 子弹窗（注：1、没有监听openContextmenu，所以没有右键菜单；）-->
    <r-minipopup class="childPopups" ref="childPopups" v-for="item in childPopups" :visible.sync="item.visible"
     @update:visible="closeLinkChildReport(item)" linkReport
      :title="item.name" :icon="item.icon" :shade="false" :closeable="true" :resizeable="true" :key="item.id">
      <displayer class="childDisplayer" v-bind="item.model.attr" v-on="item.model.event" @openLinkReport="openLinkReportAsTopmost" @dataLoaded="onLinkChildReportPageLoaded(item,$event)" />
    </r-minipopup>

    <keep-alive>
      <columnsDisplayer v-if="visible_columnsDisplayer" :visible.sync="visible_columnsDisplayer" :columns="report.columns.filter(t=>t.enabled)" :useEnabler="true" @edited="loadPaging"/>
    </keep-alive>
    <!-- <keep-alive> -->
      <querier @confirm="query" :visible.sync="visible_querier" />
    <!-- </keep-alive> -->

    <router-view name="login" />
    <router-view name="contextmenu" />
  </div>
</template>

<script>
import querybar from '@/home/components/querybar.vue'
const columnsDisplayer  = () => import('@/home/components/columnsDisplayer.vue')

import common,{ printReport } from '@/components/report.vue/mixin'
export { printReport }

export default common.extend({
  name:'displayer',
  components:{ columnsDisplayer, querybar },
  provide:function(){
    return{
      isRelativeDate:false
    }
  },
  data(){
    return {
      isFrontDesk: Object.freeze(true)
    }
  },
  computed:{
    columnDynamicValues(){
      return this.report.columns.map(t=>({ename:t.ename,width:t.width,fixed:t.fixed,hide:t.hide}))
    },
    columnStorageKey(){
      if(this.getters.user){
        return `user_columns_${this.getters.hash}_${this.getters.user.id}`
      }else{
        return ''
      }
    }, // getters.user可能为空，所以要写这个 computed
    classs_disabled(){
      return `${this.classs} ${this.report && this.report.name ? '' : 'disabled'}`
    }  // 前台 没权限的报表 禁止按钮的操作。
  },
  watch:{
    columnDynamicValues(val,oldval){
      if(!oldval || oldval.length === 0) return
      this.saveToStorageFromClientColumn()
    }
  },
  created(){
    // this.columnStorageKey = `user_columns_${this.getters.hash}_${this.getters.user.id}`
    this.loadReport()
  },
  methods:{
    saveToStorageFromClientColumn(){
      let columnss = JSON.parse(localStorage.getItem(this.columnStorageKey) || '{}')
      columnss[this.report.id] = this.report.columns.map(t=>({ename:t.ename,width:t.width,fixed:t.fixed,hide:t.hide}))
      localStorage.setItem(this.columnStorageKey,JSON.stringify(columnss))
    }, // 保存用户设置的column的值到浏览器localStorage
    restoreClientColumnFromStorage(model){
      let columnss = JSON.parse(localStorage.getItem(this.columnStorageKey) || '{}')
      const columns = columnss[model.id]
      if(!columns) return

      columns.forEach(c=>{
        const column = model.columns.find(t=>t.ename === c.ename)
        if(!column) return
        Object.keys(c).forEach(key=>column[key] = c[key])
      })
      model.columns.sort((a,b)=>{
        return columns.findIndex(t=>t.ename === a.ename) - columns.findIndex(t=>t.ename === b.ename)
      })
    }, // 从浏览器localStorage 还原用户设置的column的值
    afterLoadReport(model){
      this.restoreClientColumnFromStorage(model)
    }
  }
})
</script>

<style lang="scss" scoped src="@/components/report.vue/scoped.scss"></style>
<style lang="scss" src="@/components/report.vue/global.scss"></style>
