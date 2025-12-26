import React, { useState } from 'react';
import { i18n } from '../utils/i18n';
import { DIAMOND_PACKAGES, DiamondPackage, getTotalDiamonds, getPricePerDiamond } from '../utils/paymentConfig';
import { soundManager } from '../utils/soundManager';

interface Props {
  currentDiamonds: number;
  onPurchase: (packageId: string) => void;
  onClose: () => void;
}

const DiamondShop: React.FC<Props> = ({ currentDiamonds, onPurchase, onClose }) => {
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSelectPackage = (pkg: DiamondPackage) => {
    soundManager.playClick();
    setSelectedPackage(pkg.id);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;
    
    setIsProcessing(true);
    soundManager.playClick();
    
    try {
      // 调用支付处理函数
      await onPurchase(selectedPackage);
    } catch (error) {
      console.error('Purchase error:', error);
      alert(i18n.t('diamondShop.purchaseError'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-lg p-6 md:p-8 max-w-4xl w-full mx-2 md:mx-4 my-4 md:my-auto shadow-2xl relative">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-black orbitron text-cyan-400 mb-2">
              {i18n.t('diamondShop.title')}
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              {i18n.t('diamondShop.currentDiamonds', { diamonds: currentDiamonds })}
            </p>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="text-slate-400 hover:text-white transition-all text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Package Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {DIAMOND_PACKAGES.map((pkg) => {
            const totalDiamonds = getTotalDiamonds(pkg.id);
            const pricePerDiamond = getPricePerDiamond(pkg.id);
            const isSelected = selectedPackage === pkg.id;

            return (
              <div
                key={pkg.id}
                onClick={() => handleSelectPackage(pkg)}
                className={`relative p-4 md:p-6 border-2 rounded-lg cursor-pointer transition-all ${
                  isSelected
                    ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                {/* Badges */}
                {pkg.popular && (
                  <div className="absolute top-2 right-2 bg-amber-500 text-black text-xs font-black orbitron px-2 py-1 rounded uppercase">
                    {i18n.t('diamondShop.popular')}
                  </div>
                )}
                {pkg.bestValue && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-black text-xs font-black orbitron px-2 py-1 rounded uppercase">
                    {i18n.t('diamondShop.bestValue')}
                  </div>
                )}

                {/* Package Info */}
                <div className="text-center">
                  <div className="text-3xl md:text-4xl font-black orbitron text-cyan-400 mb-2">
                    {totalDiamonds.toLocaleString()} 💎
                  </div>
                  {pkg.bonus && pkg.bonus > 0 && (
                    <div className="text-xs md:text-sm text-emerald-400 mb-2">
                      {i18n.t('diamondShop.bonus', { bonus: pkg.bonus })}
                    </div>
                  )}
                  <div className="text-xl md:text-2xl font-black orbitron text-white mb-1">
                    ${pkg.price.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500">
                    ${pricePerDiamond.toFixed(4)} / 💎
                  </div>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-cyan-400 text-sm font-bold orbitron">
                    ✓ {i18n.t('diamondShop.selected')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Purchase Button */}
        <div className="flex flex-col md:flex-row gap-4">
          <button
            onClick={handlePurchase}
            disabled={!selectedPackage || isProcessing}
            className={`flex-1 py-4 px-6 font-black orbitron uppercase tracking-widest transition-all ${
              selectedPackage && !isProcessing
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_30px_rgba(6,182,212,0.5)]'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isProcessing
              ? i18n.t('diamondShop.processing')
              : selectedPackage
              ? i18n.t('diamondShop.purchase', {
                  price: DIAMOND_PACKAGES.find(p => p.id === selectedPackage)?.price.toFixed(2) || '0.00'
                })
              : i18n.t('diamondShop.selectPackage')}
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="px-6 py-4 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all orbitron font-bold uppercase tracking-widest"
          >
            {i18n.t('common.cancel')}
          </button>
        </div>

        {/* Info Text */}
        <div className="mt-6 p-4 bg-slate-800/50 rounded border border-slate-700">
          <p className="text-xs text-slate-400 text-center">
            {i18n.t('diamondShop.info')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DiamondShop;

