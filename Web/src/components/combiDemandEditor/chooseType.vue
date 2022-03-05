<template>
    <div class="first">
        <table class="demo">
            <tr class="head">
                <td>
                    <!-- 标签 -->
                </td>
                <td>
                <!-- 输入框 -->
                <label class="choose">
                    类似以下输入方式的<input v-model="type" value="cn" name="type" type="radio">
                </label>
                </td>
            </tr>
            <tr>
                <td>
                <select beaut>
                    <option>订单号</option>
                    <option>运单号</option>
                </select>：
                </td>
                <td>
                <input class="r-fresh" v-model="demoValues.str" style="width:215px;" type="text" raw>
                </td>
            </tr>
            <tr>
                <td>
                <select beaut>
                    <option>下单时间</option>
                    <option>审核时间</option>
                    <option>结束时间</option>
                </select>：
                </td>
                <td>
                <r-date-picker class="datePicker r-fresh" v-model="demoValues.date.f" :defaultShortcuts="true" 
                    hint="时间的默认值 相对用户的登录日期变化。" raw>
                </r-date-picker>
                <label>到</label>
                <r-date-picker class="datePicker r-fresh" v-model="demoValues.date.t" :defaultShortcuts="true"
                hint="时间的默认值 相对用户的登录日期变化。" raw>
                </r-date-picker>
                </td>
            </tr>
            <tr>
                <td>
                <select beaut>
                    <option>按订单金额</option>
                    <option>按商品金额</option>
                    <option>按商品价格</option>
                </select>：
                </td>
                <td>
                <input class="num r-fresh" v-model="demoValues.num.f" raw type="number" />
                <label>到</label>
                <input class="num r-fresh" v-model="demoValues.num.t" raw  type="number"/>
                </td>
            </tr>

            <tr><td colspan="2" height="10"></td></tr>
            <tr class="head">
                <td>
                    <!-- 标签 -->
                </td>
                <td>
                <!-- 输入框 -->
                <label class="choose">
                    类似以下输入方式的<input v-model="type" value="cv" name="type" type="radio">
                </label>
                </td>
            </tr>
            <tr>
                <td>
                    <span>特殊订单</span>：
                </td>
                <td>
                    <r-select class="r-fresh" v-model="demoValues.complex" style="width:215px;">
                        <r-option :value="1" text="商品名称含(口罩)的订单(字符比较)"/>
                        <r-option :value="2" text="超时未结束订单(时间比较)"/>
                        <r-option :value="3" text="库存不足的订单(数字比较)"/>
                    </r-select>
                </td>
            </tr>
            <tr>
                <td>
                    <span>按范围</span>：
                </td>
                <td>
                    <r-select class="r-fresh" v-model="demoValues.my"  style="width:215px;">
                        <r-option :value="0" text="全部订单"/>
                        <r-option :value="1" text="公司订单"/>
                        <r-option :value="2" text="部门订单"/>
                        <r-option :value="3" text="我的订单"/>
                    </r-select>
                </td>
            </tr>

            <!-- <tr><td colspan="2" height="10"></td></tr>
            <tr class="head">
                <td></td>
                <td>
                <label class="choose">
                    类似以下输入方式的<input v-model="type" value="ca" name="type" type="radio">
                </label>
                </td>
            </tr>
            <tr class="ca">
                <td>
                    <span>订单类型</span>：
                </td>
                <td>
                    <select beaut v-model="cascade1Value">
                        <option v-for="item in demoValues.cascade1.filter(t=>!t.pid)" :value="item.id" :key="item.id">{{item.name}}</option>
                    </select>
                    <span>订单状态：</span>
                    <select beaut>
                        <option v-for="item in demoValues.cascade1.filter(t=>t.pid == cascade1Value)" :value="item.id" :key="item.id">{{item.name}}</option>
                    </select>
                </td>
            </tr>
            <tr class="ca">
                <td>
                    <span>城市</span>：
                </td>
                <td>
                    <select beaut v-model="cascade2Value.a" @change="updateCascade2Value">
                        <option v-for="item in demoValues.cascade2.filter(t=>!t.pid)" :value="item.id" :key="item.id">{{item.name}}</option>
                    </select>
                    <select beaut v-model="cascade2Value.b">
                        <option value="--">---------</option>
                        <option v-for="item in demoValues.cascade2.filter(t=>t.pid && t.pid == cascade2Value.a)" :value="item.id" :key="item.id">{{item.name}}</option>
                    </select>
                    <select beaut v-model="cascade2Value.c">
                        <option value="--">---------</option>
                        <option v-for="item in demoValues.cascade2.filter(t=>t.pid && t.pid == cascade2Value.b)" :value="item.id" :key="item.id">{{item.name}}</option>
                    </select>
                </td>
            </tr> -->

        </table>
        <div class="empty1"></div>
        <div class="toolbar">
            <button @click.stop="$emit('next',type)" raw>
                <i class="fa fa-hand-o-down"/> 下一步
            </button>
            <button @click.stop="$emit('cancel')" raw>
                <i class="fa fa-minus"/> 取消
            </button>
        </div>
    </div>
</template>

<script>
export default {
    data(){
        return {
            type:'cv',
            demoValues:{
                my:3,
                str:'20210512F03B16',
                num:{t:500,f:100},
                date:{t:new Date(),f:new Date(new Date().setMonth(new Date().getMonth()-3))},
                complex:2,

                cascade1:Object.freeze([
                    {id:'a',name:'采购'},
                    {id:'b',name:'销售'},
                    {id:'1',name:'未审核',pid:'a'},
                    {id:'2',name:'已审核',pid:'a'},
                    {id:'3',name:'已确认',pid:'a'},
                    {id:'4',name:'已入库',pid:'a'},
                    {id:'5',name:'未出库',pid:'b'},
                    {id:'6',name:'已出库',pid:'b'},
                ]),
                cascade2:Object.freeze([
                    {id:'a',name:'广东省'},
                    {id:'b',name:'湖南省'},
                    {id:'1',name:'广州市',pid:'a'},
                    {id:'2',name:'深圳市',pid:'a'},
                    {id:'3',name:'白云区',pid:'1'},
                    {id:'4',name:'黄埔区',pid:'1'},
                    {id:'5',name:'罗湖区',pid:'2'},
                    {id:'6',name:'南山区',pid:'2'},
                    {id:'7',name:'长沙市',pid:'b'},
                    {id:'8',name:'湘潭市',pid:'b'},
                    {id:'9',name:'芙蓉区',pid:'7'},
                    {id:'10',name:'岳麓区',pid:'7'},
                    {id:'11',name:'雨湖区',pid:'8'},
                    {id:'12',name:'岳塘区',pid:'8'},
                ])
            },
            cascade1Value:'a',
            cascade2Value:{
                a:'a',
                b:'1',
                c:'3'
            }
        }
    },
    methods:{
        updateCascade2Value(){
            this.cascade2Value.b = null
            this.cascade2Value.c = null
        }
    }
}
</script>

<style lang="scss" scoped>
.first{
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    > table.demo{
        width: 100%;
        border-collapse: collapse;
        // height: calc(100% - 39px);
        td{
            padding: 3px;
            .datePicker,input[type=number]{
                width: 100px;
            }
        }
        td:nth-child(1){
            text-align: right;            
        }
        tr.head{
            td{
                height: 24px;
                text-align: center;
                background: #fdd;
                border-top: 1px solid #ba9;
                border-bottom: 1px solid #ba9;
                label.choose{
                float: right;
                    input[type="radio"]{
                        vertical-align: middle;
                        margin-left: 5px;
                    }
                }
            }
            td:nth-child(2){
                text-align: left;
            }
            &:first-child td{
                border-top:none;
            }
        }
        tr:not(.head) > td{
            padding: 10px 3px;
        }
        // tr.ca{
        //     td:nth-child(2) > select{
        //         margin-right: 10px;
        //         // border-bottom: 1px solid #666;
        //         &:last-child{
        //             margin-right: 0px;
        //         }
        //     }
        // }
    }
    > .toolbar{
        padding: 5px;
        // background: #fdd;
        text-align: right;
        button{
            margin-left: 10px;
        }
    }
    > .empty1{
        flex-grow: 1;
    }
}
</style>