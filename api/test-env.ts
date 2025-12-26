// 测试环境变量的 API 端点
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
    const stripeKeyPrefix = process.env.STRIPE_SECRET_KEY?.substring(0, 10) || 'NOT_SET';
    
    return res.status(200).json({
      success: true,
      hasStripeKey,
      stripeKeyPrefix,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('STRIPE')),
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message,
      stack: error.stack,
    });
  }
}

