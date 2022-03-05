<template>
    <r-minipopup :visible.sync="visiblePopup" title="表头管理器">
      <div class="columnsManager">
        <r-declare class="descr" :left="-180" :content="['支持拖拽排序。','上下灰色的是两边的固定列。']"/>
        <!-- <div class="toolbar"></div> -->
        <div class="area">
          <ul class="columnsArea" v-sort="{list:columns,sorter,name:'columns'}">
            <li v-for="(c) in columns" :class="{hide:c.hide}" :fixed="c.fixed" :key="c.ename">
                <label @click.stop="()=>{c.hide=!c.hide}">
                    <r-toggle class="icon" :checked="c.hide" :iconMode='1' :reverse="true" :hint2="`${c.hide?'已隐藏':'已显示'}`"/>
                    <span>{{c.cname}}</span>
                </label>
            </li>
          </ul>
        </div>        
      </div>
    </r-minipopup>
</template>

<script>
import common from '@/components/columnsDisplayer.vue/mixin'
export default {
  mixins:[common]
}
</script>

<style lang="scss" scoped src="@/components/columnsDisplayer.vue/css.scss"></style>
<style lang="scss" scoped>
.columnsManager{
  > .area{
    max-height: 100%;
  }
}
</style>