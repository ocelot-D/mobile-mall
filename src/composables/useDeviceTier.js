// ============================================================================
// 低端机识别与动效降级
//
// 低端安卓上，毛玻璃 backdrop-filter 和大面积渐变动画会让滚动掉到 20 帧，
// 所以按设备分级做降级：核心数少、内存小或开了省流模式的机器自动关掉这些效果。
//
// 判定依据（都是浏览器原生 API，不需要装任何库）：
//   navigator.hardwareConcurrency  CPU 核心数
//   navigator.deviceMemory         内存大小（GB，Chrome 系支持）
//   window.devicePixelRatio        像素比，越高渲染压力越大
//   navigator.connection.saveData  用户是否开了省流量模式
//   matchMedia('(prefers-reduced-motion: reduce)')  系统级"减弱动效"开关
// ============================================================================

import { reactive } from 'vue'

// localStorage 的 key：用户手动切换过就记住，下次打开还是他选的那个
const STORE_KEY = 'mobimall.lowEndMode'

// 全局响应式的设备档位信息，组件里直接用
export const device = reactive({
  low: false,        // 最终结论：要不要降级
  autoLow: false,    // 机器自己检测出来是低端机
  manual: null,      // 用户手动设置：null=跟随自动, true=强制降级, false=强制不降级
  cores: 0,
  memory: 0,
  dpr: 1,
  saveData: false,
  reducedMotion: false,
  reason: '',        // 为什么被判为低端机（“我的”页面上展示）
})

/** 读用户手动设置 */
function readManual() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw === 'on') return true
    if (raw === 'off') return false
    return null
  } catch {
    // 隐私模式下 localStorage 可能抛错，不能让整个页面挂掉
    return null
  }
}

/** 写用户手动设置 */
function writeManual(v) {
  try {
    if (v === null) localStorage.removeItem(STORE_KEY)
    else localStorage.setItem(STORE_KEY, v ? 'on' : 'off')
  } catch {
    /* 写不进去就算了，不影响主流程 */
  }
}

/**
 * 检测设备档位
 *
 * 判定规则：
 *   1. CPU 核心数 ≤ 4              → 中低端安卓的典型配置
 *   2. 内存 ≤ 4GB                  → 内存小的机器图层合成能力弱
 *   3. 像素比 ≥ 3 且核心数 ≤ 6     → 高分屏每一帧要渲的像素是 2 倍屏的 2.25 倍
 *   4. 开了省流模式                → 用户已经在省钱/省电了，别再给他加特效
 *   5. 系统开了"减弱动效"          → 明确的用户偏好，必须尊重
 */
export function detectDeviceTier() {
  const cores = navigator.hardwareConcurrency || 4
  const memory = navigator.deviceMemory || 0
  const dpr = window.devicePixelRatio || 1
  const saveData = navigator.connection?.saveData === true
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

  const reasons = []
  if (cores <= 4) reasons.push(`CPU ${cores} 核`)
  if (memory && memory <= 4) reasons.push(`内存 ${memory}GB`)
  if (dpr >= 3 && cores <= 6) reasons.push(`${dpr} 倍屏渲染压力大`)
  if (saveData) reasons.push('用户开了省流模式')
  if (reducedMotion) reasons.push('系统设置了减弱动效')

  device.cores = cores
  device.memory = memory
  device.dpr = dpr
  device.saveData = saveData
  device.reducedMotion = reducedMotion
  device.autoLow = reasons.length > 0
  device.reason = reasons.join(' · ') || '设备性能良好，未触发降级'

  // 手动设置优先级最高：用户明确选了就听用户的
  device.manual = readManual()
  device.low = device.manual === null ? device.autoLow : device.manual
}

/** 把结论落到 <html> 的 class 上，CSS 里 .low-end 那一套才会生效 */
export function applyDeviceClass() {
  const root = document.documentElement
  root.classList.toggle('low-end', device.low)
  // 同时挂一个 data 属性，方便在浏览器控制台里一眼看出当前档位
  root.dataset.deviceTier = device.low ? 'low' : 'high'
}

/** 用户手动切换（"我的"页面上的开关） */
export function setLowEndMode(value) {
  device.manual = value
  device.low = value
  writeManual(value)
  applyDeviceClass()
}

/** 交还自动判定 */
export function resetLowEndMode() {
  device.manual = null
  device.low = device.autoLow
  writeManual(null)
  applyDeviceClass()
}

/**
 * 在 Vue 挂载之前调用：
 * 必须在渲染第一帧前把 .low-end 加上，否则会出现
 * "先渲染了毛玻璃，然后才降级"的闪烁。
 */
export function initDeviceTier() {
  detectDeviceTier()
  applyDeviceClass()
}
