# 完整支付系统实现检查清单

## ✅ 已完成

- [x] 创建 Supabase 设置指南 (`SUPABASE_SETUP.md`)
- [x] 创建 Webhook 端点 (`api/webhook.ts`)
- [x] 创建获取玩家数据 API (`api/get-player.ts`)
- [x] 创建同步玩家数据 API (`api/sync-player.ts`)
- [x] 创建 Supabase 服务工具 (`utils/supabaseService.ts`)
- [x] 修改支付服务 (`utils/paymentService.ts`)
- [x] 修改 App.tsx 集成轮询机制
- [x] 更新 package.json 添加 Supabase 依赖
- [x] 创建完整实现指南 (`PAYMENT_WITH_SUPABASE.md`)

---

## 📋 待完成步骤

### 1. 安装依赖

```bash
npm install @supabase/supabase-js
```

### 2. 设置 Supabase

按照 `SUPABASE_SETUP.md` 完成：
- [ ] 创建 Supabase 项目
- [ ] 执行 SQL 创建表
- [ ] 获取 API 密钥
- [ ] 配置 RLS（或暂时禁用）

### 3. 配置环境变量

#### Vercel 环境变量

在 Vercel Dashboard → Settings → Environment Variables 添加：

- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`（从 Stripe Dashboard 获取）

#### 前端环境变量（.env.local）

创建 `.env.local` 文件：

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`

### 4. 配置 Stripe Webhook

- [ ] 在 Stripe Dashboard 创建 Webhook 端点
- [ ] URL: `https://margin-call-the-last-stand.vercel.app/api/webhook`
- [ ] 选择事件: `checkout.session.completed`
- [ ] 复制 Signing secret 到 Vercel 环境变量

### 5. 测试

- [ ] 测试 Webhook 是否收到事件
- [ ] 测试支付流程
- [ ] 测试钻石更新
- [ ] 测试数据库同步

### 6. 部署

- [ ] 运行 `npm run build`
- [ ] 上传到 Itch.io
- [ ] 验证生产环境支付流程

---

## 🔍 调试提示

### 检查 Webhook 日志

Vercel Dashboard → Functions → `api/webhook` → Logs

### 检查数据库

Supabase Dashboard → Table Editor → `players`

### 检查前端日志

浏览器控制台查看：
- `✅ Diamonds updated from database`
- `Polling timeout, stopping diamond check`

---

## ⚠️ 注意事项

1. **Supabase Service Role Key** 是敏感信息，只能在后端使用
2. **Supabase Anon Key** 可以在前端使用，但建议配置 RLS
3. **Webhook Secret** 必须正确配置，否则 Webhook 验证会失败
4. 轮询机制会在 60 秒后停止，如果支付处理较慢可能需要调整

---

## 🎯 完成标准

所有步骤完成后，应该能够：
1. 玩家点击购买钻石
2. 新窗口打开 Stripe 支付页面
3. 支付成功后，Webhook 更新数据库
4. 游戏自动检测到钻石更新
5. 显示成功消息并更新 UI

