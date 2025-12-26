# 本地测试真实 Stripe 支付设置指南

## 🎯 目标

在本地开发环境中测试真实的 Stripe 支付流程，而不是使用模拟支付。

---

## 📋 设置步骤

### 步骤 1：创建环境变量文件

在项目根目录创建 `.env.local` 文件：

```env
# Stripe 测试密钥（从 Stripe Dashboard 获取）
STRIPE_SECRET_KEY=sk_test_你的测试密钥

# 本地开发服务器地址
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 启用真实支付（重要！）
VITE_USE_REAL_PAYMENT=true
```

**关键**：设置 `VITE_USE_REAL_PAYMENT=true` 来启用真实支付！

### 步骤 2：使用 Vercel CLI 启动服务器

**重要**：必须使用 `vercel dev` 而不是 `npm run dev`，因为只有 Vercel CLI 才能运行 API 路由。

```bash
# 安装 Vercel CLI（如果还没安装）
npm install -g vercel

# 启动本地服务器（支持 API 路由）
npx vercel dev
```

或者使用 npm script：

```bash
npm run dev:vercel
```

**预期输出**：
```
> Vercel CLI 32.x.x
> Ready! Available at http://localhost:3000
```

### 步骤 3：测试支付流程

1. 打开浏览器：`http://localhost:3000`
2. 进入游戏 → 打开钻石商店
3. 选择套餐 → 点击购买
4. **现在应该跳转到真实的 Stripe Checkout 页面** ✅
5. 使用测试卡号完成支付：
   - 卡号：`4242 4242 4242 4242`
   - 过期日期：`12/25`
   - CVC：`123`
   - 邮编：`12345`

---

## 🔍 验证设置

### 检查 1：环境变量

确认 `.env.local` 文件包含：
```env
VITE_USE_REAL_PAYMENT=true
STRIPE_SECRET_KEY=sk_test_...
```

### 检查 2：API 端点

访问：`http://localhost:3000/api/create-checkout-session`

应该返回 `{"error":"Method not allowed"}`（因为需要 POST 请求）

### 检查 3：控制台日志

打开浏览器 Console（F12），点击购买时应该看到：
- 没有 "Development mode: Simulating payment" 的警告
- 应该看到 API 请求发送到 `/api/create-checkout-session`

---

## ⚙️ 两种模式对比

### 模式 1：模拟支付（默认）

**配置**：
```env
VITE_USE_REAL_PAYMENT=false  # 或不设置
```

**行为**：
- ✅ 不调用真实 API
- ✅ 不产生费用
- ✅ 立即添加钻石
- ❌ 不测试真实支付流程

### 模式 2：真实支付（推荐用于测试）

**配置**：
```env
VITE_USE_REAL_PAYMENT=true
```

**行为**：
- ✅ 调用真实 Stripe API
- ✅ 跳转到 Stripe Checkout
- ✅ 完整测试支付流程
- ✅ 使用测试密钥，不产生真实费用

---

## 🐛 常见问题

### 问题 1：设置了 VITE_USE_REAL_PAYMENT=true 但还是模拟支付

**可能原因**：
1. 没有重启开发服务器
2. 环境变量未正确加载

**解决方法**：
```bash
# 停止服务器（Ctrl+C）
# 重新启动
npx vercel dev
```

### 问题 2：API 返回 404

**可能原因**：
- 使用了 `npm run dev` 而不是 `vercel dev`

**解决方法**：
```bash
# 使用 Vercel CLI
npx vercel dev
```

### 问题 3：跳转到 Stripe 但显示错误

**检查**：
1. 确认 `STRIPE_SECRET_KEY` 已设置
2. 确认使用的是测试密钥（`sk_test_...`）
3. 查看终端中的错误日志

---

## ✅ 测试检查清单

- [ ] `.env.local` 文件已创建
- [ ] `VITE_USE_REAL_PAYMENT=true` 已设置
- [ ] `STRIPE_SECRET_KEY` 已设置（测试密钥）
- [ ] 使用 `npx vercel dev` 启动服务器
- [ ] API 端点可访问
- [ ] 点击购买后跳转到 Stripe Checkout
- [ ] 使用测试卡号完成支付
- [ ] 支付成功后返回网站
- [ ] 钻石数量正确增加

---

## 🎯 快速命令

```bash
# 1. 创建 .env.local（手动创建，添加以下内容）
# VITE_USE_REAL_PAYMENT=true
# STRIPE_SECRET_KEY=sk_test_...

# 2. 启动服务器
npx vercel dev

# 3. 打开浏览器测试
# http://localhost:3000
```

完成！现在你应该可以在本地测试真实的 Stripe 支付流程了！🎉

