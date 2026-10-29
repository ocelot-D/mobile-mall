<template>
  <div class="swiper" ref="box">
    <!--
      轨道：把所有图横着排成一排，靠 translateX 移动。
      用 transform 而不是改 left：transform 走 GPU，滑动不掉帧。
    -->
    <div
      class="track"
      :style="trackStyle"
      @touchstart="onTouchStart"
      @touchmove="onTouchMove"
      @touchend="onTouchEnd"
    >
      <div
        v-for="(b, i) in list"
        :key="b.id"
        class="slide"
        @click="$emit('click-banner', b)"
      >
        <img :src="`/${b.img}`" :alt="b.title" class="slide-img" />
      </div>
    </div>

    <!-- 指示点：告诉用户一共有几张、当前在第几张 -->
    <div class="dots">
      <span
        v-for="(b, i) in list"
        :key="b.id"
        class="dot"
        :class="{ active: i === current }"
      ></span>
    </div>
  </div>
</template>

<script setup>
// ============================================================================
// 首页轮播（手写，不装 swiper 库）
//
// 为什么不装 swiper？
//   一个轮播组件动辄 40KB+，而自己写不到 80 行。
//   首屏能省 40KB 对移动端是很可观的（3G 下约节省 1 秒）。
//
// 实现三件事：
//   1. 自动播放：每 4 秒切下一张
//   2. 手势滑动：手指横向拖，松手时判断方向和距离决定是否切换
//   3. 无缝衔接：滑到最后一张再往后滑回到第一张（用取模实现）
// ============================================================================

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  list: { type: Array, default: () => [] },
  // 自动播放间隔（毫秒）
  interval: { type: Number, default: 4000 },
})

defineEmits(['click-banner'])

const box = ref(null)
const current = ref(0)      // 当前第几张
const dragging = ref(false) // 手指是否正按着
const offset = ref(0)       // 手指拖动产生的临时偏移（px）

let timer = null
let startX = 0
let width = 375

const trackStyle = computed(() => {
  // 基础位移 = -当前索引 × 容器宽度，再加上手指拖动的临时偏移
  const base = -current.value * width
  return {
    transform: `translate3d(${base + offset.value}px, 0, 0)`,
    // 手指按着时不要过渡，要跟手；松手后才用过渡滑过去
    transition: dragging.value ? 'none' : 'transform 0.32s cubic-bezier(0.25, 0.8, 0.5, 1)',
  }
})

function startAuto() {
  stopAuto()
  if (props.list.length <= 1) return
  timer = setInterval(() => {
    current.value = (current.value + 1) % props.list.length
  }, props.interval)
}

function stopAuto() {
  if (timer) clearInterval(timer)
  timer = null
}

// ─── 手势 ──────────────────────────────────────────────────────────────────
function onTouchStart(e) {
  dragging.value = true
  startX = e.touches[0].clientX
  width = box.value?.clientWidth || window.innerWidth
  // 手指按下去先停掉自动播放，不然滑到一半它自己跳走了
  stopAuto()
}

function onTouchMove(e) {
  if (!dragging.value) return
  offset.value = e.touches[0].clientX - startX
}

function onTouchEnd() {
  if (!dragging.value) return
  dragging.value = false

  // 位移超过容器宽度的 20% 就算"用户想切换"，否则回弹
  const threshold = width * 0.2
  if (offset.value < -threshold) {
    current.value = (current.value + 1) % props.list.length
  } else if (offset.value > threshold) {
    current.value = (current.value - 1 + props.list.length) % props.list.length
  }

  offset.value = 0
  startAuto()
}

onMounted(() => {
  width = box.value?.clientWidth || window.innerWidth
  startAuto()

  // 切到别的标签页时暂停轮播：看不见还在跑，白白耗电
  document.addEventListener('visibilitychange', onVisibility)
})

function onVisibility() {
  if (document.hidden) stopAuto()
  else startAuto()
}

onBeforeUnmount(() => {
  // 定时器一定要清，否则组件销毁了还在跑，会报"改了已卸载组件的响应式数据"
  stopAuto()
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<style scoped>
.swiper {
  position: relative;
  overflow: hidden;
  border-radius: var(--r);
  margin: 0.1rem 0.1rem 0;
  /* 固定高宽比 375:160，图片没加载完坑位也在，不抖动 */
  aspect-ratio: 375 / 160;
  background: #eee;
}

.track {
  display: flex;
  height: 100%;
  will-change: transform;
}

.slide {
  flex: 0 0 100%;
  height: 100%;
}

.slide-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.dots {
  position: absolute;
  bottom: 0.08rem;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 0.05rem;
}

.dot {
  width: 0.06rem;
  height: 0.06rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.55);
  transition: width 0.2s ease, background 0.2s ease;
}

.dot.active {
  width: 0.16rem;
  border-radius: 0.03rem;
  background: #fff;
}
</style>
