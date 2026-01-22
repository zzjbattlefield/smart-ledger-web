# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
# 开发
yarn dev              # 启动开发服务器 (Vite)

# 构建
yarn build            # TypeScript 编译 + 生产构建

# 代码检查
yarn lint             # ESLint 检查

# 预览生产构建
yarn preview          # 本地预览 dist 目录
```

## 架构概览

这是一个 React 记账应用前端，技术栈：React 19 + TypeScript 5 + Vite 7 + TailwindCSS 3。

### 核心模式

**状态管理 (Zustand)**
- `userStore` - 用户认证状态，token 持久化到 localStorage
- `billStore` - 账单列表、分页、筛选、CRUD 操作
- `categoryStore` - 收支分类数据缓存
- `themeStore` - 主题切换 (light/dark/system)，持久化存储

**API 层**
- `src/api/request.ts` - Axios 实例，自动注入 Bearer token，统一错误处理
- API 响应格式：`{ code: number, message: string, data: T }`，code=0 表示成功
- 401 错误自动清除 token 并跳转登录页

**路由结构**
- 认证页面 (AuthLayout)：`/login`, `/register`
- 主页面 (BasicLayout + TabBar)：`/home`, `/stats`, `/profile`
- 独立页面：`/bill/add`, `/bill/detail/:id`, `/category`
- `ProtectedRoute` 组件处理认证守卫

**主题系统**
- TailwindCSS `darkMode: 'class'` 模式
- 自定义颜色：`light-bg`, `dark-bg`, `cta-blue`, `income-green`, `expense-red`
- Dark mode 使用 OLED 纯黑 (`#000000`)

### 目录职责

| 目录 | 职责 |
|------|------|
| `api/` | API 服务，每个模块一个文件 (auth, bill, category, stats, ai) |
| `store/` | Zustand stores，封装业务逻辑和 API 调用 |
| `components/ui/` | 通用 UI 组件 (Button, Input, Dialog, Toast, Skeleton) |
| `components/bill/` | 账单相关组件 (BillItem, CategoryPicker, NumberKeypad) |
| `components/stats/` | 统计图表组件 (Recharts) |
| `layouts/` | 页面布局 (BasicLayout, AuthLayout) |
| `pages/` | 页面组件，按功能分目录 |
| `types/` | TypeScript 类型定义 |

### 约定

- 使用 Lucide React 图标，不使用 emoji
- 组件使用 Framer Motion 动画
- 金额类型为 `string` (后端返回)，使用 `formatAmount()` 格式化显示
- bill_type: `1` = 支出, `2` = 收入
- Toast 使用：`const toast = useToast()` 然后 `toast.success()` / `toast.error()`

## 环境变量

```bash
VITE_API_BASE_URL=http://localhost:8080  # 后端 API 地址
```

## 后端 API

参考 `/Users/zouzhijun/project/smart-ledger/docs/API.md` 了解完整 API 文档。
