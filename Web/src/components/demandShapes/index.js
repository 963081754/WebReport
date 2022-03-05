import date from './date.vue'
import num from './num.vue'
import str from './str.vue'
import kv from './kv.vue'

const factory = {
    functional: true,
    props:['demand','fields','shape'],
    render: function (createElement, context) {
        const d = context.props.demand
        let com = null
        if(d.isCustom){
            com = {render:()=>{}}
        }else if (d.type === 'kv'){
            com = kv
        }else if (d.type==='n'){
            com = num
        }else if (d.type==='d'){
            com = date
        }else{
            com = str
        }
// debugger
        return createElement(com,{...context,...context.data})
    }
}

export default factory