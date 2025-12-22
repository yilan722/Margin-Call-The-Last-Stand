import React, { useState } from 'react';
import { PlayerProfile, EquipmentType, ConsumableType } from '../types';
import { EQUIPMENT_PRICES, CONSUMABLE_PRICES } from '../constants';

interface Props {
  profile: PlayerProfile;
  onPurchase: (type: 'equipment' | 'consumable', itemType: EquipmentType | ConsumableType) => void;
  onBack: () => void;
}

const DarkPoolShop: React.FC<Props> = ({ profile, onPurchase, onBack }) => {
  const [selectedTab, setSelectedTab] = useState<'equipment' | 'consumable'>('equipment');

  const getEquipmentLevel = (type: EquipmentType): number => {
    const eq = profile.equipment.find(e => e.type === type);
    return eq ? eq.level : 0;
  };

  const getConsumableCount = (type: ConsumableType): number => {
    const cons = profile.consumables.find(c => c.type === type);
    return cons ? cons.count : 0;
  };

  const getEquipmentPrice = (type: EquipmentType): number => {
    const level = getEquipmentLevel(type);
    if (level >= 5) return 0; // Max level
    return EQUIPMENT_PRICES[type][level] || 0;
  };

  const equipmentInfo: Record<EquipmentType, { name: string; desc: string; effect: string }> = {
    [EquipmentType.ANTI_GRAVITY_ENGINE]: {
      name: '反重力引擎',
      desc: '减缓下跌时的坠落速度',
      effect: 'Lv1: -10% 坠落速度 | Lv2: -20% | Lv3: -30% | Lv4: -40% | Lv5: -50%'
    },
    [EquipmentType.HIGH_FREQ_RADAR]: {
      name: '高频雷达',
      desc: '提前预警激光网的加速',
      effect: 'Lv1: +0.5秒预警 | Lv2: +1.0秒 | Lv3: +1.5秒 | Lv4: +2.0秒 | Lv5: +2.5秒'
    },
    [EquipmentType.DIAMOND_MINER]: {
      name: '钻石矿机',
      desc: '结算时钻石获取量增加',
      effect: 'Lv1: +10% | Lv2: +20% | Lv3: +30% | Lv4: +40% | Lv5: +50%'
    }
  };

  const consumableInfo: Record<ConsumableType, { name: string; desc: string; effect: string }> = {
    [ConsumableType.STOP_LOSS_BOT]: {
      name: '熔断保护器',
      desc: '抵挡一次必死的爆仓（每关限带一个）',
      effect: '相当于多一条命'
    },
    [ConsumableType.TIME_CAPSULE]: {
      name: '时间胶囊',
      desc: '将K线回退3秒（悔棋功能）',
      effect: '关键时刻的后悔药'
    },
    [ConsumableType.INSIDER_INFO]: {
      name: '内幕消息卡',
      desc: '显示未来5秒的大概走势（虚线）',
      effect: '预知未来，但代价高昂'
    }
  };

  return (
    <div className="z-30 w-full h-full bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-slate-900 to-transparent pb-8 pt-8 px-16 border-b border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="orbitron text-5xl font-black text-white tracking-tighter">黑市交易所</h1>
          <button
            onClick={onBack}
            className="px-6 py-3 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all orbitron text-sm uppercase tracking-widest"
          >
            返回
          </button>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">💎</span>
            <div>
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest">时间钻石</div>
              <div className="text-2xl font-bold text-cyan-400 orbitron">{profile.timeDiamonds}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-16 pt-8 flex space-x-4 border-b border-slate-800">
        <button
          onClick={() => setSelectedTab('equipment')}
          className={`px-8 py-4 orbitron font-black uppercase tracking-widest transition-all ${
            selectedTab === 'equipment'
              ? 'border-b-4 border-cyan-500 text-cyan-400'
              : 'text-slate-600 hover:text-slate-400'
          }`}
        >
          装备系统（永久）
        </button>
        <button
          onClick={() => setSelectedTab('consumable')}
          className={`px-8 py-4 orbitron font-black uppercase tracking-widest transition-all ${
            selectedTab === 'consumable'
              ? 'border-b-4 border-cyan-500 text-cyan-400'
              : 'text-slate-600 hover:text-slate-400'
          }`}
        >
          消耗品（带入关卡）
        </button>
      </div>

      {/* Content */}
      <div className="px-16 py-12">
        {selectedTab === 'equipment' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.values(EquipmentType).map((type) => {
              const level = getEquipmentLevel(type);
              const price = getEquipmentPrice(type);
              const info = equipmentInfo[type];
              const canAfford = profile.timeDiamonds >= price;
              const isMaxLevel = level >= 5;

              return (
                <div
                  key={type}
                  className={`p-6 border-2 rounded transition-all ${
                    isMaxLevel
                      ? 'border-amber-500 bg-amber-500/10'
                      : canAfford
                      ? 'border-slate-700 bg-slate-900/50 hover:border-cyan-500'
                      : 'border-slate-800 bg-slate-950/50 opacity-50'
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="orbitron text-xl font-black text-white mb-2">{info.name}</h3>
                    <div className="text-sm text-slate-400 mb-2">{info.desc}</div>
                    <div className="text-xs text-cyan-400 mb-4">{info.effect}</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 text-xs">当前等级:</span>
                      <span className="text-amber-500 font-bold">{level}/5</span>
                    </div>
                  </div>
                  
                  {!isMaxLevel && (
                    <button
                      onClick={() => onPurchase('equipment', type)}
                      disabled={!canAfford}
                      className={`w-full py-3 orbitron font-black uppercase tracking-widest transition-all ${
                        canAfford
                          ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                          : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                      }`}
                    >
                      {canAfford ? `升级 - ${price} 💎` : `需要 ${price} 💎`}
                    </button>
                  )}
                  {isMaxLevel && (
                    <div className="w-full py-3 bg-amber-600/20 text-amber-400 text-center orbitron font-black uppercase tracking-widest">
                      已满级
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {selectedTab === 'consumable' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {Object.values(ConsumableType).map((type) => {
              const count = getConsumableCount(type);
              const price = CONSUMABLE_PRICES[type];
              const info = consumableInfo[type];
              const canAfford = profile.timeDiamonds >= price;

              return (
                <div
                  key={type}
                  className={`p-6 border-2 rounded transition-all ${
                    canAfford
                      ? 'border-slate-700 bg-slate-900/50 hover:border-cyan-500'
                      : 'border-slate-800 bg-slate-950/50 opacity-50'
                  }`}
                >
                  <div className="mb-4">
                    <h3 className="orbitron text-xl font-black text-white mb-2">{info.name}</h3>
                    <div className="text-sm text-slate-400 mb-2">{info.desc}</div>
                    <div className="text-xs text-cyan-400 mb-4">{info.effect}</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-500 text-xs">库存:</span>
                      <span className="text-emerald-500 font-bold">{count}</span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => onPurchase('consumable', type)}
                    disabled={!canAfford}
                    className={`w-full py-3 orbitron font-black uppercase tracking-widest transition-all ${
                      canAfford
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? `购买 - ${price} 💎` : `需要 ${price} 💎`}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DarkPoolShop;


