// ============================================================================
// 商品图映射表（36 件本地兜底商品 → 图源真实商品）
//
// 为什么抽成单独一个文件：
//   gen-seed.mjs（离线生成兜底数据）和 sync-images.mjs（联网校正地址）都要用它。
//   写两份的话，改一处漏一处，两边数据就不一致了。
//
// slug = 图源商品在 CDN 上的路径，拼出图片地址：
//   https://cdn.dummyjson.com/product-images/<slug>/1.webp
//
// title / subtitle 可选：图库里没有的商品（原来叫"机械键盘""投影仪"之类），
// 连名字带描述一起改成图库里真实存在的东西，保证"名字、描述、图片"三者一致。
// ============================================================================

export const MAP = {
  // ── 数码 ──
  p001: { slug: 'mobile-accessories/apple-airpods-max-silver' },
  p002: { slug: 'mobile-accessories/apple-iphone-charger' },
  p003: { slug: 'tablets/ipad-mini-2021-starlight', title: '轻阅 X5 平板电脑', subtitle: '8.3 英寸 · 随身图书馆 · 全天续航' },
  p004: { slug: 'mobile-accessories/apple-magsafe-battery-pack' },
  p005: { slug: 'mobile-accessories/iphone-12-silicone-case-with-magsafe-plum', title: '轻护 MagSafe 手机壳', subtitle: '液态硅胶 · 磁吸充电不摘壳' },
  p006: { slug: 'mobile-accessories/apple-homepod-mini-cosmic-grey', title: '拾音智能音箱 mini', subtitle: '360° 环绕声场 · 语音助手唤醒' },

  // ── 服饰 ──
  p007: { slug: 'mens-shirts/gigabyte-aorus-men-tshirt', title: '云朵感重磅纯棉 T 恤', subtitle: '260g 克重 · 不透不塌' },
  p008: { slug: "womens-bags/heshe-women's-leather-bag", title: '通勤真皮托特包', subtitle: '头层牛皮 · 15.6 寸笔电直入' },
  p009: { slug: "womens-dresses/black-women's-gown", title: '雾感收腰针织连衣裙', subtitle: '垂坠不贴身 · 秋冬新款' },
  p010: { slug: 'mens-shirts/man-short-sleeve-shirt' },
  p011: { slug: 'mens-shoes/nike-air-jordan-1-red-and-black' },
  p012: { slug: 'mens-shirts/blue-&-black-check-shirt', title: '复古格纹法兰绒衬衫', subtitle: '磨毛加厚 · 免烫抗皱' },

  // ── 家居 ──
  p013: { slug: 'furniture/annibale-colombo-sofa', title: '北欧布艺三人沙发', subtitle: '高回弹海绵 · 可拆洗外套' },
  p014: { slug: 'furniture/annibale-colombo-bed' },
  p015: { slug: 'home-decoration/house-showpiece-plant', title: '北欧风绿植摆件', subtitle: '仿真植物 · 免打理' },
  p016: { slug: 'furniture/bedside-table-african-cherry', title: '原木床头柜', subtitle: '小户型友好 · 静音阻尼抽屉' },
  p017: { slug: 'furniture/knoll-saarinen-executive-conference-chair', title: '北欧实木餐椅', subtitle: '曲木靠背 · 承重 150kg' },
  p018: { slug: 'home-decoration/table-lamp', title: '暖光桌面氛围灯', subtitle: '三档色温 · 触控调光' },

  // ── 食品 ──
  p019: { slug: 'groceries/honey-jar', title: '深山百花蜂蜜', subtitle: '波美度 42 · 500g 玻璃罐装' },
  p020: { slug: 'groceries/nescafe-coffee', title: '冻干黑咖啡', subtitle: '中深烘 · 零糖零脂' },
  p021: { slug: 'groceries/juice', title: 'NFC 鲜榨橙汁', subtitle: '100% 果汁 · 0 添加' },
  p022: { slug: 'groceries/protein-powder', title: '分离乳清蛋白粉', subtitle: '低脂高蛋白 · 独立量勺' },
  p023: { slug: 'groceries/strawberry', title: '当日现摘奶油草莓', subtitle: '云南空运 · 甜度 12+' },
  p024: { slug: 'groceries/chicken-meat' },

  // ── 美妆 ──
  p025: { slug: 'skin-care/olay-ultra-moisture-shea-butter-body-wash', title: '水感保湿身体乳', subtitle: '24h 长效润泽 · 敏感肌可用' },
  p026: { slug: 'skin-care/attitude-super-leaves-hand-soap', title: '氨基酸温和洁面乳', subtitle: '弱酸性 · 洗后不紧绷' },
  p027: { slug: 'beauty/red-lipstick', title: '丝绒雾面口红', subtitle: '显白不挑皮 · 三色可选' },
  p028: { slug: 'skin-care/vaseline-men-body-and-face-lotion', title: '男士清爽润肤乳', subtitle: '不粘腻 · 控油保湿' },
  p029: { slug: 'beauty/eyeshadow-palette-with-mirror', title: '大地色十二色眼影盘', subtitle: '哑光珠光 · 附镜便携' },
  p030: { slug: 'beauty/powder-canister' },

  // ── 运动 ──
  p031: { slug: 'mens-shoes/puma-future-rider-trainers' },
  p032: { slug: 'sports-accessories/basketball', title: '专业比赛篮球 7 号', subtitle: '室内外通用 · 吸湿防滑' },
  p033: { slug: 'sports-accessories/tennis-racket', title: '碳纤维网球拍', subtitle: '初学进阶两用 · 已穿线' },
  p034: { slug: 'sports-accessories/american-football', title: '美式橄榄球训练用球', subtitle: '9 号标准 · 耐磨胶皮' },
  p035: { slug: 'sports-accessories/iron-golf', title: '高尔夫七号铁杆', subtitle: '碳素杆身 · 容错率高' },
  p036: { slug: 'sports-accessories/baseball-glove', title: '棒球内场手套', subtitle: '头层牛皮 · 即买即用' },
}
