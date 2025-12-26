
import React, { useState, useEffect } from 'react';
import { Side, Scenario, TemporaryItemType } from '../types';
import { i18n } from '../utils/i18n';
import { getScenarioTranslation } from '../utils/scenarioTranslations';

interface Props {
  onStart: (side: Side, leverage: number, scenario: Scenario) => void;
  scenarios: Scenario[];
  leverageOptions: number[];
  onBack: () => void;
  initialScenario?: Scenario;
  temporaryItems?: { type: TemporaryItemType; count: number }[];
}

const BettingOverlay: React.FC<Props> = ({ onStart, scenarios, leverageOptions, onBack, initialScenario, temporaryItems = [] }) => {
  const [side, setSide] = useState<Side>(Side.LONG);
  const [leverage, setLeverage] = useState(5);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(
    initialScenario || scenarios[0]
  );
  
  // 检查是否有强力大力丸（允许100x杠杆）
  const hasHighLeveragePermit = temporaryItems && temporaryItems.length > 0 && temporaryItems.some(item => 
    item.type === TemporaryItemType.HIGH_LEVERAGE_PERMIT && item.count > 0
  );
  
  // 可用的杠杆选项（如果有强力大力丸，允许100x）
  const availableLeverageOptions = hasHighLeveragePermit 
    ? leverageOptions 
    : leverageOptions.filter(opt => opt < 100);
  
  // 调试：打印临时道具信息
  useEffect(() => {
    if (temporaryItems && temporaryItems.length > 0) {
      console.log('BettingOverlay - temporaryItems:', temporaryItems);
      console.log('BettingOverlay - hasHighLeveragePermit:', hasHighLeveragePermit);
      console.log('BettingOverlay - availableLeverageOptions:', availableLeverageOptions);
    }
  }, [temporaryItems, hasHighLeveragePermit, availableLeverageOptions]);

  // 当 initialScenario 变化时，更新选中的场景
  useEffect(() => {
    if (initialScenario) {
      setSelectedScenario(initialScenario);
    }
  }, [initialScenario]);

  return (
    <div className="z-30 w-full max-w-4xl p-8 bg-slate-900/90 border-t-4 border-cyan-500 shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom duration-500">
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all orbitron text-sm uppercase tracking-widest"
        >
          {i18n.t('common.back')}
        </button>
        <h2 className="orbitron text-3xl font-bold text-white">{i18n.t('betting.title')}</h2>
        <div className="w-24"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: Side & Leverage */}
        <div className="space-y-8">
          <div>
            <label className="block text-slate-400 text-sm mb-4 uppercase tracking-widest">{i18n.t('betting.selectDirection')}</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setSide(Side.LONG)}
                className={`py-4 font-bold border-2 transition-all ${side === Side.LONG ? 'bg-emerald-600 border-emerald-400 text-white' : 'border-slate-700 text-slate-500 hover:border-emerald-600'}`}
              >
                {i18n.t('betting.long')}
              </button>
              <button 
                onClick={() => setSide(Side.SHORT)}
                className={`py-4 font-bold border-2 transition-all ${side === Side.SHORT ? 'bg-rose-600 border-rose-400 text-white' : 'border-slate-700 text-slate-500 hover:border-rose-600'}`}
              >
                {i18n.t('betting.short')}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-4 uppercase tracking-widest">{i18n.t('betting.leverage')}</label>
            {hasHighLeveragePermit && (
              <div className="mb-3 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded text-xs text-yellow-400">
                {i18n.t('betting.highLeverageUnlocked')}
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              {availableLeverageOptions.map(opt => (
                <button 
                  key={opt}
                  onClick={() => setLeverage(opt)}
                  className={`py-2 text-sm font-bold border transition-all ${
                    leverage === opt 
                      ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-900' 
                      : 'border-slate-700 text-slate-500 hover:border-cyan-500'
                  } ${opt === 100 && hasHighLeveragePermit ? 'ring-2 ring-yellow-500' : ''}`}
                >
                  {opt}X
                  {opt === 100 && hasHighLeveragePermit && ' 💊'}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              {leverage === 1 && i18n.t('betting.leverageDescriptions.one')}
              {leverage > 1 && leverage < 50 && i18n.t('betting.leverageDescriptions.low')}
              {leverage >= 50 && leverage < 100 && i18n.t('betting.leverageDescriptions.high')}
              {leverage === 100 && i18n.t('betting.leverageDescriptions.extreme')}
            </p>
          </div>
        </div>

        {/* Right Column: Scenario */}
        <div className="space-y-8">
          <div>
            <label className="block text-slate-400 text-sm mb-4 uppercase tracking-widest">{i18n.t('betting.historyScenario')}</label>
            <div className="space-y-3 h-64 overflow-y-auto pr-2 custom-scrollbar">
              {scenarios.map(sc => (
                <div 
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-4 border-2 cursor-pointer transition-all ${selectedScenario.id === sc.id ? 'bg-slate-800 border-cyan-500' : 'border-slate-800 hover:border-slate-600'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white">{getScenarioTranslation(sc.id, i18n.getLanguage()).name}</span>
                    <span className="text-amber-500">{'★'.repeat(sc.difficulty)}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{getScenarioTranslation(sc.id, i18n.getLanguage()).description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex justify-center">
        <button 
          onClick={() => onStart(side, leverage, selectedScenario)}
          className="px-20 py-5 bg-cyan-600 text-white font-black text-xl orbitron tracking-widest hover:bg-cyan-500 hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          {i18n.t('betting.confirmInvestment')}
        </button>
      </div>
    </div>
  );
};

export default BettingOverlay;
