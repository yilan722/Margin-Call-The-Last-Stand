# 完整支付系统实现指南（Stripe + Supabase）

## 📋 系统架构

```
玩家点击购买 → 新窗口打开 Stripe → 支付成功 → Stripe Webhook → Vercel API → Supabase 数据库
                                                                    ↓
游戏前端轮询检查 ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ← ←
```

---

## 🚀 完整实现步骤

### 步骤 1：设置 Supabase（已完成）

参考 `SUPABASE_SETUP.md` 文件完成 Supabase 设置。

---

### 步骤 2：安装依赖

```bash
npm install @supabase/supabase-js
```

---

### 步骤 3：配置环境变量

#### Vercel 环境变量

在 Vercel Dashboard → Settings → Environment Variables 中添加：

```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

#### 前端环境变量（.env.local）

创建 `.env.local` 文件：

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

### 步骤 4：配置 Stripe Webhook

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入 **Developers** → **Webhooks**
3. 点击 **Add endpoint**
4. 输入 Webhook URL：
   ```
   https://margin-call-the-last-stand.vercel.app/api/webhook
   ```
5. 选择事件：`checkout.session.completed`
6. 复制 **Signing secret**（以 `whsec_` 开头）
7. 添加到 Vercel 环境变量 `STRIPE_WEBHOOK_SECRET`

---

### 步骤 5：修改支付流程

#### 5.1 修改 `create-checkout-session.ts`

确保 `success_url` 指向正确的回调地址（已在代码中实现）。

#### 5.2 修改前端支付流程

在 `App.tsx` 中：
1. 用户点击购买 → 打开新窗口到 Stripe
2. 支付成功后，新窗口关闭
3. 游戏窗口开始轮询检查钻石更新
4. 检测到更新后，显示成功消息

---

### 步骤 6：测试流程

1. **测试 Webhook**：
   - 使用 Stripe CLI：`stripe listen --forward-to localhost:3000/api/webhook`
   - 或使用 Stripe Dashboard 的测试 Webhook

2. **测试支付**：
   - 使用测试卡号：`4242 4242 4242 4242`
   - 完成支付后，检查 Supabase 数据库
   - 检查游戏是否检测到钻石更新

---

## 🔍 调试

### 检查 Webhook 是否收到事件

在 Vercel Dashboard → Functions → `api/webhook` → Logs 中查看。

### 检查数据库更新

在 Supabase Dashboard → Table Editor → `players` 中查看。

### 检查前端轮询

打开浏览器控制台，查看日志：
- `✅ Diamonds updated!`
- `Polling timeout, stopping diamond check`

---

## ✅ 完成检查清单

- [ ] Supabase 项目已创建
- [ ] 数据库表已创建（`players`, `payment_transactions`）
- [ ] Vercel 环境变量已配置
- [ ] Stripe Webhook 已配置
- [ ] 依赖已安装（`@supabase/supabase-js`）
- [ ] 代码已更新
- [ ] 测试支付成功
- [ ] 钻石更新正常显示

---

## 🎯 下一步

完成所有步骤后，运行 `npm run build` 并上传到 Itch.io。

