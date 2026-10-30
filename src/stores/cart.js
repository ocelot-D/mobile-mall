import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORE_KEY = 'mobimall.cart'

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORE_KEY)
    const arr = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export const useCartStore = defineStore('cart', () => {

  const items = ref(loadFromStorage())

  watch(items, (val) => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(val))
    } catch {

    }
  }, { deep: true })

  const totalCount = computed(() => items.value.reduce((sum, it) => sum + it.count, 0))

  const checkedItems = computed(() => items.value.filter((it) => it.checked))

  const checkedAmount = computed(() =>
    Math.round(checkedItems.value.reduce((sum, it) => sum + it.unitPrice * it.count, 0) * 100) / 100
  )

  const allChecked = computed(() =>
    items.value.length > 0 && items.value.every((it) => it.checked)
  )

  function add(product, spec = { text: '', delta: 0 }, count = 1) {
    const key = `${product.id}__${spec.text || ''}`
    const exist = items.value.find((it) => it.key === key)

    if (exist) {

      exist.count = Math.min(exist.count + count, product.stock)
      exist.checked = true
      return exist
    }

    items.value.unshift({
      key,
      id: product.id,
      title: product.title,
      cover: product.cover,
      specText: spec.text || '',

      unitPrice: Math.round((product.price + (spec.delta || 0)) * 100) / 100,

      specDelta: spec.delta || 0,
      count: Math.min(count, product.stock),
      checked: true,
      stock: product.stock,
    })
    return items.value[0]
  }

  function setCount(key, n) {
    const it = items.value.find((x) => x.key === key)
    if (!it) return
    if (n < 1) return remove(key)
    it.count = Math.min(n, it.stock)
  }

  function remove(key) {
    const idx = items.value.findIndex((x) => x.key === key)
    if (idx > -1) items.value.splice(idx, 1)
  }

  function toggleChecked(key) {
    const it = items.value.find((x) => x.key === key)
    if (it) it.checked = !it.checked
  }

  function toggleAll(checked) {
    items.value.forEach((it) => { it.checked = checked })
  }

  function clear() {
    items.value = []
  }

  function removeChecked() {
    items.value = items.value.filter((it) => !it.checked)
  }

  return {
    items, totalCount, checkedItems, checkedAmount, allChecked,
    add, setCount, remove, toggleChecked, toggleAll, clear, removeChecked,
  }
})
