<template>
  <div class="designer" :class="classs" @contextmenu.prevent.stop="openContextmenu">
    <!-- <barhider :name="report.name" :visible_headbar.sync="visible_headbar" :visible_pagingbar.sync="visible_pagingbar" @openQuerier="openQuerier" /> -->

    <button v-if="previewed" class="small unpreview" @click.stop="previewed=false" raw>
      <i class="fa fa-pause-circle"/>取消预览
    </button>

    <sqlEditer v-if="!report.from_id && visible_sqlEditer" :visible.sync="visible_sqlEditer" @parse="mergeRawModel" :sql="report.sql" :db_id="report.db_id" :title="report.name || '创建报表'"/>
    <sqlDisplay v-if="report.from_id && visible_sqlEditer" :visible.sync="visible_sqlEditer" :sql="report.sql" :title="report.name"/>

    <div class="headbar" ref="headbar">
      <div class="setTools" v-if="!previewed && visible_headbar">
        <i class="fa fa-quora sqlIcon" @click.stop="visible_sqlEditer=!visible_sqlEditer" :hint="report.from_id ? '查看SQL语句' : '修改SQL语句'"></i>

        <label>数据库：</label>
        <span>{{db.cname}}</span>

        <label>角色：</label>
        <r-combobox class="rule-select" v-model.number="report.role_ids" :items="getters.roles.filter(t=>t.state)" :vField="'id'" :tField="'name'"  :multiple="true" placeholder="无限制"/>

        <label>目录：</label>
        <r-combobox v-if="!report.from_id" class="category-select" v-model.number="report.category_id" :items="stairCategorys" :vField="'id'" :tField="'name'"  :nullable="false"/>
        <span v-else>{{(getters.categorys.find(t=>t.id === report.category_id) || {}).name}}</span>

        <label>名称：</label>
        <input class="r-fresh name-input" v-model.trim.lazy="report.name" :error="report.name?false:'名称不能为空'" raw>

        <button class="small preview" @click.stop="previewed=true" raw>
          <i class="fa fa-play-circle"/>预览
        </button>
        <r-button class="small save" @click="save" raw>
            <i class="fa fa-save"/>保存
        </r-button>        
      </div>
      <div class="toolbar" v-if="visible_headbar" :class="{constraintSetting:wasDemanDefaultStatus}">
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
        <r-button class="r-fresh" @click="download" hint="下载 整个报表" raw>
            <i class="fa fa-download"/>下载                 
        </r-button>        
        <button class="r-fresh" :class="{using:complexQuerys.length}" @click.stop="openQuerier" hint="打开高级查询框" raw>
            <i class="fa fa-window-maximize"/>高级查询                 
        </button>
        <button class="r-fresh query" @click.stop="query" hint="立即查询" raw>
            <i class="fa fa-search"/>查询
        </button>

        <button v-if="!previewed" class="r-fresh constraintButton" @click.stop="wasDemanDefaultStatus = !wasDemanDefaultStatus" hint="设置条件的非空、多选、时间起始范围" raw>
            <!-- <i class="fa fa-gear"><label class="handle"></label></i> -->
            <i class="fa fa-gear"></i>条件约束
        </button>
        <button v-if="!previewed" class="r-fresh"  @click.stop="openDemandsDisplayer" hint="启用/禁用/自定义条件" raw>
            <!-- <i class="fa fa-align-justify"><i class="fa fa-gear"/></i> -->
            <i class="fa fa-search-plus"/>更多条件
        </button>
        <button v-if="!previewed" class="r-fresh" :class="{using:hasUserKeys}" @click.stop="openMebinder" hint="绑定登录用户信息到查询条件，限制数据范围" raw>
          <!-- <i class="fa fa-user-circle-o userSearch"><label class="handle"></label></i> -->
          <i class="fa fa-user-secret "></i>登录用户约束
        </button>
      </div>
      <querybar class="querybar" v-show="visible_querybar" :demands="report.demands" :setting.sync="wasDemanDefaultStatus" />
    </div>

    <div class="tableToolbar">
      <div>
        <div>
          <!-- <i v-if="!previewed" class="fa fa-etsy" @click.stop="visible_fieldManage=true" hint="数据库字段名翻译"/> -->
          <i v-if="!previewed" class="fa fa-anchor fa-lg h160" :class="{useing:visible_linker}" @click.stop="openLinker" hint="链接其它报表(如：单击“订单编号”弹出“订单明细”报表)" hintt50 /> 
          <i v-if="!previewed" class="fa fa-filter fa-lg" :class="{useing:enabler.filter}" @click="enable('filter',$event)" hint="列过滤"/>
          <i v-if="!previewed" class="fa fa-sort-alpha-asc fa-lg" :class="{useing:enabler.sort}" @click="enable('sort',$event)" hint="列排序"/>
          <i v-if="!previewed" class="fa fa fa-align-left fa-lg" :class="{useing:enabler.align}" @click="enable('align',$event)" hint="列 文字对齐"/>       
          <i v-if="!previewed" class="fa fa-edit fa-lg" :class="{useing:enabler.edit}" @click="enable('edit')" hint="编辑表格"/>
          <span class=" fa fa-columns fa-lg fixColumnIcon" @click.stop="columnFixator" hint="固定头尾列">
            <i class="fa fa-thumb-tack"/>
          </span>
          <i class="fa fa-columns fa-lg" @click.stop="openColumnsDisplayer" hint="隐藏/显示/禁用/启用 列" hintl140/>        
        </div>
      </div>
    </div>

    <div ref="vtable" class="vtable2" :class="{editing:enabler.edit,loading,loadError:!!loadError}" v-table2="{tableId:vtableId,list,columns:VOColumns,rowHeight:30,setting:enabler.edit}" >
      <table :class="{empty:list.length===0}">
        <colgroup >
          <col width="50" fixed="l">
          <col v-for="c in VOColumns" :width="c.width" :fixed="c.fixed?c.fixed:false" :key="c.ename">
          <col>
        </colgroup>
        <thead>
          <tr v-sort="{...theadSort, list:VOColumns}" :class="{enabler:enabler.sort || enabler.filter || enabler.align}">
            <th fixed="l">行号</th>
            <th v-for="(c) in VOColumns" :key="c.ename" :fixed="c.fixed || false" :align="c.align" @click.stop="thClick(c,$event)"> 
              <div class="label">
                <template v-if="enabler.edit">                  
                  <input v-if="enabler.edit" class="nameEditer" v-model.trim.lazy="c.cname" :placeholder="c.ename" :style="{textAlign:c.align}"
                    @focus="$event.target.select()" @mousedown.stop/>
                </template>
                <template v-else>
                  <i v-if="c.enableSort" :class="`fa fa-long-arrow-${c.sort==='l'?'up':'down'} ${!c.sort && 'disabled'} sortIcon`" hint="当前页排序" @mousedown.stop/>
                  {{c.cname}}
                  <i v-if="c.enableFilter" :class="`fa fa-filter ${!c.filter && 'disabled'}`" @mousedown.stop/>
                </template>
              </div>            
              <i v-if="c.kv" class="fa fa-paperclip kvIcon"></i> <!-- 绑定了“别针” -->
              <span class="columnResizeBar" @mousedown.stop="resizeColumnHandler(c,$event)"/>
            </th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <template v-if="enabler.edit">
            <tr class="setting">
              <td fixed="l">格式化</td>
              <td v-for="(c) in VOColumns" :key="c.ename" :fixed="c.fixed || false" :align="c.align">
                <template v-if="c.type==='n'">
                  <r-select v-model.trim="c.format" placeholder="格式化">
                    <r-option v-for="(item,i) in numberFormats" :value="i+1" :text="item" :key="i"/>
                    <r-option value="---" text="--其它格式--" />
                  </r-select>
                </template>
                <template v-else-if="c.type==='d'">
                  <r-select v-model.trim="c.format" placeholder="格式化">
                    <r-option v-for="(item,i) in datetimeFormats" :value="i+1" :text="item" :key="i"/>
                    <r-option value="---" text="--其它格式--" />
                  </r-select>
                </template>
              </td>
              <td></td>
            </tr>
            <tr class="setting">
              <td fixed="l">别针</td>
              <td v-for="(c) in VOColumns" :key="c.ename" :fixed="c.fixed || false" :align="c.align">
                <r-select v-model.trim="c.kv" @change="openChainCreator(c)" placeholder="别针">
                  <r-option v-for="item in getters.chainNames" :value="item.id" :text="item.name" :key="item.id"/>
                  <r-option value="---" text="--新建--" />
                </r-select>
              </td>
              <td></td>
            </tr>
          </template>

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
        <tfoot v-if="enabler.edit || Object.keys(statistics).length > 0">
          <tr>
            <td fixed="l">合计</td>
            <td v-for="(c) in VOColumns" :key="c.ename" :fixed="c.fixed || false" :align="c.align">
              <span class="stats" v-if="!enabler.edit && statistics[c.ename]" :hint3="`${statistics[c.ename].name}：${statistics[c.ename].value}`">
                {{statistics[c.ename].value}}
              </span>
              <statsSelect v-else-if="['n','d'].includes(c.type)" v-model="c.statsMode" :type="c.type"/>
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

    <!-- 链接报表 子弹窗 -->
    <r-minipopup class="childPopups" ref="childPopups" v-for="item in childPopups" :visible.sync="item.visible"
     @update:visible="closeLinkChildReport(item)" linkReport
      :title="item.name" :icon="item.icon" :shade="false" :closeable="true" :resizeable="true" :key="item.id">
      <designer v-bind="item.model.attr" v-on="item.model.event" @openLinkReport="openLinkReportAsTopmost" @dataLoaded="onLinkChildReportPageLoaded(item,$event)" />
    </r-minipopup>

    <keep-alive>
      <demandsDisplayer v-if="visible_demandsDisplayer" :visible.sync="visible_demandsDisplayer" :demands="report.demands" />
    </keep-alive>
    <keep-alive>
      <columnsDisplayer v-if="visible_columnsDisplayer" :visible.sync="visible_columnsDisplayer" :columns="report.columns" :useEnabler="true" @edited="loadPaging"/>
    </keep-alive>
    <keep-alive>
      <mebinder v-if="visible_mebinder" :visible.sync="visible_mebinder" :userKeys.sync="report.userKeys" />
    </keep-alive>
    <keep-alive>
      <linker v-if="visible_linker" :visible.sync="visible_linker" :links="report.links"/>
    </keep-alive>
    <!-- <keep-alive> -->
      <querier @confirm="query" :visible.sync="visible_querier" />
    <!-- </keep-alive> -->
    <chainCreator v-if="chainCreatorAttrs.visible" :visible.sync="chainCreatorAttrs.visible" :obj="chainCreatorAttrs.model" @succeeded="onChainCreateSuccess"/>
    <!-- <fieldManage v-if="visible_fieldManage" :visible.sync="visible_fieldManage" /> -->

  </div>
</template>

<script>
import { Column, Demand, CombiDemand, Chain } from '@/models'
import querybar from '@/admin/components/querybar.vue'
const columnsDisplayer  = () => import('@/admin/components/columnsDisplayer.vue')
const demandsDisplayer  = () => import('@/admin/components/demandsDisplayer.vue')
const statsSelect  = () => import('@/admin/components/statsSelect.vue')
const chainCreator  = () => import('@/admin/components/chainCreator.vue')
const mebinder  = () => import('@/admin/components/mebinder.vue')
const linker  = () => import('@/admin/components/linker.vue')
const sqlEditer  = () => import('@/admin/components/sqlEditer.vue')
const sqlDisplay  = () => import('@/admin/components/sqlDisplay.vue')
// const fieldManage  = () => import('@/admin/components/fieldManage.vue')

import common,{ createFloatHint, deepCopy } from '@/components/report.vue/mixin'
export default common.extend({
  name:'designer',
  components:{ querybar,statsSelect,chainCreator,mebinder,linker,sqlEditer,sqlDisplay,columnsDisplayer,demandsDisplayer },
  inject: ['getters','reportApi','chainApi'],
  props:{
    id:{
      type:Number,
      required:false
    },
    newModel:{
      type:Object,  // {report,paging}
      required:false
    }
  },
  data(){
    return {
      enabler:{
        filter: false,
        sort: false,
        align: false,
        edit: false
      },
      wasDemanDefaultStatus: false, // 条件默认值设置
      previewed:false, // 预览

      visible_demandsDisplayer: false,
      // visible_fieldManage:false,
      visible_mebinder:false,
      visible_sqlEditer:false,
      visible_linker:false,
      chainCreatorAttrs:{
        visible:false,
        model:null
      }
    }
  },
  computed:{
    db(){
      return this.getters.databases.find(t=>t.id == this.report.db_id) || {}
    },
    stairCategorys(){
      const list = this.getters.categorys.map(t=>({id:t.id,pid:t.pid,name:t.name})).buildTree(0)
      // list.flatTree().forEach(t=>t.disabled = !!(t.children && t.children.length))
      return list
    },
    editEnabler(){
      return this.enabler.edit
    },
    hasUserKeys(){
      return !!this.report.userKeys && !!this.report.userKeys.find(t=>t.field)
    },
    demanSignsHelper(){
      // console.log('demanSignsHelper')
      return {
        tstUser:this.getters.tstUser && {},
        userKeys:this.report.userKeys
      }
    }
  },
  watch:{
    editEnabler:function(val){
      if(!val){
        this.report.columns.filter(c=>!c.cname).forEach(c=>c.cname = c.ename)
      }
    }, // 如果cname为空，则cname=ename
    demanSignsHelper:{
      handler:function(){
        this.__demanSigns = {}
      },
      deep:true
    } // “模拟登录用户”或“登录用户约束” 改变是，清掉__demanSigns
  },
  created(){
    if(!this.id && !this.newModel){
      throw Error('参数id、newModel不能都为空')
    }

    if(!this.id && this.newModel){
      this.mergeRawModel(this.newModel)
    }else{
      this.loadReport()
    }
  },
  methods:{
    async save({unlock}){
      try{
        if(!this.saveValidate()) return

        if(this.report.id){
          await this.reportApi.update(this.report)
        }else{
          const model = await this.reportApi.add(this.report) 
          this.report.id = model.id
        }
      }catch(err){
        this.$message.error(`保存失败：${err.message}`)
        return
      }finally{
        unlock()
      }
      this.$message.success('保存成功')
      this.$emit('update',deepCopy(this.report))
    },
    saveValidate(){
      if(!this.report.name){
        this.$message.error('请输入报表名称')
        return false
      }
      if(!this.report.from_id && !this.report.category_id){
        this.$message.error('请选择报表目录')
        return false
      }
      if(!this.report.columns.find(c=>c.enabled)){
        this.$message.error('不能没有 表头列')
        return false
      }
      if(this.complexQuerys.length){
        this.$message.error(`除 查询栏 的条件外，高级查询框 的条件不能保存；<br/>请移除高级查询框的这些条件再保存：${this.complexQuerys.map(t=>t.cname).join('，')}。`)
        this.visible_querier = true
        return false
      }
      return true
    },
    mergeRawModel({model,paging}){
      this.visible_sqlEditer = false
      //保留下来的column
      this.report.columns = this.report.columns.filter(c=>c.isCustom || model.columns.find(t=>t.ename === c.ename && t.dataType === c.dataType && t.dataScale === c.dataScale && t.dataPrecision === c.dataPrecision && t.dataLength === c.dataLength)) // 保留下来的column
      
      //保留下来的demand
      this.report.demands.filter(d=>d.isCustom).forEach(combiDemand=>{
        combiDemand.items = combiDemand.items.filter(d=>this.report.columns.find(c=>c.ename === d.ename))
      })
      this.report.demands = this.report.demands.filter(d=>this.report.columns.find(c=>c.ename === d.ename || (d.isCustom && d.items.length > 0)))
      
      // 合并新column
      const newColumns = model.columns.filter(t=>!this.report.columns.find(c=>t.ename === c.ename && t.dataType === c.dataType && t.dataScale === c.dataScale && t.dataPrecision === c.dataPrecision && t.dataLength === c.dataLength))
      this.report.columns = this.report.columns.concat(newColumns.map(c=>new Column(c)))
      this.report.columns
        .sort((a,b)=>(a.fixed==='l' ? 0 : 1) - (b.fixed==='l' ? 0 : 1)) // 保证左固定列 在左边。
        .sort((a,b)=>(a.fixed==='r' ? 1 : 0) - (b.fixed==='r' ? 1 : 0)) // 保证右固定列 在右边。

      // 合并新demand
      let newDemands = model.demands.filter(d=>newColumns.find(c=>c.ename === d.ename))
      newDemands = newDemands.map(d=>{
        return !d.combi 
          ? new Demand(d,this.report.columns.find(t=>t.ename === d.ename))
          : new CombiDemand(d,this.report.columns)
      })
      this.report.demands = this.report.demands.concat(newDemands)

      // 清理无效userKeys的item(引用已不存在的column)
      this.report.userKeys = this.report.userKeys.filter(uk=>this.report.columns.find(c=>c.ename === uk.field))

      // 清理无效links的item(引用已不存在的column)
      this.report.links = this.report.links.filter(link=>this.report.columns.find(c=>c.ename === link.column))
      this.report.links.forEach(link=>{
        link.params = link.params.filter(p=>this.report.columns.find(c=>c.ename === p.value))
      })

      this.report.db_id = model.db_id
      this.report.sql = model.sql

      this.disorderColumns = Object.freeze([...this.report.columns])
      this.$nextTick(()=>{
        this.resetPaging(paging)
      }) // 所以用$nextTick是为了让v-table2先初始完(inserted不接受参数)；再绑定list,执行v-table2的componentUpdated（这里才接受参数）
    },
    enable(toolName,e){
      const oldValue = this.enabler[toolName]
      Object.keys(this.enabler).forEach(key => {
        if(typeof(this.enabler[key]) === 'boolean') this.enabler[key] = false
      })
      this.enabler[toolName] = !oldValue

      {
        if(this._uncreateFloatHint) this._uncreateFloatHint()
        if(!oldValue){
          if(toolName === 'sort'){
            this._uncreateFloatHint = createFloatHint('点击表头列，启用/禁用 “<b>列排序</b>”<br/>再次点击按钮<i class="fa fa-sort-alpha-asc"></i>取消该操作。',e)
          }else if(toolName === 'filter'){
            this._uncreateFloatHint = createFloatHint('点击表头列，启用/禁用 “<b>列过滤</b>”<br/>再次点击按钮<i class="fa fa-filter"></i>取消该操作。',e)
          }else if(toolName === 'align'){
            this._uncreateFloatHint = createFloatHint('点击表头列，改变文字“<b>对齐方式</b>”<br/>再次点击按钮<i class="fa fa-align-left"></i>取消该操作。',e)
          }
        }
      }
    },
    enableColumnAlign(c){
      switch(c.align){
        case 'center':
          c.align = 'left'
          break
        case 'left':
          c.align = 'right'
          break
        case 'right':
          c.align = 'center'
          break
        default:
      }
    },
    enableColumnSort(c){
      c.enableSort = !c.enableSort
    },
    enableColumnFilter(c){
      c.enableFilter = !c.enableFilter
    },
    thClick(c,{target}){
      if(this.enabler.sort){
        this.enableColumnSort(c)
      }else if(this.enabler.filter){
        this.enableColumnFilter(c)
      }else if(this.enabler.align){
        this.enableColumnAlign(c)
      }else{
        if(target.hasClass('sortIcon')){
          this.sortDataByColumn(c)
        }else if(target.hasClass('fa-filter')){
          this.filterDataByColumn(c)
        }
      }
    },
    openChainCreator(c){
      if(c.kv === '---'){
        c.kv = null
        this.chainCreatorAttrs.visible = true
        this.chainCreatorAttrs.model = new Chain({})
        this._columnOfCreateChain = c
      }else if(c.kv){
        if(!this.getters.littleChainValueEnums[c.kv]){
          this._loadSqlChain(c.kv,c.ename)
        }
      }
    },
    onChainCreateSuccess(model){
      this.chainCreatorAttrs.visible = false
      this.chainCreatorAttrs.model = null
      const column = this._columnOfCreateChain
      delete this._columnOfCreateChain

      column.kv = model.id  // 绑定到当前column        
      if(model.type === this.ChainType.sql){
        this._loadSqlChain(model.id,column.ename)
      }    
    },
    _loadSqlChain(chainId,ename){
      const existEnums = (this.bigChainValueEnums[chainId] || {}) // 如果存在该id的chain
      const itemIds = this.originalList.map(row=>row[ename]).filter(t=>t !== null && t !== undefined).filter(t=>!existEnums[t])
      if(itemIds.length === 0) return

      this.chainApi.getValuesOfSql(chainId,itemIds,this.getters.tstUser).then(enums=>{
        this.$set(this.bigChainValueEnums,chainId,Object.freeze(Object.assign({},existEnums,enums)))
      })
    },
    openDemandsDisplayer(){
      this.visible_demandsDisplayer = !this.visible_demandsDisplayer
    },
    openMebinder(){
      this.visible_mebinder = !this.visible_mebinder
    },
    openLinker(){
      this.visible_linker = !this.visible_linker
    }
  }
})
</script>

<style lang="scss" scoped src="@/components/report.vue/scoped.scss"></style>
<style lang="scss" src="@/components/report.vue/global.scss"></style>