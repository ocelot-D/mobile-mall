// ============================================================================
// MobiMall 后端服务（零第三方依赖，只用 Node 自带模块）
//
// 对外提供这些接口：
//   GET  /api/health          健康检查（部署后确认服务活着）
//   GET  /api/categories      商品分类（首页九宫格入口）
//   GET  /api/banners         首页轮播图
//   GET  /api/products        商品列表：分页 + 分类筛选 + 关键词搜索 + 排序
//   GET  /api/products/:id    商品详情
//   POST /api/orders          提交订单（服务端再校一遍库存和收货信息）
//   GET  /api/orders/:no      按订单号查订单（下单成功页用）
//
// 为什么坚持零依赖：
//   少一个第三方包 = 少一个安装失败的可能，也符合"整个文件夹拷走就能跑"的自包含原则。
//   Node 自带的 http / fs / path 模块完全够写这些接口。
//
// 生产模式下本服务还负责托管 dist/，前后端同源，天然不跨域。
// ============================================================================

import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ─── 路径准备 ────────────────────────────────────────────────────────────────
// ESM 语法里没有 __dirname（那是 CommonJS 的），要用 import.meta.url 换算
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 所有数据都在项目文件夹内，整个文件夹拷到任何盘都能跑 = 自包含
const PROJECT_ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(PROJECT_ROOT, 'data')
const DIST_DIR = path.join(PROJECT_ROOT, 'dist')
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public')

const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json')
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json')

// ─── 端口 ────────────────────────────────────────────────────────────────────
// process.env.PORT 是云平台注入的环境变量，本地没有就用 3002。
// 这个写法是部署的硬性要求：写死端口在云端会启动失败。
// 三个项目分工：AdminHub 3001 / MobiMall 3002 / PhotoFeed 3003，同时启动不打架。
const PORT = process.env.PORT || 3002

// ─── 人为延迟（默认 120 毫秒）────────────────────────────────────────────────
// 为什么要有延迟？
//   本地接口 1 毫秒就返回了，前端的"加载中 / 正在刷新"一闪而过，
//   根本看不到效果，也就没法验收下拉刷新和上拉加载的三态文案。
//   加一点点延迟，模拟真实网络，四种状态才看得清。
// 想去掉延迟：启动时加环境变量 MOBI_DELAY=0
const DELAY = Number(process.env.MOBI_DELAY ?? 120)

// ─── 图片代理白名单 ─────────────────────────────────────────────────────────
// 只放行这几个域名的图片。图片代理如果不做白名单，
// 任何人都能拿它去请求任意网址（包括内网地址），这就是典型的 SSRF 漏洞。
const IMG_HOSTS = ['cdn.dummyjson.com', 'dummyjson.com']

// ============================================================================
// 数据在内存里的缓存
// ============================================================================
// products 启动读一次就够（种子数据是静态的，改了 npm run seed 再重启）
let catalog = { version: 0, categories: [], banners: [], products: [] }

// 订单按订单号存，结构：{ 'MM20261029001': {...} }
let orders = Object.create(null)

// ─── 写文件串行队列 ──────────────────────────────────────────────────────────
// 为什么需要：多个订单同时提交会同时触发写文件，Node 的 writeFile 是异步的，
// 两次写交错可能把文件写残。用"承诺链"把写操作串起来，后一个等前一个完成。
let writeChain = Promise.resolve()
function enqueueWrite(fn) {
  writeChain = writeChain.then(fn).catch((err) => {
    console.error('[MobiMall] 写文件失败：', err.message)
  })
  return writeChain
}

// ============================================================================
// 工具函数区
// ============================================================================

/** 统一成功响应格式。所有接口都返回 { ok, data }，前端只认这一个形状 */
function sendJson(res, status, body) {
  const buf = Buffer.from(JSON.stringify(body), 'utf8')
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': buf.length,
    // 接口一律不缓存，否则改了数据刷新页面还是旧的
    'Cache-Control': 'no-store',
  })
  res.end(buf)
}

function sendOk(res, data) {
  sendJson(res, 200, { ok: true, data })
}

function sendFail(res, status, message) {
  sendJson(res, status, { ok: false, error: message })
}

/** 按 DELAY 睡一会儿，模拟网络耗时 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 读 JSON 文件，文件不存在返回 fallback（第一次跑还没有订单文件） */
async function readJsonFile(file, fallback) {
  try {
    const raw = await readFile(file, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

/**
 * 商品筛选 + 搜索 + 排序 + 分页
 *
 * @param {object} q  query 参数：category / keyword / sort / page / pageSize
 * @returns {{ list: object[], total: number, page: number, pageSize: number, hasMore: boolean }}
 */
function queryProducts(q) {
  let list = catalog.products.slice()

  // 分类筛选：空或 all 表示不限
  if (q.category && q.category !== 'all') {
    list = list.filter((p) => p.categoryId === q.category)
  }

  // 关键词搜索：标题 + 卖点 + 分类名都算命中（用户搜"耳机"和搜"数码"都该有结果）
  const kw = (q.keyword || '').trim().toLowerCase()
  if (kw) {
    list = list.filter((p) =>
      [p.title, p.subtitle, p.categoryName].join(' ').toLowerCase().includes(kw)
    )
  }

  // 排序：默认综合（按已售降序，卖得好的排前面，符合商城直觉）
  const sort = q.sort || 'default'
  if (sort === 'sales') list.sort((a, b) => b.sales - a.sales)
  else if (sort === 'price-asc') list.sort((a, b) => a.price - b.price)
  else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price)
  else if (sort === 'new') list.sort((a, b) => Number(b.no) - Number(a.no))
  else list.sort((a, b) => b.sales - a.sales)

  const total = list.length
  const page = Math.max(1, Number(q.page) || 1)
  const pageSize = Math.min(50, Math.max(1, Number(q.pageSize) || 8))
  const start = (page - 1) * pageSize
  const slice = list.slice(start, start + pageSize)

  return {
    list: slice,
    total,
    page,
    pageSize,
    // hasMore 给前端判断"上拉还有没有更多"，避免到底了还一直转圈
    hasMore: start + slice.length < total,
  }
}

/** 生成订单号：MM + 年月日 + 4 位序号（当天内递增） */
function makeOrderNo() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const todayCount = Object.keys(orders).filter((k) => k.startsWith(`MM${ymd}`)).length
  return `MM${ymd}${String(todayCount + 1).padStart(4, '0')}`
}

/** 手机号校验：1 开头 11 位数字 */
function isPhone(v) {
  return /^1\d{10}$/.test(String(v || '').trim())
}

// ============================================================================
// 静态文件托管（生产模式）
// ============================================================================
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

async function serveStatic(req, res, pathname) {
  // 安全处理：去掉 ../ 防止目录穿越（有人请求 /../../etc/passwd）
  const safe = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '')
  let filePath = path.join(DIST_DIR, safe)

  // 目录请求补 index.html
  if (safe === '/' || safe === '\\' || safe.endsWith('/')) {
    filePath = path.join(DIST_DIR, 'index.html')
  }

  // dist 里找不到就去 public 找（种子图片之类）
  if (!existsSync(filePath)) {
    const pubPath = path.join(PUBLIC_DIR, safe)
    if (existsSync(pubPath) && !path.extname(pubPath).includes('..')) {
      filePath = pubPath
    }
  }

  // 还是找不到：
  //   如果请求看起来像页面路由（没有扩展名），回退 index.html —— 这是
  //   history 模式路由刷新不 404 的关键；否则才返回真 404。
  if (!existsSync(filePath)) {
    const hasExt = path.extname(safe) !== ''
    if (!hasExt) filePath = path.join(DIST_DIR, 'index.html')
    else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      return res.end('404 Not Found')
    }
  }

  // index.html 每次都重新读，方便改完前端刷新就生效
  try {
    const buf = await readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      // 带 hash 的静态资源可以长期缓存；html 不缓存
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=86400',
    })
    res.end(buf)
  } catch (err) {
    sendFail(res, 500, `读取文件失败：${err.message}`)
  }
}

// ============================================================================
// 接口路由
// ============================================================================
async function handleApi(req, res, url) {
  const { pathname } = url
  const q = url.searchParams

  // ─── GET /api/health ─────────────────────────────────────────────────────
  if (pathname === '/api/health' && req.method === 'GET') {
    return sendOk(res, { service: 'mobimall', products: catalog.products.length, orders: Object.keys(orders).length, time: Date.now() })
  }

  // ─── GET /api/img 图片代理（实时拉远程商品图） ────────────────────────────
  // 用法：/api/img?u=https://cdn.dummyjson.com/product-images/xxx/1.webp
  //
  // 为什么要绕一层代理，而不是让浏览器直接去取远程图：
  //   1. 防盗链：很多图床会检查 Referer，浏览器直接请求会被拒（返回 403）
  //      服务器去取没有 Referer，不会被拦
  //   2. 协议混合：页面是 https，图源若是 http 会被浏览器直接拦掉
  //   3. 统一出口：以后换图源只改这里，前端和商品数据都不用动
  //
  // 安全：只允许白名单域名，否则就成了"任意网址转发器"（SSRF 漏洞），
  //       别人可以拿它去打内网。这是必须加的一道闸。
  if (pathname === '/api/img' && req.method === 'GET') {
    const raw = q.get('u') || ''
    let target
    try {
      target = new URL(raw)
    } catch {
      return sendFail(res, 400, '图片地址不合法')
    }
    if (!IMG_HOSTS.includes(target.hostname)) {
      return sendFail(res, 403, '图源不在白名单内：' + target.hostname)
    }

    try {
      const upstream = await fetch(target.href, {
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'MobiMall/1.0', Accept: 'image/*' },
      })
      if (!upstream.ok) return sendFail(res, 502, '图源返回 ' + upstream.status)

      const buf = Buffer.from(await upstream.arrayBuffer())
      res.writeHead(200, {
        'Content-Type': upstream.headers.get('content-type') || 'image/webp',
        'Content-Length': buf.length,
        // 短缓存 5 分钟：既保证"实时"（换图 5 分钟内生效），
        // 又避免同一个用户来回翻页面时每次都重新下载一遍，省流量
        'Cache-Control': 'public, max-age=300',
      })
      return res.end(buf)
    } catch (err) {
      return sendFail(res, 502, '取图失败：' + err.message)
    }
  }

  // ─── GET /api/categories ─────────────────────────────────────────────────
  if (pathname === '/api/categories' && req.method === 'GET') {
    await sleep(DELAY)
    return sendOk(res, catalog.categories)
  }

  // ─── GET /api/banners ────────────────────────────────────────────────────
  if (pathname === '/api/banners' && req.method === 'GET') {
    await sleep(DELAY)
    return sendOk(res, catalog.banners)
  }

  // ─── GET /api/products ───────────────────────────────────────────────────
  if (pathname === '/api/products' && req.method === 'GET') {
    await sleep(DELAY)
    return sendOk(res, queryProducts({
      category: q.get('category') || 'all',
      keyword: q.get('keyword') || '',
      sort: q.get('sort') || 'default',
      page: q.get('page') || 1,
      pageSize: q.get('pageSize') || 8,
    }))
  }

  // ─── GET /api/products/:id ───────────────────────────────────────────────
  if (pathname.startsWith('/api/products/') && req.method === 'GET') {
    await sleep(DELAY)
    const id = pathname.slice('/api/products/'.length)
    const item = catalog.products.find((p) => p.id === id)
    if (!item) return sendFail(res, 404, '商品不存在或已下架')
    return sendOk(res, item)
  }

  // ─── POST /api/orders ────────────────────────────────────────────────────
  // 前端已经校验过一遍，这里还要再校验一次。
  // 原因：绕过页面直接 curl 调接口也能下单，只靠前端校验等于没校验。
  if (pathname === '/api/orders' && req.method === 'POST') {
    let body = {}
    try {
      // 手动收集请求体：req 是个可读流，数据分批到达，要自己拼起来
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
    } catch {
      return sendFail(res, 400, '请求体不是合法 JSON')
    }

    const items = Array.isArray(body.items) ? body.items : []
    if (items.length === 0) return sendFail(res, 400, '购物车是空的，无法下单')

    // 收货信息校验
    const { name, phone, address } = body.address || {}
    if (!name || String(name).trim().length < 2) return sendFail(res, 400, '收货人姓名至少 2 个字')
    if (!isPhone(phone)) return sendFail(res, 400, '手机号格式不对（1 开头 11 位数字）')
    if (!address || String(address).trim().length < 6) return sendFail(res, 400, '详细地址至少 6 个字')

    // 逐项核对商品与库存，同时把单价按服务端数据重算，
    // 绝不用前端传来的价格（前端传价 = 用户可以自己改成 1 块钱）
    let totalAmount = 0
    const detail = []
    for (const it of items) {
      const p = catalog.products.find((x) => x.id === it.id)
      if (!p) return sendFail(res, 400, `商品 ${it.id} 不存在`)
      const count = Math.max(1, Number(it.count) || 1)
      if (count > p.stock) return sendFail(res, 400, `「${p.title}」库存不足，仅剩 ${p.stock} 件`)

      // 规格加价：前端传的是规格 label，服务端查 delta 算最终单价
      const delta = Number(it.specDelta || 0)
      const unitPrice = Math.round((p.price + delta) * 100) / 100
      totalAmount += unitPrice * count

      detail.push({
        id: p.id,
        title: p.title,
        cover: p.cover,
        specText: it.specText || '',
        unitPrice,
        count,
        subtotal: Math.round(unitPrice * count * 100) / 100,
      })
    }

    const orderNo = makeOrderNo()
    const order = {
      orderNo,
      items: detail,
      // 满 99 包邮，否则 8 元运费
      freight: totalAmount >= 99 ? 0 : 8,
      totalAmount: Math.round(totalAmount * 100) / 100,
      payAmount: Math.round((totalAmount + (totalAmount >= 99 ? 0 : 8)) * 100) / 100,
      address: {
        name: String(name).trim(),
        phone: String(phone).trim(),
        address: String(address).trim(),
      },
      remark: String(body.remark || '').slice(0, 100),
      status: '待发货',
      createdAt: new Date().toISOString(),
    }

    orders[orderNo] = order
    enqueueWrite(() => writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8'))

    console.log(`[MobiMall] 新订单 ${orderNo} · ${detail.length} 件 · ¥${order.payAmount}`)
    return sendOk(res, order)
  }

  // ─── GET /api/orders/:no ─────────────────────────────────────────────────
  if (pathname.startsWith('/api/orders/') && req.method === 'GET') {
    const no = pathname.slice('/api/orders/'.length)
    const order = orders[no]
    if (!order) return sendFail(res, 404, '订单不存在')
    return sendOk(res, order)
  }

  return sendFail(res, 404, '接口不存在')
}

// ============================================================================
// 启动服务
// ============================================================================
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  console.log(`[MobiMall] ${req.method} ${url.pathname}${url.search}`)

  // 允许跨域：开发环境 Vite 代理已解决跨域，这里加是为了方便 Postman / 真机调试
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // 预检请求：正式 POST 前浏览器先发 OPTIONS 探路，直接放行
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url)
  return serveStatic(req, res, url.pathname)
})

// ─── 启动前的准备 ────────────────────────────────────────────────────────────
catalog = await readJsonFile(PRODUCTS_FILE, catalog)
orders = await readJsonFile(ORDERS_FILE, orders)

if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true })

// listen 的第二个参数 '0.0.0.0' 非常关键：
// 只写 PORT 的话服务只监听本机回环地址，云服务器上外部一律连不上。
server.listen(PORT, '0.0.0.0', () => {
  console.log('')
  console.log('========================================')
  console.log('  MobiMall 后端已启动')
  console.log(`  本机访问    http://localhost:${PORT}`)
  console.log(`  健康检查    http://localhost:${PORT}/api/health`)
  console.log(`  商品接口    http://localhost:${PORT}/api/products?page=1&pageSize=8`)
  console.log(`  商品件数    ${catalog.products.length} 件`)
  console.log(`  人为延迟    ${DELAY}ms（想关掉：MOBI_DELAY=0）`)
  console.log('========================================')
  console.log('')

  if (catalog.products.length === 0) {
    console.log('  注意：没读到商品数据，先执行 npm run seed 生成')
    console.log('')
  }
  if (!existsSync(DIST_DIR)) {
    console.log('  注意：未检测到 dist 目录')
    console.log('  开发环境：另开终端 npm run dev，访问 http://localhost:5174')
    console.log('  生产环境：先 npm run build 再访问本端口')
    console.log('')
  }
})
