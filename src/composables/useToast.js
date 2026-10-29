// ============================================================================
// 轻提示（Toast）
//
// 为什么不用 alert？
//   alert 会阻塞整个页面，而且样式是系统原生的，在商城里非常出戏。
//   Toast 是移动端标准的反馈方式：屏幕中间（或底部）浮出一行字，两秒后消失。
//
// 实现思路：一个全局的响应式数组 + 一个 setTimeout 自动移除。
// 放在 composable 里而不是组件里，是因为加购、下单、校验失败等
// 七八个地方都要弹，组件层级各不相同，传 props 太麻烦。
// ============================================================================

import { reactive } from 'vue'

// 当前显示中的提示列表。App.vue 里 v-for 渲染它
export const toasts = reactive([])

let seed = 0

/**
 * 弹一条提示
 * @param {string} message  提示文字
 * @param {'info'|'ok'|'warn'} type  类型，决定图标和颜色
 * @param {number} duration 显示时长（毫秒）
 */
export function toast(message, type = 'info', duration = 1800) {
  seed += 1
  const id = seed
  toasts.push({ id, message, type })

  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id)
    if (idx > -1) toasts.splice(idx, 1)
  }, duration)
}

/** 快捷方法，语义更清楚 */
export const toastOk = (msg) => toast(msg, 'ok')
export const toastWarn = (msg) => toast(msg, 'warn')
