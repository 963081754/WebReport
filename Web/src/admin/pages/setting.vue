<template>
    <div class="comp">
        <div class="box1">
            <div class="box11">
                <fieldset>
                    <legend>前台类型 / 路由
                        <i class="fa fa-plus" @click.stop="addUserType"></i>
                    </legend>
                    <div v-for="(item,i) in model.userTypes" :key="i">                        
                        <input v-model.trim="item.name" class="r-fresh userType" placeholder="名称" raw>
                        <input v-model.trim="item.path" class="r-fresh userType" placeholder="路径" @change.stop="verifyPath(item)" raw>
                        <i class="fa fa-minus" @click.stop="removeUserType(item)" hint="删除"></i>
                        <a class="openWeb" :href="`/${item.path}`" target="_blank">
                            <i class="fa fa-hand-o-right" hint="打开前台"></i>
                        </a>
                    </div>
                </fieldset>
                <fieldset>
                    <legend>管理员账号</legend>
                    <div>               
                        <label style="word-spacing:1.75em">手 机</label>：  <!-- 手机号也要可改 -->
                        <input class="r-fresh" v-model.trim.lazy="model.mobile" readonly raw>
                    </div>

                    <div>
                        <label style="word-spacing:1.75em">密 码</label>：
                        <input type="password" class="r-fresh" v-model.trim.lazy="password" readonly placeholder="不输入密码，则密码不变" raw>
                    </div>

                    <div>
                        <label>重复密码</label>：
                        <input type="password" class="r-fresh" v-model.trim.lazy="password2" readonly placeholder="不输入密码，则密码不变" raw>
                    </div>
                </fieldset>
            </div>
            <fieldset class="box11 box12" v-if="currentUserType">
                <legend>
                    <select :value="currentUserType.id" @change="setCurrentUserType" class="r-fresh" beaut >
                        <option v-for="item in model.userTypes" :value="item.id" :key="item.id">{{item.name}}</option>
                    </select>
                    的数据来源（<span class="a" @click.stop="openInterfacePopup">查看接口详细说明</span>）
                </legend>
                <!-- <div class="originMode">
                    <label style="word-spacing: 1.70em;">来 自</label>：
                    <label>
                        <input :checked="true" type="radio"> URL接口(GET)
                    </label> 
                    <label>
                        <input :checked="false" disabled type="radio"> SQL查询
                    </label>
                </div> -->
                <div hint="{username}为 用户账号；{pwd}为 用户密码">
                    <label>*登录接口<br/><span>前台使用,Get</span></label>：
                    <input v-model.trim="currentUserType.userApi" class="r-fresh" maxlength="500" placeholder="必填，如：http:www.xxx.com/staff/{username}/{pwd}" raw>
                </div>
                <div hint="该接口不需要参数">
                    <label>角色接口<br/><span>后台使用,Get</span></label>：
                    <input v-model.trim="currentUserType.roleApi" class="r-fresh" maxlength="500" placeholder="非必填" raw>
                </div>                
                <div hint="{roleid}为 角色ID，值从 角色接口 来">
                    <label>模拟用户接口<br/><span>后台使用,Get</span></label>：
                    <input v-model.trim="currentUserType.userTstApi" class="r-fresh" maxlength="500" placeholder="非必填，如：http:www.xxx.com/staff/tst/{roleid} (不要对外公开)" raw>
                </div>
                <div class="bottom">
                    <r-button class="small" @click="previewRole" :disabled="!currentUserType.roleApi" raw>
                        <i class="fa fa-play-circle"/>角色预览
                    </r-button>
                    <r-button class="small" @click="previewUser" :disabled="!currentUserType.userApi" raw>
                        <i class="fa fa-play-circle"/>登录测试
                    </r-button>
                    <r-button class="small" @click="previewUserTst" :disabled="!currentUserType.userTstApi" raw>
                        <i class="fa fa-play-circle"/>模拟用户预览
                    </r-button>
                    <!-- <r-button class="small" :disabled="!currentUserType.userApi" raw>
                        <i class="fa fa-pencil"/>用户属性中文名映射
                    </r-button>   -->
                </div>
            </fieldset>
        </div>
        <div class="bottom">
            <r-button class="small" @click="save" raw>
                <i class="fa fa-check"/>保存
            </r-button>          
        </div>

        <r-minipopup :visible.sync="previewVisible" :title="previewTitle" :resizeable="true">
            <textarea class="previewBox" :value="formatPriviewData(previewData)" raw></textarea>
        </r-minipopup>

        <r-minipopup :visible.sync="visible_interfacePopup" title="登录、用户和角色的接口说明" :shade="true">
            <div class="interfaceExplain">
                <div class="item" v-for="(item1,i) in interfaceExplain" :key="i">                    
                    <template v-for="(item2,j) in item1">
                        <div class="row" :key="j">
                            <label>{{item2[0]}}：</label>
                            <span v-html="item2[1]"></span>
                        </div>
                    </template>
                </div>
            </div>
        </r-minipopup>
        
    </div>
</template>

<script>
import { Setting, UserType } from '@/models'
import { formatJson } from '@/utility/utility'

const setting = Setting()

// 以============================、-----------------、：来split
const interfaceExplain = `名词说明：特殊名词说明
-----------------
登录用户约束：强制将 登录用户的user对象的属性 绑定到报表的查询条件，限制用户的查询范围，使只能查看与自己有关的数据；<br/>如:我的订单，部门订单。
============================
对象说明：接口用到的复杂对象
-----------------
role：{
    id:string // 主键
    name:string // 角色名称
    state:boolean // 是否启用
} // 角色
-----------------
user：{
    id:string // 主键
    username:string //账号
    name:string // 姓名
    roles:[role] // role数组
    …… // 自定义的其它属性，数据类型必须是基本类型（string,number,date,boolean），不能是object、array.
} // 用户
-----------------
result1：{
    error:boolean, // 是否登录成功
    msg:string|null|undefined, // 登陆失败时的 错误信息 或 空
    data:user|null|undefined // user对象(成功时)或空(失败时)
} // 包含 user对象 的登录结果信息
============================
*登录接口：（前台使用），必需。
-----------------                
method：get
-----------------
参数：{
    username:string // 用户账号，使用标签{username}放入url中
    pwd:string // 用户密码，使用标签{pwd}放入url中
}
-----------------
返回值：result1 // 一个result1对象
-----------------
例子：http://www.xxx.com/staff/{username}/{pwd} 或 http://www.xxx.com/staff?username={username}&pwd={pwd}
============================
角色接口：（后台使用），非必需；后台设计报表 分配角色权限时用到，没有接口或接口返回值为空，则报表访问没有角色限制。
-----------------
method：get
-----------------
参数：没
-----------------
返回值：[role] // role数组 或 空数组
-----------------
例子：http://www.xxx.com/staff/role
============================
用户接口：（后台使用），非必需；根据 角色ID(可空) 随机获取一个用户；<br/>后台【模拟登陆用户】的获取接口，【登录用户约束】功能需要 模拟用户，否则无法使用该功能。
-----------------                
method：get
-----------------
参数：{
    roleid:string // 角色ID，可空；空，则 角色随机；roleid值从【角色接口】获取；使用标签{roleid}放入url中
}
-----------------
返回值：user|null|undefined // 一个user对象 或 空
-----------------
例子：http://www.xxx.com/staff/tst/{roleid} 或 http://www.xxx.com/staff/tst?roleid={roleid}`

export default {
    inject:['getters','settingApi'],
    data(){
        return {
            model: {},
            password: null,
            password2: null,
            currentUserType: null,
            previewData:null,
            previewType:null,
            visible_interfacePopup:false
        }
    },
    computed:{
        previewVisible:{
            get(){
                return !!this.previewData
            },
            set(value){
                if(!value){
                    this.previewData = null
                }
            }
        },
        previewTitle(){
            switch(this.previewType){
                case 'roleApi':
                    return `${this.currentUserType.name} 角色接口 测试`
                case 'userApi':
                    return `${this.currentUserType.name} 用户接口(前台登录) 测试`
                case 'userTstApi':
                    return `${this.currentUserType.name} 用户接口(后台测试) 测试`
            }
            return null
        },
        interfaceExplain(){
            let infos = interfaceExplain.split('============================')
                .map(t=>t.split(/-----------------/img)).map(item=>item.map(items=>{
                    items = items.split(/：/img).map(item=>{
                        if(!item) return item
                        item = item.trim()
                        item = item.replace(/\n|\r/img,'<br/>')
                            .replace(/\t/img,'\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0') // 制表符，Tab
                            .replace(/\s/img,'\xa0') // 空格
                            .trim()
                        return item
                    })
                    return items
                }))
            return infos
        }
    },
    created(){
        this.model = JSON.parse(JSON.stringify(this.getters.setting))
        if(this.model && this.model.userTypes.length){
            this.currentUserType = this.model.userTypes[0]
        }
    },
    methods:{
        verifyPath(item){
            try{
                this._verifyPath(item)
            }catch(error){
                this.$message.error(error.message)
            }
        },
        _verifyPath(item){
            if(['api','frontapi','admin','index'].includes((item.path || '').toLowerCase())){  
                const path = item.path              
                item.path = null
                throw Error(`${path} 已经被系统使用`)
            }else if(!(/^[_0-9a-z]*$/img).test(item.path)){                
                item.path = item.path.replace(/[^_0-9a-zA-Z]/img,'')
                throw Error(`前台路由 只能输入：字母、数字或下行线_`)
            }
        },
        verify(){
            if(this.password || this.password2){
                if(this.password !== this.password2){
                    throw Error('两次密码输入不一样')
                }
                this.model.password = this.password
            }
            for(let i=0;i < this.model.userTypes.length;i++){
                const userType = this.model.userTypes[i]
                this._verifyPath(userType)
                if(!userType.name || !userType.path){
                    throw Error(`前台类型与路由不能为空`)
                }                
                if(!userType.userApi){
                    throw Error(`${userType.name} 需要登陆接口`)
                }
            }            
            setting.verify(this.model)
        },
        async save({unlock}){
            try{
                this.verify()
                {
                    this.model.userTypes.filter(t=>!t.name && !t.path).forEach(item=>{
                        this.model.userTypes.splice(this.model.userTypes.indexOf(item),1)
                    })
                }
                await this.settingApi.update(this.model)
                this.$message.success('保存成功')
            }catch(err){
                this.$message.error(err.message)
                return
            }finally{
                unlock()
            }
        },
        addUserType(){
            this.model.userTypes.push(UserType())
        },
        removeUserType(item){
            this.$message.confirm(`删除该前台类型${item.name?`(<b>${item.name}</b>)`:''} 该前台类型对应的“目录”、“报表”也将一起删除，<br/>且不可恢复。确定删除吗？`).then(()=>{debugger
                if(['45413','57057','5153'].includes(item.id+'')){
                    this.$message.info('测试用的，不能删；你可以新建。')
                    return
                }
                if(this.model.userTypes.length < 2){
                    this.$message.info('删除失败，必须保留一个')
                    return
                }
                if(this.currentUserType === item){
                    this.currentUserType = null
                }
                this.model.userTypes.splice(this.model.userTypes.indexOf(item),1)
            }).catch(()=>{})
        },
        setCurrentUserType({target}){
            this.currentUserType = this.model.userTypes.find(t=>t.id == target.value)
            this.previewData = null // 关闭 测试结果窗口
        },        
        async previewRole({unlock}){
            this.previewType = 'roleApi'
            this.previewData = null
            try{
                const data = await this.settingApi.testUserApi(this.previewType,this.currentUserType.roleApi)
                this.previewData = JSON.stringify(data)
            }finally{
                unlock()
            }
        },
        async previewUser({unlock}){
            this.previewType = 'userApi'
            this.previewData = null
            try{
                const data = await this.settingApi.testUserApi(this.previewType,this.currentUserType.userApi)
                this.previewData = JSON.stringify(data)
            }finally{
                unlock()
            }
        },
        async previewUserTst({unlock}){
            this.previewType = 'userTstApi'
            this.previewData = null
            try{
                const data = await this.settingApi.testUserApi(this.previewType,`${this.currentUserType.userTstApi} ${this.currentUserType.roleApi || ''}`)
                this.previewData = JSON.stringify(data)
            }finally{
                unlock()
            }
        },
        openInterfacePopup(){
            this.visible_interfacePopup = true
        },
        formatPriviewData(json){
            return formatJson(json)
        }
    }
}
</script>

<style lang="scss" scoped>
.comp{
    // min-width: 1000px;
    fieldset{
        padding: 5px; 
        border: 1px solid #bbb;
        border-radius: 2px;
    }
    .box1{
        display: flex;
        padding: 5px; 
        .box11{
            fieldset{
                width: 250px;                               
                > div{
                    > label,> :nth-child(2){
                        display: inline-block;                
                    }
                    > label{
                        width: 60px;
                        overflow: hidden;
                        text-align: right;
                    }
                    > :nth-child(2){
                        width: calc(100% - 80px);
                        text-align: left;            
                    }
                    > input.userType{
                        width: calc(50% - 25px);     
                        margin-right: 5px;
                    }
                    > a.openWeb > i.fa,
                    > i.fa{
                        width: 20px;
                        height: 20px;
                        line-height: 20px;
                        text-align: center;
                    }
                }
                i.fa{
                    cursor: pointer;
                }
            }
        }
        .box12{
            width: 500px;
            min-height: 100%;
            margin-left: 5px;
            > div:not(.bottom){
                padding-top: 10px;
                display: flex;
                > label:nth-child(1){
                    // display: inline-block;
                    width: 100px;
                    text-align: right;
                    > span{
                        color: #999;
                    }
                }
                > input:nth-child(2){
                    flex-grow: 1;
                    // width: calc(100% - 100px);
                }
            }
            > div.bottom{
                margin-top: 5px;
            }
        }
    }
    .bottom{
        clear:both;
        padding: 5px 0px;
        text-align: right;
        // background: #effeff;
        > button{
            margin: 0px 5px;
        }
    }
    .previewBox{
        min-width: 400px;
        min-height: 200px;
        width: 100%;
        height: 100%;
        outline: none;
        resize: none;
    }

    .interfaceExplain{
        padding: 5px;
        width: 820px;
        height: 400px;
        overflow: auto;
        > div.item{
            border-top: 1px solid #666;
            margin-top: 5px;
            &:first-child{
                border-top: none;
                margin-top: 0;
            }
            > div.row{
                display: flex;
                padding: 2px 0px;
                > label{
                    width: 100px;
                    min-width: 100px;
                    text-align: right;
                }
                &:first-child{
                    > label{
                        font-size: 1.1em;
                        font-weight: bold;
                    }
                }
            }
        }
        // width: 600px;
        // height: 500px;
    }
}
</style>