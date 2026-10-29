<template>
  <div class="page result-page">
    <!-- 加载中 -->
    <div v-if="loading" class="state">
      <p>正在查询订单…</p>
    </div>

    <!-- 查不到 -->
    <div v-else-if="error" class="state">
      <div class="icon">🧾</div>
      <p class="title">订单查询失败</p>
      <p class="desc">{{ error }}</p>
      <button class="btn tap tap-44" @click="load">重试</button>
    </div>

    <!-- 成功 -->
    <template v-else-if="order">
      <div class="success">
        <div class="tick">✓</div>
        <h1 class="title">下单成功</h1>
        <p class="sub">我们会尽快为您发货</p>
      </div>

      <section class="card-block">
        <div class="row"><span>订单编号</span><span class="mono">{{ order.orderNo }}</span></div>
        <div class="row"><span>下单时间</span><span>{{ formatTime(order.createdAt) }}</span></div>
        <div class="row"><span>订单状态</span><span class="status">{{ order.status }}</span></div>
      </section>

      <section class="card-block">
        <h2 class="block-title">收货信息</h2>
        <p class="addr">
          {{ order.address.name }} {{ maskPhone(order.address.phone) }}
        </p>
        <p class="addr-detail">{{ order.address.address }}</p>
        <p v-if="order.remark" class="remark">备注：{{ order.remark }}</p>
      </section>

      <section class="card-block">
        <h2 class="block-title">商品清单</h2>
        <div v-for="it in order.items" :key="it.id + it.specText" class="goods">
          <span class="goods-name clamp-2">{{ it.title }}</span>
          <span class="goods-spec">{{ it.specText }}</span>
          <span class="goods-price">¥{{ it.unitPrice }} × {{ it.count }}</span>
        </div>
        <div class="row"><span>运费</span><span>{{ order.freight ? `¥${order.freight}` : '包邮' }}</span></div>
        <div class="row total"><span>实付</span><span class="total-num">¥{{ order.payAmount }}</span></div>
      </section>

      <div class="actions">
        <router-link to="/" class="btn ghost tap tap-44">继续逛逛</router-link>
        <router-link to="/cart" class="btn tap tap-44">查看购物车</router-link>
      </div>
    </template>
  </div>
</template>

<script setup>
// ============================================================================
// 下单成功页
//
// 为什么用订单号去后端查，而不是把订单对象直接通过路由传过来？
//   路由 state 传对象一刷新就没了，用户"刷新确认页"是很常见的动作。
//   用订单号查询，刷新、分享链接都能正常显示，这才是正确做法。
// ============================================================================

import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrder } from '../utils/request'
import { formatTime, maskPhone } from '../utils/format'

const route = useRoute()
const order = ref(null)
const loading = ref(true)
const error = ref('')

async function load() {
  loading.value = true
  error.value = ''
  try {
    order.value = await getOrder(route.params.no)
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.result-page {
  background: var(--bg);
  padding-bottom: 0.3rem;
}

.state {
  padding: 0.9rem 0.3rem;
  text-align: center;
  color: var(--ink-3);
}

.state .icon {
  font-size: 0.44rem;
  margin-bottom: 0.1rem;
}

.state .title {
  font-size: 0.15rem;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 0.05rem;
}

.state .desc {
  font-size: 0.12rem;
  margin-bottom: 0.16rem;
  word-break: break-word;
}

.state .btn {
  display: inline-block;
  padding: 0 0.24rem;
  border-radius: 0.22rem;
  background: var(--brand);
  color: #fff;
  font-size: 0.14rem;
  line-height: 0.4rem;
}

/* ─── 成功头部 ───────────────────────────────────────────────────────────── */
.success {
  padding: 0.4rem 0.2rem 0.3rem;
  text-align: center;
  background: linear-gradient(180deg, var(--brand-soft), var(--bg));
}

.tick {
  width: 0.56rem;
  height: 0.56rem;
  margin: 0 auto 0.14rem;
  border-radius: 50%;
  background: var(--green);
  color: #fff;
  font-size: 0.3rem;
  line-height: 0.56rem;
}

.title {
  font-size: 0.19rem;
  font-weight: 700;
}

.sub {
  margin-top: 0.05rem;
  font-size: 0.12rem;
  color: var(--ink-3);
}

/* ─── 信息块 ─────────────────────────────────────────────────────────────── */
.card-block {
  margin: 0.1rem;
  padding: 0.14rem;
  background: var(--card);
  border-radius: var(--r);
}

.block-title {
  font-size: 0.14rem;
  font-weight: 600;
  margin-bottom: 0.08rem;
}

.row {
  display: flex;
  justify-content: space-between;
  padding: 0.05rem 0;
  font-size: 0.13rem;
  color: var(--ink-2);
}

.mono {
  font-variant-numeric: tabular-nums;
}

.status {
  color: var(--brand);
  font-weight: 600;
}

.addr {
  font-size: 0.13rem;
  font-weight: 600;
}

.addr-detail {
  margin-top: 0.04rem;
  font-size: 0.12rem;
  color: var(--ink-3);
  line-height: 1.5;
}

.remark {
  margin-top: 0.06rem;
  font-size: 0.11rem;
  color: var(--ink-3);
}

.goods {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 0.02rem 0.08rem;
  padding: 0.07rem 0;
  border-bottom: 1px solid var(--line);
  font-size: 0.13rem;
}

.goods-name {
  grid-column: 1;
}

.goods-spec {
  grid-column: 1;
  font-size: 0.1rem;
  color: var(--ink-3);
}

.goods-price {
  grid-column: 2;
  grid-row: 1 / 3;
  align-self: center;
  color: var(--brand);
  font-variant-numeric: tabular-nums;
}

.row.total {
  margin-top: 0.06rem;
  padding-top: 0.1rem;
  border-top: 1px solid var(--line);
  font-weight: 600;
  color: var(--ink);
}

.total-num {
  color: var(--brand);
  font-size: 0.17rem;
}

/* ─── 底部按钮 ───────────────────────────────────────────────────────────── */
.actions {
  display: flex;
  gap: 0.1rem;
  padding: 0.2rem 0.1rem 0;
}

.btn {
  flex: 1;
  text-align: center;
  height: 0.42rem;
  line-height: 0.42rem;
  border-radius: 0.21rem;
  background: var(--brand);
  color: #fff;
  font-size: 0.14rem;
  font-weight: 600;
}

.btn.ghost {
  background: #fff;
  color: var(--ink-2);
  border: 1px solid var(--line);
}
</style>
