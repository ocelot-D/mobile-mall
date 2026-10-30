<template>
  <div class="search-bar" :class="{ 'is-sticky': sticky }">

    <div v-if="readonly" class="fake-input tap" @click="$emit('focus')">
      <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
      </svg>
      <span class="ph">{{ displayKeyword || placeholder }}</span>
    </div>

    <div v-else class="real-input">
      <svg class="icon" viewBox="0 0 24 24" width="16" height="16" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
      </svg>

      <input
        ref="inputEl"
        :value="modelValue"
        type="search"
        class="input"
        :placeholder="placeholder"
        enterkeyhint="search"
        @input="onInput"
        @keyup.enter="emitNow"
      />

      <button v-if="modelValue" class="clear tap tap-44 tap-expand" @click="clear">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>

import { ref, watch, onBeforeUnmount } from 'vue'
import { debounce } from '../utils/throttle'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '搜索商品' },

  readonly: { type: Boolean, default: false },

  displayKeyword: { type: String, default: '' },

  sticky: { type: Boolean, default: true },

  wait: { type: Number, default: 300 },
})

const emit = defineEmits(['update:modelValue', 'search', 'focus'])

const inputEl = ref(null)

const emitSearch = debounce(() => {
  emit('search', props.modelValue)
}, props.wait)

function onInput(e) {
  emit('update:modelValue', e.target.value)

  emitSearch()
}

function emitNow() {
  emitSearch.cancel()
  emit('search', props.modelValue)
}

function clear() {
  emit('update:modelValue', '')
  emit('search', '')

  inputEl.value?.focus()
}

function focus() {
  inputEl.value?.focus()
}
defineExpose({ focus })

onBeforeUnmount(() => {

  emitSearch.cancel()
})
</script>

<style scoped>
.search-bar {

  z-index: 20;
  padding: 0.08rem 0.12rem;
  background: linear-gradient(180deg, var(--brand) 0%, #ff7a33 100%);
}

.is-sticky {
  position: sticky;
  top: 0;
}

.fake-input,
.real-input {
  display: flex;
  align-items: center;
  height: 0.34rem;
  padding: 0 0.1rem;
  border-radius: 0.17rem;
  background: #fff;
  color: var(--ink-3);
}

.real-input {
  padding-right: 0.02rem;
}

.icon {
  flex-shrink: 0;
  margin-right: 0.06rem;
  color: var(--ink-3);
}

.ph {
  font-size: 0.13rem;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.input {
  flex: 1;
  min-width: 0;
  height: 100%;
  font-size: 0.13rem;
  color: var(--ink);
  background: none;
}

.input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.clear {
  color: var(--ink-3);
  padding: 0 0.08rem;
}
</style>
