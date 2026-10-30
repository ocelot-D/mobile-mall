<template>
  <div class="state-view">

    <div v-if="state === 'loading'" class="skeleton-grid">
      <div v-for="n in 4" :key="n" class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
    </div>

    <div v-else-if="state === 'empty'" class="state-block">
      <div class="state-icon">🗂️</div>
      <p class="state-title">{{ emptyTitle }}</p>
      <p class="state-desc">{{ emptyDesc }}</p>
      <slot name="empty-action" />
    </div>

    <div v-else-if="state === 'error'" class="state-block">
      <div class="state-icon">📶</div>
      <p class="state-title">数据加载失败</p>
      <p class="state-desc">{{ error }}</p>
      <button class="retry-btn tap tap-44" @click="$emit('retry')">重新加载</button>
      <p class="state-tip">提示：请确认后端已启动（在项目目录执行 npm run serve）</p>
    </div>

    <slot v-else />
  </div>
</template>

<script setup>

defineProps({

  state: { type: String, default: 'ok' },
  error: { type: String, default: '' },
  emptyTitle: { type: String, default: '这里还什么都没有' },
  emptyDesc: { type: String, default: '换个关键词或者看看别的分类' },
})

defineEmits(['retry'])
</script>

<style scoped>
.state-view {
  width: 100%;
}

.skeleton-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.1rem;
  padding: 0.1rem;
}

.skeleton-card {
  background: var(--card);
  border-radius: var(--r);
  padding-bottom: 0.1rem;
  overflow: hidden;
}

.skeleton-img {
  aspect-ratio: 1 / 1.15;
  width: 100%;
}

.skeleton-line {
  height: 0.14rem;
  margin: 0.1rem 0.1rem 0.06rem;
  border-radius: 0.04rem;
}

.skeleton-line.short {
  width: 55%;
}

.state-block {
  padding: 0.6rem 0.3rem;
  text-align: center;
}

.state-icon {
  font-size: 0.44rem;
  margin-bottom: 0.14rem;

  opacity: 0.85;
}

.state-title {
  font-size: 0.15rem;
  font-weight: 600;
  margin-bottom: 0.06rem;
}

.state-desc {
  font-size: 0.13rem;
  color: var(--ink-3);
  line-height: 1.6;
  margin-bottom: 0.16rem;

  word-break: break-word;
}

.state-tip {
  margin-top: 0.16rem;
  font-size: 0.11rem;
  color: var(--ink-3);
  opacity: 0.8;
}

.retry-btn {
  padding: 0 0.24rem;
  height: var(--tap);
  border-radius: 0.22rem;
  background: var(--brand);
  color: #fff;
  font-size: 0.14rem;
  font-weight: 600;
}
</style>
