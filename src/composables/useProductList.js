import { ref, reactive, computed } from 'vue'
import { getProducts } from '../utils/request'
import { throttle } from '../utils/throttle'

export function useProductList(defaultQuery = {}, pageSize = 8) {
  const items = ref([])
  const total = ref(0)
  const page = ref(1)
  const hasMore = ref(true)

  const loading = ref(false)
  const loadingMore = ref(false)

  const error = ref('')
  const loaded = ref(false)

  const query = reactive({
    keyword: '',
    category: 'all',
    sort: 'default',
    ...defaultQuery,
  })

  const state = computed(() => {
    if (error.value && items.value.length === 0) return 'error'
    if (!loaded.value || (loading.value && items.value.length === 0)) return 'loading'
    if (items.value.length === 0) return 'empty'
    return 'ok'
  })

  async function fetchPage(p) {
    return getProducts({ ...query, page: p, pageSize })
  }

  async function reload() {

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

      error.value = e.message
      loaded.value = true
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {

    if (loading.value || loadingMore.value || !hasMore.value) return

    loadingMore.value = true
    try {
      const data = await fetchPage(page.value + 1)

      items.value.push(...data.list)
      page.value += 1
      hasMore.value = data.hasMore
      total.value = data.total
      error.value = ''
    } catch (e) {

      error.value = e.message
    } finally {
      loadingMore.value = false
    }
  }

  const loadMoreThrottled = throttle(loadMore, 300)

  function checkReachBottom(threshold = 300) {

    const scrollTop = window.scrollY || document.documentElement.scrollTop
    const viewportH = window.innerHeight
    const totalH = document.documentElement.scrollHeight
    if (scrollTop + viewportH >= totalH - threshold) {
      loadMoreThrottled()
    }
  }

  function setQuery(patch) {
    Object.assign(query, patch)
  }

  return {
    items, total, page, hasMore, loading, loadingMore, error, query,
    state, reload, loadMore, checkReachBottom, setQuery,
  }
}
