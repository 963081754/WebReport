import { NewCombiDemandItemFromDemand, DemandBase } from '@/models'

const mixin = {
    props:{
        cd:{
            type:Object,
            required:true
        }
    },
    // created(){debugger
    //     console.log(this.cd)
    // },
    methods:{
        itemsSorter(i1,i2,item){
            if(i1 === -1) return

            if(!(item instanceof DemandBase)){
                console.log(`sorter出意外了`,item)
                return 
            } // 出意外了

            this.cd.items.splice(i1,1)
            this.cd.items.splice(i2,0,item)
        },
        addOrRemoveItem(i1,i2,item,multi = false){
            if(!(item instanceof DemandBase)){
                console.log(`sorter出意外了`,item)
                return 
            } // 出意外了

            if(item.isCustom){
                this.$message.info('复合条件 不能再作为复合条件的项',1000)
                return
            }

            if(i2 === null){
                this.removeItem(item)
            }else if(i1 === -1){
                if(!multi && this.cd.items.find(t=>t.ename === item.ename)) return

                const d = NewCombiDemandItemFromDemand(item)
                d.value = {} // 清掉原来的值
                if(this.cd.type === 'cv'){
                    d.nullable = false
                }
                this.cd.items.push(d)
            }
        },
        removeItem(item){
            this.cd.items.splice(this.cd.items.indexOf(item),1)
        }
    }
}

export default mixin