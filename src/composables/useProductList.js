// ============================================================================
// 商品列表状态机（首页 / 分类页 / 搜索页共用）
//
// 为什么抽成 composable？
//   三个页面都要做同一件事：分页拉数据、下拉刷新、上拉加载、四态展示。
//   不抽的话，同样的 60 行逻辑要复制三遍，改一处要改三个地方。
//
// 它管的就是移动端列表最常见的四个状态：
//   加载中 loading  → 第一次进页面 / 下拉刷新
//   空     empty    → 请求成功但一条都没有（比如搜了个不存在的词）
//   错误   error    → 请求失败（断网、后端没起）
//   正常   ok       → 有数据
//
// 面试点：很多人只做"有数据"和"加载中"两种，断网时页面就白着。
//        四态齐全 = 你考虑过真实用户会遇到什么。
// ============================================================================

import { ref, reactive, computed } from 'vue'
import { getProducts } from '../utils/request'
import { throttle } from '../utils/throttle'

/**
 * @param {object} defaultQuery 默认查询条件（分类页会传 category）
 * @param {number} pageSize     每页条数，手机上一次 8 条比较合适（约两屏）
 */
export function useProductList(defaultQuery = {}, pageSize = 8) {
  const items = ref([])
  const total = ref(0)
  const page = ref(1)
  const hasMore = ref(true)

  // 两个 loading 必须分开：
  //   loading     控制顶部"正在刷新"和首次加载的骨架屏
  //   loadingMore 控制底部"加载中…"
  // 合成一个的话，上拉加载时顶部也会转圈，用户会以为被刷新了
  const loading = ref(false)
  const loadingMore = ref(false)

  const error = ref('')
  const loaded = ref(false)

  // 查询条件：改它不会自动重新请求，要手动调 reload()，
  // 这样"改分类 + 改排序"可以合并成一次请求，不发多余的
  const query = reactive({
    keyword: '',
    category: 'all',
    sort: 'default',
    ...defaultQuery,
  })

  /**
   * 当前该显示哪个状态。
   * 用 computed 而不是在模板里写一长串 v-if，模板会干净很多。
   */
  const state = computed(() => {
    if (error.value && items.value.length === 0) return 'error'
    if (!loaded.value || (loading.value && items.value.length === 0)) return 'loading'
    if (items.value.length === 0) return 'empty'
    return 'ok'
  })

  /** 拉第 n 页 */
  async function fetchPage(p) {
    return getProducts({ ...query, page: p, pageSize })
  }

  /**
   * 重新加载（首次进入、下拉刷新、换了筛选条件都调它）
   */
  async function reload() {
    // 正在加载中就忽略重复触发：手指快速连拉两次会发两个请求，
    // 回来顺序还可能是乱的，导致列表数据错乱
    if (loading.value) return

    page.value = 1
    loading.value = true
    error.value = ''
    try {
      const data = await fetchPage(1)
      items.value = data.list
      total.value = data.total
      hasMore.value = data.hasMore
      loaded.value = true
    } catch (e) {
      // 失败时保留页面上原有的数据，不要清空 —— 用户还能看到上一次的内容，
      // 比白屏友好得多。只有原本就没数据的时候才显示错误页。
      error.value = e.message
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  /**
   * 上拉加载更多：追加到列表尾部，页码 +1
   */
  async function loadMore() {
    // 三重保险，缺一个都会出问题：
    //   1. 正在首次加载 → 等它完
    //   2. 正在加载更多 → 防重复（滚动事件一秒能触发几十次）
    //   3. 没有更多了   → 到底了就别再请求了
    if (loading.value || loadingMore.value || !hasMore.value) return

    loadingMore.value = true
    try {
      const data = await fetchPage(page.value + 1)
      // 用 push 追加而不是替换，保证已经看到的内容位置不变
      items.value.push(...data.list)
      page.value += 1
      hasMore.value = data.hasMore
      total.value = data.total
      error.value = ''
    } catch (e) {
      // 加载更多失败只提示，不清空已有列表
      error.value = e.message
    } finally {
      loadingMore.value = false
    }
  }

  // 滚动到底的检测必须节流，否则一秒几十次计算会拖慢滚动
  const loadMoreThrottled = throttle(loadMore, 300)

  /**
   * 在滚动容器里判断是否到底了
   * @param {number} threshold 距底部多少像素就提前加载（提前一屏，用户感觉不到等待）
   */
  function checkReachBottom(threshold = 300) {
    // 页面用的是 window 滚动，所以直接读 document 的三个值
    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const viewportH = window.innerHeight
    const totalH = document.documentElement.scrollHeight
    if (scrollTop + viewportH >= totalH - threshold) {
      loadMoreThrottled()
    }
  }

  /** 改查询条件（不会自动请求，要自己调 reload） */
  function setQuery(patch) {
    Object.assign(query, patch)
  }

  return {
    items, total, page, hasMore, loading, loadingMore, error, query,
    state, reload, loadMore, checkReachBottom, setQuery,
  }
}
