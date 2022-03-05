import Vue from 'vue'

Vue.directive('delayHover', {
  // 当被绑定的元素插入到 DOM 中时……
  inserted(el,{value:time}={}) {
    const className = 'delayHover'
    let key
    el.addEventListener('mouseenter',()=>{
        clearTimeout(key) // 如果用户300ms内 再次移入，则清除settimeout，不隐藏
        el.addClass(className)
    })
    el.addEventListener('mouseleave',()=>{
        key = setTimeout(() => {
            el.removeClass(className)
        }, time || 300)  // 鼠标 移出300ms后再 移除class delayHover，这就实现了 延迟“hover”
    })
  }
})
