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
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DATA_FILE = join(ROOT, 'data', 'products.json')

// 36 件商品 → 图源商品 的对应表（slug 是图源商品在 CDN 上的路径）
const MAP = {
  // ── 数码 ──
  p001: { slug: 'mobile-accessories/apple-airpods-max-silver' },
  p002: { slug: 'mobile-accessories/apple-iphone-charger' },
  p003: { slug: 'tablets/ipad-mini-2021-starlight', title: '轻阅 X5 平板电脑', subtitle: '8.3 英寸 · 随身图书馆 · 全天续航' },
  p004: { slug: 'mobile-accessories/apple-magsafe-battery-pack' },
  p005: { slug: 'mobile-accessories/iphone-12-silicone-case-with-magsafe-plum', title: '轻护 MagSafe 手机壳', subtitle: '液态硅胶 · 磁吸充电不摘壳' },
  p006: { slug: 'mobile-accessories/apple-homepod-mini-cosmic-grey', title: '拾音智能音箱 mini', subtitle: '360° 环绕声场 · 语音助手唤醒' },

  // ── 服饰 ──
  p007: { slug: 'mens-shirts/gigabyte-aorus-men-tshirt', title: '云朵感重磅纯棉 T 恤', subtitle: '260g 克重 · 不透不塌' },
  p008: { slug: "womens-bags/heshe-women's-leather-bag", title: '通勤真皮托特包', subtitle: '头层牛皮 · 15.6 寸笔电直入' },
  p009: { slug: "womens-dresses/black-women's-gown", title: '雾感收腰针织连衣裙', subtitle: '垂坠不贴身 · 秋冬新款' },
  p010: { slug: 'mens-shirts/man-short-sleeve-shirt' },
  p011: { slug: 'mens-shoes/nike-air-jordan-1-red-and-black' },
  p012: { slug: 'mens-shirts/blue-&-black-check-shirt', title: '复古格纹法兰绒衬衫', subtitle: '磨毛加厚 · 免烫抗皱' },

  // ── 家居 ──
  p013: { slug: 'furniture/annibale-colombo-sofa', title: '北欧布艺三人沙发', subtitle: '高回弹海绵 · 可拆洗外套' },
  p014: { slug: 'furniture/annibale-colombo-bed' },
  p015: { slug: 'home-decoration/house-showpiece-plant', title: '北欧风绿植摆件', subtitle: '仿真植物 · 免打理' },
  p016: { slug: 'furniture/bedside-table-african-cherry', title: '原木床头柜', subtitle: '小户型友好 · 静音阻尼抽屉' },
  p017: { slug: 'furniture/knoll-saarinen-executive-conference-chair', title: '北欧实木餐椅', subtitle: '曲木靠背 · 承重 150kg' },
  p018: { slug: 'home-decoration/table-lamp', title: '暖光桌面氛围灯', subtitle: '三档色温 · 触控调光' },

  // ── 食品 ──
  p019: { slug: 'groceries/honey-jar', title: '深山百花蜂蜜', subtitle: '波美度 42 · 500g 玻璃罐装' },
  p020: { slug: 'groceries/nescafe-coffee', title: '冻干黑咖啡', subtitle: '中深烘 · 零糖零脂' },
  p021: { slug: 'groceries/juice', title: 'NFC 鲜榨橙汁', subtitle: '100% 果汁 · 0 添加' },
  p022: { slug: 'groceries/protein-powder', title: '分离乳清蛋白粉', subtitle: '低脂高蛋白 · 独立量勺' },
  p023: { slug: 'groceries/strawberry', title: '当日现摘奶油草莓', subtitle: '云南空运 · 甜度 12+' },
  p024: { slug: 'groceries/chicken-meat' },

  // ── 美妆 ──
  p025: { slug: 'skin-care/olay-ultra-moisture-shea-butter-body-wash', title: '水感保湿身体乳', subtitle: '24h 长效润泽 · 敏感肌可用' },
  p026: { slug: 'skin-care/attitude-super-leaves-hand-soap', title: '氨基酸温和洁面乳', subtitle: '弱酸性 · 洗后不紧绷' },
  p027: { slug: 'beauty/red-lipstick', title: '丝绒雾面口红', subtitle: '显白不挑皮 · 三色可选' },
  p028: { slug: 'skin-care/vaseline-men-body-and-face-lotion', title: '男士清爽润肤乳', subtitle: '不粘腻 · 控油保湿' },
  p029: { slug: 'beauty/eyeshadow-palette-with-mirror', title: '大地色十二色眼影盘', subtitle: '哑光珠光 · 附镜便携' },
  p030: { slug: 'beauty/powder-canister' },

  // ── 运动 ──
  p031: { slug: 'mens-shoes/puma-future-rider-trainers' },
  p032: { slug: 'sports-accessories/basketball', title: '专业比赛篮球 7 号', subtitle: '室内外通用 · 吸湿防滑' },
  p033: { slug: 'sports-accessories/tennis-racket', title: '碳纤维网球拍', subtitle: '初学进阶两用 · 已穿线' },
  p034: { slug: 'sports-accessories/american-football', title: '美式橄榄球训练用球', subtitle: '9 号标准 · 耐磨胶皮' },
  p035: { slug: 'sports-accessories/iron-golf', title: '高尔夫七号铁杆', subtitle: '碳素杆身 · 容错率高' },
  p036: { slug: 'sports-accessories/baseball-glove', title: '棒球内场手套', subtitle: '头层牛皮 · 即买即用' },
}

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
