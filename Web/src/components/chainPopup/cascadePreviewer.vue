<template>
    <r-minipopup ref="minipopup1" :visible.sync="visiblePopup" :title="`${instance.name} 级联数据`" @close="$emit('close')">
        <div class="wall">
            <r-declare class="explain" :left="-230" :content="['单击表头的列名，可以<修改列名称>',`单击第2列的<i class='fa fa-pied-piper' style='color:#f00;'></i>，可以给它<分配颜色>`,`单击第2列的<i class='fa fa-folder'></i>，显示/隐藏 下一层数据`]"/>
            <div class="tableWrap" :class="{loading}" v-if="instance.fields.length > 0">
                <table class="table">
                    <thead>
                        <tr>
                            <td v-for="(field,index) in fields" :class="`td${index+1}`" :key="field.name" title="单击：修改名称">
                                <span class="cname">
                                    {{field.cname}}
                                </span>
                                <input class="r-fresh cname" v-model.trim.lazy="field.cname" :placeholder="field.cname || field.name" @change="changeCname(field)" @focus="$event.target.select()" raw>
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="row in list" :key="row[majorKey]">
                            <td v-for="(field,index) in fields" :class="`td${index+1}`" :key="field.name">                                
                                <template v-if="index === 1">
                                    {{spaces.slice(0,row._layer).join('\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0')}}
                                    <i v-if="row._layer < instance.masterKeys.layer && noChildren.indexOf(row[majorKey]) === -1" :class="`fa ${hasChild(row)?'fa-folder-open':'fa-folder'}`" @click.stop="loadData(row._layer+1,row)" hint2="显示/隐藏 下一层"/>
                                    <i v-if="row._layer < instance.masterKeys.layer && noChildren.indexOf(row[majorKey]) !== -1" class="fa fa-folder invalid"/>
                                    <label class="status" :style="getColorStyle(colors[row[majorKey]])">{{row[field.name]}}</label>
                                    <i class="fa fa-pied-piper" @click.stop="openColorPicker(row[majorKey],$event)" hint2l2 hint2="单击:分配颜色"/>
                                </template>
                                <template v-else>{{row[field.name]}}</template>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
        <colorPicker v-if="picker.visible" :visible.sync="picker.visible" :value.sync="colors[picker.value]" :site="picker.site" @update:visible="submit" />
    </r-minipopup>
</template>

<script>
import mixin from '@/components/chainPopup/mixin'
const spaces = ['','','','','','','','','','']
export default {
    mixins:[mixin],
    data(){
        return {
            spaces:Object.freeze(spaces),
            noChildren:[]
        }
    },
    computed:{
        nameKey(){
            return this.instance.nameField.name 
        },
        pidKey(){
            return this.instance.pidField.name 
        }
    },
    watch:{
        id:{
            handler(){
                this._outcasts = []
                this.loadData(1,null)
            },
            immediate:true
        }
    },
    methods:{
        async loadData(layer,item){
            if(item && this.list.find(t=>t[this.pidKey] == item[this.majorKey])){
                this.removeChildren(item)
                return
            }
            if(layer > this.instance.masterKeys.layer) return

            const itemId = item && item[this.majorKey]
            this.loading = true
            let list = this._outcasts.filter(t=>t[this.pidKey] == itemId)
            if(list.length === 0){
                const { list: list2 } = await this.chainApi.dataLayerByPid(this.id,this.getters.tstUser,itemId,null,true)
                list = list2
                list.forEach(item =>item._layer = layer)
            }
            this.loading = false
            if(list.length === 0){
                this.noChildren.push(itemId)
                return
            }       
            if(layer > 1){
                const index = this.list.findIndex(t=>t[this.majorKey] === itemId)
                this.list.splice(index+1,0,...list.map(t=>Object.freeze(t)))
            }else{
                this.list = list.map(t=>Object.freeze(t))
            }                        
        },
        hasChild(item){
            return !!this.list.find(t=>t[this.pidKey] == item[this.majorKey])
        },
        removeChildren(item){
            const childs = this.list.filter(t=>t[this.pidKey] == item[this.majorKey])
            childs.forEach(child=>{
                this.removeChildren(child)
            })
            childs.forEach(child=>{
                const outcast = this.list.splice(this.list.indexOf(child),1)[0]
                if(this._outcasts.indexOf(outcast) === -1){
                    this._outcasts.push(outcast)
                }                
            })
        }
    }
}
</script>

<style lang="scss" scoped src="@/components/chainPopup/css.scss"></style>
<style lang="scss" scoped>
.table{
    > tbody{
        tr>{
            td.td2{
                left: 0px;
                > i.fa{
                    cursor: pointer;
                    padding-right: 3px;
                    &.invalid{
                        cursor:default;
                        color: #ccc;                        
                    }
                }
            }
        }
    }
}
</style>