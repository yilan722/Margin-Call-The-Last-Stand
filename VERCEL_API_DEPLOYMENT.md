# Vercel API 部署说明

## 📋 Vercel 上部署的 API

你的项目在 Vercel 上部署了 **3 个 Serverless Functions**（API 端点）：

### 1. `/api/create-checkout-session`
- **功能**：创建 Stripe 支付会话
- **方法**：POST
- **用途**：当玩家点击购买钻石时调用
- **返回**：Stripe Checkout URL

### 2. `/api/verify-payment`
- **功能**：验证支付是否成功
- **方法**：POST
- **用途**：支付完成后验证并返回钻石数量
- **返回**：钻石数量

### 3. `/api/test-env`
- **功能**：测试环境变量配置
- **方法**：GET
- **用途**：检查 Stripe 密钥是否配置正确
- **返回**：环境变量状态

---

## ❌ 当前问题：CORS 错误

错误信息：
```
Access to fetch at 'https://margin-call-the-last-stand.vercel.app/api/create-checkout-session' 
from origin 'https://html-classic.itch.zone' has been blocked by CORS policy
```

**原因**：Vercel 上的代码还没有更新，缺少 CORS 配置。

---

## ✅ 解决方案：重新部署到 Vercel

### 方法 1：通过 Git 推送（推荐）

如果你已经连接了 Git 仓库：

```bash
# 1. 提交更改
git add .
git commit -m "Add CORS support for Itch.io"
git push origin main
```

Vercel 会自动检测并部署。

### 方法 2：使用 Vercel CLI

```bash
# 1. 安装 Vercel CLI（如果还没安装）
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署到生产环境
vercel --prod
```

### 方法 3：通过 Vercel Dashboard

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 找到你的项目
3. 点击 **"Redeploy"** 或 **"Deploy"**
4. 选择最新的 Git 提交

---

## 🔍 验证部署是否成功

部署完成后，测试 CORS：

```bash
# 测试 OPTIONS 预检请求
curl -X OPTIONS \
  -H "Origin: https://html-classic.itch.zone" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v https://margin-call-the-last-stand.vercel.app/api/create-checkout-session
```

应该看到 `Access-Control-Allow-Origin` 头。

---

## 📝 检查清单

- [ ] 代码已更新（CORS 配置已添加）
- [ ] 已推送到 Git 或使用 Vercel CLI 部署
- [ ] Vercel 部署完成
- [ ] 测试 API 端点是否正常
- [ ] 在 Itch.io 上测试支付功能

---

## 🚀 快速部署命令

```bash
# 提交并推送
git add .
git commit -m "Fix CORS for Itch.io"
git push origin main

# 或者直接部署
npx vercel --prod
```

