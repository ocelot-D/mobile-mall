import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import './style.css'

import { initDeviceTier } from './composables/useDeviceTier'
initDeviceTier()

import { initPwaInstall } from './composables/usePwaInstall'
initPwaInstall()

const app = createApp(App)

app.use(createPinia())

app.use(router)

app.mount('#app')

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {

    navigator.serviceWorker.register('/sw.js').catch((err) => {

      console.warn('[MobiMall] Service Worker 注册失败（不影响使用）:', err)
    })
  })
}
