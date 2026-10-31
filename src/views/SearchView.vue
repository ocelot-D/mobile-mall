<template>
  <div class="page search-page">
    <div class="top-bar">
      <button class="back tap tap-44" @click="router.back()">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>

      <SearchBar
        ref="bar"
        v-model="keyword"
        placeholder="搜索商品名、分类"
        :sticky="false"
        @search="onSearch"
      />

      <button class="search-btn tap tap-44" @click="onSearch(keyword)">搜索</button>
    </div>

    <div v-if="!keyword" class="discover">
      <section v-if="history.length" class="block">
        <div class="block-head">
          <h3>历史搜索</h3>
          <button class="clear-history tap" @click="clearHistory">清空</button>
        </div>
        <div class="chips">
          <button v-for="h in history" :key="h" class="chip tap" @click="useWord(h)">{{ h }}</button>
        </div>
      </section>

      <section class="block">
        <div class="block-head"><h3>热门搜索</h3></div>
        <div class="chips">
          <button v-for="h in HOT" :key="h" class="chip tap" @click="useWord(h)">{{ h }}</button>
        </div>
      </section>
    </div>

    <div v-else class="result">
      <PullRefresh
        :refreshing="loading"
        :has-more="hasMore"
        :loading-more="loadingMore"
        :show-footer="state === 'ok'"
        @refresh="reload"
        @load-more="loadMore"
      >
        <p class="result-count">
          “{{ lastKeyword }}” 找到 {{ total }} 件商品
        </p>

        <StateView
          :state="state"
          :error="error"
          empty-title="没有找到相关商品"
          empty-desc="换个词试试，比如「耳机」「咖啡」"
          @retry="reload"
        >
          <Waterfall :items="items" />
        </StateView>
      </PullRefresh>
    </div>
  </div>
</template>

<script setup>

import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

import SearchBar from '../components/SearchBar.vue'
import PullRefresh from '../components/PullRefresh.vue'
import StateView from '../components/StateView.vue'
import Waterfall from '../components/Waterfall.vue'

import { useProductList } from '../composables/useProductList'

const router = useRouter()
const bar = ref(null)

const HOT = ['耳机', '咖啡', '羽绒服', '跑鞋', '精华水', '瑜伽垫', '坚果', '充电器']

const HISTORY_KEY = 'mobile-mall.searchHistory'

const keyword = ref('')
const lastKeyword = ref('')
const history = ref([])

const {
  items, total, hasMore, loading, loadingMore, error, state, query,
  reload, loadMore, setQuery,
} = useProductList({ keyword: '' }, 8)

function onSearch(word) {
  const w = (word ?? keyword.value).trim()
  lastKeyword.value = w

  if (!w) {

    setQuery({ keyword: '' })
    items.value = []
    return
  }

  setQuery({ keyword: w })
  reload()
  saveHistory(w)
}

function useWord(w) {
  keyword.value = w
  onSearch(w)
}

function saveHistory(w) {

  const next = [w, ...history.value.filter((x) => x !== w)].slice(0, 10)
  history.value = next
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {

  }
}

function clearHistory() {
  history.value = []
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch {

  }
}

onMounted(() => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    history.value = raw ? JSON.parse(raw) : []
  } catch {
    history.value = []
  }

  nextTick(() => {
    bar.value?.focus()
  })
})
</script>

<style scoped>
.search-page {
  background: var(--bg);
  min-height: 100vh;
  min-height: 100dvh;
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 0.04rem;
  padding: 0.06rem 0.06rem;
  padding-top: calc(0.06rem + var(--safe-top));
  background: linear-gradient(180deg, var(--brand) 0%, #ff7a33 100%);
}

.back {
  color: #fff;
  flex-shrink: 0;
}

.search-page :deep(.search-bar) {
  flex: 1;
  min-width: 0;
  padding: 0;
  background: none;
}

.search-btn {
  flex-shrink: 0;
  color: #fff;
  font-size: 0.13rem;
  padding: 0 0.06rem;
}

.discover {
  padding: 0.14rem 0.12rem;
}

.block {
  margin-bottom: 0.2rem;
}

.block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.1rem;
}

.block-head h3 {
  font-size: 0.14rem;
  font-weight: 600;
}

.clear-history {
  font-size: 0.12rem;
  color: var(--ink-3);
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.08rem;
}

.chip {
  padding: 0.05rem 0.12rem;
  border-radius: 0.14rem;
  background: #fff;
  font-size: 0.12rem;
  color: var(--ink-2);
}

.result-count {
  padding: 0.12rem 0.12rem 0.04rem;
  font-size: 0.12rem;
  color: var(--ink-3);
}
</style>
