# Supabase 设置指南

## 📋 步骤 1：创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 注册/登录账户
3. 点击 "New Project"
4. 填写项目信息：
   - **Name**: `margin-call-game`
   - **Database Password**: 设置一个强密码（保存好！）
   - **Region**: 选择离你最近的区域
5. 等待项目创建完成（约 2 分钟）

---

## 📋 步骤 2：创建数据库表

在 Supabase Dashboard → SQL Editor 中执行以下 SQL：

```sql
-- 创建玩家表
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,  -- 从 localStorage 生成的用户ID
  time_diamonds INTEGER DEFAULT 0,
  current_cash NUMERIC DEFAULT 10000,
  current_chapter INTEGER DEFAULT 1,
  current_level INTEGER DEFAULT 1,
  current_phase INTEGER DEFAULT 1,
  equipment JSONB DEFAULT '[]',
  consumables JSONB DEFAULT '[]',
  total_diamonds_earned INTEGER DEFAULT 0,
  total_deaths INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建支付记录表（防止重复添加钻石）
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT UNIQUE NOT NULL,  -- Stripe Checkout Session ID
  package_id TEXT NOT NULL,
  diamonds INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL,  -- 'pending', 'completed', 'failed'
  stripe_event_id TEXT,  -- Stripe Webhook Event ID
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX idx_players_user_id ON players(user_id);
CREATE INDEX idx_payment_transactions_session_id ON payment_transactions(session_id);
CREATE INDEX idx_payment_transactions_user_id ON payment_transactions(user_id);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📋 步骤 3：获取 Supabase 凭证

1. 在 Supabase Dashboard → Settings → API
2. 复制以下信息：
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`（⚠️ 保密！）

---

## 📋 步骤 4：设置环境变量

在 Vercel Dashboard → Settings → Environment Variables 中添加：

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_WEBHOOK_SECRET=whsec_xxxxx  # 从 Stripe Dashboard 获取
```

---

## 📋 步骤 5：启用 Row Level Security (RLS)

在 Supabase Dashboard → Authentication → Policies：

```sql
-- 允许玩家读取自己的数据
CREATE POLICY "Players can read own data"
ON players FOR SELECT
USING (auth.uid()::text = user_id OR true);  -- 暂时允许所有读取，生产环境需要认证

-- 允许玩家更新自己的数据
CREATE POLICY "Players can update own data"
ON players FOR UPDATE
USING (auth.uid()::text = user_id OR true);  -- 暂时允许所有更新，生产环境需要认证
```

或者暂时禁用 RLS（仅用于测试）：

```sql
ALTER TABLE players DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions DISABLE ROW LEVEL SECURITY;
```

---

## ✅ 完成

现在你的 Supabase 数据库已经准备好了！

下一步：创建 Webhook 端点和前端集成。

