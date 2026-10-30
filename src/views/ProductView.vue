<template>
  <div class="page product-page">

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

    <div v-if="loading" class="loading-block">
      <div class="skeleton skeleton-hero"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text short"></div>
    </div>

    <div v-else-if="error" class="state-block">
      <div class="state-icon">📶</div>
      <p class="state-title">商品加载失败</p>
      <p class="state-desc">{{ error }}</p>
      <button class="retry tap tap-44" @click="load">重新加载</button>
    </div>

    <template v-else-if="product">

      <BannerSwiper
        v-if="product.images?.length"
        :list="product.images.map((src, i) => ({ id: `${product.id}-${i}`, img: src }))"
        :interval="5000"
        class="hero-swiper"
      />

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

      <section class="param-box">
        <h3 class="spec-title">商品参数</h3>
        <div v-for="p in product.params" :key="p.k" class="param-row">
          <span class="param-k">{{ p.k }}</span>
          <span class="param-v">{{ p.v }}</span>
        </div>
      </section>

      <section class="desc-box">
        <h3 class="spec-title">商品详情</h3>
        <p class="desc">{{ product.desc }}</p>
        <div class="desc-imgs">
          <LazyImg
            v-for="(src, i) in product.images"
            :key="src"
            :src="imgSrc(src)"
            :ratio="product.ratio"
            :c1="product.c1"
            :c2="product.c2"
          />
        </div>
      </section>

      <div class="bottom-space"></div>
    </template>

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

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import BannerSwiper from '../components/BannerSwiper.vue'
import LazyImg from '../components/LazyImg.vue'
import { getProduct } from '../utils/request'
import { formatSales, imgSrc } from '../utils/format'
import { useCartStore } from '../stores/cart'
import { toastOk, toastWarn } from '../composables/useToast'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const product = ref(null)
const loading = ref(true)
const error = ref('')

const selected = ref([])
const count = ref(1)

const specDelta = computed(() => {
  if (!product.value) return 0
  return product.value.specs.reduce((sum, group, gi) => {
    const label = selected.value[gi]
    const v = group.values.find((x) => x.label === label)
    return sum + (v?.delta || 0)
  }, 0)
})

const currentPrice = computed(() => {
  if (!product.value) return 0
  return Math.round((product.value.price + specDelta.value) * 100) / 100
})

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

  cart.add(product.value, { text: specText.value, delta: specDelta.value }, count.value)
  router.push('/order')
}

function back() {

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

.hero-swiper {
  margin: 0;
  border-radius: 0;

  aspect-ratio: 1 / 1;
}

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
