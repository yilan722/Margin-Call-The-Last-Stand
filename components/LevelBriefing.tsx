import React from 'react';
import { Scenario } from '../types';

interface Props {
  scenario: Scenario;
  currentCash: number;
  targetCash: number;
  onStart: () => void;
  onBack: () => void;
}

const LevelBriefing: React.FC<Props> = ({ scenario, currentCash, targetCash, onStart, onBack }) => {
  const requiredProfit = targetCash - currentCash;
  const requiredProfitPercent = ((targetCash / currentCash) - 1) * 100;

  return (
    <div className="z-30 w-full h-full bg-slate-950 flex items-center justify-center">
      <div className="max-w-4xl w-full p-12 border-2 border-cyan-500 bg-slate-900 shadow-2xl relative">
        {/* Decorative Background */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 pointer-events-none"></div>
        
        {/* Header */}
        <div className="relative z-10 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="orbitron text-5xl font-black text-cyan-400 tracking-tighter">关卡简报</h1>
            <button
              onClick={onBack}
              className="px-6 py-3 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all orbitron text-sm uppercase tracking-widest"
            >
              返回
            </button>
          </div>
          <div className="text-3xl font-black text-white orbitron mb-2">{scenario.name}</div>
          <div className="text-slate-400 text-sm">{scenario.description}</div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 grid grid-cols-2 gap-8 mb-8">
          {/* Left: Financial Status */}
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 p-6">
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest mb-4">账户状态</div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">当前本金</span>
                  <span className="text-2xl font-black text-emerald-400 orbitron">
                    ${currentCash.toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-slate-800"></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">目标金额</span>
                  <span className="text-2xl font-black text-cyan-400 orbitron">
                    ${targetCash.toLocaleString()}
                  </span>
                </div>
                <div className="h-px bg-slate-800"></div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">需盈利</span>
                  <span className="text-xl font-bold text-amber-400 orbitron">
                    +${requiredProfit.toLocaleString()} ({requiredProfitPercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="bg-slate-950 border border-slate-800 p-6">
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest mb-4">目标进度</div>
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
          <div className="space-y-6">
            <div className="bg-slate-950 border border-slate-800 p-6">
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest mb-4">历史背景</div>
              <div className="text-white text-lg font-bold mb-2">{scenario.year}年</div>
              <div className="text-slate-400 text-sm leading-relaxed italic">
                {scenario.eventText}
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-6">
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest mb-4">关卡信息</div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">难度</span>
                  <span className="text-amber-500 font-bold">{'★'.repeat(scenario.difficulty)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">时长</span>
                  <span className="text-white font-bold">{scenario.duration || 60}秒</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">推荐杠杆</span>
                  <span className="text-cyan-400 font-bold">
                    {scenario.difficulty <= 2 ? '1-10x' : scenario.difficulty <= 4 ? '5-25x' : '10-50x'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warning Box */}
        <div className="relative z-10 bg-amber-950/30 border-2 border-amber-500/50 p-6 mb-8">
          <div className="flex items-start space-x-4">
            <div className="text-3xl">⚠️</div>
            <div>
              <div className="text-amber-400 font-bold mb-2 orbitron uppercase tracking-widest text-sm">警告</div>
              <div className="text-slate-300 text-sm leading-relaxed">
                如果关卡结束时账户余额未达到目标金额，你将面临业绩不达标的风险。爆仓归零将直接导致游戏结束。
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="relative z-10 flex justify-center">
          <button
            onClick={onStart}
            className="px-20 py-5 bg-cyan-600 text-white font-black text-xl orbitron tracking-widest hover:bg-cyan-500 hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-[0_0_50px_rgba(6,182,212,0.5)]"
          >
            开始交易
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelBriefing;

