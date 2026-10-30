<template>
  <div class="page cart-page">
    <header class="head">
      <h1>购物车</h1>
      <span v-if="cart.items.length" class="count">共 {{ cart.items.length }} 种商品</span>
    </header>

    <div v-if="!cart.items.length" class="empty">
      <div class="empty-icon">🛒</div>
      <p class="empty-title">购物车还是空的</p>
      <p class="empty-desc">去挑几件喜欢的吧</p>
      <router-link to="/" class="go-btn tap tap-44">去逛逛</router-link>
    </div>

    <template v-else>
      <ul class="list">
        <li v-for="it in cart.items" :key="it.key" class="item">

          <button
            class="check tap tap-44"
            :class="{ on: it.checked }"
            :aria-label="it.checked ? '取消选中' : '选中'"
            @click="cart.toggleChecked(it.key)"
          >
            <svg v-if="it.checked" viewBox="0 0 24 24" width="14" height="14" fill="none"
                 stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </button>

          <router-link :to="`/product/${it.id}`" class="thumb">
            <img :src="imgSrc(it.cover)" :alt="it.title" />
          </router-link>

          <div class="info">
            <router-link :to="`/product/${it.id}`" class="name clamp-2">{{ it.title }}</router-link>
            <span v-if="it.specText" class="spec">{{ it.specText }}</span>
            <div class="row">
              <span class="price">¥{{ it.unitPrice }}</span>
              <div class="stepper">
                <button class="step tap tap-44" @click="cart.setCount(it.key, it.count - 1)">−</button>
                <span class="num">{{ it.count }}</span>
                <button
                  class="step tap tap-44"
                  :disabled="it.count >= it.stock"
                  @click="cart.setCount(it.key, it.count + 1)"
                >+</button>
              </div>
            </div>

            <span v-if="it.count >= it.stock" class="stock-tip">已达库存上限</span>
          </div>

          <button class="del tap tap-44 tap-expand" @click="onRemove(it)">
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </li>
      </ul>

      <div class="checkout-bar">
        <button class="check-all tap tap-44" @click="cart.toggleAll(!cart.allChecked)">
          <span class="check" :class="{ on: cart.allChecked }">
            <svg v-if="cart.allChecked" viewBox="0 0 24 24" width="14" height="14" fill="none"
                 stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 13l4 4L19 7" />
            </svg>
          </span>
          全选
        </button>

        <div class="sum">
          <span class="sum-label">合计</span>
          <span class="sum-price">¥{{ cart.checkedAmount }}</span>
        </div>

        <button
          class="submit tap"
          :class="{ disabled: !cart.checkedItems.length }"
          @click="goOrder"
        >
          去结算{{ cart.checkedItems.length ? `(${cart.checkedItems.length})` : '' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>

import { useRouter } from 'vue-router'
import { useCartStore } from '../stores/cart'
import { imgSrc } from '../utils/format'
import { toast } from '../composables/useToast'

const router = useRouter()
const cart = useCartStore()

function onRemove(it) {
  cart.remove(it.key)
  toast(`已移除「${it.title}」`)
}

function goOrder() {
  if (!cart.checkedItems.length) {
    toast('先勾选要结算的商品', 'warn')
    return
  }
  router.push('/order')
}
</script>

<style scoped>
.cart-page {
  background: var(--bg);

  padding-bottom: calc(1.06rem + var(--safe-bottom));
}

.head {
  display: flex;
  align-items: baseline;
  gap: 0.08rem;
  padding: 0.14rem 0.14rem 0.1rem;
}

.head h1 {
  font-size: 0.18rem;
  font-weight: 700;
}

.count {
  font-size: 0.11rem;
  color: var(--ink-3);
}

.empty {
  padding: 0.9rem 0.3rem;
  text-align: center;
}

.empty-icon {
  font-size: 0.6rem;
  opacity: 0.8;
}

.empty-title {
  margin-top: 0.12rem;
  font-size: 0.15rem;
  font-weight: 600;
}

.empty-desc {
  margin-top: 0.05rem;
  font-size: 0.12rem;
  color: var(--ink-3);
}

.go-btn {
  display: inline-block;
  margin-top: 0.2rem;
  padding: 0 0.28rem;
  border-radius: 0.22rem;
  background: var(--brand);
  color: #fff;
  font-size: 0.14rem;
  font-weight: 600;
  line-height: 0.4rem;
}

.list {
  padding: 0 0.1rem;
}

.item {
  display: flex;
  align-items: center;
  gap: 0.06rem;
  padding: 0.1rem;
  margin-bottom: 0.08rem;
  background: var(--card);
  border-radius: var(--r);
}

.check {
  width: 0.18rem;
  height: 0.18rem;
  flex-shrink: 0;
  border-radius: 50%;
  border: 1px solid #cfcfd6;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.check.on {
  background: var(--brand);
  border-color: var(--brand);
}

.thumb {
  width: 0.72rem;
  height: 0.72rem;
  flex-shrink: 0;
  border-radius: 0.08rem;
  overflow: hidden;
  background: #f0f0f3;
}

.thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.info {
  flex: 1;
  min-width: 0;
}

.name {
  display: block;
  font-size: 0.13rem;
  line-height: 1.35;
  color: var(--ink);
  text-decoration: none;
}

.spec {
  display: inline-block;
  margin-top: 0.03rem;
  padding: 0.01rem 0.05rem;
  border-radius: 0.03rem;
  background: #f5f5f7;
  font-size: 0.1rem;
  color: var(--ink-3);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 0.06rem;
}

.price {
  color: var(--brand);
  font-weight: 700;
  font-size: 0.14rem;
}

.stepper {
  display: flex;
  align-items: center;
  gap: 0.02rem;
}

.step {
  width: 0.26rem;
  height: 0.26rem;
  border-radius: 0.04rem;
  background: #f5f5f7;
  font-size: 0.14rem;
}

.step:disabled {
  opacity: 0.45;
}

.num {
  min-width: 0.28rem;
  text-align: center;
  font-size: 0.13rem;
  font-variant-numeric: tabular-nums;
}

.stock-tip {
  display: block;
  margin-top: 0.03rem;
  font-size: 0.1rem;
  color: var(--brand);
}

.del {
  position: relative;
  color: var(--ink-3);
  flex-shrink: 0;
}

.checkout-bar {
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
  bottom: calc(var(--tab-h) + var(--safe-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid var(--line);
}

@media (min-width: 600px) {
  .checkout-bar {
    left: 50%;
    right: auto;
    width: 480px;
    transform: translateX(-50%);
  }
}

.check-all {
  display: flex;
  align-items: center;
  gap: 0.05rem;
  font-size: 0.12rem;
  color: var(--ink-2);
}

.sum {
  flex: 1;
  text-align: right;
}

.sum-label {
  font-size: 0.11rem;
  color: var(--ink-3);
}

.sum-price {
  margin-left: 0.04rem;
  color: var(--brand);
  font-weight: 800;
  font-size: 0.16rem;
  font-variant-numeric: tabular-nums;
}

.submit {
  height: 0.4rem;
  padding: 0 0.2rem;
  border-radius: 0.2rem;
  background: linear-gradient(90deg, var(--brand), var(--brand-dark));
  color: #fff;
  font-size: 0.14rem;
  font-weight: 600;
}

.submit.disabled {
  background: #cfcfd6;
}
</style>
