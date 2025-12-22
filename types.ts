
export enum GamePhase {
  LOBBY = 'LOBBY',
  CAMPAIGN_MAP = 'CAMPAIGN_MAP',
  SHOP = 'SHOP',
  BETTING = 'BETTING',
  TRADING = 'TRADING',
  RESULT = 'RESULT',
  DEATH = 'DEATH'
}

export enum Side {
  LONG = 'LONG',
  SHORT = 'SHORT'
}

export enum Chapter {
  GOLDEN_AGE = 'GOLDEN_AGE',      // 1990-2000
  SUBPRIME_STORM = 'SUBPRIME_STORM', // 2000-2010
  QUANTUM_RUSH = 'QUANTUM_RUSH',   // 2010-2020
  CYBER_ERA = 'CYBER_ERA'          // 2020-2025
}

export interface PricePoint {
  time: string;
  price: number;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: number; // 1-5 stars
  data: PricePoint[];
  eventText: string;
  chapter: Chapter;
  level: number; // 关卡编号，如 1-1, 1-5 (BOSS)
  isBoss: boolean;
  year: number; // 历史年份
}

// 装备类型（永久提升）
export enum EquipmentType {
  ANTI_GRAVITY_ENGINE = 'ANTI_GRAVITY_ENGINE', // 反重力引擎
  HIGH_FREQ_RADAR = 'HIGH_FREQ_RADAR',         // 高频雷达
  DIAMOND_MINER = 'DIAMOND_MINER'              // 钻石矿机
}

export interface Equipment {
  type: EquipmentType;
  level: number; // 1-Max
  maxLevel: number;
}

// 消耗品类型（带入关卡）
export enum ConsumableType {
  STOP_LOSS_BOT = 'STOP_LOSS_BOT',     // 熔断保护器
  TIME_CAPSULE = 'TIME_CAPSULE',       // 时间胶囊
  INSIDER_INFO = 'INSIDER_INFO'        // 内幕消息卡
}

export interface Consumable {
  type: ConsumableType;
  count: number;
}

// 玩家全局状态（永久数据）
export interface PlayerProfile {
  timeDiamonds: number;        // 时间钻石（全局货币）
  currentChapter: Chapter;      // 当前章节
  currentLevel: number;         // 当前关卡
  unlockedLevels: string[];     // 已解锁关卡ID列表
  equipment: Equipment[];       // 装备列表
  consumables: Consumable[];    // 消耗品库存
  totalDiamondsEarned: number;  // 累计获得钻石
  totalDeaths: number;          // 累计死亡次数
}

export interface PlayerState {
  id: string;
  name: string;
  leverage: number;
  side: Side;
  entryPrice: number;
  currentPnl: number; // Percentage (收益率)
  isDead: boolean;
  isExited: boolean;
  exitPrice?: number;
  exitPnl?: number;
  highPnl: number;
  currentYield: number; // 当前收益率（用于转化为钻石）
  usedConsumables: ConsumableType[]; // 本局已使用的消耗品
}
