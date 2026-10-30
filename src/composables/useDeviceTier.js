import { reactive } from 'vue'

const STORE_KEY = 'mobimall.lowEndMode'

export const device = reactive({
  low: false,
  autoLow: false,
  manual: null,
  cores: 0,
  memory: 0,
  dpr: 1,
  saveData: false,
  reducedMotion: false,
  reason: '',
})

function readManual() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    if (raw === 'on') return true
    if (raw === 'off') return false
    return null
  } catch {

    return null
  }
}

function writeManual(v) {
  try {
    if (v === null) localStorage.removeItem(STORE_KEY)
    else localStorage.setItem(STORE_KEY, v ? 'on' : 'off')
  } catch {

  }
}

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

  device.manual = readManual()
  device.low = device.manual === null ? device.autoLow : device.manual
}

export function applyDeviceClass() {
  const root = document.documentElement
  root.classList.toggle('low-end', device.low)

  root.dataset.deviceTier = device.low ? 'low' : 'high'
}

export function setLowEndMode(value) {
  device.manual = value
  device.low = value
  writeManual(value)
  applyDeviceClass()
}

export function resetLowEndMode() {
  device.manual = null
  device.low = device.autoLow
  writeManual(null)
  applyDeviceClass()
}

export function initDeviceTier() {
  detectDeviceTier()
  applyDeviceClass()
}
