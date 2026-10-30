import { ref } from 'vue'

let deferredPrompt = null

export const canInstall = ref(false)

export const isStandalone = ref(false)

export const isIOS = ref(false)

export function initPwaInstall() {

  isStandalone.value =
    window.matchMedia('(display-mode: standalone)').matches ||

    window.navigator.standalone === true

  isIOS.value =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    canInstall.value = true
  })

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    canInstall.value = false
    isStandalone.value = true
  })
}

export async function promptInstall() {
  if (!deferredPrompt) return 'unavailable'

  deferredPrompt.prompt()

  const { outcome } = await deferredPrompt.userChoice

  deferredPrompt = null
  canInstall.value = false

  return outcome === 'accepted' ? 'accepted' : 'dismissed'
}
