# Webhook 调试指南

## 问题
支付成功，但 Webhook 失败（2 个失败事件）

## 可能的原因
Stripe Webhook 需要**原始请求体**（raw body）来验证签名，但 Vercel 可能会自动解析 JSON body，导致签名验证失败。

## 已做的修复
1. ✅ 更新了 `api/webhook-neon.ts`，添加了更好的原始 body 检测
2. ✅ 添加了详细的错误日志，帮助诊断问题
3. ✅ 添加了多种 fallback 方法来获取原始 body

## 下一步：调试步骤

### 1. 重新部署到 Vercel
```bash
git add api/webhook-neon.ts vercel.json
git commit -m "Fix webhook raw body handling"
git push origin main
```

Vercel 会自动重新部署。

### 2. 查看 Vercel 日志
1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择项目 `margin-call-the-last-stand`
3. 进入 **Functions** 标签
4. 点击 `api/webhook-neon.ts`
5. 查看最近的日志，寻找：
   - `✅ Using rawBody property` 或
   - `✅ Using body as string` 或
   - `✅ Using body as Buffer` 或
   - `❌ Body has been parsed as object/JSON`

### 3. 查看 Stripe Webhook 日志
1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. 点击你的 webhook `adventurous-voyage`
3. 查看失败的 events
4. 点击失败的 event，查看：
   - **Request**：查看发送的请求详情
   - **Response**：查看服务器返回的错误信息

### 4. 测试 Webhook
在 Stripe Dashboard 中：
1. 进入 Webhook 详情页
2. 点击 **Send test webhook**
3. 选择 `checkout.session.completed` 事件
4. 查看是否成功

## 如果仍然失败

### 方案 A：检查环境变量
确保 Vercel 环境变量中：
- `STRIPE_WEBHOOK_SECRET` 是正确的（从 Stripe Dashboard 复制）
- `NEON_DATABASE_URL` 是正确的
- `STRIPE_SECRET_KEY` 是正确的

### 方案 B：检查 Webhook URL
确保 Stripe Webhook 的 URL 是：
```
https://margin-call-the-last-stand.vercel.app/api/webhook-neon
```

### 方案 C：查看详细错误
如果日志显示 `Body has been parsed as object/JSON`，说明 Vercel 自动解析了 body。

在这种情况下，我们需要：
1. 查看 Vercel 日志中的详细错误信息
2. 根据错误信息调整代码

## 常见错误信息

### "Webhook signature verification failed"
- **原因**：签名验证失败，通常是因为 body 被修改了
- **解决**：确保使用原始 body，不要解析 JSON

### "Body has been parsed as JSON"
- **原因**：Vercel 自动解析了 JSON body
- **解决**：需要配置 Vercel 保留原始 body（可能需要使用不同的方法）

### "Missing metadata"
- **原因**：Checkout Session 的 metadata 中没有 `userId`、`packageId` 或 `diamonds`
- **解决**：检查 `api/create-checkout-session.ts` 是否正确设置了 metadata

## 联系支持
如果问题仍然存在，请提供：
1. Vercel 日志中的错误信息
2. Stripe Webhook 事件详情
3. 具体的错误消息

