
import React from 'react';
import { Scenario, PlayerState, Side } from '../types';
import KLineChart from './KLineChart';

interface Props {
  scenario: Scenario;
  player: PlayerState;
  currentIndex: number;
  commentary: string;
  onJumpOut: () => void;
  onAddMargin: () => void;
  onUseHammer: () => void;
  marginBuffer: number;
}

const GameView: React.FC<Props> = ({ scenario, player, currentIndex, commentary, onJumpOut, onAddMargin, onUseHammer, marginBuffer }) => {
  const currentPrice = scenario.data[currentIndex].price;
  const pnl = player.currentPnl;
  
  // Calculate visual position
  // 0% PnL is middle (50%). -100% PnL is bottom (0%).
  // Add marginBuffer to visual height to show the safety net
  const visualHeight = Math.max(0, 50 + (pnl + marginBuffer) * 0.45); 

  // Mecha Visual Styles
  const isGodOfGamblers = player.leverage >= 50;
  const isRanger = player.leverage >= 5 && player.leverage < 50;
  const isGuardian = player.leverage < 5;

  return (
    <div className="relative w-full h-full flex overflow-hidden">
      
      {/* Background Data Stream Wall */}
      <div className="absolute inset-0 z-0 opacity-10 flex justify-between pointer-events-none">
        <div className="w-px h-full bg-slate-800 ml-[25%]"></div>
        <div className="w-px h-full bg-slate-800 mr-[25%]"></div>
      </div>

      {/* Left UI: Live K-Line */}
      <div className="absolute left-8 top-32 bottom-32 w-72 bg-slate-900/80 backdrop-blur-xl border border-slate-800 z-10 flex flex-col p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
            <div className="orbitron text-[10px] text-cyan-500 font-black tracking-widest uppercase">Live Pulse</div>
            <div className="flex space-x-1">
                <div className="w-1 h-3 bg-cyan-500 animate-[pulse_1s_infinite]"></div>
                <div className="w-1 h-3 bg-cyan-500 animate-[pulse_1.2s_infinite]"></div>
                <div className="w-1 h-3 bg-cyan-500 animate-[pulse_0.8s_infinite]"></div>
            </div>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <KLineChart data={scenario.data.slice(0, currentIndex + 1)} />
        </div>

        <div className="mt-6 space-y-4 font-bold border-t border-slate-800 pt-6">
          <div className="flex justify-between text-[10px] orbitron">
            <span className="text-slate-500">BASE PRICE</span>
            <span className="text-white">${player.entryPrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-[10px] orbitron">
            <span className="text-slate-500">MARK PRICE</span>
            <span className="text-cyan-400">${currentPrice.toLocaleString()}</span>
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
      <div className="absolute right-8 top-32 bottom-32 w-80 flex flex-col space-y-6 z-10">
        
        {/* AI System Terminal */}
        <div className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800 p-6 flex flex-col shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
          <div className="flex justify-between items-start mb-6">
            <div className="orbitron text-[10px] text-slate-500 uppercase font-black">AI_CORE_FEED</div>
            <div className="text-[10px] font-mono text-cyan-600 animate-pulse">RELAY_ON</div>
          </div>
          
          <div className="flex-1 text-sm text-cyan-300 font-bold italic leading-relaxed font-mono">
            <span className="text-cyan-700 mr-2">&gt;</span>{commentary}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800 flex flex-col space-y-2">
             <div className="text-[9px] text-slate-600 orbitron uppercase tracking-widest">Sector Analysis</div>
             <div className="text-[11px] text-white font-bold orbitron uppercase tracking-tighter">{scenario.eventText}</div>
          </div>
        </div>

        {/* Action HUD */}
        <div className="bg-slate-950 border border-slate-800 p-6 space-y-4 shadow-2xl">
          <button 
            onClick={onJumpOut}
            className="w-full py-6 bg-amber-600 hover:bg-amber-500 text-white orbitron font-black text-2xl tracking-[0.2em] shadow-[0_0_30px_rgba(245,158,11,0.2)] active:scale-95 transition-all relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
            跳车 EXIT
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={onAddMargin}
                className="py-4 border border-emerald-800 text-emerald-500 hover:bg-emerald-950 hover:text-white orbitron text-[10px] font-black uppercase transition-all flex flex-col items-center justify-center space-y-1"
            >
                <span>补仓</span>
                <span className="text-[8px] opacity-50">MARGIN+</span>
            </button>
            <button 
                onClick={onUseHammer}
                className="py-4 border border-rose-800 text-rose-500 hover:bg-rose-950 hover:text-white orbitron text-[10px] font-black uppercase transition-all flex flex-col items-center justify-center space-y-1"
            >
                <span>干扰</span>
                <span className="text-[8px] opacity-50">HAMMER</span>
            </button>
          </div>
          
          <div className="text-[8px] text-slate-700 text-center orbitron font-black uppercase tracking-[0.2em] animate-pulse">
            System Integrity: 98.4%
          </div>
        </div>
      </div>

      {/* Top Header Navigation */}
      <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-slate-900 via-slate-900/80 to-transparent flex items-center px-16 justify-between z-20">
        <div className="flex flex-col">
            <div className="orbitron text-slate-600 text-[9px] font-black tracking-[0.5em] mb-1 uppercase">Mission Protocol</div>
            <div className="orbitron text-white text-lg font-black tracking-tight uppercase italic">{scenario.name}</div>
        </div>

        <div className="flex-1 mx-32 relative">
           <div className="flex justify-between text-[10px] orbitron text-slate-600 mb-2 font-black">
               <span>DATA_INDEX: {currentIndex}</span>
               <span>TARGET_END: {scenario.data.length}</span>
           </div>
           <div className="h-2 bg-slate-900 border border-slate-800 p-0.5">
             <div 
                className="h-full bg-cyan-500 transition-all duration-300 relative shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                style={{ width: `${(currentIndex / scenario.data.length) * 100}%` }}
             >
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-white/20 animate-pulse"></div>
             </div>
           </div>
        </div>

        <div className="flex flex-col items-end">
            <div className="orbitron text-slate-600 text-[9px] font-black tracking-[0.5em] mb-1 uppercase">Local Chrono</div>
            <div className="orbitron text-white text-lg font-black tracking-tighter uppercase tabular-nums">
                {Math.floor(currentIndex / 60).toString().padStart(2, '0')}:{ (currentIndex % 60).toString().padStart(2, '0') }
            </div>
        </div>
      </div>
    </div>
  );
};

export default GameView;
