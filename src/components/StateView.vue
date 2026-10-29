<template>
  <div class="state-view">
    <!-- 加载中：用骨架屏而不是转圈。
         骨架屏的形状和真实内容一致，用户能提前知道这儿会出什么，
         感知上的等待时间比转圈短很多（这是有实验数据支撑的）。 -->
    <div v-if="state === 'loading'" class="skeleton-grid">
      <div v-for="n in 4" :key="n" class="skeleton-card">
        <div class="skeleton skeleton-img"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line short"></div>
      </div>
    </div>

    <!-- 空态：请求成功但一条都没有。
         一定要给一句"你该怎么办"的指引，光说"暂无数据"用户会以为是坏了。 -->
    <div v-else-if="state === 'empty'" class="state-block">
      <div class="state-icon">🗂️</div>
      <p class="state-title">{{ emptyTitle }}</p>
      <p class="state-desc">{{ emptyDesc }}</p>
      <slot name="empty-action" />
    </div>

    <!-- 错误态：断网、后端没启动。
         必须给一个"重试"按钮，不然用户只能自己刷新整个页面。 -->
    <div v-else-if="state === 'error'" class="state-block">
      <div class="state-icon">📶</div>
      <p class="state-title">数据加载失败</p>
      <p class="state-desc">{{ error }}</p>
      <button class="retry-btn tap tap-44" @click="$emit('retry')">重新加载</button>
      <p class="state-tip">提示：请确认后端已启动（在项目目录执行 npm run serve）</p>
    </div>

    <!-- 正常态：直接把内容渲染出来 -->
    <slot v-else />
  </div>
</template>

<script setup>
// ============================================================================
// 列表四态组件
//
// 移动端最容易漏的就是"空"和"错误"两态：
//   空态   —— 搜索没结果、筛选后没数据，不处理就是一片白
//   错误态 —— 电梯里 / 地铁上断网，不处理就是转圈到天荒地老
//
// 面试点：把四态抽成一个组件，说明你不是"想到哪写到哪"，
//         而是把状态当成一套完整的东西在设计。
// ============================================================================

defineProps({
  // 'loading' | 'empty' | 'error' | 'ok'
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

/* ─── 骨架屏 ───────────────────────────────────────────────────────────── */
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

/* ─── 空态 / 错误态 ─────────────────────────────────────────────────────── */
.state-block {
  padding: 0.6rem 0.3rem;
  text-align: center;
}

.state-icon {
  font-size: 0.44rem;
  margin-bottom: 0.14rem;
  /* 加一点点透明度，避免 emoji 太跳，跟整体克制的风格统一 */
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
  /* 错误文案可能很长，允许换行并且不要撑破容器 */
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
