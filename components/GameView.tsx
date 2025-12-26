
import React, { useEffect, useState } from 'react';
import { Scenario, PlayerState, Side, Equipment, ConsumableType, EquipmentType, TemporaryItemType } from '../types';
import KLineChart from './KLineChart';
import { soundManager } from '../utils/soundManager';
import { i18n } from '../utils/i18n';
import { getScenarioTranslation } from '../utils/scenarioTranslations';

interface Props {
  scenario: Scenario;
  player: PlayerState;
  currentIndex: number;
  commentary: string;
  onJumpOut: () => void;
  onSafeExtract: () => void; // 安全撤离
  onAddMargin: () => void;
  onUseHammer: () => void;
  onPhaseShift: () => void; // 反手
  onUseConsumable: (type: ConsumableType) => void; // 使用消耗品
  marginBuffer: number;
  equipment: Equipment[]; // 装备列表
  consumables: { type: ConsumableType; count: number }[]; // 可用消耗品
  currentCash: number; // 当前本金
  targetCash: number; // 目标金额
}

const GameView: React.FC<Props> = ({ 
  scenario, 
  player, 
  currentIndex, 
  commentary, 
  onJumpOut, 
  onSafeExtract,
  onAddMargin, 
  onUseHammer,
  onPhaseShift,
  onUseConsumable,
  marginBuffer,
  equipment,
  consumables,
  currentCash,
  targetCash
}) => {
  // 时间冻结液效果：如果超出原始数据长度，使用最后一个价格
  const actualIndex = Math.min(currentIndex, scenario.data.length - 1);
  const currentPrice = scenario.data[actualIndex].price;
  const pnl = player.currentPnl;
  
  // 计算当前余额
  const currentBalance = Math.max(0, Math.floor(currentCash * (1 + pnl / 100)));
  const progressPercent = Math.min(100, Math.max(0, (currentBalance / targetCash) * 100));
  const canEarlyExit = currentBalance >= targetCash && !player.isDead;
  
  // 幸运草效果：显示前10秒的走势预览（前10秒内显示，约33个数据点，每个300ms）
  const hasLuckyNews = player.temporaryItems?.includes(TemporaryItemType.LUCKY_NEWS) || false;
  const [showLuckyPreview, setShowLuckyPreview] = useState(hasLuckyNews && currentIndex < 33);
  const previewData = scenario.data.slice(0, Math.min(33, scenario.data.length)); // 前10秒的数据
  const previewStartPrice = scenario.data[0]?.price || 0;
  const previewEndPrice = previewData[previewData.length - 1]?.price || previewStartPrice;
  const previewChange = previewEndPrice - previewStartPrice;
  const previewChangePercent = previewStartPrice > 0 ? ((previewChange / previewStartPrice) * 100).toFixed(2) : '0.00';
  
  // 危险警告：当 PnL 接近 -90% 时播放警告音效（在 GameView 中检测，避免重复）
  useEffect(() => {
    if (pnl <= -90 && pnl > -95) {
      const timer = setTimeout(() => soundManager.playDanger(), 100);
      return () => clearTimeout(timer);
    }
  }, [Math.floor(pnl / 5)]); // 每5%变化检测一次，避免频繁播放
  
  // 幸运草预览：在前10秒内显示，之后自动隐藏
  useEffect(() => {
    if (hasLuckyNews && currentIndex >= 33) {
      setShowLuckyPreview(false);
    }
  }, [currentIndex, hasLuckyNews]);
  
  // 装备效果计算
  const antiGravityLevel = equipment.find(e => e.type === EquipmentType.ANTI_GRAVITY_ENGINE)?.level || 0;
  const radarLevel = equipment.find(e => e.type === EquipmentType.HIGH_FREQ_RADAR)?.level || 0;
  const fallSpeedReduction = antiGravityLevel * 0.1; // 每级减少10%坠落速度
  const radarWarningTime = radarLevel * 0.5; // 每级增加0.5秒预警
  
  // Calculate visual position with equipment effects
  // 反重力引擎效果：减少下跌速度（视觉上表现为更高的位置）
  const equipmentBonus = pnl < 0 ? pnl * fallSpeedReduction : 0;
  // 限制上升不超过屏幕（最高90%，最低0%）
  const rawHeight = 50 + (pnl + marginBuffer + equipmentBonus) * 0.45;
  const visualHeight = Math.max(0, Math.min(90, rawHeight)); // 限制在0-90%之间 

  // Mecha Visual Styles
  const isGodOfGamblers = player.leverage >= 50;
  const isRanger = player.leverage >= 5 && player.leverage < 50;
  const isGuardian = player.leverage < 5;

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      
      {/* 幸运草：前10秒走势预览 */}
      {hasLuckyNews && showLuckyPreview && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-lg p-6 md:p-8 max-w-2xl w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <span className="text-3xl">🍀</span>
                <h3 className="orbitron text-2xl md:text-3xl font-black text-emerald-400">
                  {i18n.t('gameView.luckyCloverPreview')}
                </h3>
              </div>
              <button
                onClick={() => setShowLuckyPreview(false)}
                className="text-slate-400 hover:text-white transition-all text-xl"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <div className="h-48 bg-slate-950 border border-slate-700 rounded p-2">
                <KLineChart data={previewData} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                <div className="text-slate-400 text-xs orbitron uppercase mb-1">{i18n.t('gameView.previewStartPrice')}</div>
                <div className="text-white font-bold text-lg">${previewStartPrice.toLocaleString()}</div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                <div className="text-slate-400 text-xs orbitron uppercase mb-1">{i18n.t('gameView.previewEndPrice')}</div>
                <div className={`font-bold text-lg ${previewChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${previewEndPrice.toLocaleString()}
                </div>
              </div>
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700 col-span-2">
                <div className="text-slate-400 text-xs orbitron uppercase mb-1">{i18n.t('gameView.previewChange')}</div>
                <div className={`font-bold text-xl ${previewChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {previewChange >= 0 ? '+' : ''}{previewChangePercent}% ({previewChange >= 0 ? '+' : ''}${Math.abs(previewChange).toLocaleString()})
                </div>
              </div>
            </div>
            
            <div className="mt-4 text-xs text-slate-400 text-center">
              {i18n.t('gameView.luckyCloverPreviewHint')}
            </div>
          </div>
        </div>
      )}
      
      {/* Background Data Stream Wall */}
      <div className="absolute inset-0 z-0 opacity-10 flex justify-between pointer-events-none">
        <div className="w-px h-full bg-slate-800 ml-[25%]"></div>
        <div className="w-px h-full bg-slate-800 mr-[25%]"></div>
      </div>

      {/* Left UI: Live K-Line */}
      <div className="absolute left-1 md:left-8 top-16 md:top-32 bottom-16 md:bottom-32 w-32 md:w-72 bg-slate-900/80 backdrop-blur-xl border border-slate-800 z-10 flex flex-col p-1.5 md:p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-2 md:mb-4">
            <div className="orbitron text-[8px] md:text-[10px] text-cyan-500 font-black tracking-widest uppercase">Live Pulse</div>
            <div className="flex space-x-1">
                <div className="w-1 h-3 bg-cyan-500 animate-[pulse_1s_infinite]"></div>
                <div className="w-1 h-3 bg-cyan-500 animate-[pulse_1.2s_infinite]"></div>
                <div className="w-1 h-3 bg-cyan-500 animate-[pulse_0.8s_infinite]"></div>
            </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <KLineChart data={scenario.data.slice(0, currentIndex + 1)} />
        </div>

        <div className="mt-3 md:mt-6 space-y-2 md:space-y-4 font-bold border-t border-slate-800 pt-3 md:pt-6">
          <div className="flex justify-between text-[8px] md:text-[10px] orbitron">
            <span className="text-slate-500">BASE PRICE</span>
            <span className="text-white text-[9px] md:text-[10px]">${player.entryPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[8px] md:text-[10px] orbitron">
            <span className="text-slate-500">MARK PRICE</span>
            <span className="text-cyan-400 text-[9px] md:text-[10px]">${currentPrice.toLocaleString()}</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${pnl >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, 50 + pnl))}%` }}
              ></div>
          </div>
        </div>
      </div>

      {/* Center View: The Quantum Tower */}
      <div className="flex-1 relative flex items-center justify-center">
        {/* Animated Background Numbers */}
        <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden pointer-events-none data-stream opacity-5">
           {Array.from({length: 100}).map((_, i) => (
               <div key={i} className="text-[10px] text-cyan-500 whitespace-nowrap orbitron">
                {Math.random().toString(36).substring(2, 15)} {Math.random().toString(36).substring(2, 15)} {Math.random().toString(36).substring(2, 15)}
               </div>
           ))}
        </div>

        {/* The Player Mecha */}
        <div 
          className="absolute z-20 transition-all duration-300 ease-linear flex flex-col items-center"
          style={{ bottom: `${visualHeight}%` }}
        >
          {/* PnL Floating Badge */}
          <div className={`px-4 py-2 border-2 orbitron text-xl font-black mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] ${pnl >= 0 ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20' : 'border-rose-500 text-rose-400 bg-rose-950/20 animate-pulse'}`}>
            {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
          </div>

          {/* Mecha Representation */}
          <div className="relative group">
            {/* Thrusters Visual */}
            {isGodOfGamblers && (
              <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex space-x-2">
                <div className="w-2 h-16 bg-gradient-to-t from-orange-600 via-yellow-400 to-transparent blur-[2px] animate-bounce"></div>
                <div className="w-2 h-20 bg-gradient-to-t from-rose-600 via-orange-400 to-transparent blur-[2px] animate-bounce delay-100"></div>
                <div className="w-2 h-16 bg-gradient-to-t from-orange-600 via-yellow-400 to-transparent blur-[2px] animate-bounce delay-75"></div>
              </div>
            )}
            
            {/* Mecha Frame */}
            <div className={`
              w-24 h-24 border-4 relative transition-all duration-300 flex items-center justify-center
              ${isGodOfGamblers ? 'border-rose-500 bg-rose-950/40 shadow-[0_0_30px_rgba(239,68,68,0.3)]' : 
                isRanger ? 'border-cyan-500 bg-cyan-950/40' : 
                'border-slate-500 bg-slate-900 shadow-none'}
            `}>
              {/* Internal HUD visual */}
              <div className="absolute inset-2 border border-white/10 opacity-50 flex items-center justify-center">
                 <span className="text-4xl">
                    {isGodOfGamblers ? '🔥' : isRanger ? '⚡' : '🛡️'}
                 </span>
              </div>
              
              {/* Corner Accents */}
              <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-inherit"></div>
              <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-inherit"></div>
              <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-inherit"></div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-inherit"></div>
              
              {/* Leverge Label */}
              <div className="absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 bg-inherit border-2 border-inherit px-2 py-0.5 orbitron text-[10px] font-black">
                {player.leverage}X
              </div>
            </div>

            {/* Side Label */}
            <div className={`absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 px-2 py-1 orbitron text-[10px] font-black uppercase text-white ${player.side === Side.LONG ? 'bg-emerald-600 shadow-[0_0_10px_#10b981]' : 'bg-rose-600 shadow-[0_0_10px_#f43f5e]'}`}>
              {player.side === Side.LONG ? 'Long ↑' : 'Short ↓'}
            </div>
          </div>
          
          <div className="mt-16 orbitron text-[10px] font-black text-slate-500 tracking-widest flex items-center space-x-2">
            <span className="text-cyan-500 animate-pulse">●</span>
            <span>IDENT: {player.name}</span>
          </div>
        </div>

        {/* Execution Laser (The Grid) */}
        <div className="absolute left-0 right-0 h-1/2 z-30 transition-all duration-500 ease-out pointer-events-none flex flex-col justify-start" style={{ bottom: `-45%` }}>
           <div 
             className="w-full h-1 bg-red-600 laser-grid relative" 
             style={{ marginBottom: `${Math.max(0, 45 + (pnl + marginBuffer) * 0.45)}%` }}
           >
             <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center">
                <div className="text-red-500 text-[10px] orbitron font-black tracking-[0.5em] animate-pulse">
                  &lt;&lt;&lt; LIQUIDATION_PROXIMITY_DANGER &gt;&gt;&gt;
                </div>
             </div>
           </div>
        </div>
      </div>

      {/* Right UI: Terminal & Interaction */}
      <div className="absolute right-1 md:right-8 top-16 md:top-32 bottom-16 md:bottom-32 w-32 md:w-80 flex flex-col space-y-1.5 md:space-y-6 z-10 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        
        {/* AI System Terminal */}
        <div className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-1.5 md:p-6 flex flex-col shadow-2xl relative overflow-hidden min-h-0">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
          <div className="flex justify-between items-start mb-3 md:mb-6">
            <div className="orbitron text-[8px] md:text-[10px] text-slate-500 uppercase font-black">AI_CORE_FEED</div>
            <div className="text-[8px] md:text-[10px] font-mono text-cyan-600 animate-pulse">RELAY_ON</div>
          </div>
          
          <div className="flex-1 text-xs md:text-sm text-cyan-300 font-bold italic leading-relaxed font-mono">
            <span className="text-cyan-700 mr-2">&gt;</span>{commentary}
          </div>

          <div className="mt-3 md:mt-6 pt-3 md:pt-6 border-t border-slate-800 flex flex-col space-y-2">
             <div className="text-[8px] md:text-[9px] text-slate-600 orbitron uppercase tracking-widest">Sector Analysis</div>
             <div className="text-[10px] md:text-[11px] text-white font-bold orbitron uppercase tracking-tighter">{getScenarioTranslation(scenario.id, i18n.getLanguage()).eventText || scenario.eventText}</div>
          </div>
        </div>

        {/* Action HUD */}
        <div className="bg-slate-950 border border-slate-800 p-1.5 md:p-6 space-y-1.5 md:space-y-4 shadow-2xl overflow-y-auto overscroll-contain max-h-[40vh] md:max-h-none" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* 提前结算按钮（达到目标时显示） */}
          {canEarlyExit && (
            <button 
              onClick={() => {
                soundManager.playClick();
                onSafeExtract();
              }}
              className="w-full py-2.5 md:py-4 bg-emerald-600 hover:bg-emerald-500 text-white orbitron font-black text-sm md:text-lg tracking-[0.1em] md:tracking-[0.2em] shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95 transition-all relative overflow-hidden group animate-pulse"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              <span className="hidden md:inline">{i18n.t('gameView.earlyExit')}</span>
              <span className="md:hidden">{i18n.t('gameView.earlyExitShort')}</span>
            </button>
          )}
          
          {/* 安全撤离按钮（盈利但未达目标时显示） */}
          {pnl > 0 && !canEarlyExit && (
            <button 
              onClick={() => {
                soundManager.playClick();
                onSafeExtract();
              }}
              className="w-full py-2.5 md:py-4 bg-cyan-600 hover:bg-cyan-500 text-white orbitron font-black text-sm md:text-lg tracking-[0.1em] md:tracking-[0.2em] shadow-[0_0_30px_rgba(6,182,212,0.3)] active:scale-95 transition-all relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              <span className="hidden md:inline">{i18n.t('gameView.safeExtractWithPnl', { pnl: Math.floor(pnl) })}</span>
              <span className="md:hidden">{i18n.t('gameView.safeExtract')} - {Math.floor(pnl)}%</span>
            </button>
          )}
          
          <button 
            onClick={() => {
              soundManager.playClick();
              onJumpOut();
            }}
            className="w-full py-3 md:py-6 bg-amber-600 hover:bg-amber-500 text-white orbitron font-black text-lg md:text-2xl tracking-[0.1em] md:tracking-[0.2em] shadow-[0_0_30px_rgba(245,158,11,0.2)] active:scale-95 transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            {i18n.t('gameView.jumpOut')}
          </button>

          <div className="grid grid-cols-3 gap-1 md:gap-3">
            <button 
                onClick={() => {
                  soundManager.playClick();
                  onAddMargin();
                }}
                className="py-1.5 md:py-4 border border-emerald-800 text-emerald-500 hover:bg-emerald-950 hover:text-white orbitron text-[7px] md:text-[10px] font-black uppercase transition-all flex flex-col items-center justify-center space-y-0.5 md:space-y-1"
            >
                <span className="truncate w-full text-center">{i18n.t('gameView.marginAdd')}</span>
                <span className="text-[6px] md:text-[8px] opacity-50">MARGIN+</span>
            </button>
            <button 
                onClick={() => {
                  soundManager.playClick();
                  onUseHammer();
                }}
                className="py-1.5 md:py-4 border border-rose-800 text-rose-500 hover:bg-rose-950 hover:text-white orbitron text-[7px] md:text-[10px] font-black uppercase transition-all flex flex-col items-center justify-center space-y-0.5 md:space-y-1"
            >
                <span className="truncate w-full text-center">{i18n.t('gameView.cutLoss')}</span>
                <span className="text-[6px] md:text-[8px] opacity-50">CUT</span>
            </button>
            <button 
                onClick={() => {
                  soundManager.playClick();
                  onPhaseShift();
                }}
                className="py-1.5 md:py-4 border border-cyan-800 text-cyan-500 hover:bg-cyan-950 hover:text-white orbitron text-[7px] md:text-[10px] font-black uppercase transition-all flex flex-col items-center justify-center space-y-0.5 md:space-y-1"
            >
                <span className="truncate w-full text-center">{i18n.t('gameView.phaseShift')}</span>
                <span className="text-[6px] md:text-[8px] opacity-50">SHIFT</span>
            </button>
          </div>

          {/* 关键玩法说明 */}
          <div className="mt-2 md:mt-4 p-1.5 md:p-3 bg-slate-900/80 border border-cyan-500/30 rounded">
            <div className="text-[7px] md:text-[9px] text-cyan-400 orbitron uppercase tracking-widest mb-1 md:mb-2 flex items-center space-x-1">
              <span>💡</span>
              <span>{i18n.t('gameView.keyMechanics')}</span>
            </div>
            <div className="space-y-0.5 md:space-y-1 text-[6px] md:text-[8px] text-slate-400 leading-relaxed">
              <div className="flex items-start space-x-1">
                <span className="text-emerald-400 font-bold flex-shrink-0">•</span>
                <span className="flex-1 min-w-0"><span className="text-emerald-400 font-bold">{i18n.t('gameView.marginAdd')}:</span> {i18n.t('gameView.marginAddDesc')}</span>
              </div>
              <div className="flex items-start space-x-1">
                <span className="text-rose-400 font-bold flex-shrink-0">•</span>
                <span className="flex-1 min-w-0"><span className="text-rose-400 font-bold">{i18n.t('gameView.cutLoss')}:</span> {i18n.t('gameView.cutLossDesc')}</span>
              </div>
              <div className="flex items-start space-x-1">
                <span className="text-cyan-400 font-bold flex-shrink-0">•</span>
                <span className="flex-1 min-w-0"><span className="text-cyan-400 font-bold">{i18n.t('gameView.phaseShift')}:</span> {i18n.t('gameView.phaseShiftDesc')}</span>
              </div>
            </div>
          </div>

          {/* 临时道具提示 */}
          {player.temporaryItems && player.temporaryItems.length > 0 && (
            <div className="border-t border-slate-800 pt-4 space-y-2">
              <div className="text-[9px] text-slate-600 orbitron uppercase tracking-widest mb-2">{i18n.t('gameView.temporaryItems')}</div>
              {player.temporaryItems.includes(TemporaryItemType.DYNAMITE) && (
                <div className="text-xs text-yellow-400 orbitron font-bold bg-slate-800/50 p-2 rounded border border-yellow-500/30">
                  {i18n.t('gameView.dynamiteHint')}
                </div>
              )}
              {player.temporaryItems.includes(TemporaryItemType.TIME_FREEZE) && (
                <div className="text-xs text-cyan-400 orbitron font-bold bg-slate-800/50 p-2 rounded border border-cyan-500/30">
                  {i18n.t('gameView.timeFreezeHint')}
                </div>
              )}
              {player.temporaryItems.includes(TemporaryItemType.LUCKY_NEWS) && showLuckyPreview && (
                <div className="text-xs text-emerald-400 orbitron font-bold bg-slate-800/50 p-2 rounded border border-emerald-500/30">
                  {i18n.t('gameView.luckyNewsHint')}
                </div>
              )}
            </div>
          )}

          {/* 消耗品使用 */}
          {consumables.length > 0 && (
            <div className="border-t border-slate-800 pt-4 space-y-2">
              <div className="text-[9px] text-slate-600 orbitron uppercase tracking-widest mb-2">{i18n.t('gameView.consumables')}</div>
              {consumables.map(cons => {
                const canUse = cons.count > 0 && !player.usedConsumables.includes(cons.type);
                return (
                  <button
                    key={cons.type}
                    onClick={() => canUse && onUseConsumable(cons.type)}
                    disabled={!canUse}
                    className={`w-full py-2 text-xs orbitron font-black uppercase transition-all ${
                      canUse
                        ? 'bg-purple-600 hover:bg-purple-500 text-white'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {cons.type === ConsumableType.STOP_LOSS_BOT && i18n.t('gameView.stopLossBot')}
                    {cons.type === ConsumableType.TIME_CAPSULE && i18n.t('gameView.timeCapsule')}
                    {cons.type === ConsumableType.INSIDER_INFO && i18n.t('gameView.insiderInfo')}
                    {cons.count > 0 && ` (${cons.count})`}
                  </button>
                );
              })}
            </div>
          )}
          
          {/* 装备状态显示 */}
          {(antiGravityLevel > 0 || radarLevel > 0) && (
            <div className="border-t border-slate-800 pt-4 space-y-1">
              <div className="text-[9px] text-slate-600 orbitron uppercase tracking-widest mb-2">装备效果</div>
              {antiGravityLevel > 0 && (
                <div className="text-[10px] text-cyan-400">反重力引擎 Lv{antiGravityLevel}</div>
              )}
              {radarLevel > 0 && (
                <div className="text-[10px] text-cyan-400">高频雷达 Lv{radarLevel} (+{radarWarningTime.toFixed(1)}s)</div>
              )}
            </div>
          )}
          
          <div className="text-[8px] text-slate-700 text-center orbitron font-black uppercase tracking-[0.2em] animate-pulse">
            System Integrity: 98.4%
          </div>
        </div>
      </div>

      {/* Top Header Navigation */}
      <div className="absolute top-0 left-0 right-0 h-20 md:h-32 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent flex flex-col px-2 md:px-16 justify-center z-20">
        <div className="flex items-center justify-between mb-1 md:mb-2">
          <div className="flex flex-col flex-1 min-w-0">
              <div className="orbitron text-slate-600 text-[7px] md:text-[9px] font-black tracking-[0.3em] md:tracking-[0.5em] mb-0.5 md:mb-1 uppercase">Mission Protocol</div>
              <div className="orbitron text-white text-xs md:text-lg font-black tracking-tight uppercase italic truncate">{scenario.name}</div>
          </div>

          <div className="flex flex-col items-end flex-shrink-0 ml-2">
              <div className="orbitron text-slate-600 text-[7px] md:text-[9px] font-black tracking-[0.3em] md:tracking-[0.5em] mb-0.5 md:mb-1 uppercase">Local Chrono</div>
              <div className="orbitron text-white text-xs md:text-lg font-black tracking-tighter uppercase tabular-nums">
                  {Math.floor(currentIndex / 60).toString().padStart(2, '0')}:{ (currentIndex % 60).toString().padStart(2, '0') }
              </div>
          </div>
        </div>

        {/* Target Progress Bar */}
        <div className="flex-1 mx-0 relative mb-1 md:mb-2">
           <div className="flex flex-col md:flex-row justify-between gap-1 md:gap-0 text-[7px] md:text-[10px] orbitron text-slate-400 mb-0.5 md:mb-1 font-black">
               <span className="truncate">{i18n.t('gameView.balance')}: ${currentBalance.toLocaleString()}</span>
               <span className={`truncate ${canEarlyExit ? 'text-emerald-400' : ''}`}>
                 {canEarlyExit ? i18n.t('gameView.achieved') : `${i18n.t('gameView.target')}: $${targetCash.toLocaleString()}`}
               </span>
           </div>
           <div className="h-3 md:h-4 bg-slate-900 border border-slate-800 p-0.5 relative">
             <div 
                className={`h-full transition-all duration-300 relative shadow-[0_0_15px_rgba(6,182,212,0.8)] ${
                  canEarlyExit ? 'bg-gradient-to-r from-emerald-600 to-cyan-500' : 'bg-cyan-500'
                }`}
                style={{ width: `${Math.min(100, progressPercent)}%` }}
             >
                <div className="absolute right-0 top-0 bottom-0 w-2 md:w-4 bg-white/20 animate-pulse"></div>
             </div>
             {/* Target Line */}
             <div 
               className="absolute top-0 bottom-0 w-0.5 bg-amber-500 z-10"
               style={{ left: `${Math.min(100, (targetCash / (targetCash * 1.5)) * 100)}%` }}
             >
               <div className="absolute -top-1.5 md:-top-2 left-1/2 -translate-x-1/2 text-[7px] md:text-[8px] text-amber-400 orbitron font-black">目标</div>
             </div>
           </div>
        </div>

        {/* Time Progress Bar */}
        <div className="flex-1 mx-0 relative">
           <div className="flex justify-between text-[8px] md:text-[10px] orbitron text-slate-600 mb-0.5 md:mb-1 font-black">
               <span>INDEX: {currentIndex}</span>
               <span>END: {scenario.data.length}</span>
           </div>
           <div className="h-1.5 md:h-2 bg-slate-900 border border-slate-800 p-0.5">
             <div 
                className="h-full bg-slate-600 transition-all duration-300 relative"
                style={{ width: `${(currentIndex / scenario.data.length) * 100}%` }}
             >
                <div className="absolute right-0 top-0 bottom-0 w-2 md:w-4 bg-white/20 animate-pulse"></div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default GameView;
