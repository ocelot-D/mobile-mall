<template>
  <div class="card-wrap tap" @click="go">

    <LazyImg
      :src="imgSrc(product.cover)"
      :ratio="product.ratio"
      :alt="product.title"
      :c1="product.c1"
      :c2="product.c2"
      class="card-img"
    />

    <span v-if="product.tags && product.tags[0]" class="tag">{{ product.tags[0] }}</span>

    <div class="card-body">
      <h3 class="title clamp-2">{{ product.title }}</h3>
      <p class="subtitle ellipsis">{{ product.subtitle }}</p>

      <div class="price-row">
        <span class="price">
          <span class="symbol">¥</span>{{ product.price }}
        </span>
        <span v-if="product.originPrice > product.price" class="origin">¥{{ product.originPrice }}</span>
      </div>

      <div class="meta-row">
        <span class="sales">已售 {{ formatSales(product.sales) }}</span>
        <span class="rating">{{ product.rating }} 分</span>
      </div>
    </div>
  </div>
</template>

<script setup>

import { useRouter } from 'vue-router'
import LazyImg from './LazyImg.vue'
import { formatSales, imgSrc } from '../utils/format'

const props = defineProps({
  product: { type: Object, required: true },
})

const router = useRouter()

const base = '/'

function go() {
  router.push(`/product/${props.product.id}`)
}
</script>

<style scoped>
.card-wrap {
  position: relative;
  background: var(--card);
  border-radius: var(--r);
  overflow: hidden;
  box-shadow: 0 0.01rem 0.05rem rgba(0, 0, 0, 0.04);
}

.card-img {
  width: 100%;
}

.tag {
  position: absolute;
  top: 0.06rem;
  left: 0.06rem;
  padding: 0.02rem 0.06rem;
  border-radius: 0.04rem;
  background: rgba(255, 80, 0, 0.92);
  color: #fff;
  font-size: 0.1rem;
}

.card-body {
  padding: 0.08rem 0.09rem 0.1rem;
}

.title {
  font-size: 0.13rem;
  font-weight: 500;
  line-height: 1.35;
  color: var(--ink);

  min-height: 0.35rem;
}

.subtitle {
  margin-top: 0.03rem;
  font-size: 0.11rem;
  color: var(--ink-3);
}

.price-row {
  display: flex;
  align-items: baseline;
  gap: 0.05rem;
  margin-top: 0.06rem;
}

.price {
  color: var(--brand);
  font-weight: 700;

  font-size: clamp(15px, 4.2vw, 19px);
  font-variant-numeric: tabular-nums;
}

.symbol {
  font-size: 0.11rem;
  margin-right: 0.01rem;
}

.origin {
  font-size: 0.11rem;
  color: var(--ink-3);
  text-decoration: line-through;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  margin-top: 0.05rem;
  font-size: 0.1rem;
  color: var(--ink-3);
}

.rating {
  color: var(--brand);
}
</style>
