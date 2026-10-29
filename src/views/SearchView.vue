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

    <!-- 没输入关键词时：展示历史和热门，引导用户 -->
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

    <!-- 输入了关键词：展示结果 -->
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
// ============================================================================
// 搜索页
//
// 核心是防抖：输入框每敲一个字都会触发 search 事件（SearchBar 里做了 300ms 防抖），
// 停手后才真的发请求。不防抖的话打"无线耳机"要发 4 次请求，
// 而且先发的可能后回来，结果顺序会乱掉。
//
// 另外两处细节：
//   1. 进页面自动聚焦弹出键盘 —— 用户点搜索框就是为了输入，别让他再点一次
//   2. 历史搜索存 localStorage —— 第二次来还在，这是移动端的基本礼貌
// ============================================================================

import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

import SearchBar from '../components/SearchBar.vue'
import PullRefresh from '../components/PullRefresh.vue'
import StateView from '../components/StateView.vue'
import Waterfall from '../components/Waterfall.vue'

import { useProductList } from '../composables/useProductList'

const router = useRouter()
const bar = ref(null)

// 热门搜索词：真实项目里由后端按搜索量下发，这里写死就够了
const HOT = ['耳机', '咖啡', '羽绒服', '跑鞋', '精华水', '瑜伽垫', '坚果', '充电器']

const HISTORY_KEY = 'mobimall.searchHistory'

const keyword = ref('')       // 输入框里的实时值（每敲一个字就变）
const lastKeyword = ref('')   // 真正拿去搜索的值（防抖后才更新）
const history = ref([])

const {
  items, total, hasMore, loading, loadingMore, error, state, query,
  reload, loadMore, setQuery,
} = useProductList({ keyword: '' }, 8)

/** 防抖之后真正触发的搜索 */
function onSearch(word) {
  const w = (word ?? keyword.value).trim()
  lastKeyword.value = w

  if (!w) {
    // 空词就不搜，清空结果回到发现页
    setQuery({ keyword: '' })
    items.value = []
    return
  }

  setQuery({ keyword: w })
  reload()
  saveHistory(w)
}

/** 点历史/热门词：填进输入框并立刻搜（不等防抖） */
function useWord(w) {
  keyword.value = w
  onSearch(w)
}

function saveHistory(w) {
  // 去重后放最前面，最多留 10 条
  const next = [w, ...history.value.filter((x) => x !== w)].slice(0, 10)
  history.value = next
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    /* 隐私模式写不了就算了 */
  }
}

function clearHistory() {
  history.value = []
  try {
    localStorage.removeItem(HISTORY_KEY)
  } catch {
    /* ignore */
  }
}

onMounted(() => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    history.value = raw ? JSON.parse(raw) : []
  } catch {
    history.value = []
  }

  // nextTick 等 DOM 渲染完再 focus，否则拿不到 input 元素
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

/* ─── 发现区 ─────────────────────────────────────────────────────────────── */
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

/* ─── 结果区 ─────────────────────────────────────────────────────────────── */
.result-count {
  padding: 0.12rem 0.12rem 0.04rem;
  font-size: 0.12rem;
  color: var(--ink-3);
}
</style>
