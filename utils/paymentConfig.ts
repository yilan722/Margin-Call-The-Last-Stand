// ==========================================
// 钻石购买定价配置
// ==========================================

/**
 * 钻石购买套餐配置
 * 定价策略：
 * - 基础比例：$0.01 = 1钻石（相当于游戏内$1超额利润的Tier 1汇率）
 * - 批量购买有优惠，鼓励大额购买
 * - 价格区间：$0.99 - $99.99
 */
export interface DiamondPackage {
  id: string;
  diamonds: number;
  price: number; // 美元价格
  bonus?: number; // 额外赠送的钻石
  popular?: boolean; // 是否标记为热门
  bestValue?: boolean; // 是否标记为最佳价值
}

export const DIAMOND_PACKAGES: DiamondPackage[] = [
  {
    id: 'starter',
    diamonds: 100,
    price: 0.99,
    bonus: 0,
  },
  {
    id: 'small',
    diamonds: 250,
    price: 1.99,
    bonus: 25, // 额外赠送25钻石
  },
  {
    id: 'medium',
    diamonds: 500,
    price: 3.99,
    bonus: 100, // 额外赠送100钻石
    popular: true, // 标记为热门
  },
  {
    id: 'large',
    diamonds: 1000,
    price: 6.99,
    bonus: 250, // 额外赠送250钻石
    bestValue: true, // 标记为最佳价值
  },
  {
    id: 'xlarge',
    diamonds: 2500,
    price: 14.99,
    bonus: 750, // 额外赠送750钻石
  },
  {
    id: 'mega',
    diamonds: 5000,
    price: 24.99,
    bonus: 2000, // 额外赠送2000钻石
  },
];

/**
 * 计算实际获得的钻石总数（包括奖励）
 */
export function getTotalDiamonds(packageId: string): number {
  const pkg = DIAMOND_PACKAGES.find(p => p.id === packageId);
  if (!pkg) return 0;
  return pkg.diamonds + (pkg.bonus || 0);
}

/**
 * 计算每钻石的价格（用于显示性价比）
 */
export function getPricePerDiamond(packageId: string): number {
  const pkg = DIAMOND_PACKAGES.find(p => p.id === packageId);
  if (!pkg) return 0;
  const totalDiamonds = getTotalDiamonds(packageId);
  return pkg.price / totalDiamonds;
}

