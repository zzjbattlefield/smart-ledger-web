# Smart Ledger Web

智能记账本 Web 前端应用，帮助用户便捷地记录和管理个人财务。

## 功能特性

- **账单管理** - 添加、查看、编辑收支记录
- **分类管理** - 自定义收入/支出分类
- **数据统计** - 可视化展示收支统计和趋势
- **用户系统** - 注册、登录、个人信息管理

## 技术栈

- **框架**: React 19 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **路由**: React Router v7
- **图表**: Recharts
- **动画**: Framer Motion
- **HTTP 客户端**: Axios

## 项目结构

```
src/
├── api/          # API 接口封装
├── components/   # 公共组件
├── hooks/        # 自定义 Hooks
├── layouts/      # 布局组件
├── pages/        # 页面组件
│   ├── auth/     # 认证页面
│   ├── bill/     # 账单页面
│   ├── category/ # 分类页面
│   ├── profile/  # 个人中心
│   └── stats/    # 统计页面
├── router/       # 路由配置
├── store/        # 状态管理
└── utils/        # 工具函数
```

## 开发指南

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 代码检查

```bash
npm run lint
```
