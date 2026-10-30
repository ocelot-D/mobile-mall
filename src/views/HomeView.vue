<template>
  <div class="page home has-tabbar">

    <SearchBar readonly sticky placeholder="搜索商品" @focus="goSearch" />

    <PullRefresh
      :refreshing="loading"
      :has-more="hasMore"
      :loading-more="loadingMore"
      :show-footer="state === 'ok'"
      @refresh="reload"
      @load-more="loadMore"
    >

      <BannerSwiper v-if="banners.length" :list="banners" class="animated-bg" />

      <CategoryGrid :categories="categories" @select="onPickCategory" />

      <div class="section-bar">
        <h2 class="section-title">为你推荐</h2>
        <div class="sorts">
          <button
            v-for="s in SORTS"
            :key="s.key"
            class="sort-btn tap"
            :class="{ active: query.sort === s.key }"
            @click="onSort(s.key)"
          >{{ s.label }}</button>
        </div>
      </div>

      <StateView :state="state" :error="error" @retry="reload">
        <Waterfall :items="items" />
      </StateView>
    </PullRefresh>

    <BackTop />
  </div>
</template>

<script setup>

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import SearchBar from '../components/SearchBar.vue'
import BannerSwiper from '../components/BannerSwiper.vue'
import CategoryGrid from '../components/CategoryGrid.vue'
import PullRefresh from '../components/PullRefresh.vue'
import StateView from '../components/StateView.vue'
import Waterfall from '../components/Waterfall.vue'
import BackTop from '../components/BackTop.vue'

import { useProductList } from '../composables/useProductList'
import { getBanners, getCategories } from '../utils/request'

const router = useRouter()

const SORTS = [
  { key: 'default', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'price-asc', label: '价格↑' },
  { key: 'price-desc', label: '价格↓' },
]

const {
  items, hasMore, loading, loadingMore, error, state, query,
  reload, loadMore, setQuery,
} = useProductList({ category: 'all' }, 8)

const banners = ref([])
const categories = ref([])

async function loadMeta() {
  try {
    const [b, c] = await Promise.all([getBanners(), getCategories()])
    banners.value = b
    categories.value = c
  } catch {

    banners.value = []
    categories.value = []
  }
}

function goSearch() {
  router.push('/search')
}

function onPickCategory(cat) {
  router.push({ path: '/category', query: { c: cat.id } })
}

function onSort(key) {
  if (query.sort === key) return
  setQuery({ sort: key })
  reload()
}

onMounted(() => {
  reload()
  loadMeta()
})
</script>

<style scoped>
.home {
  background: var(--bg);
}

.section-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.16rem 0.12rem 0.08rem;
}

.section-title {
  font-size: 0.16rem;
  font-weight: 700;
  position: relative;
  padding-left: 0.1rem;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 0.03rem;
  height: 0.14rem;
  border-radius: 0.02rem;
  background: var(--brand);
}

.sorts {
  display: flex;
  gap: 0.06rem;
}

.sort-btn {
  padding: 0.03rem 0.1rem;
  border-radius: 0.12rem;
  font-size: 0.12rem;
  color: var(--ink-2);
  background: #fff;
}

.sort-btn.active {
  color: #fff;
  background: var(--brand);
}
</style>
