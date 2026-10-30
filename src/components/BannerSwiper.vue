<template>
  <div class="swiper" ref="box">

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

        <img :src="imgSrc(b.img)" :alt="b.title" class="slide-img" />
      </div>
    </div>

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

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { imgSrc } from '../utils/format'

const props = defineProps({
  list: { type: Array, default: () => [] },

  interval: { type: Number, default: 4000 },
})

defineEmits(['click-banner'])

const box = ref(null)
const current = ref(0)
const dragging = ref(false)
const offset = ref(0)

let timer = null
let startX = 0
let width = 375

const trackStyle = computed(() => {

  const base = -current.value * width
  return {
    transform: `translate3d(${base + offset.value}px, 0, 0)`,

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

function onTouchStart(e) {
  dragging.value = true
  startX = e.touches[0].clientX
  width = box.value?.clientWidth || window.innerWidth

  stopAuto()
}

function onTouchMove(e) {
  if (!dragging.value) return
  offset.value = e.touches[0].clientX - startX
}

function onTouchEnd() {
  if (!dragging.value) return
  dragging.value = false

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

  document.addEventListener('visibilitychange', onVisibility)
})

function onVisibility() {
  if (document.hidden) stopAuto()
  else startAuto()
}

onBeforeUnmount(() => {

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
