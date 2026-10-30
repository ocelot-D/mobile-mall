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
