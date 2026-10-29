<template>
  <div ref="root" class="waterfall" :style="{ gap: `${gap}px` }">
    <div v-for="(col, i) in columns" :key="i" class="col" :style="{ gap: `${gap}px` }">
      <ProductCard v-for="p in col" :key="p.id" :product="p" />
    </div>
  </div>
</template>

<script setup>
// ============================================================================
// 瀑布流布局
//
// 为什么不用 CSS 的 columns 或者 grid 自动排？
//   1. CSS multi-column（columns: 2）是按"列"填充的：先把第一列从上到下塞满，
//      再塞第二列。结果就是商品顺序在视觉上是竖着走的，
//      用户从上往下扫的时候看到的顺序是 1,2,3...18,19 —— 完全乱了。
//   2. grid 的自动布局要求每一格高度已知，而瀑布流每格高度不一样（图片比例不同），
//      用 grid 会出现大片空白或者被拉平。
//
// 正确做法（也是本项目用的）：JS 算列高。
//   维护一个"每列当前高度"的数组，来一个商品就放进"当前最矮的那一列"。
//   这样既保证顺序大体正确（按数据流分配），又保证两列底部基本齐平。
//
// 高度怎么预估？
//   不需要等 DOM 渲染完再量（那样会引起二次回流），
//   直接用数据里给的高宽比算：图片高 = 列宽 × ratio，加上下方文字区固定高度。
//   这样首帧就能排好，不会出现"先堆在一起再散开"的跳动。
// ============================================================================

import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import ProductCard from './ProductCard.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  // 列间距（px）
  gap: { type: Number, default: 8 },
})

const root = ref(null)
// 容器宽度，用来决定几列以及预估卡片高度
const width = ref(375)

let resizeObserver = null

/**
 * 断点栅格：按容器宽度决定列数
 *   极窄屏（≤320）  → 1 列，两列会把字挤成两行看不清
 *   常规手机        → 2 列，电商的标准形态
 *   大屏 / 横屏     → 3 列
 *
 * 注意：这里按"容器宽度"而不是屏幕宽度判断。
 * 因为桌面预览时整个 H5 被限制在 480px 内，屏幕宽 1920 也应该显示 2 列。
 */
const colCount = computed(() => {
  if (width.value <= 320) return 1
  if (width.value >= 640) return 3
  return 2
})

/**
 * 把商品分配到各列。
 * 返回值是二维数组：[[商品, 商品...], [商品...]]
 */
const columns = computed(() => {
  const n = colCount.value
  const cols = Array.from({ length: n }, () => [])
  // 每列的累计高度（单位是"相对列宽的倍数"，不需要真实像素也能比较）
  const heights = new Array(n).fill(0)

  const colWidth = (width.value - props.gap * (n - 1)) / n

  props.items.forEach((p) => {
    // 找当前最矮的列
    let minIdx = 0
    for (let i = 1; i < n; i += 1) {
      if (heights[i] < heights[minIdx]) minIdx = i
    }

    cols[minIdx].push(p)
    // 预估这一格的高度：图片高（列宽 × 高宽比）+ 文字区（约 0.62 倍列宽，实测值）
    heights[minIdx] += p.ratio * colWidth + 0.62 * colWidth
  })

  return cols
})

onMounted(() => {
  // ResizeObserver 比监听 window.resize 更准：
  // 它能感知容器自身的尺寸变化（比如侧边栏展开、横竖屏切换），
  // 而 window.resize 只看得到窗口变化。
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width
      if (w) width.value = w
    })
    resizeObserver.observe(root.value)
  } else {
    width.value = root.value?.clientWidth || window.innerWidth
  }
})

onBeforeUnmount(() => {
  // 必须断开，否则观察器一直持有 DOM 引用，切页面后内存回不来
  if (resizeObserver) resizeObserver.disconnect()
})
</script>

<style scoped>
.waterfall {
  display: flex;
  align-items: flex-start;
  padding: 0 0.1rem;
}

.col {
  flex: 1;
  /* 每列等宽，min-width:0 防止内容把列撑宽（flex 的经典坑） */
  min-width: 0;
  display: flex;
  flex-direction: column;
}
</style>
