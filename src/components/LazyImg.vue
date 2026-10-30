<template>

  <div
    ref="box"
    class="lazy-img"
    :style="{ aspectRatio: `1 / ${ratio}` }"
  >

    <div v-if="!loaded" class="placeholder" :style="placeholderStyle"></div>

    <img
      v-if="visible"
      :src="src"
      :alt="alt"
      class="img"
      :class="{ 'is-loaded': loaded }"
      decoding="async"
      loading="lazy"
      @load="onLoad"
      @error="onError"
    />
  </div>
</template>

<script setup>

import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const props = defineProps({

  src: { type: String, required: true },

  ratio: { type: Number, default: 1 },

  alt: { type: String, default: '' },

  c1: { type: String, default: '#e9e9ee' },
  c2: { type: String, default: '#f4f4f7' },
})

const box = ref(null)
const visible = ref(false)
const loaded = ref(false)

let observer = null

const placeholderStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.c1}, ${props.c2})`,
}))

function onLoad() {
  loaded.value = true
}

function onError() {

  loaded.value = true
}

onMounted(() => {

  if (typeof IntersectionObserver === 'undefined') {
    visible.value = true
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visible.value = true

          observer.unobserve(entry.target)
        }
      })
    },
    {

      rootMargin: '300px 0px',
      threshold: 0.01,
    }
  )

  observer.observe(box.value)
})

onBeforeUnmount(() => {

  if (observer) observer.disconnect()
})
</script>

<style scoped>
.lazy-img {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: inherit;
  background: #f0f0f3;
}

.placeholder {
  position: absolute;
  inset: 0;
}

.img {
  width: 100%;
  height: 100%;
  object-fit: cover;

  opacity: 0;
  transition: opacity 0.25s ease;
}

.img.is-loaded {
  opacity: 1;
}

.low-end .img {
  transition: none;
}
</style>
