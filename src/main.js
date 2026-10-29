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

const app = createApp(App)

// Pinia：购物车要跨页面共享，必须装在根上
app.use(createPinia())

// vue-router：8 个页面的跳转和滚动位置恢复
app.use(router)

app.mount('#app')
