<template>
  <div class="page order-page">
    <header class="head">
      <button class="back tap tap-44" @click="router.back()">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 5l-7 7 7 7" />
        </svg>
      </button>
      <h1>确认订单</h1>
    </header>

    <!-- 购物车为空：直接结算页会没有任何商品，要拦一下 -->
    <div v-if="!items.length" class="empty">
      <p>没有要结算的商品</p>
      <router-link to="/" class="go-btn tap tap-44">去逛逛</router-link>
    </div>

    <template v-else>
      <!-- ─── 收货信息表单 ─── -->
      <section class="card-block">
        <h2 class="block-title">收货信息</h2>

        <label class="field">
          <span class="label">收货人</span>
          <input
            v-model.trim="form.name"
            class="input"
            :class="{ err: errors.name }"
            placeholder="请输入收货人姓名"
            @blur="checkField('name')"
          />
        </label>
        <p v-if="errors.name" class="err-tip">{{ errors.name }}</p>

        <label class="field">
          <span class="label">手机号</span>
          <input
            v-model.trim="form.phone"
            class="input"
            :class="{ err: errors.phone }"
            type="tel"
            inputmode="numeric"
            maxlength="11"
            placeholder="11 位手机号"
            @blur="checkField('phone')"
          />
        </label>
        <p v-if="errors.phone" class="err-tip">{{ errors.phone }}</p>

        <label class="field">
          <span class="label">详细地址</span>
          <textarea
            v-model.trim="form.address"
            class="input area"
            :class="{ err: errors.address }"
            rows="2"
            placeholder="省市区 + 街道门牌号，至少 6 个字"
            @blur="checkField('address')"
          ></textarea>
        </label>
        <p v-if="errors.address" class="err-tip">{{ errors.address }}</p>

        <label class="field">
          <span class="label">备注</span>
          <input v-model.trim="form.remark" class="input" placeholder="选填，比如「放门口」" />
        </label>
      </section>

      <!-- ─── 商品清单 ─── -->
      <section class="card-block">
        <h2 class="block-title">商品清单（{{ items.length }} 件）</h2>
        <div v-for="it in items" :key="it.key" class="goods">
          <img class="thumb" :src="imgSrc(it.cover)" :alt="it.title" />
          <div class="goods-info">
            <p class="goods-name clamp-2">{{ it.title }}</p>
            <span v-if="it.specText" class="goods-spec">{{ it.specText }}</span>
          </div>
          <div class="goods-right">
            <span class="goods-price">¥{{ it.unitPrice }}</span>
            <span class="goods-count">×{{ it.count }}</span>
          </div>
        </div>
      </section>

      <!-- ─── 金额 ─── -->
      <section class="card-block">
        <div class="fee-row"><span>商品金额</span><span>¥{{ goodsAmount }}</span></div>
        <div class="fee-row">
          <span>运费</span>
          <span>{{ freight === 0 ? '包邮' : `¥${freight}` }}</span>
        </div>
        <div class="fee-row total">
          <span>应付金额</span>
          <span class="total-num">¥{{ payAmount }}</span>
        </div>
        <p v-if="freight > 0" class="fee-tip">再买 ¥{{ (99 - goodsAmount).toFixed(2) }} 可免运费</p>
      </section>

      <div class="bottom-space"></div>

      <!-- ─── 底部提交栏 ─── -->
      <div class="submit-bar">
        <div class="sum">
          <span class="sum-label">应付</span>
          <span class="sum-price">¥{{ payAmount }}</span>
        </div>
        <button class="submit tap" :disabled="submitting" @click="onSubmit">
          {{ submitting ? '提交中…' : '提交订单' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
// ============================================================================
// 确认订单页（表单校验 + 提交）
//
// 校验做两层，面试能讲：
//   第一层 前端即时校验：失焦就检查，输入时给红框和中文提示，用户体验好
//   第二层 后端再校一遍：绕过页面直接调接口也拦得住（见 server/api-server.js）
// 只做前端校验等于没校验 —— 接口是公开的，别人用 curl 就能绕过页面。
//
// 金额全部由前端"显示"，但服务端会用自己的商品价格重算一遍，
// 绝不采信前端传来的价格（否则用户可以自己把价格改成 1 块钱）。
// ============================================================================

import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

import { useCartStore } from '../stores/cart'
import { imgSrc } from '../utils/format'
import { createOrder } from '../utils/request'
import { toast, toastWarn } from '../composables/useToast'

const router = useRouter()
const cart = useCartStore()

// 只结算勾选中的商品
const items = computed(() => cart.checkedItems)

const form = reactive({ name: '', phone: '', address: '', remark: '' })
const errors = reactive({ name: '', phone: '', address: '' })
const submitting = ref(false)

// ─── 金额 ──────────────────────────────────────────────────────────────────
const goodsAmount = computed(() =>
  Math.round(items.value.reduce((s, it) => s + it.unitPrice * it.count, 0) * 100) / 100
)
// 满 99 包邮，否则 8 元运费（规则跟服务端保持一致）
const freight = computed(() => (goodsAmount.value >= 99 ? 0 : 8))
const payAmount = computed(() => Math.round((goodsAmount.value + freight.value) * 100) / 100)

// ─── 校验 ──────────────────────────────────────────────────────────────────
const RULES = {
  name: (v) => (!v ? '请填写收货人姓名' : (v.length < 2 ? '姓名至少 2 个字' : '')),
  phone: (v) => (!v ? '请填写手机号' : (!/^1\d{10}$/.test(v) ? '手机号格式不对（1 开头 11 位数字）' : '')),
  address: (v) => (!v ? '请填写详细地址' : (v.length < 6 ? '详细地址至少 6 个字' : '')),
}

/** 失焦时校验单字段 */
function checkField(key) {
  errors[key] = RULES[key](form[key])
  return !errors[key]
}

/** 提交前校验全部，返回是否通过 */
function validateAll() {
  let ok = true
  // 顺序固定：按表单从上到下的顺序报错，用户能顺着改
  Object.keys(RULES).forEach((key) => {
    const pass = checkField(key)
    if (!pass && ok) {
      // 只给第一个错误项弹提示，一次弹一堆太吵
      toastWarn(errors[key])
      ok = false
    }
  })
  return ok
}

async function onSubmit() {
  if (submitting.value) return
  if (!validateAll()) return

  submitting.value = true
  try {
    const order = await createOrder({
      // 只传 id / 规格 / 数量，价格由服务端查自己的数据算
      items: items.value.map((it) => ({
        id: it.id,
        count: it.count,
        specText: it.specText,
        // 规格加价单独传，后端用"基础价 + 加价"重算单价
        specDelta: it.specDelta,
      })),
      address: { name: form.name, phone: form.phone, address: form.address },
      remark: form.remark,
    })

    // 下单成功：把已结算的商品从购物车移除，没勾选的留下
    cart.removeChecked()
    router.replace(`/order/result/${order.orderNo}`)
  } catch (e) {
    // 后端返回的错误（比如库存不足）要原样显示给用户
    toastWarn(e.message)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  // 直接粘链接进结算页但没勾选商品时，退回购物车
  if (!items.value.length) {
    toast('请先勾选要结算的商品', 'warn')
  }
})
</script>

<style scoped>
.order-page {
  background: var(--bg);
  padding-bottom: calc(0.62rem + var(--safe-bottom));
}

.head {
  display: flex;
  align-items: center;
  gap: 0.04rem;
  padding: 0.1rem 0.1rem;
  padding-top: calc(0.1rem + var(--safe-top));
  background: var(--card);
}

.head h1 {
  font-size: 0.16rem;
  font-weight: 600;
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
  margin-bottom: 0.1rem;
}

/* ─── 表单 ───────────────────────────────────────────────────────────────── */
.field {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  padding: 0.06rem 0;
  border-bottom: 1px solid var(--line);
}

.label {
  width: 0.62rem;
  flex-shrink: 0;
  font-size: 0.13rem;
  color: var(--ink-2);
}

.input {
  flex: 1;
  min-width: 0;
  /* 输入框高度做到 44px：手机上输入框太小，手指点不准、字也看不清 */
  min-height: var(--tap);
  font-size: 0.13rem;
}

.area {
  padding: 0.08rem 0;
  resize: none;
  line-height: 1.5;
}

/* 校验失败：红框 + 红字，两处都要给，只给一个不够明显 */
.input.err {
  color: var(--brand-dark);
}

.err-tip {
  padding: 0.04rem 0 0 0.7rem;
  font-size: 0.11rem;
  color: #a32d2d;
}

/* ─── 商品清单 ───────────────────────────────────────────────────────────── */
.goods {
  display: flex;
  gap: 0.08rem;
  padding: 0.08rem 0;
  border-bottom: 1px solid var(--line);
}

.thumb {
  width: 0.56rem;
  height: 0.56rem;
  flex-shrink: 0;
  border-radius: 0.06rem;
  object-fit: cover;
  background: #f0f0f3;
}

.goods-info {
  flex: 1;
  min-width: 0;
}

.goods-name {
  font-size: 0.13rem;
  line-height: 1.35;
}

.goods-spec {
  display: inline-block;
  margin-top: 0.03rem;
  font-size: 0.1rem;
  color: var(--ink-3);
}

.goods-right {
  flex-shrink: 0;
  text-align: right;
}

.goods-price {
  display: block;
  font-size: 0.13rem;
  font-weight: 700;
  color: var(--brand);
}

.goods-count {
  font-size: 0.11rem;
  color: var(--ink-3);
}

/* ─── 金额 ───────────────────────────────────────────────────────────────── */
.fee-row {
  display: flex;
  justify-content: space-between;
  padding: 0.05rem 0;
  font-size: 0.13rem;
  color: var(--ink-2);
}

.fee-row.total {
  margin-top: 0.06rem;
  padding-top: 0.1rem;
  border-top: 1px solid var(--line);
  font-size: 0.14rem;
  color: var(--ink);
  font-weight: 600;
}

.total-num {
  color: var(--brand);
  font-size: 0.18rem;
  font-variant-numeric: tabular-nums;
}

.fee-tip {
  margin-top: 0.06rem;
  font-size: 0.11rem;
  color: var(--brand);
}

/* ─── 空态 ───────────────────────────────────────────────────────────────── */
.empty {
  padding: 0.9rem 0.3rem;
  text-align: center;
  color: var(--ink-3);
  font-size: 0.14rem;
}

.go-btn {
  display: inline-block;
  margin-top: 0.18rem;
  padding: 0 0.28rem;
  border-radius: 0.22rem;
  background: var(--brand);
  color: #fff;
  font-size: 0.14rem;
  line-height: 0.4rem;
}

.bottom-space {
  height: 0.1rem;
}

/* ─── 提交栏 ─────────────────────────────────────────────────────────────── */
.submit-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  display: flex;
  align-items: center;
  gap: 0.1rem;
  padding: 0.08rem 0.12rem;
  /* ★ 安全区 ★ */
  padding-bottom: calc(0.08rem + var(--safe-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1px solid var(--line);
}

@media (min-width: 600px) {
  .submit-bar {
    left: 50%;
    right: auto;
    width: 480px;
    transform: translateX(-50%);
  }
}

.sum {
  flex: 1;
  text-align: right;
}

.sum-label {
  font-size: 0.11rem;
  color: var(--ink-3);
}

.sum-price {
  margin-left: 0.04rem;
  color: var(--brand);
  font-weight: 800;
  font-size: 0.18rem;
  font-variant-numeric: tabular-nums;
}

.submit {
  height: 0.4rem;
  padding: 0 0.24rem;
  border-radius: 0.2rem;
  background: linear-gradient(90deg, var(--brand), var(--brand-dark));
  color: #fff;
  font-size: 0.14rem;
  font-weight: 600;
}

.submit:disabled {
  opacity: 0.6;
}
</style>
