// 真实历史数据服务
// 使用 Alpha Vantage API 获取股票历史数据

import { PricePoint } from './types';

interface AlphaVantageResponse {
  'Time Series (Daily)'?: {
    [date: string]: {
      '1. open': string;
      '2. high': string;
      '3. low': string;
      '4. close': string;
      '5. volume': string;
    };
  };
  'Note'?: string; // API限制提示
  'Error Message'?: string;
}

/**
 * 从 Alpha Vantage API 获取历史股票数据
 * @param symbol 股票代码（如 'AAPL', 'MSFT'）
 * @param startDate 开始日期 (YYYY-MM-DD)
 * @param endDate 结束日期 (YYYY-MM-DD)
 * @param phase 阶段编号 (1-4)，用于选择数据的不同时间段
 */
export async function fetchHistoricalData(
  symbol: string,
  startDate: string,
  endDate: string,
  phase: number = 1
): Promise<PricePoint[]> {
  const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
  
  // 如果使用demo key，返回模拟数据
  if (API_KEY === 'demo') {
    console.warn('Using demo mode - returning simulated data');
    return generateSimulatedData(symbol, phase);
  }

  try {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=${symbol}&apikey=${API_KEY}&outputsize=full`;
    const response = await fetch(url);
    const data: AlphaVantageResponse = await response.json();

    if (data['Error Message']) {
      console.error('Alpha Vantage API Error:', data['Error Message']);
      return generateSimulatedData(symbol, phase);
    }

    if (data['Note']) {
      console.warn('API rate limit reached, using simulated data');
      return generateSimulatedData(symbol, phase);
    }

    const timeSeries = data['Time Series (Daily)'];
    if (!timeSeries) {
      return generateSimulatedData(symbol, phase);
    }

    // 转换数据格式并筛选日期范围
    const pricePoints: PricePoint[] = [];
    const dates = Object.keys(timeSeries).sort();
    
    // 根据phase选择数据段（将数据分为4段）
    const totalDays = dates.length;
    const segmentSize = Math.floor(totalDays / 4);
    const startIdx = (phase - 1) * segmentSize;
    const endIdx = phase === 4 ? totalDays : phase * segmentSize;
    const selectedDates = dates.slice(startIdx, endIdx);

    selectedDates.forEach((date, index) => {
      const dayData = timeSeries[date];
      const closePrice = parseFloat(dayData['4. close']);
      pricePoints.push({
        time: `${index}m`,
        price: closePrice
      });
    });

    // 如果数据点少于100个，进行插值
    if (pricePoints.length < 100) {
      return interpolateData(pricePoints, 100);
    }

    // 限制为100个数据点（游戏需要）
    return pricePoints.slice(0, 100);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return generateSimulatedData(symbol, phase);
  }
}

/**
 * 生成模拟数据（fallback）
 */
function generateSimulatedData(symbol: string, phase: number): PricePoint[] {
  // 根据symbol和phase生成不同的模拟数据
  const basePrice = getBasePriceForSymbol(symbol);
  const volatility = getVolatilityForPhase(phase);
  const trend = getTrendForPhase(phase);
  
  let current = basePrice;
  const points: PricePoint[] = [];
  
  for (let i = 0; i < 100; i++) {
    const change = (Math.random() - 0.5) * volatility + trend;
    // 在70%位置添加黑天鹅事件
    const shock = i > 70 ? (Math.random() - 0.7) * volatility * 8 : 0;
    current = current * (1 + (change + shock) / 100);
    points.push({
      time: `${i}m`,
      price: parseFloat(current.toFixed(2))
    });
  }
  
  return points;
}

/**
 * 根据股票代码获取基础价格
 */
function getBasePriceForSymbol(symbol: string): number {
  const priceMap: Record<string, number> = {
    'AAPL': 150,
    'MSFT': 300,
    'GOOGL': 2500,
    'NVDA': 500,
    'TSLA': 200,
    'BTC': 40000,
    'ETH': 2000,
    'SPY': 400,
    'QQQ': 350
  };
  return priceMap[symbol] || 100;
}

/**
 * 根据阶段获取波动率
 */
function getVolatilityForPhase(phase: number): number {
  // Phase 1: 低波动，Phase 2-3: 中波动，Phase 4: 高波动
  return [0.5, 1.5, 2.5, 4.0][phase - 1] || 1.0;
}

/**
 * 根据阶段获取趋势（随机，避免可预测性）
 */
function getTrendForPhase(phase: number): number {
  // 随机趋势，避免通过phase判断方向
  const trends = [-0.2, 0.1, -0.1, 0.2, 0, -0.3, 0.3];
  return trends[Math.floor(Math.random() * trends.length)];
}

/**
 * 插值数据以增加数据点
 */
function interpolateData(data: PricePoint[], targetLength: number): PricePoint[] {
  if (data.length >= targetLength) return data;
  
  const result: PricePoint[] = [];
  const ratio = (data.length - 1) / (targetLength - 1);
  
  for (let i = 0; i < targetLength; i++) {
    const index = i * ratio;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const fraction = index - lower;
    
    if (upper >= data.length) {
      result.push(data[data.length - 1]);
    } else {
      const price = data[lower].price + (data[upper].price - data[lower].price) * fraction;
      result.push({
        time: `${i}m`,
        price: parseFloat(price.toFixed(2))
      });
    }
  }
  
  return result;
}

/**
 * 获取加密货币数据（使用CoinGecko API作为备选）
 */
export async function fetchCryptoData(
  symbol: string,
  startDate: string,
  endDate: string,
  phase: number
): Promise<PricePoint[]> {
  // CoinGecko API实现（如果需要）
  // 目前使用模拟数据
  return generateSimulatedData(symbol, phase);
}

