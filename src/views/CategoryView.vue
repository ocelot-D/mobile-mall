<template>
  <div class="page category-page has-tabbar">
    <SearchBar readonly sticky placeholder="搜索商品" @focus="goSearch" />

    <div class="body">
      <!--
        左侧分类栏。
        sticky + max-height + overflow-y 的组合：
        右边商品滚动时左边跟着滚，滚到顶就钉住，不会跟着一起跑没影。
      -->
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

      <!-- 右侧商品列表 -->
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
// ============================================================================
// 分类页
//
// 形态跟首页刻意做得不一样：左栏分类 + 右栏商品（主流电商的标准分类页）。
// 面试官问"几个页面有什么区别"时，这里能说明不是同一个骨架换皮。
//
// 注意：切分类时右侧列表要回到顶部并重新拉第一页，
// 否则会出现"切了分类但看到的是上一个分类的第 3 页"这种错误。
// ============================================================================

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

// 初始分类从路由参数里取（首页点九宫格跳过来会带 ?c=digital）
const {
  items, total, hasMore, loading, loadingMore, error, state, query,
  reload, setQuery,
} = useProductList({ category: route.query.c || 'all' }, 8)

function pick(id) {
  if (query.category === id) return
  setQuery({ category: id })
  reload()
  // 切分类后回到顶部，不然还停在原来的滚动位置
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

// 从首页带 ?c=xxx 再跳一次（比如连点两个分类）时，跟着更新
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
  /* 分类页整体不滚动，滚动交给左右两栏自己管 */
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
  /* 自己滚：分类多了不至于把页面撑很长 */
  max-height: calc(100vh - 1rem);
  max-height: calc(100dvh - 1rem);
  overflow-y: auto;
  background: #f0f0f3;
  position: sticky;
  top: 0;
  /* 惯性滚动：手机上滑起来有"甩"的手感，不加这个会显得很生硬 */
  -webkit-overflow-scrolling: touch;
}

.rail-item {
  display: block;
  width: 100%;
  /* 高度做到 44px 以上，手指点不错 */
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
  /* 选中项左边一根竖条，跟首页分区标题的装饰呼应 */
  box-shadow: inset 0.03rem 0 0 var(--brand);
}

.panel {
  flex: 1;
  min-width: 0;
  background: var(--bg);
}
</style>
