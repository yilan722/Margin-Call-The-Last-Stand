// ==========================================
// Stripe Webhook Handler (Neon)
// 处理 Stripe 支付成功事件并更新 Neon 数据库
// ==========================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

// 延迟初始化 Stripe
let stripeInstance: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeInstance) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not set');
    }
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2025-02-24.acacia',
    });
  }
  return stripeInstance;
}

function getNeonClient() {
  const databaseUrl = process.env.NEON_DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('NEON_DATABASE_URL is not set');
  }
  return neon(databaseUrl);
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET is not set');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  const sig = req.headers['stripe-signature'] as string;

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  // 关键：在 Vercel Serverless Functions 中获取原始 body
  // Stripe webhook 需要原始 body 字符串来验证签名
  // 如果 body 被解析为对象，签名验证会失败
  let rawBody: string;
  
  const bodyType = typeof req.body;
  const contentType = req.headers['content-type'] || '';
  
  console.log('📋 Request info:', {
    bodyType,
    contentType,
    hasRawBody: !!(req as any).rawBody
  });
  
  // 方法 1: 如果 body 是字符串，直接使用（这是最理想的情况）
  if (typeof req.body === 'string') {
    rawBody = req.body;
    console.log('✅ Using body as string (raw), length:', rawBody.length);
  }
  // 方法 2: 如果 body 是 Buffer，转换为字符串
  else if (Buffer.isBuffer(req.body)) {
    rawBody = req.body.toString('utf8');
    console.log('✅ Using body as Buffer, converted to string, length:', rawBody.length);
  }
  // 方法 3: 检查是否有 rawBody 属性
  else if ((req as any).rawBody) {
    if (typeof (req as any).rawBody === 'string') {
      rawBody = (req as any).rawBody;
      console.log('✅ Using rawBody property (string), length:', rawBody.length);
    } else if (Buffer.isBuffer((req as any).rawBody)) {
      rawBody = (req as any).rawBody.toString('utf8');
      console.log('✅ Using rawBody property (Buffer), length:', rawBody.length);
    } else {
      console.error('❌ rawBody exists but is not string or Buffer');
      return res.status(400).json({ error: 'Invalid rawBody type' });
    }
  }
  // 方法 4: 如果 body 是对象，说明 Vercel 自动解析了 JSON
  // 这种情况下，我们无法恢复原始字符串，签名验证会失败
  else if (typeof req.body === 'object' && req.body !== null) {
    console.error('❌ CRITICAL ERROR: Body was parsed as object/JSON');
    console.error('Vercel automatically parsed the JSON body.');
    console.error('This breaks Stripe signature verification because we need the raw body.');
    console.error('Solution: We need to configure Vercel to NOT parse the body.');
    
    return res.status(400).json({ 
      error: 'Body parsing issue',
      message: 'Request body was parsed as JSON, but Stripe webhook requires raw body for signature verification.',
      details: {
        bodyType,
        contentType,
        suggestion: 'In Vercel Serverless Functions, the body is automatically parsed when Content-Type is application/json. We need to prevent this.'
      }
    });
  } else {
    console.error('❌ Unknown body type:', bodyType);
    return res.status(400).json({ 
      error: 'Invalid request body type',
      bodyType,
      contentType
    });
  }

  let event: Stripe.Event;

  try {
    // 验证 Webhook 签名（需要原始 body 字符串）
    event = stripe.webhooks.constructEvent(
      rawBody as string,
      sig,
      webhookSecret
    );
    console.log('✅ Webhook signature verified successfully');
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
    console.error('Debug info:', {
      bodyType: typeof rawBody,
      bodyLength: rawBody?.length || 0,
      bodyPreview: typeof rawBody === 'string' ? rawBody.substring(0, 100) : 'N/A',
      hasSignature: !!sig,
      signatureLength: sig?.length || 0,
      hasSecret: !!webhookSecret,
      secretLength: webhookSecret?.length || 0
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('✅ Webhook event received:', event.type);

  // 处理支付成功事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    console.log('✅ Checkout session completed:', session.id);

    // 验证支付状态
    if (session.payment_status !== 'paid') {
      console.log('⚠️ Payment not completed, status:', session.payment_status);
      return res.status(200).json({ received: true, message: 'Payment not completed' });
    }

    try {
      // 从 metadata 获取信息
      const userId = session.metadata?.userId;
      const packageId = session.metadata?.packageId;
      const diamonds = parseInt(session.metadata?.diamonds || '0');

      if (!userId || !packageId || !diamonds) {
        console.error('❌ Missing metadata:', { userId, packageId, diamonds });
        return res.status(400).json({ error: 'Invalid session metadata' });
      }

      console.log('📦 Processing payment:', { userId, packageId, diamonds });

      const sql = getNeonClient();

      // 检查是否已经处理过这个 session（防止重复添加）
      const existingTransaction = await sql`
        SELECT id, status FROM payments 
        WHERE session_id = ${session.id}
        LIMIT 1
      `;

      if (existingTransaction.length > 0 && existingTransaction[0].status === 'completed') {
        console.log('⚠️ Transaction already processed:', session.id);
        return res.status(200).json({ received: true, message: 'Already processed' });
      }

      // 获取或创建玩家记录
      const player = await sql`
        SELECT * FROM players 
        WHERE user_id = ${userId}
        LIMIT 1
      `;

      if (player.length === 0) {
        // 创建新玩家记录
        await sql`
          INSERT INTO players (
            user_id, time_diamonds, current_cash, current_chapter,
            current_level, current_phase, equipment, consumables,
            total_diamonds_earned, total_deaths
          ) VALUES (
            ${userId}, ${diamonds}, 10000, 1, 1, 1, '[]'::jsonb, '[]'::jsonb, ${diamonds}, 0
          )
        `;
        console.log('✅ New player created:', userId);
      } else {
        // 更新现有玩家的钻石
        await sql`
          UPDATE players 
          SET 
            time_diamonds = time_diamonds + ${diamonds},
            total_diamonds_earned = total_diamonds_earned + ${diamonds},
            updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ${userId}
        `;
        console.log('✅ Player diamonds updated:', userId);
      }

      // 记录交易
      await sql`
        INSERT INTO payments (
          session_id, user_id, package_id, diamonds, amount, status, completed_at
        ) VALUES (
          ${session.id}, ${userId}, ${packageId}, ${diamonds},
          ${(session.amount_total || 0) / 100}, 'completed', CURRENT_TIMESTAMP
        )
        ON CONFLICT (session_id) DO UPDATE SET
          status = 'completed',
          completed_at = CURRENT_TIMESTAMP
      `;

      console.log('✅ Payment processed successfully:', { userId, diamonds, sessionId: session.id });

      return res.status(200).json({
        received: true,
        message: 'Payment processed successfully',
        userId,
        diamonds
      });

    } catch (error: any) {
      console.error('❌ Error processing payment:', error);
      return res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }

  // 其他事件类型
  return res.status(200).json({ received: true });
}

