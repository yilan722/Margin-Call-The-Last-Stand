import React from 'react';
import { TemporaryItemType } from '../types';
import { TEMPORARY_ITEM_PRICES } from '../constants';
import { i18n } from '../utils/i18n';

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
  const itemInfo: Record<TemporaryItemType, { nameKey: string; descKey: string; effectKey: string; icon: string }> = {
    [TemporaryItemType.HIGH_LEVERAGE_PERMIT]: {
      nameKey: 'intermissionShop.items.highLeverage.name',
      descKey: 'intermissionShop.items.highLeverage.desc',
      effectKey: 'intermissionShop.items.highLeverage.effect',
      icon: '💊'
    },
    [TemporaryItemType.DYNAMITE]: {
      nameKey: 'intermissionShop.items.dynamite.name',
      descKey: 'intermissionShop.items.dynamite.desc',
      effectKey: 'intermissionShop.items.dynamite.effect',
      icon: '💣'
    },
    [TemporaryItemType.LUCKY_NEWS]: {
      nameKey: 'intermissionShop.items.luckyNews.name',
      descKey: 'intermissionShop.items.luckyNews.desc',
      effectKey: 'intermissionShop.items.luckyNews.effect',
      icon: '🍀'
    },
    [TemporaryItemType.TIME_FREEZE]: {
      nameKey: 'intermissionShop.items.timeFreeze.name',
      descKey: 'intermissionShop.items.timeFreeze.desc',
      effectKey: 'intermissionShop.items.timeFreeze.effect',
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
          <h1 className="orbitron text-5xl font-black text-white tracking-tighter">{i18n.t('intermissionShop.title')}</h1>
          <button
            onClick={onBack}
            className="px-6 py-3 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all orbitron text-sm uppercase tracking-widest"
          >
            {i18n.t('common.back')}
          </button>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">💰</span>
            <div>
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest">{i18n.t('intermissionShop.currentCash')}</div>
              <div className="text-2xl font-bold text-emerald-400 orbitron">${currentCash.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Warning */}
        <div className="mt-6 bg-amber-950/30 border border-amber-500/50 p-4 rounded">
          <div className="text-amber-400 text-sm orbitron">
            {i18n.t('intermissionShop.warning')}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-16 py-12">
        <div className="mb-8">
          <h2 className="orbitron text-2xl font-black text-white mb-4">{i18n.t('intermissionShop.itemsTitle')}</h2>
          <p className="text-slate-400 text-sm">{i18n.t('intermissionShop.itemsDescription')}</p>
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
                    <h3 className="orbitron text-xl font-black text-white mb-2">{i18n.t(info.nameKey)}</h3>
                    <div className="text-sm text-slate-400 mb-2">{i18n.t(info.descKey)}</div>
                    <div className="text-xs text-cyan-400 mb-4">{i18n.t(info.effectKey)}</div>
                    {count > 0 && (
                      <div className="text-xs text-emerald-400 mb-2">{i18n.t('intermissionShop.owned')}: {count}</div>
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
                    {canAfford ? i18n.t('intermissionShop.buy') : i18n.t('intermissionShop.insufficientFunds')}
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
            {i18n.t('intermissionShop.continueWithCash', { amount: currentCash.toLocaleString() })}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntermissionShop;



