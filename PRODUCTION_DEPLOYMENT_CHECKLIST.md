# 🚀 生产环境部署检查清单

## ⚠️ 重要安全提示

你提供的密钥是 **生产环境密钥（Live Keys）**，会产生**真实的交易和费用**！

在部署到生产环境之前，请确保：

1. ✅ 代码已经完整测试
2. ✅ 支付流程在测试环境验证通过
3. ✅ 错误处理机制完善
4. ✅ 监控和日志已设置

---

## 📋 部署前检查清单

### 1. 代码准备

- [x] 后端 API 已实现（`/api/create-checkout-session.ts`）
- [x] 支付验证 API 已实现（`/api/verify-payment.ts`）
- [x] 前端支付服务已更新（`utils/paymentService.ts`）
- [x] 支付回调处理已实现（`App.tsx`）
- [x] 错误处理已完善

### 2. 环境变量配置

#### 本地开发（.env.local）- 使用测试密钥

```env
# 测试环境密钥（用于本地开发）
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

#### Vercel 生产环境 - 使用生产密钥

在 Vercel Dashboard 中设置：

1. 进入项目 → **Settings** → **Environment Variables**
2. 添加以下变量：

```
STRIPE_SECRET_KEY=sk_live_你的生产密钥（从 Stripe Dashboard 获取）
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

**⚠️ 重要：**
- 不要将密钥提交到 Git
- 只在 Vercel 环境变量中设置
- 确保 `.env.local` 在 `.gitignore` 中

### 3. 测试流程

#### 步骤 1：先用测试密钥测试

1. 在本地使用测试密钥测试完整流程
2. 使用 Stripe 测试卡号：`4242 4242 4242 4242`
3. 验证支付成功和钻石添加

#### 步骤 2：部署到 Vercel（使用测试密钥）

1. 在 Vercel 中先设置测试密钥
2. 部署并测试
3. 确认一切正常

#### 步骤 3：切换到生产密钥

1. 在 Vercel 中更新环境变量为生产密钥
2. 重新部署
3. 进行小额真实支付测试（如 $0.99）
4. 验证钻石正确添加

---

## 🔧 Vercel 配置步骤

### 1. 设置环境变量

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Environment Variables**
4. 添加以下变量：

| 变量名 | 值 | 环境 |
|--------|-----|------|
| `STRIPE_SECRET_KEY` | `sk_live_你的生产密钥（从 Stripe Dashboard 获取）` | Production |
| `NEXT_PUBLIC_BASE_URL` | `https://your-domain.vercel.app` | Production |

5. 点击 **Save**

### 2. 部署

```bash
# 推送代码到 GitHub
git add .
git commit -m "Ready for production deployment"
git push origin main

# Vercel 会自动部署
```

### 3. 验证部署

1. 访问部署的网站
2. 测试支付流程
3. 检查控制台日志
4. 验证钻石添加

---

## 🧪 测试建议

### 测试卡号（仅用于测试环境）

- ✅ **成功支付**: `4242 4242 4242 4242`
- ⚠️ **需要 3D Secure**: `4000 0025 0000 3155`
- ❌ **拒绝支付**: `4000 0000 0000 0002`

### 生产环境测试

1. **小额测试**：先用 $0.99 的套餐测试
2. **验证流程**：
   - 支付是否成功
   - 钻石是否正确添加
   - 错误处理是否正常
3. **监控**：检查 Stripe Dashboard 中的交易记录

---

## 🔒 安全最佳实践

1. ✅ **密钥管理**
   - 使用环境变量，不要硬编码
   - 不要提交到 Git
   - 定期轮换密钥

2. ✅ **错误处理**
   - 记录所有支付错误
   - 设置错误监控（如 Sentry）
   - 提供用户友好的错误信息

3. ✅ **监控**
   - 监控 Stripe Dashboard
   - 设置交易通知
   - 定期检查异常交易

4. ✅ **日志**
   - 记录所有支付尝试
   - 记录成功和失败的交易
   - 保护用户隐私信息

---

## 📊 监控设置

### Stripe Dashboard

1. 登录 [Stripe Dashboard](https://dashboard.stripe.com)
2. 进入 **Payments** 查看所有交易
3. 设置 **Webhooks** 接收支付事件
4. 配置 **Email notifications** 接收重要事件

### 推荐监控项

- 支付成功率
- 平均交易金额
- 失败原因分析
- 异常交易检测

---

## 🐛 故障排查

### 常见问题

1. **"Invalid API Key"**
   - 检查环境变量是否正确设置
   - 确认使用的是生产密钥（sk_live_...）
   - 重新部署

2. **支付成功但钻石未添加**
   - 检查 `/api/verify-payment` 是否正常工作
   - 查看 Vercel 函数日志
   - 检查前端回调处理

3. **CORS 错误**
   - 检查 `NEXT_PUBLIC_BASE_URL` 是否正确
   - 确认 API 路由配置正确

---

## ✅ 上线前最终检查

- [ ] 代码已测试通过
- [ ] 环境变量已正确配置
- [ ] 支付流程已完整测试
- [ ] 错误处理已完善
- [ ] 监控已设置
- [ ] 日志已配置
- [ ] 用户支持流程已准备

---

## 🎉 上线后

1. **监控**：密切关注前几笔交易
2. **支持**：准备处理用户问题
3. **优化**：根据实际使用情况优化流程
4. **备份**：定期备份交易数据

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 Stripe Dashboard 中的错误日志
2. 检查 Vercel 函数日志
3. 参考 [Stripe 文档](https://stripe.com/docs)
4. 联系 Stripe 支持

祝部署顺利！🚀

