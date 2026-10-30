<template>

  <nav class="tabbar" :class="{ 'is-hidden': hidden }">
    <router-link
      v-for="item in tabs"
      :key="item.path"
      :to="item.path"
      class="tab-item tap"
      :class="{ active: isActive(item.path) }"
    >
      <span class="tab-icon">

        <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
             stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round">
          <path :d="item.icon" />
        </svg>

        <span v-if="item.badge > 0" class="badge">{{ item.badge > 99 ? '99+' : item.badge }}</span>
      </span>
      <span class="tab-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../stores/cart'

defineProps({

  hidden: { type: Boolean, default: false },
})

const route = useRoute()
const cart = useCartStore()

const ICONS = {
  home: 'M3 10.5 12 3l9 7.5V21h-6v-6h-6v6H3z',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  cart: 'M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 2-1.6L21 7H6M9 20h.01M18 20h.01',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8',
}

const tabs = computed(() => [
  { path: '/', label: '首页', icon: ICONS.home, badge: 0 },
  { path: '/category', label: '分类', icon: ICONS.grid, badge: 0 },
  { path: '/cart', label: '购物车', icon: ICONS.cart, badge: cart.totalCount },
  { path: '/mine', label: '我的', icon: ICONS.user, badge: 0 },
])

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  background: rgba(255, 255, 255, 0.94);
  border-top: 1px solid var(--line);

  padding-bottom: var(--safe-bottom);

  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
}

@media (min-width: 600px) {
  .tabbar {
    left: 50%;
    right: auto;
    width: 480px;
    transform: translateX(-50%);
  }
}

.tab-item {
  flex: 1;
  height: var(--tab-h);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.03rem;
  color: var(--ink-3);
  text-decoration: none;

  transition: color 0.15s ease;
}

.tab-item:active {
  transform: none;
  opacity: 1;
  background: rgba(0, 0, 0, 0.03);
}

.tab-item.active {
  color: var(--brand);
}

.tab-icon {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 0.24rem;
  height: 0.24rem;
}

.tab-label {
  font-size: 0.1rem;
  line-height: 1;
}

.badge {
  position: absolute;
  top: -0.04rem;
  left: 0.16rem;
  min-width: 0.16rem;
  height: 0.16rem;
  padding: 0 0.04rem;
  border-radius: 0.08rem;
  background: var(--brand);
  color: #fff;
  font-size: 0.1rem;
  line-height: 0.16rem;
  text-align: center;

  box-shadow: 0 0 0 0.015rem #fff;
}

.is-hidden {
  transform: translateY(110%);
}
</style>
