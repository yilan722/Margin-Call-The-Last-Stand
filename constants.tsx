
import { Scenario, Chapter, EquipmentType, ConsumableType, TemporaryItemType } from './types';

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

// 第1章：黄金时代 (1990-2000)
const chapter1Scenarios: Scenario[] = [
  {
    id: '1-1',
    name: '1-1: 可口可乐的稳步增长',
    description: '1990年。新手教学关卡，波动率极低，几乎不死。',
    difficulty: 1,
    data: generateCurve(10, 100, 0.3, 0.15),
    eventText: '一切安好，除了无聊。',
    chapter: Chapter.GOLDEN_AGE,
    level: 1,
    isBoss: false,
    year: 1990,
    targetMultiplier: 1.2, // 目标是本金增长20%
    duration: 60
  },
  {
    id: '1-2',
    name: '1-2: 微软的崛起',
    description: '1995年。科技股开始受到关注，波动略有增加。',
    difficulty: 1,
    data: generateCurve(5, 100, 0.6, 0.3),
    eventText: 'Windows 95发布，市场情绪高涨。',
    chapter: Chapter.GOLDEN_AGE,
    level: 2,
    isBoss: false,
    year: 1995,
    targetMultiplier: 1.5,
    duration: 60
  },
  {
    id: '1-3',
    name: '1-3: 亚洲金融风暴',
    description: '1997年。外部冲击开始影响全球市场。',
    difficulty: 2,
    data: generateCurve(100, 100, 1.0, -0.1),
    eventText: '泰铢崩盘，连锁反应波及全球。',
    chapter: Chapter.GOLDEN_AGE,
    level: 3,
    isBoss: false,
    year: 1997,
    targetMultiplier: 1.8,
    duration: 60
  },
  {
    id: '1-4',
    name: '1-4: 互联网泡沫前夜',
    description: '1999年。市场狂热，但暗流涌动。',
    difficulty: 3,
    data: generateCurve(50, 100, 2.0, 0.5),
    eventText: '纳斯达克指数飙升，但估值已脱离现实。',
    chapter: Chapter.GOLDEN_AGE,
    level: 4,
    isBoss: false,
    year: 1999,
    targetMultiplier: 2.0,
    duration: 60
  },
  {
    id: '1-5',
    name: '1-5: BOSS - 互联网泡沫破裂',
    description: '2000年。纳斯达克暴跌，无数科技股归零。',
    difficulty: 5,
    data: generateCurve(5000, 100, 3.0, -1.5).map((d, i) => i > 60 ? { ...d, price: d.price * Math.pow(0.7, (i - 60) / 10) } : d),
    eventText: '泡沫破裂！纳斯达克指数从5000点暴跌至1500点！',
    chapter: Chapter.GOLDEN_AGE,
    level: 5,
    isBoss: true,
    year: 2000,
    targetMultiplier: 2.5,
    duration: 60
  }
];

// 第2章：次贷风云 (2000-2010)
const chapter2Scenarios: Scenario[] = [
  {
    id: '2-1',
    name: '2-1: 安然公司破产',
    description: '2001年。企业欺诈引发市场信任危机。',
    difficulty: 2,
    data: generateCurve(90, 100, 1.5, -0.8),
    eventText: '安然财务造假曝光，股价瞬间归零。',
    chapter: Chapter.SUBPRIME_STORM,
    level: 1,
    isBoss: false,
    year: 2001,
    targetMultiplier: 1.3,
    duration: 60
  },
  {
    id: '2-2',
    name: '2-2: 房地产泡沫',
    description: '2005年。次贷市场疯狂扩张。',
    difficulty: 2,
    data: generateCurve(200, 100, 1.2, 0.4),
    eventText: '房价飙升，次贷产品泛滥。',
    chapter: Chapter.SUBPRIME_STORM,
    level: 2,
    isBoss: false,
    year: 2005,
    targetMultiplier: 1.6,
    duration: 60
  },
  {
    id: '2-3',
    name: '2-3: 次贷危机初现',
    description: '2007年。次贷违约率飙升。',
    difficulty: 3,
    data: generateCurve(14000, 100, 2.0, -0.5),
    eventText: '次贷违约潮开始，市场恐慌蔓延。',
    chapter: Chapter.SUBPRIME_STORM,
    level: 3,
    isBoss: false,
    year: 2007,
    targetMultiplier: 1.9,
    duration: 60
  },
  {
    id: '2-4',
    name: '2-4: 贝尔斯登倒闭',
    description: '2008年3月。大型投行开始崩溃。',
    difficulty: 4,
    data: generateCurve(150, 100, 3.0, -1.2),
    eventText: '贝尔斯登被JP摩根收购，市场信心崩塌。',
    chapter: Chapter.SUBPRIME_STORM,
    level: 4,
    isBoss: false,
    year: 2008,
    targetMultiplier: 2.2,
    duration: 60
  },
  {
    id: '2-10',
    name: '2-10: BOSS - 雷曼兄弟倒闭',
    description: '2008年9月。雷曼兄弟破产，引发全球金融海啸。',
    difficulty: 5,
    data: generateCurve(40, 100, 5.0, -2.0).map((d, i) => i > 50 ? { ...d, price: d.price * Math.pow(0.4, (i - 50) / 15) } : d),
    eventText: '雷曼兄弟申请破产！道指单日暴跌777点！',
    chapter: Chapter.SUBPRIME_STORM,
    level: 10,
    isBoss: true,
    year: 2008,
    targetMultiplier: 3.0,
    duration: 60
  }
];

// 第3章：量化狂潮 (2010-2020)
const chapter3Scenarios: Scenario[] = [
  {
    id: '3-1',
    name: '3-1: 闪崩 (Flash Crash)',
    description: '2010年5月6日。只有几秒钟反应时间，道指瞬间暴跌1000点。',
    difficulty: 5,
    data: generateCurve(11000, 50, 8.0, -3.0).map((d, i) => i > 20 && i < 30 ? { ...d, price: d.price * 0.6 } : d),
    eventText: '算法交易失控！市场在5分钟内蒸发1万亿美元！',
    chapter: Chapter.QUANTUM_RUSH,
    level: 1,
    isBoss: false,
    year: 2010,
    targetMultiplier: 1.4,
    duration: 30
  },
  {
    id: '3-2',
    name: '3-2: 欧债危机',
    description: '2011年。希腊债务危机引发欧洲市场动荡。',
    difficulty: 3,
    data: generateCurve(13000, 100, 2.5, -0.8),
    eventText: '希腊违约风险，欧元区面临解体威胁。',
    chapter: Chapter.QUANTUM_RUSH,
    level: 2,
    isBoss: false,
    year: 2011,
    targetMultiplier: 1.7,
    duration: 60
  },
  {
    id: '3-3',
    name: '3-3: 中国股灾',
    description: '2015年。A股市场崩盘，千股跌停。',
    difficulty: 4,
    data: generateCurve(5000, 100, 4.0, -1.5),
    eventText: '杠杆资金爆仓，A股连续熔断。',
    chapter: Chapter.QUANTUM_RUSH,
    level: 3,
    isBoss: false,
    year: 2015,
    targetMultiplier: 2.0,
    duration: 60
  },
  {
    id: '3-4',
    name: '3-4: 比特币狂潮',
    description: '2017年。加密货币首次进入主流视野。',
    difficulty: 4,
    data: generateCurve(1000, 100, 5.0, 1.5),
    eventText: '比特币突破2万美元，FOMO情绪达到顶峰。',
    chapter: Chapter.QUANTUM_RUSH,
    level: 4,
    isBoss: false,
    year: 2017,
    targetMultiplier: 2.5,
    duration: 60
  }
];

// 第4章：赛博纪元 (2020-2025)
const chapter4Scenarios: Scenario[] = [
  {
    id: '4-1',
    name: '4-1: 疫情崩盘',
    description: '2020年3月。COVID-19引发全球市场恐慌。',
    difficulty: 4,
    data: generateCurve(29000, 100, 4.0, -2.0),
    eventText: '疫情封锁，美股连续熔断，恐慌指数飙升。',
    chapter: Chapter.CYBER_ERA,
    level: 1,
    isBoss: false,
    year: 2020,
    targetMultiplier: 1.5,
    duration: 60
  },
  {
    id: '4-2',
    name: '4-2: GameStop逼空',
    description: '2021年1月。散户起义，空头被拉爆。',
    difficulty: 4,
    data: generateCurve(20, 100, 6.0, 2.0).map((d, i) => i > 50 ? { ...d, price: d.price * 3.0 } : d),
    eventText: 'Reddit散户抱团，GME股价暴涨1700%！',
    chapter: Chapter.CYBER_ERA,
    level: 2,
    isBoss: false,
    year: 2021,
    targetMultiplier: 2.0,
    duration: 60
  },
  {
    id: '4-3',
    name: '4-3: LUNA归零',
    description: '2022年5月。算法稳定币崩盘。',
    difficulty: 5,
    data: generateCurve(80, 100, 8.0, -2.0).map((d, i) => i > 40 ? { ...d, price: d.price * Math.pow(0.3, (i - 40) / 20) } : d),
    eventText: 'UST脱锚，LUNA在48小时内从80美元跌至0.0001美元。',
    chapter: Chapter.CYBER_ERA,
    level: 3,
    isBoss: false,
    year: 2022,
    targetMultiplier: 2.5,
    duration: 60
  },
  {
    id: '4-10',
    name: '4-10: 最终BOSS - 英伟达/比特币极端波动',
    description: '2024-2025年。AI狂潮与加密货币的终极对决。',
    difficulty: 5,
    data: generateCurve(500, 100, 10.0, 0).map((d, i) => {
      const wave = Math.sin(i / 10) * 0.5;
      return { ...d, price: d.price * (1 + wave) };
    }),
    eventText: 'AI算力需求爆炸，英伟达股价如过山车。比特币ETF通过，波动率突破天际！',
    chapter: Chapter.CYBER_ERA,
    level: 10,
    isBoss: true,
    year: 2024,
    targetMultiplier: 4.0,
    duration: 60
  }
];

// 合并所有关卡
export const SCENARIOS: Scenario[] = [
  ...chapter1Scenarios,
  ...chapter2Scenarios,
  ...chapter3Scenarios,
  ...chapter4Scenarios
];

// 按章节分组
export const SCENARIOS_BY_CHAPTER: Record<Chapter, Scenario[]> = {
  [Chapter.GOLDEN_AGE]: chapter1Scenarios,
  [Chapter.SUBPRIME_STORM]: chapter2Scenarios,
  [Chapter.QUANTUM_RUSH]: chapter3Scenarios,
  [Chapter.CYBER_ERA]: chapter4Scenarios
};

export const LEVERAGE_OPTIONS = [1, 5, 10, 25, 50, 100];

// 商店配置
export const EQUIPMENT_PRICES: Record<string, number[]> = {
  [EquipmentType.ANTI_GRAVITY_ENGINE]: [50, 150, 300, 600, 1200], // Lv1-5
  [EquipmentType.HIGH_FREQ_RADAR]: [100, 200, 400, 800, 1600],
  [EquipmentType.DIAMOND_MINER]: [200, 400, 800, 1600, 3200]
};

export const CONSUMABLE_PRICES: Record<string, number> = {
  [ConsumableType.STOP_LOSS_BOT]: 150,
  [ConsumableType.TIME_CAPSULE]: 200,
  [ConsumableType.INSIDER_INFO]: 300
};

// 复活价格（按关卡递增）
export const getReviveCost = (level: number): number => {
  const baseCost = 100;
  const multiplier = Math.floor(level / 5) + 1;
  return baseCost * Math.pow(2, multiplier - 1);
};

// 初始资金
export const INITIAL_CASH = 10000;

// 局间商店临时道具价格（用现金购买）
export const TEMPORARY_ITEM_PRICES: Record<TemporaryItemType, number> = {
  [TemporaryItemType.HIGH_LEVERAGE_PERMIT]: 500,  // 强力大力丸
  [TemporaryItemType.DYNAMITE]: 300,              // 止损机器人
  [TemporaryItemType.LUCKY_NEWS]: 800,            // 幸运草
  [TemporaryItemType.TIME_FREEZE]: 400            // 时间冻结液
};
