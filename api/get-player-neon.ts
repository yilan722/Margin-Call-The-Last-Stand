// ==========================================
// 获取玩家数据 API (Neon)
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

    const sql = getNeonClient();

    // 获取玩家数据
    const result = await sql`
      SELECT * FROM players 
      WHERE user_id = ${userId}
      LIMIT 1
    `;

    if (result.length === 0) {
      return res.status(200).json({
        exists: false,
        player: null
      });
    }

    const player = result[0];

    return res.status(200).json({
      exists: true,
      player: {
        userId: player.user_id,
        timeDiamonds: player.time_diamonds || 0,
        currentCash: parseFloat(player.current_cash) || 10000,
        currentChapter: player.current_chapter || 1,
        currentLevel: player.current_level || 1,
        currentPhase: player.current_phase || 1,
        equipment: player.equipment || [],
        consumables: player.consumables || [],
        totalDiamondsEarned: player.total_diamonds_earned || 0,
        totalDeaths: player.total_deaths || 0
      }
    });

  } catch (error: any) {
    console.error('Error in get-player-neon:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

