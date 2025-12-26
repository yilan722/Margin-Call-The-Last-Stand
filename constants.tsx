
import { Scenario, Chapter, EquipmentType, ConsumableType, TemporaryItemType } from './types';
import { fetchHistoricalData } from './dataService';

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

/**
 * 将关卡配置拆分为4个phase
 * 每个phase使用不同的数据段，增加难度和不可预测性
 */
function createLevelWithPhases(
  baseId: string,
  baseName: string,
  description: string,
  difficulty: number,
  chapter: Chapter,
  level: number,
  year: number,
  isBoss: boolean,
  config: {
    symbol?: string;
    startDate?: string;
    endDate?: string;
    basePrice?: number;
    volatility?: number;
    targetMultiplier?: number;
    duration?: number;
    eventText?: string;
  }
): Scenario[] {
  const phases: Scenario[] = [];
  // Phase names will be translated in the component, store phase number only
  const phaseNumbers = [1, 2, 3, 4];
  
  for (let phase = 1; phase <= 4; phase++) {
    // 为每个phase生成不同的趋势（随机，避免可预测性）
    const trends = [
      [0.1, -0.2, 0.15, -0.1],  // Phase 1可能的趋势
      [-0.1, 0.2, -0.15, 0.1],  // Phase 2可能的趋势
      [0.2, -0.3, 0.1, -0.2],   // Phase 3可能的趋势
      [-0.2, 0.3, -0.1, 0.2]    // Phase 4可能的趋势
    ];
    const trendOptions = trends[phase - 1];
    const trend = trendOptions[Math.floor(Math.random() * trendOptions.length)];
    
    // 根据phase调整波动率
    const phaseVolatility = (config.volatility || 1.0) * (0.5 + phase * 0.25);
    
    // 生成数据（如果有symbol，稍后会替换为真实数据）
    const data = generateCurve(
      config.basePrice || 100,
      100,
      phaseVolatility,
      trend
    );
    
    phases.push({
      id: `${baseId}-p${phase}`,
      name: `${baseName}`, // Phase will be added in component using i18n
      description: description, // Description without phase suffix
      difficulty,
      data,
      eventText: config.eventText || '',
      chapter,
      level,
      phase,
      isBoss: isBoss && phase === 4, // 只有最后一个phase是BOSS
      year,
      targetMultiplier: config.targetMultiplier,
      duration: config.duration || 60,
      symbol: config.symbol,
      startDate: config.startDate,
      endDate: config.endDate
    });
  }
  
  return phases;
}

// 第1章：黄金时代 (1990-2000)
const chapter1Scenarios: Scenario[] = [
  // 1-1: 1990年市场（隐藏具体事件，避免判断多空）
  ...createLevelWithPhases('1-1', '1-1: 1990年市场', '1990年。新手教学关卡，波动率极低。', 1, Chapter.GOLDEN_AGE, 1, 1990, false, {
    symbol: 'SPY',
    startDate: '1990-01-01',
    endDate: '1990-12-31',
    basePrice: 10,
    volatility: 0.3,
    targetMultiplier: 1.2,
    duration: 60,
    eventText: '一切安好，除了无聊。'
  }),
  
  // 1-2: 1995年市场
  ...createLevelWithPhases('1-2', '1-2: 1995年市场', '1995年。科技股开始受到关注。', 1, Chapter.GOLDEN_AGE, 2, 1995, false, {
    symbol: 'MSFT',
    startDate: '1995-01-01',
    endDate: '1995-12-31',
    basePrice: 5,
    volatility: 0.6,
    targetMultiplier: 1.5,
    duration: 60,
    eventText: 'Windows 95发布，市场情绪高涨。'
  }),
  
  // 1-3: 1997年市场
  ...createLevelWithPhases('1-3', '1-3: 1997年市场', '1997年。外部冲击开始影响全球市场。', 2, Chapter.GOLDEN_AGE, 3, 1997, false, {
    symbol: 'SPY',
    startDate: '1997-01-01',
    endDate: '1997-12-31',
    basePrice: 100,
    volatility: 1.0,
    targetMultiplier: 1.8,
    duration: 60,
    eventText: '泰铢崩盘，连锁反应波及全球。'
  }),
  
  // 1-4: 1999年市场
  ...createLevelWithPhases('1-4', '1-4: 1999年市场', '1999年。市场狂热，但暗流涌动。', 3, Chapter.GOLDEN_AGE, 4, 1999, false, {
    symbol: 'QQQ',
    startDate: '1999-01-01',
    endDate: '1999-12-31',
    basePrice: 50,
    volatility: 2.0,
    targetMultiplier: 2.0,
    duration: 60,
    eventText: '纳斯达克指数飙升，但估值已脱离现实。'
  }),
  
  // 1-5: BOSS - 2000年市场
  ...createLevelWithPhases('1-5', '1-5: BOSS - 2000年市场', '2000年。市场剧烈波动。', 5, Chapter.GOLDEN_AGE, 5, 2000, true, {
    symbol: 'QQQ',
    startDate: '2000-01-01',
    endDate: '2000-12-31',
    basePrice: 5000,
    volatility: 3.0,
    targetMultiplier: 2.5,
    duration: 60,
    eventText: '泡沫破裂！纳斯达克指数从5000点暴跌至1500点！'
  })
];

// 第2章：次贷风云 (2000-2010)
const chapter2Scenarios: Scenario[] = [
  // 2-1: 2001年市场
  ...createLevelWithPhases('2-1', '2-1: 2001年市场', '2001年。企业欺诈引发市场信任危机。', 2, Chapter.SUBPRIME_STORM, 1, 2001, false, {
    symbol: 'SPY',
    startDate: '2001-01-01',
    endDate: '2001-12-31',
    basePrice: 90,
    volatility: 1.5,
    targetMultiplier: 1.3,
    duration: 60,
    eventText: '安然财务造假曝光，股价瞬间归零。'
  }),
  
  // 2-2: 2005年市场
  ...createLevelWithPhases('2-2', '2-2: 2005年市场', '2005年。次贷市场疯狂扩张。', 2, Chapter.SUBPRIME_STORM, 2, 2005, false, {
    symbol: 'SPY',
    startDate: '2005-01-01',
    endDate: '2005-12-31',
    basePrice: 200,
    volatility: 1.2,
    targetMultiplier: 1.6,
    duration: 60,
    eventText: '房价飙升，次贷产品泛滥。'
  }),
  
  // 2-3: 2007年市场
  ...createLevelWithPhases('2-3', '2-3: 2007年市场', '2007年。次贷违约率飙升。', 3, Chapter.SUBPRIME_STORM, 3, 2007, false, {
    symbol: 'SPY',
    startDate: '2007-01-01',
    endDate: '2007-12-31',
    basePrice: 14000,
    volatility: 2.0,
    targetMultiplier: 1.9,
    duration: 60,
    eventText: '次贷违约潮开始，市场恐慌蔓延。'
  }),
  
  // 2-4: 2008年3月市场
  ...createLevelWithPhases('2-4', '2-4: 2008年3月市场', '2008年3月。大型投行开始崩溃。', 4, Chapter.SUBPRIME_STORM, 4, 2008, false, {
    symbol: 'SPY',
    startDate: '2008-01-01',
    endDate: '2008-03-31',
    basePrice: 150,
    volatility: 3.0,
    targetMultiplier: 2.2,
    duration: 60,
    eventText: '贝尔斯登被JP摩根收购，市场信心崩塌。'
  }),
  
  // 2-5: 2008年4月市场
  ...createLevelWithPhases('2-5', '2-5: 2008年4月市场', '2008年4月。市场持续动荡。', 4, Chapter.SUBPRIME_STORM, 5, 2008, false, {
    symbol: 'SPY',
    startDate: '2008-04-01',
    endDate: '2008-04-30',
    basePrice: 140,
    volatility: 3.5,
    targetMultiplier: 2.4,
    duration: 60,
    eventText: '市场对金融系统稳定性的担忧持续加深。'
  }),
  
  // 2-6: 2008年5月市场
  ...createLevelWithPhases('2-6', '2-6: 2008年5月市场', '2008年5月。信贷市场紧缩。', 4, Chapter.SUBPRIME_STORM, 6, 2008, false, {
    symbol: 'SPY',
    startDate: '2008-05-01',
    endDate: '2008-05-31',
    basePrice: 130,
    volatility: 3.8,
    targetMultiplier: 2.6,
    duration: 60,
    eventText: '银行间拆借利率飙升，流动性危机加剧。'
  }),
  
  // 2-7: 2008年6月市场
  ...createLevelWithPhases('2-7', '2-7: 2008年6月市场', '2008年6月。市场情绪恶化。', 4, Chapter.SUBPRIME_STORM, 7, 2008, false, {
    symbol: 'SPY',
    startDate: '2008-06-01',
    endDate: '2008-06-30',
    basePrice: 120,
    volatility: 4.0,
    targetMultiplier: 2.7,
    duration: 60,
    eventText: '油价飙升至历史高位，通胀担忧加剧。'
  }),
  
  // 2-8: 2008年7月市场
  ...createLevelWithPhases('2-8', '2-8: 2008年7月市场', '2008年7月。房利美和房地美危机。', 5, Chapter.SUBPRIME_STORM, 8, 2008, false, {
    symbol: 'SPY',
    startDate: '2008-07-01',
    endDate: '2008-07-31',
    basePrice: 110,
    volatility: 4.5,
    targetMultiplier: 2.8,
    duration: 60,
    eventText: '房利美和房地美濒临破产，政府紧急干预。'
  }),
  
  // 2-9: 2008年8月市场
  ...createLevelWithPhases('2-9', '2-9: 2008年8月市场', '2008年8月。危机前夜。', 5, Chapter.SUBPRIME_STORM, 9, 2008, false, {
    symbol: 'SPY',
    startDate: '2008-08-01',
    endDate: '2008-08-31',
    basePrice: 50,
    volatility: 4.8,
    targetMultiplier: 2.9,
    duration: 60,
    eventText: '市场对雷曼兄弟的担忧达到顶点，恐慌情绪蔓延。'
  }),
  
  // 2-10: BOSS - 2008年9月市场
  ...createLevelWithPhases('2-10', '2-10: BOSS - 2008年9月市场', '2008年9月。市场剧烈波动。', 5, Chapter.SUBPRIME_STORM, 10, 2008, true, {
    symbol: 'SPY',
    startDate: '2008-09-01',
    endDate: '2008-09-30',
    basePrice: 40,
    volatility: 5.0,
    targetMultiplier: 3.0,
    duration: 60,
    eventText: '雷曼兄弟申请破产！道指单日暴跌777点！'
  })
];

// 第3章：量化狂潮 (2010-2020)
const chapter3Scenarios: Scenario[] = [
  // 3-1: 2010年5月市场
  ...createLevelWithPhases('3-1', '3-1: 2010年5月市场', '2010年5月。只有几秒钟反应时间。', 5, Chapter.QUANTUM_RUSH, 1, 2010, false, {
    symbol: 'SPY',
    startDate: '2010-05-01',
    endDate: '2010-05-31',
    basePrice: 11000,
    volatility: 8.0,
    targetMultiplier: 1.4,
    duration: 30,
    eventText: '算法交易失控！市场在5分钟内蒸发1万亿美元！'
  }),
  
  // 3-2: 2011年市场
  ...createLevelWithPhases('3-2', '3-2: 2011年市场', '2011年。希腊债务危机引发欧洲市场动荡。', 3, Chapter.QUANTUM_RUSH, 2, 2011, false, {
    symbol: 'SPY',
    startDate: '2011-01-01',
    endDate: '2011-12-31',
    basePrice: 13000,
    volatility: 2.5,
    targetMultiplier: 1.7,
    duration: 60,
    eventText: '希腊违约风险，欧元区面临解体威胁。'
  }),
  
  // 3-3: 2015年市场
  ...createLevelWithPhases('3-3', '3-3: 2015年市场', '2015年。A股市场崩盘，千股跌停。', 4, Chapter.QUANTUM_RUSH, 3, 2015, false, {
    symbol: 'SPY',
    startDate: '2015-01-01',
    endDate: '2015-12-31',
    basePrice: 5000,
    volatility: 4.0,
    targetMultiplier: 2.0,
    duration: 60,
    eventText: '杠杆资金爆仓，A股连续熔断。'
  }),
  
  // 3-4: 2017年市场
  ...createLevelWithPhases('3-4', '3-4: 2017年市场', '2017年。加密货币首次进入主流视野。', 4, Chapter.QUANTUM_RUSH, 4, 2017, false, {
    symbol: 'BTC',
    startDate: '2017-01-01',
    endDate: '2017-12-31',
    basePrice: 1000,
    volatility: 5.0,
    targetMultiplier: 2.5,
    duration: 60,
    eventText: '比特币突破2万美元，FOMO情绪达到顶峰。'
  })
];

// 第4章：赛博纪元 (2020-2025)
const chapter4Scenarios: Scenario[] = [
  // 4-1: 2020年3月市场
  ...createLevelWithPhases('4-1', '4-1: 2020年3月市场', '2020年3月。COVID-19引发全球市场恐慌。', 4, Chapter.CYBER_ERA, 1, 2020, false, {
    symbol: 'SPY',
    startDate: '2020-03-01',
    endDate: '2020-03-31',
    basePrice: 29000,
    volatility: 4.0,
    targetMultiplier: 1.5,
    duration: 60,
    eventText: '疫情封锁，美股连续熔断，恐慌指数飙升。'
  }),
  
  // 4-2: 2021年1月市场
  ...createLevelWithPhases('4-2', '4-2: 2021年1月市场', '2021年1月。散户起义，空头被拉爆。', 4, Chapter.CYBER_ERA, 2, 2021, false, {
    symbol: 'GME',
    startDate: '2021-01-01',
    endDate: '2021-01-31',
    basePrice: 20,
    volatility: 6.0,
    targetMultiplier: 2.0,
    duration: 60,
    eventText: 'Reddit散户抱团，GME股价暴涨1700%！'
  }),
  
  // 4-3: 2022年5月市场
  ...createLevelWithPhases('4-3', '4-3: 2022年5月市场', '2022年5月。算法稳定币崩盘。', 5, Chapter.CYBER_ERA, 3, 2022, false, {
    symbol: 'BTC',
    startDate: '2022-05-01',
    endDate: '2022-05-31',
    basePrice: 80,
    volatility: 8.0,
    targetMultiplier: 2.5,
    duration: 60,
    eventText: 'UST脱锚，LUNA在48小时内从80美元跌至0.0001美元。'
  }),
  
  // 4-4: 2022年11月市场
  ...createLevelWithPhases('4-4', '4-4: 2022年11月市场', '2022年11月。全球第二大加密货币交易所瞬间崩塌。', 5, Chapter.CYBER_ERA, 4, 2022, false, {
    symbol: 'BTC',
    startDate: '2022-11-01',
    endDate: '2022-11-30',
    basePrice: 200,
    volatility: 7.0,
    targetMultiplier: 2.8,
    duration: 60,
    eventText: 'FTX创始人被捕，300亿美元市值一夜归零，引发加密市场全面崩盘。'
  }),
  
  // 4-5: 2023年3月市场
  ...createLevelWithPhases('4-5', '4-5: 2023年3月市场', '2023年3月。美国银行业危机，区域性银行连环爆雷。', 4, Chapter.CYBER_ERA, 5, 2023, false, {
    symbol: 'SPY',
    startDate: '2023-03-01',
    endDate: '2023-03-31',
    basePrice: 180,
    volatility: 5.0,
    targetMultiplier: 3.0,
    duration: 60,
    eventText: 'SVB在48小时内倒闭，引发银行挤兑潮，美联储紧急救市。'
  }),
  
  // 4-6: 2023年3月市场（瑞信）
  ...createLevelWithPhases('4-6', '4-6: 2023年3月市场', '2023年3月。167年历史的瑞士信贷银行被紧急收购。', 4, Chapter.CYBER_ERA, 6, 2023, false, {
    symbol: 'SPY',
    startDate: '2023-03-15',
    endDate: '2023-03-31',
    basePrice: 12,
    volatility: 4.5,
    targetMultiplier: 3.2,
    duration: 60,
    eventText: '瑞信AT1债券被清零，股东血本无归，引发全球金融恐慌。'
  }),
  
  // 4-7: 2023年5月市场
  ...createLevelWithPhases('4-7', '4-7: 2023年5月市场', '2023年5月。ChatGPT引爆AI投资热潮。', 4, Chapter.CYBER_ERA, 7, 2023, false, {
    symbol: 'NVDA',
    startDate: '2023-05-01',
    endDate: '2023-05-31',
    basePrice: 300,
    volatility: 6.0,
    targetMultiplier: 3.5,
    duration: 60,
    eventText: 'AI算力需求爆炸，英伟达股价一年内暴涨300%，市值突破2万亿美元。'
  }),
  
  // 4-8: 2024年1月市场
  ...createLevelWithPhases('4-8', '4-8: 2024年1月市场', '2024年1月。比特币现货ETF正式获批。', 4, Chapter.CYBER_ERA, 8, 2024, false, {
    symbol: 'BTC',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    basePrice: 42000,
    volatility: 8.0,
    targetMultiplier: 3.8,
    duration: 60,
    eventText: 'SEC批准比特币ETF，首日交易量突破46亿美元，价格剧烈波动。'
  }),
  
  // 4-9: 2024年3月市场
  ...createLevelWithPhases('4-9', '4-9: 2024年3月市场', '2024年3月。AI概念股集体回调。', 5, Chapter.CYBER_ERA, 9, 2024, false, {
    symbol: 'NVDA',
    startDate: '2024-03-01',
    endDate: '2024-03-31',
    basePrice: 500,
    volatility: 9.0,
    targetMultiplier: 3.9,
    duration: 60,
    eventText: 'AI概念股估值过高，市场开始质疑，英伟达等股票大幅回调。'
  }),
  
  // 4-10: BOSS - 2024-2025年市场
  ...createLevelWithPhases('4-10', '4-10: BOSS - 2024-2025年市场', '2024-2025年。AI狂潮与加密货币的终极对决。', 5, Chapter.CYBER_ERA, 10, 2024, true, {
    symbol: 'NVDA',
    startDate: '2024-06-01',
    endDate: '2024-12-31',
    basePrice: 500,
    volatility: 10.0,
    targetMultiplier: 4.0,
    duration: 60,
    eventText: 'AI算力需求爆炸，英伟达股价如过山车。比特币ETF通过，波动率突破天际！'
  })
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
