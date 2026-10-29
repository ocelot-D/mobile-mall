<template>
  <div class="app-shell">
    <!--
      router-view 用 v-slot 拿到当前组件，外面套一层 <transition> 做切换动画。

      为什么要区分两种动画？
        Tab 之间切换用淡入淡出（同级关系，不该有方向感）
        列表 → 详情这种"进下一层"用从右滑入（有层级感，符合手机直觉）
      这个细节很多人不做，但做对了用户立刻能感觉到"这是个 App 而不是网页"。
    -->
    <router-view v-slot="{ Component, route }">
      <transition :name="route.meta.tab ? 'fade' : 'slide'" mode="out-in">
        <!-- key 用完整路径，保证 /product/p001 → /product/p002 也会重新渲染 -->
        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>

    <!-- 底部 Tab 栏：只有四个主页面才显示，详情页、下单页是全屏的 -->
    <TabBar v-if="showTab" />

    <!--
      全局 Toast 层。
      放在最外层是因为加购、下单、校验失败这些提示可能发生在任何页面，
      层级给到 999 保证盖住一切（包括底部 Tab 栏）。
    -->
    <div class="toast-layer">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`toast-${t.type}`"
      >{{ t.message }}</div>
    </div>
  </div>
</template>

<script setup>
// ============================================================================
// 根组件
//
// 只负责三件事：渲染当前路由页面、决定要不要显示底部 Tab、承载全局 Toast。
// 业务逻辑一律不放在这里，否则会变成什么都往里塞的垃圾堆。
// ============================================================================

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from './components/TabBar.vue'
import { toasts } from './composables/useToast'

const route = useRoute()

// 路由 meta 里标了 tab: true 的才显示底部栏
const showTab = computed(() => route.meta.tab === true)
</script>

<style scoped>
.app-shell {
  position: relative;
  /* 内容区最小高度：100dvh 解决手机地址栏收起时 100vh 不更新的老问题 */
  min-height: 100vh;
  min-height: 100dvh;
  /* 刘海屏：顶部留出状态栏高度，不然内容会被信号栏盖住 */
  padding-top: var(--safe-top);
  background: var(--bg);
}

/* ─── Toast ─────────────────────────────────────────────────────────────── */
.toast-layer {
  position: fixed;
  left: 0;
  right: 0;
  /* 放在屏幕偏下的位置：拇指最容易看到的地方，又不挡内容 */
  bottom: 0.9rem;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.08rem;
  /* 关键：Toast 容器本身不能挡住点击，否则盖住的地方全都点不了 */
  pointer-events: none;
}

.toast {
  max-width: 3rem;
  padding: 0.1rem 0.18rem;
  border-radius: 0.2rem;
  background: rgba(0, 0, 0, 0.82);
  color: #fff;
  font-size: 0.13rem;
  line-height: 1.4;
  text-align: center;
  animation: toastIn 0.2s ease;
  /* 低端机上毛玻璃关了，这里也别硬上 */
  backdrop-filter: none;
}

.toast-ok {
  background: rgba(15, 110, 86, 0.92);
}

.toast-warn {
  background: rgba(163, 45, 45, 0.92);
}

@keyframes toastIn {
  from { opacity: 0; transform: translateY(0.1rem); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
