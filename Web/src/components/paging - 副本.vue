<template>
    <div class="paging noSelectText">
      <i class="fa fa-step-backward" @click.stop="first"/>
      <i class="fa fa-backward" @click.stop="prev"/>
      第<input class="pageIndex r-fresh" v-model.number.trim.lazy="_pageIndex" v-focus-select raw>页
      <i class="fa fa-forward" @click.stop="next"/>
      <i class="fa fa-step-forward" @click.stop="last"/>
      <i class="fa fa-refresh" @click.stop="refresh"/>
      共 {{pageCount}} 页、{{total}} 条，
      每页
      <r-select class="pageSize" v-model.number="_pageSize" :nullable="false">
          <r-option v-for="item in pageSizeOptions" :value="item.value" :text="item.text" :key="item.value"/>
      </r-select>
      条，
      当前显示{{ pageSize*(_pageIndex - 1) + 1 }} - {{ pageSize*(_pageIndex - 1) + pageTotal }}条
      <!-- 当前显示{{pageSize*(_pageIndex - 1) + 1}} - {{_pageIndex === pageCount? total : pageSize*_pageIndex}}条 -->
    </div>   
</template>

<script>
export default {
    props:{
        pageIndex:{
            type:Number,
            required:true
        },
        pageSize:{
            type:Number,
            required:true
        },
        pageTotal:{
            type:Number,
            required:true
        },
        total:{
            type:Number,
            required:true
        }
    },
    data(){
        return {
            pageSizeOptions: Object.freeze([
                {value:10,text:10},
                {value:30,text:30},
                {value:50,text:50},
                {value:100,text:100},
                {value:300,text:300},
                {value:500,text:500},
                {value:1000,text:'1,000'}
                // {value:3000,text:'3,000'},
                // {value:5000,text:'5,000'},
                // {value:10000,text:'10,000'}
            ])
        }
    },
    computed:{
        pageCount(){
            return parseInt((this.total-1)/this.pageSize) + 1
        },
        _pageIndex:{
            get(){
                let pageIndex = this.pageIndex
                pageIndex = pageIndex < 1 ? 1 : pageIndex
                pageIndex = pageIndex > this.pageCount ? this.pageCount : pageIndex
                return pageIndex
            },
            set(n){
                if(n > this.pageCount) n = this.pageCount
                this.$emit('update:pageIndex',n)
            }
        },
        _pageSize:{
            get(){
                return this.pageSize
            },
            set(n){
                this.$emit('update:pageSize',n)
            }
        }
    },
    methods:{
        first(){
            this.$emit('update:pageIndex',1)
        },
        last(){
            this.$emit('update:pageIndex',this.pageCount)
        },
        prev(){
            let pageIndex = this._pageIndex - 1
            pageIndex = pageIndex < 1 ? 1 : pageIndex
            this.$emit('update:pageIndex',pageIndex)
        },
        next(){
            let pageIndex = this._pageIndex + 1
            pageIndex = pageIndex > this.pageCount ? this.pageCount : pageIndex
            this.$emit('update:pageIndex',pageIndex)
        },
        refresh(){
            this.$emit('refresh')
        }
    }
}
</script>

<style lang="scss" scoped>
.paging{
  height: 30px;
  padding-top:4px;
  > i.fa{
    cursor: pointer;
    height: 22px;
    width: 24px;
    text-align: center;
    line-height: 22px;
    border: 1px solid #fff;
    &:hover{
        border: 1px solid #ccd;
        background: #fee;
        border-radius: 2px;
    }
    &:active{
        border: 1px solid #ccd;
        background: #ddf;
        border-radius: 2px;
    }
  }
  .pageIndex{
    width:50px;
    text-align: center;
  }
  .pageSize{
    width: 60px;
    text-align: center;
  }
//   > .question{
//       margin-left: 10px;
//       color: #f33;
//       > i.fa{
//           color: #f33;
//       }
//   }
}
</style>