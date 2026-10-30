<template>
  <div class="app-shell">

    <router-view v-slot="{ Component, route }">
      <transition :name="route.meta.tab ? 'fade' : 'slide'" mode="out-in">

        <component :is="Component" :key="route.fullPath" />
      </transition>
    </router-view>

    <TabBar v-if="showTab" />

    <div class="toast-layer">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast"
        :class="`toast-${t.type}`"
      >{{ t.message }}</div>
    </div>
  </div>
</template>

<script setup>

import { computed } from 'vue'
import { useRoute } from 'vue-router'
import TabBar from './components/TabBar.vue'
import { toasts } from './composables/useToast'

const route = useRoute()

const showTab = computed(() => route.meta.tab === true)
</script>

<style scoped>
.app-shell {
  position: relative;

  min-height: 100vh;
  min-height: 100dvh;

  padding-top: var(--safe-top);
  background: var(--bg);
}

.toast-layer {
  position: fixed;
  left: 0;
  right: 0;

  bottom: 0.9rem;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.08rem;

  pointer-events: none;
}

.toast {
  max-width: 3rem;
  padding: 0.1rem 0.18rem;
  border-radius: 0.2rem;
  background: rgba(0, 0, 0, 0.82);
  color: #fff;
  font-size: 0.13rem;
  line-height: 1.4;
  text-align: center;
  animation: toastIn 0.2s ease;

  backdrop-filter: none;
}

.toast-ok {
  background: rgba(15, 110, 86, 0.92);
}

.toast-warn {
  background: rgba(163, 45, 45, 0.92);
}

@keyframes toastIn {
  from { opacity: 0; transform: translateY(0.1rem); }
  to   { opacity: 1; transform: translateY(0); }
}
</style>
