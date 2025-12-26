import React, { useState } from 'react';
import { soundManager } from '../utils/soundManager';
import { i18n } from '../utils/i18n';

interface Props {
  currentCash: number;
  currentBalance: number;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
  type: 'margin' | 'cut';
}

const MarginDialog: React.FC<Props> = ({ currentCash, currentBalance, onConfirm, onCancel, type }) => {
  const [amount, setAmount] = useState('');
  const [percentage, setPercentage] = useState(10);

  const isMargin = type === 'margin';
  const maxAmount = isMargin ? currentCash : currentBalance;
  const quickAmounts = isMargin 
    ? [1000, 5000, 10000, Math.floor(currentCash * 0.1), Math.floor(currentCash * 0.5)]
    : [10, 25, 50, 75, 100];

  const handleConfirm = () => {
    if (isMargin) {
      const numAmount = parseInt(amount) || 0;
      if (numAmount > 0 && numAmount <= currentCash) {
        onConfirm(numAmount);
        // 重置输入
        setAmount('');
      } else {
        // 显示错误提示
        alert(i18n.t('marginDialog.invalidAmount', { max: currentCash.toLocaleString() }));
      }
    } else {
      onConfirm(percentage);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center bg-black/80 backdrop-blur-sm p-2 md:p-4 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="bg-slate-900 border-2 border-cyan-500 p-4 md:p-8 max-w-md w-full mx-2 md:mx-4 shadow-2xl my-4 md:my-auto relative">
        <h3 className="orbitron text-lg md:text-2xl font-black text-white mb-4 md:mb-6 uppercase tracking-wider">
          {isMargin ? i18n.t('marginDialog.addMargin') : i18n.t('marginDialog.cutLoss')}
        </h3>

        {isMargin ? (
          <>
            <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
              <div>
                <label className="block text-slate-400 text-xs md:text-sm orbitron uppercase tracking-wider mb-2">
                  {i18n.t('marginDialog.amount')}
                </label>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-500 text-sm md:text-base">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={i18n.t('marginDialog.enterAmount')}
                    className="flex-1 bg-slate-800 border border-slate-700 text-white px-3 md:px-4 py-2 md:py-3 text-sm md:text-base orbitron font-bold focus:outline-none focus:border-cyan-500"
                    min="1"
                    max={currentCash}
                  />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {i18n.t('marginDialog.availableCash')}: ${currentCash.toLocaleString()}
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-xs orbitron uppercase tracking-wider mb-2">
                  {i18n.t('marginDialog.quickSelect')}
                </div>
                <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                  {quickAmounts.map((quick, idx) => (
                    <button
                      key={idx}
                      onClick={() => setAmount(quick.toString())}
                      className={`py-1.5 md:py-2 text-[10px] md:text-xs orbitron font-bold border transition-all ${
                        amount === quick.toString()
                          ? 'border-cyan-500 bg-cyan-500/20 text-cyan-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      ${quick >= 1000 ? `${(quick / 1000).toFixed(quick >= 10000 ? 0 : 1)}k` : quick}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 p-3 md:p-4 mb-4 md:mb-6 border border-slate-700">
              <div className="text-xs text-slate-400 orbitron uppercase mb-1">{i18n.t('marginDialog.effectPreview')}</div>
              <div className="text-sm md:text-base text-cyan-400 font-bold">
                {i18n.t('marginDialog.cashAfterMargin', { cash: ((currentCash - (parseInt(amount) || 0))).toLocaleString() })}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {i18n.t('marginDialog.marginEffect')}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 md:mb-6 space-y-3 md:space-y-4">
              <div>
                <label className="block text-slate-400 text-xs md:text-sm orbitron uppercase tracking-wider mb-2">
                  {i18n.t('marginDialog.cutRatio')}: {percentage}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={percentage}
                  onChange={(e) => setPercentage(parseInt(e.target.value))}
                  className="w-full h-2 md:h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              <div>
                <div className="text-slate-400 text-xs orbitron uppercase tracking-wider mb-2">
                  {i18n.t('marginDialog.quickSelect')}
                </div>
                <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                  {quickAmounts.map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setPercentage(pct)}
                      className={`py-1.5 md:py-2 text-[10px] md:text-xs orbitron font-bold border transition-all ${
                        percentage === pct
                          ? 'border-rose-500 bg-rose-500/20 text-rose-400'
                          : 'border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 p-3 md:p-4 mb-4 md:mb-6 border border-slate-700">
              <div className="text-xs text-slate-400 orbitron uppercase mb-1">{i18n.t('marginDialog.effectPreview')}</div>
              <div className="text-sm md:text-base text-rose-400 font-bold">
                {i18n.t('marginDialog.positionAfterCut', { position: 100 - percentage })}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {i18n.t('marginDialog.cutLossEffect')}
              </div>
            </div>
          </>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <button
            onClick={() => {
              soundManager.playClick();
              onCancel();
            }}
            className="flex-1 py-2.5 md:py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm md:text-base orbitron font-bold uppercase tracking-wider transition-all"
          >
            {i18n.t('common.cancel')}
          </button>
          <button
            onClick={() => {
              soundManager.playClick();
              handleConfirm();
            }}
            disabled={isMargin && (!amount || parseInt(amount) <= 0 || parseInt(amount) > currentCash)}
            className={`flex-1 py-2.5 md:py-3 text-sm md:text-base orbitron font-black uppercase tracking-wider transition-all ${
              isMargin && (!amount || parseInt(amount) <= 0 || parseInt(amount) > currentCash)
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed'
                : isMargin
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {i18n.t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarginDialog;

