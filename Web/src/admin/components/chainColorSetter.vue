<template>
    <r-minipopup :visible.sync="visiblePopup" :title="instance.name">
        <div class="chainColorSetter">
            <table>
                <tr><td>键</td><td>名称</td></tr>
                <tr v-for="item in this.instance.enumData" :key="item[0]">
                    <td>{{item[0]}}</td>
                    <td>
                        <label class="status" :style="getColorStyle(colors[item[0]])" >{{item[1]}}</label>
                        <i class="fa fa-pied-piper" @click.stop="openColorPicker(item[0],$event)" hint2l2 hint2="单击:分配颜色"/>                        
                    </td>
                </tr>
            </table>
            <colorPicker v-if="picker.visible" :visible.sync="picker.visible" :value.sync="colors[picker.value]" :site="picker.site" @update:visible="submit" />
        </div>
    </r-minipopup>
</template>

<script>
const colorPicker  = () => import('@/Uilibrary/colorPicker.vue')
import { getColorStyle } from '@/components/widgets'
import { Chain } from '@/models'

export default {
    components:{ colorPicker },
    inject:['chainApi'],
    props:{
        visible:{
            type:Boolean,
            rrequired:true
        },
        model:{
            type:Object,
            rrequired:true
        }
    },    
    data(){
        return{
            colors:{},
            picker:{
                visible:false,
                site:null,
                value:null
            }
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
        },
        instance(){
            return new Chain(this.model)
        }
    },
    watch:{
        instance:{
            handler(){
                this.colors = this.instance.colorEnums
            },
            immediate:true
        }
    },
    methods:{
        getColorStyle: getColorStyle,
        openColorPicker(value,{target}){
            this.picker.value = value
            this.picker.site = target
            this.picker.visible = true
        },
        async submit(){
            const colors = Object.entries(this.colors).map(t=>({id:t[0],value:t[1]})).filter(t=>t.value!=='#ffffff')
            await this.chainApi.updateColors(this.instance.id,colors)
        } // bug:如果直接 关闭窗口，这里不会执行
    }
}
</script>

<style lang="scss" scoped>
.chainColorSetter{
    > table{
        min-width: 100%;
        border-collapse:collapse;
        tr{
            &:first-child{
                background: #ecb;
                // color: #fff;
            }
            td{
                padding: 5px 5px;
                // height: 25px;
                // line-height: 25px;
                text-align: center;
                border: 1px solid #ba9;
                color: inherit;
                > label.status{
                    display: inline-block;
                    padding: 2px 5px;
                    border-radius: 2px;
                }
                > i.fa-pied-piper{
                    color: #f00;
                    cursor: pointer;
                    padding-right: 3px;
                }
            }
        }
    }
}
</style>
