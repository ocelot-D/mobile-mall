// ============================================================================
// 防抖 与 节流
//
// 本项目真的在用这两个：滚动到底检测、下拉刷新的 touchmove、搜索框都靠它们。
//   防抖 debounce  → 搜索框：停手 300 毫秒才发请求（HomeView/SearchView 用）
//   节流 throttle  → 滚动到底检测、下拉刷新的 touchmove（PullRefresh 用）
//
// 一句话区别：
//   防抖 = 每次触发都重新计时，只有"停手了"才执行（等最后一个）
//   节流 = 不管触发多频繁，固定间隔内最多执行一次（均匀执行）
// ============================================================================

/**
 * 防抖：连续触发时只有最后一次生效
 *
 * @param {Function} fn      真正要执行的函数
 * @param {number}   wait    等多久算"停手了"（毫秒）
 * @returns {Function}       包装后的函数，带 .cancel() 可以取消待执行的那次
 *
 * 实现要点：闭包保存 timer。每次调用先清掉上一次的 timer，
 * 只有最后一次调用后 wait 毫秒内没有新调用，fn 才会真的执行。
 */
export function debounce(fn, wait = 300) {
  let timer = null

  function wrapped(...args) {
    // 有新的触发，就把上一次的定时清掉 —— 这就是"抖"的含义
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      fn.apply(this, args)
    }, wait)
  }

  // 组件卸载时要能取消，否则可能出现"组件没了但请求还在发"的脏数据
  wrapped.cancel = () => {
    if (timer) clearTimeout(timer)
    timer = null
  }

  return wrapped
}

/**
 * 节流：固定时间间隔内最多执行一次（首沿立即执行 + 尾沿补执行）
 *
 * @param {Function} fn       真正要执行的函数
 * @param {number}   interval 间隔（毫秒）
 * @returns {Function}        包装后的函数，带 .cancel() 可以取消待执行的尾沿
 *
 * 为什么本项目必须用节流？
 *   touchmove 和 scroll 事件在手机上一秒能触发上百次，
 *   每次都去算位置、改 DOM，主线程直接被占满，滑动就卡了。
 *   节流到 16 毫秒（约一帧一次）后，计算量降到 1/6，肉眼完全看不出延迟。
 *
 * 为什么必须有“尾沿补执行”（这里踩过真坑）：
 *   最早这版是"纯时间戳版"——间隔内的触发直接丢掉、不补。
 *   用在"滚动到底加载下一页"上就出了 bug：用户滚到最后停下的那一下，
 *   恰好落在上一个间隔内被丢掉，"到底了"这个判断就永远没做，
 *   表现就是"上拉加载更多"挂在那，怎么拉都不加载。
 *   修法：间隔内的触发不白丢，记一个定时器，到点把最后一次补执行。
 *   这就是节流的标准完整形态：首沿立即执行保证跟手，尾沿补执行保证不漏。
 *
 *   尾沿调用用的是"最后一次的参数"：对滚动检测恰好是对的（要检查的就是
 *   停下来的最终位置）；对 touchmove 场景，尾沿到达时手指多半已经抬起、
 *   组件内部 dragging 已变 false，函数自己会短路返回，不会产生副作用。
 */
export function throttle(fn, interval = 16) {
  let last = 0
  let timer = null
  // 尾沿要用的参数：间隔内每次触发都覆盖成最新的，
  // 这样补执行时拿到的就是"最后一次"的参数
  let pendingArgs = null
  let pendingThis = null

  function wrapped(...args) {
    const now = Date.now()
    const remain = interval - (now - last)

    if (remain <= 0) {
      // 距上次执行已满一个间隔：立即执行（首沿）
      last = now
      fn.apply(this, args)
    } else {
      // 还在间隔内：记下最新参数，并保证有一个尾沿定时器
      pendingArgs = args
      pendingThis = this
      if (!timer) {
        timer = setTimeout(() => {
          timer = null
          last = Date.now()
          fn.apply(pendingThis, pendingArgs)
          pendingArgs = null
          pendingThis = null
        }, remain)
      }
    }
  }

  // 组件卸载时取消还没到点的尾沿，防止对已销毁的组件 emit（内存泄漏/脏调用）
  wrapped.cancel = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    pendingArgs = null
    pendingThis = null
  }

  return wrapped
}
