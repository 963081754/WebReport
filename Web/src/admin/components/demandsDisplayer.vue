<template>
    <r-minipopup :visible.sync="visiblePopup" title="条件管理器">
      <div class="demandManager">        
        <div class="toolbar">
          <r-declare class="descr" :left="-230" :content="[`禁用：前台用户不能作为条件，包括 高级查询。`,'支持拖拽排序。']"/>
          <button class="r-fresh" @click.stop="toCreate" raw>
            <i class="fa fa-plus"/> 创建复合条件
          </button>
        </div>
        <div class="area">
          <ul class="demandsArea" v-sort="{list:demands,sorter,name: 'columns'}">
            <li v-for="(d) in demands" :class="{enabled:d.enabled,prior:d.prior}" :key="d.ename">
                <label @click.stop="()=>{d.enabled=!d.enabled}">                
                    <r-toggle class="icon" :checked="d.enabled" :iconMode='0' :hint2="`${d.enabled?'已启用':'已禁用'}`"/>
                    <span>{{d.cname}}</span>
                </label>
                <i v-if="d.combi" class="fa fa-pencil" @click.stop="editCombiDemand(d)" title="修改"/>
                <i v-if="d.combi" class="fa fa-close" @click.stop="removeCombiDemand(d)"/>
            </li>
          </ul>
          <combiDemandEditor v-if="visible_creator" class="createArea" :combiDemand="editingCd" @finish="editEnd" />
        </div>
      </div>
    </r-minipopup>
</template>

<script>
import { DemandBase } from '@/models'
import combiDemandEditor from '@/components/combiDemandEditor/editor.vue'

export default {
  components:{ combiDemandEditor },
  props:{
      visible:{
          type:Boolean,
          required:true
      },
      demands:{
          type:Array,
          required:true
      }
  },
  data(){
    return{
      visible_creator: false,
      editingCd: null
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
    }
  },
  methods:{
    sorter(i1,i2,item){
      const target = this.demands[i2]
      if(!(item instanceof DemandBase) || !(target instanceof DemandBase)){
          console.log(`sorter出意外了`,item,target)
          return 
      } // 出意外了
      this.demands.splice(i1,1)
      this.demands.splice(i2,0,item)
      item.prior = target.prior
    },
    toCreate(){
      if(!this.visible_creator){
        this.visible_creator = true
        this.editingCd = null
      }
    },
    editEnd(cd){
      this.visible_creator = false
      if(!cd) return

      const index = this.demands.findIndex(t=>t.ename === cd.ename)
      if(index !== -1){
        this.demands.splice(index,1,cd)
      }else{
        cd.prior = true
        this.demands.splice(0,0,cd)
      }
      this.editingCd = null
    },
    editCombiDemand(cd){
      this.editingCd = cd
      this.visible_creator = true
    },
    removeCombiDemand(cd){
      this.demands.splice(this.demands.indexOf(cd),1)
    }
  }
}
</script>

<style lang="scss" scoped>
.demandManager{
  height: 360px;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  border: 1px solid #ecb;  
  > .toolbar{
    height: 25px;
    line-height: 25px;
    background: #ecb;
    position: relative;
    > .descr{
      position: absolute;
      top: -5px;
      right: 0px;
    }
  }
  > .area{
    display: flex;
    height: calc(100% - 25px);
    max-height: calc(100% - 25px);
    > ul.demandsArea ,> div.createArea{
      // display: inline-block;
      height: 100%;
      max-height: 100%;
      overflow: auto;
    }
    > ul.demandsArea{
      flex-grow: 1;
      min-width: 150px;
      li{
        padding: 0px 5px;
        height: 25px;
        line-height: 25px;    
        cursor: pointer;
        color: #888;
        text-decoration: line-through;
        .icon{
          margin-right: 5px;
          font-size: 1.1em;
        }
        span{
          cursor: pointer;
        }
        > .fa-pencil,
        > .fa-close{
          padding: 3px 5px;
          // margin: 0px 3px;
          &:hover{
            border-radius: 3px;
            background: #432;
            color: #fff;
          }
        }
      }
      li.enabled{
        color: #333;
        text-decoration:none;
      }
      li.enabled.prior{
        background: #fdd;
        border-bottom: 1px solid #ba9;
      }
      li:nth-child(even) {
        background: #fee;
      }
    }
    > div.createArea{
      width: 350px;
      border-left: 1px solid #ecb;
    }
  }
}
</style>