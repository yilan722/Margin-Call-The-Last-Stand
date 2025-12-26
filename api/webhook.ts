// ==========================================
// Stripe Webhook Handler
// 处理 Stripe 支付成功事件
// ==========================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

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

// Supabase 客户端（使用服务端密钥）
async function getSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
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

  let event: Stripe.Event;

  try {
    // 验证 Webhook 签名
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err: any) {
    console.error('❌ Webhook signature verification failed:', err.message);
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

      // 连接 Supabase
      const supabase = await getSupabaseClient();

      // 检查是否已经处理过这个 session（防止重复添加）
      const { data: existingTransaction } = await supabase
        .from('payment_transactions')
        .select('id, status')
        .eq('session_id', session.id)
        .single();

      if (existingTransaction && existingTransaction.status === 'completed') {
        console.log('⚠️ Transaction already processed:', session.id);
        return res.status(200).json({ received: true, message: 'Already processed' });
      }

      // 开始事务：更新玩家钻石 + 记录交易
      // 1. 获取或创建玩家记录
      const { data: player, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (playerError && playerError.code !== 'PGRST116') { // PGRST116 = not found
        console.error('❌ Error fetching player:', playerError);
        throw playerError;
      }

      if (!player) {
        // 创建新玩家记录
        const { data: newPlayer, error: createError } = await supabase
          .from('players')
          .insert({
            user_id: userId,
            time_diamonds: diamonds,
            current_cash: 10000,
            current_chapter: 1,
            current_level: 1,
            current_phase: 1,
            equipment: [],
            consumables: [],
            total_diamonds_earned: diamonds,
            total_deaths: 0
          })
          .select()
          .single();

        if (createError) {
          console.error('❌ Error creating player:', createError);
          throw createError;
        }

        console.log('✅ New player created:', newPlayer.id);
      } else {
        // 更新现有玩家的钻石
        const { error: updateError } = await supabase
          .from('players')
          .update({
            time_diamonds: (player.time_diamonds || 0) + diamonds,
            total_diamonds_earned: (player.total_diamonds_earned || 0) + diamonds
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('❌ Error updating player:', updateError);
          throw updateError;
        }

        console.log('✅ Player diamonds updated:', userId);
      }

      // 2. 记录交易
      const { error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          user_id: userId,
          session_id: session.id,
          package_id: packageId,
          diamonds: diamonds,
          amount: (session.amount_total || 0) / 100, // Stripe 使用 cents
          status: 'completed',
          stripe_event_id: event.id,
          completed_at: new Date().toISOString()
        });

      if (transactionError) {
        console.error('❌ Error recording transaction:', transactionError);
        throw transactionError;
      }

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

