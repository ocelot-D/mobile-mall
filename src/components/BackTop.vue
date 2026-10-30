<template>

  <transition name="backtop">
    <button
      v-show="visible"
      class="backtop tap tap-44"
      aria-label="回到顶部"
      @click="toTop"
    >

      <span class="arrows">↑↑</span>
      <span class="label">顶部</span>
    </button>
  </transition>
</template>

<script setup>

import { ref, onMounted, onBeforeUnmount } from 'vue'
import { throttle } from '../utils/throttle'

const props = defineProps({

  threshold: { type: Number, default: 600 },
})

const visible = ref(false)

const onScroll = throttle(() => {
  visible.value = (window.scrollY || document.documentElement.scrollTop || 0) > props.threshold
}, 100)

function toTop() {

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })

  onScroll()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)

  onScroll.cancel()
})
</script>

<style scoped>

.backtop {
  position: fixed;
  right: max(0.16rem, calc(50% - 240px + 0.16rem));

  bottom: calc(var(--tab-h) + var(--safe-bottom) + 0.24rem);
  z-index: 60;

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
