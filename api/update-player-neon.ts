// ==========================================
// 更新玩家数据 API (Neon)
// ==========================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

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

    const sql = getNeonClient();

    // 检查玩家是否存在
    const existing = await sql`
      SELECT user_id FROM players 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    const playerData = {
      user_id: userId,
      time_diamonds: profile.timeDiamonds || 0,
      current_cash: profile.currentCash || 10000,
      current_chapter: profile.currentChapter || 1,
      current_level: profile.currentLevel || 1,
      current_phase: profile.currentPhase || 1,
      equipment: JSON.stringify(profile.equipment || []),
      consumables: JSON.stringify(profile.consumables || []),
      total_diamonds_earned: profile.totalDiamondsEarned || 0,
      total_deaths: profile.totalDeaths || 0
    };

    if (existing.length > 0) {
      // 更新现有玩家
      await sql`
        UPDATE players 
        SET 
          time_diamonds = ${playerData.time_diamonds},
          current_cash = ${playerData.current_cash},
          current_chapter = ${playerData.current_chapter},
          current_level = ${playerData.current_level},
          current_phase = ${playerData.current_phase},
          equipment = ${playerData.equipment}::jsonb,
          consumables = ${playerData.consumables}::jsonb,
          total_diamonds_earned = ${playerData.total_diamonds_earned},
          total_deaths = ${playerData.total_deaths},
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ${userId}
      `;

      return res.status(200).json({ success: true, message: 'Player updated' });
    } else {
      // 创建新玩家
      await sql`
        INSERT INTO players (
          user_id, time_diamonds, current_cash, current_chapter, 
          current_level, current_phase, equipment, consumables,
          total_diamonds_earned, total_deaths
        ) VALUES (
          ${playerData.user_id}, ${playerData.time_diamonds}, ${playerData.current_cash},
          ${playerData.current_chapter}, ${playerData.current_level}, ${playerData.current_phase},
          ${playerData.equipment}::jsonb, ${playerData.consumables}::jsonb,
          ${playerData.total_diamonds_earned}, ${playerData.total_deaths}
        )
      `;

      return res.status(200).json({ success: true, message: 'Player created' });
    }

  } catch (error: any) {
    console.error('Error in update-player-neon:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

