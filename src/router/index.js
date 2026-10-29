// ============================================================================
// 路由配置
//
// 为什么本项目装 vue-router（规划里明确允许的两个包之一）：
//   有 8 个页面，需要页面跳转；而且需要"从列表进详情、返回时回到原来的滚动位置"。
//   这个滚动位置恢复自己写很麻烦，路由自带 scrollBehavior 就解决了。
//
// 对比：StreamChat 只有两个页面，用 v-if 切换就够，所以没装路由。
//   面试问"你什么时候会用路由、什么时候不用"，这个取舍能说清楚就是加分。
// ============================================================================

import { createRouter, createWebHistory } from 'vue-router'

// 页面全部用懒加载：() => import(...)
// 好处：访问首页时只下载首页的代码，详情页的代码等点进去才下，
// 首屏体积小很多。这条正好能连到"性能优化"那条 JD 加分项上。
const HomeView = () => import('../views/HomeView.vue')
const CategoryView = () => import('../views/CategoryView.vue')
const CartView = () => import('../views/CartView.vue')
const MineView = () => import('../views/MineView.vue')
const SearchView = () => import('../views/SearchView.vue')
const ProductView = () => import('../views/ProductView.vue')
const OrderView = () => import('../views/OrderView.vue')
const OrderResultView = () => import('../views/OrderResultView.vue')
const NotFoundView = () => import('../views/NotFoundView.vue')

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView,
    // tab: true 表示这个页面要显示底部 Tab 栏
    meta: { tab: true, title: 'MobiMall · 首页' },
  },
  {
    path: '/category',
    name: 'category',
    component: CategoryView,
    meta: { tab: true, title: '分类' },
  },
  {
    path: '/cart',
    name: 'cart',
    component: CartView,
    meta: { tab: true, title: '购物车' },
  },
  {
    path: '/mine',
    name: 'mine',
    component: MineView,
    meta: { tab: true, title: '我的' },
  },
  {
    path: '/search',
    name: 'search',
    component: SearchView,
    meta: { title: '搜索' },
  },
  {
    path: '/product/:id',
    name: 'product',
    component: ProductView,
    meta: { title: '商品详情' },
  },
  {
    path: '/order',
    name: 'order',
    component: OrderView,
    meta: { title: '确认订单' },
  },
  {
    path: '/order/result/:no',
    name: 'order-result',
    component: OrderResultView,
    meta: { title: '下单成功' },
  },
  {
    // 兜底路由必须放最后：前面的都没匹配上才走这里
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({
  // history 模式：URL 是 /product/p001 这种，比 /#/product/p001 好看
  history: createWebHistory(),
  routes,

  /**
   * 滚动行为：这是装 vue-router 的主要原因
   *
   * savedPosition 只有浏览器前进/后退时才有值。
   * 场景：首页往下翻了 20 条 → 点进详情 → 按返回键，
   *       应当回到刚才那 20 条的位置，而不是回到顶部。
   *       不做这个，用户每看一个商品就要重新翻一遍，体验极差。
   */
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    // 新打开的页面回到顶部
    return { top: 0 }
  },
})

// 路由切换后改标题：手机上没有标签页标题，但分享和浏览器历史里会用到
router.afterEach((to) => {
  document.title = to.meta.title || 'MobiMall'
})

export default router
