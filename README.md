# MobiMall · 移动端 H5 商城

> 一句话：手机浏览器里能逛能买的一套商城流程，真机走通。
>
> 这个项目不是为了"卖东西"，是为了补 JD 加分项里最空白的一条：
> **「有移动端页面开发经验」**。

---

## 一、先看清楚：它对准 JD 哪一条

| JD 加分项 | 之前 | 靠这个项目补 |
| --- | --- | --- |
| 了解 Vue 等一种或多种 | ✅ 有 | — |
| **有移动端页面开发经验** | ❌ 空白 | ✅ 就是它 |
| 有页面性能优化经验 | ❌ 空白 | PhotoFeed 补 |
| 会用 AI 大模型 | ✅ StreamChat | — |

三个项目分工（面试官问"有什么区别"照这三句答）：

- **AdminHub** 解决「重复劳动」：一堆增删改查怎么抽成组件
- **MobiMall** 解决「小屏体验」：手机上怎么看得清、点得动、流程走得通
- **PhotoFeed** 解决「数据量」：东西多了怎么不卡，而且能量出数字

---

## 二、界面长什么样

```
底部四个 Tab：  首页 / 分类 / 购物车 / 我的

首页      吸顶搜索框 → 轮播图 → 六宫格分类 → 排序（综合/销量/价格）→ 两列商品瀑布流
          ↓ 下拉刷新（三态文案）  ↓ 上拉加载更多
分类页    左侧竖排分类栏 + 右侧商品列表（跟首页刻意做得不一样）
搜索页    防抖搜索 + 历史记录 + 热门词
详情页    图片轮播 → 价格（切规格会变）→ 规格选择 → 数量 → 加入购物车 / 立即购买
购物车    勾选 / 改数量 / 删除 / 全选 / 合计
下单页    收货信息表单（两层校验）+ 商品清单 + 运费 + 提交
结果页    订单号 / 收货信息 / 实付金额
我的      低端机降级开关 + 设备判定依据（面试演示用）
```

---

## 三、简历上能写的六条（照抄，数字都是真的）

```
移动端 H5 商城 MobiMall（Vue3 + Vite + Node）            独立开发
在线体验：xxx  源码：xxx
· 移动端适配：rem/vw 基准 + 断点栅格 + clamp() 流式字号，
  100dvh 与安全区处理，可点区域最小 44px，真机全流程验收
· 自主实现下拉刷新与上拉加载更多：触摸事件 + 节流，三种状态文案齐全
· 图片懒加载 + 固定宽高消除布局抖动（CLS）
· 低端机动效降级：关毛玻璃与渐变动画，prefers-reduced-motion 兜底
```

> ⚠️ 手册模板里写的"图片懒加载 + WebP"我改成了"图片懒加载 + 固定宽高消除 CLS"。
> 原因：本项目图片是**代码生成的 SVG**（矢量、1KB 左右、无版权风险、断网也能跑），
> 比 WebP 还小，所以没有再转 WebP。说 WebP 但实际上是 SVG，被追问"你怎么转的"会穿帮。
> **简历上只写你真做了的。**

---

## 四、六个技术点分别在哪（面试前按这个顺序看一遍）

| 技术点 | 文件 | 一句话说明 |
| --- | --- | --- |
| 适配基准 | `src/style.css` | `html { font-size: calc(100vw / 3.75) }`，375px 屏上 1rem = 100px，超过 480px 封顶 |
| 流式字号 | `src/style.css` / `ProductCard.vue` | 价格等关键文字用 `clamp(15px, 4.2vw, 19px)`，rem 基准之外的第二道保险 |
| 断点栅格 | `CategoryGrid.vue` / `Waterfall.vue` | 分类九宫格 4 列、≤320px 降 3 列；瀑布流按容器宽度 1/2/3 列 |
| 视口与安全区 | `src/style.css` / `TabBar.vue` | `100dvh` 解决地址栏吞高度；`env(safe-area-inset-bottom)` 避开 iPhone 底部横条 |
| 触摸反馈 | `src/style.css` | 所有 `:hover` 都补 `:active`，`--tap: 0.44rem` 保证最小点击区 |
| 下拉刷新 / 上拉加载 | `src/components/PullRefresh.vue` | 手写触摸事件 + 节流，三态文案，阻尼 0.45 |
| 图片策略 | `src/components/LazyImg.vue` | IntersectionObserver（提前 300px）+ 占位渐变 + `aspect-ratio` 固定坑位 |
| 低端机降级 | `src/composables/useDeviceTier.js` | CPU/内存/DPR/省流模式判定，自动加 `.low-end` 关掉毛玻璃和动画 |

### 低端机降级：这条最值钱

面试官问"移动端踩过什么坑"，最普通的答案是"我做了媒体查询"（谁都会），
最值钱的答案是：

> "我在低端安卓上发现毛玻璃 `backdrop-filter` 和大面积渐变动画会把滚动拖到 20 帧，
> 所以做了设备分级：CPU ≤ 4 核、内存 ≤ 4GB、DPR ≥ 3 或用户开了省流模式，
> 自动关掉这些效果。『我的』页有个开关可以现场切换，上面还列了当前机器的判定依据。"

只有真在真机上跑过的人才说得出这种话。页面上直接能演示，比口头描述有说服力得多。

---

## 五、怎么跑起来

完整步骤见 **`运行步骤.txt`**（纯文本，每条命令后面带 `#` 注释，可直接粘 OneNote）。

最快路径：

```bash
npm install      # 装依赖，只做一次
npm run seed     # 生成商品数据和图片，只做一次
npm run serve    # 窗口一：后端 3002
npm run dev      # 窗口二：前端 5174
```

或者只开一个窗口（打包模式，适合给手机看）：

```bash
npm run build
npm run serve    # 打开 http://localhost:3002/
```

双击党：`start-backend.bat` / `start-web.bat` / `build.bat`
（这三个文件里全是英文注释，不是偷懒——Windows cmd 读中文会乱码。）

### Phone testing（真机验收）

1. 电脑手机连同一个 WiFi
2. `ipconfig` 查电脑的 IPv4，比如 `192.168.1.23`
3. 手机浏览器打开 `http://192.168.1.23:3002/`（打包模式）或 `:5174/`（开发模式）

> 只按 F12 切手机模式不算验收。安全区、地址栏收起、触摸反馈、键盘弹起，
> 这四样模拟器里跟真机都不一样。

### Install to home screen（装到手机桌面，类 App 体验）

配置了完整的 PWA 三件套：`public/manifest.webmanifest`（应用清单）、
`public/icons/`（`npm run icons` 代码生成的 4 张 PNG，无版权）、`public/sw.js`
（Service Worker，**仅生产环境注册**，见 `src/main.js`，开发模式注册缓存会捣乱）。

- Android（Chrome/Edge）：菜单「添加到主屏幕」/「安装应用」，或商城「我的」页点「安装到桌面」
  （触发 `beforeinstallprompt`，代码在 `src/composables/usePwaInstall.js`）
- iOS：Safari 分享 → 「添加到主屏幕」（微信内打开无效，iOS 必须用 Safari）
- 装完从桌面图标打开 = 全屏 standalone 模式，无地址栏，观感与原生 App 一致
- SW 缓存策略：`/api/*` 永远走网络（价格库存不能是旧的）；静态资源缓存优先
  （文件名带 hash，绝对安全）；改了要缓存的文件记得把 `sw.js` 里的 `VERSION` +1

---

## 六、及格线（逐条打勾）

- [ ] 手机浏览器从头走到尾：**逛 → 搜 → 详情 → 加购 → 下单**
- [ ] 下拉刷新三态文案都对（下拉可以刷新 / 松手立即刷新 / 正在刷新…）
- [ ] 上拉到底自动加载，底部出现"正在加载…"，到底显示"没有更多了"
- [ ] 详情页切规格，价格跟着变
- [ ] 加购后底部 Tab 角标 +1
- [ ] 下单页手机号填错有中文报错，填对能跳"下单成功"
- [ ] 断网 / 关掉后端 → 列表显示错误态 + 重试按钮
- [ ] 搜索一个不存在的词 → 显示空态而不是白屏
- [ ] 横屏竖屏都不崩
- [ ] 「我的」页开关"流畅模式"，毛玻璃变实色
- [ ] 录一段 60 秒真机竖屏视频存着（面试能直接放）

---

## 七、工程约定（跟另外两个项目一致）

| 项 | 做法 | 原因 |
| --- | --- | --- |
| 端口 | 3002（AdminHub 3001 / PhotoFeed 3003） | 三个项目同时跑不打架 |
| 后端 | Node 原生 `http`，**零第三方依赖** | 少一个包少一个安装失败 |
| 存储 | JSON 文件放项目自己的 `data/` | 自包含，拷走就能跑 |
| 样式 | 原生 CSS + CSS 变量，**不装 UI 库** | 装了就讲不清实现原理 |
| 允许装的包 | `vue` / `vite` / `@vitejs/plugin-vue` / `vue-router` / `pinia` | 其余一律不装 |
| 图片 | 代码生成 SVG，存 `public/img/` | 无版权、不外链、断网能跑 |
| `.bat` | 纯 ASCII | cmd 读中文会乱码 |
| 注释 | 全量中文，写"为什么" | 面试能照着讲 |

### 为什么装 vue-router 和 pinia

- **vue-router**：8 个页面要跳转，而且需要"从列表进详情、返回时回到原滚动位置"
  （`scrollBehavior` 里的 `savedPosition`）。对比 StreamChat 只有两页所以没装——
  面试问"你什么时候用路由什么时候不用"，这个取舍能说清楚就是加分。
- **pinia**：购物车要跨四个页面共享（详情加购、购物车改数量、Tab 角标、下单页读选中项）。

### 数据从哪来

36 件手写商品，分类 / 价格 / 库存 / 规格 / 销量互相自洽，打开像一套正在用的商城。
改数据：编辑 `scripts/gen-seed.mjs` 然后 `npm run seed`。

> 原则是"数据是壳，框架才是要卖的东西"。真实商品数据只有公司业务系统里才有，
> 面试官看的是适配方案搭得对不对、组件抽得干不干净。

---

## 八、目录结构

```
MobiMall/
├─ data/
│  ├─ products.json        商品数据（npm run seed 生成）
│  └─ orders.json          订单（运行时写入）
├─ public/img/             117 张 SVG（npm run seed 生成）
├─ scripts/
│  └─ gen-seed.mjs         商品数据 + 图片生成脚本
├─ server/
│  └─ api-server.js        后端：Node 原生 http，零依赖
├─ src/
│  ├─ style.css            ★ 移动端适配底座（最值钱的文件）
│  ├─ main.js
│  ├─ App.vue
│  ├─ router/index.js      路由 + 滚动位置恢复
│  ├─ stores/cart.js       购物车（Pinia + localStorage 持久化）
│  ├─ composables/
│  │  ├─ useProductList.js 列表四态 + 分页 + 上拉加载
│  │  ├─ useDeviceTier.js  ★ 低端机识别与降级
│  │  └─ useToast.js       轻提示
│  ├─ components/
│  │  ├─ PullRefresh.vue   ★ 下拉刷新（手写）
│  │  ├─ LazyImg.vue       ★ 图片懒加载 + 防抖动
│  │  ├─ Waterfall.vue     瀑布流（JS 算列高）
│  │  ├─ ProductCard.vue
│  │  ├─ SearchBar.vue     吸顶搜索 + 防抖
│  │  ├─ BannerSwiper.vue  轮播（手写，不装 swiper）
│  │  ├─ CategoryGrid.vue
│  │  ├─ StateView.vue     加载/空/错误/正常四态
│  │  └─ TabBar.vue
│  └─ views/               8 个页面
├─ 运行步骤.txt            ★ 纯文本运行步骤
├─ start-backend.bat
├─ start-web.bat
└─ build.bat
```

---

## 九、部署时必改的三处（照抄不会踩坑）

1. `server/api-server.js`：`const PORT = process.env.PORT || 3002`
2. `server/api-server.js`：`server.listen(PORT, '0.0.0.0', ...)` —— 少了 `'0.0.0.0'` 外部一律连不上
3. 启动命令：`npm run build && PORT=${PORT:-3002} node server/api-server.js`

这个项目不调大模型，所以**没有密钥**，不用做 BYOK 和上线前密钥扫描，比 StreamChat 省一半步骤。

---

## 十、已知的取舍（被问到能答上来）

1. **图片用 SVG 不用 WebP**：矢量、更小、无版权、断网能跑。代价是不是真实照片，
   但商城的核心是流程，不是图。
2. **下拉刷新自己写不装 better-scroll**：现成库会接管整个滚动，
   吸顶、锚点、无障碍全要重新适配；自己写只接管"顶部下拉"这一个手势。
3. **轮播自己写不装 swiper**：一个轮播库动辄 40KB+，自己写不到 80 行。
   首屏省 40KB，3G 下约省 1 秒。
4. **不引 UI 库**：用了就讲不清表格和表单怎么实现的。
5. **人为延迟 120ms**：`server/api-server.js` 里的 `MOBI_DELAY`。
   本地接口 1ms 就返回，"正在刷新"一闪而过看不到，加一点延迟才验收得了。
   想关掉：`MOBI_DELAY=0 npm run serve`。
