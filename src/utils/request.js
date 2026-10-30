const BASE = '/api'

const DEFAULT_TIMEOUT = 10000

export async function request(path, options = {}) {
  const { method = 'GET', body = null, timeout = DEFAULT_TIMEOUT } = options

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)

  try {
    const res = await fetch(BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })

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

    if (err.name === 'AbortError') {
      throw new Error('请求超时了，请检查网络后重试')
    }
    if (err instanceof TypeError) {

      throw new Error('连不上服务器，请确认后端已启动（npm run serve）')
    }
    throw err
  } finally {

    clearTimeout(timer)
  }
}

export const getBanners = () => request('/banners')

export const getCategories = () => request('/categories')

export function getProducts(query = {}) {
  const params = new URLSearchParams()

  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  })
  const qs = params.toString()
  return request(`/products${qs ? `?${qs}` : ''}`)
}

export const getProduct = (id) => request(`/products/${id}`)

export const createOrder = (payload) => request('/orders', { method: 'POST', body: payload })

export const getOrder = (no) => request(`/orders/${no}`)
