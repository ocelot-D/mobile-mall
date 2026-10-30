<template>
  <!--
    图片容器：用一个固定高宽比的外壳把位置占住。
    这是消除布局抖动（CLS）的关键 —— 图片没加载完，坑位已经在那里了，
    加载完只是把图填进去，页面不会跳。

    aspect-ratio 是现代浏览器原生支持的属性，比老式的
    "padding-top 百分比撑高"那套 hack 干净得多。
  -->
  <div
    ref="box"
    class="lazy-img"
    :style="{ aspectRatio: `1 / ${ratio}` }"
  >
    <!-- 占位底色：图片没到位时显示，避免白块 -->
    <div v-if="!loaded" class="placeholder" :style="placeholderStyle"></div>

    <!--
      真正的 img。
      src 只在"进入视口附近"之后才赋值 —— 这就是懒加载。
      decoding="async" 告诉浏览器别同步解码大图，避免阻塞主线程。
      loading="lazy" 是浏览器原生的懒加载，作为 IntersectionObserver 的兜底
      （老浏览器不支持 IO 时至少还有原生懒加载）。
    -->
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
// ============================================================================
// 图片懒加载组件
//
// 为什么自己写而不用现成的懒加载库？
//   1. IntersectionObserver 是浏览器原生 API，十几行就能写完，装库是浪费
//   2. 自己写才能在里面塞"占位色 + 固定高宽比"这两个防抖动的措施
//   3. 提前量想留多大自己定（rootMargin），库的默认行为往往不合移动端
//
// 三个措施缺一不可：
//   懒加载      → 不进视口不发请求，省流量、省首屏时间
//   占位色      → 图片没到位时不是白块，视觉上不突兀
//   固定高宽比  → 坑位先占好，图片来了不产生布局跳动（CLS = 0）
// ============================================================================

import { ref, onMounted, onBeforeUnmount, computed } from 'vue'

const props = defineProps({
  // 图片地址
  src: { type: String, required: true },
  // 高宽比：高 ÷ 宽。1.25 表示高度是宽度的 1.25 倍
  ratio: { type: Number, default: 1 },
  // 替代文本，无障碍用
  alt: { type: String, default: '' },
  // 占位色两个色值，给个渐变，比纯灰好看
  c1: { type: String, default: '#e9e9ee' },
  c2: { type: String, default: '#f4f4f7' },
})

const box = ref(null)
const visible = ref(false)   // 是否进入视口（进入后才去加载）
const loaded = ref(false)    // 图片是否真正加载完成

let observer = null

// 占位渐变样式
const placeholderStyle = computed(() => ({
  background: `linear-gradient(135deg, ${props.c1}, ${props.c2})`,
}))

function onLoad() {
  loaded.value = true
}

function onError() {
  // 图挂了也要把占位撤掉，否则永远转着。这里保留占位色当"图裂了"的兜底
  loaded.value = true
}

onMounted(() => {
  // 老浏览器没有 IntersectionObserver，那就直接加载，不做懒加载
  if (typeof IntersectionObserver === 'undefined') {
    visible.value = true
    return
  }

  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          visible.value = true
          // 已经决定加载了，就取消观察，别一直占着一个观察器
          observer.unobserve(entry.target)
        }
      })
    },
    {
      // rootMargin 给 300px 提前量：
      // 图片还在屏幕下方 300px 时就开始加载，等用户滑到时已经加载好了，
      // 不会出现"滑过去看到一张白图慢慢出"的情况。
      rootMargin: '300px 0px',
      threshold: 0.01,
    }
  )

  observer.observe(box.value)
})

onBeforeUnmount(() => {
  // 组件销毁一定要断开观察器，否则观察器持有 DOM 引用，造成内存泄漏
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
  /* 默认透明，加载完成后淡入，避免"啪"一下蹦出来 */
  opacity: 0;
  transition: opacity 0.25s ease;
}

.img.is-loaded {
  opacity: 1;
}

/* 低端机上连淡入都省了，直接显示 */
.low-end .img {
  transition: none;
}
</style>
