// ==========================================
// 游戏核心逻辑：钻石计算和动态难度系统
// ==========================================

// 汇率阶梯配置（优化版：增加更多阶梯，稀释高额利润）
export const EXCHANGE_TIERS = [
  { limit: 5000,   rate: 100 },      // Tier 1: 前 $5,000 利润，每 $100 换 1 钻
  { limit: 50000,  rate: 500 },     // Tier 2: 接下来 $45,000，每 $500 换 1 钻
  { limit: 500000, rate: 2500 },    // Tier 3: 接下来 $450,000，每 $2,500 换 1 钻
  { limit: 5000000, rate: 20000 },  // Tier 4: 接下来 $4,500,000，每 $20,000 换 1 钻（更严格）
  { limit: 50000000, rate: 100000 }, // Tier 5: 接下来 $45,000,000，每 $100,000 换 1 钻（极度稀释）
  { limit: Infinity, rate: 500000 }  // Tier 6: 超过 $50,000,000，每 $500,000 换 1 钻（极端稀释）
];

// 难度增长系数配置
export const DIFFICULTY_CONFIG = {
  baseGrowth: 1.2,   // 基础只需要增长 20%
  maxGrowth: 2.0     // 最高要求增长 100% (防止目标太离谱)
};

/**
 * 计算本关结算数据（钻石奖励和下一关目标）
 * @param currentCash 玩家当前手里的现金
 * @param targetCash 本关的目标金额
 * @return 包含钻石奖励和下一关目标的对象
 */
export function calculateLevelResult(currentCash: number, targetCash: number) {
  // 1. 判定是否通关
  if (currentCash < targetCash) {
    return { 
      success: false, 
      diamonds: 0, 
      nextTarget: 0, 
      growthRate: "0%",
      message: "业绩未达标" 
    };
  }

  // 2. 计算超额收益
  let surplusProfit = currentCash - targetCash;
  let totalDiamonds = 0;
  let remainingProfit = surplusProfit;

  // 3. 阶梯式计算钻石 (核心算法)
  for (let i = 0; i < EXCHANGE_TIERS.length; i++) {
    const tier = EXCHANGE_TIERS[i];
    const prevLimit = i === 0 ? 0 : EXCHANGE_TIERS[i - 1].limit;
    
    // 计算当前阶梯的容量 (Capacity)
    const tierCapacity = tier.limit - prevLimit;

    // 计算有多少利润落在当前阶梯
    const profitInThisTier = Math.min(remainingProfit, tierCapacity);

    if (profitInThisTier > 0) {
      // 累加钻石
      totalDiamonds += Math.floor(profitInThisTier / tier.rate);
      // 扣除已计算的利润
      remainingProfit -= profitInThisTier;
    }

    // 如果利润算完了，提前结束循环
    if (remainingProfit <= 0) break;
  }

  // 4. 计算下一关目标 (动态膨胀)
  // 逻辑：如果玩家赚得特别多 (超过目标的 2 倍)，下一关的增长压力会变大
  const performanceRatio = currentCash / targetCash; 
  
  // 动态增长率：基础 1.2。如果业绩倍数 > 1.5，增长率开始线性增加，最高 2.0
  let dynamicGrowth = DIFFICULTY_CONFIG.baseGrowth;
  if (performanceRatio > 1.5) {
    // 当业绩倍数超过1.5时，每增加0.1倍，增长率增加0.05
    const excessRatio = performanceRatio - 1.5;
    dynamicGrowth += excessRatio * 0.5; 
  }
  // 封顶
  dynamicGrowth = Math.min(dynamicGrowth, DIFFICULTY_CONFIG.maxGrowth);

  // 取整，保持数字美观
  const nextTarget = Math.floor(currentCash * dynamicGrowth);
  const growthRatePercent = Math.round((dynamicGrowth - 1) * 100);

  return {
    success: true,
    profit: surplusProfit,
    diamonds: totalDiamonds,
    nextTarget: nextTarget,
    growthRate: `${growthRatePercent}%`, // 用于显示UI："下一关目标增长 35%"
    dynamicGrowth: dynamicGrowth
  };
}

/**
 * 计算下一关目标金额（动态难度系统）
 * @param currentCash 当前现金
 * @param previousTarget 上一关的目标金额（用于计算业绩倍数）
 * @param baseMultiplier 基础倍率（如果关卡有预设）
 * @return 下一关目标金额
 */
export function calculateNextLevelTarget(
  currentCash: number, 
  previousTarget: number,
  baseMultiplier?: number
): number {
  // 如果有关卡预设的倍率，优先使用
  if (baseMultiplier) {
    return Math.floor(currentCash * baseMultiplier);
  }

  // 否则使用动态难度系统
  const performanceRatio = previousTarget > 0 ? currentCash / previousTarget : 1.5;
  
  let dynamicGrowth = DIFFICULTY_CONFIG.baseGrowth;
  if (performanceRatio > 1.5) {
    const excessRatio = performanceRatio - 1.5;
    dynamicGrowth += excessRatio * 0.5;
  }
  dynamicGrowth = Math.min(dynamicGrowth, DIFFICULTY_CONFIG.maxGrowth);

  return Math.floor(currentCash * dynamicGrowth);
}

/**
 * 获取钻石计算的详细信息（用于UI显示）
 * @param surplusProfit 超额利润
 * @return 每个阶梯的钻石计算详情
 */
export function getDiamondCalculationDetails(surplusProfit: number) {
  const details: Array<{
    tier: number;
    profitRange: string;
    profitInTier: number;
    diamonds: number;
    rate: number;
  }> = [];

  let remainingProfit = surplusProfit;

  for (let i = 0; i < EXCHANGE_TIERS.length; i++) {
    const tier = EXCHANGE_TIERS[i];
    const prevLimit = i === 0 ? 0 : EXCHANGE_TIERS[i - 1].limit;
    const tierCapacity = tier.limit - prevLimit;
    const profitInThisTier = Math.min(remainingProfit, tierCapacity);

    if (profitInThisTier > 0) {
      const diamonds = Math.floor(profitInThisTier / tier.rate);
      details.push({
        tier: i + 1,
        profitRange: prevLimit === 0 
          ? `$0 - $${tier.limit === Infinity ? '∞' : tier.limit.toLocaleString()}`
          : `$${(prevLimit + 1).toLocaleString()} - $${tier.limit === Infinity ? '∞' : tier.limit.toLocaleString()}`,
        profitInTier: profitInThisTier,
        diamonds: diamonds,
        rate: tier.rate
      });
      remainingProfit -= profitInThisTier;
    }

    if (remainingProfit <= 0) break;
  }

  return details;
}

