// ============================================================================
// Service Worker（简称 SW，可以理解成"装在浏览器里的本地代理"）
//
// 它存在的唯一目的：让 Android Chrome 认定这个页面"可以安装"，
// 从而把「添加到主屏幕」升级成真正的「安装应用」
// （有独立窗口、有桌面图标、任务栏里是自己的卡片，跟原生 App 一样）。
//
// iOS Safari 不需要 SW 也能添加到主屏幕，所以 iPhone 上它纯属加分。
//
// 为什么只在生产环境注册（见 src/main.js）：
//   开发模式下代码一直改，SW 缓存旧文件会让你"改了代码页面没变"，
//   调试时全是玄学问题。开发模式一律不注册，就没有这个坑。
//
// 缓存策略（面试能讲的重点）：
//   /api/*       永远走网络 —— 商品价格、库存必须是最新的，缓存了就是事故
//   静态资源     缓存优先 —— JS/CSS/图片文件名都带 hash，变了名字就变了，
//                缓存旧文件不会出错，还能秒开
//   页面导航     网络优先，断网才用缓存 —— 保证内容尽量新鲜
// ============================================================================

// 版本号：改了任何要缓存的文件，就把这个数字 +1，
// 旧缓存会整个作废重建，不会出现"永远读到旧文件"的问题
const VERSION = 'v1'
const STATIC_CACHE = `mobimall-static-${VERSION}`

// 安装阶段：先不缓存任何东西，等页面第一次跑起来再按需缓存。
// 好处是 SW 安装本身不会拖慢首屏。
self.addEventListener('install', () => {
  // skipWaiting：新 SW 一到位立刻接管，不等旧页面全部关闭
  self.skipWaiting()
})

// 激活阶段：清掉旧版本的缓存，防止存储越积越大
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith('mobimall-') && k !== STATIC_CACHE).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // 接口请求一律直连网络，不碰缓存（库存和价格不能是旧的）
  if (url.pathname.startsWith('/api/')) return

  // 只管同源的 GET 请求，别的（POST、跨域）原样放行
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return

  // 页面导航（地址栏敲地址、刷新）：网络优先，断了网才用缓存的页面
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone()
          caches.open(STATIC_CACHE).then((c) => c.put(event.request, copy))
          return res
        })
        .catch(() => caches.match(event.request).then((hit) => hit || caches.match('/')))
    )
    return
  }

  // 其余静态资源：缓存优先。命中直接回，没命中再问网络并顺手存一份
  event.respondWith(
    caches.match(event.request).then(
      (hit) =>
        hit ||
        fetch(event.request).then((res) => {
          // 只缓存成功的响应，404/500 的不存，免得坏结果被记住
          if (res.ok) {
            const copy = res.clone()
            caches.open(STATIC_CACHE).then((c) => c.put(event.request, copy))
          }
          return res
        })
    )
  )
})
