import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'public', 'icons')

const C_TOP = [255, 122, 51]
const C_BOTTOM = [255, 62, 0]
const C_GLYPH = [255, 255, 255]
const C_BG = [245, 245, 247]

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

function encodePNG(w, h, rgba) {

  const raw = Buffer.alloc((w * 4 + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0
    Buffer.from(rgba.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0)
  ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function inGlyph(x, y) {

  const dx = x - 0.5
  const dy = y - 0.44
  const d = Math.sqrt(dx * dx + dy * dy)
  if (d <= 0.14 && d >= 0.095 && y <= 0.44) return true

  const x0 = 0.22
  const x1 = 0.78
  const y0 = 0.44
  const y1 = 0.82
  const r = 0.06
  if (x < x0 || x > x1 || y < y0 || y > y1) return false

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

function makeIcon(size, scale = 1, padBg = null) {
  const rgba = new Uint8Array(size * size * 4)
  const SS = 3

  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      let r = 0
      let g = 0
      let b = 0

      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {

          let ux = (px + (sx + 0.5) / SS) / size
          let uy = (py + (sy + 0.5) / SS) / size

          let inPad = false
          if (scale < 1) {
            ux = (ux - 0.5) / scale + 0.5
            uy = (uy - 0.5) / scale + 0.5

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
      rgba[i + 3] = 255
    }
  }

  return encodePNG(size, size, rgba)
}

mkdirSync(OUT_DIR, { recursive: true })

const FILES = [
  ['icon-192.png', 192, 1, null],
  ['icon-512.png', 512, 1, null],

  ['maskable-512.png', 512, 0.62, C_BG],
  ['apple-touch-icon.png', 180, 1, null],
]

for (const [name, size, scale, pad] of FILES) {
  const buf = makeIcon(size, scale, pad)
  writeFileSync(join(OUT_DIR, name), buf)
  console.log(`  ${name.padEnd(22)} ${size}x${size}  ${(buf.length / 1024).toFixed(1)} KB`)
}

console.log(`\n图标生成完毕：${FILES.length} 张，输出到 public/icons/`)
