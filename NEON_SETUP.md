# Neon 数据库设置指南

## 📋 概述

使用 Neon PostgreSQL 数据库来存储玩家数据，解决 Itch.io iframe 跨域问题。

## 🚀 设置步骤

### 1. 创建 Neon 账户和数据库

1. 访问 [Neon Console](https://console.neon.tech)
2. 注册/登录账户
3. 创建新项目
4. 复制连接字符串（Connection String）

### 2. 安装依赖

```bash
npm install @neondatabase/serverless
```

### 3. 设置环境变量

在 `.env.local` 中添加：

```env
NEON_DATABASE_URL=postgresql://user:password@host/database?sslmode=require
```

在 Vercel 环境变量中添加：
- `NEON_DATABASE_URL` = 你的 Neon 连接字符串

### 4. 创建数据库表

运行以下 SQL 在 Neon 数据库中创建表：

```sql
-- 玩家数据表
CREATE TABLE IF NOT EXISTS players (
  user_id VARCHAR(255) PRIMARY KEY,
  time_diamonds INTEGER DEFAULT 0,
  current_cash NUMERIC DEFAULT 10000,
  current_chapter INTEGER DEFAULT 1,
  current_level INTEGER DEFAULT 1,
  current_phase INTEGER DEFAULT 1,
  equipment JSONB DEFAULT '[]',
  consumables JSONB DEFAULT '[]',
  total_diamonds_earned INTEGER DEFAULT 0,
  total_deaths INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 支付记录表（防止重复添加钻石）
CREATE TABLE IF NOT EXISTS payments (
  session_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  package_id VARCHAR(50) NOT NULL,
  diamonds INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
```

### 5. API 端点

已创建以下 API 端点：
- `/api/get-player.ts` - 获取玩家数据
- `/api/update-player.ts` - 更新玩家数据
- `/api/sync-player.ts` - 同步玩家数据（从 localStorage）
- `/api/webhook.ts` - Stripe Webhook（处理支付成功）

### 6. 前端集成

修改 `App.tsx` 和 `utils/paymentService.ts` 来使用数据库。

---

## 🔄 工作流程

1. **游戏启动**：从数据库加载玩家数据（如果存在），否则使用 localStorage
2. **数据更新**：同时更新 localStorage 和数据库
3. **支付成功**：Stripe Webhook 更新数据库 → 游戏轮询数据库获取最新钻石数量

---

## 📝 注意事项

- 数据库是主要数据源，localStorage 作为缓存
- 使用 `user_id` 来标识玩家（从 localStorage 获取或生成）
- 支付通过 Webhook 处理，不依赖页面重定向

