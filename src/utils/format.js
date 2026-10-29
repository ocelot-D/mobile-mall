// ============================================================================
// 格式化工具
//
// 单独抽出来的原因：价格、销量这些显示规则在好几个页面都要用，
// 散在各处写会出现"同一个数字在不同页面长得不一样"的低级问题。
// ============================================================================

/**
 * 图片地址统一出口（★ 商品图实时化就靠这一行 ★）
 *
 *   传进来的是远程图地址（http 开头）→ 转成后端的图片代理地址 /api/img?u=...
 *   传进来的是本地相对地址（img/b1.svg 这种）→ 原样返回
 *
 * 为什么远程图要走代理而不是直接 <img src="https://...">
 *   1. 防盗链：图床会检查 Referer，浏览器直接请求常被拒（403），服务器去取不会
 *   2. 以后换图源只改后端白名单，前端一行不用动
 *   3. 远程图挂了可以在代理层统一兜底，而不是页面上一片破图
 */
export function imgSrc(src) {
  if (!src) return ''
  const s = String(src)
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return `/api/img?u=${encodeURIComponent(s)}`
  }
  return s.startsWith('/') ? s : `/${s}`
}

/**
 * 价格格式化：129 → ¥129，129.5 → ¥129.5，129.00 → ¥129
 *
 * 为什么不用 toFixed(2) 一律保留两位？
 *   商城里 "¥129.00" 比 "¥129" 显得贵，转化率会差。
 *   整数就不显示小数，这才是电商的真实做法。
 */
export function formatPrice(value) {
  const n = Number(value) || 0
  // Math.round 到分，避免浮点误差（0.1+0.2 的经典问题）
  const fixed = Math.round(n * 100) / 100
  return `¥${fixed}`
}

/**
 * 销量格式化：3821 → 3821，38211 → 3.8万
 * 手机上横向空间金贵，"已售 38211 件"比"已售 3.8万件"占位长得多
 */
export function formatSales(value) {
  const n = Number(value) || 0
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  return String(n)
}

/** 手机号脱敏：13812345678 → 138****5678（订单页展示用） */
export function maskPhone(phone) {
  const s = String(phone || '')
  if (s.length !== 11) return s
  return `${s.slice(0, 3)}****${s.slice(7)}`
}

/**
 * 时间格式化：2026-10-29T12:00:00.000Z → 2026-10-29 20:00
 * 注意后端给的是 UTC 时间（ISO 字符串），直接 new Date 出来是本地时间，不用自己加 8 小时
 */
export function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
