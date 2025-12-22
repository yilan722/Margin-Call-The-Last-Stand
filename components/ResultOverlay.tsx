
import React from 'react';
import { PlayerState, Scenario } from '../types';

interface Props {
  player: PlayerState;
  scenario: Scenario;
  onRestart: () => void;
}

const ResultOverlay: React.FC<Props> = ({ player, scenario, onRestart }) => {
  const isSurvivor = player.isExited && !player.isDead;
  const finalPnl = player.isDead ? -100 : (player.exitPnl || player.currentPnl);

  return (
    <div className="z-40 inset-0 absolute flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in zoom-in duration-300">
      <div className="max-w-xl w-full p-12 border border-slate-800 bg-slate-900 shadow-2xl relative overflow-hidden">
        
        {/* Decorative Background Icon */}
        <div className="absolute top-4 right-4 text-8xl opacity-10 pointer-events-none select-none">
          {isSurvivor ? '🏆' : '💀'}
        </div>

        <h2 className={`orbitron text-5xl font-black mb-2 tracking-tighter ${isSurvivor ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isSurvivor ? 'SURVIVOR' : 'LIQUIDATED'}
        </h2>
        <p className="text-slate-500 orbitron text-xs mb-8 uppercase tracking-widest">Session Terminal Closed</p>

        <div className="space-y-6">
          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">最终资产 (Final Result)</span>
            <span className={`text-3xl font-bold orbitron ${finalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {finalPnl >= 0 ? '+' : ''}{finalPnl.toFixed(2)}%
            </span>
          </div>

          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">峰值幻想 (High Watermark)</span>
            <span className="text-xl text-amber-500 orbitron">
              +{player.highPnl.toFixed(2)}%
            </span>
          </div>

          <div className="bg-slate-950 p-6 rounded border border-slate-800">
            <h4 className="text-slate-300 text-xs font-bold mb-4 uppercase orbitron">历史教训 (Historical Verdict)</h4>
            <p className="text-sm text-slate-400 leading-relaxed italic">
              {isSurvivor 
                ? `恭喜。你在 ${scenario.name} 的惊涛骇浪中活了下来。${player.leverage}倍杠杆没能吞噬你，说明你懂得人性贪婪的终点在哪里。`
                : `游戏结束。你曾在这个位置拥有法拉利，但你没有跳车。${player.leverage}倍杠杆不仅放大了收益，也加速了你通往虚无的速度。`
              }
            </p>
          </div>
        </div>

        <div className="mt-12 space-y-4">
          <button 
            onClick={onRestart}
            className="w-full py-4 bg-slate-100 text-slate-950 orbitron font-bold tracking-widest hover:bg-white transition-all"
          >
            再次挑战生命线
          </button>
          <div className="text-center">
            <a 
              href="https://ai.google.dev/gemini-api/docs/billing" 
              className="text-[10px] text-slate-600 underline uppercase tracking-tighter"
            >
              了解更多风险管理知识
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultOverlay;
