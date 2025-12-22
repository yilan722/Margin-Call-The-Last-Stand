
import { Scenario } from './types';

// Helper to generate simulated data for historical curves
const generateCurve = (startPrice: number, points: number, volatility: number, trend: number): any[] => {
  let current = startPrice;
  return Array.from({ length: points }).map((_, i) => {
    const change = (Math.random() - 0.5) * volatility + trend;
    // Force a black swan event at 70% of data
    const shock = i > points * 0.7 ? (Math.random() - 0.7) * volatility * 8 : 0;
    current = current * (1 + (change + shock) / 100);
    return { time: `${i}m`, price: parseFloat(current.toFixed(2)) };
  });
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'aapl-growth',
    name: 'Lv1: 新手村 - 科技巨头的喘息',
    description: '2023年某日。市场情绪平稳，波动率极低，适合小白练习杠杆管理。',
    difficulty: 1,
    data: generateCurve(180, 100, 0.5, 0.1),
    eventText: '一切安好，除了无聊。'
  },
  {
    id: 'meta-crash',
    name: 'Lv2: 绞肉机 - 财报噩梦',
    description: '复刻2022年META财报暴跌，当日跌幅26%。多头坟墓。',
    difficulty: 3,
    data: generateCurve(320, 100, 1.2, -0.2).map((d, i) => i > 70 ? { ...d, price: d.price * 0.8 } : d),
    eventText: '用户增长陷入瓶颈，主力资金开启大逃杀模式！'
  },
  {
    id: 'gme-squeeze',
    name: 'Lv3: 逼空局 - 散户起义',
    description: '2021年GME游戏驿站，空头被拉爆的瞬间。',
    difficulty: 4,
    data: generateCurve(40, 100, 3, 0.5).map((d, i) => i > 60 ? { ...d, price: d.price * 2.5 } : d),
    eventText: '空头仓位被爆破，买盘蜂拥而至！'
  },
  {
    id: 'luna-abyss',
    name: 'Lv4: 归零局 - 信仰崩塌',
    description: '2022年LUNA币。极速归零，彻底的深渊。',
    difficulty: 5,
    data: generateCurve(80, 100, 5, -1).map((d, i) => i > 50 ? { ...d, price: d.price * Math.pow(0.5, (i - 50) / 10) } : d),
    eventText: '算力脱锚，协议崩溃，正在进入无底深渊...'
  }
];

export const LEVERAGE_OPTIONS = [1, 5, 10, 25, 50, 100];
