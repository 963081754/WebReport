/**
 * 文件说明：定义常用VUE指令 v-fixedScroll与v-moveScroll
 * VUE自定义指令，看这里：https://cn.vuejs.org/v2/guide/custom-directive.html
 */
 //     position: sticky
import Vue from 'vue'
{
  /**
 * 1、初始化el的position=relative
 * @param {element} el
 * @param {object} param1
 */
  const setPosition = function (el, { top = [], left = [], right= [] } = { top: [], left: [], right: [] }) {
    const selectors = top.concat(left).concat(right)
    const selectorsStr = selectors.join(',')
    if (selectorsStr === '') return
    const elList = el.querySelectorAll(selectorsStr)

    elList.forEach(e => {
      // e.style.position = 'relative'
      // e.style['z-index'] = '4'
      let classNames = (e.className || '').split(' ')
      classNames.push('fixedScroll')
      e.className = classNames.join(' ')
    })
  }

  /**
 * 2、滚动时，通过设置el的top=scrollLeft，left=scrollTop，让el在屏幕上的纵横位置保持不变
 */
  const onScroll = function (el, { top = [], left = [], right= [] } = { top: [], left: [], right: [] }) {
    const axis = {
      x: el.scrollLeft,
      y: el.scrollTop,
      // (el.offsetWidth - el.clientWidth)是滚动条的宽度
      x2: el.scrollWidth - el.offsetWidth + (el.offsetWidth - el.clientWidth) 
    }    

    if (top.join(',') !== '') {
      const elList = el.querySelectorAll(top.join(','))
      elList.forEach(ele => {
        ele.style.top = `${axis.y}px`
      })
    }
    if (left.join(',') !== '') {
      const elList = el.querySelectorAll(left.join(','))
      elList.forEach(ele => {
        ele.style.left = `${axis.x}px`
      })
    }
    if (right.join(',') !== '') {
      const elList = el.querySelectorAll(right.join(','))
      elList.forEach(ele => {
        ele.style.right = `${axis.x2 - axis.x}px`
      })
    }
    console.log(el.offsetWidth - el.clientWidth)
  }

  /**
 * 滚动条滚动时，设置对应“selector”的元素不动。
 * 使用：v-fixed="obj"
    obj={
        top: [selector,selector……], // 纵向 位置不变
        left: [selector,selector……] // 横向 位置不变
      }
 */
  Vue.directive('fixed', {
    inserted: function (el, binding) { // binding.value =[el,el,el,……]
      let hasSet = false
      el.addEventListener('scroll', () => {
        if (!hasSet) {
          setPosition(el, binding.value)
          hasSet = true
        }
        onScroll(el, binding.value)
      })
    }
  })
}

{
  const inputables = Object.freeze(['INPUT', 'TEXTAREA', 'SELECT']) // 需要被忽略的 HTML输入框。

  /**
   * 在出现滚动条的框内 按下鼠标左键拖动，效果跟拖滚动条一样。
   * 使用：v-moveScroll="true" false=不启用
   */
  Vue.directive('moveScroll', {
    inserted: function (el, { value }) { // binding.value =true|false
      el._enabled_moveScroll = value
      let lastMovePoint = null

      const handler = function (e) {
        if (!el._enabled_moveScroll) {
          mouseup()
        }
        el.scrollTop -= (e.clientY - lastMovePoint.y) * (el.scrollHeight / el.clientHeight)
        el.scrollLeft -= (e.clientX - lastMovePoint.x) * (el.scrollWidth / el.clientWidth)
        lastMovePoint.x = e.clientX
        lastMovePoint.y = e.clientY

        if (document.selection && document.selection.empty) {
          document.selection.empty()
        }
        if (window.getSelection) {
          window.getSelection().removeAllRanges() // 取消 鼠标选择
        }
      }
      const mouseup = function (e) {
        if (inputables.includes(e.target.tagName)) return // 使不影响 输入框的选择
        if (!lastMovePoint) return
        el.removeEventListener('mouseleave', mouseup)
        el.removeEventListener('mousemove', handler)
        lastMovePoint = null
        el.style.cursor = 'default'
      }
      const mousedown = function (e) {
        if (inputables.includes(e.target.tagName)) return // 使不影响 输入框的选择
        if (!el._enabled_moveScroll) return
        lastMovePoint = { x: e.clientX, y: e.clientY }
        el.style.cursor = 'grabbing'
        el.addEventListener('mousemove', handler)
        el.addEventListener('mouseleave', mouseup)
      }
      el.addEventListener('mousedown', mousedown)
      el.addEventListener('mouseup', mouseup)
    },
    update (el, { value }) {
      el._enabled_moveScroll = value
    }
  })
}
