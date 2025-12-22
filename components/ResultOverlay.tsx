
import React from 'react';
import { PlayerState, Scenario } from '../types';
import { getReviveCost } from '../constants';

interface Props {
  player: PlayerState;
  scenario: Scenario;
  timeDiamonds: number;
  onExtract: () => void; // 安全撤离，转化钻石
  onRevive: () => void; // 复活
  onContinue: () => void; // 继续游戏（返回地图）
  onRestart: () => void; // 重新开始本关
  onBack: () => void; // 返回
}

const ResultOverlay: React.FC<Props> = ({ 
  player, 
  scenario, 
  timeDiamonds,
  onExtract, 
  onRevive, 
  onContinue,
  onRestart,
  onBack
}) => {
  const isDead = player.isDead;
  const isSurvivor = player.isExited && !player.isDead;
  const finalPnl = isDead ? -100 : (player.exitPnl || player.currentPnl);
  
  // 计算钻石转化：100%收益率 = 1颗钻石
  const diamondsEarned = Math.max(0, Math.floor(finalPnl));
  const reviveCost = getReviveCost(scenario.level);
  const canRevive = timeDiamonds >= reviveCost;

  return (
    <div className="z-40 inset-0 absolute flex items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in zoom-in duration-300">
      {/* Back Button - Outside container for better visibility */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 px-6 py-3 border-2 border-cyan-500/50 bg-slate-900/95 backdrop-blur-md text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-white transition-all orbitron text-sm font-black uppercase tracking-widest z-50 shadow-[0_0_20px_rgba(6,182,212,0.3)]"
      >
        返回
      </button>
      
      <div className="max-w-2xl w-full p-12 border border-slate-800 bg-slate-900 shadow-2xl relative overflow-visible">
        
        {/* Decorative Background Icon */}
        <div className="absolute top-4 right-4 text-8xl opacity-10 pointer-events-none select-none">
          {isSurvivor ? '🏆' : isDead ? '💀' : '💰'}
        </div>

        <h2 className={`orbitron text-5xl font-black mb-2 tracking-tighter ${
          isSurvivor ? 'text-emerald-500' : isDead ? 'text-rose-500' : 'text-cyan-500'
        }`}>
          {isDead ? 'LIQUIDATED' : isSurvivor ? 'SAFE EXTRACTION' : 'LEVEL COMPLETE'}
        </h2>
        <p className="text-slate-500 orbitron text-xs mb-8 uppercase tracking-widest">Session Terminal</p>

        <div className="space-y-6">
          {/* 收益率显示 */}
          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">最终收益率 (Final Yield)</span>
            <span className={`text-3xl font-bold orbitron ${finalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {finalPnl >= 0 ? '+' : ''}{finalPnl.toFixed(2)}%
            </span>
          </div>

          {/* 钻石转化 */}
          {!isDead && (
            <div className="bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 p-6 rounded border-2 border-cyan-500/50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-cyan-400 uppercase text-xs tracking-widest orbitron">钻石转化 (Diamond Extraction)</span>
                <span className="text-3xl">💎</span>
              </div>
              <div className="flex items-baseline space-x-4">
                <div className="text-5xl font-black text-cyan-400 orbitron">{diamondsEarned}</div>
                <div className="text-slate-400 text-sm">
                  <div>公式: {finalPnl.toFixed(2)}% ÷ 100% = {diamondsEarned} 颗</div>
                  <div className="text-xs mt-1 opacity-75">（100%收益率 = 1颗钻石）</div>
                </div>
              </div>
            </div>
          )}

          {isDead && (
            <div className="bg-gradient-to-r from-rose-900/30 to-rose-800/30 p-6 rounded border-2 border-rose-500/50">
              <div className="text-rose-400 uppercase text-xs tracking-widest orbitron mb-2">死亡惩罚</div>
              <div className="text-slate-300 text-sm">
                爆仓！本次收益归零，无法获得钻石。
              </div>
            </div>
          )}

          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">峰值幻想 (High Watermark)</span>
            <span className="text-xl text-amber-500 orbitron">
              +{player.highPnl.toFixed(2)}%
            </span>
          </div>

          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">当前钻石 (Time Diamonds)</span>
            <span className="text-xl text-cyan-400 orbitron">
              {timeDiamonds} 💎
            </span>
          </div>

          <div className="bg-slate-950 p-6 rounded border border-slate-800">
            <h4 className="text-slate-300 text-xs font-bold mb-4 uppercase orbitron">历史教训 (Historical Verdict)</h4>
            <p className="text-sm text-slate-400 leading-relaxed italic">
              {isSurvivor 
                ? `恭喜。你在 ${scenario.name} 的惊涛骇浪中活了下来。${player.leverage}倍杠杆没能吞噬你，说明你懂得人性贪婪的终点在哪里。`
                : isDead
                ? `游戏结束。你曾在这个位置拥有法拉利，但你没有跳车。${player.leverage}倍杠杆不仅放大了收益，也加速了你通往虚无的速度。`
                : `你成功完成了 ${scenario.name}。${diamondsEarned > 0 ? `获得了 ${diamondsEarned} 颗钻石。` : '但收益不足以转化为钻石。'}`
              }
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-12 space-y-4">
          {isDead ? (
            <>
              {/* 死亡时的选项 */}
              {canRevive ? (
                <button 
                  onClick={onRevive}
                  className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white orbitron font-black tracking-widest transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                >
                  复活 (Revive) - 消耗 {reviveCost} 💎
                </button>
              ) : (
                <div className="w-full py-4 bg-slate-800 text-slate-600 text-center orbitron font-black tracking-widest">
                  钻石不足，无法复活（需要 {reviveCost} 💎）
                </div>
              )}
              <button 
                onClick={onContinue}
                className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white orbitron font-bold tracking-widest transition-all"
              >
                返回地图（放弃本关）
              </button>
            </>
          ) : (
            <>
              {/* 存活时的选项 */}
              {diamondsEarned > 0 ? (
                <button 
                  onClick={onExtract}
                  className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white orbitron font-black tracking-widest transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]"
                >
                  安全撤离 (Safe Extraction) - 获得 {diamondsEarned} 💎
                </button>
              ) : (
                <div className="w-full py-4 bg-slate-800 text-slate-600 text-center orbitron font-black tracking-widest">
                  收益不足，无法转化为钻石
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={onContinue}
                  className="py-4 bg-slate-700 hover:bg-slate-600 text-white orbitron font-bold tracking-widest transition-all"
                >
                  继续征程
                </button>
                <button 
                  onClick={onRestart}
                  className="py-4 bg-slate-700 hover:bg-slate-600 text-white orbitron font-bold tracking-widest transition-all"
                >
                  重试本关
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultOverlay;
