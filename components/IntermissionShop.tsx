import React from 'react';
import { TemporaryItemType } from '../types';
import { TEMPORARY_ITEM_PRICES } from '../constants';

interface Props {
  currentCash: number;
  temporaryItems: { type: TemporaryItemType; count: number }[];
  onPurchase: (type: TemporaryItemType) => void;
  onContinue: () => void;
  onBack: () => void;
}

const IntermissionShop: React.FC<Props> = ({ 
  currentCash, 
  temporaryItems, 
  onPurchase, 
  onContinue,
  onBack 
}) => {
  const itemInfo: Record<TemporaryItemType, { name: string; desc: string; effect: string; icon: string }> = {
    [TemporaryItemType.HIGH_LEVERAGE_PERMIT]: {
      name: '强力大力丸',
      desc: '下一关允许开启100x杠杆',
      effect: '突破杠杆限制，高风险高回报',
      icon: '💊'
    },
    [TemporaryItemType.DYNAMITE]: {
      name: '止损机器人',
      desc: '下一关如果做错方向，可以按空格键无损平仓一次',
      effect: '相当于炸药炸掉石头，关键时刻的救命稻草',
      icon: '💣'
    },
    [TemporaryItemType.LUCKY_NEWS]: {
      name: '幸运草',
      desc: '下一关必定是上涨行情（多头福利）',
      effect: '市场情绪偏向多头，但记住：没有绝对',
      icon: '🍀'
    },
    [TemporaryItemType.TIME_FREEZE]: {
      name: '时间冻结液',
      desc: '下一关增加10秒交易时间',
      effect: '更多时间意味着更多机会，但也可能是更多风险',
      icon: '⏰'
    }
  };

  const getItemCount = (type: TemporaryItemType): number => {
    const item = temporaryItems.find(i => i.type === type);
    return item ? item.count : 0;
  };

  return (
    <div className="z-30 w-full h-full bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-slate-900 to-transparent pb-8 pt-8 px-16 border-b border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="orbitron text-5xl font-black text-white tracking-tighter">黑市商人</h1>
          <button
            onClick={onBack}
            className="px-6 py-3 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all orbitron text-sm uppercase tracking-widest"
          >
            返回
          </button>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">💰</span>
            <div>
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest">当前本金</div>
              <div className="text-2xl font-bold text-emerald-400 orbitron">${currentCash.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-6 bg-amber-950/30 border border-amber-500/50 p-4 rounded">
          <div className="text-amber-400 text-sm orbitron">
            ⚠️ 注意：使用现金购买道具会减少你的本金，增加下一关达标的难度！这是一种策略博弈。
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-16 py-12">
        <div className="mb-8">
          <h2 className="orbitron text-2xl font-black text-white mb-4">临时道具（仅对下一关有效）</h2>
          <p className="text-slate-400 text-sm">这些道具会在下一关开始时生效，使用后消失。</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.values(TemporaryItemType).map((type) => {
            const price = TEMPORARY_ITEM_PRICES[type];
            const info = itemInfo[type];
            const count = getItemCount(type);
            const canAfford = currentCash >= price;

            return (
              <div
                key={type}
                className={`p-6 border-2 rounded transition-all ${
                  canAfford
                    ? 'border-slate-700 bg-slate-900/50 hover:border-cyan-500'
                    : 'border-slate-800 bg-slate-950/50 opacity-50'
                }`}
              >
                <div className="flex items-start space-x-4 mb-4">
                  <div className="text-4xl">{info.icon}</div>
                  <div className="flex-1">
                    <h3 className="orbitron text-xl font-black text-white mb-2">{info.name}</h3>
                    <div className="text-sm text-slate-400 mb-2">{info.desc}</div>
                    <div className="text-xs text-cyan-400 mb-4">{info.effect}</div>
                    {count > 0 && (
                      <div className="text-xs text-emerald-400 mb-2">已拥有: {count}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-amber-400">
                    ${price.toLocaleString()}
                  </div>
                  <button
                    onClick={() => canAfford && onPurchase(type)}
                    disabled={!canAfford}
                    className={`px-6 py-2 orbitron font-black uppercase tracking-widest transition-all ${
                      canAfford
                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? '购买' : '资金不足'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Continue Button */}
        <div className="mt-12 flex justify-center">
          <button
            onClick={onContinue}
            className="px-20 py-5 bg-emerald-600 text-white font-black text-xl orbitron tracking-widest hover:bg-emerald-500 hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-[0_0_50px_rgba(16,185,129,0.5)]"
          >
            继续征程（剩余本金: ${currentCash.toLocaleString()}）
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntermissionShop;

