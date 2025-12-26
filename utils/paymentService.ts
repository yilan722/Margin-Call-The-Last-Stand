// ==========================================
// 支付服务 - 处理 Stripe 支付
// ==========================================

import { DIAMOND_PACKAGES, getTotalDiamonds } from './paymentConfig';

/**
 * 是否使用真实支付（即使是在开发模式）
 * 可以通过环境变量 VITE_USE_REAL_PAYMENT=true 来启用
 */
function shouldUseRealPayment(): boolean {
  // 如果设置了环境变量，使用真实支付
  if (import.meta.env.VITE_USE_REAL_PAYMENT === 'true') {
    return true;
  }
  // 生产环境总是使用真实支付
  return !import.meta.env.DEV;
}

/**
 * 获取 API 基础 URL
 * 自动检测部署平台并选择合适的 API 端点
 */
function getApiBaseUrl(): string {
  // 开发环境使用本地
  if (import.meta.env.DEV) {
    return 'http://localhost:3000';
  }
  
  // 检查是否在 Itch.io 上（静态托管，需要外部 API）
  const hostname = window.location.hostname;
  if (hostname.includes('itch.io') || hostname.includes('itch.zone')) {
    // Itch.io 部署：使用 Vercel API
    // 替换为你的实际 Vercel 项目域名
    return 'https://margin-call-the-last-stand.vercel.app';
  }
  
  // 其他部署（如 Vercel 本身）：使用当前域名
  return window.location.origin;
}

/**
 * 获取用户ID（从 localStorage 或生成临时ID）
 */
function getUserId(): string {
  // 方案1：从 localStorage 获取
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

/**
 * 生成临时用户ID
 */
function generateUserId(): string {
  let userId = localStorage.getItem('userId');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('userId', userId);
  }
  return userId;
}

/**
 * 创建 Stripe Checkout Session
 * 在生产环境中，调用后端API来创建session
 */
export async function createCheckoutSession(packageId: string): Promise<string> {
  const pkg = DIAMOND_PACKAGES.find(p => p.id === packageId);
  if (!pkg) {
    throw new Error('Invalid package ID');
  }

  // 开发模式：如果未启用真实支付，则模拟
  if (import.meta.env.DEV && !shouldUseRealPayment()) {
    console.warn('Development mode: Simulating payment. Set VITE_USE_REAL_PAYMENT=true to use real Stripe API.');
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('mock-session-id');
      }, 1000);
    });
  }

  // 使用真实 API（生产环境或开发环境启用真实支付）
  try {
    // 获取当前页面的完整 URL（用于回调）
    // 由于跨域限制，无法访问 window.top.location，使用当前窗口的 URL
    let returnUrl: string;
    try {
      // 尝试获取顶层窗口的 URL（如果允许）
      if (window.top && window.top !== window.self) {
        returnUrl = window.top.location.origin + window.top.location.pathname;
      } else {
        returnUrl = window.location.origin + window.location.pathname;
      }
    } catch (e) {
      // 跨域访问被阻止，使用当前窗口的 URL 或 document.referrer
      try {
        // 尝试从 referrer 获取
        const referrer = document.referrer;
        if (referrer) {
          const url = new URL(referrer);
          returnUrl = url.origin + url.pathname;
        } else {
          returnUrl = window.location.origin + window.location.pathname;
        }
      } catch {
        // 最后的备选方案：使用当前窗口
        returnUrl = window.location.origin + window.location.pathname;
      }
    }
    
    const response = await fetch(`${getApiBaseUrl()}/api/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        packageId,
        userId: getUserId(),
        returnUrl: returnUrl, // 传递当前页面 URL，用于支付成功后的回调
      }),
    });

    // 读取响应内容（只能读取一次）
    const contentType = response.headers.get('content-type') || '';
    let responseData: any;
    
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      // 尝试解析为 JSON
      try {
        responseData = JSON.parse(text);
      } catch {
        responseData = { error: text || 'Unknown error' };
      }
    }

    if (!response.ok) {
      const errorMessage = responseData.error || responseData.message || 'Failed to create checkout session';
      const details = responseData.details ? `: ${responseData.details}` : '';
      throw new Error(`${errorMessage}${details}`);
    }

    return responseData.url; // Stripe Checkout URL
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * 验证支付结果并获取钻石数量
 * 在生产环境中，调用后端API来验证支付
 */
export async function verifyPaymentAndAddDiamonds(
  sessionId: string,
  packageId: string
): Promise<number> {
  const pkg = DIAMOND_PACKAGES.find(p => p.id === packageId);
  if (!pkg) {
    throw new Error('Invalid package ID');
  }

  // 开发模式：如果未启用真实支付，则模拟
  if (import.meta.env.DEV && !shouldUseRealPayment()) {
    console.warn('Development mode: Simulating payment verification. Set VITE_USE_REAL_PAYMENT=true to use real API.');
    return new Promise((resolve) => {
      setTimeout(() => {
        const totalDiamonds = getTotalDiamonds(packageId);
        resolve(totalDiamonds);
      }, 500);
    });
  }

  // 使用真实 API 验证（生产环境或开发环境启用真实支付）
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/verify-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Payment verification failed');
    }

    const data = await response.json();
    return data.diamonds;
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
}

/**
 * 使用 Stripe Checkout 进行支付
 * 这是推荐的实现方式，因为它更安全且易于集成
 */
export async function initiateStripeCheckout(packageId: string): Promise<void> {
  try {
    // 创建 Checkout Session
    const sessionUrl = await createCheckoutSession(packageId);
    
    // 如果是真实的 Stripe Session URL，重定向到支付页面
    // 使用 window.top 确保在顶层窗口重定向（避免 iframe 问题）
    if (sessionUrl && sessionUrl.startsWith('https://checkout.stripe.com')) {
      // 检查是否在 iframe 中，如果是则尝试使用顶层窗口重定向
      try {
        if (window.top && window.top !== window.self) {
          // 尝试在顶层窗口打开（如果允许）
          window.top.location.href = sessionUrl;
        } else {
          window.location.href = sessionUrl;
        }
      } catch (e) {
        // 跨域访问被阻止，使用 window.open 在新窗口打开
        console.warn('Cannot access top window due to cross-origin restriction, opening in new window:', e);
        window.open(sessionUrl, '_blank', 'noopener,noreferrer');
      }
    } else if (import.meta.env.DEV && !shouldUseRealPayment()) {
      // 开发模式（模拟支付）：不重定向
      console.log('Development mode: Payment will be simulated in the UI');
      throw new Error('Development mode: Please use the simulated payment flow or set VITE_USE_REAL_PAYMENT=true');
    } else {
      throw new Error('Invalid checkout URL: ' + sessionUrl);
    }
  } catch (error) {
    console.error('Failed to initiate checkout:', error);
    throw error;
  }
}

