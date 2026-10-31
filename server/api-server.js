import { createServer } from 'node:http'
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const PROJECT_ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(PROJECT_ROOT, 'data')
const DIST_DIR = path.join(PROJECT_ROOT, 'dist')
const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public')

const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json')
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json')

const PORT = process.env.PORT || 3002

const DELAY = Number(process.env.MOBI_DELAY ?? 120)

const IMG_HOSTS = ['cdn.dummyjson.com', 'dummyjson.com']

const IMG_CACHE_TTL = 5 * 60 * 1000
const imgCache = new Map()
const imgPending = new Map()

async function fetchImgWithRetry(href) {
  let lastErr
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) await sleep(300)
      const upstream = await fetch(href, {
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'mobile-mall/1.0', Accept: 'image/*' },
      })
      if (!upstream.ok) throw new Error('图源返回 ' + upstream.status)
      const buf = Buffer.from(await upstream.arrayBuffer())
      return { buf, type: upstream.headers.get('content-type') || 'image/webp' }
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

let catalog = { version: 0, categories: [], banners: [], products: [] }

let orders = Object.create(null)

const LIVE_SOURCE = 'https://dummyjson.com'
const LIVE_REFRESH_MS = 5 * 60 * 1000

const LIVE_CAT_MAP = [
  { id: 'digital', name: '数码', zh: ['smartphones', 'tablets', 'laptops', 'mobile-accessories'] },
  { id: 'apparel', name: '服饰', zh: ['mens-shirts', 'mens-shoes', 'womens-dresses', 'womens-bags', 'womens-shoes', 'tops', 'sunglasses', 'mens-watches', 'womens-watches'] },
  { id: 'home', name: '家居', zh: ['furniture', 'home-decoration', 'kitchen-accessories'] },
  { id: 'food', name: '食品', zh: ['groceries'] },
  { id: 'beauty', name: '美妆', zh: ['beauty', 'fragrances', 'skin-care'] },
  { id: 'sport', name: '运动', zh: ['sports-accessories', 'motorcycle', 'vehicle'] },
]

const LIVE_ZH_KW = {
  耳机: 'headphone earbuds airpods',
  手机: 'phone iphone samsung smartphone',
  电脑: 'laptop macbook notebook',
  平板: 'tablet ipad',
  手表: 'watch',
  鞋: 'shoes sneakers boots',
  包: 'bag handbag',
  口红: 'lipstick lipstick',
  香水: 'perfume fragrance',
  沙发: 'sofa couch',
  桌: 'table desk',
  咖啡: 'coffee',
  奶粉: 'powder milk',
  衬衫: 'shirt',
  裙: 'dress',
  篮球: 'basketball',
  相机: 'camera',
}

let liveState = { enabled: true, ok: false, lastFetch: 0, error: '', count: 0 }

function mapLiveProduct(raw) {
  const cat = LIVE_CAT_MAP.find((c) => c.zh.includes(raw.category))
  if (!cat) return null

  const price = Math.round(raw.price * 7.2 * 100) / 100

  const seed = Number(raw.id) * 2654435761 % 9000

  return {
    id: `d${raw.id}`,
    no: String(raw.id),
    title: raw.title,

    subtitle: `${raw.brand || cat.name} · ${cat.name}`,
    categoryId: cat.id,
    categoryName: cat.name,
    price,
    originPrice: Math.round(price * 1.45 * 100) / 100,
    sales: 300 + (seed % 9000),
    stock: Math.max(1, Number(raw.stock) || 20),
    rating: Math.round((raw.rating || 4.5) * 10) / 10,

    ratio: 1,
    tags: raw.rating >= 4.8 ? ['热卖'] : seed % 3 === 0 ? ['新品'] : [],
    images: raw.images || [],
    cover: raw.images && raw.images[0],

    specs: [
      { name: '版本', values: [{ label: '标准版', delta: 0 }, { label: '礼盒版', delta: 30 }] },
    ],

    params: [
      { k: '品牌', v: raw.brand || '-' },
      { k: '质保', v: raw.warrantyInformation || '-' },
      { k: '物流', v: raw.shippingInformation || '-' },
      { k: '退换', v: raw.returnPolicy || '-' },
    ],
    desc: raw.description || `${raw.title}。`,
  }
}

async function refreshLiveCatalog() {
  if (!liveState.enabled) return
  try {
    const res = await fetch(`${LIVE_SOURCE}/products?limit=0&skip=0`, {
      signal: AbortSignal.timeout(15000),
      headers: { 'User-Agent': 'mobile-mall/1.0', Accept: 'application/json' },
    })
    if (!res.ok) throw new Error(`图源返回 ${res.status}`)
    const data = await res.json()

    const mapped = []
    for (const raw of data.products || []) {
      const p = mapLiveProduct(raw)
      if (p) mapped.push(p)
    }
    if (mapped.length === 0) throw new Error('图源返回的商品全部映射失败')

    catalog.products = mapped
    liveState.ok = true
    liveState.lastFetch = Date.now()
    liveState.error = ''
    liveState.count = mapped.length
    console.log(`[Mobile Mall] 实时商品源刷新成功：${mapped.length} 件`)
  } catch (err) {

    liveState.ok = false
    liveState.error = err.message
    console.error('[Mobile Mall] 实时商品源刷新失败（保留现有数据）：', err.message)
  }
}

let writeChain = Promise.resolve()
function enqueueWrite(fn) {
  writeChain = writeChain.then(fn).catch((err) => {
    console.error('[Mobile Mall] 写文件失败：', err.message)
  })
  return writeChain
}

function sendJson(res, status, body) {
  const buf = Buffer.from(JSON.stringify(body), 'utf8')
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': buf.length,

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function readJsonFile(file, fallback) {
  try {
    const raw = await readFile(file, 'utf8')
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

function queryProducts(q) {
  let list = catalog.products.slice()

  if (q.category && q.category !== 'all') {
    list = list.filter((p) => p.categoryId === q.category)
  }

  const kw = (q.keyword || '').trim().toLowerCase()
  if (kw) {

    const extra = Object.entries(LIVE_ZH_KW)
      .filter(([zh]) => kw.includes(zh))
      .map(([, en]) => en.split(' '))
      .flat()
    const words = [kw, ...extra]
    list = list.filter((p) => {
      const hay = [p.title, p.subtitle, p.categoryName, p.desc || ''].join(' ').toLowerCase()
      return words.some((w) => hay.includes(w))
    })
  }

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

    hasMore: start + slice.length < total,
  }
}

function makeOrderNo() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const todayCount = Object.keys(orders).filter((k) => k.startsWith(`MM${ymd}`)).length
  return `MM${ymd}${String(todayCount + 1).padStart(4, '0')}`
}

function isPhone(v) {
  return /^1\d{10}$/.test(String(v || '').trim())
}

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

  const safe = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '')
  let filePath = path.join(DIST_DIR, safe)

  if (safe === '/' || safe === '\\' || safe.endsWith('/')) {
    filePath = path.join(DIST_DIR, 'index.html')
  }

  if (!existsSync(filePath)) {
    const pubPath = path.join(PUBLIC_DIR, safe)
    if (existsSync(pubPath) && !path.extname(pubPath).includes('..')) {
      filePath = pubPath
    }
  }

  if (!existsSync(filePath)) {
    const hasExt = path.extname(safe) !== ''
    if (!hasExt) filePath = path.join(DIST_DIR, 'index.html')
    else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      return res.end('404 Not Found')
    }
  }

  try {
    const buf = await readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',

      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=86400',
    })
    res.end(buf)
  } catch (err) {
    sendFail(res, 500, `读取文件失败：${err.message}`)
  }
}

async function handleApi(req, res, url) {
  const { pathname } = url
  const q = url.searchParams

  if (pathname === '/api/health' && req.method === 'GET') {
    return sendOk(res, { service: 'mobile-mall', products: catalog.products.length, orders: Object.keys(orders).length, time: Date.now(), live: liveState })
  }

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

    const cached = imgCache.get(raw)
    if (cached && Date.now() - cached.at < IMG_CACHE_TTL) {
      res.writeHead(200, {
        'Content-Type': cached.type,
        'Content-Length': cached.buf.length,
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'hit',
      })
      return res.end(cached.buf)
    }

    if (!imgPending.has(raw)) {
      imgPending.set(
        raw,
        fetchImgWithRetry(target.href).finally(() => imgPending.delete(raw))
      )
    }
    try {
      const { buf, type } = await imgPending.get(raw)
      imgCache.set(raw, { buf, type, at: Date.now() })
      res.writeHead(200, {
        'Content-Type': type,
        'Content-Length': buf.length,
        'Cache-Control': 'public, max-age=300',
        'X-Cache': 'miss',
      })
      return res.end(buf)
    } catch (err) {
      return sendFail(res, 502, '取图失败：' + err.message)
    }
  }

  if (pathname === '/api/categories' && req.method === 'GET') {
    await sleep(DELAY)
    return sendOk(res, catalog.categories)
  }

  if (pathname === '/api/banners' && req.method === 'GET') {
    await sleep(DELAY)
    return sendOk(res, catalog.banners)
  }

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

  if (pathname.startsWith('/api/products/') && req.method === 'GET') {
    await sleep(DELAY)
    const id = pathname.slice('/api/products/'.length)
    const item = catalog.products.find((p) => p.id === id)
    if (!item) return sendFail(res, 404, '商品不存在或已下架')
    return sendOk(res, item)
  }

  if (pathname === '/api/orders' && req.method === 'POST') {
    let body = {}
    try {

      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')
    } catch {
      return sendFail(res, 400, '请求体不是合法 JSON')
    }

    const items = Array.isArray(body.items) ? body.items : []
    if (items.length === 0) return sendFail(res, 400, '购物车是空的，无法下单')

    const { name, phone, address } = body.address || {}
    if (!name || String(name).trim().length < 2) return sendFail(res, 400, '收货人姓名至少 2 个字')
    if (!isPhone(phone)) return sendFail(res, 400, '手机号格式不对（1 开头 11 位数字）')
    if (!address || String(address).trim().length < 6) return sendFail(res, 400, '详细地址至少 6 个字')

    let totalAmount = 0
    const detail = []
    for (const it of items) {
      const p = catalog.products.find((x) => x.id === it.id)
      if (!p) return sendFail(res, 400, `商品 ${it.id} 不存在`)
      const count = Math.max(1, Number(it.count) || 1)
      if (count > p.stock) return sendFail(res, 400, `「${p.title}」库存不足，仅剩 ${p.stock} 件`)

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

    console.log(`[Mobile Mall] 新订单 ${orderNo} · ${detail.length} 件 · ¥${order.payAmount}`)
    return sendOk(res, order)
  }

  if (pathname.startsWith('/api/orders/') && req.method === 'GET') {
    const no = pathname.slice('/api/orders/'.length)
    const order = orders[no]
    if (!order) return sendFail(res, 404, '订单不存在')
    return sendOk(res, order)
  }

  return sendFail(res, 404, '接口不存在')
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  console.log(`[Mobile Mall] ${req.method} ${url.pathname}${url.search}`)

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    return res.end()
  }

  if (url.pathname.startsWith('/api/')) return handleApi(req, res, url)
  return serveStatic(req, res, url.pathname)
})

catalog = await readJsonFile(PRODUCTS_FILE, catalog)
orders = await readJsonFile(ORDERS_FILE, orders)

if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true })

liveState.enabled = process.env.MOBI_LIVE !== '0'

if (liveState.enabled) {

  await refreshLiveCatalog()

  setInterval(refreshLiveCatalog, LIVE_REFRESH_MS).unref()
}

server.listen(PORT, '0.0.0.0', () => {
  console.log('')
  console.log('========================================')
  console.log('  Mobile Mall 后端已启动')
  console.log(`  本机访问    http://localhost:${PORT}`)
  console.log(`  健康检查    http://localhost:${PORT}/api/health`)
  console.log(`  商品接口    http://localhost:${PORT}/api/products?page=1&pageSize=8`)
  console.log(`  商品件数    ${catalog.products.length} 件`)
  console.log(`  商品来源    ${liveState.enabled ? (liveState.ok ? '实时图源（每 5 分钟刷新）' : '本地兜底（实时源暂不可达：' + liveState.error + '）') : '本地 seed（MOBI_LIVE=0 关闭了实时源）'}`)
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
