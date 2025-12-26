# 生产环境支付功能完整实现指南

本指南将帮助你完整实现 Stripe 支付功能，从开发到生产环境的完整流程。

## 📋 目录

1. [Stripe 账户设置](#1-stripe-账户设置)
2. [后端 API 实现](#2-后端-api-实现)
3. [前端集成](#3-前端集成)
4. [支付流程处理](#4-支付流程处理)
5. [Webhook 处理（推荐）](#5-webhook-处理推荐)
6. [安全注意事项](#6-安全注意事项)
7. [测试和部署](#7-测试和部署)
8. [故障排查](#8-故障排查)

---

## 1. Stripe 账户设置

### 1.1 注册 Stripe 账户

1. 访问 [Stripe 官网](https://stripe.com)
2. 点击 "Sign up" 注册账户
3. 完成账户验证（邮箱、手机号等）

### 1.2 获取 API 密钥

1. 登录 Stripe Dashboard
2. 进入 **Developers** → **API keys**
3. 复制以下密钥：
   - **Publishable key** (pk_test_... 或 pk_live_...) - 前端使用
   - **Secret key** (sk_test_... 或 sk_live_...) - 后端使用（**绝不要暴露在前端**）

### 1.3 测试模式 vs 生产模式

- **测试模式（Test Mode）**：
  - 使用测试密钥（pk_test_、sk_test_）
  - 不会产生真实费用
  - 使用测试卡号进行测试
  - 适合开发和测试阶段

- **生产模式（Live Mode）**：
  - 使用生产密钥（pk_live_、sk_live_）
  - 会产生真实费用
  - 需要完成账户验证（身份、银行信息等）
  - 适合正式上线

---

## 2. 后端 API 实现

### 2.1 安装依赖

```bash
npm install stripe
npm install --save-dev @types/node
```

### 2.2 创建 Vercel Serverless Function

#### 文件结构

```
/api
  /create-checkout-session.ts
  /verify-payment.ts
  /webhook.ts (可选，但推荐)
```

#### 2.2.1 创建支付会话 API

创建 `/api/create-checkout-session.ts`：

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// 初始化 Stripe（使用环境变量）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

// 钻石套餐配置（与前端保持一致）
const DIAMOND_PACKAGES: Record<string, { diamonds: number; price: number; bonus?: number }> = {
  starter: { diamonds: 100, price: 0.99 },
  small: { diamonds: 250, price: 1.99, bonus: 25 },
  medium: { diamonds: 500, price: 3.99, bonus: 100 },
  large: { diamonds: 1000, price: 6.99, bonus: 250 },
  xlarge: { diamonds: 2500, price: 14.99, bonus: 750 },
  mega: { diamonds: 5000, price: 24.99, bonus: 2000 },
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { packageId, userId } = req.body;

    // 验证 packageId
    if (!packageId || !DIAMOND_PACKAGES[packageId]) {
      return res.status(400).json({ error: 'Invalid package ID' });
    }

    const pkg = DIAMOND_PACKAGES[packageId];
    const totalDiamonds = pkg.diamonds + (pkg.bonus || 0);

    // 获取用户ID（从请求中获取，或从session/cookie中获取）
    const customerId = userId || 'anonymous';

    // 创建 Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${totalDiamonds} Time Diamonds`,
              description: `Purchase ${pkg.diamonds} diamonds${pkg.bonus ? ` + ${pkg.bonus} bonus` : ''}`,
              images: [], // 可以添加产品图片
            },
            unit_amount: Math.round(pkg.price * 100), // Stripe 使用 cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || process.env.NEXT_PUBLIC_BASE_URL}/?payment=success&session_id={CHECKOUT_SESSION_ID}&package_id=${packageId}`,
      cancel_url: `${req.headers.origin || process.env.NEXT_PUBLIC_BASE_URL}/?payment=cancelled`,
      metadata: {
        packageId,
        userId: customerId,
        diamonds: totalDiamonds.toString(),
      },
      // 可选：设置客户信息
      customer_email: req.body.email, // 如果有用户邮箱
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
```

#### 2.2.2 验证支付 API

创建 `/api/verify-payment.ts`：

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID required' });
    }

    // 获取 Checkout Session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 验证支付状态
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        error: 'Payment not completed',
        payment_status: session.payment_status 
      });
    }

    // 从 metadata 获取信息
    const packageId = session.metadata?.packageId;
    const diamonds = parseInt(session.metadata?.diamonds || '0');
    const userId = session.metadata?.userId;

    if (!packageId || !diamonds) {
      return res.status(400).json({ error: 'Invalid session metadata' });
    }

    // TODO: 这里应该将钻石添加到用户的账户
    // 例如：连接到数据库，更新用户记录
    // await addDiamondsToUser(userId, diamonds);

    // 记录交易（可选，用于防止重复添加）
    // await recordTransaction(sessionId, userId, diamonds);

    return res.status(200).json({
      success: true,
      diamonds,
      packageId,
      userId,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
```

---

## 3. 前端集成

### 3.1 更新支付服务

修改 `/utils/paymentService.ts`：

```typescript
import { DIAMOND_PACKAGES, getTotalDiamonds } from './paymentConfig';

// 获取 API 基础 URL
const getApiBaseUrl = () => {
  // 开发环境使用本地，生产环境使用实际域名
  if (import.meta.env.DEV) {
    return 'http://localhost:3000'; // 或你的开发服务器地址
  }
  return window.location.origin;
};

/**
 * 创建 Stripe Checkout Session
 */
export async function createCheckoutSession(
  packageId: string,
  userId?: string
): Promise<string> {
  const pkg = DIAMOND_PACKAGES.find(p => p.id === packageId);
  if (!pkg) {
    throw new Error('Invalid package ID');
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packageId,
        userId: userId || getUserId(), // 你需要实现 getUserId()
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    return data.url; // Stripe Checkout URL
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * 验证支付并获取钻石数量
 */
export async function verifyPaymentAndAddDiamonds(
  sessionId: string,
  packageId: string
): Promise<number> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Payment verification failed');
    }

    const data = await response.json();
    return data.diamonds;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
}

/**
 * 使用 Stripe Checkout 进行支付
 */
export async function initiateStripeCheckout(
  packageId: string,
  userId?: string
): Promise<void> {
  try {
    const checkoutUrl = await createCheckoutSession(packageId, userId);
    
    // 重定向到 Stripe Checkout
    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    } else {
      throw new Error('No checkout URL returned');
    }
  } catch (error) {
    console.error('Failed to initiate checkout:', error);
    throw error;
  }
}

// 辅助函数：获取用户ID（你需要根据实际情况实现）
function getUserId(): string {
  // 方案1：从 localStorage 获取
  const profile = localStorage.getItem('timeTraderProfile');
  if (profile) {
    const parsed = JSON.parse(profile);
    return parsed.userId || 'anonymous';
  }
  
  // 方案2：生成临时ID
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  
  return userId;
}
```

### 3.2 更新 App.tsx 中的支付处理

在 `App.tsx` 中更新 `handlePurchaseDiamonds` 函数：

```typescript
// 处理钻石购买
const handlePurchaseDiamonds = async (packageId: string) => {
  try {
    // 生产环境：使用 Stripe Checkout
    await initiateStripeCheckout(packageId);
    // 支付成功后，Stripe会重定向回来，在 useEffect 中处理
  } catch (error) {
    console.error('Purchase failed:', error);
    alert(i18n.t('diamondShop.purchaseError'));
  }
};

// 处理支付成功回调（从 Stripe 重定向回来）
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  const sessionId = urlParams.get('session_id');
  const packageId = urlParams.get('package_id');

  if (paymentStatus === 'success' && sessionId && packageId) {
    // 验证支付并添加钻石
    verifyPaymentAndAddDiamonds(sessionId, packageId)
      .then(diamonds => {
        setProfile(prev => ({
          ...prev,
          timeDiamonds: prev.timeDiamonds + diamonds
        }));
        soundManager.playPurchase();
        soundManager.playDiamondEarned();
        // 清除 URL 参数
        window.history.replaceState({}, '', window.location.pathname);
        alert(`Payment successful! Added ${diamonds} diamonds to your account.`);
      })
      .catch(error => {
        console.error('Payment verification failed:', error);
        alert('Payment verification failed. Please contact support with session ID: ' + sessionId);
      });
  } else if (paymentStatus === 'cancelled') {
    // 用户取消了支付
    window.history.replaceState({}, '', window.location.pathname);
  }
}, []);
```

---

## 4. 支付流程处理

### 4.1 完整支付流程

```
1. 用户点击"购买钻石"
   ↓
2. 选择套餐
   ↓
3. 点击"购买"按钮
   ↓
4. 前端调用 /api/create-checkout-session
   ↓
5. 后端创建 Stripe Checkout Session
   ↓
6. 前端重定向到 Stripe Checkout 页面
   ↓
7. 用户完成支付
   ↓
8. Stripe 重定向回 success_url
   ↓
9. 前端检测到 payment=success 参数
   ↓
10. 前端调用 /api/verify-payment 验证支付
   ↓
11. 后端验证 session 状态
   ↓
12. 添加钻石到用户账户
   ↓
13. 前端更新 UI 显示新钻石数量
```

### 4.2 错误处理

- **支付失败**：显示错误信息，允许重试
- **支付取消**：静默处理，不显示错误
- **验证失败**：记录 session ID，提示用户联系客服

---

## 5. Webhook 处理（推荐）

使用 Webhook 可以更可靠地处理支付成功事件，不依赖用户重定向。

### 5.1 创建 Webhook 端点

创建 `/api/webhook.ts`：

```typescript
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    // 验证 webhook 签名
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 处理支付成功事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // 验证支付状态
    if (session.payment_status === 'paid') {
      const packageId = session.metadata?.packageId;
      const diamonds = parseInt(session.metadata?.diamonds || '0');
      const userId = session.metadata?.userId;

      if (packageId && diamonds && userId) {
        // TODO: 添加钻石到用户账户
        // await addDiamondsToUser(userId, diamonds);
        
        // 记录交易
        console.log(`Payment successful: User ${userId} purchased ${diamonds} diamonds (package: ${packageId})`);
      }
    }
  }

  return res.status(200).json({ received: true });
}
```

### 5.2 配置 Stripe Webhook

1. 登录 Stripe Dashboard
2. 进入 **Developers** → **Webhooks**
3. 点击 **Add endpoint**
4. 输入你的 webhook URL：`https://your-domain.com/api/webhook`
5. 选择事件：`checkout.session.completed`
6. 复制 **Signing secret**，添加到环境变量 `STRIPE_WEBHOOK_SECRET`

---

## 6. 安全注意事项

### 6.1 环境变量

**永远不要在前端代码中暴露 Secret Key！**

```env
# .env.local (本地开发)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Vercel 环境变量（生产环境）
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### 6.2 防止重复添加钻石

```typescript
// 在数据库中记录已处理的 session ID
async function recordTransaction(sessionId: string, userId: string, diamonds: number) {
  // 检查是否已处理
  const existing = await db.transactions.findOne({ sessionId });
  if (existing) {
    throw new Error('Transaction already processed');
  }
  
  // 记录交易
  await db.transactions.insertOne({
    sessionId,
    userId,
    diamonds,
    timestamp: new Date(),
  });
}
```

### 6.3 验证用户身份

```typescript
// 在生产环境中，应该验证用户身份
function getUserId(): string {
  // 方案1：从认证系统获取
  const user = getCurrentUser(); // 你的认证系统
  return user?.id || 'anonymous';
  
  // 方案2：从 session/cookie 获取
  // ...
}
```

---

## 7. 测试和部署

### 7.1 本地测试

1. 启动开发服务器：
   ```bash
   npm run dev
   ```

2. 使用 Stripe 测试卡号：
   - 成功：`4242 4242 4242 4242`
   - 需要 3D Secure：`4000 0025 0000 3155`
   - 拒绝：`4000 0000 0000 0002`

3. 测试完整流程：
   - 选择套餐
   - 完成支付
   - 验证钻石添加

### 7.2 部署到 Vercel

1. 推送代码到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量：
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`（如果使用 webhook）
   - `NEXT_PUBLIC_BASE_URL`
4. 部署

### 7.3 切换到生产模式

1. 在 Stripe Dashboard 切换到 **Live mode**
2. 获取生产密钥
3. 更新 Vercel 环境变量
4. 重新部署

---

## 8. 故障排查

### 常见问题

1. **"Invalid API Key"**
   - 检查环境变量是否正确设置
   - 确认使用的是测试/生产密钥

2. **"Webhook signature verification failed"**
   - 检查 `STRIPE_WEBHOOK_SECRET` 是否正确
   - 确认 webhook URL 配置正确

3. **支付成功但钻石未添加**
   - 检查 webhook 是否正常工作
   - 查看服务器日志
   - 验证数据库连接

4. **CORS 错误**
   - 检查 API 路由配置
   - 确认域名配置正确

---

## 📚 参考资源

- [Stripe Checkout 文档](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks 文档](https://stripe.com/docs/webhooks)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Stripe 测试卡号](https://stripe.com/docs/testing)

---

## ✅ 检查清单

- [ ] Stripe 账户已注册并验证
- [ ] API 密钥已获取并配置
- [ ] 后端 API 已实现并测试
- [ ] 前端支付流程已集成
- [ ] Webhook 已配置（推荐）
- [ ] 环境变量已设置
- [ ] 测试支付流程成功
- [ ] 生产环境已部署
- [ ] 监控和日志已设置

完成以上步骤后，你的支付功能就可以在生产环境中正常工作了！

