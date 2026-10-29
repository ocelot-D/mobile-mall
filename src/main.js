// ============================================================================
// 入口文件
//
// 干三件事：创建 Vue 应用 → 装上插件 → 挂到 #app
// ============================================================================

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './style.css'

// 设备档位检测必须在 mount 之前跑：
// 先把 .low-end 类加到 <html> 上，第一帧渲染出来的就是降级后的样式。
// 放到 mounted 里做会出现"先看到毛玻璃，然后突然变实色"的闪烁。
import { initDeviceTier } from './composables/useDeviceTier'
initDeviceTier()

// 安装事件必须尽早监听（beforeinstallprompt 只发一次，晚了就截不到）
import { initPwaInstall } from './composables/usePwaInstall'
initPwaInstall()

const app = createApp(App)

// Pinia：购物车要跨页面共享，必须装在根上
app.use(createPinia())

// vue-router：8 个页面的跳转和滚动位置恢复
app.use(router)

app.mount('#app')

// ---------------------------------------------------------------------------
// 注册 Service Worker —— 只在生产环境跑
// ---------------------------------------------------------------------------
// 开发模式（5174）不注册：代码一直在改，SW 缓存旧文件会造成
// "改了代码页面没变"的假故障，调试全是玄学。
// 生产模式（3002 托管 dist）才注册：这时候文件名带 hash，缓存绝对安全。
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 放到 load 之后：先保证首屏渲染，再干注册这件闲事，不抢首屏资源
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      // 注册失败不影响使用，只是没有离线缓存和安装提示，所以只打日志不弹错
      console.warn('[MobiMall] Service Worker 注册失败（不影响使用）:', err)
    })
  })
}
