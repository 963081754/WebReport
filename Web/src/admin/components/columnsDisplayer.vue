<template>
    <r-minipopup :visible.sync="visiblePopup" title="表头管理器">
      <div class="columnsManager">
        <r-declare v-if="useEnabler" class="descr" :left="-320" :content="[`禁用：前台用户无权查看（改列数据不会传到前台）。`,'隐藏：用户可以显示。','支持拖拽排序。','上下灰色的是两边的固定列。']"/>
        <div class="toolbar">          
          <button class="r-fresh" @click.stop="createFColumn" raw>
            <i class="fa fa-plus"/> JS自定义列
          </button>
        </div>
        <div class="area">
          <ul class="columnsArea" v-sort="{list:columns,sorter,name:'columns'}">
            <li v-for="(c) in columns" :class="{hide:c.hide,unenabled:(useEnabler && !c.enabled)}" :fixed="c.fixed" :key="c.ename">
                <r-toggle v-if="useEnabler" class="icon" v-model="c.enabled" :iconMode='0' :hint2="`${c.enabled?'已启用':'已禁用'}`"/>
                <label @click.stop="()=>{c.hide=!c.hide}">                
                    <r-toggle class="icon" :checked="c.hide" :iconMode='1' :reverse="true" :hint2="`${c.hide?'已隐藏':'已显示'}`"/>
                    <span>{{c.cname}}</span>
                </label>
                <i v-if="c.isCustom" class="fa fa-pencil" @click.stop="editFuncColumn(c)" title="修改"/>
                <i v-if="c.isCustom" class="fa fa-close" @click.stop="removeFuncColumn(c)" />
            </li>
          </ul>
          <columnEditor class="createArea" v-if="visible_columnEditor" :func="fColumn.func" :cname="fColumn.cname" :columns="columns" @finish="edited" @cancel="unedit" />
        </div>
        
      </div>
    </r-minipopup>
</template>

<script>
import common from '@/components/columnsDisplayer.vue/mixin'
import columnEditor from '@/components/columnEditor.vue'
import { Column } from '@/models'

export default {
  mixins:[common],
  components:{columnEditor},
  props:{
      useEnabler:{
          type:Boolean,
          required:false,
          default:false
      }
  },
  data(){
    return {
      visible_columnEditor: false,
      fColumn: undefined
    }
  },
  methods:{
    createFColumn(){
      if(!this.visible_columnEditor){
        this.visible_columnEditor = true
        this.fColumn = new Column({func:'',ename:`${Math.round(Math.random()*10000000)}`}) // GetColumn(Object.assign(Column(),{func:'',ename:`${Math.round(Math.random()*10000000)}`}))
      }
    },
    unedit(){
      this.visible_columnEditor = false
      this.fColumn = undefined
    },
    removeFuncColumn(fc){
      console.log(fc)
      this.columns.splice(this.columns.indexOf(fc),1)
    },
    editFuncColumn(fc){
      this.fColumn = fc
      this.visible_columnEditor = true
    },
    edited({cname,func}){
      Object.assign(this.fColumn,{cname,func})
      const existed = this.columns.indexOf(this.fColumn) !== -1
      if(!existed){
        const index = this.columns.filter(t=>t.fixed === 'l').length
        this.columns.splice(index,0,this.fColumn)
      }
      // console.log(this.fColumn)
      this.unedit()
      this.$emit('edited')
    }
  }
}
</script>

<style lang="scss" scoped src="@/components/columnsDisplayer.vue/css.scss"></style>
