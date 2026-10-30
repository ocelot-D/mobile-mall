// ============================================================================
// 种子数据生成脚本（本地兜底层）
//
// 干什么：生成 data/products.json —— 36 件中文商品，分类、价格、库存、规格自洽
//
// 这 36 件是"兜底数据"：
//   后端默认走实时商品源（191 件，见 server/api-server.js 的 LIVE_* 部分），
//   只有图源拉不到、或者用 MOBI_LIVE=0 关掉实时层时，才用这批数据。
//
// 商品图怎么写：
//   直接写图源的远程地址（映射表在 scripts/image-map.mjs），
//   由后端 /api/img 实时代理取回，本地一张图都不存。
//   以前这里会生成 108 张 SVG 占位图，切换实时图后没人引用，已经清掉了。
//
// 为什么数据要"手写"而不是随机生成？
//   随机出来的商品（"商品 1234"）打开一眼假，面试官一看就知道是凑数的。
//   手写的分类、价格、库存、卖点互相自洽，打开才像一套正在用的商城。
//
// 跑法：npm run seed（离线可跑，不需要联网）
// ============================================================================

import { writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { MAP } from './image-map.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.join(__dirname, '..')
const DATA_DIR = path.join(PROJECT_ROOT, 'data')
const IMG_DIR = path.join(PROJECT_ROOT, 'public', 'img')

// ────────────────────────────────────────────────────────────────────────────
// 一、分类
// ────────────────────────────────────────────────────────────────────────────
// 每个分类给两个颜色，商品图的渐变就从这两个颜色里取，
// 这样同一个分类的商品图看起来色调统一，视觉上能归类。
const CATEGORIES = [
  { id: 'digital', name: '数码', icon: 'phone', c1: '#3b6ef5', c2: '#7aa2ff' },
  { id: 'apparel', name: '服饰', icon: 'shirt', c1: '#e2568b', c2: '#ff9ec0' },
  { id: 'home', name: '家居', icon: 'home', c1: '#2f9e7e', c2: '#7fd6b8' },
  { id: 'food', name: '食品', icon: 'cup', c1: '#e08a2b', c2: '#ffc178' },
  { id: 'beauty', name: '美妆', icon: 'drop', c1: '#9a4bd8', c2: '#d5a6f5' },
  { id: 'sport', name: '运动', icon: 'run', c1: '#d94f3d', c2: '#ff9877' },
]

// ────────────────────────────────────────────────────────────────────────────
// 二、商品（手写种子）
//
// 每一行的字段顺序（写在一行里是为了改起来快，顺序在下面注释里）：
//   [0] 商品名
//   [1] 卖点短句
//   [2] 现价（元）
//   [3] 原价（元）
//   [4] 已售件数
//   [5] 库存
//   [6] 评分（4.0 - 5.0）
//   [7] 图片高宽比（瀑布流里每张卡片高度不一样才自然；
//       顺便这个比例会写进 CSS 的 aspect-ratio，图片没加载完坑位也占好了，
//       这是消除布局抖动 CLS 的关键）
//   [8] 标签数组
//   [9] 规格一：颜色（数组）
//   [10] 规格二：版本/容量（数组，写 "名称|加价" 表示选它要加多少钱，
//        这样详情页切规格时价格会跟着变）
// ────────────────────────────────────────────────────────────────────────────
const RAW = {
  digital: [
    ['静界 Pro 无线降噪耳机', '主动降噪 · 单次续航 12 小时', 399, 599, 8421, 86, 4.8, 1.0, ['包邮', '热卖'], ['曜石黑', '月光白'], ['标准版', '降噪版|120']],
    ['轻石 65W 氮化镓充电器', '三口同充 · 笔记本也能喂饱', 129, 189, 15230, 240, 4.7, 1.25, ['包邮'], ['深空灰', '奶白'], ['单口', '双口|40']],
    ['掌阅 X5 电子墨水屏', '6.8 英寸 · 冷暖双色温前光', 899, 1199, 3260, 42, 4.6, 1.33, ['新品'], ['墨黑', '雾蓝'], ['16G', '32G|150']],
    ['随行 5000mAh 磁吸电源', '卡片机身 · 一贴即充', 159, 229, 6742, 150, 4.5, 0.9, ['包邮'], ['石墨黑', '远峰蓝'], ['5000mAh', '10000mAh|70']],
    ['极简机械键盘 K3', '低音红轴 · 三模连接', 329, 459, 2180, 63, 4.7, 1.15, ['热卖'], ['暗夜', '奶油'], ['68 键', '87 键|60']],
    ['光影 4K 便携投影仪', '自动对焦 · 内置电池', 1699, 2199, 942, 18, 4.4, 1.0, ['新品', '包邮'], ['月光银'], ['标准版', '套装版|300']],
  ],
  apparel: [
    ['云朵感宽松圆领卫衣', '380g 重磅棉 · 不起球', 189, 299, 12480, 320, 4.8, 1.3, ['热卖', '包邮'], ['燕麦白', '雾霾蓝', '炭灰'], ['M', 'L', 'XL']],
    ['轻氧感直筒牛仔裤', '高腰显瘦 · 四面弹面料', 239, 359, 8930, 180, 4.6, 1.4, ['包邮'], ['浅蓝', '深蓝', '黑灰'], ['26', '27', '28', '29']],
    ['暖阳 90 白鸭绒羽绒服', '含绒量 90% · 零下十度可穿', 699, 1099, 3620, 95, 4.7, 1.25, ['新品'], ['曜黑', '米杏', '松绿'], ['M', 'L', 'XL', 'XXL|30']],
    ['素麻宽松衬衫', '新疆棉麻 · 透气不贴身', 159, 239, 5210, 210, 4.5, 1.35, ['包邮'], ['本白', '浅卡其', '雾霾绿'], ['S', 'M', 'L']],
    ['踏云软底休闲鞋', '踩屎感鞋垫 · 久走不累', 279, 429, 15820, 260, 4.8, 1.0, ['热卖'], ['黑白', '全黑', '米白'], ['36', '37', '38', '39', '40', '41']],
    ['细织羊毛混纺围巾', '亲肤不扎 · 冬日出街单品', 99, 169, 7340, 400, 4.4, 1.1, ['包邮'], ['藏青', '酒红', '浅灰'], ['均码']],
  ],
  home: [
    ['北欧实木升降电脑桌', '静音电机 · 记忆高度', 1299, 1899, 2140, 36, 4.7, 1.0, ['包邮'], ['原木色', '胡桃色'], ['1.2m', '1.4m|200', '1.6m|400']],
    ['云眠抗菌四件套', '60 支长绒棉 · 裸睡级触感', 359, 599, 9840, 150, 4.8, 1.2, ['热卖', '包邮'], ['豆沙粉', '雾霾蓝', '浅灰'], ['1.5m', '1.8m|40', '2.0m|80']],
    ['静音循环扇 S2', '直流变频 · 最低 18 分贝', 429, 599, 4720, 88, 4.6, 1.25, ['新品'], ['月白', '深灰'], ['落地款', '台式|−80']],
    ['拾光香薰加湿器', '300ml · 无雾静音', 149, 219, 11230, 300, 4.5, 1.0, ['包邮'], ['奶白', '藕粉'], ['基础款', '夜灯款|50']],
    ['收纳方格布艺凳', '可折叠 · 承重 120kg', 89, 139, 6210, 420, 4.3, 0.95, ['包邮'], ['米白', '灰蓝'], ['单只', '两只装|70']],
    ['暖光落地氛围灯', '三档色温 · 无极调光', 259, 389, 3380, 120, 4.6, 1.35, ['新品'], ['香槟金', '哑黑'], ['标准版', '遥控版|60']],
  ],
  food: [
    ['明前龙井 特级礼盒', '手工采摘 · 豆香浓郁', 288, 468, 5610, 200, 4.8, 1.1, ['热卖', '包邮'], ['明前特级'], ['100g', '250g|320', '500g|760']],
    ['云南小粒咖啡挂耳', '中深烘 · 10 片独立装', 69, 99, 18420, 800, 4.7, 1.0, ['包邮'], ['经典拼配', '果香日晒'], ['10 片', '30 片|120']],
    ['古法手工红糖姜茶', '独立小袋 · 经期常备', 49, 79, 23150, 1000, 4.5, 1.2, ['包邮'], ['原味', '玫瑰味'], ['15 袋', '30 袋|40']],
    ['海盐黑巧坚果礼盒', '六种坚果 · 低糖配方', 119, 179, 8720, 350, 4.6, 0.95, ['新品'], ['混合装'], ['500g', '1000g|90']],
    ['当日现摘阳光玫瑰', '云南建水 · 甜度 18 度', 88, 138, 6940, 160, 4.4, 1.15, ['包邮'], ['精品果'], ['2 斤', '5 斤|150']],
    ['低脂即食鸡胸肉', '开袋即食 · 高蛋白', 59, 89, 31200, 1200, 4.5, 1.0, ['热卖', '包邮'], ['黑胡椒', '奥尔良'], ['8 包', '20 包|80']],
  ],
  beauty: [
    ['水感保湿精华水', '5% 烟酰胺 · 敏感肌可用', 179, 289, 14280, 260, 4.8, 1.25, ['热卖'], ['清爽型', '滋润型'], ['120ml', '200ml|90']],
    ['素颜防晒乳 SPF50+', '不泛白 · 成膜快', 129, 189, 26540, 500, 4.7, 1.1, ['包邮', '热卖'], ['自然色', '透明色'], ['30ml', '50ml|60']],
    ['丝绒雾面口红礼盒', '三支装 · 显白不挑皮', 199, 329, 9130, 180, 4.6, 1.0, ['新品'], ['豆沙', '正红', '蜜桃'], ['单支', '三支装|260']],
    ['氨基酸温和洁面', '弱酸性 · 洗后不紧绷', 89, 139, 18750, 640, 4.7, 1.2, ['包邮'], ['补水型', '控油型'], ['100g', '150g|40']],
    ['头皮护理洗发水', '无硅油 · 蓬松控油', 109, 169, 12460, 380, 4.5, 1.3, ['包邮'], ['清爽控油', '柔顺修护'], ['400ml', '750ml|70']],
    ['夜间修护面霜', '神经酰胺 · 屏障修护', 259, 399, 5820, 140, 4.8, 1.05, ['新品'], ['轻盈版', '滋润版'], ['30g', '50g|160']],
  ],
  sport: [
    ['轻弹减震跑鞋 A3', '回弹中底 · 一双通勤跑两用', 429, 659, 7410, 210, 4.8, 1.0, ['热卖', '包邮'], ['黑白', '荧光绿', '藏青'], ['38', '39', '40', '41', '42', '43']],
    ['专业瑜伽垫 8mm', '防滑双面 · 送绑带', 139, 219, 15230, 400, 4.7, 1.1, ['包邮'], ['雾霾紫', '高级灰', '墨绿'], ['6mm', '8mm|30']],
    ['智能跳绳 T2', '自动计数 · 蓝牙同步', 99, 159, 9840, 520, 4.5, 1.2, ['新品'], ['曜石黑', '樱花粉'], ['标准版', 'APP 版|40']],
    ['速干短袖训练服', '冰丝面料 · 出汗不粘身', 89, 139, 21470, 780, 4.6, 1.3, ['包邮'], ['黑', '白', '灰蓝'], ['M', 'L', 'XL', 'XXL|20']],
    ['折叠健身哑铃', '一对装 · 可拆卸配重', 199, 329, 4260, 160, 4.4, 1.0, ['包邮'], ['哑光黑'], ['5kg', '10kg|120', '15kg|240']],
    ['户外露营折叠椅', '承重 150kg · 一秒收纳', 169, 259, 6180, 240, 4.6, 1.15, ['新品'], ['卡其', '墨绿', '深灰'], ['标准款', '加宽款|60']],
  ],
}

// ────────────────────────────────────────────────────────────────────────────
// 三、把上面的紧凑数组展开成完整商品对象
// ────────────────────────────────────────────────────────────────────────────
let seq = 0
const products = []

for (const cat of CATEGORIES) {
  for (const row of RAW[cat.id]) {
    seq += 1
    // 编号统一补零成 3 位，文件名和商品 id 都用它，方便对照
    const no = String(seq).padStart(3, '0')

    const [rawTitle, rawSubtitle, price, originPrice, sales, stock, rating, ratio, tags, colorList, sizeList] = row

    // 商品名/副标题：优先用映射表里"对齐过图片"的名字。
    // 比如图库里没有"机械键盘"，映射表把它改成了 MagSafe 手机壳，
    // 这样名字、描述、图片三者一致，不会出现"耳机配手机图"的穿帮。
    const conf = MAP[`p${no}`] || {}
    const title = conf.title || rawTitle
    const subtitle = conf.subtitle || rawSubtitle

    // 规格二里写 "名称|加价" 的解析成 { label, delta }。
    // delta 用来实现"详情页切规格价格跟着变"这个验收点。
    // 注意加价可以是负数（比如台式款比落地款便宜），所以正则允许 − 和 -。
    const sizeValues = sizeList.map((item) => {
      const m = String(item).split('|')
      if (m.length === 1) return { label: m[0], delta: 0 }
      return { label: m[0], delta: Number(String(m[1]).replace('−', '-')) }
    })

    products.push({
      id: `p${no}`,
      no,
      title,
      subtitle,
      categoryId: cat.id,
      categoryName: cat.name,
      price,
      originPrice,
      sales,
      stock,
      rating,
      tags,
      // 商品图：写图源的远程地址，由后端 /api/img 实时代理取回
      // （本地不存图；ratio 写 1 是为了瀑布流提前占位，加载完不跳动）
      images: conf.slug
        ? [1, 2, 3].map(
            (i) => `https://cdn.dummyjson.com/product-images/${conf.slug}/${i}.webp`
          )
        : [],
      cover: conf.slug
        ? `https://cdn.dummyjson.com/product-images/${conf.slug}/1.webp`
        : '',
      ratio: 1,
      // 规格：颜色不加价，版本/容量可能加价
      specs: [
        { name: '颜色', values: colorList.map((label) => ({ label, delta: 0 })) },
        { name: sizeList.length > 1 ? '规格' : '规格', values: sizeValues },
      ],
      // 参数表，详情页下半部分展示
      params: [
        { k: '商品编号', v: `MM${no}` },
        { k: '发货地', v: ['杭州', '广州', '成都', '苏州', '武汉'][seq % 5] },
        { k: '服务', v: '7 天无理由 · 运费险' },
      ],
      // 详情长图区用的一段描述
      desc: `${subtitle}。${title}采用严选材质，经过 ${12 + (seq % 6)} 道工序质检，支持 7 天无理由退换与运费险，下单后 48 小时内发货。`,
      // 商品图配色：直接取分类色，保证同分类视觉统一
      c1: cat.c1,
      c2: cat.c2,
    })
  }
}

// ────────────────────────────────────────────────────────────────────────────
// 四、生成 SVG 商品图
//
// 一张图 = 渐变背景 + 几个半透明几何图形 + 商品编号 + 分类名。
// 为什么这么做：既好看又完全没有版权风险，而且体积只有 1KB 左右。
//
// ★ 这个函数现在**没有被调用**（商品图改成实时远程图了），保留下来是为了：
//   万一哪天图源挂了、或者想在没网的环境演示，把 main() 里的生成循环加回来即可，
//   配合 npm run seed 就能瞬间恢复一批本地占位图。
// ────────────────────────────────────────────────────────────────────────────
function makeProductSvg(p, index) {
  const W = 600
  const H = Math.round(W * p.ratio)

  // 每个商品的三张图做一点变化：几何图形位置按 index 偏移，看起来像不同角度的实拍图
  const shapes = [
    // 第 1 张：同心圆 + 对角斜块
    `<circle cx="${W * 0.7}" cy="${H * 0.35}" r="${W * 0.28}" fill="#fff" opacity=".14"/>
     <circle cx="${W * 0.7}" cy="${H * 0.35}" r="${W * 0.17}" fill="#fff" opacity=".12"/>
     <path d="M0 ${H} L${W * 0.55} 0 L${W} 0 L${W} ${H * 0.35} Z" fill="#fff" opacity=".07"/>`,
    // 第 2 张：斜切色块
    `<rect x="${W * 0.1}" y="${H * 0.15}" width="${W * 0.55}" height="${H * 0.5}" rx="24" fill="#fff" opacity=".13"/>
     <path d="M${W * 0.35} ${H * 0.75} L${W * 0.72} ${H * 0.2} L${W * 0.95} ${H * 0.45} Z" fill="#fff" opacity=".16"/>`,
    // 第 3 张：圆角方块阵列
    `<rect x="${W * 0.08}" y="${H * 0.12}" width="${W * 0.3}" height="${H * 0.3}" rx="20" fill="#fff" opacity=".12"/>
     <rect x="${W * 0.45}" y="${H * 0.22}" width="${W * 0.34}" height="${H * 0.34}" rx="20" fill="#fff" opacity=".16"/>
     <circle cx="${W * 0.22}" cy="${H * 0.78}" r="${W * 0.16}" fill="#fff" opacity=".13"/>`,
  ][index]

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${p.c1}"/><stop offset="1" stop-color="${p.c2}"/>
</linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#g)"/>
${shapes}
<g font-family="-apple-system,PingFang SC,Microsoft YaHei,sans-serif" fill="#fff">
<text x="36" y="${H - 78}" font-size="34" font-weight="700" opacity=".95">${p.categoryName}</text>
<text x="36" y="${H - 34}" font-size="26" opacity=".8">NO.${p.no} · ${index + 1}/3</text>
</g>
<text x="${W - 36}" y="84" text-anchor="end" font-size="150" font-weight="800" fill="#fff" opacity=".16" font-family="Helvetica,Arial">${p.no}</text>
</svg>`
}

// 分类图标：简单的线性图形，首页九宫格入口用
function makeCategorySvg(cat) {
  const icons = {
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M10 19h4"/>',
    shirt: '<path d="M8 3 4 6l2 3 2-1v11h8V8l2 1 2-3-4-3-2 2h-4z"/>',
    home: '<path d="M3 11 12 3l9 8"/><path d="M6 10v10h12V10"/>',
    cup: '<path d="M5 8h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z"/><path d="M16 10h2a2 2 0 0 1 0 5h-2"/><path d="M5 21h12"/>',
    drop: '<path d="M12 3s6 6.5 6 10a6 6 0 0 1-12 0c0-3.5 6-10 6-10z"/>',
    run: '<circle cx="15" cy="4" r="2"/><path d="M4 20l4-9 4 3 2-6"/><path d="M8 11 6 16l5 2 3-4"/>',
  }
  // 注意 viewBox 必须是 0 0 96 96：
  // 之前写成 0 0 24 24，可视区只有左上角 24×24，白色图形被 translate(24 24)
  // 推到了可视区外面，页面上就只剩一块纯色（老大截图吐槽的"全是色块"就是这个）。
  // viewBox 和画布尺寸一致后，96×96 的圆角底 + 居中的白色线性图形才都进画面。
  return `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${cat.c1}"/><stop offset="1" stop-color="${cat.c2}"/></linearGradient></defs>
<rect width="96" height="96" rx="24" fill="url(#g)"/>
<g transform="translate(24 24) scale(2)">${icons[cat.icon] || icons.home}</g>
</svg>`
}

// 首页轮播图
const BANNERS = [
  { id: 'b1', title: '新人首单立减 30', sub: '满 99 元可用 · 限新用户', c1: '#1f4ed8', c2: '#6ea8fe' },
  { id: 'b2', title: '夏季清仓 低至 5 折', sub: '每日 10 点上新 · 售完即止', c1: '#c2372f', c2: '#ff9b6a' },
  { id: 'b3', title: '会员日 全场包邮', sub: '周末下单再返 5% 积分', c1: '#0f6e56', c2: '#7fd6b8' },
]

function makeBannerSvg(b) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="750" height="320" viewBox="0 0 750 320">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b.c1}"/><stop offset="1" stop-color="${b.c2}"/></linearGradient></defs>
<rect width="750" height="320" fill="url(#g)"/>
<circle cx="640" cy="70" r="120" fill="#fff" opacity=".10"/>
<circle cx="620" cy="270" r="90" fill="#fff" opacity=".08"/>
<g font-family="-apple-system,PingFang SC,Microsoft YaHei,sans-serif" fill="#fff">
<text x="56" y="150" font-size="52" font-weight="800">${b.title}</text>
<text x="56" y="204" font-size="28" opacity=".85">${b.sub}</text>
</g>
</svg>`
}

// ────────────────────────────────────────────────────────────────────────────
// 五、落盘
// ────────────────────────────────────────────────────────────────────────────
async function main() {
  if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true })
  if (!existsSync(IMG_DIR)) await mkdir(IMG_DIR, { recursive: true })

  // 图片：只生成 6 个分类图标 + 3 张轮播（共 9 张，约 37KB）
  //
  // ★ 商品图不再在这里生成：现在商品数据里存的是图源的远程地址，
  //   由后端 /api/img 实时代理取回，本机不落盘。
  //   以前这里会生成 36 × 3 = 108 张 p*.svg 占位图，切换成实时图后它们没人引用，
  //   已经清理掉；如果再生成一次就又回来了，所以干脆不生成。
  let imgCount = 0
  for (const cat of CATEGORIES) {
    await writeFile(path.join(IMG_DIR, `cat-${cat.id}.svg`), makeCategorySvg(cat), 'utf8')
    imgCount += 1
  }
  for (const b of BANNERS) {
    await writeFile(path.join(IMG_DIR, `${b.id}.svg`), makeBannerSvg(b), 'utf8')
    imgCount += 1
  }

  // 数据文件
  const payload = {
    // 版本号：改了数据结构就 +1，方便排查"数据是旧的"这类问题
    version: 1,
    generatedAt: new Date().toISOString(),
    categories: CATEGORIES.map(({ id, name, icon }) => ({ id, name, icon, img: `img/cat-${id}.svg` })),
    banners: BANNERS.map((b) => ({ id: b.id, img: `img/${b.id}.svg`, title: b.title, sub: b.sub })),
    products,
  }
  await writeFile(path.join(DATA_DIR, 'products.json'), JSON.stringify(payload, null, 2), 'utf8')

  console.log('')
  console.log('  [MobiMall] 种子数据生成完成')
  console.log(`  分类      ${CATEGORIES.length} 个`)
  console.log(`  商品      ${products.length} 件`)
  console.log(`  图片      ${imgCount} 张（SVG，代码生成，无版权风险）`)
  console.log(`  数据文件  data/products.json`)
  console.log('')
}

main().catch((err) => {
  console.error('  [MobiMall] 生成失败：', err)
  process.exit(1)
})
