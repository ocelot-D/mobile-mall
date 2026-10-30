<template>
  <div class="page category-page has-tabbar">
    <SearchBar readonly sticky placeholder="搜索商品" @focus="goSearch" />

    <div class="body">

      <aside class="rail no-scrollbar">
        <button
          class="rail-item tap"
          :class="{ active: query.category === 'all' }"
          @click="pick('all')"
        >全部</button>
        <button
          v-for="c in categories"
          :key="c.id"
          class="rail-item tap"
          :class="{ active: query.category === c.id }"
          @click="pick(c.id)"
        >{{ c.name }}</button>
      </aside>

      <div class="panel">
        <PullRefresh
          :refreshing="loading"
          :has-more="hasMore"
          :loading-more="loadingMore"
          :show-footer="state === 'ok'"
          @refresh="reload"
          @load-more="loadMore"
        >
          <StateView
            :state="state"
            :error="error"
            empty-title="这个分类暂时没有商品"
            empty-desc="换个分类看看"
            @retry="reload"
          >
            <Waterfall :items="items" />
          </StateView>
        </PullRefresh>
      </div>
    </div>
  </div>
</template>

<script setup>

import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import SearchBar from '../components/SearchBar.vue'
import PullRefresh from '../components/PullRefresh.vue'
import StateView from '../components/StateView.vue'
import Waterfall from '../components/Waterfall.vue'

import { useProductList } from '../composables/useProductList'
import { getCategories } from '../utils/request'

const router = useRouter()
const route = useRoute()

const categories = ref([])

const {
  items, total, hasMore, loading, loadingMore, error, state, query,
  reload, loadMore, setQuery,
} = useProductList({ category: route.query.c || 'all' }, 8)

function pick(id) {
  if (query.category === id) return
  setQuery({ category: id })
  reload()

  window.scrollTo({ top: 0 })
}

function goSearch() {
  router.push('/search')
}

onMounted(async () => {
  reload()
  try {
    categories.value = await getCategories()
  } catch {
    categories.value = []
  }
})

watch(() => route.query.c, (v) => {
  if (v && v !== query.category) {
    setQuery({ category: v })
    reload()
  }
})
</script>

<style scoped>
.category-page {
  background: var(--bg);

  display: flex;
  flex-direction: column;
}

.body {
  display: flex;
  flex: 1;
  align-items: flex-start;
  min-height: 0;
}

.rail {
  flex: 0 0 0.88rem;

  max-height: calc(100vh - 1rem);
  max-height: calc(100dvh - 1rem);
  overflow-y: auto;
  background: #f0f0f3;
  position: sticky;
  top: 0;

  -webkit-overflow-scrolling: touch;
}

.rail-item {
  display: block;
  width: 100%;

  min-height: var(--tap);
  padding: 0 0.06rem;
  font-size: 0.13rem;
  color: var(--ink-2);
  text-align: center;
  line-height: var(--tap);
}

.rail-item.active {
  background: var(--card);
  color: var(--brand);
  font-weight: 600;

  box-shadow: inset 0.03rem 0 0 var(--brand);
}

.panel {
  flex: 1;
  min-width: 0;
  background: var(--bg);
}
</style>
