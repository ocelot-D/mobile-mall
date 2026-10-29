<template>
  <!--
    底部 Tab 栏

    两个移动端必踩的坑都在这里处理了：
      1. position: fixed 的元素在 iOS 上会被地址栏收起/展开挤动，
         所以高度写死、并且不给它加 transform 动画
      2. iPhone X 以后底部有一条横杠（Home Indicator），
         不垫安全区的话最后一条内容和横杠会叠在一起，点都点不到
  -->
  <nav class="tabbar" :class="{ 'is-hidden': hidden }">
    <router-link
      v-for="item in tabs"
      :key="item.path"
      :to="item.path"
      class="tab-item tap"
      :class="{ active: isActive(item.path) }"
    >
      <span class="tab-icon">
        <!-- 图标用内联 SVG：不用字体图标（少一个依赖、少一次请求），
             也不用 emoji（不同系统长得不一样，Android 上很廉价） -->
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none"
             stroke="currentColor" stroke-width="1.8"
             stroke-linecap="round" stroke-linejoin="round">
          <path :d="item.icon" />
        </svg>

        <!-- 购物车角标：数量超过 99 显示 99+，不然三位数会把图标挤歪 -->
        <span v-if="item.badge > 0" class="badge">{{ item.badge > 99 ? '99+' : item.badge }}</span>
      </span>
      <span class="tab-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
// ============================================================================
// 底部导航
//
// 点击区说明：每个 tab 的实际高度是 50px（--tab-h），
// 远大于 44px 的最低要求，手指点不会错。
// ============================================================================

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useCartStore } from '../stores/cart'

defineProps({
  // 详情页等全屏页面可以传 true 把 Tab 栏藏起来
  hidden: { type: Boolean, default: false },
})

const route = useRoute()
const cart = useCartStore()

// 图标路径（24×24 网格里画的线性图标）
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

/**
 * 是否高亮。
 * 用 startsWith 是为了让 /product/xxx 这类子页面也能保持对应 tab 的高亮感，
 * 不过本项目详情页不显示 tab 栏，所以这里主要是给 /order 之类的兜底。
 */
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

  /*
    底部安全区填充：env(safe-area-inset-bottom) 在有横杠的 iPhone 上是 34px，
    其他机器是 0。用 padding 而不是 margin，是因为 padding 属于盒子内部，
    会被 background 填满，不会出现"横杠后面一条透明缝"。
    少了这一行，iPhone 上最后一个 tab 会和底部横条叠在一起，点都点不准。
  */
  padding-bottom: var(--safe-bottom);

  /* 毛玻璃：桌面端/高端机上好看，低端机被 .low-end 关掉（见 style.css） */
  backdrop-filter: var(--blur);
  -webkit-backdrop-filter: var(--blur);
}

/* 桌面预览时 Tab 栏也要跟着 480px 的手机框走，不能横跨整屏 */
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
  /* tab 栏不做缩放动画：手指连点时缩放会让它看起来在抖 */
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
  /* 角标盖在图标上，给它加个白描边，跟图标分得开 */
  box-shadow: 0 0 0 0.015rem #fff;
}

/* 隐藏时向下移出去，而不是 display:none —— 后者没法做过渡 */
.is-hidden {
  transform: translateY(110%);
}
</style>
