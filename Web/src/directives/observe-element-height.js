import Vue from 'vue'

/**
 * 监听元素高度变化，更新滚动容器
 */
Vue.directive('observeElementHeight', {
    inserted (el, binding) {
      const MutationObserver = window.MutationObserver || window.webkitMutationObserver || window.MozMutationObserver
      let recordHeight = 0
      const onHeightChange = function (mutations) {
        let height = window.getComputedStyle(el).getPropertyValue('height');
        if (height === recordHeight) {
          return
        }
        recordHeight = height
        // console.log('高度变化了')
        if(typeof(binding.value) === 'function') {
            binding.value(recordHeight,mutations)
        }
        // 之后更新外部容器等操作
      }
  
      el.__onHeightChange__ = onHeightChange
  
      el.addEventListener('animationend', onHeightChange)
  
      el.addEventListener('transitionend', onHeightChange)
  
      el.__observer__ = new MutationObserver((mutations,b,c) => {
          console.log(mutations,b,c)
        onHeightChange(mutations)
      });
  
      el.__observer__.observe(el, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      })
    },
    unbind (el) {
      if (el.__observer__) {
        el.__observer__.disconnect()
        el.__observer__ = null
      }
      el.removeEventListener('animationend', el.__onHeightChange__)
      el.removeEventListener('transitionend', el.__onHeightChange__)
      el.__onHeightChange__ = null
    }
  })
  
  