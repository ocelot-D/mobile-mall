<template>
  <div class="cat-grid">
    <button
      v-for="c in categories"
      :key="c.id"
      class="cat-item tap"
      @click="$emit('select', c)"
    >
      <span class="cat-icon">
        <img :src="`/${c.img}`" :alt="c.name" />
      </span>
      <span class="cat-name">{{ c.name }}</span>
    </button>
  </div>
</template>

<script setup>
// ============================================================================
// 首页分类入口（九宫格）
//
// 断点栅格在这里体现：
//   常规手机  → 一行 4 个（两行放完 6 个分类 + 留白）
//   窄屏 ≤320 → 一行 3 个，4 个会把文字挤成两行
// 用 CSS 媒体查询改 grid-template-columns，不需要 JS 参与，最简单也最稳。
// ============================================================================

defineProps({
  categories: { type: Array, default: () => [] },
})

defineEmits(['select'])
</script>

<style scoped>
.cat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.12rem 0;
  padding: 0.14rem 0.1rem;
  background: var(--card);
  border-radius: var(--r);
  margin: 0.1rem;
}

/* 窄屏降级成 3 列：320px 宽放 4 列，每个只有 72px，文字必然折行 */
@media (max-width: 320px) {
  .cat-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.cat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.05rem;
  /* 点击区至少 44px 高，图标本身只有 44px 宽 */
  min-height: var(--tap);
}

.cat-icon {
  width: 0.44rem;
  height: 0.44rem;
  border-radius: 0.14rem;
  overflow: hidden;
}

.cat-icon img {
  width: 100%;
  height: 100%;
}

.cat-name {
  font-size: 0.12rem;
  color: var(--ink-2);
}
</style>
