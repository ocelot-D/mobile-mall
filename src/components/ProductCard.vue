<template>
  <div class="card-wrap tap" @click="go">
    <!--
      图片区：ratio 是商品数据里的高宽比。
      把它传给 LazyImg，图片没加载完坑位就占好了 —— 这是 CLS（布局抖动）为 0 的关键。
    -->
    <LazyImg
      :src="base + product.cover"
      :ratio="product.ratio"
      :alt="product.title"
      :c1="product.c1"
      :c2="product.c2"
      class="card-img"
    />

    <!-- 左上角标签：包邮、新品这类 -->
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
// ============================================================================
// 商品卡片（瀑布流里的每一格）
// ============================================================================

import { useRouter } from 'vue-router'
import LazyImg from './LazyImg.vue'
import { formatSales } from '../utils/format'

const props = defineProps({
  product: { type: Object, required: true },
})

const router = useRouter()

// 图片路径前缀。开发环境 Vite 直接托管 public/，生产环境由 Node 后端托管，
// 两边都是根路径下的 img/，所以直接用相对路径 '/' 开头即可。
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
  /* 固定两行高度：标题长短不一也不会让卡片高度参差不齐 */
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
  /* clamp 流式字号：小屏不小于 15px，大屏不超过 19px，中间随屏幕宽线性变化。
     配合 rem 基准双保险，任何机型下价格这个最重要的信息都清晰可读 */
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
