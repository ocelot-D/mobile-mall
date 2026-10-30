<template>
  <!--
    外层容器。整个内容区会被 transform 往下拽，露出上面的刷新提示条。

    为什么用 transform 而不是改 margin-top / top？
      transform 走 GPU 合成层，不触发重排（reflow），手指拖动时每一帧都很顺。
      改 top / margin 会让浏览器每一帧重新计算布局，中低端机上拖起来一卡一卡的。
      这是移动端手势动画的第一原则：只动 transform 和 opacity。
  -->
  <div
    ref="wrap"
    class="pull-refresh"
    :style="wrapStyle"
    :class="{ 'is-dragging': dragging }"
  >
    <!--
      刷新提示条：高度和负 margin 都等于当前下拉距离。
      这样它永远正好填满"内容往下让出来的那条缝"，
      不会出现"提示条把内容又往下推了一遍"的错位。
      （这正是手写下拉刷新最容易写错的地方：高度和位移要互相抵消。）
    -->
    <div
      class="indicator"
      :style="{ height: `${distance}px`, marginTop: `${-distance}px` }"
    >
      <span class="indicator-icon" :class="{ spin: status === 'refreshing' }">
        {{ status === 'refreshing' ? '' : (status === 'ready' ? '↑' : '↓') }}
      </span>
      <span class="indicator-text">{{ indicatorText }}</span>
    </div>

    <!-- 真正的内容 -->
    <div class="content">
      <slot />

      <!--
        上拉加载的状态条。放在内容底部，三种状态：
          还能加载 → 显示"上拉加载更多"
          正在加载 → 转圈 + "正在加载…"
          到底了   → "没有更多了"
      -->
      <div v-if="showFooter" class="load-more">
        <template v-if="loadingMore">
          <span class="spinner"></span>
          <span>正在加载…</span>
        </template>
        <template v-else-if="!hasMore">
          <span class="divider"></span>
          <span>没有更多了</span>
          <span class="divider"></span>
        </template>
        <template v-else>
          <span>上拉加载更多</span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
// ============================================================================
// 下拉刷新 + 上拉加载更多（手写，不装库）
//
// 面试被问"下拉刷新怎么实现的"，讲这四句就够了：
//   1. touchstart 记录起点，并且只在页面处于顶部（scrollY ≤ 0）时才开始记账
//   2. touchmove 里算手指位移，乘一个阻尼系数（0.45）让手感不会太"滑"，
//      同时用节流把计算压到一帧一次
//   3. 拖过阈值（60px）就把状态从"下拉可以刷新"切成"松手立即刷新"
//   4. touchend 时看状态：达到阈值就 emit('refresh') 并展开成刷新中高度，
//      没达到就弹回原位
//
// 为什么必须自己写？
//   现成的库（better-scroll 之类）会接管整个滚动，页面里就不能用原生滚动了，
//   吸顶、锚点、无障碍全都要重新适配。自己写只接管"顶部下拉"这一个手势，
//   其余滚动还是浏览器的，兼容性最好。
// ============================================================================

import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { throttle } from '../utils/throttle'

const props = defineProps({
  // 父组件是否正在刷新（用来决定什么时候收起提示条）
  refreshing: { type: Boolean, default: false },
  // 是否还有下一页
  hasMore: { type: Boolean, default: true },
  // 是否正在加载下一页
  loadingMore: { type: Boolean, default: false },
  // 是否显示底部加载条（没有数据的时候不显示）
  showFooter: { type: Boolean, default: true },
  // 触发刷新的下拉阈值（物理像素）
  threshold: { type: Number, default: 60 },
})

const emit = defineEmits(['refresh', 'load-more'])

// ─── 状态 ────────────────────────────────────────────────────────────────────
// status 的四种取值对应三种文案（刷新中共用一个转圈图标）：
//   idle       没在拖
//   pulling    正在拖，但还没到阈值
//   ready      拖过阈值了，松手就会刷新
//   refreshing 松手了，正在请求
const status = ref('idle')

// 手指拖出来的位移（已加阻尼），单位物理像素
const distance = ref(0)

// 手指是否还按在屏幕上。拖动中要关掉 transition，否则跟手会有延迟
const dragging = ref(false)

// 内部记录：本次触摸的起点 Y 坐标、是否允许下拉
let startY = 0
let canPull = false

const wrap = ref(null)

// ─── 计算属性 ────────────────────────────────────────────────────────────────
const wrapStyle = computed(() => ({
  // 拖动中不要过渡（要跟手），松手后才用过渡弹回
  transition: dragging.value ? 'none' : 'transform 0.28s cubic-bezier(0.25, 0.8, 0.5, 1)',
  transform: `translate3d(0, ${distance.value}px, 0)`,
  // translate3d 而不是 translateY：强制开启 GPU 合成层，安卓上更不容易掉帧
}))

const indicatorText = computed(() => {
  if (status.value === 'refreshing') return '正在刷新…'
  if (status.value === 'ready') return '松手立即刷新'
  return '下拉可以刷新'
})

// ─── 触摸事件 ────────────────────────────────────────────────────────────────
function onTouchStart(e) {
  // 只有页面在最顶部时才允许下拉。
  // 不加这个判断，用户在列表中间往下滑也会触发刷新，非常难受。
  canPull = (window.scrollY || document.documentElement.scrollTop || 0) <= 0
  if (!canPull) return

  startY = e.touches[0].clientY
  dragging.value = true
  status.value = 'idle'
}

// 真正耗性能的是"算位移 + 改样式"，节流它。
// 节流到 16ms（约一帧一次）之后，计算量降到原来的六分之一，肉眼无感知延迟。
const computeDistance = throttle((e) => {
  if (!canPull || !dragging.value) return

  const dy = e.touches[0].clientY - startY

  // 手指往上滑（dy < 0）说明用户想看列表，不是想刷新，直接放行给原生滚动
  if (dy <= 0) {
    distance.value = 0
    status.value = 'idle'
    return
  }

  // 阻尼系数 0.45：手指移动 100px，内容只下移 45px。
  // 没有阻尼的话手感像在拉一根松紧带，很廉价；有阻尼才有"拉弹簧"的质感。
  const pulled = Math.min(dy * 0.45, 120)

  distance.value = pulled
  status.value = pulled >= props.threshold ? 'ready' : 'pulling'
}, 16)

/**
 * touchmove 的原始处理函数（不做节流）
 *
 * 为什么 preventDefault 必须写在节流外面？
 *   节流会把一部分 touchmove 事件丢掉。如果 preventDefault 跟着一起被丢掉，
 *   那些没被拦住的事件就会触发安卓 Chrome 自带的下拉刷新（顶部转圈那个），
 *   我们的自定义手势直接失效 —— 这是手写下拉刷新最隐蔽的一个坑。
 *   所以：判断和拦截同步做，耗性能的计算才交给节流。
 */
function onTouchMove(e) {
  if (!canPull || !dragging.value) return

  const dy = e.touches[0].clientY - startY

  // 关键：阻止默认行为。要生效必须在 addEventListener 里传 { passive: false }
  if (dy > 0 && e.cancelable) e.preventDefault()

  computeDistance(e)
}

function onTouchEnd() {
  if (!canPull || !dragging.value) return
  dragging.value = false

  if (status.value === 'ready') {
    // 达到阈值：进入刷新态，提示条保持在 50px 展开高度，通知父组件去请求
    status.value = 'refreshing'
    distance.value = 50
    emit('refresh')
  } else {
    // 没达到阈值：弹回原位
    distance.value = 0
    status.value = 'idle'
  }

  canPull = false
}

// ─── 滚动到底检测（上拉加载更多）────────────────────────────────────────────
const onScroll = throttle(() => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const viewportH = window.innerHeight
  const totalH = document.documentElement.scrollHeight

  // 距底部还有一屏半（300px）就开始加载下一页。
  // 提前加载的好处：用户滑到底时新数据已经在了，感觉不到等待。
  if (scrollTop + viewportH >= totalH - 300) {
    emit('load-more')
  }
}, 200)

// ─── 监听父组件的刷新状态 ────────────────────────────────────────────────────
// 父组件请求完成后 refreshing 会变回 false，这时候收起提示条
watch(() => props.refreshing, (val) => {
  if (val) {
    status.value = 'refreshing'
    distance.value = 50
  } else if (status.value === 'refreshing') {
    // 稍微延迟一点收起，让用户看清"刷新完成"这个反馈，
    // 立刻收起会让人怀疑到底刷没刷
    setTimeout(() => {
      distance.value = 0
      status.value = 'idle'
    }, 200)
  }
})

onMounted(() => {
  const el = wrap.value
  // passive: false 是这里的命门：
  // 现代浏览器默认把 touchmove 当成 passive（不会 preventDefault），
  // 不显式关掉的话下面那句 e.preventDefault() 会被忽略，安卓上就会触发原生下拉刷新。
  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchmove', onTouchMove, { passive: false })
  el.addEventListener('touchend', onTouchEnd, { passive: true })
  el.addEventListener('touchcancel', onTouchEnd, { passive: true })

  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  // 组件销毁必须解绑，否则 window 上的 scroll 监听会一直留着，
  // 切页面后还在偷偷触发已销毁组件的 emit（典型的内存泄漏）
  const el = wrap.value
  if (el) {
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
    el.removeEventListener('touchend', onTouchEnd)
    el.removeEventListener('touchcancel', onTouchEnd)
  }
  window.removeEventListener('scroll', onScroll)
  // 节流的"尾沿补执行"定时器也要取消：
  // 不然组件销毁后定时器到点还会 emit('load-more')，对着空气发请求
  onScroll.cancel()
  computeDistance.cancel()
})
</script>

<style scoped>
.pull-refresh {
  /* will-change 提前告诉浏览器这个元素会变，让它先准备好合成层 */
  will-change: transform;
}

.indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.06rem;
  overflow: hidden;
  color: var(--ink-3);
  font-size: 0.13rem;
}

.indicator-icon {
  display: inline-block;
  transition: transform 0.2s ease;
  font-size: 0.14rem;
}

/* 刷新中：图标转圈 */
.indicator-icon.spin {
  width: 0.14rem;
  height: 0.14rem;
  border: 0.02rem solid var(--line);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.08rem;
  padding: 0.16rem 0;
  color: var(--ink-3);
  font-size: 0.12rem;
}

.spinner {
  display: inline-block;
  width: 0.13rem;
  height: 0.13rem;
  border: 0.02rem solid var(--line);
  border-top-color: var(--brand);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.divider {
  width: 0.4rem;
  height: 1px;
  background: var(--line);
}
</style>
