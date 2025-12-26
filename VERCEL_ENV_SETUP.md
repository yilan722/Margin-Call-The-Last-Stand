# Vercel 环境变量配置指南

## 🚨 重要：生产环境密钥

你提供的密钥是 **生产环境密钥（Live Keys）**，会产生**真实的交易和费用**！

---

## 📝 在 Vercel 中配置环境变量

### 步骤 1：登录 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 登录你的账户

### 步骤 2：选择项目

1. 找到你的项目 "margin-call-the-last-stand"
2. 点击进入项目

### 步骤 3：设置环境变量

1. 点击顶部菜单的 **"Settings"**
2. 在左侧菜单选择 **"Environment Variables"**
3. 添加以下变量：

#### 变量 1：Stripe Secret Key

- **Name**: `STRIPE_SECRET_KEY`
- **Value**: `sk_live_你的生产密钥（从 Stripe Dashboard 获取）`
- **Environment**: 选择 **"Production"** ✅
- 点击 **"Save"**

#### 变量 2：Base URL（可选，但推荐）

- **Name**: `NEXT_PUBLIC_BASE_URL`
- **Value**: `https://your-domain.vercel.app`（替换为你的实际域名）
- **Environment**: 选择 **"Production"** ✅
- 点击 **"Save"**

### 步骤 4：重新部署

1. 进入 **"Deployments"** 标签
2. 点击最新部署右侧的 **"..."** 菜单
3. 选择 **"Redeploy"**
4. 或者推送新代码触发自动部署

---

## ⚠️ 安全注意事项

1. ✅ **不要将密钥提交到 Git**
   - 确保 `.env.local` 在 `.gitignore` 中
   - 永远不要在代码中硬编码密钥

2. ✅ **只在 Vercel 环境变量中设置**
   - 生产密钥只应该在 Vercel 的 Production 环境中
   - 开发环境使用测试密钥

3. ✅ **测试环境配置**
   - 在 Vercel 中也可以添加测试密钥到 **"Preview"** 环境
   - 使用 `sk_test_...` 作为测试密钥

---

## 🧪 测试建议

### 部署前测试

1. **先用测试密钥测试**：
   - 在本地使用测试密钥（`sk_test_...`）
   - 使用测试卡号 `4242 4242 4242 4242` 测试
   - 确认支付流程正常

2. **部署后测试**：
   - 先用测试密钥部署到 Vercel
   - 测试完整流程
   - 确认无误后再切换到生产密钥

3. **生产环境测试**：
   - 切换到生产密钥后
   - 先用最小金额（$0.99）测试
   - 验证钻石正确添加
   - 检查 Stripe Dashboard 中的交易记录

---

## 📊 验证配置

部署后，检查以下内容：

1. ✅ API 端点可访问：
   - `https://your-domain.vercel.app/api/create-checkout-session`
   - `https://your-domain.vercel.app/api/verify-payment`

2. ✅ 支付流程正常：
   - 点击购买钻石
   - 能够跳转到 Stripe Checkout
   - 支付成功后能正确添加钻石

3. ✅ 错误处理正常：
   - 支付取消时不会报错
   - 支付失败时有友好提示

---

## 🔍 故障排查

如果遇到问题：

1. **检查 Vercel 日志**：
   - 进入 Vercel Dashboard → Deployments
   - 点击部署 → Functions 标签
   - 查看 API 函数的日志

2. **检查环境变量**：
   - 确认变量名正确（大小写敏感）
   - 确认值完整（没有多余空格）
   - 确认环境选择正确（Production）

3. **检查 Stripe Dashboard**：
   - 登录 Stripe Dashboard
   - 查看 Payments 标签
   - 检查是否有错误日志

---

## ✅ 完成检查清单

- [ ] 环境变量已在 Vercel 中设置
- [ ] 使用 Production 环境
- [ ] 已重新部署
- [ ] 测试支付流程
- [ ] 验证钻石添加
- [ ] 检查错误处理
- [ ] 监控 Stripe Dashboard

完成以上步骤后，你的支付功能就可以在生产环境中正常工作了！🎉

