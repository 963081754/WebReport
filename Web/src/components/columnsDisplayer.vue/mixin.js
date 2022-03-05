import { Column } from '@/models'
export default {
    props:{
        visible:{
            type:Boolean,
            required:true
        },
        columns:{
            type:Array,
            required:true
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
    methods:{
      sorter(i1,i2,item){
        const targetItem = this.columns[i2]
        if(!(item instanceof Column) || !(targetItem instanceof Column)){
            console.log(`sorter出意外了`,item,targetItem)
            return 
        } // 出意外了
        this.columns.splice(i1,1)
        this.columns.splice(i2,0,item)
        // console.log(item.fixed , targetItem.fixed)
        item.fixed = targetItem.fixed // “固定”处理
      }
    }
}