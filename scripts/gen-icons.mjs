// ============================================================================
// 生成「添加到主屏幕」需要的 PNG 图标
//
// 为什么自己写而不是找素材：
//   1. 版权干净，不用担心随便下的图标侵权
//   2. 不装任何第三方库，只用 Node 自带的 zlib（压缩 PNG 必须用到）
//   3. 换主题色只需改下面的常量，重新 npm run icons 就出图
//
// 干什么：
//   public/icons/icon-192.png       安卓 Chrome 安装时用
//   public/icons/icon-512.png       安卓启动画面 / 应用列表
//   public/icons/maskable-512.png   安卓"自适应图标"（系统会裁成圆/方/水滴形）
//   public/icons/apple-touch-icon.png  iOS 添加到主屏幕（180x180，必须不透明）
//
// 面试点：png 文件结构 = 签名 + IHDR + IDAT + IEND 四个块；
// IDAT 里是 zlib 压缩后的像素数据，每一行前面要加一个"过滤器类型"字节。
// ============================================================================

import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'icons')

// 主题色，和 src/style.css 里的 --brand 保持一致
const C_TOP = [255, 122, 51] // 渐变左上：橙
const C_BOTTOM = [255, 62, 0] // 渐变右下：品牌橙红
const C_GLYPH = [255, 255, 255] // 白色图形（购物袋）
const C_BG = [245, 245, 247] // maskable 图标外围底色

// ---------------------------------------------------------------------------
// PNG 编码（手写，只依赖 zlib）
// ---------------------------------------------------------------------------

// CRC32 查表：PNG 每个数据块末尾都要带校验值，不然图片会被判损坏
const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = -1
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
  return (c ^ -1) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([len, body, crc])
}

// rgba: Uint8Array，长度 = w * h * 4
function encodePNG(w, h, rgba) {
  // 每一行前面加一个字节的过滤器类型，0 = 不过滤（简单、可靠）
  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8 // 每个通道 8 位
  ihdr[9] = 6 // 颜色类型 6 = RGBA
  ihdr[10] = 0 // 压缩方式，只能是 0
  ihdr[11] = 0 // 过滤器方式，只能是 0
  ihdr[12] = 0 // 不隔行扫描

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), // PNG 文件签名
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

// ---------------------------------------------------------------------------
// 画图标：渐变底 + 白色购物袋
// ---------------------------------------------------------------------------

// 判断点 (x, y) 在不在购物袋图形里。坐标都是 0~1 的相对坐标。
// 图形 = 一个圆角矩形（袋身） + 一个半圆环（提手）
function inGlyph(x, y) {
  // 提手：圆心 (0.5, 0.44) 正好压在袋身上沿，外半径 0.14、内半径 0.095，
  // 只取上半圆 —— 下半圆本来就落在袋身里，画了也看不见。
  // 圆心贴着袋口画，提手两端才能和袋身"长"在一起，不留缝。
  const dx = x - 0.5
  const dy = y - 0.44
  const d = Math.sqrt(dx * dx + dy * dy)
  if (d <= 0.14 && d >= 0.095 && y <= 0.44) return true

  // 袋身：圆角矩形，左上角 (0.22, 0.44)，右下角 (0.78, 0.82)，圆角 0.06
  const x0 = 0.22
  const x1 = 0.78
  const y0 = 0.44
  const y1 = 0.82
  const r = 0.06
  if (x < x0 || x > x1 || y < y0 || y > y1) return false
  // 四个角做圆角：落在角上的圆外区域要挖掉
  const cx = x < x0 + r ? x0 + r : x > x1 - r ? x1 - r : x
  const cy = y < y0 + r ? y0 + r : y > y1 - r ? y1 - r : y
  if (x < x0 + r || x > x1 - r) {
    if (y < y0 + r || y > y1 - r) {
      const ddx = x - cx
      const ddy = y - cy
      return ddx * ddx + ddy * ddy <= r * r
    }
  }
  return true
}

/**
 * 生成一张图标
 * @param size      边长（正方形）
 * @param scale     图形缩放，1 = 铺满。maskable 要缩到 0.62 留出安全区
 * @param padBg     外围底色，null 表示外围也用渐变（非 maskable 用）
 */
function makeIcon(size, scale = 1, padBg = null) {
  const rgba = new Uint8Array(size * size * 4)
  const SS = 3 // 超采样：每个像素取 3x3 个点求平均，边缘不锯齿

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0
      let g = 0
      let b = 0

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          // 采样点的相对坐标
          let ux = (px + (sx + 0.5) / SS) / size
          let uy = (py + (sy + 0.5) / SS) / size

          // 缩放：以中心为原点缩，再放回 0~1
          let inPad = false
          if (scale < 1) {
            ux = (ux - 0.5) / scale + 0.5
            uy = (uy - 0.5) / scale + 0.5
            // 跑到画布外 = 安全区外围，填纯底色
            if (ux < 0 || ux > 1 || uy < 0 || uy > 1) inPad = true
          }

          let cr
          let cg
          let cb
          if (inPad) {
            ;[cr, cg, cb] = padBg
          } else if (inGlyph(ux, uy)) {
            ;[cr, cg, cb] = C_GLYPH
          } else {
            // 左上到右下线性渐变
            const t = Math.min(1, Math.max(0, (ux + uy) / 2))
            cr = C_TOP[0] + (C_BOTTOM[0] - C_TOP[0]) * t
            cg = C_TOP[1] + (C_BOTTOM[1] - C_TOP[1]) * t
            cb = C_TOP[2] + (C_BOTTOM[2] - C_TOP[2]) * t
          }
          r += cr
          g += cg
          b += cb
        }
      }

      const n = SS * SS
      const i = (py * size + px) * 4
      rgba[i] = Math.round(r / n)
      rgba[i + 1] = Math.round(g / n)
      rgba[i + 2] = Math.round(b / n)
      rgba[i + 3] = 255 // 不透明：iOS 的 apple-touch-icon 必须不透明，否则出黑底
    }
  }

  return encodePNG(size, size, rgba)
}

// ---------------------------------------------------------------------------
// 出图
// ---------------------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true })

const FILES = [
  ['icon-192.png', 192, 1, null],
  ['icon-512.png', 512, 1, null],
  // maskable：图形缩到 62%，外围留底色。
  // 安卓各家会把图标裁成圆形/水滴/方形，不留安全区的话购物袋会被切掉角。
  ['maskable-512.png', 512, 0.62, C_BG],
  ['apple-touch-icon.png', 180, 1, null],
]

for (const [name, size, scale, pad] of FILES) {
  const buf = makeIcon(size, scale, pad)
  writeFileSync(join(OUT_DIR, name), buf)
  console.log(`  ${name.padEnd(22)} ${size}x${size}  ${(buf.length / 1024).toFixed(1)} KB`)
}

console.log(`\n图标生成完毕：${FILES.length} 张，输出到 public/icons/`)
