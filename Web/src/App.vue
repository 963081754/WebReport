<template>
  <div id="app">
    <router-view />
    <div class="businessInfos">
      <ul>
        <li>浏览器支持：谷歌，360，火狐，opera，qq，搜狗，edge，IE(>=11，不推荐)等各大浏览器。</li>
        <li>数据库支持：MSSql（>=2005），MySql（正式版），Oracle（正式版）；可同时链接多个数据库。</li>
        <li>高效查询，支持1000万级数据分页（需 遵循数据库与SQL优化策略）</li>
        <li>权限支持：多前台类型（如：员工、客户、供应商等）、多角色、登录用户约束。</li>
        <li>登录接口支持：无需另建用户、角色，通过接口 使用已有的用户、角色数据；便于系统对接。</li>
        <li>不对链接的数据库做任何修改，只读模式，无需担心影响数据；建议只给数据库链接账号 只读权限。</li>  
        <li>可链接自己的远程数据库(MSSQL)，创建新报表，或修改当前已有的报表。</li>
        <li class="introduce">
          demo：<a href="http://www.zuobaobiao.cn/admin" target="_blank">www.zuobaobiao.cn/admin</a>
          文档：<a href="http://www.zuobaobiao.cn/" target="_blank">www.zuobaobiao.cn</a>          
          源码：<a href="https://github.com/963081754/WebReport" target="_blank">github</a>
        </li>  
        <!-- <li class="contact">联系方式：微信（ls892465856），电话（17701142185）</li>       -->
        <li class="contact">Copyright 2021-2023 开发者 版权所有 电话：17701142185 微信：ls892465856  <a href="http://beian.miit.gov.cn" target="_blank">粤ICP备2021091428号</a></li>
      </ul>
    </div>
    <div class="guide" v-if="!hideGuide" @mouseenter.stop="closed=false" @mouseleave.stop="closed=true">
      <div class="title">
        <i class="fa fa-th-large"/>视频演示
        <!-- <i class="fa fa-thumb-tack tack" v-if="!closed"/> -->
      </div>
      <ul v-if="!closed">
        <li v-for="(item,i) in guideVideos" :class="{active:item === palyGuide}" @click.stop="openPlay(item)" :key="i">
          <i v-if="item.mp4" class="fa fa-play-circle"/>
          <i v-else class="fa txt">T</i>
          <span class="tof">{{item.name.split('：')[0]}}：</span>
          <span>{{item.name.split('：').slice(1,10).join('：')}}</span>
        </li>
      </ul>
    </div>
    <div class="play" v-if="!hideGuide && palyGuide">
      <div class="wrap">
        <div class="title">
          {{palyGuide.name}}
          <i class="fa fa-times-circle close" @click.stop="closePlay" hint="关闭" />
        </div>
        <video height="600" controls="controls" autoplay="autoplay">
          <!-- <source src="/guide.ogg" type="video/ogg" /> -->
          <source :src="getVideoUrl(palyGuide)" type="video/mp4" />
          <!-- <source src="/guide.webm" type="video/webm" /> -->
          <object :data="getVideoUrl(palyGuide)" height="600">
            <!-- <embed height="600" src="/guide.swf" /> -->
          </object>
        </video>
      </div>
    </div>
  </div>
</template>

<script>
const guideVideos = Object.freeze([
  {name:'一个完整的报表设计示例：采购明细',mp4:true},

  {name:'配置：自定义 前台类型（如：员工、客户等）',mp4:true},
  {name:'配置：基于已有角色、用户的轻松对接',mp4:true},
  {name:'配置：多数据库链接',mp4:true},  
  {name:'配置：后台模拟【登录用户】',mp4:true},

  {name:'报表复用：一句SQL，多报表共享',mp4:true},  
  {name:'报表链接：打开子报表（如：弹出 明细）',mp4:true},
  {name:'URL 链接：传参打开外部URL',mp4:true},  
  {name:'报表权限：角色分配',mp4:true},
  {name:'报表权限：登录用户约束 方式一（如：我的采购单）',mp4:true},
  {name:'报表权限：登录用户约束 方式二（如：我的采购单）',mp4:true},
  
  {name:'表格设计：重命名、排序、拖拽、列宽、对齐、格式化、【别针】绑定、两边固定、显示隐藏、合计等',mp4:true}, 
  {name:'表格设计：用【别针】绑定 列和条件，优化SQL JOIN',mp4:true}, 
  {name:'表格设计：JS自定义复杂计算列',mp4:true},
  {name:'表格设计：状态列的颜色标记',mp4:true},

  {name:'查询设计：查询栏设计',mp4:true},
  {name:'查询设计：条件的默认值、必填',mp4:true},
  {name:'查询设计：绑定级联下拉条件',mp4:true},
  {name:'查询设计：创建组合条件一',mp4:true},
  {name:'查询设计：创建组合条件二',mp4:true},
  {name:'查询设计：高级查询，复杂灵活',mp4:true},

  {name:'其它：打印、下载',mp4:true},
  {name:'其它：单报表浏览器窗口，方便系统嵌套',mp4:true},  
  {name:'其它：精简全屏，页面更宽敞',mp4:true},
  {name:'其它：多报表浏览，一点都不卡',mp4:true},
])

export default {
  name: 'App',
  inject:['hideGuide'],
  data(){
    return{
      guideVideos:guideVideos,
      palyGuide: null, //guideVideos[0],
      closed:true
    }
  },
  methods:{
    openPlay(item){
      const url = this.getVideoUrl(item)
      window.open(url,item.name)
      // this.closePlay()      
      // if(item.mp4){        
      //   this.$nextTick(()=>{this.palyGuide = item})
      // }
    },
    closePlay(){
      this.palyGuide = null
    },
    getVideoUrl(item){
      return `http://www.zuobaobiao.cn/video/${item.name}.mp4`
    }
  }
}
</script>

<style lang="scss" scope>
#app{
  position: relative;
  > .businessInfos{
    pointer-events: none;
    z-index: 1;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    // opacity: .7;
    background: none;
    user-select: none;

    display: flex;
    align-items: center;
    justify-content: center;
    > ul{
      text-align: left;
      display: inline-block;
      line-height: 2em;
      li{
        list-style:  outside;
        font-size: 1.2em;
        color: #654;
        &.contact{
          user-select: text;
          pointer-events: auto; 
          color: #987;
          > a{
            color: inherit;
            font-size: inherit;
            text-decoration: none;
            &:hover{
              color: #99f;
            }
          }
        }
        &.introduce{
          > a{
            pointer-events: auto; 
            color: #99f;
            font-size: 1em;
          } 
        }
      }
    }
  }
  > .guide{
    z-index: 2;
    position: absolute;
    top: 0px;
    right: 0px;

    color: #fff;
    max-height: 100%;

    display: flex;
    flex-direction: column;

    background: #220;      
    border-radius: 2px;
    // &:hover{
    //   background: #220;      
    //   border-radius: 2px;
    // }
    > .title{
      text-align: right;        
      font-size: 1.5em;
      color: inherit;
      letter-spacing: .15em;
      
      vertical-align: middle;
      padding: 5px 5px 5px 15px;
      cursor: pointer;
      > i.fa{
        color: #fff;
        margin-right: 5px;
      }
    }
    > .title:hover + ul{
      display: block;
    }
    > ul{
      // display: none;
      color: inherit;
      padding: 0px 0px 10px 0px;
      overflow: auto;
      > li{
        color: inherit;
        width: 280px;
        padding: 5px 5px 5px 15px;
        cursor: pointer;
        border-radius: 2px;

        display: flex;
        align-items: baseline;
        > i.fa{
          color: #fff;
          margin-right: 5px;
        }
        > i.txt{
          display: inline-block;
          font-family: monospace;
          width: 12px;
          height: 12px;
          background: #fff;
          border-radius: 6px;
          text-align: center;
          font-weight: bold;
          font-size: .5em;
          color: #000;
        }
        > span{
          color: inherit;
          // display: inline-block;
        }
        &:hover,
        &.active{
          background: #fff;
          color: #000;
          > i.fa{
            color: #000;
          }
          > i.txt{
            background: #000;
            color: #fff;
          }
        }
      }
      // &:hover{
      //   display: block;
      // }
    }
  }
  > .play{
    z-index: 1;
    position: absolute;
    top: 0px;
    right: 0px;
    height: 100%;
    width: 100%;

    display: flex;
    align-items: center;
    justify-content: center;
    > .wrap{
      > .title{
        font-size: 1.5em;
        color: #fff;
        letter-spacing: .15em;
        text-align: right;
        padding-bottom: 10px;
        > .close{
          color: #fff;
          margin-left: 5px;
          cursor: pointer;
        }
      }
      > video{
        outline: none;
        // border: 3px solid #fff;
        // border-radius: 2px;
        box-shadow: 1px 1px 20px 0px #111;
      }
    }
  }
}
</style>