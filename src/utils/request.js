// ============================================================================
// 请求层封装
//
// 为什么自己封装一层而不直接用 fetch？
//   1. 统一错误处理：后端返回 { ok:false, error } 时，不封装的话每个页面都要写一遍判断
//   2. 统一超时：手机网络经常假连接（转圈不出来），没有超时会一直挂着
//   3. 统一错误文案：把 "Failed to fetch" 这种英文翻成中文给用户看
//   4. 以后要加 token、埋点、重试，只改这一个文件
//
// 为什么不用 axios？
//   Node 18+ / 现代浏览器自带 fetch，够用了。少一个依赖 = 少一个安装失败的可能。
//   原理和拦截器一样 —— 请求前统一塞 header，响应后统一判断 ok 字段。
// ============================================================================

// 接口前缀。开发环境由 Vite 代理转发到 3002，生产环境同源，都不需要写死域名
const BASE = '/api'

// 默认超时 10 秒。手机弱网下 10 秒还没回来基本就是废请求了
const DEFAULT_TIMEOUT = 10000

/**
 * 发起一个请求
 *
 * @param {string} path      '/products' 这样的接口路径（不带 /api）
 * @param {object} options   { method, body, timeout }
 * @returns {Promise<any>}   后端 data 字段里的内容（已经剥掉了外层 { ok, data }）
 * @throws {Error}           中文错误信息，页面直接显示给用户
 */
export async function request(path, options = {}) {
  const { method = 'GET', body = null, timeout = DEFAULT_TIMEOUT } = options

  // AbortController 是浏览器原生的"取消请求"API。
  // 这里用它实现超时：到点调用 abort()，fetch 会以 AbortError 结束。
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

    // fetch 只在"网络层失败"时抛错，404 / 500 它认为是成功，所以要自己判断 res.ok
    let json = null
    try {
      json = await res.json()
    } catch {
      throw new Error(`服务端返回的不是 JSON（HTTP ${res.status}）`)
    }

    if (!res.ok || json.ok === false) {
      throw new Error(json?.error || `请求失败（HTTP ${res.status}）`)
    }

    return json.data
  } catch (err) {
    // 把浏览器给的英文错误翻成中文，用户才看得懂
    if (err.name === 'AbortError') {
      throw new Error('请求超时了，请检查网络后重试')
    }
    if (err instanceof TypeError) {
      // TypeError: Failed to fetch 说明根本没连上，一般是后端没启动
      throw new Error('连不上服务器，请确认后端已启动（npm run serve）')
    }
    throw err
  } finally {
    // 不管成功失败都要清掉定时器，否则会白白占着一个 timer
    clearTimeout(timer)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 具体接口：页面只认这些函数，不直接拼 URL
// ────────────────────────────────────────────────────────────────────────────

/** 首页轮播图 */
export const getBanners = () => request('/banners')

/** 商品分类 */
export const getCategories = () => request('/categories')

/**
 * 商品列表（分页 + 筛选 + 搜索 + 排序）
 * @param {{category?:string, keyword?:string, sort?:string, page?:number, pageSize?:number}} query
 */
export function getProducts(query = {}) {
  const params = new URLSearchParams()
  // 只把有值的参数拼上去，避免出现 ?keyword=&sort= 这种空参数
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  })
  const qs = params.toString()
  return request(`/products${qs ? `?${qs}` : ''}`)
}

/** 商品详情 */
export const getProduct = (id) => request(`/products/${id}`)

/** 提交订单 */
export const createOrder = (payload) => request('/orders', { method: 'POST', body: payload })

/** 按订单号查订单 */
export const getOrder = (no) => request(`/orders/${no}`)
