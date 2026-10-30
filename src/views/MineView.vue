<template>
  <div class="page mine-page has-tabbar">

    <header class="hero">
      <div class="avatar">李</div>
      <div class="user">
        <p class="name">李木子 <span class="vip">VIP1</span></p>
        <p class="uid">手机号：138****8000</p>
      </div>
      <button class="setting tap" aria-label="设置" @click="onStub">⚙</button>
    </header>

    <section class="card-block assets">
      <button v-for="a in ASSETS" :key="a.label" class="asset tap" @click="onStub">
        <span class="asset-num">{{ a.num }}</span>
        <span class="asset-label">{{ a.label }}</span>
      </button>
    </section>

    <section class="card-block">
      <div class="row-head">
        <h2 class="block-title">我的订单</h2>
        <button class="all-orders tap" @click="onStub">全部订单 ›</button>
      </div>
      <div class="orders">
        <button v-for="o in ORDER_ENTRIES" :key="o.label" class="order-entry tap" @click="onStub">
          <span class="order-icon">
            {{ o.icon }}

            <i v-if="o.badge" class="badge">{{ o.badge }}</i>
          </span>
          <span class="order-label">{{ o.label }}</span>
        </button>
      </div>
    </section>

    <section class="card-block menu">
      <button v-for="m in MENU" :key="m.label" class="menu-row tap tap-44" @click="onStub">
        <span class="menu-icon">{{ m.icon }}</span>
        <span class="menu-label">{{ m.label }}</span>
        <span class="menu-extra">{{ m.extra }}</span>
        <span class="chevron">›</span>
      </button>
    </section>

    <section class="card-block pwa-block">
      <h2 class="block-title">装到手机桌面</h2>

      <template v-if="pwa.isStandalone.value">
        <p class="pwa-tip pwa-ok">✓ 已从桌面图标打开，当前是全屏 App 模式（无地址栏）</p>
      </template>

      <template v-else-if="pwa.canInstall.value">
        <p class="pwa-tip">安装后从桌面图标打开，全屏显示、没有地址栏，和原生 App 一样。</p>
        <button class="install-btn tap tap-44" @click="onInstall">安装到桌面</button>
      </template>

      <template v-else>
        <p class="pwa-tip" v-if="pwa.isIOS.value">
          iPhone 上：点浏览器底部的「分享」按钮 <span class="kbd">⬆︎</span> → 往下滑找到
          「添加到主屏幕」→ 点「添加」。
        </p>
        <p class="pwa-tip" v-else>
          安卓上：点浏览器右上角「⋮」菜单 → 选「添加到主屏幕」或「安装应用」。
        </p>
      </template>
    </section>

    <button class="danger tap tap-44" @click="clearCart">清空购物车</button>
  </div>
</template>

<script setup>

import { useCartStore } from '../stores/cart'
import { toast, toastOk } from '../composables/useToast'

import { canInstall, isStandalone, isIOS, promptInstall } from '../composables/usePwaInstall'

const pwa = { canInstall, isStandalone, isIOS }

const cart = useCartStore()

const ASSETS = [
  { num: '3', label: '优惠券' },
  { num: '1280', label: '积分' },
  { num: '¥0.00', label: '余额' },
  { num: '12', label: '收藏' },
]

const ORDER_ENTRIES = [
  { icon: '💰', label: '待付款', badge: 1 },
  { icon: '📦', label: '待发货', badge: 2 },
  { icon: '🚚', label: '待收货', badge: 0 },
  { icon: '↩️', label: '退款/售后', badge: 0 },
]

const MENU = [
  { icon: '📍', label: '收货地址', extra: '' },
  { icon: '🎫', label: '领券中心', extra: '3 张可用' },
  { icon: '💬', label: '联系客服', extra: '' },
  { icon: '⭐', label: '关于 MobiMall', extra: 'v1.0' },
]

function clearCart() {
  if (!cart.items.length) {
    toast('购物车已经是空的', 'warn')
    return
  }
  cart.clear()
  toast('购物车已清空')
}

function onStub() {
  toast('这是演示项目，该模块未接入', 'warn')
}

async function onInstall() {
  const result = await promptInstall()
  if (result === 'accepted') {
    toastOk('已添加到桌面，去图标打开试试')
  } else if (result === 'dismissed') {
    toast('已取消，随时可以再装', 'warn')
  } else {

    toast('请用浏览器菜单里的「添加到主屏幕」', 'warn')
  }
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

.user {
  flex: 1;
  min-width: 0;
}

.name {
  font-size: 0.16rem;
  font-weight: 600;
}

.vip {
  display: inline-block;
  margin-left: 0.06rem;
  padding: 0 0.05rem;
  border-radius: 0.04rem;
  background: #ffe9c8;
  color: #9a6a1f;
  font-size: 0.09rem;
  font-weight: 600;
  vertical-align: 0.01rem;
}

.uid {
  margin-top: 0.02rem;
  font-size: 0.11rem;
  opacity: 0.85;
}

.setting {
  width: var(--tap);
  height: var(--tap);
  color: #fff;
  font-size: 0.18rem;
}

.assets {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin: 0.1rem;
  padding: 0.12rem 0;
}

.asset {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.03rem;
  min-height: var(--tap);
  justify-content: center;
}

.asset-num {
  font-size: 0.15rem;
  font-weight: 600;
  color: var(--ink);
}

.asset-label {
  font-size: 0.11rem;
  color: var(--ink-3);
}

.card-block {
  margin: 0.1rem;
  padding: 0.14rem;
  background: var(--card);
  border-radius: var(--r);
}

.block-title {
  font-size: 0.14rem;
  font-weight: 600;
}

.row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.all-orders {
  font-size: 0.12rem;
  color: var(--ink-3);
}

.orders {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  margin-top: 0.1rem;
  padding: 0.02rem 0;
}

.order-entry {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.04rem;
  min-height: var(--tap);
}

.order-icon {
  position: relative;
  font-size: 0.2rem;
  line-height: 1;
}

.badge {
  position: absolute;
  top: -0.05rem;
  right: -0.11rem;
  min-width: 0.16rem;
  height: 0.16rem;
  padding: 0 0.03rem;
  border-radius: 0.08rem;
  background: #f43;
  color: #fff;
  font-size: 0.09rem;
  font-style: normal;
  line-height: 0.16rem;
  text-align: center;
  box-sizing: border-box;
}

.order-label {
  font-size: 0.11rem;
  color: var(--ink-2);
}

.menu {
  padding: 0 0.14rem;
}

.menu-row {
  display: flex;
  align-items: center;
  gap: 0.1rem;
  width: 100%;
  padding: 0.12rem 0;
  border-bottom: 1px solid var(--line);
  font-size: 0.13rem;
  color: var(--ink);
  text-align: left;
}

.menu-row:last-child {
  border-bottom: none;
}

.menu-icon {
  font-size: 0.16rem;
}

.menu-label {
  flex: 1;
}

.menu-extra {
  font-size: 0.11rem;
  color: var(--ink-3);
}

.chevron {
  color: #c5c5cc;
  font-size: 0.15rem;
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

.pwa-tip {
  margin: 0.06rem 0 0;
  font-size: 0.12rem;
  line-height: 1.7;
  color: var(--ink-2);
}

.pwa-ok {
  color: var(--green);
}

.install-btn {
  display: block;
  width: 100%;
  margin-top: 0.1rem;
  padding: 0.11rem 0;
  border-radius: 0.08rem;
  background: var(--brand);
  color: #fff;
  font-size: 0.14rem;
  font-weight: 600;
}

.kbd {
  display: inline-block;
  padding: 0 0.05rem;
  border: 1px solid var(--line);
  border-bottom-width: 2px;
  border-radius: 0.04rem;
  background: var(--bg);
  font-size: 0.11rem;
}
</style>
