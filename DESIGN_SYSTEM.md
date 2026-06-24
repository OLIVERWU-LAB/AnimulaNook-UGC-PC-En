# 代号Life · PC端设计规范 v4

> 适用于 `code-life-pc-v2` 项目，所有页面共用。
> 最后更新：2026-06-04

---

## 一、字号规范（PC + 主机端共用）

卡片标题 **28px** 为基准，最小字号 **21px**（28×3/4），任何信息不允许低于 21px。

| Token | 字号 | 用途 |
|-------|------|------|
| `var(--fs-mega)` | 48px | 超大标题 |
| `var(--fs-display)` | 36px | 展示级标题 |
| `var(--fs-h1)` | 32px | 一级标题（弹窗主标题） |
| `var(--fs-h2)` | 28px | 二级标题（卡片标题基准） |
| `var(--fs-h3)` | 24px | 三级标题 |
| `var(--fs-body)` | 21px | 正文（最小允许字号） |

**规则：所有字号必须用 CSS token（`var(--fs-*)`），禁止硬编码 px 值。**

---

## 二、颜色规范

| Token | 色值 | 用途 |
|-------|------|------|
| `var(--c-bg)` | `#1A1A1A` | 页面背景 |
| `var(--c-paper)` | `#FFEFC8` | 纸板背景 |
| `var(--c-paper-light)` | `#FFF6DA` | 浅纸板（弹窗/个人卡） |
| `var(--c-paper-popup)` | `#FFF8E8` | 弹窗主体色 |
| `var(--c-text-amber)` | `#B8A48A` | 暗褐文字（非激活态） |
| `var(--c-accent-red)` | `#D94F2B` | 红橙强调色（激活态/按钮） |
| `var(--c-green)` | `#9FB048` | 绿色按钮/确认 |
| `var(--c-blue)` | `#7184C2` | 蓝色按钮（创建） |
| `var(--c-yellow)` | `#B9C526` | 黄绿强调 |

---

## 三、布局规范

### 3.1 页面标准模板

所有页面必须用统一模板结构：

```
.app
  └── .top-row       ← 空 DOM，由 renderTopRow(opts) 注入
      └── .home-icon  ← 纯展示，不可点击
  └── .sidebar       ← 空 DOM，由 renderSidebar(key) 注入
  └── .main
      └── .paper-board  ← 纸板容器
          └── .cards-area ← 卡片滚动区（overflow-y:auto）
```

**规则：**
- `.sidebar` 和 `.top-row` 是空 DOM，**切勿手写内容**，否则破坏 grid layout
- `renderTopRow` 支持参数：`showFilter` / `showSort` / `showSearch` / `showHistory` / `sortLabel`
- `showHistory: true` 会在右上角插入"浏览记录"入口胶囊（仅"我的"页用）

### 3.2 纸板内边距

- `.paper-board`：上 `24px`、下 `8px`、左 `36px`（右侧留白给滚动条）
- `.cards-area`：上 `18px`、下 `16px`、左右 `24px 124px`

**原因：** `.cards-area` 是 `overflow-y:auto` 容器，会裁切超出 padding-box 的内容。18px 顶 padding 是卡片负偏移 tag + 阴影的安全区。

---

## 四、组件规范

### 4.1 Tab 样式（全局统一）

所有 Tab 必须用 `.center-tabs / .center-tab` 全局样式（统一 RP 房风格）。

| 状态 | 样式 |
|------|------|
| 非激活态 | 暗褐 `var(--c-text-amber)` + `opacity: 0.55` |
| 激活态 | 红橙 `var(--c-accent-red)` + 加粗 + 下方红色短下划线 **36×4px** |
| 未读小红点 | 8×8，class `red-dot`，定位在 `.center-tab` 右上角 |

### 4.2 小弹窗按钮配色规约（`.confirm-popup / .btn-mini`）

小弹窗按钮**只允许两种切图**：

| 按钮 | 类名 | 用途 |
|------|------|------|
| 绿色 `.btn-mini.btn-green` | 确认 / 前进 / 去做某事 |
| 红色 `.btn-mini.btn-red` | 取消 / 否定 / 退出 |

**规则：**
- 禁止使用 `.btn-yellow` 等其他配色
- 新写弹窗默认按此规约二选一
- 按钮排列顺序：**左取消(红)、右确认(绿)**

切图引用（PNG 自带形状，CSS 不再加圆角/填充）：
```css
.btn-mini.btn-green { background: url('img/btn-green-tex.png') center/cover; }
.btn-mini.btn-red   { background: url('img/btn-red-tex.png') center/cover; }
```

### 4.3 详情大弹窗规范（`.detail-popup` · v4）

**触发规则：**
- 所有家装卡片（`.card`）点击事件委托在 `assets/detail-popup.js`
- 封面图含 `card-cover-live` 视为直播间 → **直接 return，不触发弹窗**
- 否则视为家装方案 → 正常开弹窗

**API：**
```js
window.openDetailPopup({
  kind: 'dream' | 'live',
  title, author, cover, desc, created,
  played, stars, likes, commentTotal, tag, featured
})
```

**尺寸与样式：**
- 尺寸 **1080×620**（按设计稿效果图，非全屏放大版）
- 底色 `#FFF8E8` + 菱形纸纹平铺（320×320，`detail-bg-pattern.jpg`）
- 蒙层：`.modal-mask.mask-60`，tooltip 用 `.tip-mask`（22px 圆角）

**内部结构：**
- 主标题字号 **28px**（`var(--fs-h2)`）
- 右上三按钮（弹窗内右上 18/22，48×48 圆）：刷新/三点用切图 `btn-refresh.png` / `btn-dots.png`；关闭红圆 + SVG 叉
- **左 ≈42%**（封面 + 作者一行：头像 56×56 浮出封面下沿 `margin-top:-36px`，无白底卡片；关注按钮空心红描边胶囊）+ 简介在下方
- **右 1fr** 评论区
- 评论项紧凑：头像 38×38，name/text 14px，like 图标 18×18，meta 13px
- 底栏：暖黄渐变长条 **88px 高**，左侧徽章 `detail-badge.png`（80×80 居中浮出），三列统计 **上 label + 下数字**（已游玩/收藏/点赞，label 13px 含小图标，数字 26px），右侧两个按钮 **蓝色"创建"** 124×52 + **绿色"立即进入"** 124×52，字号 20px

**按钮配色：**
- 蓝色 `#8FA1D4→#7184C2`
- 绿色 `#C2D165→#9FB048`

**切图依赖（全部在 `assets/img/`，2026-06-04 v3 已就位）：**
- `detail-bg-pattern.jpg` — 菱形纸纹背景
- `like-comment-off.png` / `like-comment-on.png` — 评论区点赞
- `like-bar-off.png` / `like-bar-on.png` — 底栏点赞
- `star-bar-off.png` / `star-bar-on.png` — 底栏收藏
- `detail-badge.png` — 左下徽章
- `btn-refresh.png` / `btn-dots.png` — 右上黄按钮切图

**已挂到页面：** index / weekly / dream / mine / history / search / rp（共 7 个页面）

### 4.4 顶栏左上角 `.home-icon` 约定

- 纯展示图标，**不可点击**，无 hover / active / cursor
- 始终用 `pointer-events:none` + `aria-hidden="true"` + `alt=""`，禁止挂任何 onClick / title

### 4.5 卡片（`.card`）

- 精选 tag：文字向左偏移，`padding-left: 32px`（global.css）/ `36px`（global-3col.css）
- 封面图命名约定：`card-cover-live` = 直播间卡片，其他 = 家装方案卡片
- 卡片装饰（tag/阴影）需要 `.cards-area` 顶 padding ≥ 18px 才能完整显示，否则被 `overflow:auto` 裁切

---

## 五、字体规范

| 用途 | 字体 | 说明 |
|------|------|------|
| 主标题 | 造字工房乐真体 | 用于大标题 |
| 正文 | 汉仪正圆-85S | 用于普通文本 |
| 副标题 | 汉仪正圆-75S | 用于次要标题 |

---

## 六、动画规范

| Token | 时长 | 说明 |
|-------|------|------|
| `var(--t-fast)` | 0.18s | 快速交互响应 |
| `var(--t-normal)` | 0.3s | 标准过渡 |
| `var(--t-slow)` | 0.5s | 慢速展示 |

---

## 七、文件结构规范

```
code-life-pc-v2/
├── assets/
│   ├── css/
│   │   ├── global.css      ← 全局样式（paper-board/cards-area/Sidebar/TopRow）
│   │   ├── components.css  ← 组件样式（detail-popup/confirm-popup/buttons）
│   │   └── global-3col.css ← 三列布局覆盖
│   ├── js/
│   │   ├── shell.js        ← 渲染 Sidebar/TopRow/滚动条
│   │   └── detail-popup.js ← 详情弹窗逻辑
│   └── img/               ← 切图文件
├── index.html
├── weekly.html
├── dream.html
├── mine.html
├── history.html
├── search.html
├── rp.html
└── DESIGN_SYSTEM.md       ← 本文件
```

**CSS 引用规范：**
- 所有页面必须同时引用 `global.css` **和** `components.css`
- 每次修改 CSS/JS 后，引用处加版本号破缓存，如：`href="assets/components.css?v=4"`

---

## 八、踩坑经验（供后续开发参考）

### 8.1 布局类

- **overflow:auto 容器内的子元素负偏移/外阴影必然被裁**，要么给容器加足够 padding，要么把容器改成 `overflow:visible`（但那样就不能滚了）
- 上下 padding 不能一起死命压。下 padding 压可以（避免被切），上 padding 必须留呼吸（不然内容贴纸板边框很丑）
- 用户说"被切一刀" = 希望直接显示完整，**不是**希望加柔和过渡

### 8.2 CSS 引用类

- 项目里 CSS 文件分层时（global vs components）**一定要全 HTML 都引上**，否则跨页面样式缺失非常难排查
- 每次修改后加 `?v=N` 版本号强制破浏览器缓存

### 8.3 需求理解类

- **先要效果图！** 否则按文字理解放大 1.5x → 远超用户实际设计意图，浪费多轮迭代
- 用户说"放大"可能是口误，拿到效果图再动手

### 8.4 切图管理类

- PowerShell 单行带 `$var` + 中文路径在 cmd 里转义易丢，改成多条 `copy /Y "src" "dst"` 单命令稳定执行
- 新切图就位后，必须同步更新 `components.css` 里的引用路径

---

*本规范随项目迭代持续更新，重大变更请同步更新版本号和日期。*
