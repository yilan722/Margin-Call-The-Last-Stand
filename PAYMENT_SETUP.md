# 支付系统设置指南

本游戏集成了 Stripe 支付系统，允许玩家用真实货币购买钻石。

## 📋 功能概述

- **钻石购买套餐**：6个不同价位的套餐，从 $0.99 到 $24.99
- **批量优惠**：购买越多，单价越便宜
- **安全支付**：使用 Stripe Checkout，支持信用卡、Apple Pay、Google Pay
- **即时到账**：支付成功后钻石立即添加到账户

## 💰 定价方案

| 套餐 | 基础钻石 | 赠送钻石 | 总钻石 | 价格 | 单价/钻石 |
|------|---------|---------|--------|------|-----------|
| Starter | 100 | 0 | 100 | $0.99 | $0.0099 |
| Small | 250 | 25 | 275 | $1.99 | $0.0072 |
| Medium (热门) | 500 | 100 | 600 | $3.99 | $0.0067 |
| Large (超值) | 1000 | 250 | 1250 | $6.99 | $0.0056 |
| XLarge | 2500 | 750 | 3250 | $14.99 | $0.0046 |
| Mega | 5000 | 2000 | 7000 | $24.99 | $0.0036 |

## 🚀 设置步骤

### 1. 创建 Stripe 账户

1. 访问 [Stripe 官网](https://stripe.com)
2. 注册账户（测试模式免费）
3. 获取 API 密钥：
   - 测试密钥：在 Dashboard → Developers → API keys
   - 生产密钥：切换到 Live mode 后获取

### 2. 安装依赖

```bash
npm install stripe
```

### 3. 设置环境变量

创建 `.env.local` 文件（如果还没有）：

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...  # 测试环境
# STRIPE_SECRET_KEY=sk_live_...  # 生产环境
STRIPE_PUBLISHABLE_KEY=pk_test_...  # 前端使用（可选）
```

### 4. 部署后端 API

#### 选项 A: 使用 Vercel Serverless Functions（推荐）

1. 将 `api/` 目录中的文件部署到 Vercel
2. Vercel 会自动识别 Serverless Functions
3. 在 Vercel 项目设置中添加环境变量

#### 选项 B: 使用其他后端服务

修改 `utils/paymentService.ts` 中的 API 端点：

```typescript
const API_BASE_URL = 'https://your-backend.com/api';
```

### 5. 更新前端支付服务

修改 `utils/paymentService.ts`：

```typescript
export async function createCheckoutSession(packageId: string): Promise<string> {
  const response = await fetch('/api/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      packageId,
      userId: getUserId() // 你需要实现用户ID获取
    }),
  });
  
  const data = await response.json();
  return data.url; // Stripe Checkout URL
}
```

### 6. 处理支付回调

在 `App.tsx` 中添加支付成功处理：

```typescript
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  const sessionId = urlParams.get('session_id');
  const packageId = urlParams.get('package_id');

  if (paymentStatus === 'success' && sessionId && packageId) {
    // 验证支付并添加钻石
    verifyPaymentAndAddDiamonds(sessionId, packageId).then(diamonds => {
      setProfile(prev => ({
        ...prev,
        timeDiamonds: prev.timeDiamonds + diamonds
      }));
      // 清除 URL 参数
      window.history.replaceState({}, '', window.location.pathname);
    });
  }
}, []);
```

## 🔒 安全注意事项

1. **永远不要在前端暴露 Secret Key**
   - Secret Key 只能在后端使用
   - 前端只能使用 Publishable Key（如果需要）

2. **验证支付结果**
   - 使用 Stripe Webhooks 验证支付（推荐）
   - 或者在服务器端验证 session 状态

3. **防止重复添加钻石**
   - 记录已处理的 session ID
   - 使用数据库存储交易记录

## 🧪 测试

### 测试卡号（Stripe 测试模式）

- **成功支付**：`4242 4242 4242 4242`
- **需要 3D Secure**：`4000 0025 0000 3155`
- **拒绝支付**：`4000 0000 0000 0002`

其他测试卡号：https://stripe.com/docs/testing

## 📝 开发模式

在开发环境中（`import.meta.env.DEV`），支付系统会模拟成功，直接添加钻石，无需真实支付。

## 🔗 相关文件

- `utils/paymentConfig.ts` - 定价配置
- `utils/paymentService.ts` - 支付服务
- `components/DiamondShop.tsx` - 购买界面
- `api/create-checkout-session.ts` - 创建支付会话
- `api/verify-payment.ts` - 验证支付

## 📚 参考文档

- [Stripe Checkout 文档](https://stripe.com/docs/payments/checkout)
- [Stripe API 参考](https://stripe.com/docs/api)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

