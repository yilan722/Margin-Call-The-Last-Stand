# 支付功能测试指南

## 🧪 完整测试流程

### 步骤 1：验证环境变量配置

#### 1.1 检查 Vercel 配置

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 进入你的项目 → **Settings** → **Environment Variables**
3. 确认以下变量已设置：
   - ✅ `STRIPE_SECRET_KEY` = `sk_live_...`
   - ✅ 环境选择为 **Production**

#### 1.2 检查部署状态

1. 进入 **Deployments** 标签
2. 确认最新部署状态为 **Ready** ✅
3. 如果状态不是 Ready，点击 **Redeploy**

---

### 步骤 2：测试 API 端点

#### 2.1 测试创建支付会话 API

打开浏览器，访问（替换为你的实际域名）：

```
https://your-domain.vercel.app/api/create-checkout-session
```

**预期结果**：
- 如果返回 `{"error":"Method not allowed"}` → ✅ API 正常工作（因为需要 POST 请求）
- 如果返回 404 → ❌ API 路由未正确部署

#### 2.2 使用 Postman 或 curl 测试（可选）

```bash
curl -X POST https://your-domain.vercel.app/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"packageId":"starter","userId":"test-user"}'
```

**预期结果**：
- 返回 JSON，包含 `sessionId` 和 `url`
- `url` 应该以 `https://checkout.stripe.com` 开头

---

### 步骤 3：测试完整支付流程

#### 3.1 访问网站

1. 打开你的网站：`https://your-domain.vercel.app`
2. 确认网站正常加载

#### 3.2 打开钻石商店

1. 进入游戏
2. 点击 **"黑市商店"** 或 **"购买钻石"** 按钮
3. 确认钻石商店界面正常显示

#### 3.3 选择套餐并支付

1. 选择一个套餐（建议先用最便宜的 $0.99）
2. 点击 **"购买"** 按钮
3. **预期行为**：
   - 应该跳转到 Stripe Checkout 页面
   - 页面显示支付金额和产品信息

#### 3.4 完成支付

**使用真实信用卡测试**（会产生真实费用）：

1. 在 Stripe Checkout 页面输入：
   - **卡号**: 你的真实信用卡号
   - **过期日期**: 卡上的日期
   - **CVC**: 卡背面的3位数字
   - **邮编**: 你的邮编

2. 点击 **"Pay"** 按钮

3. **预期结果**：
   - 支付成功
   - 自动重定向回你的网站
   - URL 包含 `?payment=success&session_id=...`
   - 显示成功消息
   - 钻石数量增加

---

### 步骤 4：验证支付结果

#### 4.1 检查钻石是否添加

1. 在游戏中查看钻石数量
2. 确认钻石已正确添加
3. 刷新页面，确认钻石数量持久化

#### 4.2 检查 Stripe Dashboard

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入 **Payments** 标签
3. 查看最新交易：
   - ✅ 应该看到刚才的支付记录
   - ✅ 状态应该是 **Succeeded**
   - ✅ 金额应该正确

#### 4.3 检查 Vercel 日志

1. 进入 Vercel Dashboard
2. 选择你的项目 → **Deployments**
3. 点击最新部署 → **Functions** 标签
4. 查看 API 函数日志：
   - `/api/create-checkout-session` 的日志
   - `/api/verify-payment` 的日志（如果有）
   - 确认没有错误

---

### 步骤 5：测试错误场景

#### 5.1 测试支付取消

1. 再次尝试购买
2. 在 Stripe Checkout 页面点击 **"Cancel"** 或关闭窗口
3. **预期结果**：
   - 重定向回网站
   - URL 包含 `?payment=cancelled`
   - 不显示错误信息
   - 钻石数量不变

#### 5.2 测试支付失败（可选）

如果需要测试支付失败：
1. 使用会被拒绝的卡号（需要联系 Stripe 支持获取）
2. 或使用 Stripe Dashboard 中的测试工具模拟失败

---

## ✅ 测试检查清单

### 功能测试

- [ ] 钻石商店界面正常显示
- [ ] 可以选择套餐
- [ ] 点击购买后跳转到 Stripe Checkout
- [ ] Stripe Checkout 页面显示正确金额
- [ ] 支付成功后重定向回网站
- [ ] 钻石数量正确增加
- [ ] 刷新页面后钻石数量保持不变
- [ ] 支付取消时不会报错

### 技术测试

- [ ] API 端点可访问
- [ ] 环境变量正确配置
- [ ] Vercel 部署成功
- [ ] 没有控制台错误
- [ ] Stripe Dashboard 显示交易记录
- [ ] Vercel 日志没有错误

### 安全测试

- [ ] Secret Key 没有暴露在前端代码中
- [ ] 支付验证正常工作
- [ ] 不会重复添加钻石

---

## 🐛 常见问题排查

### 问题 1：点击购买没有反应

**检查**：
1. 打开浏览器开发者工具（F12）
2. 查看 **Console** 标签是否有错误
3. 查看 **Network** 标签，检查 API 请求是否发送

**可能原因**：
- API 端点错误
- 网络问题
- 环境变量未正确配置

**解决方法**：
- 检查 `utils/paymentService.ts` 中的 API URL
- 确认环境变量已设置并重新部署

---

### 问题 2：跳转到 Stripe 但显示错误

**检查**：
1. Stripe Dashboard → **Payments** → 查看错误详情
2. Vercel 日志中的错误信息

**可能原因**：
- Secret Key 错误
- API 版本不匹配
- 金额格式错误

**解决方法**：
- 确认 Secret Key 正确
- 检查 `api/create-checkout-session.ts` 中的金额计算

---

### 问题 3：支付成功但钻石未添加

**检查**：
1. 浏览器 Console 是否有错误
2. Vercel 函数日志
3. URL 参数是否正确（`?payment=success&session_id=...`）

**可能原因**：
- 支付验证失败
- 前端回调处理错误
- Session ID 验证失败

**解决方法**：
- 检查 `App.tsx` 中的支付回调处理
- 确认 `/api/verify-payment` 正常工作
- 查看 Vercel 日志中的错误信息

---

### 问题 4：API 返回 500 错误

**检查**：
1. Vercel Dashboard → Deployments → Functions → 查看日志
2. 确认错误信息

**可能原因**：
- Secret Key 未设置或错误
- Stripe SDK 版本问题
- 代码错误

**解决方法**：
- 确认环境变量已设置
- 检查 `package.json` 中的 Stripe 版本
- 查看具体错误信息并修复

---

## 📊 测试记录表

建议记录每次测试的结果：

| 测试项 | 日期 | 结果 | 备注 |
|--------|------|------|------|
| API 端点可访问 | | ✅/❌ | |
| 支付流程正常 | | ✅/❌ | |
| 钻石正确添加 | | ✅/❌ | |
| 支付取消处理 | | ✅/❌ | |
| Stripe Dashboard 记录 | | ✅/❌ | |

---

## 🎯 快速测试步骤（5分钟）

1. ✅ 访问网站，打开钻石商店
2. ✅ 选择 $0.99 套餐
3. ✅ 点击购买，确认跳转到 Stripe
4. ✅ 完成支付（使用真实信用卡）
5. ✅ 确认返回网站并显示成功
6. ✅ 检查钻石数量是否增加
7. ✅ 检查 Stripe Dashboard 中的交易记录

如果以上步骤都成功，说明支付功能正常工作！🎉

---

## 📞 需要帮助？

如果遇到问题：

1. **查看日志**：
   - 浏览器 Console（F12）
   - Vercel Functions 日志
   - Stripe Dashboard

2. **检查配置**：
   - 环境变量是否正确
   - API 端点是否正确
   - 代码是否有错误

3. **联系支持**：
   - Stripe 支持：https://support.stripe.com
   - Vercel 支持：https://vercel.com/support

祝测试顺利！🚀

