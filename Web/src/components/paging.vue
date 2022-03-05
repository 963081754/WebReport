<template>
    <div class="paging noSelectText">
      <i class="fa fa-step-backward" @click.stop="first" :class="{disabled:realPageIndex === 1}"/>
      <i class="fa fa-backward" @click.stop="prev" :class="{disabled:realPageIndex === 1}"/>
      第<input class="pageIndex r-fresh" v-model.number.trim.lazy="realPageIndex" v-focus-select raw>页
      <i class="fa fa-forward" @click.stop="next" :class="{disabled:realPageCount >= 0 && realPageIndex >= realPageCount}"/>
      <i class="fa fa-step-forward" @click.stop="last" :class="{disabled:realTotal < 0 || (realPageCount >= 0 && realPageIndex >= realPageCount)}"/>
      <i class="fa fa-refresh" @click.stop="refresh"/>
      共       
      <template v-if="realTotal >= 0">{{realPageCount}}</template> 
      <i v-else-if="realTotal === -500" class="fa fa-exclamation-triangle" :hint2="totalMsg"/>     
      <i v-else class="fa fa-spinner fa-spin"/> 页、
      <template v-if="realTotal >= 0">{{totalString()}}</template>   
      <i v-else-if="realTotal === -500" class="fa fa-exclamation-triangle" :hint2="totalMsg"/>   
      <i v-else class="fa fa-spinner fa-spin"/> 条，
      每页
      <r-select class="pageSize" v-model.number="realPageSize" :nullable="false">
          <r-option v-for="item in pageSizeOptions" :value="item.value" :text="item.text" :key="item.value"/>
      </r-select>
      条，
      当前显示{{ pageSize*(realPageIndex - 1) + 1 }} - {{ pageSize*(realPageIndex - 1) + pageTotal }}条
      <!-- 当前显示{{pageSize*(realPageIndex - 1) + 1}} - {{realPageIndex === realPageCount? realTotal : pageSize*realPageIndex}}条 -->
    </div>   
</template>

<script>
export default {
    props:{
        pageTotal:{
            type:Number,
            required:true
        },
        page:{
            type:Object,
            required:true,
            validator:function({ pageIndex, pageSize }){
                return pageIndex && pageSize && typeof(pageIndex) === 'number' && typeof(pageSize) === 'number'
            }
        },
        asyncTotal:{
            type:[Number,Promise],
            required:true
        } // 异步 总数
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
            ]),
            realTotal: -1,
            totalMsg: null
        }
    },
    computed:{
        pageSize(){
            return this.page.pageSize
        },
        pageIndex(){
            return this.page.pageIndex
        },
        realPageCount(){
            return this.realTotal < 0 ? -1 : (parseInt((this.realTotal-1)/this.pageSize) + 1)
        },
        realPageIndex:{
            get(){
                let pageIndex = this.pageIndex
                pageIndex = pageIndex < 1 ? 1 : pageIndex
                if(this.realPageCount >= 0){
                    pageIndex = pageIndex > this.realPageCount ? this.realPageCount : pageIndex
                }
                return pageIndex
            },
            set(index){
                if(this.realPageCount >= 0){
                    if(index > this.realPageCount){
                        index = this.realPageCount
                    }
                }
                if(index < 1){
                    index = 1
                }
                if(index === this.page.pageIndex) return

                this.$emit('update:page',{
                    pageIndex: index,
                    pageSize: this.pageSize
                })
            }
        },
        realPageSize:{
            get(){
                return this.pageSize
            },
            set(size){
                this.$emit('update:page',{
                    pageIndex: 1,
                    pageSize: size
                })
            }
        }
    },
    watch:{
        asyncTotal:{
            async handler(){
                this.totalMsg = null
                const sign = this._sign = Math.random()                
                if(!(this.asyncTotal instanceof Promise)){ // 真正的值|-1
                    this.realTotal = this.asyncTotal
                    return
                }
                
                this.asyncTotal.then(total=>{
                    if(sign !== this._sign) return // 不是最新的，抛弃
                    this.realTotal = total
                }).catch(error=>{
                    if(sign !== this._sign) return // 不是最新的，抛弃
                     this.realTotal = -500
                     this.totalMsg = `查询错误（${error.message}）`
                })
            },
            immediate:true
        }
    },
    methods:{
        first(){
            this.realPageIndex = 1
        },
        last(){
            if(this.realPageCount < 0) return
            this.realPageIndex = this.realPageCount
        },
        prev(){
            let pageIndex = this.realPageIndex - 1
            this.realPageIndex = pageIndex
        },
        next(){
            let pageIndex = this.realPageIndex + 1
            this.realPageIndex = pageIndex
        },
        refresh(){
            this.$emit('refresh')
        },
        totalString(){
            if(this.realTotal > 10000){
                return `${(this.realTotal / 10000).toFixed(4)}万`
            }else{
                return `${this.realTotal}`
            }
        }
    }
}
</script>

<style lang="scss" scoped>
.paging{
  height: 30px;
  min-height: 30px;
//   line-height: 26px;
  padding: 3px 0px 1px 0px;
  > i.fa:not(.fa-spinner):not(.fa-exclamation-triangle){
    cursor: pointer;
    height: 25px;
    width: 25px;
    text-align: center;
    line-height: 25px;
    &.disabled{
        cursor: default;
    }
    &:hover:not(.disabled),
    &:active:not(.disabled){
        border-radius: 2px;
        background: #432;
        color: #fff;        
    }
    &.disabled{
        color: #999;
    }
  }
  i.fa.fa-exclamation-triangle{
      color: #f00;
  }
  .pageIndex{
    width:50px;
    text-align: center;
  }
  .pageSize{
    width: 60px;
    text-align: center;
  }
}
</style>