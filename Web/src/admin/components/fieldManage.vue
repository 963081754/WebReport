<template>
    <r-minipopup :visible.sync="visiblePopup" :resizeable="true" :closeable="false" title="数据库字段名翻译(用于报表列)">
        <div class="fieldManage">
            <div class="mtable">
                <table>
                    <thead>
                        <tr>                            
                            <td>字段名称(不可编辑)</td>
                            <td><!-- 当线条用 --></td>
                            <td>翻译的中文名称(可批量复制粘贴)</td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td class="fields">
                                <span v-if="loading">加载中……</span>
                                <label v-for="(name,i) in fields" :key="i">
                                    <span>{{i+1}}</span> {{name}}
                                </label>
                            </td>
                            <td><!-- 当线条用 --></td>
                            <td class="cnames">
                                <textarea v-model.lazy="cnames"></textarea>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="tools">
                <span class="explain">注：推荐用<a href="https://fanyi.baidu.com/" target="_blank">百度翻译</a>批量翻译，然后把结果粘贴到右边的框</span>
                <button class="small no" @click="cancel" raw>
                    <i class="fa fa-close"></i> 关闭
                </button>
                <r-button class="small" @click="save" raw>
                    <i class="fa fa-save"></i> 保存
                </r-button>
            </div>
        </div>
    </r-minipopup>
</template>

<script>
export default {
    inject:['chinesizeApi'],
    props:{
        visible:{
            type:Boolean,
            required:true
        }
    },
    data(){
        return{
            fields:Object.freeze([]),
            cnames:Object.freeze(''),
            loading:true
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
    created(){
        this.loadData()
    },
    methods:{
        async loadData(){
            const data = await this.chinesizeApi.getList()
            this.fields = Object.freeze(data.map(t=>t.name))
            this.cnames = Object.freeze(data.map(t=>t.cname).join('\n'))
            this.loading = false
        },
        async save({unlock}){
            try{
                const cnames = this.cnames.split(/\n/gm)
                const list = this.fields.map((name,i)=>({name,cname:cnames[i]}))
                await this.chinesizeApi.saveList(list)
                this.$message.success('保存成功')
            }finally{
                unlock()
            }
        },
        cancel(){
            this.$message.confirm('确定关闭吗？不要丢失未保存的工作。').then(()=>{
                this.visiblePopup = false
            }).catch(()=>{})
        }
    }
}
</script>

<style lang="scss" scoped>
div.fieldManage{
    height: 400px;
    min-width: 500px;
    // background: #fff;
    > .tools{
        height: 35px;
        line-height: 35px;
        text-align: right;
        // border-top: 1px solid #ecb;
        > button{
            margin: 5px;
        }
        > .explain{
            float: left;
            color: #666;
        }
    }
    > .mtable{
        height: calc(100% - 35px); 
        // height: 100%;
        width: 100%;
        overflow: auto;
        border-bottom: 1px solid #ecb;
        > table{
            border: 1px solid #ecb;
            border-bottom:none;
            border-spacing: 0px;
            width: 100%;
            height: 100%;            
            > thead tr td,
            > tbody tr td{
                width: 50%;
                &:nth-child(1){
                    width: 50%;
                }
                &:nth-child(3){
                    width: calc(50% - 1px);                    
                }
                &:nth-child(2){
                    width: 1px;
                    background: #ecb;
                    position: relative;
                    z-index: 3;
                }
            }
            > thead tr td{
                height: 30px;                
                height: 30;
                line-height: 30px;
                position: sticky;
                top: 0px;
                z-index: 2;
                text-align: center;
                background: #ecb;
            }
            > tbody tr td{
                height: calc(100% - 30px);
                vertical-align: top;
                &.cnames{
                    position: relative;
                    z-index: 1;
                    > textarea{
                        width: 100%;
                        height: 100%;
                        resize: none;
                        border: none;
                        outline: none;
                        background: none;
                        line-height: 1.7em;                    
                        padding: 0px 10px;
                        overflow: hidden;
                    }
                }
                &.fields{
                    line-height: 1.7em;
                    position: relative;
                    z-index: 0;
                    > label{
                        display: block;
                        position: relative;
                        padding: 0px 5px;
                        > span{
                            user-select: none;
                        }
                        &::after{
                            content: ' ';
                            display: block;
                            position: absolute;
                            z-index: -1;
                            top: 0px;
                            left: 0px;
                            width: 200%;
                            height: 100%;
                        }
                        &:nth-child(odd)::after{
                            background: #ffedea;   
                        }
                        &:hover::after{
                            // background: #ddd;
                            background: #fc9; 
                        }
                    }
                }
            }
        }
    }
}
</style>