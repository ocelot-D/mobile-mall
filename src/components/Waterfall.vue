<template>
  <div ref="root" class="waterfall" :style="{ gap: `${gap}px` }">
    <div v-for="(col, i) in columns" :key="i" class="col" :style="{ gap: `${gap}px` }">
      <ProductCard v-for="p in col" :key="p.id" :product="p" />
    </div>
  </div>
</template>

<script setup>

import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import ProductCard from './ProductCard.vue'

const props = defineProps({
  items: { type: Array, default: () => [] },

  gap: { type: Number, default: 8 },
})

const root = ref(null)

const width = ref(375)

let resizeObserver = null

const colCount = computed(() => {
  if (width.value <= 320) return 1
  if (width.value >= 640) return 3
  return 2
})

const columns = computed(() => {
  const n = colCount.value
  const cols = Array.from({ length: n }, () => [])

  const heights = new Array(n).fill(0)

  const colWidth = (width.value - props.gap * (n - 1)) / n

  props.items.forEach((p) => {

    let minIdx = 0
    for (let i = 1; i < n; i += 1) {
      if (heights[i] < heights[minIdx]) minIdx = i
    }

    cols[minIdx].push(p)

    heights[minIdx] += p.ratio * colWidth + 0.62 * colWidth
  })

  return cols
})

onMounted(() => {

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

  min-width: 0;
  display: flex;
  flex-direction: column;
}
</style>
