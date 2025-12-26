# 🔧 支付功能修复指南

## ❌ 问题原因

你使用了 `npm run dev`（Vite），但 **Vite 不支持 Vercel Serverless Functions**，所以 `/api/create-checkout-session` 返回 404。

---

## ✅ 解决方案

### 步骤 1：停止当前服务器

按 `Ctrl+C` 停止当前的 `npm run dev` 服务器。

### 步骤 2：使用 Vercel CLI 启动

```bash
# 使用项目中的脚本
npm run dev:vercel

# 或者直接使用 npx
npx vercel dev
```

**预期输出**：
```
> Vercel CLI 32.x.x
> Ready! Available at http://localhost:3000
```

### 步骤 3：确保环境变量已配置

检查 `.env.local` 文件，确保包含：

```env
# Gemini API（已有）
GEMINI_API_KEY=PLACEHOLDER_API_KEY

# 启用真实支付（已有）
VITE_USE_REAL_PAYMENT=true

# Stripe 测试密钥（必需！）
STRIPE_SECRET_KEY=sk_test_你的测试密钥
```

---

## 🎯 快速检查清单

- [ ] 停止 `npm run dev`
- [ ] 运行 `npm run dev:vercel` 或 `npx vercel dev`
- [ ] 确认 `.env.local` 中有 `STRIPE_SECRET_KEY`
- [ ] 访问 `http://localhost:3000`
- [ ] 测试购买钻石功能

---

## 📝 两种启动方式的区别

| 方式 | 命令 | 支持 API 路由 | 用途 |
|------|------|--------------|------|
| **Vite** | `npm run dev` | ❌ 不支持 | 仅前端开发 |
| **Vercel CLI** | `npm run dev:vercel` | ✅ 支持 | 完整功能（推荐） |

---

## 🚨 如果还是 404

1. **检查 API 文件是否存在**：
   ```bash
   ls -la api/
   ```
   应该看到：
   - `create-checkout-session.ts`
   - `verify-payment.ts`

2. **检查 Vercel CLI 是否安装**：
   ```bash
   npx vercel --version
   ```

3. **查看服务器日志**：
   启动 `vercel dev` 后，查看控制台是否有错误信息。

---

## ✅ 成功后

你应该看到：
- ✅ 服务器运行在 `http://localhost:3000`
- ✅ 点击购买钻石后，跳转到 Stripe Checkout
- ✅ 使用测试卡号 `4242 4242 4242 4242` 完成支付

