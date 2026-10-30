// ============================================================================
// 购物车状态（Pinia）
//
// 为什么购物车要用 Pinia 而不是放在组件里？
//   商品详情页要加购、购物车页要改数量、底部 Tab 要显示角标、
//   下单页要读选中项 —— 四个页面隔着两级路由传参，
//   用 props / emit 传会疯掉。全局 store 就是为这种跨页共享数据准备的。
//
// 为什么还要落 localStorage？
//   H5 刷新页面 store 就清空了，用户加了一堆东西一刷新全没了，体验非常差。
//   手机上"被系统回收后重新打开"是常态，必须持久化。
//
// 为什么不用 sessionStorage？
//   sessionStorage 关掉标签页就没了，localStorage 才是"下次来还在"。
//   购物车显然应该是后者。
// ============================================================================

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

const STORE_KEY = 'mobimall.cart'

/** 从 localStorage 恢复，解析失败就当空车（避免一条脏数据把整个页面搞崩） */
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
  // ─── 状态 ──────────────────────────────────────────────────────────────
  // 每一条的结构：
  //   { key, id, title, cover, specText, specDelta, unitPrice, count, checked, stock }
  // key = id + 规格，同一商品不同规格算两条（就像真实商城那样）
  const items = ref(loadFromStorage())

  // ─── 持久化：数据一变就写回 localStorage ───────────────────────────────
  // deep: true 是因为会改到数组里对象的 count / checked 字段
  watch(items, (val) => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(val))
    } catch {
      /* 隐私模式写不了就算了，不影响本次使用 */
    }
  }, { deep: true })

  // ─── 派生数据 ──────────────────────────────────────────────────────────
  /** 角标数量：所有商品的数量总和（不是种类数） */
  const totalCount = computed(() => items.value.reduce((sum, it) => sum + it.count, 0))

  /** 已勾选的商品 */
  const checkedItems = computed(() => items.value.filter((it) => it.checked))

  /** 已勾选商品的总金额（不含运费） */
  const checkedAmount = computed(() =>
    Math.round(checkedItems.value.reduce((sum, it) => sum + it.unitPrice * it.count, 0) * 100) / 100
  )

  /** 是否全选（空车时算没全选） */
  const allChecked = computed(() =>
    items.value.length > 0 && items.value.every((it) => it.checked)
  )

  // ─── 行为 ──────────────────────────────────────────────────────────────
  /**
   * 加入购物车
   * @param {object} product  商品对象（详情页拿到的完整商品）
   * @param {object} spec     { text: '曜石黑 / 256G', delta: 300 }
   * @param {number} count    数量
   */
  function add(product, spec = { text: '', delta: 0 }, count = 1) {
    const key = `${product.id}__${spec.text || ''}`
    const exist = items.value.find((it) => it.key === key)

    if (exist) {
      // 已经加过同规格的，只增加数量，并且不能超过库存
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
      // 规格加价直接算进单价，前端展示用它
      unitPrice: Math.round((product.price + (spec.delta || 0)) * 100) / 100,
      // 加价本身也要存一份：下单时要传给后端，
      // 后端用"基础价 + 加价"重算单价，避免前端传价被篡改
      specDelta: spec.delta || 0,
      count: Math.min(count, product.stock),
      checked: true,
      stock: product.stock,
    })
    return items.value[0]
  }

  /** 改数量，n 小于 1 时直接删掉这条（商城的常规交互） */
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

  /** 勾选/取消勾选 */
  function toggleChecked(key) {
    const it = items.value.find((x) => x.key === key)
    if (it) it.checked = !it.checked
  }

  /** 全选 / 取消全选 */
  function toggleAll(checked) {
    items.value.forEach((it) => { it.checked = checked })
  }

  /** 清空购物车 */
  function clear() {
    items.value = []
  }

  /** 下单成功后把已下单的那些删掉（保留没勾选的） */
  function removeChecked() {
    items.value = items.value.filter((it) => !it.checked)
  }

  return {
    items, totalCount, checkedItems, checkedAmount, allChecked,
    add, setCount, remove, toggleChecked, toggleAll, clear, removeChecked,
  }
})
