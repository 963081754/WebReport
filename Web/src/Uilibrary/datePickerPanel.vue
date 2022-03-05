<template>
    <div class="r-datePicker-panel noSelectText" v-if="!destroy">
        <div class="details" :class="{hasOptions:shortcutOptions.length}">
            <div class="ymd">
                <span class="left">
                    <template v-if="siteNo === sites.date">
                        <i class="fa fa-angle-double-left" @click.stop="calculates.subYear" hint="单击-1年"/>
                        <i class="fa fa-angle-left" @click.stop="calculates.subMonth" hint="单击-1月"/>
                    </template>
                    <template v-if="siteNo === sites.year">
                        <i class="fa fa-angle-double-left" @click.stop="calculates.sub10Year" hint="单击-10年"/>
                    </template>
                </span>
                <div class="ym">
                    <label @click.stop="openYearPanel" hint="单击选择 年">{{datetime.getFullYear()}}年</label>
                    <label @click.stop="openMonthPanel" hint="单击选择 月">{{datetime.getMonth()+1}}月</label>
                </div>
                <span class="right">
                    <template v-if="siteNo === sites.date">
                        <i class="fa fa-angle-right" @click.stop="calculates.addMonth" hint="单击+1月"/>
                        <i class="fa fa-angle-double-right" @click.stop="calculates.addYear" hint="单击+1年"/>
                    </template>
                    <template v-if="siteNo === sites.year">
                        <i class="fa fa-angle-double-right" @click.stop="calculates.add10Year" hint="单击+10年"/>
                    </template>
                </span>
            </div>
            <ul v-show="siteNo === sites.date" class="weeks">
                <li txt="日">日</li>
                <li>一</li>
                <li>二</li>
                <li>三</li>
                <li>四</li>
                <li>五</li>
                <li txt="六">六</li>                            
            </ul>
            <ul class="dates" v-if="siteNo === sites.date">
                <li v-for="(date,i) in dates" @click.stop="calculates.setDate(date)" 
                    :value-month="date[1] === value_month" :value_date="date[1] === value_month && date[2] === value_date" :current_date="date[3]" :key="i">
                {{date[2]}}
                </li>
            </ul>
            <ul class="years" v-if="siteNo === sites.year">
                <li v-for="year in years" @click.stop="calculates.setYear(year)" :value_year="year === value_year" :key="year">{{year}}</li>
            </ul>
            <ul class="months" v-if="siteNo === sites.month">
                <li v-for="i in 12" @click.stop="calculates.setMonth(i)" :value_month="i-1 === value_month" :key="i">{{['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'][i-1]}}</li>
            </ul>
        </div>
        <ul class="options toff">
            <li v-for="item in shortcutOptions" @click.stop="item.onClick" :key="item.text">{{item.text}}</li>
        </ul>
    </div>
</template>

<script>
const sites = Object.freeze({ year: 1, month: 2, date: 3 })
const shortcuts = [
    {
        text:'今天',
        onClick(){
            this.update(new Date())
        }
    },
    {
        text:'昨天',
        onClick(){
            const date = new Date()
            date.setDate(date.getDate() - 1)
            this.update(date)
        }
    },
    // {
    //     text:'前天',
    //     onClick(){
    //         const date = new Date()
    //         date.setDate(date.getDate() - 2)
    //         this.update(date)
    //     }
    // },
    {
        text:'一周前',
        onClick(){
            const date = new Date()
            date.setDate(date.getDate() - 7)
            this.update(date)
        }
    },
    {
        text:'半个月前',
        onClick(){
            const date = new Date()
            date.setDate(date.getDate() - 15)
            this.update(date)
        }
    },
    {
        text:'一个月前',
        onClick(){
            const date = new Date()
            date.setMonth(date.getMonth() - 1)
            this.update(date)
        }
    },
    // {
    //     text:'二个月前',
    //     onClick(){
    //         const date = new Date()
    //         date.setMonth(date.getMonth() - 2)
    //         this.update(date)
    //     }
    // },
    {
        text:'三个月前',
        onClick(){
            const date = new Date()
            date.setMonth(date.getMonth() - 3)
            this.update(date)
        }
    },
    {
        text:'半年前',
        onClick(){
            const date = new Date()
            date.setMonth(date.getMonth() - 6)
            this.update(date)
        }
    },
    {
        text:'一年前',
        onClick(){
            const date = new Date()
            date.setFullYear(date.getFullYear() - 1)
            this.update(date)
        }
    },
    // {
    //     text:'两年前',
    //     onClick(){
    //         const date = new Date()
    //         date.setFullYear(date.getFullYear() - 2)
    //         this.update(date)
    //     }
    // },
    {
        text:'三年前',
        onClick(){
            const date = new Date()
            date.setFullYear(date.getFullYear() - 3)
            this.update(date)
        }
    }
]

const toDate = function(value){
    return value instanceof Date ? value : new Date(value || '') // new Date(null)会=1970-1-1
}

export default {
    model: {
        prop: 'value',
        event: 'change'
    },
    props:{
        value:{
            type:[Date,Number,String],
            required:false,
            default:function(){
                return new Date()
            },
            validator: function (value) {
                const dt = toDate(value)
                return dt.isValid()
            }
        },
        defaultShortcuts:{
            type:Boolean,
            required:false
        },
        shortcuts:{
            type:Array,
            required:false
        }
    },
    data(){
        return {
            destroy:false, // 控制 自销毁
            sites: sites,
            siteNo: sites.date,
            dates: [],
            calculates: Object.freeze(this.dateCalcGather()),

            datetime: new Date() // 内部的值；prop.value是外部的值；datetime用来隔离外部，适当的时候才$emit出去外部。
        }
    },
    computed:{
        firstDayString(){
            // console.log('firstDayString')
            const date = new Date(this.datetime)
            date.setDate(1)
            return date.toString() // 转string，新旧值得比较才是 相等的。
        },
        years(){
            const initYear = this.value_year-10
            const result = []
            for(let i=1;i<=20;i++){
                result.push(initYear+i)
            }
            return result          
        },     
        value_year(){
            return this.datetime.getFullYear()
        },
        value_month(){
            return this.datetime.getMonth()
        },
        value_date(){
            return this.datetime.getDate()
        },
        shortcutOptions(){    
            if(this.shortcuts){
                return this.shortcuts.map(t=>({text:t.text,onClick: t.onClick.bind(this)}))
            }else if(this.defaultShortcuts){
                return shortcuts.map(t=>({text:t.text,onClick: t.onClick.bind(this)}))
            }
            return []
        }
    },
    watch:{
        value:{
            handler:function(){
                const dt = toDate(this.value)
                if(dt.isValid()){
                    this.datetime = new Date(dt)
                }else{
                    this.datetime = new Date()
                }
            },
            immediate:true
        },
        firstDayString:{
            handler(){
                // console.log('dates')
                const date = new Date(this.firstDayString)
                const diff = date.getDay()

                date.setDate(date.getDate() - diff)
                
                const nowString = new Date().toDateString()
                const result = []
                for(let i = 0;i < 42;i++){
                    const day = date.getDate()
                    result.push([
                        date.getFullYear(), 
                        date.getMonth(),
                        day,
                        date.toDateString() === nowString
                        ])
                    date.setDate(day + 1)
                }
                this.dates = result
            },
            immediate:true
        }
    },
    methods:{
        update(value){
            this.$emit('change', value)
        },
        dateCalcGather(){
            const that = this
            const func = function(callback){
                return (val)=>{
                    const dt = new Date(that.datetime)
                    callback(dt,val)
                    that.datetime = dt
                }
            }
            
            return {
                addMonth:   func((dt)=>dt.setMonth(dt.getMonth() + 1)),
                addYear:    func((dt)=>dt.setFullYear(dt.getFullYear() + 1)),
                subMonth:   func((dt)=>dt.setMonth(dt.getMonth() - 1)),
                subYear:    func((dt)=>dt.setFullYear(dt.getFullYear() - 1)),
                setDate:    func((dt,d)=>{
                    dt.setFullYear(d[0])
                    dt.setMonth(d[1])
                    dt.setDate(d[2])
                    that.$emit('change',dt)
                }),
                setMonth:   func((dt,m)=>{
                    dt.setMonth(m-1)
                    that.siteNo = that.sites.date
                }),
                setYear:    func((dt,y)=>{
                    dt.setFullYear(y)
                    that.siteNo = that.sites.month
                }),
                add10Year:  func((dt)=>dt.setFullYear(dt.getFullYear() + 10)),
                sub10Year:  func((dt)=>dt.setFullYear(dt.getFullYear() - 10)),
            }
        },
        openYearPanel(){
            this.siteNo = this.siteNo === this.sites.year ? this.sites.date : this.sites.year
        },
        openMonthPanel(){
            this.siteNo = this.siteNo === this.sites.month ? this.sites.date : this.sites.month
        }
    }
}
</script>

<style lang="scss" scoped></style>

