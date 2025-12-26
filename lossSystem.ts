// ==========================================
// 损失惩罚系统（Loss Penalty System）
// ==========================================

/**
 * 计算业绩未达标时的损失惩罚
 * @param finalBalance 最终余额
 * @param targetBalance 目标金额
 * @param startingCash 起始本金
 * @return 损失惩罚详情
 */
export function calculateFailurePenalty(
  finalBalance: number,
  targetBalance: number,
  startingCash: number,
  lang: 'en' | 'zh' = 'en'
) {
  const shortage = targetBalance - finalBalance; // 差额
  const lossRatio = (startingCash - finalBalance) / startingCash; // 损失比例（相对于起始本金）
  
  // 1. 现金惩罚：按损失比例扣减
  // 公式：扣减金额 = 最终余额 × 损失惩罚系数
  // 损失惩罚系数：损失越大，扣减越多
  const cashPenaltyRatio = Math.min(0.5, lossRatio * 0.8); // 最高扣减50%
  const cashPenalty = Math.floor(finalBalance * cashPenaltyRatio);
  const remainingCash = Math.max(0, finalBalance - cashPenalty);
  
  // 2. 钻石惩罚：根据实际损失金额和损失比例综合计算（更合理）
  // 使用"损失金额"而非"起始本金"来计算，避免本金过大时惩罚过高
  const actualLoss = startingCash - finalBalance; // 实际损失金额
  
  let diamondPenalty = 0;
  if (lossRatio >= 0.5) {
    // 损失超过50%，按损失金额的0.05%扣钻石（每$2000损失扣1钻）
    diamondPenalty = Math.floor(actualLoss / 2000);
    diamondPenalty = Math.min(300, diamondPenalty); // 封顶300钻
  } else if (lossRatio >= 0.3) {
    // 损失30-50%，按损失金额的0.02%扣钻石（每$5000损失扣1钻）
    diamondPenalty = Math.floor(actualLoss / 5000);
    diamondPenalty = Math.min(150, diamondPenalty); // 封顶150钻
  } else if (lossRatio >= 0.1) {
    // 损失10-30%，按损失金额的0.01%扣钻石（每$10000损失扣1钻）
    diamondPenalty = Math.floor(actualLoss / 10000);
    diamondPenalty = Math.min(80, diamondPenalty); // 封顶80钻
  } else {
    // 损失<10%，按损失金额的0.005%扣钻石（每$20000损失扣1钻）
    diamondPenalty = Math.floor(actualLoss / 20000);
    diamondPenalty = Math.min(30, diamondPenalty); // 封顶30钻
  }
  // 最小惩罚：如果损失很小，不扣钻石
  if (diamondPenalty < 1) {
    diamondPenalty = 0;
  }
  
  // 3. 最小保护：确保不会完全归零（除非爆仓）
  const minCashProtection = Math.floor(startingCash * 0.1); // 至少保留10%起始本金
  const protectedCash = Math.max(minCashProtection, remainingCash);
  
  return {
    shortage: shortage, // 目标差额
    lossRatio: lossRatio, // 损失比例
    cashPenalty: cashPenalty, // 现金扣减
    remainingCash: protectedCash, // 剩余现金（受保护）
    diamondPenalty: diamondPenalty, // 钻石扣减
      message: getPenaltyMessage(lossRatio, cashPenalty, diamondPenalty, lang)
  };
}

/**
 * 计算爆仓时的损失惩罚
 * @param startingCash 起始本金
 * @return 爆仓惩罚详情
 */
export function calculateLiquidationPenalty(startingCash: number, lang: 'en' | 'zh' = 'en') {
  // 爆仓时：
  // 1. 现金完全归零
  // 2. 根据起始本金扣减钻石，使用更温和的缩放
  // 使用平方根缩放，避免本金过大时惩罚过高
  const basePenalty = Math.floor(Math.sqrt(startingCash / 100)); // 平方根缩放
  // 或者使用对数缩放：log10(本金/1000) × 50
  const logScaledPenalty = Math.floor(Math.log10(Math.max(1000, startingCash / 1000)) * 50);
  // 取两者较小值，并设置合理范围
  const diamondPenalty = Math.min(250, Math.max(50, Math.min(basePenalty, logScaledPenalty))); // 50-250钻之间
  
  return {
    cashPenalty: startingCash, // 现金完全归零
    remainingCash: 0,
    diamondPenalty: diamondPenalty,
    message: `爆仓归零！损失 $${startingCash.toLocaleString()}，扣除 ${diamondPenalty} 💎 作为风险保证金。`
  };
}

/**
 * 获取惩罚消息
 */
function getPenaltyMessage(lossRatio: number, cashPenalty: number, diamondPenalty: number, lang: 'en' | 'zh' = 'en'): string {
  const messages = {
    en: {
      severe: `Severe loss! Deducted $${cashPenalty.toLocaleString()} cash and ${diamondPenalty} 💎 as risk margin.`,
      major: `Major loss! Deducted $${cashPenalty.toLocaleString()} cash and ${diamondPenalty} 💎 as risk margin.`,
      minor: `Minor loss! Deducted $${cashPenalty.toLocaleString()} cash${diamondPenalty > 0 ? ` and ${diamondPenalty} 💎` : ''}.`,
      failed: `Failed to meet target! Deducted $${cashPenalty.toLocaleString()} cash as performance penalty.`
    },
    zh: {
      severe: `严重亏损！扣除 $${cashPenalty.toLocaleString()} 现金和 ${diamondPenalty} 💎 作为风险保证金。`,
      major: `较大亏损！扣除 $${cashPenalty.toLocaleString()} 现金和 ${diamondPenalty} 💎 作为风险保证金。`,
      minor: `轻微亏损！扣除 $${cashPenalty.toLocaleString()} 现金${diamondPenalty > 0 ? ` 和 ${diamondPenalty} 💎` : ''}。`,
      failed: `未达标！扣除 $${cashPenalty.toLocaleString()} 现金作为业绩惩罚。`
    }
  };
  
  const msg = messages[lang];
  if (lossRatio >= 0.5) {
    return msg.severe;
  } else if (lossRatio >= 0.3) {
    return msg.major;
  } else if (lossRatio >= 0.1) {
    return msg.minor;
  } else {
    return msg.failed;
  }
}

/**
 * 计算下一关的起始现金（考虑损失惩罚后的继承）
 * @param finalBalance 最终余额
 * @param targetBalance 目标金额
 * @param startingCash 起始本金
 * @param isSuccess 是否成功
 * @return 下一关起始现金
 */
export function calculateNextLevelCash(
  finalBalance: number,
  targetBalance: number,
  startingCash: number,
  isSuccess: boolean,
  lang: 'en' | 'zh' = 'en'
): number {
  if (isSuccess) {
    // 成功：完全继承最终余额
    return finalBalance;
  } else {
    // 失败：应用损失惩罚
    const penalty = calculateFailurePenalty(finalBalance, targetBalance, startingCash, lang);
    return penalty.remainingCash;
  }
}

