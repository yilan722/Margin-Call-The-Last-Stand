// ==========================================
// Stripe Payment Verification API
// 用于验证支付并添加钻石
// ==========================================
//
// 部署说明：
// 1. 将此文件放在 /api/verify-payment.ts
// 2. 安装 Stripe SDK: npm install stripe
// 3. 设置环境变量: STRIPE_SECRET_KEY
//
// 使用方法：
// POST /api/verify-payment
// Body: { sessionId: 'cs_xxx' }
//
// 返回: { success: true, diamonds: 500, packageId: 'medium' }

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-02-24.acacia',
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // 添加 CORS 头（支持 Itch.io 等跨域请求）
  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  // 处理 OPTIONS 预检请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
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

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // 从 metadata 获取信息
    const packageId = session.metadata?.packageId;
    const diamonds = parseInt(session.metadata?.diamonds || '0');

    if (!packageId || !diamonds) {
      return res.status(400).json({ error: 'Invalid session metadata' });
    }

    // 这里应该将钻石添加到用户的账户
    // 你可以连接到数据库，或者使用其他存储方式
    // 例如：
    // await addDiamondsToUser(session.metadata.userId, diamonds);

    return res.status(200).json({
      success: true,
      diamonds,
      packageId,
      userId: session.metadata?.userId,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({ error: error.message });
  }
}

