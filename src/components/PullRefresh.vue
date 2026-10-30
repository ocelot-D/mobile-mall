<template>

  <div
    ref="wrap"
    class="pull-refresh"
    :style="wrapStyle"
    :class="{ 'is-dragging': dragging }"
  >

    <div
      class="indicator"
      :style="{ height: `${distance}px`, marginTop: `${-distance}px` }"
    >
      <span class="indicator-icon" :class="{ spin: status === 'refreshing' }">
        {{ status === 'refreshing' ? '' : (status === 'ready' ? '↑' : '↓') }}
      </span>
      <span class="indicator-text">{{ indicatorText }}</span>
    </div>

    <div class="content">
      <slot />

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

import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { throttle } from '../utils/throttle'

const props = defineProps({

  refreshing: { type: Boolean, default: false },

  hasMore: { type: Boolean, default: true },

  loadingMore: { type: Boolean, default: false },

  showFooter: { type: Boolean, default: true },

  threshold: { type: Number, default: 60 },
})

const emit = defineEmits(['refresh', 'load-more'])

const status = ref('idle')

const distance = ref(0)

const dragging = ref(false)

let startY = 0
let canPull = false

const wrap = ref(null)

const wrapStyle = computed(() => ({

  transition: dragging.value ? 'none' : 'transform 0.28s cubic-bezier(0.25, 0.8, 0.5, 1)',
  transform: `translate3d(0, ${distance.value}px, 0)`,

}))

const indicatorText = computed(() => {
  if (status.value === 'refreshing') return '正在刷新…'
  if (status.value === 'ready') return '松手立即刷新'
  return '下拉可以刷新'
})

function onTouchStart(e) {

  canPull = (window.scrollY || document.documentElement.scrollTop || 0) <= 0
  if (!canPull) return

  startY = e.touches[0].clientY
  dragging.value = true
  status.value = 'idle'
}

const computeDistance = throttle((e) => {
  if (!canPull || !dragging.value) return

  const dy = e.touches[0].clientY - startY

  if (dy <= 0) {
    distance.value = 0
    status.value = 'idle'
    return
  }

  const pulled = Math.min(dy * 0.45, 120)

  distance.value = pulled
  status.value = pulled >= props.threshold ? 'ready' : 'pulling'
}, 16)

function onTouchMove(e) {
  if (!canPull || !dragging.value) return

  const dy = e.touches[0].clientY - startY

  if (dy > 0 && e.cancelable) e.preventDefault()

  computeDistance(e)
}

function onTouchEnd() {
  if (!canPull || !dragging.value) return
  dragging.value = false

  if (status.value === 'ready') {

    status.value = 'refreshing'
    distance.value = 50
    emit('refresh')
  } else {

    distance.value = 0
    status.value = 'idle'
  }

  canPull = false
}

const onScroll = throttle(() => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const viewportH = window.innerHeight
  const totalH = document.documentElement.scrollHeight

  if (scrollTop + viewportH >= totalH - 300) {
    emit('load-more')
  }
}, 200)

watch(() => props.refreshing, (val) => {
  if (val) {
    status.value = 'refreshing'
    distance.value = 50
  } else if (status.value === 'refreshing') {

    setTimeout(() => {
      distance.value = 0
      status.value = 'idle'
    }, 200)
  }
})

onMounted(() => {
  const el = wrap.value

  el.addEventListener('touchstart', onTouchStart, { passive: true })
  el.addEventListener('touchmove', onTouchMove, { passive: false })
  el.addEventListener('touchend', onTouchEnd, { passive: true })
  el.addEventListener('touchcancel', onTouchEnd, { passive: true })

  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {

  const el = wrap.value
  if (el) {
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
    el.removeEventListener('touchend', onTouchEnd)
    el.removeEventListener('touchcancel', onTouchEnd)
  }
  window.removeEventListener('scroll', onScroll)

  onScroll.cancel()
  computeDistance.cancel()
})
</script>

<style scoped>
.pull-refresh {

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
