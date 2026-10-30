export function imgSrc(src) {
  if (!src) return ''
  const s = String(src)
  if (s.startsWith('http://') || s.startsWith('https://')) {
    return `/api/img?u=${encodeURIComponent(s)}`
  }
  return s.startsWith('/') ? s : `/${s}`
}

export function formatPrice(value) {
  const n = Number(value) || 0

  const fixed = Math.round(n * 100) / 100
  return `¥${fixed}`
}

export function formatSales(value) {
  const n = Number(value) || 0
  if (n >= 10000) return `${(n / 10000).toFixed(1)}万`
  return String(n)
}

export function maskPhone(phone) {
  const s = String(phone || '')
  if (s.length !== 11) return s
  return `${s.slice(0, 3)}****${s.slice(7)}`
}

export function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
