// ============================================================================
// 把商品图切换成"实时远程图"（不往本地写任何图片文件）
//
// 这个脚本只做一件事：把每件商品的图片地址，换成图源上的远程地址，
// 然后由后端 /api/img 代理实时去取（代理为什么要存在，见 server/api-server.js）。
// 本机磁盘上一张商品图都不会多出来。
//
// 图源：DummyJSON（https://dummyjson.com）—— 公开免费的测试商品接口，
//       194 件真实商品，白底实拍图，托管在 cdn.dummyjson.com。
//
// MAP 表把我们的 36 件商品逐一指到图库里"长得一样"的真实商品。
// 图库里没有的商品（如机械键盘、投影仪）连名字一起改成图库里真实存在的东西，
// 保证"名字、描述、图片"三者一致，不会出现"耳机配手机图"这种穿帮。
// ============================================================================

import { writeFileSync, readFileSync } from 'node:fs'
import { MAP } from './image-map.mjs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_FILE = join(ROOT, 'data', 'products.json')

// 36 件商品 → 图源商品 的对应表（slug 是图源商品在 CDN 上的路径）

console.log('正在从 DummyJSON 拉取商品图清单（只取地址，不下载图片）...')
const remote = await (await fetch('https://dummyjson.com/products?limit=0')).json()

// slug → 图片地址数组（slug 从图片 URL 里反解）
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

  // 名字/副标题对齐图片
  if (conf.title && conf.title !== p.title) {
    p.title = conf.title
    retitled.push(p.id)
  }
  if (conf.subtitle) p.subtitle = conf.subtitle

  // 直接写远程地址：图片由后端 /api/img 实时代理，本地不留文件
  const urls = images.slice(0, 3)
  while (urls.length < 3) urls.push(urls[urls.length - 1])

  p.images = urls
  p.cover = urls[0]
  // 图源的商品图统一 1000x1000，比例写死 1，
  // 瀑布流靠它提前算占位高度，加载完不跳动（CLS = 0）
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
