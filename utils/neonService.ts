// ==========================================
// Neon 数据库服务
// ==========================================

import { PlayerProfile } from '../types';

function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  
  const hostname = window.location.hostname;
  if (hostname.includes('itch.io') || hostname.includes('itch.zone')) {
    return 'https://margin-call-the-last-stand.vercel.app';
  }
  
  return window.location.origin;
}

function getUserId(): string {
  const profile = localStorage.getItem('timeTraderProfile');
  if (profile) {
    try {
      const parsed = JSON.parse(profile);
      return parsed.userId || generateUserId();
    } catch {
      return generateUserId();
    }
  }
  return generateUserId();
}

function generateUserId(): string {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
}

/**
 * 从数据库获取玩家数据
 */
export async function getPlayerFromNeon(userId: string): Promise<PlayerProfile | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/get-player-neon?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch player from Neon:', response.statusText);
      return null;
    }

    const data = await response.json();
    
    if (!data.exists || !data.player) {
      return null;
    }

    // 转换为 PlayerProfile 格式
    return {
      timeDiamonds: data.player.timeDiamonds || 0,
      currentCash: data.player.currentCash || 10000,
      currentChapter: data.player.currentChapter || 1,
      currentLevel: data.player.currentLevel || 1,
      currentPhase: data.player.currentPhase || 1,
      equipment: data.player.equipment || [],
      consumables: data.player.consumables || [],
      totalDiamondsEarned: data.player.totalDiamondsEarned || 0,
      totalDeaths: data.player.totalDeaths || 0
    };
  } catch (error) {
    console.error('Error fetching player from Neon:', error);
    return null;
  }
}

/**
 * 同步玩家数据到数据库
 */
export async function syncPlayerToNeon(profile: PlayerProfile): Promise<boolean> {
  try {
    const userId = getUserId();
    
    const response = await fetch(`${getApiBaseUrl()}/api/update-player-neon`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        profile
      }),
    });

    if (!response.ok) {
      console.error('Failed to sync player to Neon:', response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error syncing player to Neon:', error);
    return false;
  }
}

/**
 * 轮询检查钻石更新（用于支付后）
 */
export async function pollDiamondUpdates(
  userId: string,
  currentDiamonds: number,
  onUpdate: (newDiamonds: number) => void,
  maxAttempts: number = 30,
  intervalMs: number = 2000
): Promise<void> {
  let attempts = 0;
  
  const poll = async () => {
    attempts++;
    
    try {
      const player = await getPlayerFromNeon(userId);
      
      if (player && player.timeDiamonds > currentDiamonds) {
        console.log('✅ Diamonds updated in database:', player.timeDiamonds);
        onUpdate(player.timeDiamonds);
        return;
      }
      
      if (attempts < maxAttempts) {
        setTimeout(poll, intervalMs);
      } else {
        console.log('⚠️ Polling timeout: No diamond update detected');
      }
    } catch (error) {
      console.error('Error polling diamond updates:', error);
      if (attempts < maxAttempts) {
        setTimeout(poll, intervalMs);
      }
    }
  };
  
  // 延迟第一次检查，给 Webhook 时间处理
  setTimeout(poll, 1000);
}

