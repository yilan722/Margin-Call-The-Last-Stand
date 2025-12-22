
import React from 'react';
import { PlayerState, Scenario } from '../types';
import { getReviveCost } from '../constants';

interface Props {
  player: PlayerState;
  scenario: Scenario;
  timeDiamonds: number;
  currentCash: number;
  targetCash: number;
  finalBalance: number;
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
  currentCash,
  targetCash,
  finalBalance,
  onExtract, 
  onRevive, 
  onContinue,
  onRestart,
  onBack
}) => {
  const isDead = player.isDead;
  const isSurvivor = player.isExited && !player.isDead;
  const finalPnl = isDead ? -100 : (player.exitPnl || player.currentPnl);
  
  // 判断结果状态
  const isLiquidated = finalBalance <= 0;
  const isFailed = !isLiquidated && finalBalance < targetCash;
  const isSuccess = !isLiquidated && finalBalance >= targetCash;
  
  // 计算超额收益和钻石奖励
  const excessProfit = isSuccess ? finalBalance - targetCash : 0;
  const diamondsEarned = Math.floor(excessProfit / 100); // 超额部分 / 100 = 钻石
  
  // 复活成本
  const reviveCost = isLiquidated ? 100 : (isFailed ? 50 : 0);
  const canRevive = timeDiamonds >= reviveCost && (isLiquidated || isFailed);

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
          isSuccess ? 'text-emerald-500' : isLiquidated ? 'text-rose-500' : 'text-amber-500'
        }`}>
          {isLiquidated ? 'LIQUIDATED' : isFailed ? '业绩不达标' : 'SUCCESS'}
        </h2>
        <p className="text-slate-500 orbitron text-xs mb-8 uppercase tracking-widest">Session Terminal</p>

        <div className="space-y-6">
          {/* 账户余额显示 */}
          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">起始本金</span>
            <span className="text-xl font-bold text-slate-300 orbitron">
              ${currentCash.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">目标金额</span>
            <span className="text-xl font-bold text-cyan-400 orbitron">
              ${targetCash.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">最终余额</span>
            <span className={`text-3xl font-bold orbitron ${
              isSuccess ? 'text-emerald-400' : isLiquidated ? 'text-rose-400' : 'text-amber-400'
            }`}>
              ${finalBalance.toLocaleString()}
            </span>
          </div>

          {/* 收益率显示 */}
          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">最终收益率 (Final Yield)</span>
            <span className={`text-2xl font-bold orbitron ${finalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {finalPnl >= 0 ? '+' : ''}{finalPnl.toFixed(2)}%
            </span>
          </div>

          {/* 钻石转化 */}
          {isSuccess && diamondsEarned > 0 && (
            <div className="bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 p-6 rounded border-2 border-cyan-500/50">
              <div className="flex justify-between items-center mb-4">
                <span className="text-cyan-400 uppercase text-xs tracking-widest orbitron">超额收益转化 (Excess Profit)</span>
                <span className="text-3xl">💎</span>
              </div>
              <div className="flex items-baseline space-x-4">
                <div className="text-5xl font-black text-cyan-400 orbitron">{diamondsEarned}</div>
                <div className="text-slate-400 text-sm">
                  <div>公式: (${finalBalance.toLocaleString()} - ${targetCash.toLocaleString()}) ÷ 100 = {diamondsEarned} 颗</div>
                  <div className="text-xs mt-1 opacity-75">（超额部分每$100 = 1颗钻石）</div>
                </div>
              </div>
            </div>
          )}

          {isLiquidated && (
            <div className="bg-gradient-to-r from-rose-900/30 to-rose-800/30 p-6 rounded border-2 border-rose-500/50">
              <div className="text-rose-400 uppercase text-xs tracking-widest orbitron mb-2">爆仓归零</div>
              <div className="text-slate-300 text-sm">
                你的账户已归零！游戏结束。可以使用紧急救助金恢复50%初始本金重新挑战。
              </div>
            </div>
          )}

          {isFailed && (
            <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/30 p-6 rounded border-2 border-amber-500/50">
              <div className="text-amber-400 uppercase text-xs tracking-widest orbitron mb-2">业绩不达标</div>
              <div className="text-slate-300 text-sm">
                你的账户余额未达到目标金额。差额: ${(targetCash - finalBalance).toLocaleString()}。
                可以使用钻石贿赂HR补齐差额。
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
              {isSuccess
                ? `恭喜。你在 ${scenario.name} 中达到了目标。${player.leverage}倍杠杆帮你完成了任务。${diamondsEarned > 0 ? `超额收益 ${diamondsEarned} 颗钻石已存入账户。` : ''}下一关，你的本金将是 $${finalBalance.toLocaleString()}。`
                : isLiquidated
                ? `游戏结束。你曾在这个位置拥有机会，但你没有及时止损。${player.leverage}倍杠杆不仅放大了收益，也加速了你通往虚无的速度。`
                : `你未能达到目标。在 ${scenario.name} 中，你的账户余额为 $${finalBalance.toLocaleString()}，距离目标还差 $${(targetCash - finalBalance).toLocaleString()}。`
              }
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-12 space-y-4">
          {isLiquidated ? (
            <>
              {/* 爆仓时的选项 */}
              {canRevive ? (
                <button 
                  onClick={onRevive}
                  className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white orbitron font-black tracking-widest transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                >
                  申请紧急救助金 (Emergency Fund) - 消耗 {reviveCost} 💎
                </button>
              ) : (
                <div className="w-full py-4 bg-slate-800 text-slate-600 text-center orbitron font-black tracking-widest">
                  钻石不足，无法申请救助（需要 {reviveCost} 💎）
                </div>
              )}
              <button 
                onClick={onContinue}
                className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white orbitron font-bold tracking-widest transition-all"
              >
                返回地图（放弃本关）
              </button>
            </>
          ) : isFailed ? (
            <>
              {/* 业绩不达标时的选项 */}
              {canRevive ? (
                <button 
                  onClick={onRevive}
                  className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white orbitron font-black tracking-widest transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                >
                  贿赂HR (Bribe HR) - 消耗 {reviveCost} 💎 补齐差额
                </button>
              ) : (
                <div className="w-full py-4 bg-slate-800 text-slate-600 text-center orbitron font-black tracking-widest">
                  钻石不足，无法贿赂（需要 {reviveCost} 💎）
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
              {/* 成功时的选项 */}
              <button 
                onClick={onExtract}
                className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white orbitron font-black tracking-widest transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]"
              >
                {diamondsEarned > 0 ? `结算收益 - 获得 ${diamondsEarned} 💎` : '结算收益 - 进入下一关'}
              </button>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={onContinue}
                  className="py-4 bg-slate-700 hover:bg-slate-600 text-white orbitron font-bold tracking-widest transition-all"
                >
                  返回地图
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
