<template>
  <div class="page not-found">
    <div class="code">404</div>
    <p class="title">页面走丢了</p>
    <p class="desc">你访问的地址不存在，回首页看看吧</p>
    <router-link to="/" class="btn tap tap-44">回到首页</router-link>
  </div>
</template>

<script setup>

</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 0 0.3rem;
  text-align: center;
  background: var(--bg);
}

.code {
  font-size: 0.6rem;
  font-weight: 800;
  color: var(--brand);
  opacity: 0.85;
}

.title {
  margin-top: 0.1rem;
  font-size: 0.16rem;
  font-weight: 600;
}

.desc {
  margin-top: 0.06rem;
  font-size: 0.12rem;
  color: var(--ink-3);
}

.btn {
  margin-top: 0.24rem;
  padding: 0 0.3rem;
  border-radius: 0.22rem;
  background: var(--brand);
  color: #fff;
  font-size: 0.14rem;
  line-height: 0.42rem;
}
</style>
