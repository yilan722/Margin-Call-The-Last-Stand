# 🔧 API 500 错误修复指南

## ❌ 问题

API 返回 500 错误，错误信息：`"A server e..."`（服务器错误页面）

## 🔍 可能的原因

1. **环境变量未加载**：Vercel dev 没有正确读取 `.env.local`
2. **Stripe 密钥无效**：密钥格式错误或已过期
3. **服务器未重启**：修改环境变量后需要重启

---

## ✅ 解决步骤

### 步骤 1：确认环境变量文件位置

确保 `.env.local` 文件在**项目根目录**（与 `package.json` 同级）：

```bash
# 检查文件是否存在
ls -la .env.local

# 应该看到类似：
# -rw-r--r--  1 user  staff  123  Jan 1 12:00 .env.local
```

### 步骤 2：检查环境变量内容

```bash
# 查看 Stripe 密钥（不显示完整内容）
cat .env.local | grep STRIPE_SECRET_KEY
```

应该看到：
```
STRIPE_SECRET_KEY=sk_live_... 或 sk_test_...
```

### 步骤 3：重启 Vercel dev 服务器

**重要**：修改 `.env.local` 后必须重启服务器！

1. **停止当前服务器**：按 `Ctrl+C`
2. **重新启动**：
   ```bash
   npm run dev:vercel
   ```
   或
   ```bash
   npx vercel dev
   ```

### 步骤 4：检查服务器日志

启动后，查看控制台输出，应该看到：
- ✅ 没有 "STRIPE_SECRET_KEY is not set" 错误
- ✅ 服务器运行在 `http://localhost:3000`

### 步骤 5：测试 API 端点

在浏览器中访问：
```
http://localhost:3000/api/create-checkout-session
```

**预期结果**：
- ✅ 返回 `{"error":"Method not allowed"}` → API 正常工作
- ❌ 返回 500 或 HTML 错误页面 → 继续排查

---

## 🚨 如果还是失败

### 方法 1：手动设置环境变量（临时测试）

在启动命令中直接设置：

```bash
STRIPE_SECRET_KEY=sk_live_你的密钥 npx vercel dev
```

### 方法 2：检查 Vercel 项目配置

如果使用 `vercel dev`，可能需要先链接项目：

```bash
npx vercel link
```

然后选择：
- **Set up and develop?** → `Y`
- **Which scope?** → 选择你的账户
- **Link to existing project?** → `N`（首次）或 `Y`（已有项目）

### 方法 3：查看详细错误日志

在浏览器 Console（F12）中查看 Network 标签：
1. 点击购买钻石
2. 查看 `/api/create-checkout-session` 请求
3. 查看 Response 内容，应该显示具体错误信息

---

## 📝 完整的 .env.local 示例

```env
# Stripe 密钥（必需）
STRIPE_SECRET_KEY=sk_live_你的生产密钥（从 Stripe Dashboard 获取）

# 启用真实支付
VITE_USE_REAL_PAYMENT=true

# Gemini API（可选）
GEMINI_API_KEY=PLACEHOLDER_API_KEY
```

---

## ✅ 验证成功

如果修复成功，你应该看到：
- ✅ 点击购买后，跳转到 Stripe Checkout 页面
- ✅ 没有 500 错误
- ✅ 可以使用测试卡号完成支付

---

## 💡 提示

- **本地测试建议使用测试密钥**：`sk_test_...` 而不是 `sk_live_...`
- **生产环境使用生产密钥**：`sk_live_...`
- **环境变量修改后必须重启服务器**

