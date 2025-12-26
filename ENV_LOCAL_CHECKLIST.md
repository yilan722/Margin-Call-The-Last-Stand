# .env.local 配置检查清单

## ✅ 当前配置

你已经设置了：
- ✅ `VITE_USE_REAL_PAYMENT=true` - 启用真实支付

## ❌ 还需要添加

### 必需的环境变量

```env
# Stripe 测试密钥（必需！）
STRIPE_SECRET_KEY=sk_test_你的测试密钥

# 本地服务器地址（推荐）
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 📝 完整的 .env.local 文件应该是：

```env
# Gemini API（已有）
GEMINI_API_KEY=PLACEHOLDER_API_KEY

# 启用真实支付（已有）
VITE_USE_REAL_PAYMENT=true

# Stripe 测试密钥（需要添加！）
STRIPE_SECRET_KEY=sk_test_你的测试密钥

# 本地服务器地址（推荐添加）
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

---

## 🔑 如何获取 Stripe 测试密钥

1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. 确保在 **Test mode**（右上角显示 "Test mode"）
3. 复制 **Secret key**：`sk_test_...`
4. 添加到 `.env.local` 文件中

---

## ✅ 配置完成后

1. **重启开发服务器**（重要！）
   ```bash
   # 停止当前服务器（Ctrl+C）
   # 重新启动
   npx vercel dev
   ```

2. **测试支付**
   - 打开 `http://localhost:3000`
   - 进入钻石商店
   - 点击购买
   - 应该跳转到 Stripe Checkout

---

## 🎯 快速检查

- [ ] `VITE_USE_REAL_PAYMENT=true` ✅（已有）
- [ ] `STRIPE_SECRET_KEY=sk_test_...` ❌（需要添加）
- [ ] `NEXT_PUBLIC_BASE_URL=http://localhost:3000` （可选但推荐）

完成以上配置后就可以测试真实支付了！🚀

