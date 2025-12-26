// ==========================================
// 获取玩家数据 API
// ==========================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  // 添加 CORS 头
  const origin = req.headers.origin || req.headers.referer;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userId = req.method === 'GET' 
      ? req.query.userId as string
      : req.body.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const supabase = await getSupabaseClient();

    // 获取玩家数据
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // 玩家不存在，返回默认值
      return res.status(200).json({
        exists: false,
        player: null
      });
    }

    if (error) {
      console.error('Error fetching player:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({
      exists: true,
      player: player
    });

  } catch (error: any) {
    console.error('Error in get-player:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

