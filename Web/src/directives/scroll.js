import { onResize } from '@/utility/utility'
import Vue from 'vue'

Vue.directive('scrolly', {
    inserted: function (el) {
        {
            const bar = document.createElement('div')
            bar.addClass('scrollbar-y')
            el.appendChild(bar)
        }
        onResize(el,()=>{
            console.log(1)
        })
        onResize(el.firstChild,()=>{
            console.log(2)
        })
    }
    // componentUpdated(el){}
})
