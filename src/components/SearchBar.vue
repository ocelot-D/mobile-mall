<template>
  <div class="search-bar" :class="{ 'is-sticky': sticky }">
    <!--
      两种形态：
        readonly（首页用）  —— 看起来是输入框，点一下跳到搜索页
        input（搜索页用）   —— 真正的输入框，输入时防抖触发搜索
    -->
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

      <!-- 有内容时才显示清除按钮，避免一进来就有个叉 -->
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
// ============================================================================
// 搜索栏（首页吸顶用 / 搜索页输入用）
//
// 首页那个是"假输入框"：看起来可以输入，点一下才跳到真正的搜索页。
// 为什么这么做？
//   在首页直接输入的话，页面要同时处理"输入"和"展示结果"两件事，
//   滚动位置、下拉刷新、结果列表会互相打架。
//   跳到独立搜索页之后逻辑清爽，也符合主流商城的做法（淘宝、京东都是这样）。
//
// 防抖：每敲一个字都发请求的话，打"无线耳机"四个字要发四次请求，
//       而且先发的可能后到，结果顺序会乱。防抖 300ms 后只发最后一次。
// ============================================================================

import { ref, watch, onBeforeUnmount } from 'vue'
import { debounce } from '../utils/throttle'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '搜索商品' },
  // 首页传 true：只展示，点击跳搜索页
  readonly: { type: Boolean, default: false },
  // 首页回显最近一次搜的关键词
  displayKeyword: { type: String, default: '' },
  // 是否吸顶
  sticky: { type: Boolean, default: true },
  // 防抖等待时间
  wait: { type: Number, default: 300 },
})

const emit = defineEmits(['update:modelValue', 'search', 'focus'])

const inputEl = ref(null)

// 把防抖函数创建一次并复用。
// 不能在 onInput 里每次都 debounce(...) —— 那样每次都是新的闭包，
// 上一次的 timer 清不掉，防抖就失效了（这是很多人写错的地方）。
const emitSearch = debounce(() => {
  emit('search', props.modelValue)
}, props.wait)

function onInput(e) {
  emit('update:modelValue', e.target.value)
  // 每敲一下都重新计时，停手 300ms 才真的去搜
  emitSearch()
}

/** 按回车立刻搜，不等防抖（用户明确表示"我输完了"） */
function emitNow() {
  emitSearch.cancel()
  emit('search', props.modelValue)
}

function clear() {
  emit('update:modelValue', '')
  emit('search', '')
  // 清完自动聚焦，方便接着输下一个词
  inputEl.value?.focus()
}

/** 暴露一个聚焦方法给父组件（搜索页进页面自动弹键盘） */
function focus() {
  inputEl.value?.focus()
}
defineExpose({ focus })

onBeforeUnmount(() => {
  // 组件销毁时取消还没触发的那次请求，避免给已销毁的组件塞数据
  emitSearch.cancel()
})
</script>

<style scoped>
.search-bar {
  /* z-index 给高一点，保证盖住轮播和商品卡片 */
  z-index: 20;
  padding: 0.08rem 0.12rem;
  background: linear-gradient(180deg, var(--brand) 0%, #ff7a33 100%);
}

/*
  吸顶核心：position: sticky; top: 0
  页面往上滚时它跟着滚，滚到顶部就钉住不动。
  比 position: fixed 好在哪？
    fixed 会让元素脱离文档流，下面的内容要手动加 padding-top 补位，
    而且键盘弹起时 fixed 元素在 iOS 上会乱跳。sticky 没这两个问题。
*/
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

/* 去掉 iOS 上 search 类型输入框自带的清除按钮，我们用自己写的那个 */
.input::-webkit-search-cancel-button {
  -webkit-appearance: none;
  appearance: none;
}

.clear {
  color: var(--ink-3);
  padding: 0 0.08rem;
}
</style>
