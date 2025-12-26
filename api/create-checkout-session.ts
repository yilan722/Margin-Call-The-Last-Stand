// ==========================================
// Stripe Checkout Session API
// 用于 Vercel Serverless Functions
// ==========================================
//
// 部署说明：
// 1. 将此文件放在 /api/create-checkout-session.ts
// 2. 安装 Stripe SDK: npm install stripe @vercel/node
// 3. 设置环境变量: STRIPE_SECRET_KEY
// 4. 在 Vercel 中配置环境变量
//
// 使用方法：
// POST /api/create-checkout-session
// Body: { packageId: 'starter', userId: 'user123' }
//
// 返回: { sessionId: 'cs_xxx', url: 'https://checkout.stripe.com/...' }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

// 延迟初始化 Stripe，在 handler 中检查环境变量后再初始化
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2024-12-18.acacia',
    });
  }
  return stripeInstance;
}

// 钻石套餐配置（应该与前端保持一致）
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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 检查环境变量并初始化 Stripe
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('❌ STRIPE_SECRET_KEY is missing');
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('STRIPE')));
      return res.status(500).json({ 
        error: 'Server configuration error: STRIPE_SECRET_KEY is not set',
        details: 'Please check your .env.local file and ensure STRIPE_SECRET_KEY is configured. Restart the server after modifying .env.local.'
      });
    }

    const stripe = getStripe();
    const { packageId, userId } = req.body;

    if (!packageId || !DIAMOND_PACKAGES[packageId]) {
      return res.status(400).json({ error: 'Invalid package ID' });
    }

    const pkg = DIAMOND_PACKAGES[packageId];
    const totalDiamonds = pkg.diamonds + (pkg.bonus || 0);

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
            },
            unit_amount: Math.round(pkg.price * 100), // Stripe 使用 cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}&package_id=${packageId}`,
      cancel_url: `${req.headers.origin}/?payment=cancelled`,
      metadata: {
        packageId,
        userId: userId || 'anonymous',
        diamonds: totalDiamonds.toString(),
      },
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error);
    console.error('Error stack:', error.stack);
    console.error('Error name:', error.name);
    
    // 返回更详细的错误信息
    const errorMessage = error.message || 'Unknown error occurred';
    const errorDetails = error.details || (error.stack ? error.stack.split('\n')[0] : '');
    
    return res.status(500).json({ 
      error: errorMessage,
      details: errorDetails,
      type: error.name || 'Error'
    });
  }
}

