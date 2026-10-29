<template>
  <div class="page product-page">
    <!-- 顶部悬浮按钮：返回 + 购物车。浮在图片上，所以要自己处理安全区 -->
    <div class="float-top">
      <button class="round-btn tap tap-44" @click="back">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <button class="round-btn tap tap-44" @click="router.push('/cart')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6M9 20h.01M18 20h.01" />
        </svg>
        <span v-if="cart.totalCount > 0" class="round-badge">{{ cart.totalCount > 99 ? '99+' : cart.totalCount }}</span>
      </button>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="loading-block">
      <div class="skeleton skeleton-hero"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
    </div>

    <!-- 加载失败 -->
    <div v-else-if="error" class="state-block">
      <div class="state-icon">📶</div>
      <p class="state-title">商品加载失败</p>
      <p class="state-desc">{{ error }}</p>
      <button class="retry tap tap-44" @click="load">重新加载</button>
    </div>

    <!-- 正常内容 -->
    <template v-else-if="product">
      <!-- 图片轮播：复用首页那个组件，把商品图数组映射成它要的格式 -->
      <BannerSwiper
        v-if="product.images?.length"
        :list="product.images.map((src, i) => ({ id: `${product.id}-${i}`, img: src }))"
        :interval="5000"
        class="hero-swiper"
      />

      <!-- 价格区 -->
      <section class="price-box">
        <div class="price-row">
          <span class="price"><span class="symbol">¥</span>{{ currentPrice }}</span>
          <span class="origin">¥{{ product.originPrice }}</span>
          <span v-for="t in product.tags" :key="t" class="tag">{{ t }}</span>
        </div>
        <h1 class="title">{{ product.title }}</h1>
        <p class="subtitle">{{ product.subtitle }}</p>
        <div class="meta">
          <span>已售 {{ formatSales(product.sales) }}</span>
          <span>评分 {{ product.rating }}</span>
          <span>库存 {{ product.stock }} 件</span>
        </div>
      </section>

      <!-- 规格选择 -->
      <section class="spec-box">
        <div v-for="(group, gi) in product.specs" :key="group.name" class="spec-group">
          <h3 class="spec-title">{{ group.name }}</h3>
          <div class="spec-values">
            <button
              v-for="v in group.values"
              :key="v.label"
              class="spec-btn tap"
              :class="{ active: selected[gi] === v.label }"
              @click="selectSpec(gi, v)"
            >
              {{ v.label }}
              <!-- 加价直接在按钮上标出来，用户不用猜 -->
              <em v-if="v.delta" class="delta">+{{ v.delta }}</em>
            </button>
          </div>
        </div>

        <div class="count-row">
          <span class="spec-title">数量</span>
          <div class="stepper">
            <button class="step tap tap-44" :disabled="count <= 1" @click="count -= 1">−</button>
            <span class="count-num">{{ count }}</span>
            <button class="step tap tap-44" :disabled="count >= product.stock" @click="count += 1">+</button>
          </div>
        </div>
      </section>

      <!-- 参数 -->
      <section class="param-box">
        <h3 class="spec-title">商品参数</h3>
        <div v-for="p in product.params" :key="p.k" class="param-row">
          <span class="param-k">{{ p.k }}</span>
          <span class="param-v">{{ p.v }}</span>
        </div>
      </section>

      <!-- 详情描述 -->
      <section class="desc-box">
        <h3 class="spec-title">商品详情</h3>
        <p class="desc">{{ product.desc }}</p>
        <div class="desc-imgs">
          <LazyImg
            v-for="(src, i) in product.images"
            :key="src"
            :src="`/${src}`"
            :ratio="product.ratio"
            :c1="product.c1"
            :c2="product.c2"
          />
        </div>
      </section>

      <!-- 底部留白，避免被操作栏挡住 -->
      <div class="bottom-space"></div>
    </template>

    <!--
      底部操作栏。
      padding-bottom 加安全区：不加的话 iPhone 上"加入购物车"按钮
      会正好压在底部横条下面，点一次要费半天劲。
    -->
    <div v-if="product" class="action-bar">
      <button class="icon-col tap" @click="router.push('/cart')">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
             stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6M9 20h.01M18 20h.01" />
        </svg>
        <span>购物车</span>
      </button>

      <button class="btn-cart tap" @click="addToCart">加入购物车</button>
      <button class="btn-buy tap" @click="buyNow">立即购买</button>
    </div>
  </div>
</template>

<script setup>
// ============================================================================
// 商品详情页
//
// 验收点（规划里 D20 那条）：
//   ✅ 规格切换，价格跟着变
//   ✅ 加入购物车，Tab 角标数量跟着涨
//   ✅ 底部操作栏避开 iPhone 底部横条
//
// 价格怎么算：
//   最终价 = 商品基础价 + 各规格的加价（delta）之和。
//   加价存在商品数据的 specs[].values[].delta 里（可能是负数，比如台式款更便宜）。
//   这个 delta 也会一起存进购物车，下单时后端会用它重算一遍单价。
// ============================================================================

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BannerSwiper from '../components/BannerSwiper.vue'
import LazyImg from '../components/LazyImg.vue'
import { getProduct } from '../utils/request'
import { formatSales } from '../utils/format'
import { useCartStore } from '../stores/cart'
import { toastOk, toastWarn } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const product = ref(null)
const loading = ref(true)
const error = ref('')

// 每一组规格选中的是第几项（用 label 存，方便展示"曜石黑 / 256G"）
const selected = ref([])
const count = ref(1)

/** 当前选中的规格加价之和 */
const specDelta = computed(() => {
  if (!product.value) return 0
  return product.value.specs.reduce((sum, group, gi) => {
    const label = selected.value[gi]
    const v = group.values.find((x) => x.label === label)
    return sum + (v?.delta || 0)
  }, 0)
})

/** 规格切换后价格要跟着变（这是详情页最容易被问到的点） */
const currentPrice = computed(() => {
  if (!product.value) return 0
  return Math.round((product.value.price + specDelta.value) * 100) / 100
})

/** 规格文字，如 "曜石黑 / 降噪版" */
const specText = computed(() => selected.value.filter(Boolean).join(' / '))

function selectSpec(gi, v) {
  selected.value[gi] = v.label
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const data = await getProduct(route.params.id)
    product.value = data
    // 默认选中每组第一项，避免进来时"什么都没选"的尴尬状态
    selected.value = data.specs.map((g) => g.values[0].label)
    count.value = 1
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function addToCart() {
  if (!product.value) return
  cart.add(product.value, { text: specText.value, delta: specDelta.value }, count.value)
  toastOk(`已加入购物车 · ${count.value} 件`)
}

function buyNow() {
  if (!product.value) return
  // 立即购买 = 先加进购物车并勾选，再跳结算页
  cart.add(product.value, { text: specText.value, delta: specDelta.value }, count.value)
  router.push('/order')
}

function back() {
  // 有历史就后退，没有（比如直接粘链接进来的）就回首页
  if (window.history.length > 1) router.back()
  else router.push('/')
}

onMounted(load)
</script>

<style scoped>
.product-page {
  background: var(--bg);
  padding-bottom: calc(0.56rem + var(--safe-bottom));
}

/* ─── 顶部悬浮按钮 ───────────────────────────────────────────────────────── */
.float-top {
  position: fixed;
  top: calc(0.1rem + var(--safe-top));
  left: 0;
  right: 0;
  z-index: 30;
  display: flex;
  justify-content: space-between;
  padding: 0 0.12rem;
  pointer-events: none;
}

@media (min-width: 600px) {
  .float-top {
    left: 50%;
    right: auto;
    width: 480px;
    transform: translateX(-50%);
  }
}

.round-btn {
  position: relative;
  pointer-events: auto;
  width: 0.32rem;
  height: 0.32rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.9);
  color: var(--ink);
  display: flex;
  align-items: center;
  justify-content: center;
}

.round-badge {
  position: absolute;
  top: -0.03rem;
  right: -0.03rem;
  min-width: 0.15rem;
  height: 0.15rem;
  padding: 0 0.03rem;
  border-radius: 0.08rem;
  background: var(--brand);
  color: #fff;
  font-size: 0.09rem;
  line-height: 0.15rem;
  text-align: center;
}

/* ─── 轮播 ───────────────────────────────────────────────────────────────── */
.hero-swiper {
  margin: 0;
  border-radius: 0;
  /* 详情页大图比例更方一点，跟列表页的卡片区分开 */
  aspect-ratio: 1 / 1;
}

/* ─── 信息区 ─────────────────────────────────────────────────────────────── */
.price-box {
  padding: 0.14rem 0.14rem 0.12rem;
  background: var(--card);
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 0.06rem;
  flex-wrap: wrap;
}

.price {
  color: var(--brand);
  font-weight: 800;
  font-size: clamp(20px, 6vw, 28px);
  font-variant-numeric: tabular-nums;
}

.symbol {
  font-size: 0.14rem;
  font-weight: 600;
}

.origin {
  font-size: 0.12rem;
  color: var(--ink-3);
  text-decoration: line-through;
}

.tag {
  padding: 0.01rem 0.05rem;
  border-radius: 0.03rem;
  background: var(--brand-soft);
  color: var(--brand);
  font-size: 0.1rem;
}

.title {
  margin-top: 0.08rem;
  font-size: 0.16rem;
  font-weight: 600;
  line-height: 1.4;
}

.subtitle {
  margin-top: 0.04rem;
  font-size: 0.12rem;
  color: var(--ink-3);
}

.meta {
  display: flex;
  gap: 0.16rem;
  margin-top: 0.08rem;
  font-size: 0.11rem;
  color: var(--ink-3);
}

/* ─── 规格 ───────────────────────────────────────────────────────────────── */
.spec-box,
.param-box,
.desc-box {
  margin-top: 0.1rem;
  padding: 0.14rem;
  background: var(--card);
}

.spec-group {
  margin-bottom: 0.14rem;
}

.spec-title {
  font-size: 0.13rem;
  font-weight: 600;
  margin-bottom: 0.08rem;
}

.spec-values {
  display: flex;
  flex-wrap: wrap;
  gap: 0.08rem;
}

.spec-btn {
  /* 最小 44px 高：规格按钮是最容易点错的地方，热区必须够大 */
  min-height: 0.32rem;
  padding: 0 0.14rem;
  border-radius: 0.06rem;
  border: 1px solid var(--line);
  background: #fafafa;
  font-size: 0.13rem;
  color: var(--ink-2);
}

.spec-btn.active {
  border-color: var(--brand);
  background: var(--brand-soft);
  color: var(--brand);
  font-weight: 600;
}

.delta {
  font-style: normal;
  font-size: 0.1rem;
  opacity: 0.8;
}

.count-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 0.02rem;
}

.step {
  width: 0.32rem;
  height: 0.32rem;
  border-radius: 0.06rem;
  background: #f5f5f7;
  font-size: 0.16rem;
  color: var(--ink);
}

/* 到边界时按钮置灰，明确告诉用户"不能更少/更多了" */
.step:disabled {
  color: var(--ink-3);
  opacity: 0.5;
}

.count-num {
  min-width: 0.4rem;
  text-align: center;
  font-size: 0.14rem;
  font-variant-numeric: tabular-nums;
}

/* ─── 参数 / 详情 ────────────────────────────────────────────────────────── */
.param-row {
  display: flex;
  padding: 0.07rem 0;
  border-bottom: 1px solid var(--line);
  font-size: 0.12rem;
}

.param-k {
  width: 0.8rem;
  flex-shrink: 0;
  color: var(--ink-3);
}

.param-v {
  color: var(--ink-2);
}

.desc {
  font-size: 0.13rem;
  color: var(--ink-2);
  line-height: 1.7;
}

.desc-imgs {
  margin-top: 0.1rem;
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.bottom-space {
  height: 0.1rem;
}

/* ─── 底部操作栏 ─────────────────────────────────────────────────────────── */
.action-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 0.08rem;
  padding: 0.08rem 0.12rem;
  /* ★ 安全区 ★：这一行保证按钮不被 iPhone 底部横条压住 */
  padding-bottom: calc(0.08rem + var(--safe-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid var(--line);
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
}

@media (min-width: 600px) {
  .action-bar {
    left: 50%;
    right: auto;
    width: 480px;
    transform: translateX(-50%);
  }
}

.icon-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.01rem;
  color: var(--ink-2);
  font-size: 0.1rem;
  padding: 0 0.04rem;
}

.btn-cart,
.btn-buy {
  flex: 1;
  height: 0.4rem;
  border-radius: 0.2rem;
  font-size: 0.14rem;
  font-weight: 600;
  color: #fff;
}

.btn-cart {
  background: linear-gradient(90deg, #ff8a3d, var(--brand));
}

.btn-buy {
  background: linear-gradient(90deg, var(--brand), var(--brand-dark));
}

/* ─── 加载 / 错误 ────────────────────────────────────────────────────────── */
.loading-block {
  padding: 0.14rem;
}

.skeleton-hero {
  aspect-ratio: 1 / 1;
  border-radius: var(--r);
}

.skeleton-text {
  height: 0.18rem;
  margin-top: 0.12rem;
  border-radius: 0.04rem;
}

.skeleton-text.short {
  width: 60%;
}

.state-block {
  padding: 0.8rem 0.3rem;
  text-align: center;
}

.state-icon {
  font-size: 0.44rem;
  margin-bottom: 0.12rem;
}

.state-title {
  font-size: 0.15rem;
  font-weight: 600;
  margin-bottom: 0.06rem;
}

.state-desc {
  font-size: 0.13rem;
  color: var(--ink-3);
  margin-bottom: 0.16rem;
  word-break: break-word;
}

.retry {
  padding: 0 0.24rem;
  border-radius: 0.22rem;
  background: var(--brand);
  color: #fff;
  font-size: 0.14rem;
  font-weight: 600;
}
</style>
