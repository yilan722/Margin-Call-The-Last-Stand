
import React, { useState, useEffect } from 'react';
import { Side, Scenario } from '../types';

interface Props {
  onStart: (side: Side, leverage: number, scenario: Scenario) => void;
  scenarios: Scenario[];
  leverageOptions: number[];
  onBack: () => void;
  initialScenario?: Scenario;
}

const BettingOverlay: React.FC<Props> = ({ onStart, scenarios, leverageOptions, onBack, initialScenario }) => {
  const [side, setSide] = useState<Side>(Side.LONG);
  const [leverage, setLeverage] = useState(5);
  const [selectedScenario, setSelectedScenario] = useState<Scenario>(
    initialScenario || scenarios[0]
  );

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
          返回
        </button>
        <h2 className="orbitron text-3xl font-bold text-white">量子交易塔 - 入场配置</h2>
        <div className="w-24"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left Column: Side & Leverage */}
        <div className="space-y-8">
          <div>
            <label className="block text-slate-400 text-sm mb-4 uppercase tracking-widest">选择阵营 (Direction)</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setSide(Side.LONG)}
                className={`py-4 font-bold border-2 transition-all ${side === Side.LONG ? 'bg-emerald-600 border-emerald-400 text-white' : 'border-slate-700 text-slate-500 hover:border-emerald-600'}`}
              >
                多 LONG ↑
              </button>
              <button 
                onClick={() => setSide(Side.SHORT)}
                className={`py-4 font-bold border-2 transition-all ${side === Side.SHORT ? 'bg-rose-600 border-rose-400 text-white' : 'border-slate-700 text-slate-500 hover:border-rose-600'}`}
              >
                空 SHORT ↓
              </button>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 text-sm mb-4 uppercase tracking-widest">杠杆倍数 (Leverage)</label>
            <div className="grid grid-cols-3 gap-2">
              {leverageOptions.map(opt => (
                <button 
                  key={opt}
                  onClick={() => setLeverage(opt)}
                  className={`py-2 text-sm font-bold border transition-all ${leverage === opt ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg shadow-cyan-900' : 'border-slate-700 text-slate-500 hover:border-cyan-500'}`}
                >
                  {opt}X
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-500">
              {leverage === 1 && "现货卫士: 几乎永不爆仓，稳健如泰坦。"}
              {leverage > 1 && leverage < 50 && "信用游侠: 灵活机动，兼顾风险与收益。"}
              {leverage >= 50 && "赌徒之神: 你的脚底板离强平线只有1毫米。"}
            </p>
          </div>
        </div>

        {/* Right Column: Scenario */}
        <div className="space-y-8">
          <div>
            <label className="block text-slate-400 text-sm mb-4 uppercase tracking-widest">历史关卡 (History Scenario)</label>
            <div className="space-y-3 h-64 overflow-y-auto pr-2 custom-scrollbar">
              {scenarios.map(sc => (
                <div 
                  key={sc.id}
                  onClick={() => setSelectedScenario(sc)}
                  className={`p-4 border-2 cursor-pointer transition-all ${selectedScenario.id === sc.id ? 'bg-slate-800 border-cyan-500' : 'border-slate-800 hover:border-slate-600'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-white">{sc.name}</span>
                    <span className="text-amber-500">{'★'.repeat(sc.difficulty)}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{sc.description}</p>
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
          确认投入
        </button>
      </div>
    </div>
  );
};

export default BettingOverlay;
