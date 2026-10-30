import { createRouter, createWebHistory } from 'vue-router'

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

    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: '页面不存在' },
  },
]

const router = createRouter({

  history: createWebHistory(),
  routes,

  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition

    return { top: 0 }
  },
})

router.afterEach((to) => {
  document.title = to.meta.title || 'MobiMall'
})

export default router
