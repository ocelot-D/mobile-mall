// ============================================================================
// 把真实商品照片下载到本地，替换掉原来代码生成的抽象 SVG 图
//
// 图源：DummyJSON（https://dummyjson.com）—— 公开免费的测试商品接口，
//       194 件真实商品，白底实拍图，托管在 cdn.dummyjson.com。
//
// 做法（v2：逐一指定，不按分类猜）：
//   下面的 MAP 表把我们的 36 件商品逐一指到图库里"长得一样"的真实商品，
//   图文对不上的（如机械键盘、投影仪，图库里没有）连名字副标题一起改成
//   图库里真实存在的东西 —— 保证每一件商品"名字、描述、图片"三者一致。
//
// 可重复执行：已下载的图自动跳过；想换一批图就删掉 public/img/p*.webp 再跑。
// ============================================================================

import { mkdirSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const IMG_DIR = join(ROOT, 'public', 'img')
const DATA_FILE = join(ROOT, 'data', 'products.json')

const CONCURRENCY = 6 // 同时最多下 6 张，太高会被图源限流
const RETRY = 2 // 失败重试次数

// ---------------------------------------------------------------------------
// 36 件商品 → 图源商品 的对应表
// slug 是图源商品在 cdn.dummyjson.com/product-images/ 下的路径，
// 也是它的"身份证"。title/subtitle 只有在改了名字时才写。
// ---------------------------------------------------------------------------
const MAP = {
  // ── 数码 ──
  p001: { slug: 'mobile-accessories/apple-airpods-max-silver' }, // 降噪耳机 ✓ 原名
  p002: { slug: 'mobile-accessories/apple-iphone-charger' }, // 充电器 ✓ 原名
  p003: { slug: 'tablets/ipad-mini-2021-starlight', title: '轻阅 X5 平板电脑', subtitle: '8.3 英寸 · 随身图书馆 · 全天续航' },
  p004: { slug: 'mobile-accessories/apple-magsafe-battery-pack' }, // 磁吸充电宝 ✓ 原名
  p005: { slug: 'mobile-accessories/iphone-12-silicone-case-with-magsafe-plum', title: '轻护 MagSafe 手机壳', subtitle: '液态硅胶 · 磁吸充电不摘壳' },
  p006: { slug: 'mobile-accessories/apple-homepod-mini-cosmic-grey', title: '拾音智能音箱 mini', subtitle: '360° 环绕声场 · 语音助手唤醒' },

  // ── 服饰 ──
  p007: { slug: 'mens-shirts/gigabyte-aorus-men-tshirt', title: '云朵感重磅纯棉 T 恤', subtitle: '260g 克重 · 不透不塌' },
  p008: { slug: "womens-bags/heshe-women's-leather-bag", title: '通勤真皮托特包', subtitle: '头层牛皮 · 15.6 寸笔电直入' },
  p009: { slug: "womens-dresses/black-women's-gown", title: '雾感收腰针织连衣裙', subtitle: '垂坠不贴身 · 秋冬新款' },
  p010: { slug: 'mens-shirts/man-short-sleeve-shirt' }, // 宽松衬衫 ✓ 原名
  p011: { slug: 'mens-shoes/nike-air-jordan-1-red-and-black' }, // 休闲鞋 ✓ 原名
  p012: { slug: 'mens-shirts/blue-&-black-check-shirt', title: '复古格纹法兰绒衬衫', subtitle: '磨毛加厚 · 免烫抗皱' },

  // ── 家居 ──
  p013: { slug: 'furniture/annibale-colombo-sofa', title: '北欧布艺三人沙发', subtitle: '高回弹海绵 · 可拆洗外套' },
  p014: { slug: 'furniture/annibale-colombo-bed' }, // 四件套配整床图 ✓ 原名
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
  p024: { slug: 'groceries/chicken-meat' }, // 即食鸡胸肉 ✓ 原名

  // ── 美妆 ──
  p025: { slug: 'skin-care/olay-ultra-moisture-shea-butter-body-wash', title: '水感保湿身体乳', subtitle: '24h 长效润泽 · 敏感肌可用' },
  p026: { slug: 'skin-care/attitude-super-leaves-hand-soap', title: '氨基酸温和洁面乳', subtitle: '弱酸性 · 洗后不紧绷' },
  p027: { slug: 'beauty/red-lipstick', title: '丝绒雾面口红', subtitle: '显白不挑皮 · 三色可选' },
  p028: { slug: 'skin-care/vaseline-men-body-and-face-lotion', title: '男士清爽润肤乳', subtitle: '不粘腻 · 控油保湿' },
  p029: { slug: 'beauty/eyeshadow-palette-with-mirror', title: '大地色十二色眼影盘', subtitle: '哑光珠光 · 附镜便携' },
  p030: { slug: 'beauty/powder-canister' }, // 面霜配罐装 ✓ 原名

  // ── 运动 ──
  p031: { slug: 'mens-shoes/puma-future-rider-trainers' }, // 跑鞋 ✓ 原名
  p032: { slug: 'sports-accessories/basketball', title: '专业比赛篮球 7 号', subtitle: '室内外通用 · 吸湿防滑' },
  p033: { slug: 'sports-accessories/tennis-racket', title: '碳纤维网球拍', subtitle: '初学进阶两用 · 已穿线' },
  p034: { slug: 'sports-accessories/american-football', title: '美式橄榄球训练用球', subtitle: '9 号标准 · 耐磨胶皮' },
  p035: { slug: 'sports-accessories/iron-golf', title: '高尔夫七号铁杆', subtitle: '碳素杆身 · 容错率高' },
  p036: { slug: 'sports-accessories/baseball-glove', title: '棒球内场手套', subtitle: '头层牛皮 · 即买即用' },
}

// ---------------------------------------------------------------------------
// 读 WebP 的真实宽高
// ---------------------------------------------------------------------------
// WebP 文件头：'RIFF' + 4字节长度 + 'WEBP' + 一个块
// 块头 4 字节类型 + 4 字节长度，之后是数据。
function webpSize(buf) {
  if (buf.slice(0, 4).toString('ascii') !== 'RIFF' || buf.slice(8, 12).toString('ascii') !== 'WEBP') {
    return null
  }
  const fourCC = buf.slice(12, 16).toString('ascii')

  // VP8X（扩展型，最常见）：画布宽高各占 3 字节，存的是"实际值 - 1"
  if (fourCC === 'VP8X') {
    return { w: buf.readUIntLE(24, 3) + 1, h: buf.readUIntLE(27, 3) + 1 }
  }
  // VP8L（无损）：宽高各 14 bit，从第 21 字节开始按位打包
  if (fourCC === 'VP8L') {
    const b = buf.readUInt32LE(21)
    return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 }
  }
  // VP8（有损）：跳过 3 字节帧同步码，接着 2 字节宽、2 字节高（低 14 位有效）
  if (fourCC === 'VP8 ') {
    return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff }
  }
  return null
}

// 带重试的下载
async function download(url) {
  let lastErr
  for (let i = 0; i <= RETRY; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    } catch (err) {
      lastErr = err
      await new Promise((r) => setTimeout(r, 500 * (i + 1))) // 退避重试
    }
  }
  throw lastErr
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

console.log('正在从 DummyJSON 拉取商品图清单...')
const res = await fetch('https://dummyjson.com/products?limit=0')
const remote = await res.json()

// slug → 图片地址数组（slug 从图片 URL 里反解，接口字段不齐也没关系）
const bySlug = {}
for (const p of remote.products) {
  const m = p.images[0].match(/product-images\/(.+)\/[^/]+$/)
  if (m) bySlug[m[1]] = p.images
}
console.log(`  图源商品 ${remote.products.length} 件，映射表覆盖 ${Object.keys(MAP).length} 件`)

const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'))
const products = data.products
mkdirSync(IMG_DIR, { recursive: true })

// 组下载任务：每件商品取源商品前 3 张图，不够就重复最后一张补齐
const tasks = []
const retitled = []
for (const p of products) {
  const conf = MAP[p.id]
  if (!conf) {
    console.warn(`  [跳过] ${p.id} 不在映射表里`)
    continue
  }
  const images = bySlug[conf.slug]
  if (!images) {
    console.warn(`  [跳过] ${p.id} 图源里找不到 ${conf.slug}，保留原图`)
    continue
  }

  // 名字/副标题对齐图片（只在有改动时写回，并在最后汇报）
  if (conf.title && conf.title !== p.title) {
    p.title = conf.title
    retitled.push(p.id)
  }
  if (conf.subtitle) p.subtitle = conf.subtitle

  const urls = images.slice(0, 3)
  while (urls.length < 3) urls.push(urls[urls.length - 1])
  urls.forEach((url, i) => {
    tasks.push({
      url,
      file: join(IMG_DIR, `${p.id}-${i + 1}.webp`),
      relPath: `img/${p.id}-${i + 1}.webp`,
      product: p,
      index: i,
    })
  })
}

console.log(`\n共 ${tasks.length} 张图待处理，开始下载...`)

let done = 0
let skipped = 0
let failed = 0
let bytes = 0
const ratios = {} // 商品 id → 第一张图的宽高

// REFRESH=1 时无视已存在的文件，强制重新下载（换映射表后用它覆盖旧图）
const FORCE = process.env.REFRESH === '1'

async function runOne(task) {
  if (existsSync(task.file) && !FORCE) {
    // 已存在就跳过下载，但仍要读出宽高，保证 products.json 的 ratio 正确
    const size = webpSize(readFileSync(task.file))
    if (size && task.index === 0) ratios[task.product.id] = size
    skipped++
    return
  }
  try {
    const buf = await download(task.url)
    writeFileSync(task.file, buf)
    bytes += buf.length
    const size = webpSize(buf)
    if (size && task.index === 0) ratios[task.product.id] = size
    done++
  } catch (err) {
    failed++
    console.error(`  [失败] ${task.relPath} ← ${task.url} (${err.message})`)
  }
}

const queue = [...tasks]
const workers = Array.from({ length: CONCURRENCY }, async () => {
  while (queue.length) {
    const t = queue.shift()
    if (!t) return
    await runOne(t)
    const n = done + skipped + failed
    if (n % 12 === 0) process.stdout.write(`  进度 ${n}/${tasks.length}\r`)
  }
})
await Promise.all(workers)

// ---------------------------------------------------------------------------
// 写回商品数据：换图片路径 + 修正宽高比（瀑布流靠它提前算占位高度）
// ---------------------------------------------------------------------------
let changed = 0
for (const p of products) {
  const r = ratios[p.id]
  const paths = [1, 2, 3].map((i) => `img/${p.id}-${i}.webp`)

  // 三张图都真的存在才替换，避免"数据说有图、页面却是破图"
  const allExist = paths.every((rel) => existsSync(join(IMG_DIR, rel.replace('img/', ''))))
  if (!allExist) continue

  p.images = paths
  p.cover = paths[0]
  p.ratio = r ? Math.round((r.w / r.h) * 1000) / 1000 : 1
  changed++
}

data.generatedAt = new Date().toISOString()
data.imageSource = 'DummyJSON 公开测试商品图（cdn.dummyjson.com），已下载到本地，映射见 scripts/fetch-images.mjs'
writeFileSync(DATA_FILE, JSON.stringify(data, null, 2))

console.log(`\n下载完成：`)
console.log(`  新下载   ${done} 张`)
console.log(`  已存在   ${skipped} 张`)
console.log(`  失败     ${failed} 张`)
console.log(`  总体积   ${(bytes / 1024 / 1024).toFixed(1)} MB`)
console.log(`  商品数据 已更新 ${changed} 件（图片路径 + 真实宽高比）`)
console.log(`  名称对齐 ${retitled.length} 件：${retitled.join('、')}`)
console.log(`\n下一步：npm run build 重新打包`)
