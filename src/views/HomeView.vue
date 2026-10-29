<template>
  <div class="page home has-tabbar">
    <!--
      吸顶搜索栏：放在 PullRefresh 外面，下拉刷新时它不动，
      只有下面的内容跟着手指走。这样下拉的手感才对。
    -->
    <SearchBar readonly sticky placeholder="搜索商品" @focus="goSearch" />

    <PullRefresh
      :refreshing="loading"
      :has-more="hasMore"
      :loading-more="loadingMore"
      :show-footer="state === 'ok'"
      @refresh="reload"
      @load-more="loadMore"
    >
      <!-- 轮播：拿到数据才渲染，没拿到就不占位（避免一个灰色空块） -->
      <BannerSwiper v-if="banners.length" :list="banners" class="animated-bg" />

      <!-- 分类入口九宫格 -->
      <CategoryGrid :categories="categories" @select="onPickCategory" />

      <!-- 分区标题 + 排序 -->
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

      <!-- 四态：加载中 / 空 / 错误 / 正常 -->
      <StateView :state="state" :error="error" @retry="reload">
        <Waterfall :items="items" />
      </StateView>
    </PullRefresh>
  </div>
</template>

<script setup>
// ============================================================================
// 首页
//
// 结构：吸顶搜索 → 轮播 → 分类九宫格 → 排序 → 商品瀑布流
// 数据：商品列表走 useProductList（分页 / 下拉刷新 / 上拉加载 / 四态都在里面），
//       轮播和分类是独立的小请求，失败也不影响主流程，所以单独处理。
// ============================================================================

import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import SearchBar from '../components/SearchBar.vue'
import BannerSwiper from '../components/BannerSwiper.vue'
import CategoryGrid from '../components/CategoryGrid.vue'
import PullRefresh from '../components/PullRefresh.vue'
import StateView from '../components/StateView.vue'
import Waterfall from '../components/Waterfall.vue'

import { useProductList } from '../composables/useProductList'
import { getBanners, getCategories } from '../utils/request'

const router = useRouter()

// 排序选项
const SORTS = [
  { key: 'default', label: '综合' },
  { key: 'sales', label: '销量' },
  { key: 'price-asc', label: '价格↑' },
  { key: 'price-desc', label: '价格↓' },
]

// 商品列表状态机（首页、分类页、搜索页共用同一套）
const {
  items, hasMore, loading, loadingMore, error, state, query,
  reload, loadMore, setQuery,
} = useProductList({ category: 'all' }, 8)

const banners = ref([])
const categories = ref([])

/** 轮播和分类：失败也不弹错，顶多少两块内容，不能因为附属数据让整页变错误态 */
async function loadMeta() {
  try {
    const [b, c] = await Promise.all([getBanners(), getCategories()])
    banners.value = b
    categories.value = c
  } catch {
    // 静默失败：主流程（商品列表）不受影响
    banners.value = []
    categories.value = []
  }
}

function goSearch() {
  router.push('/search')
}

/** 点分类九宫格：跳到分类页并选中该分类 */
function onPickCategory(cat) {
  router.push({ path: '/category', query: { c: cat.id } })
}

/** 切排序：改条件后重新拉第一页 */
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

/* 分区标题栏 */
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

/* 标题左边那根竖条：纯装饰，让分区感更强 */
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
