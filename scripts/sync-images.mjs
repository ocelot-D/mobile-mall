import { writeFileSync, readFileSync } from 'node:fs'
import { MAP } from './image-map.mjs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_FILE = join(ROOT, 'data', 'products.json')

console.log('正在从 DummyJSON 拉取商品图清单（只取地址，不下载图片）...')
const remote = await (await fetch('https://dummyjson.com/products?limit=0')).json()

const bySlug = {}
for (const p of remote.products) {
  const m = p.images[0].match(/product-images\/(.+)\/[^/]+$/)
  if (m) bySlug[m[1]] = p.images
}

const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
const products = data.products

let updated = 0
let retitled = []
const skipped = []

for (const p of products) {
  const conf = MAP[p.id]
  if (!conf) {
    skipped.push(`${p.id}(不在映射表)`)
    continue
  }
  const images = bySlug[conf.slug]
  if (!images) {
    skipped.push(`${p.id}(图源找不到 ${conf.slug})`)
    continue
  }

  if (conf.title && conf.title !== p.title) {
    p.title = conf.title
    retitled.push(p.id)
  }
  if (conf.subtitle) p.subtitle = conf.subtitle

  const urls = images.slice(0, 3)
  while (urls.length < 3) urls.push(urls[urls.length - 1])

  p.images = urls
  p.cover = urls[0]

  p.ratio = 1
  updated++
}

data.generatedAt = new Date().toISOString()
data.imageSource = 'DummyJSON 公开测试商品图，实时经后端 /api/img 代理拉取，本地不存图'
writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))

console.log(`\n完成：`)
console.log(`  商品图已切换为远程实时地址 ${updated} 件`)
console.log(`  名称对齐 ${retitled.length} 件：${retitled.join('、')}`)
if (skipped.length) console.log(`  跳过 ${skipped.length} 件：${skipped.join('、')}`)
console.log(`\n本机磁盘不会新增任何图片文件。`)
console.log(`下一步：npm run build 重新打包（并重启后端加载新数据）`)
