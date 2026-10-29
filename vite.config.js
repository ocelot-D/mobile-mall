// ============================================================================
// Vite 配置文件
//
// 这个文件管三件事：
//   1. 让 Vite 认识 .vue 文件（靠 @vitejs/plugin-vue 插件）
//   2. 配代理，把前端的 /api 请求转发给 Node 后端（解决开发环境跨域）
//   3. 告诉 Vite 打包结果放到 dist/
//
// 注意端口：后端固定 3002（见 规划：AdminHub 3001 / MobiMall 3002 / PhotoFeed 3003），
// 前端开发服务器固定 5174，三个项目各用一个端口，同时启动也不打架。
// ============================================================================

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({

  plugins: [vue()],

  // base 用 '/' 而不是 './'：本项目用了 vue-router 的 history 模式，
  // 刷新 /product/p001 这种深层路由时后端会把请求回退到 index.html，
  // 此时如果用相对路径 ./assets/xxx.js，浏览器会去 /product/assets/ 找，直接 404。
  // 用绝对路径 '/' 就没这个问题（部署在域名根目录下）。
  base: '/',

  server: {
    // 开发服务器端口（写死的，避免端口漂移导致下面的代理失效）
    port: 5174,

    // strictPort：端口被占用时直接报错退出，而不是偷偷换成别的端口
    strictPort: true,

    // ─── 代理：开发阶段解决跨域的核心 ───────────────────────────────────
    // 页面跑在 localhost:5174，后端跑在 localhost:3002，端口不同 = 不同源，
    // 浏览器同源策略会拦截。代理让前端只请求自己家的 /api/xxx，
    // Vite 收到后偷偷替我们去问 3002，浏览器全程以为同源，自然放行。
    //
    // 面试点：这只是开发方案；生产环境靠同源部署（后端直接托管 dist）。
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3002',
        changeOrigin: true,
      },
    },
  },

  build: {
    // 打包输出目录，和后端静态托管的目录保持一致
    outDir: 'dist',

    // 每次打包前清空 dist，避免残留旧文件造成"改了代码但页面没变"的假象
    emptyOutDir: true,
  },
})
