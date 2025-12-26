// ==========================================
// Supabase 服务 - 前端使用
// ==========================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: any = null;

async function getSupabaseClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    return supabaseClient;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    throw error;
  }
}

/**
 * 获取 API 基础 URL（同步版本）
 */
function getApiBaseUrlSync(): string {
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  
  const hostname = window.location.hostname;
  if (hostname.includes('itch.io') || hostname.includes('itch.zone')) {
    return 'https://margin-call-the-last-stand.vercel.app';
  }
  
  return window.location.origin;
}

/**
 * 获取玩家数据
 */
export async function getPlayerData(userId: string): Promise<any> {
  try {
    const apiBaseUrl = getApiBaseUrlSync();
    const response = await fetch(`${apiBaseUrl}/api/get-player?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch player data');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching player data:', error);
    throw error;
  }
}

/**
 * 同步玩家数据到 Supabase
 */
export async function syncPlayerToSupabase(userId: string, profile: any): Promise<void> {
  try {
    const apiBaseUrl = getApiBaseUrlSync();
    const response = await fetch(`${apiBaseUrl}/api/sync-player`, {
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
      throw new Error('Failed to sync player data');
    }
  } catch (error) {
    console.error('Error syncing player data:', error);
    // 不抛出错误，允许继续使用 localStorage
  }
}

/**
 * 获取 API 基础 URL
 */
function getApiBaseUrl(): string {
  // 使用 paymentService 中的函数
  const { getApiBaseUrl: getPaymentApiBaseUrl } = await import('./paymentService');
  return getPaymentApiBaseUrl();
}

/**
 * 轮询检查钻石更新
 */
export async function pollDiamondUpdates(
  userId: string,
  currentDiamonds: number,
  onUpdate: (newDiamonds: number) => void,
  maxAttempts: number = 30,
  interval: number = 2000
): Promise<void> {
  let attempts = 0;

  const poll = async () => {
    if (attempts >= maxAttempts) {
      console.log('Polling timeout, stopping diamond check');
      return;
    }

    attempts++;

    try {
      const data = await getPlayerData(userId);
      
      if (data.exists && data.player) {
        const newDiamonds = data.player.time_diamonds || 0;
        
        if (newDiamonds > currentDiamonds) {
          console.log('✅ Diamonds updated!', { old: currentDiamonds, new: newDiamonds });
          onUpdate(newDiamonds);
          return; // 停止轮询
        }
      }

      // 继续轮询
      setTimeout(poll, interval);
    } catch (error) {
      console.error('Error polling diamond updates:', error);
      // 继续轮询，即使出错
      setTimeout(poll, interval);
    }
  };

  // 开始轮询
  poll();
}

