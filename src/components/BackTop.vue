<template>
  <!--
    transition 做出现/消失动画：只用 opacity + transform（GPU 合成，不掉帧）。
    v-show 而不是 v-if：按钮反复出现消失，v-if 会不停创建销毁 DOM，反而更费。
  -->
  <transition name="backtop">
    <button
      v-show="visible"
      class="backtop tap tap-44"
      aria-label="回到顶部"
      @click="toTop"
    >
      <!-- 双箭头 + 一条横线，比单箭头更有"到顶"的指向感 -->
      <span class="arrows">↑↑</span>
      <span class="label">顶部</span>
    </button>
  </transition>
</template>

<script setup>
// ============================================================================
// 一键回到顶部（浮动按钮）
//
// 什么时候出现：页面往下滚过一屏半（约 600px）才出现。
//   刚进页面就挂一个浮按钮，既挡内容又没人点；
//   滚远了之后找它才有意义 —— 这是主流电商 App 的共同做法。
//
// 点击后回到顶部用 smooth 平滑滚动而不是瞬间跳顶：
//   瞬间跳顶会让用户失去"我在页面里的位置感"，平滑滚动能看到内容倒回去，
//   确认自己回到了列表开头。
//
// 无障碍：系统开了"减少动态效果"（prefers-reduced-motion）的用户
//   不做平滑滚动，直接回顶 —— 动画对他们是干扰不是帮助。
// ============================================================================

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { throttle } from '../utils/throttle'

const props = defineProps({
  // 滚过多远（px）后出现按钮。一屏半左右比较自然
  threshold: { type: Number, default: 600 },
})

// 是否显示按钮
const visible = ref(false)

// 滚动检测照例要节流（scroll 一秒上百次），16ms ≈ 一帧一次
const onScroll = throttle(() => {
  visible.value = (window.scrollY || document.documentElement.scrollTop || 0) > props.threshold
}, 100)

function toTop() {
  // 先问系统"要不要减少动效"，要的话就直接跳
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  // 组件挂载时先算一次初始状态（比如从详情页返回时页面保留着滚动位置）
  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  // 节流尾沿的定时器一并取消，防止销毁后还改 visible
  onScroll.cancel()
})
</script>

<style scoped>
/*
 * 定位的关键：right 用 max() 取两个值里大的那个。
 *   窄屏（手机）：50% - 240px 是负数，max 取 0.16rem → 贴右边 16px
 *   宽屏（电脑，内容限宽 480px 居中）：取 calc(50% - 240px + 0.16rem)
 *   → 按钮贴着内容区的右缘，不会漂到屏幕最右边去
 * 一行 CSS 同时兼容两种屏幕，不用写媒体查询。
 */
.backtop {
  position: fixed;
  right: max(0.16rem, calc(50% - 240px + 0.16rem));
  /* 底部要避开 Tab 栏 + iPhone 横条，再留点呼吸空间 */
  bottom: calc(var(--tab-h) + var(--safe-bottom) + 0.24rem);
  z-index: 60; /* 盖过 Tab 栏(50)，低于全局 Toast(999) */

  width: var(--tap);
  height: var(--tap);
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 0.02rem 0.12rem rgba(0, 0, 0, 0.18);
  border: 1px solid var(--line);

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1.1;
}

.arrows {
  font-size: 0.12rem;
  color: var(--brand);
  letter-spacing: -0.02rem;
}

.label {
  font-size: 0.09rem;
  color: var(--ink-2);
}

/* 出现/消失：淡入 + 从底部轻微上浮，消失反向。0.2s 短促不拖沓 */
.backtop-enter-active,
.backtop-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.backtop-enter-from,
.backtop-leave-to {
  opacity: 0;
  transform: translateY(0.1rem);
}
</style>
