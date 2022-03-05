<template>
    <div class="columnEditor">
        function customColumn(<label class="row a" @click.stop="visible_rowPropertys = !visible_rowPropertys" hint="单击 查看row的属性说明">row</label>){
            <textarea class="codeEditor" v-model.trim="newFunc" :placeholder="placeholder" raw></textarea>
        }
        <div class="toolbar">
            <input class="r-fresh cname" v-model.trim="newCname" placeholder="请输入列名称" raw>
            <button @click.stop="test" :disabled="!(newFunc && validCode !== newFunc)"  raw>
                <i class="fa fa-check"/> 测试
            </button>
            <button @click.stop="finish" :disabled="!(newFunc && validCode === newFunc)" raw>
                <i class="fa fa-check"/> 完成
            </button>
            <button @click.stop="$emit('cancel')" raw>
                <i class="fa fa-minus"/> 取消
            </button>
        </div>
        <div class="iconHtml">
            <span class="a" @click.stop="openIconSelector" hint="查看、拷贝 系统提供的图标的HTML代码">拷贝系统图标的HTML代码</span>
            ，更多参考这里：<a href="http://www.fontawesome.com.cn/faicons/" target="_blank">Font Awesome 中文网</a>
        </div>
        <r-minipopup :visible.sync="visible_rowPropertys" title="行对象row的属性说明" :shade="true" icon="tags">
          <div class="rowPropertys">
            <b>{</b>
            <ul>
              <li v-for="(c) in columns.filter(t=>t.enabled && !t.isCustom)" :key="c.ename">
                {{c.ename}} : <span class="descr">{{dataTypes[c.sourceType]}} // {{c.cname}}</span>
              </li>
            </ul>
            <b>}</b><br/>
            <span class="explain">属性值 说明：<br/>不是前端格式化后的与绑定“别针”后的值，<br/>而是从直接后端获取过来的原始值。</span>
          </div>
        </r-minipopup>
        <r-minipopup :visible.sync="visible_result" title="测试结果" :shade="true">
            <ul class="testResult">
                <li>行: 值</li>
                <li v-for="(item,i) in testResult" :key="i">
                    {{i}}: <span v-html="item"></span>
                </li>
            </ul>
        </r-minipopup>
        <iconSelector v-if="visible_iconSelector" :visible.sync="visible_iconSelector" @select="selectIcon" />
        <input iconValue />
    </div>
</template>

<script>
import { BaseJsDataTypes } from '@/models'
const iconSelector  = () => import('@/components/iconSelector.vue')

export default {
    components:{ iconSelector },
    inject:['resolveCustomColumn'],
    props:{
        columns:{
            type:Array,
            required:true
        },
        func:{
            type:String,
            required:false
        },
        cname:{
            type:String,
            required:false
        }
    },
    data(){
        return {
            newCname: this.cname,
            newFunc: this.func,
            validCode: this.func,
            testResult: Object.freeze([]),

            dataTypes: BaseJsDataTypes,
            visible_rowPropertys:false,
            visible_result: false,
            placeholder:Object.freeze(`函数体，代码示例：
    let value = null
    /*
    行对象row包含每一列的值。
    对value做一些处理……
    有的列(row的属性)可能没有值，注意处理 空值。
    */
    return value // 作为该列的值，显示在表格上。
        `),
        visible_iconSelector:false
        }
    },
    watch:{
        cname:{
            handler(){
                this.newCname = this.cname
            },
            immediate:true
        },
        func:{
            handler(){
                this.newFunc = this.func
                this.validCode = this.func
            },
            immediate:true
        }
    },
    methods:{
        test(){
            this.resolveCustomColumn([this.newFunc]).then(data=>{
                this.testResult = Object.freeze(data.map(t=>t[0]))
                this.visible_result = true
                this.validCode = this.newFunc
                // { // 自定义列 的类型 检查；不搞了
                //     const value = this.testResult.find(t=>t !== null && t !== undefined)
                //     if(value)
                //     // constructor === String
                // }
            }).catch(event=>{
                this.$message.error(`函数运行错误：${event.message}`)
            })
        },
        finish(){
            if(!this.newCname){
                this.$message.error('请输入列名称')
                return
            }
            if(this.validCode !== this.newFunc){
                return
            }
            this.$emit('finish',{cname:this.newCname,func:this.newFunc})
        },
        openIconSelector(){
            this.visible_iconSelector = true
        },
        selectIcon(icon){            
            const $input = this.$el.querySelector('[iconValue]')
            $input.value = `<i class="fa fa-${icon}"/>`
            $input.select()
            document.execCommand("copy")
            this.$message.success(`<input value='${$input.value}' style="outline:none;border:none;background:none;width:200px;"/>`)
        }
    }
}
</script>

<style lang="scss" scoped>
.columnEditor{
    height: 100%;
    width: 350px;
    overflow: auto;
    > .codeEditor{
        resize: none;
        width: 100%;
        height: calc(100% - 84px - 25px);
        margin: 5px 0px;
        font-weight: normal;

        box-shadow: 0 0 3px 0px inset #999;
        border:none;
        // border: 1px solid #999;
        border-radius: 0;
    }
    > .row{
        padding: 3px;
    }
    > .iconHtml{
        height:25px;
        padding: 5px 5px;
        text-align: left;
    }
    > .toolbar{
        padding: 5px;
        // background: #effeff;
        text-align: right;
        button{
            margin-left: 10px;
        }
        input.cname{
            float: left;
        //   width: 120px;
        }
    }
    .rowPropertys{
        max-height: 500px;
        font-weight: normal;
        > ul{
            > li{
                padding-left: 10px;
                font-size: 1.1em;
                 > .descr{
                    color: #999;
                    font-size: 12px;
                }
            }
        }
        > .explain{
            color: #f00;
        }
    }
    .testResult{
        li:first-child{
            border-bottom: 1px solid #999;
        }
    }
    > [iconValue]{
        position: absolute;
        top: 0px;
        left: 0px;
        z-index: -1;
    }
}
</style>