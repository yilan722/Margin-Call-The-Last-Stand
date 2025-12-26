// ==========================================
// 同步玩家数据到 Supabase
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
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, profile } = req.body;

    if (!userId || !profile) {
      return res.status(400).json({ error: 'userId and profile are required' });
    }

    const supabase = await getSupabaseClient();

    // 检查玩家是否存在
    const { data: existingPlayer } = await supabase
      .from('players')
      .select('id')
      .eq('user_id', userId)
      .single();

    const playerData = {
      user_id: userId,
      time_diamonds: profile.timeDiamonds || 0,
      current_cash: profile.currentCash || 10000,
      current_chapter: profile.currentChapter || 1,
      current_level: profile.currentLevel || 1,
      current_phase: profile.currentPhase || 1,
      equipment: profile.equipment || [],
      consumables: profile.consumables || [],
      total_diamonds_earned: profile.totalDiamondsEarned || 0,
      total_deaths: profile.totalDeaths || 0
    };

    if (existingPlayer) {
      // 更新现有玩家
      const { error } = await supabase
        .from('players')
        .update(playerData)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating player:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, message: 'Player updated' });
    } else {
      // 创建新玩家
      const { error } = await supabase
        .from('players')
        .insert(playerData);

      if (error) {
        console.error('Error creating player:', error);
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ success: true, message: 'Player created' });
    }

  } catch (error: any) {
    console.error('Error in sync-player:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

