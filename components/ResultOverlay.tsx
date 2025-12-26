
import React from 'react';
import { PlayerState, Scenario } from '../types';
import { getReviveCost } from '../constants';
import { getDiamondCalculationDetails } from '../gameLogic';
import { i18n } from '../utils/i18n';
import { getScenarioTranslation } from '../utils/scenarioTranslations';

interface Props {
  player: PlayerState;
  scenario: Scenario;
  timeDiamonds: number;
  currentCash: number; // 起始本金
  targetCash: number;
  finalBalance: number;
  levelResult: {
    diamonds: number;
    nextTarget: number;
    growthRate: string;
    profit: number;
  } | null; // 关卡结算结果（仅成功时）
  penaltyInfo: {
    cashPenalty: number;
    diamondPenalty: number;
    remainingCash: number;
    message: string;
  } | null; // 损失惩罚信息（仅失败时）
  onExtract: () => void; // 安全撤离，转化钻石
  onRevive: () => void; // 复活
  onContinue: () => void; // 继续游戏（返回地图）
  onRestart: () => void; // 重新开始本关
  onBack: () => void; // 返回
  onOpenDiamondShop?: () => void; // 打开钻石商店
}

const ResultOverlay: React.FC<Props> = ({ 
  player, 
  scenario, 
  timeDiamonds,
  currentCash,
  targetCash,
  finalBalance,
  levelResult,
  penaltyInfo,
  onExtract, 
  onRevive, 
  onContinue,
  onRestart,
  onBack,
  onOpenDiamondShop
}) => {
  const isDead = player.isDead;
  const isSurvivor = player.isExited && !player.isDead;
  const finalPnl = isDead ? -100 : (player.exitPnl || player.currentPnl);
  
  // 判断结果状态
  const isLiquidated = finalBalance <= 0;
  const isFailed = !isLiquidated && finalBalance < targetCash;
  const isSuccess = !isLiquidated && finalBalance >= targetCash;
  
  // 使用新的钻石计算系统
  const diamondsEarned = levelResult ? levelResult.diamonds : 0;
  const excessProfit = levelResult ? levelResult.profit : 0;
  const nextLevelTarget = levelResult ? levelResult.nextTarget : 0;
  const growthRate = levelResult ? levelResult.growthRate : '0%';
  
  // 获取钻石计算详情（用于显示阶梯计算）
  const diamondDetails = isSuccess && excessProfit > 0 ? getDiamondCalculationDetails(excessProfit) : [];
  
  // 计算更新后的钻石总数（用于显示，考虑惩罚）
  const updatedTimeDiamonds = isSuccess 
    ? timeDiamonds + diamondsEarned 
    : (penaltyInfo ? Math.max(0, timeDiamonds - penaltyInfo.diamondPenalty) : timeDiamonds);
  
  // 计算更新后的现金（考虑惩罚）
  const updatedCash = isSuccess 
    ? finalBalance 
    : (penaltyInfo ? penaltyInfo.remainingCash : finalBalance);
  
  // 复活成本（动态计算）
  const baseReviveCost = isLiquidated ? 100 : 50;
  const dynamicCost = isLiquidated 
    ? Math.min(400, Math.floor(currentCash / 1000)) // 每$1000本金增加1💎，最高400
    : Math.min(150, Math.floor((targetCash - finalBalance) / 5000)); // 每$5000差额增加1💎，最高150
  const reviveCost = baseReviveCost + dynamicCost;
  const canRevive = updatedTimeDiamonds >= reviveCost && (isLiquidated || isFailed);

  return (
    <div className="z-40 inset-0 fixed flex items-start md:items-center justify-center bg-slate-950/90 backdrop-blur-xl animate-in zoom-in duration-300 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Back Button - Sticky for better visibility */}
      <button
        onClick={onBack}
        className="sticky top-2 md:top-6 left-2 md:left-6 px-3 py-1.5 md:px-6 md:py-3 border-2 border-cyan-500/50 bg-slate-900/95 backdrop-blur-md text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 hover:text-white transition-all orbitron text-xs md:text-sm font-black uppercase tracking-widest z-50 shadow-[0_0_20px_rgba(6,182,212,0.3)] mb-2 md:mb-4"
      >
        {i18n.t('common.back')}
      </button>
      
      <div className="max-w-2xl w-full p-4 md:p-12 border border-slate-800 bg-slate-900 shadow-2xl relative my-4 md:my-12 mx-2 md:mx-4">
        
        {/* Decorative Background Icon */}
        <div className="absolute top-4 right-4 text-8xl opacity-10 pointer-events-none select-none">
          {isSurvivor ? '🏆' : isDead ? '💀' : '💰'}
        </div>

        <h2 className={`orbitron text-3xl md:text-5xl font-black mb-2 tracking-tighter ${
          isSuccess ? 'text-emerald-500' : isLiquidated ? 'text-rose-500' : 'text-amber-500'
        }`}>
          {isLiquidated ? i18n.t('result.liquidated') : isFailed ? i18n.t('result.failed') : i18n.t('result.success')}
        </h2>
        <p className="text-slate-500 orbitron text-xs mb-6 md:mb-8 uppercase tracking-widest">{i18n.t('result.sessionTerminal')}</p>

        <div className="space-y-4 md:space-y-6">
          {/* 账户余额显示 */}
          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">{i18n.t('result.startingCapital')}</span>
            <span className="text-xl font-bold text-slate-300 orbitron">
              ${currentCash.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">{i18n.t('result.targetAmount')}</span>
            <span className="text-xl font-bold text-cyan-400 orbitron">
              ${targetCash.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">{i18n.t('result.finalBalance')}</span>
            <span className={`text-3xl font-bold orbitron ${
              isSuccess ? 'text-emerald-400' : isLiquidated ? 'text-rose-400' : 'text-amber-400'
            }`}>
              ${finalBalance.toLocaleString()}
            </span>
          </div>

          {/* 收益率显示 */}
          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">{i18n.t('result.finalYield')}</span>
            <span className={`text-2xl font-bold orbitron ${finalPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {finalPnl >= 0 ? '+' : ''}{finalPnl.toFixed(2)}%
            </span>
          </div>

          {/* 钻石转化 - 使用新的阶梯计算系统 */}
          {isSuccess && (
            <div className={`p-4 md:p-6 rounded border-2 ${
              diamondsEarned > 0 
                ? 'bg-gradient-to-r from-cyan-900/30 to-cyan-800/30 border-cyan-500/50' 
                : 'bg-slate-900/50 border-slate-700'
            }`}>
              <div className="flex justify-between items-center mb-3 md:mb-4">
                <span className={`uppercase text-xs tracking-widest orbitron ${
                  diamondsEarned > 0 ? 'text-cyan-400' : 'text-slate-500'
                }`}>
                  {i18n.t('result.excessProfit')}
                </span>
                <span className="text-2xl md:text-3xl">💎</span>
              </div>
              {diamondsEarned > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  <div className="flex flex-col md:flex-row md:items-baseline md:space-x-4 space-y-2 md:space-y-0">
                    <div className="text-4xl md:text-5xl font-black text-cyan-400 orbitron">+{diamondsEarned}</div>
                    <div className="text-slate-400 text-xs md:text-sm">
                      <div>{i18n.t('result.excessProfitAmount')}: ${excessProfit.toLocaleString()}</div>
                      <div className="text-xs mt-1 opacity-75">{i18n.t('result.tieredCalculation')}</div>
                    </div>
                  </div>
                  {diamondDetails.length > 0 && (
                    <div className="mt-3 md:mt-4 pt-3 md:pt-4 border-t border-slate-700">
                      <div className="text-xs text-slate-500 uppercase tracking-widest orbitron mb-2">{i18n.t('result.exchangeRateDetails')}</div>
                      <div className="space-y-1.5 md:space-y-2">
                        {diamondDetails.map((detail, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <span className="text-slate-400">
                              {detail.profitRange}: ${detail.profitInTier.toLocaleString()} ÷ {detail.rate} = 
                            </span>
                            <span className="text-cyan-400 font-bold">{detail.diamonds} 💎</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400 text-xs md:text-sm">
                  <div>{i18n.t('result.insufficientForDiamonds', { amount: excessProfit.toLocaleString() })}</div>
                  <div className="text-xs mt-1 opacity-75">{i18n.t('result.needAtLeast')}</div>
                </div>
              )}
            </div>
          )}

          {/* 下一关目标预览 */}
          {isSuccess && nextLevelTarget > 0 && (
            <div className="bg-gradient-to-r from-amber-900/20 to-amber-800/20 p-4 md:p-6 rounded border-2 border-amber-500/30">
              <div className="flex items-start space-x-2 md:space-x-3">
                <div className="text-xl md:text-2xl flex-shrink-0">👹</div>
                <div className="flex-1 min-w-0">
                  <div className="text-amber-400 font-bold mb-2 orbitron uppercase tracking-widest text-xs md:text-sm">
                    {parseFloat(growthRate) > 20 ? i18n.t('result.bossGreed') : i18n.t('result.nextLevelGoal')}
                  </div>
                  <div className="text-slate-300 text-xs md:text-sm mb-2">
                    {parseFloat(growthRate) > 20 
                      ? i18n.t('result.bossGreedMessage', { growthRate })
                      : i18n.t('result.bossNormalMessage', { nextTarget: nextLevelTarget.toLocaleString(), growthRate })
                    }
                  </div>
                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-amber-500/20">
                    <span className="text-slate-400 text-xs">下一关起始本金</span>
                    <span className="text-base md:text-lg font-bold text-emerald-400 orbitron">
                      ${finalBalance.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-slate-400 text-xs">下一关目标金额</span>
                    <span className="text-base md:text-lg font-bold text-amber-400 orbitron">
                      ${nextLevelTarget.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLiquidated && penaltyInfo && (
            <div className="bg-gradient-to-r from-rose-900/30 to-rose-800/30 p-4 md:p-6 rounded border-2 border-rose-500/50">
              <div className="text-rose-400 uppercase text-xs tracking-widest orbitron mb-2">{i18n.t('result.liquidationZero')}</div>
              <div className="text-slate-300 text-sm mb-3">
                {penaltyInfo.message}
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">{i18n.t('result.startingCapitalLoss')}:</span>
                  <span className="text-rose-400 font-bold">-${penaltyInfo.cashPenalty.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{i18n.t('result.diamondPenalty')}:</span>
                  <span className="text-rose-400 font-bold">-{penaltyInfo.diamondPenalty} 💎</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-rose-500/20">
                  <span className="text-slate-300">{i18n.t('result.remainingCash')}:</span>
                  <span className="text-white font-bold">${penaltyInfo.remainingCash.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {isFailed && penaltyInfo && (
            <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/30 p-4 md:p-6 rounded border-2 border-amber-500/50">
              <div className="text-amber-400 uppercase text-xs tracking-widest orbitron mb-2">{i18n.t('result.failed')}</div>
              <div className="text-slate-300 text-sm mb-3">
                {penaltyInfo.message}
              </div>
              <div className="space-y-2 text-xs mb-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">{i18n.t('result.targetShortage')}:</span>
                  <span className="text-amber-400">${(targetCash - finalBalance).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">{i18n.t('result.cashPenalty')}:</span>
                  <span className="text-rose-400 font-bold">-${penaltyInfo.cashPenalty.toLocaleString()}</span>
                </div>
                {penaltyInfo.diamondPenalty > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">{i18n.t('result.diamondPenalty')}:</span>
                    <span className="text-rose-400 font-bold">-{penaltyInfo.diamondPenalty} 💎</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-amber-500/20">
                  <span className="text-slate-300">{i18n.t('result.cashAfterPenalty')}:</span>
                  <span className="text-white font-bold">${penaltyInfo.remainingCash.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-slate-400 text-xs mt-2">
                {i18n.t('result.canBribeHR')}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">{i18n.t('result.highWatermark')}</span>
            <span className="text-xl text-amber-500 orbitron">
              +{player.highPnl.toFixed(2)}%
            </span>
          </div>

          <div className="flex justify-between items-center py-4 border-b border-slate-800">
            <span className="text-slate-400 uppercase text-xs tracking-widest">{i18n.t('result.currentDiamonds')}</span>
            <div className="flex items-center space-x-2">
              <span className="text-xl text-cyan-400 orbitron">
                {updatedTimeDiamonds} 💎
              </span>
              {isSuccess && diamondsEarned > 0 && (
                <span className="text-sm text-emerald-400 orbitron">
                  (+{diamondsEarned})
                </span>
              )}
              {penaltyInfo && penaltyInfo.diamondPenalty > 0 && (
                <span className="text-sm text-rose-400 orbitron">
                  (-{penaltyInfo.diamondPenalty})
                </span>
              )}
            </div>
          </div>
          
          {/* 显示下一关起始现金（考虑惩罚后） */}
          {!isSuccess && penaltyInfo && (
            <div className="flex justify-between items-center py-4 border-b border-slate-800">
              <span className="text-slate-400 uppercase text-xs tracking-widest">{i18n.t('result.nextLevelStartingCapital')}</span>
              <span className={`text-xl font-bold orbitron ${
                penaltyInfo.remainingCash > 0 ? 'text-amber-400' : 'text-rose-400'
              }`}>
                ${penaltyInfo.remainingCash.toLocaleString()}
              </span>
            </div>
          )}

          <div className="bg-slate-950 p-6 rounded border border-slate-800">
            <h4 className="text-slate-300 text-xs font-bold mb-4 uppercase orbitron">{i18n.t('result.historicalVerdict')}</h4>
            <p className="text-sm text-slate-400 leading-relaxed italic">
              {isSuccess
                ? i18n.t('result.historicalVerdictSuccess', {
                    scenario: getScenarioTranslation(scenario.id, i18n.getLanguage()).name,
                    leverage: player.leverage,
                    diamondText: diamondsEarned > 0 ? i18n.t('result.diamondEarnedText', { diamonds: diamondsEarned }) + ' ' : '',
                    finalBalance: finalBalance.toLocaleString(),
                    nextTarget: nextLevelTarget.toLocaleString(),
                    growthRate: growthRate
                  })
                : isLiquidated
                ? i18n.t('result.historicalVerdictLiquidated', { leverage: player.leverage })
                : i18n.t('result.historicalVerdictFailed', {
                    scenario: getScenarioTranslation(scenario.id, i18n.getLanguage()).name,
                    finalBalance: finalBalance.toLocaleString(),
                    shortage: (targetCash - finalBalance).toLocaleString()
                  })
              }
            </p>
          </div>
        </div>

        {/* 操作按钮 - 固定在底部，始终可见 */}
        <div className="sticky bottom-0 mt-6 md:mt-12 pt-4 md:pt-6 pb-2 md:pb-4 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 space-y-2 md:space-y-4 -mx-4 md:-mx-12 px-4 md:px-12 z-50 relative">
          <div className="text-xs text-slate-500 text-center mb-2 orbitron uppercase tracking-widest">{i18n.t('result.nextStep')}</div>
          {isLiquidated ? (
            <>
              {/* 爆仓时的选项 */}
              {canRevive ? (
                <button 
                  onClick={onRevive}
                  className="w-full py-3 md:py-4 bg-amber-600 hover:bg-amber-500 text-white orbitron font-black text-sm md:text-base tracking-widest transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)]"
                >
                  {i18n.t('result.applyEmergencyFunds', { cost: reviveCost })}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="w-full py-3 md:py-4 bg-slate-800 text-slate-600 text-center orbitron font-black text-sm md:text-base tracking-widest">
                    {i18n.t('result.insufficientDiamondsForRevive', { cost: reviveCost, current: updatedTimeDiamonds })}
                  </div>
                  {onOpenDiamondShop && (
                    <button
                      onClick={() => {
                        onOpenDiamondShop();
                      }}
                      className="w-full py-3 md:py-4 bg-cyan-600 hover:bg-cyan-500 text-white orbitron font-black text-sm md:text-base tracking-widest transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                    >
                      💎 {i18n.t('result.buyDiamonds')}
                    </button>
                  )}
                </div>
              )}
              <button 
                onClick={onContinue}
                className="w-full py-3 md:py-4 bg-slate-700 hover:bg-slate-600 text-white orbitron font-bold text-sm md:text-base tracking-widest transition-all"
              >
                {i18n.t('result.returnToMap')}
              </button>
            </>
          ) : isFailed ? (
            <>
              {/* 业绩不达标时的选项 */}
              {canRevive ? (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Bribe HR button clicked', { onRevive, canRevive, reviveCost, type: typeof onRevive });
                    if (onRevive && typeof onRevive === 'function') {
                      console.log('Calling onRevive...');
                      try {
                        onRevive();
                        console.log('onRevive called successfully');
                      } catch (error) {
                        console.error('Error calling onRevive:', error);
                      }
                    } else {
                      console.error('onRevive is not a function:', onRevive);
                    }
                  }}
                  onTouchStart={(e) => {
                    e.stopPropagation();
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Bribe HR button touched', { onRevive, canRevive, reviveCost });
                    if (onRevive && typeof onRevive === 'function') {
                      onRevive();
                    }
                  }}
                  className="w-full py-3 md:py-4 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white orbitron font-black text-sm md:text-base tracking-widest transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] active:scale-95 cursor-pointer z-50 relative"
                  style={{ touchAction: 'manipulation' }}
                >
                  {i18n.t('result.bribeHR', { cost: reviveCost })}
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="w-full py-3 md:py-4 bg-slate-800 text-slate-600 text-center orbitron font-black text-sm md:text-base tracking-widest">
                    {i18n.t('result.insufficientDiamondsForBribe', { cost: reviveCost, current: updatedTimeDiamonds })}
                  </div>
                  {onOpenDiamondShop && (
                    <button
                      onClick={() => {
                        onOpenDiamondShop();
                      }}
                      className="w-full py-3 md:py-4 bg-cyan-600 hover:bg-cyan-500 text-white orbitron font-black text-sm md:text-base tracking-widest transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                    >
                      💎 {i18n.t('result.buyDiamonds')}
                    </button>
                  )}
                </div>
              )}
              <button 
                onClick={onContinue}
                className="w-full py-3 md:py-4 bg-slate-700 hover:bg-slate-600 text-white orbitron font-bold text-sm md:text-base tracking-widest transition-all"
              >
                {i18n.t('result.returnToMap')}
              </button>
            </>
          ) : (
            <>
              {/* 成功时的选项 */}
              <button 
                onClick={onExtract}
                className="w-full py-3 md:py-4 bg-cyan-600 hover:bg-cyan-500 text-white orbitron font-black text-base md:text-lg tracking-widest transition-all shadow-[0_0_30px_rgba(6,182,212,0.3)]"
              >
                {diamondsEarned > 0 ? i18n.t('result.settleEarnings', { diamonds: diamondsEarned }) : i18n.t('result.settleEarningsNoDiamonds')}
              </button>
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                <button 
                  onClick={onContinue}
                  className="py-3 md:py-4 bg-slate-700 hover:bg-slate-600 text-white orbitron font-bold text-sm md:text-base tracking-widest transition-all"
                >
                  {i18n.t('result.returnToMap')}
                </button>
                <button 
                  onClick={onRestart}
                  className="py-3 md:py-4 bg-slate-700 hover:bg-slate-600 text-white orbitron font-bold text-sm md:text-base tracking-widest transition-all"
                >
                  {i18n.t('result.retryLevel')}
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
