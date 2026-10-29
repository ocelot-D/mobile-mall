// ============================================================================
// 「安装到主屏幕」能力检测（PWA Install）
//
// 背景：把 H5 做成"像 App 一样从桌面图标打开、全屏无地址栏"，分两层：
//   第一层：manifest + meta（已配好，见 index.html / public/manifest.webmanifest）
//           —— 有这一层，手机浏览器菜单里就有"添加到主屏幕"
//   第二层：浏览器主动弹"安装"横幅/按钮 —— 需要监听 beforeinstallprompt 事件
//           —— 这个事件不是每次都有，浏览器觉得"用户用得够多"才发，
//              所以我们不能等它，要把它截下来自己找时机弹
//
// 这就是本文件干的事：把浏览器发来的安装事件截获存起来，
// 等用户在「我的」页点"安装到桌面"按钮时再触发系统安装弹窗。
// ============================================================================

import { ref } from 'vue'

// 浏览器截获下来的安装事件，null = 还没截到（不代表不能手动添加到主屏幕）
let deferredPrompt = null

// 是否能弹出系统安装框（安卓 Chrome 截到事件后为 true）
export const canInstall = ref(false)

// 是否已经以"独立 App 模式"在跑（从桌面图标打开时 display-mode 是 standalone）
export const isStandalone = ref(false)

// 当前是不是 iPhone/iPad（iOS 没有 beforeinstallprompt，只能引导用户手动加）
export const isIOS = ref(false)

// ---------------------------------------------------------------------------
// 初始化：只在 App.vue 挂载后调用一次
// ---------------------------------------------------------------------------
export function initPwaInstall() {
  // CSS 媒体查询判断显示模式：standalone = 用户已经从桌面图标打开
  isStandalone.value =
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari 的判断方式不一样，走 navigator.standalone
    window.navigator.standalone === true

  // iPhone / iPad / iPod 检测（iPad 新版会伪装成 Mac，额外看触摸点数）
  isIOS.value =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  // 截获安装事件：阻止浏览器自己弹横幅，把事件存起来等用户主动点
  // 注意：这个事件一个页面生命周期只发一次，所以必须一开始就挂监听
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault() // 不要浏览器自作主张弹横幅
    deferredPrompt = e
    canInstall.value = true
  })

  // 用户装完之后这个事件会触发：更新状态，让按钮消失
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    canInstall.value = false
    isStandalone.value = true
  })
}

// ---------------------------------------------------------------------------
// 触发系统安装弹窗
// 返回 'accepted'（用户同意）| 'dismissed'（用户拒绝）| 'unavailable'（弹不了）
// ---------------------------------------------------------------------------
export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable'

  // 弹出系统安装框（就是 Chrome 原生的"添加到主屏幕？"对话框）
  deferredPrompt.prompt()

  // 等用户的选择
  const { outcome } = await deferredPrompt.userChoice
  // 不管选没选，这个事件只能用一次，用完必须清掉
  deferredPrompt = null
  canInstall.value = false

  return outcome === 'accepted' ? 'accepted' : 'dismissed'
}
