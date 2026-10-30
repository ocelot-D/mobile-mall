import { reactive } from 'vue'

export const toasts = reactive([])

let seed = 0

export function toast(message, type = 'info', duration = 1800) {
  seed += 1
  const id = seed
  toasts.push({ id, message, type })

  setTimeout(() => {
    const idx = toasts.findIndex((t) => t.id === id)
    if (idx > -1) toasts.splice(idx, 1)
  }, duration)
}

export const toastOk = (msg) => toast(msg, 'ok')
export const toastWarn = (msg) => toast(msg, 'warn')
