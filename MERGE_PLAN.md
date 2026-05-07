# 合并计划：checkaicode.com 代码合并

## 策略
以线上版本（/root/projects/ai-code-review/）为主干，只加不减。
线上已有的 UI 文件（page.tsx、globals.css、layout.tsx、review/page.tsx、pricing/page.tsx）不动。

## 新增文件清单

### 1. 规则引擎 + 类型定义
- **src/lib/rules/rule-engine.ts** — 从 kanban 版 rule-engine.ts 迁移，适配线上 Issue 接口
- **src/lib/review-types.ts** — 从 kanban 版迁移（Issue/ReviewResult 类型）

### 2. 认证 + 数据库
- **src/lib/auth.ts** — 替换线上版，使用 PrismaAdapter + Google/GitHub OAuth
- **src/lib/prisma.ts** — 从 kanban 版迁移（纯 PrismaClient，无 Neon adapter）
- **prisma/schema.prisma** — 从 kanban 版迁移（User/Account/Session/Review/Usage 五表）

### 3. 额度限制
- **src/lib/usage.ts** — 从 kanban 版迁移（Usage 表按天计数，5次/天免费限制）

### 4. Stripe 支付
- **src/app/api/stripe/checkout/route.ts** — 从 kanban 版迁移
- **src/app/api/stripe/webhook/route.ts** — 从 kanban 版迁移

### 5. 用户信息 API
- **src/app/api/user/route.ts** — 从 kanban 版迁移

## 修改文件清单

### src/app/api/analyze/route.ts
- 保留现有 Modal Scanner 调用逻辑（analyzeCode from @/lib/analyzer）
- 加入额度检查（checkUsageLimit / incrementUsage）
- 加入规则引擎扫描（rule-engine.analyzeCode）
- 合并两种扫描结果：Modal Scanner 结果 + 规则引擎结果
- 适配线上 Issue 类型（message → title + description）

### src/lib/auth.ts
- 当前线上版已有基础 NextAuth 配置，但无 PrismaAdapter
- 需要替换为带 PrismaAdapter 的版本（来自 kanban）

### src/app/auth/signin/actions.ts
- 当前引用 @/lib/auth，auth.ts 替换后需确认导出兼容

## 依赖关系
1. 先写 prisma/schema.prisma + src/lib/prisma.ts
2. 再写 src/lib/auth.ts（依赖 prisma）
3. 再写 src/lib/usage.ts（依赖 prisma + auth）
4. 再写 src/lib/rules/rule-engine.ts + review-types.ts
5. 再写 Stripe API 路由
6. 最后修改 analyze/route.ts（依赖以上全部）

## 验证方式
- npm run build 通过
- 无 TypeScript 编译错误
- 线上功能不中断
