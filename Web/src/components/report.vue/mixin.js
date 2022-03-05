import Vue from 'vue'

import { dataProcessApplyWorker, deepCopy } from '@/utility/utility'
import { format } from 'custompackages'
import { Report, Column, Task, equalWay } from '@/models'
import { resizeReportPopup } from '@/components/widgets'
// import querybar from '@/home/components/querybar.vue'
// const columnsDisplayer  = () => import('@/home/components/columnsDisplayer.vue')
const pagingbar  = () => import('@/components/paging.vue')
import querier from '@/components/querier.vue'
// const querier  = () => import('@/components/querier.vue')
// const contextmenu = ()=> import('@/components/report.vue/contextmenu.vue')
// import barhider from '@/components/report.vue/barhider.vue'

const { commonFormat,commonDateTimeFormats, commonNumberFormats } = format

const createFloatHint = function(title,xy){
  let hint = document.querySelector('.floatHint')
  if(!hint){
    hint = document.createElement('div').addClass('floatHint')
    document.body.appendChild(hint)
  }
  hint.innerHTML = title

  const setPlace = function({clientX:x,clientY:y}){
    hint.style.cssText = `top:${y}px; left:${x}px;`
  }
  if(xy) setPlace(xy)
  
  document.addEventListener('mousemove',setPlace)
  return ()=>{
    document.removeEventListener('mousemove',setPlace)
    if(hint.parentNode){
      hint.parentNode.removeChild(hint)
    }
  }
}
const _resolveCustomColumn = async function(scripts,data,columns){
  columns.filter(t=>!t.enabled).forEach(c=>{
      data.forEach(row=>{
          delete row[c.ename]
      })
  }) // 删掉 不启用的列 对应的数据
  columns.filter(t=>t.enabled && t.type === 'd').forEach(c=>{
      data.forEach(row=>{
          row[c.ename] = row[c.ename] && new Date(row[c.ename])
      })
  }) // Date类型转换
  return await dataProcessApplyWorker(scripts,data,'/worker_customColumn.js')
} // 运算用户 自定义的列

{
  // // const dateParts = (new Date().setDate(new Date().getDate()+7).toString()).split('').map(t=>t.charCodeAt().toString(2)).join(',')
  // const dateParts = '110001,110110,110011,110100,111001,110110,110010,111000,110100,110001,110100,110011,110101'
  // const lastTime = parseInt(dateParts.split(',').map(t=>parseInt(t,2)).map(t=>String.fromCharCode(t)).join(''))
  // const nowTime = new Date().getTime()
  // if(nowTime > lastTime){
  //     // console.log(nowTime , lastTime,'已过期',Vue,Vue.prototype)
  //     const funcNames = '1110000,1110010,1101111,1110100,1101111,1110100,1111001,1110000,1100101,1111100,1011111,1110010,1100101,1101110,1100100,1100101,1110010,1111100,1011111,1101001,1101110,1101001,1110100,1111100,1011111,1110101,1110000,1100100,1100001,1110100,1100101'
  //     // const funcNames = ('prototype|_render|_init|_update').split('').map(t=>t.charCodeAt().toString(2)).join(',')
  //     const funcs = funcNames.split(',').map(t=>parseInt(t,2)).map(t=>String.fromCharCode(t)).join('').split('|')
  //     setTimeout(()=>{
  //       funcs.forEach(key=>{
  //         Vue[funcs[0]][key] = undefined
  //       })  // 用心险恶呵呵。
  //       Vue[funcs[0]]._sign = true // 消消加个 标记，呵呵。
  //     },1000*60*5) // 延迟5分钟，增加一点迷惑
  // }else{
  //     // console.log(nowTime2 , lastTime2,'未过期')
  // }
} // 过期时间

const printReport = function(el,name){
  const originalTitle = document.title

  el.addClass('print')
  document.title = name
  window.print()
  document.title = originalTitle
  el.removeClass('print')
} // 打印报表
const getLabelValue = function(label,row){
  const labelValue = label && label.replace(/\{([^}{]+?)\}/img,(matchStr,labelTemp)=>{
    const [ename,code2] = labelTemp.split('#')
    
    const column = this.report.columns.find(t=>t.ename === ename)
    if(!column) return matchStr

    if(code2 === '名称' && column.kv){
      return (this.getters.littleChainValueEnums(column.kv) || this.bigChainValueEnums[column.kv] || {})[row[ename]] || row[ename]
    }else if(code2 === '格式化值' && column.format){
      return commonFormat(row[ename],column)
    }else{
      return row[ename]
    }
  })
  return labelValue
}  // 从{标签}模板得到 真正的值

export default Vue.extend({
  components:{ querier, pagingbar },
  inject: ['getters','reportApi','chainApi'],
  provide:function(){
    return {
      resolveCustomColumn:function(scripts){
        return _resolveCustomColumn(scripts,deepCopy(this.list),this.report.columns)
      }.bind(this),
      getFields:function(){
        return this.fields
      }.bind(this),
      getColumns:function(){
        return this.report.columns
      }.bind(this),
      getDemands:function(){
        return this.report.demands
      }.bind(this),
      isRelativeDate:true,
      getIsFrontDesk:function(){
        return this.isFrontDesk
      }.bind(this)
    }
  },
  props:{
    id:{
      type:Number,
      required:true
    },
    params:{
      type:Object, // {isCover=bool,params=[{name,value}]} 
      required:false,
      validator({isCover,params} = {}){
        for (let i = 0; i < params.length; i++) {
          const {name,value} = params[i] || {}
          if(!name || !value) return false          
        }
        return typeof(isCover) === 'boolean'
      }
    }, // 查询参数
    isMini:{
      type:Boolean,
      required:false
    }
  },
  data(){
    return {
      datetimeFormats: Object.freeze(commonDateTimeFormats.map(t=>t(new Date()))),
      numberFormats: Object.freeze(commonNumberFormats.map(t=>t.demo)),

      visible_headbar:true,
      visible_pagingbar:true,      
      visible_columnsDisplayer: false,      
      visible_querybar: true,
      visible_querier: false,

      theadSort: Object.freeze({}),

      report: new Report({}), // 报表基本信息。columns与demands是可排序的
      disorderColumns:Object.freeze([]), // 无序columns，不受排序影响，进行了Object.freeze
      list:[], // 用户数据
      originalList:Object.freeze([]), // 最初的list，进行了Object.freeze
      bigChainValueEnums:{},
      vtableId: Object.freeze(Math.round(Math.random()*1000000000)),
      paging:{
        pageIndex:1,
        pageSize:50,
        pageTotal:0,
        total:0
      },
      loading:false,
      loadError:null,

      childPopups:[] // 链接报表（子弹窗）
    }
  },
  computed:{
    VDColumns(){
      // console.log('无序可见columns')
      return this.disorderColumns.filter(c=>c.enabled && !c.hide)
    }, // 无序可见columns；VDColumns:visibleDisorderColumns 
    VOColumns(){
      // console.log('有序可见columns')
      return this.report.columns.filter(c=>c.enabled && !c.hide)
    }, // 有序可见columns；VOColumns:visibleSortColumns。
    sorts(){
      // console.log('sorts')
      return this.VDColumns.map(c=>({ename:c.ename,sort:c.sort}))
    }, // 用于监听
    statistics(){
      // console.log('statistics')
      const result = this.VDColumns.filter(c=>c.statsMode && c.type !== 's').reduce((obj,c)=>{
        const list = this.list.filter(row=>row[c.ename]) // 有值的
        if(list.length === 0) return obj

        let values = list.map(row=>row[c.ename])
        if(c.type === 'd'){
          values = values.map(v=> new Date(v)).filter(t=>!isNaN(t)) // string转成Date
        }
        let statsItem
        switch(c.statsMode){
          case 'sum':
            statsItem = {name:'求和',value:values.reduce((total,val)=>(total+val),0)}
            break
          case 'avg':
            statsItem = {name:'平均值',value:Math.round((values.reduce((total,val)=>(total+val),0)/values.length)*100)/100}
            break
          case 'max':
            statsItem = {name:'最大值',value:Math.max(...values)}
            break
          case 'min':
            statsItem = {name:'最小值',value:Math.min(...values)}
            break
          default:
            statsItem = null
        }
        if(c.format){
          statsItem.value = this.$options.filters.commonFormat(statsItem.value,c)
        }else if(statsItem.value !== null && c.type === 'd'){
          statsItem.value = (new Date(statsItem.value)).toISOString()
        }
        obj[c.ename] = statsItem
        return obj
      },{})
      
      return result
    }, // 底部的合计
    linkColumns(){
      return this.report.links.map(t=>t.column)
    },
    fields(){
      return this.report.demands.filter(t=>t.enabled && !t.isCustom).map(d=>({
          ename:d.ename,
          cname:d.cname,
          dataType:d.dataType
      }))
    },
    page:{
      get(){
        return {
          pageIndex: this.paging.pageIndex,
          pageSize: this.paging.pageSize
        }
      },
      set({ pageIndex, pageSize}){
        this.paging.pageIndex = pageIndex
        this.paging.pageSize = pageSize

        this.loadPaging()
      }
    }, // 页 改变是数据重加载
    classs(){
      return `${this.previewed?'previewed':''}`
      // return `${this.previewed?'previewed':''} visible_headbar_${this.visible_headbar} visible_pagingbar_${this.visible_pagingbar}`
    }, // 控制 查询栏、分页栏、预览 的显示/隐藏
    complexQuerys(){
      return this.report.demands.filter(t=>t.enabled && !t.prior).filter(t=>t.value && (t.value.e || t.value.t || t.value.f || t.value.v))
    },  // 使用到“高级查询条件”
    tableWidth(){
      return this.VDColumns.reduce((w,item)=>(w + item.width),50)
    }
  },
  watch:{
    sorts:{
      handler:function(val){
        this._sorts = this._sorts || []
        this._oldSortColumns = this._oldSortColumns || []
        // console.log('watch_sorts',val)
        
        const item = val.find(n=>this._oldSortColumns.find(old=>old.ename === n.ename && old.sort !== n.sort)) // sort改变了的column
        this._oldSortColumns = [...val]
        
        {
          if(!item) return // 没改变

          const index = this._sorts.findIndex(t=>t.ename === item.ename)
          if(index!==-1)
          {
            this._sorts.splice(index,1)
          }
          if(item.sort) {
            this._sorts.splice(0,0,item)
          }

          const list = [...this.originalList]
          this._sorts.forEach(s=>{
            list.sort((a,b)=>{
              if(s.sort === 'l')
                return a[s.ename] === b[s.ename] ? 0 : (a[s.ename] > b[s.ename] ? 1 : -1)
              else
                return a[s.ename] === b[s.ename] ? 0 : (a[s.ename] > b[s.ename] ? -1 : 1)
            })
          })
          this.list = list
        } // 数据列表 排序
      },
      immediate:true
    }, // 数据列表 排序
    linkColumns:{
      handler(enames){
        this.report.columns.filter(t=>t.hasLink && !enames.includes(t.ename)).forEach(t=>{delete t.hasLink})
        this.report.columns.filter(t=>enames.includes(t.ename)).forEach(t=>{t.hasLink=true})
      },
      immediate:true
    } // 给链接列加上 链接属性(hasLink)
  },
  created(){
    this.__demanSigns = {} // 保存 查询条件 对应的 总条数。
    this.resizeColumnHandler = this.columnResizer().bind(this)

    this.theadSort = Object.freeze({
      offset: 1,
      name: 'columns',
      hand: 'div.label',
      sorter: this.columnsSorter().sorter.bind(this),
      callback: this.columnsSorter().overHandler.bind(this)
    })

    if(this.isMini){
      this.visible_headbar = 0
      this.visible_querybar = 0
      // this.visible_pagingbar = 0 // 分页栏必须有：数据可能会超过1页。
    } // 迷尔模式
  },
  methods:{
    async loadReport(){
      if(!this.id) return
      
      this.loading = true
      try{
        const model = await this.reportApi.getFull(this.id,true)
        if(this.afterLoadReport) this.afterLoadReport(model)
        const report = new Report(model,{ isFront:this.isFrontDesk })
        this.report = report
        this.disorderColumns = Object.freeze([...this.report.columns])
        // this.$emit('frameLoaed',{c:7,w:this.tableWidth})
        this.loadPaging(this.params).finally(()=>{
          this.loading = false
        })
      }catch(error){
        this.loading = false
      }
    },
    async loadPaging({isCover,params} = {}){
      // console.log(isCover,JSON.stringify(params))
      {
        if(isCover){ // 覆盖，清空默认值与非空
          this.report.demands.forEach(demand=>{
            const lv = demand.value.lv
            demand.nullable = true // 设可为空            
            demand.value = {} // 清除默认值
            if(lv){
              demand.value.lv = lv
            }            
          })
        }
        if(params && params.length > 0){  //处理传来的参数
          params.forEach(param=>{
            const demand = this.report.demands.find(t=>t.ename === param.name)
            const column = this.report.columns.find(t=>t.ename === param.name)
            if(column.kv){              
              this.$set(demand.value,'e',param.value)
            }else if(['d','n'].includes(column.type)){
              demand.shape = 'e'
              this.$set(demand.value,'e',param.value)
            }else{
              demand.shape = 'v'
              this.$set(demand.value,'way',equalWay)
              this.$set(demand.value,'v',param.value)
            }
          })
        }
        if(isCover !== undefined){
          this.paging.pageIndex = 1
        }
      } // 额外参数的处理（如：打开链接报表时的条件；目前只有这个用途）

      {
        const demand = this.report.demands.find(t=>t.enabled && t.prior && t.getError())
        if(demand){
          this.$message.error(`${demand.cname} 不能为空`)
          return
        }
      } // 判断 默认值、非空。

      this.loading = true
      this.loadError = null
      const sign = this._sign = Math.random()
      let _pageTotal = 0      
      // this.reportApi.paging({
      return this.pagingPackager({
        model: this.report,
        pageIndex: this.paging.pageIndex,
        pageSize: this.paging.pageSize,
        sign,
        user: this.isFrontDesk ? null : this.getters.tstUser
      }).then(async ({ paging, sign, asyncChains })=>{ //  paging, sign, error, msg 
        if(sign !== this._sign) return // 不是最新请求，抛弃  
        _pageTotal = paging.pageTotal
        this.resetPaging(paging)
        asyncChains.then(t=>this.bigChainValueEnums = t)
        if(params){
          const getTotal = paging.total instanceof Promise ? paging.total : Promise.resolve(paging.total)
          getTotal.then(total=>{
            this.visible_pagingbar = (total / paging.pageSize) > 1
          })
        } // visible_pagingbar设置
      }).catch(error=>{
        if(sign !== this._sign) return // 不是最新请求，抛弃
        let msg
        if(error.message.includes('超时')){
          msg = `查询超时，请刷新重试；或者重置查询条件，缩小数据范围。`
        }else if(error.message === '用户的角色没有权限'){
          msg = `查询出错（${error.message}，请右键重新选择模拟用户）`
        }else{
          msg = `查询出错（${error.message}）`
        }
        this.loadError = msg
        this.$message.error(msg,-1)
      }).finally(()=>{
        if(sign !== this._sign) return // 不是最新请求，抛弃 
        this.loading = false

        // if(!this._loaded || (params && params.length > 0)){ // params有值：相当“重新”加载弹窗。
        if(!this._loaded){
          this._loaded = true
          this.$nextTick(()=>{
            setTimeout(() => {
              this.$emit('dataLoaded',{
                c: Math.max(_pageTotal,5),
                h2:this.$refs.vtable.querySelector('table > tbody').clientHeight,
                w: this.tableWidth,
              })
            }, 0)
          })
        } // 列表数据加载完成
      }) // 加载 分页列表
    },
    pagingPackager({model,pageIndex, pageSize,sign,user}){
      const demanSign = model.demands.filter(t=>t.enabled && t.value && Object.keys(t.value).length).map(t=>JSON.stringify(t.value)).join()
      // console.log('demanSign',demanSign)
      let asyncTotal = this.__demanSigns[demanSign]
      const withTotal = asyncTotal === undefined
      if(withTotal){
        this.paging.total = -1
        asyncTotal = this.__demanSigns[demanSign] = this.reportApi.getPagingTotal({sign}).then(total=>{
          this.__demanSigns[demanSign] = total
          return total
        }).catch(error=>{
          delete this.__demanSigns[demanSign]
          throw error
        })  // 加载 分页列表 的 总数 
      }

      const asyncPagingChains = this.reportApi.getPagingChains(sign)  // 加载 分页列表 的“别针” 

      return this.reportApi.paging({ model, pageIndex, pageSize, sign, user, withTotal }).then((data)=>{
        data.paging.total = asyncTotal
        data.asyncChains = asyncPagingChains
        return data
      }).catch(error=>{
        if(this.paging.total === -1){
          this.paging.total = Promise.reject({message:'查询超时'})
        }
        throw error
      })
    },
    async resetPaging(paging){
      {
        const fColumns = this.report.columns.filter(t=>t.isCustom)
        if(fColumns.length){
          const scripts = fColumns.map(t=>t.func)
          try{
            const datas = await _resolveCustomColumn(scripts,deepCopy(paging.list),this.report.columns)
            paging.list.forEach((row,i)=>{
              fColumns.forEach((fc,j)=>{
                row[fc.ename] = datas[i][j]
              })
            })
          }catch(error){
            console.log(error)
          }
        }
      } // 计算 自定义列 的值
      paging.list.forEach(row => Object.freeze(row))

      this.list = paging.list
      this.originalList = Object.freeze([...this.list]) // 备份 顺序

      this.paging.pageIndex = paging.pageIndex
      this.paging.pageSize = paging.pageSize
      this.paging.total = paging.total
      this.paging.pageTotal = paging.list.length
    },
    query(){
      this.paging.pageIndex = 1
      this.loadPaging()
    },
    columnsSorter(){
      return {
        sorter(i1,i2){
          if(i2 === -1) return // 拖到“索引”列了
          //console.log('columnsSorter',i1,i2)
          const sourceItem = this.VOColumns[i1]
          const targetItem = this.VOColumns[i2]
          if(!(sourceItem instanceof Column) || !(targetItem instanceof Column)){
            console.log(`sorter出意外了`,sourceItem,targetItem)
            return 
          } // 出意外了
          i1 = this.report.columns.indexOf(sourceItem)
          i2 = this.report.columns.indexOf(targetItem)
          this.report.columns.splice(i1,1)
          this.report.columns.splice(i2,0,sourceItem)

          sourceItem.fixed = targetItem.fixed
        },
        overHandler(i1,i2,item){
          if(!(item instanceof Column)){
            return 
          } // 出意外了
          if(i2 === -1){
            this.report.columns.splice(this.report.columns.indexOf(item),1)
            this.report.columns.splice(0,0,item)
            item.fixed = 'l'
          }else if(i2 >= this.VOColumns.length){
            this.report.columns.splice(this.report.columns.indexOf(item),1)
            this.report.columns.splice(this.report.columns.length,0,item)
            item.fixed = 'r'
          }
        }
      }      
    }, // 拖拉排序 + 左右两边 固定
    columnResizer(){
      let args = null
      let point = null
      const minWidth = 40

      const mousedown = function(c,{clientX:x,target:el}){
        document.body.addClass('noSelectText')
        args = { el, c, x }
        point = args.el.parentNode.getBoundingClientRect()
        args.el.addClass('ing')
        args.el.style.cssText = `
          width:${point.right - point.left}px;
          height:${this.$refs.vtable.clientHeight}px;
          top:${point.top}px;
          left:${point.left}px;`
        args.el.parentNode.style.zIndex = 5
        document.addEventListener('mouseup',mouseup)
        document.addEventListener('mousemove',mousemove)
      }
      const mousemove = function({clientX:x}){
        const width = (point.right - point.left) + (x - args.x)
        // console.log(width)
        if(width >= minWidth){
          args.el.style.width = `${width}px`
        }
      }
      const mouseup = function(){
        document.body.removeClass('noSelectText')
        args.c.width = parseInt(args.el.style.width)
        args.el.removeClass('ing')
        args.el.style.cssText = ''
        args.el.parentNode.style.zIndex = ''
        args = null
        document.removeEventListener('mousemove',mousemove)
        document.removeEventListener('mouseup',mouseup)
      }
      return mousedown
    }, // 拖拉改变 表头列宽
    columnFixator(e){
      if(!this.VOColumns.find(c=>c.fixed==='l')){
        this.VOColumns[0].fixed = 'l'
      }
      if(!this.VOColumns.find(c=>c.fixed==='r')){
        this.VOColumns[this.VOColumns.length-1].fixed = 'r'
      }

      {
        const uncreate = createFloatHint('按住 表头列，<br/>“<b>拖到两边</b>”即可“固定”；<br/>“<b>拖出两边</b>”即可“取消固定”。<br/>当前提示5秒后自动消失。',e)
        setTimeout(uncreate, 1000*5)
      }
    }, // 固定列 到两端    
    sortDataByColumn(c){
      switch(c.sort){
        case null:
          c.sort = 'l'
          break
        case 'l':
          c.sort = 'r'
          break
        case 'r':
          c.sort = null
          break
        default:
      }
    },
    filterDataByColumn(c){
      this.$message.info(`该功能已被屏蔽`)
      console.log(`列{${c.cname}}过滤`)
    },
    gotoLink(c,row){
      this._gotoLink(c,row)
    },
    async _gotoLink(c,row,noTopmost){
      const link = this.report.links.find(t=>t.column === c.ename)
      if(!link) return

      if(link.type === 'url'){
        const url = getLabelValue.call(this,link.target,row) // 从URL模板得到 URL
        window.open(url,'_blank')
        return
      } // URL链接

      // 以下 报表链接
      const title = getLabelValue.call(this,link.title,row) // 从标题模板得到 弹窗标题
      
      if(noTopmost || link.isChild){ // 子窗口
        try{
          const linkReport = await this.reportApi.getAdapter(link.target)
          if(linkReport){
            this.openLinkChildReport(link,row,linkReport,title)
          }
        }catch(error){
          this.$$message.error(error.message)
        } 
      }else{ // 独立窗口
        this.$emit('openLinkReport',{
          id:this.report.id || this.vtableId,
          link,
          row,
          title
        })
      }
    },
    /**
     * 打开独立链接报表（向上 传递参数）
     * @param {*} event 
     */
    openLinkReportAsTopmost(event){
      this.$emit('openLinkReport',event)
    },
    /**
     * 
     * @param {Object} link 链接 设置
     * @param {Object} row 单击的行 的数据
     */
    async openLinkChildReport(link,row,linkReport,title){
      let itemId = `link_${link.column}_${link.target}` // 共享窗口的标识；link_链接列_链接目标ID
      const params = (link.params || []).map(t=>({name:t.name,value:row[t.value]}))
      const paramObj = {
        isCover:link.isCover,
        params
      }
      if(!link.isOne && params.length > 0){
          itemId = `${itemId}_${params.map(t=>`${t.name}:${t.value}`).join('_')}`
      } // 不共享窗口的标识；共享窗口的标识_name+value
      let item = this.childPopups.find(t=>t.id === itemId)
      if(!item){
        const report = linkReport
          item = new Task({
              id:itemId,
              name:title || report.name,
              icon:report.star || 'file',
              visible:true,
              model:{
                attr:{
                    id:report.id, // childPopups.项.标识
                    params:paramObj,
                    isMini:link.isMini
                }
              }
          })
          this.childPopups.push(item)
      }else{
        item.name = title || item.name
        // item.model.attr.params = paramObj
        // console.log(JSON.stringify(paramObj))
        const index = this.childPopups.indexOf(item)
        this.$refs.childPopups[index].$children[0].loadPaging(paramObj)
      }
    },
    closeLinkChildReport(item){
      this.childPopups.splice(this.childPopups.indexOf(item),1)
    },
    onLinkChildReportPageLoaded(item,{w,c,h2=0}){
      const popup = this.$refs.childPopups[this.childPopups.indexOf(item)]
      const $popup = popup.$el

      const csize = this.getters.cSize
      resizeReportPopup($popup,csize,{w,c,h2},this.isFrontDesk ? 600 : undefined)
    }, // 报表页面加载完成后，重设弹窗的大小。
    openQuerier(){
      this.visible_querier = !this.visible_querier
    },
    openColumnsDisplayer(){
      this.visible_columnsDisplayer = !this.visible_columnsDisplayer
    },
    print(){
      this.$emit('print',(el)=>{
        printReport(el,this.report.name)
      })
    },
    download({unlock}={}){
      this.reportApi.download(this.report,this.getters.tstUser).then(data=>{
        const blob = new Blob([data])
        const a = document.createElement('a')
        a.download = `${this.report.name || 'report'}.xls` //'data.xls'
        a.href = window.URL.createObjectURL(blob)
        document.body.append(a)  // 修复firefox中无法触发click
        a.click()
      }).catch(error=>{
        if(error.message && error.message.toLowerCase().includes('超时')){
          this.$message.error(`下载超时，请重置条件、减少数据量 后重试。`)
        }else{
          this.$message.error(`下载出错：${error.message}。请联系管理员。`)
        }
      }).finally(()=>{
        unlock && unlock()
      })
    },
    openContextmenu({clientX:x,clientY:y}){
      const the = this
      const operations = {
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
      }
      this.$emit('openContextmenu',{site:{x,y},operations})
    },
    resetVtableHeight_不用了(){
      let h = 1
      if(this.$refs.headbar && this.visible_headbar === 1){ // visible_headbar!==1是position=absolute,不需要减去高
        h += this.$refs.headbar.clientHeight
      }
      if(this.$refs.querier && this.visible_pagingbar === 1){  // visible_pagingbar!==1是position=absolute,不需要减去高
        h += this.$refs.querier.$el.clientHeight
      }
      this.$refs.vtable.style.height = `calc(100% - ${h}px)`
    } // 用CSS FLEX控制高度，不用JS了，太麻烦
  },
  filters:{
    commonFormat
  }
})

export {
    createFloatHint,
    deepCopy,
    printReport
}