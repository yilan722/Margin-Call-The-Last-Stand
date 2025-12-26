import React from 'react';
import { Scenario } from '../types';
import { i18n } from '../utils/i18n';
import { getScenarioTranslation } from '../utils/scenarioTranslations';

interface Props {
  scenario: Scenario;
  currentCash: number;
  targetCash: number;
  timeDiamonds: number;
  onStart: () => void;
  onBack: () => void;
}

const LevelBriefing: React.FC<Props> = ({ scenario, currentCash, targetCash, timeDiamonds, onStart, onBack }) => {
  const requiredProfit = targetCash - currentCash;
  const requiredProfitPercent = ((targetCash / currentCash) - 1) * 100;
  const lang = i18n.getLanguage();
  const scenarioTrans = getScenarioTranslation(scenario.id, lang);

  return (
    <div className="z-30 w-full h-full bg-slate-950 overflow-y-auto relative overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Fixed Back Button */}
        <button
        onClick={onBack}
        className="sticky top-4 left-4 z-50 px-4 py-2 md:px-6 md:py-3 border border-slate-700 bg-slate-900/95 backdrop-blur-md text-slate-400 hover:bg-slate-800 hover:text-white transition-all orbitron text-xs md:text-sm uppercase tracking-widest shadow-lg"
      >
        {i18n.t('common.back')}
      </button>
      
      <div className="min-h-full flex items-center justify-center py-8 md:py-12 px-2 md:px-4">
        <div className="max-w-4xl w-full p-4 md:p-12 border-2 border-cyan-500 bg-slate-900 shadow-2xl relative my-auto">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
        
        {/* Header */}
        <div className="relative z-10 mb-6 md:mb-8">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h1 className="orbitron text-2xl md:text-5xl font-black text-cyan-400 tracking-tighter">{i18n.t('levelBriefing.title')}</h1>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex-1">
              <div className="text-xl md:text-3xl font-black text-white orbitron mb-2">{scenarioTrans.name}</div>
              <div className="text-slate-400 text-xs md:text-sm">{scenarioTrans.description}</div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl md:text-3xl">💎</span>
              <div>
                <div className="text-slate-500 text-xs orbitron uppercase tracking-widest">{i18n.t('levelBriefing.timeDiamonds')}</div>
                <div className="text-xl md:text-2xl font-bold text-cyan-400 orbitron">{timeDiamonds}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-6 md:mb-8">
          {/* Left: Financial Status */}
          <div className="space-y-4 md:space-y-6">
            <div className="bg-slate-950 border border-slate-800 p-4 md:p-6">
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest mb-3 md:mb-4">{i18n.t('levelBriefing.accountStatus')}</div>
              <div className="space-y-3 md:space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs md:text-sm">{i18n.t('levelBriefing.currentCash')}</span>
                  <span className="text-lg md:text-2xl font-black text-emerald-400 orbitron">
                    ${currentCash.toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-slate-800"></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs md:text-sm">{i18n.t('levelBriefing.target')}</span>
                  <span className="text-lg md:text-2xl font-black text-cyan-400 orbitron">
                    ${targetCash.toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-slate-800"></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-xs md:text-sm">{i18n.t('levelBriefing.requiredProfit')}</span>
                  <span className="text-base md:text-xl font-bold text-amber-400 orbitron">
                    +${requiredProfit.toLocaleString()} ({requiredProfitPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-950 border border-slate-800 p-4 md:p-6">
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest mb-3 md:mb-4">{i18n.t('levelBriefing.targetProgress')}</div>
              <div className="h-8 bg-slate-900 border border-slate-800 relative overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-600 to-cyan-500 transition-all duration-500 relative"
                  style={{ width: `${Math.min(100, (currentCash / targetCash) * 100)}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30"></div>
                </div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-black text-white orbitron">
                  {((currentCash / targetCash) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Right: Mission Info */}
          <div className="space-y-4 md:space-y-6">
            <div className="bg-slate-950 border border-slate-800 p-4 md:p-6">
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest mb-3 md:mb-4">{i18n.t('levelBriefing.historicalBackground')}</div>
              <div className="text-white text-base md:text-lg font-bold mb-2">{scenario.year} {i18n.t('levelBriefing.year')}</div>
              <div className="text-slate-400 text-xs md:text-sm leading-relaxed italic">
                {scenarioTrans.eventText || scenario.eventText}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 md:p-6">
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest mb-3 md:mb-4">{i18n.t('levelBriefing.levelInfo')}</div>
              <div className="space-y-2 md:space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs md:text-sm">{i18n.t('levelBriefing.difficulty')}</span>
                  <span className="text-amber-500 font-bold">{'★'.repeat(scenario.difficulty)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs md:text-sm">{i18n.t('levelBriefing.duration')}</span>
                  <span className="text-white font-bold">{scenario.duration || 60} {i18n.t('levelBriefing.seconds')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs md:text-sm">{i18n.t('levelBriefing.recommendedLeverage')}</span>
                  <span className="text-cyan-400 font-bold">
                    {scenario.difficulty <= 2 ? '1-10x' : scenario.difficulty <= 4 ? '5-25x' : '10-50x'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Box */}
        <div className="relative z-10 bg-amber-950/30 border-2 border-amber-500/50 p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex items-start space-x-3 md:space-x-4">
            <div className="text-2xl md:text-3xl flex-shrink-0">⚠️</div>
            <div className="flex-1 min-w-0">
              <div className="text-amber-400 font-bold mb-2 orbitron uppercase tracking-widest text-xs md:text-sm">{i18n.t('levelBriefing.warning')}</div>
              <div className="text-slate-300 text-xs md:text-sm leading-relaxed">
                {i18n.t('levelBriefing.warningText')}
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="relative z-10 flex justify-center pb-4 md:pb-0">
          <button
            onClick={onStart}
            className="w-full md:w-auto px-8 md:px-20 py-4 md:py-5 bg-cyan-600 text-white font-black text-base md:text-xl orbitron tracking-widest hover:bg-cyan-500 hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-[0_0_50px_rgba(6,182,212,0.5)]"
          >
            {i18n.t('levelBriefing.start')}
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};

export default LevelBriefing;

