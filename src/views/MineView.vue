<template>
  <div class="page mine-page has-tabbar">
    <!-- 用户头部 -->
    <header class="hero">
      <div class="avatar">M</div>
      <div class="user">
        <p class="name">MobiMall 体验用户</p>
        <p class="uid">ID: 10086</p>
      </div>
    </header>

    <!-- 订单入口（演示用，点击提示） -->
    <section class="card-block orders">
      <button v-for="o in ORDER_ENTRIES" :key="o.label" class="order-entry tap" @click="onStub">
        <span class="order-icon">{{ o.icon }}</span>
        <span class="order-label">{{ o.label }}</span>
      </button>
    </section>

    <!-- ★ 低端机降级开关：面试演示这一屏就够了 ★ -->
    <section class="card-block">
      <div class="switch-row">
        <div class="switch-info">
          <p class="switch-title">流畅模式（性能优先）</p>
          <p class="switch-desc">关闭毛玻璃与渐变动画，低端机滚动不掉帧</p>
        </div>
        <button
          class="switch tap"
          :class="{ on: device.low }"
          :aria-pressed="device.low"
          @click="toggle"
        >
          <span class="knob"></span>
        </button>
      </div>

      <!-- 把判定依据显示出来：面试时不用嘴说"我判断了"，指着屏幕讲就行 -->
      <div class="device-info">
        <div class="info-row"><span>CPU 核心</span><span>{{ device.cores }} 核</span></div>
        <div class="info-row"><span>内存</span><span>{{ device.memory ? `${device.memory} GB` : '未知' }}</span></div>
        <div class="info-row"><span>像素比 DPR</span><span>{{ device.dpr }}</span></div>
        <div class="info-row"><span>省流模式</span><span>{{ device.saveData ? '已开启' : '未开启' }}</span></div>
        <div class="info-row"><span>系统减弱动效</span><span>{{ device.reducedMotion ? '已开启' : '未开启' }}</span></div>
        <div class="info-row"><span>自动判定结果</span><span>{{ device.autoLow ? '低端机' : '正常' }}</span></div>
        <div class="info-row"><span>当前模式</span>
          <span :class="device.low ? 'tag-low' : 'tag-high'">{{ device.low ? '已降级' : '完整效果' }}</span>
        </div>
        <p class="reason">判定依据：{{ device.reason }}</p>
      </div>

      <button class="reset tap tap-44" @click="reset">恢复自动判定</button>
    </section>

    <!-- 项目技术点：放在这里是给面试官看的，点开就能对上简历那几条 -->
    <section class="card-block">
      <h2 class="block-title">本项目做了什么</h2>
      <ul class="points">
        <li v-for="p in POINTS" :key="p">{{ p }}</li>
      </ul>
    </section>

    <button class="danger tap tap-44" @click="clearCart">清空购物车</button>
  </div>
</template>

<script setup>
// ============================================================================
// 我的
//
// 这一页除了常规的个人信息，还承担一个作用：
// 把"低端机降级"做成可见可切换的开关，方便演示。
//
// 面试场景：
//   面试官问"移动端你踩过什么坑"，
//   直接翻开这一页，指着"流畅模式"开关说：
//   "我在低端安卓上发现毛玻璃掉帧，所以做了设备分级，
//    这里可以现场切换，上面是当前机器的判定依据。"
//   比口头描述有说服力得多。
// ============================================================================

import { device, setLowEndMode, resetLowEndMode } from '../composables/useDeviceTier'
import { useCartStore } from '../stores/cart'
import { toast, toastOk } from '../composables/useToast'

const cart = useCartStore()

const ORDER_ENTRIES = [
  { icon: '💰', label: '待付款' },
  { icon: '📦', label: '待发货' },
  { icon: '🚚', label: '待收货' },
  { icon: '↩️', label: '退款' },
]

// 简历上那六条的精简版，放在页面上方便对照
const POINTS = [
  '移动端适配：rem/vw 基准 + 断点栅格 + clamp() 流式字号',
  '视口与安全区：100dvh + env(safe-area-inset-bottom)',
  '触摸交互：:hover 全部补 :active，可点区域最小 44px',
  '下拉刷新 + 上拉加载更多：触摸事件 + 节流，三态文案齐全',
  '图片策略：IntersectionObserver 懒加载 + 固定宽高消除 CLS',
  '低端机降级：关毛玻璃与渐变动画，prefers-reduced-motion 兜底',
]

function toggle() {
  setLowEndMode(!device.low)
  toast(device.low ? '已切换到流畅模式' : '已恢复完整效果')
}

function reset() {
  resetLowEndMode()
  toastOk('已恢复自动判定')
}

function clearCart() {
  if (!cart.items.length) {
    toast('购物车已经是空的', 'warn')
    return
  }
  cart.clear()
  toast('购物车已清空')
}

function onStub() {
  toast('这是演示项目，订单模块未接入', 'warn')
}
</script>

<style scoped>
.mine-page {
  background: var(--bg);
}

.hero {
  display: flex;
  align-items: center;
  gap: 0.12rem;
  padding: 0.24rem 0.16rem;
  background: linear-gradient(135deg, var(--brand) 0%, #ff8a3d 100%);
  color: #fff;
}

.avatar {
  width: 0.52rem;
  height: 0.52rem;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.22rem;
  font-weight: 700;
}

.name {
  font-size: 0.16rem;
  font-weight: 600;
}

.uid {
  margin-top: 0.02rem;
  font-size: 0.11rem;
  opacity: 0.85;
}

/* ─── 订单入口 ───────────────────────────────────────────────────────────── */
.orders {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: 0.1rem;
  padding: 0.14rem 0;
}

.order-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.04rem;
  min-height: var(--tap);
}

.order-icon {
  font-size: 0.2rem;
}

.order-label {
  font-size: 0.11rem;
  color: var(--ink-2);
}

/* ─── 通用块 ─────────────────────────────────────────────────────────────── */
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

/* ─── 开关 ───────────────────────────────────────────────────────────────── */
.switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.1rem;
}

.switch-title {
  font-size: 0.14rem;
  font-weight: 600;
}

.switch-desc {
  margin-top: 0.02rem;
  font-size: 0.11rem;
  color: var(--ink-3);
}

.switch {
  position: relative;
  flex-shrink: 0;
  width: 0.46rem;
  height: 0.28rem;
  border-radius: 0.14rem;
  background: #d8d8de;
  transition: background 0.2s ease;
}

.switch.on {
  background: var(--brand);
}

.knob {
  position: absolute;
  top: 0.02rem;
  left: 0.02rem;
  width: 0.24rem;
  height: 0.24rem;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0.01rem 0.03rem rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.switch.on .knob {
  /* 平移而不是改 left：transform 走 GPU，切换更顺 */
  transform: translateX(0.18rem);
}

/* 开关本身不做缩放，:active 缩了会看着像坏了 */
.switch:active {
  transform: none;
}

/* ─── 设备信息 ───────────────────────────────────────────────────────────── */
.device-info {
  margin-top: 0.12rem;
  padding-top: 0.12rem;
  border-top: 1px solid var(--line);
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 0.04rem 0;
  font-size: 0.12rem;
  color: var(--ink-2);
}

.tag-low {
  color: var(--brand);
  font-weight: 600;
}

.tag-high {
  color: var(--green);
  font-weight: 600;
}

.reason {
  margin-top: 0.08rem;
  font-size: 0.11rem;
  color: var(--ink-3);
  line-height: 1.5;
}

.reset {
  width: 100%;
  margin-top: 0.1rem;
  border-radius: 0.06rem;
  background: #f5f5f7;
  font-size: 0.12rem;
  color: var(--ink-2);
}

/* ─── 技术点 ─────────────────────────────────────────────────────────────── */
.points {
  display: flex;
  flex-direction: column;
  gap: 0.07rem;
}

.points li {
  position: relative;
  padding-left: 0.14rem;
  font-size: 0.12rem;
  color: var(--ink-2);
  line-height: 1.6;
}

.points li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.08rem;
  width: 0.05rem;
  height: 0.05rem;
  border-radius: 50%;
  background: var(--brand);
}

.danger {
  display: block;
  width: calc(100% - 0.2rem);
  margin: 0.16rem 0.1rem 0;
  border-radius: 0.08rem;
  background: #fff;
  color: #a32d2d;
  font-size: 0.13rem;
}
</style>
