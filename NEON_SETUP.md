# Neon 数据库设置指南

## 📋 概述

使用 Neon PostgreSQL 数据库来存储玩家数据，解决 Itch.io iframe 跨域问题。支付成功后，Stripe Webhook 会更新数据库，游戏通过轮询数据库来获取最新的钻石数量。

## 🚀 设置步骤

### 1. 创建 Neon 账户和数据库

1. 访问 [Neon Console](https://console.neon.tech)
2. 注册/登录账户
3. 创建新项目
4. 复制连接字符串（Connection String），格式类似：
   ```
   postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### 2. 安装依赖（已完成）

```bash
npm install @neondatabase/serverless
```

### 3. 创建数据库表

在 Neon Console 的 **SQL Editor** 中执行 `neon-schema.sql` 文件中的 SQL 语句，或直接执行：

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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_players_user_id ON players(user_id);
```

### 4. 设置环境变量

#### 本地开发（`.env.local`）

```env
NEON_DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Vercel 环境变量

在 Vercel Dashboard → Settings → Environment Variables 中添加：

- `NEON_DATABASE_URL` = 你的 Neon 连接字符串
- `STRIPE_SECRET_KEY` = 你的 Stripe Secret Key（已有）
- `STRIPE_WEBHOOK_SECRET` = Stripe Webhook 签名密钥（见下方）

### 5. 配置 Stripe Webhook

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入 **Developers** → **Webhooks**
3. 点击 **Add endpoint**
4. 输入 Webhook URL：`https://margin-call-the-last-stand.vercel.app/api/webhook-neon`
5. 选择事件：`checkout.session.completed`
6. 复制 **Signing secret**（以 `whsec_` 开头）
7. 添加到 Vercel 环境变量：`STRIPE_WEBHOOK_SECRET`

---

## 🔄 工作流程

### 支付流程

1. **用户点击购买** → 打开 Stripe Checkout
2. **用户完成支付** → Stripe 发送 Webhook 到 `/api/webhook-neon`
3. **Webhook 处理** → 更新 Neon 数据库中的钻石数量
4. **游戏轮询** → 每2秒检查一次数据库，最多30次（60秒）
5. **检测到更新** → 自动更新 UI 显示新钻石数量

### 数据同步

- **游戏启动**：从数据库加载玩家数据（如果存在）
- **数据更新**：同时更新 localStorage 和数据库
- **数据库优先**：如果数据库的钻石更多，使用数据库的值

---

## 📝 注意事项

- 数据库是主要数据源，localStorage 作为缓存
- 使用 `user_id` 来标识玩家（存储在 localStorage 中）
- 支付通过 Webhook 处理，**不依赖页面重定向**，完美解决 iframe 跨域问题
- 轮询机制会在支付成功后自动检测并更新钻石

---

## 🧪 测试

1. 完成 Neon 和 Webhook 配置
2. 在游戏中点击购买钻石
3. 完成支付
4. 等待最多60秒，游戏会自动检测并更新钻石数量
5. 查看浏览器控制台，应该看到 `✅ Diamonds updated from database` 日志

---

## 📁 相关文件

- `api/get-player-neon.ts` - 获取玩家数据 API
- `api/update-player-neon.ts` - 更新玩家数据 API
- `api/webhook-neon.ts` - Stripe Webhook 处理器
- `utils/neonService.ts` - Neon 数据库服务
- `neon-schema.sql` - 数据库表结构
