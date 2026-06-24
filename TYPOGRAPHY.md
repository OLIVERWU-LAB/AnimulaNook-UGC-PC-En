# 字号规范（PC 1920 + 主机端 1080P 通用）

## 设计原则

1. **PC + 主机端共用一套样式**：主机端 TV 远观，文字必须够大；PC 端近看也不显空旷
2. **基准 = 卡片标题 28px**
3. **最小字号 = 基准 × 3/4 = 21px**（任何信息都不允许低于 21px，包括元信息、时间戳、计数）

## Token 表

| Token | 字号 | 用途 |
|-------|------|------|
| `var(--fs-mega)` | 48px | 巨标题：Hero、超大数字 |
| `var(--fs-display)` | 36px | 系统总标题、Profile 名字 |
| `var(--fs-h1)` | 32px | 章节大标题 |
| `var(--fs-h2)` | **28px** ★ | 卡片标题、Tab、按钮主文字（基准） |
| `var(--fs-h3)` | 24px | 副标题、筛选标签、section 名 |
| `var(--fs-body)` | **21px** ★ | 正文 / 元信息 / 时间戳（最小允许字号） |

## Tab 样式规范

所有 Tab（一级页内 Tab、二级页 Tab、Modal 内 Tab）必须用 `.center-tabs / .center-tab` 类：

```html
<div class="center-tabs">
  <span class="center-tab active" data-tab="x">激活态</span>
  <span class="center-tab" data-tab="y">非激活<span class="red-dot"></span></span>
</div>
```

**视觉规范**：
- 字号：28px（var(--fs-h2)）
- 字体：var(--ff-title)（造字工房乐真体）
- 非激活态：暗褐色（var(--c-text-amber)）+ opacity 0.55
- 激活态：红橙色（var(--c-accent-red)）+ 加粗 + 下方红色短下划线（36×4px）
- 未读红点：右上角 8×8 圆点（`<span class="red-dot">`）

## 字体规范

| 用途 | 字体 | CSS Token |
|------|------|----------|
| 标题、按钮、Tab、品牌字 | 造字工房乐真体 | `var(--ff-title)` |
| 正文、副标题、计数、表单 | 汉仪正圆 75S/85S | `var(--ff-body)` |

## 间距规范

8px 栅格基础。常用：
- 极小 4 / 小 8 / 中 12-16 / 大 24-32 / 巨 48-64

## 颜色规范（关键 token）

- 主背景暖黄：`var(--c-bg-warm)` #FAD688
- 米色纸张：`var(--c-paper)` #FFEFC8
- 主褐文字：`var(--c-text-deep)` #6B4F24
- 强调琥珀：`var(--c-text-amber)` #AA6D23
- 红橙强调：`var(--c-accent-red)` #E97756（关闭、未读、Tab 激活）
- 绿色成功：`var(--c-accent-green)` #A8B544（筛选、对勾）

---

任何修改这套规范必须同步更新 tokens.css + 此文档。
