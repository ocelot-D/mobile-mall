// ============================================================================
// 防抖 与 节流
//
// 这两个是前端面试的必考手写题，也是本项目真在用的东西（不是背的）：
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
 * 节流：固定时间间隔内最多执行一次
 *
 * @param {Function} fn      真正要执行的函数
 * @param {number}   interval 间隔（毫秒）
 * @returns {Function}
 *
 * 为什么本项目必须用节流？
 *   touchmove 和 scroll 事件在手机上一秒能触发上百次，
 *   每次都去算位置、改 DOM，主线程直接被占满，滑动就卡了。
 *   节流到 16 毫秒（约一帧一次）后，计算量降到 1/6，肉眼完全看不出延迟。
 *
 * 这里用的是"时间戳版"节流：第一次立即执行，之后每满一个间隔执行一次。
 * 另一种写法是定时器版（最后一次也会执行），滚动检测用时间戳版更跟手。
 */
export function throttle(fn, interval = 16) {
  let last = 0

  return function wrapped(...args) {
    const now = Date.now()
    if (now - last >= interval) {
      last = now
      fn.apply(this, args)
    }
  }
}
