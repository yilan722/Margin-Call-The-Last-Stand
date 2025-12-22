import React from 'react';
import { Scenario, Chapter, PlayerProfile } from '../types';
import { SCENARIOS_BY_CHAPTER } from '../constants';

interface Props {
  profile: PlayerProfile;
  onSelectLevel: (scenario: Scenario) => void;
  onBack: () => void;
}

const CampaignMap: React.FC<Props> = ({ profile, onSelectLevel, onBack }) => {
  const chapterNames: Record<Chapter, { name: string; period: string }> = {
    [Chapter.GOLDEN_AGE]: { name: '第1章：黄金时代', period: '1990-2000' },
    [Chapter.SUBPRIME_STORM]: { name: '第2章：次贷风云', period: '2000-2010' },
    [Chapter.QUANTUM_RUSH]: { name: '第3章：量化狂潮', period: '2010-2020' },
    [Chapter.CYBER_ERA]: { name: '第4章：赛博纪元', period: '2020-2025' }
  };

  const isLevelUnlocked = (scenario: Scenario): boolean => {
    // 直接检查是否在已解锁列表中
    return profile.unlockedLevels.includes(scenario.id);
  };

  return (
    <div className="z-30 w-full h-full bg-slate-950 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-slate-900 to-transparent pb-8 pt-8 px-16 border-b border-slate-800">
        <div className="flex justify-between items-center mb-6">
          <h1 className="orbitron text-5xl font-black text-white tracking-tighter">时空交易员 - 生涯地图</h1>
          <button
            onClick={onBack}
            className="px-6 py-3 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all orbitron text-sm uppercase tracking-widest"
          >
            返回
          </button>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">💎</span>
            <div>
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest">时间钻石</div>
              <div className="text-2xl font-bold text-cyan-400 orbitron">{profile.timeDiamonds}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📊</span>
            <div>
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest">当前进度</div>
              <div className="text-lg font-bold text-white orbitron">
                {chapterNames[profile.currentChapter].name} - 关卡 {profile.currentLevel}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Timeline */}
      <div className="px-16 py-12 space-y-16">
        {Object.values(Chapter).map((chapter) => {
          const scenarios = SCENARIOS_BY_CHAPTER[chapter];
          const chapterInfo = chapterNames[chapter];
          const isChapterUnlocked = isLevelUnlocked(scenarios[0]);

          return (
            <div key={chapter} className="relative">
              {/* Chapter Header */}
              <div className="mb-8 flex items-center space-x-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 ${
                  isChapterUnlocked 
                    ? 'bg-cyan-500/20 border-cyan-500' 
                    : 'bg-slate-800 border-slate-700'
                }`}>
                  <span className="text-2xl">
                    {chapter === Chapter.GOLDEN_AGE && '🌟'}
                    {chapter === Chapter.SUBPRIME_STORM && '⚡'}
                    {chapter === Chapter.QUANTUM_RUSH && '🔮'}
                    {chapter === Chapter.CYBER_ERA && '🤖'}
                  </span>
                </div>
                <div>
                  <h2 className={`orbitron text-3xl font-black ${
                    isChapterUnlocked ? 'text-white' : 'text-slate-600'
                  }`}>
                    {chapterInfo.name}
                  </h2>
                  <p className="text-slate-500 text-sm orbitron">{chapterInfo.period}</p>
                </div>
              </div>

              {/* Level Nodes */}
              <div className="relative pl-20">
                {/* Timeline Line */}
                <div className={`absolute left-8 top-0 bottom-0 w-1 ${
                  isChapterUnlocked ? 'bg-cyan-500/30' : 'bg-slate-800'
                }`}></div>

                <div className="space-y-8">
                  {scenarios.map((scenario, index) => {
                    const unlocked = isLevelUnlocked(scenario);
                    const isCurrent = profile.currentChapter === chapter && profile.currentLevel === scenario.level;

                    return (
                      <div key={scenario.id} className="relative flex items-center space-x-6">
                        {/* Level Node */}
                        <div className={`absolute left-0 w-16 h-16 rounded-full flex items-center justify-center border-4 transition-all ${
                          isCurrent
                            ? 'bg-cyan-500 border-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.8)] scale-110'
                            : unlocked
                            ? 'bg-emerald-500/20 border-emerald-500 cursor-pointer hover:scale-110'
                            : 'bg-slate-800 border-slate-700 opacity-50'
                        }`}
                        onClick={() => unlocked && onSelectLevel(scenario)}
                        >
                          {scenario.isBoss ? (
                            <span className="text-2xl">👹</span>
                          ) : (
                            <span className="text-lg font-black text-white orbitron">{scenario.level}</span>
                          )}
                        </div>

                        {/* Level Info Card */}
                        <div className={`flex-1 ml-20 p-6 border-2 rounded transition-all ${
                          isCurrent
                            ? 'border-cyan-500 bg-cyan-500/10'
                            : unlocked
                            ? 'border-slate-700 bg-slate-900/50 hover:border-slate-600 cursor-pointer'
                            : 'border-slate-800 bg-slate-950/50 opacity-50'
                        }`}
                        onClick={() => unlocked && onSelectLevel(scenario)}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className={`orbitron text-xl font-black ${
                                unlocked ? 'text-white' : 'text-slate-600'
                              }`}>
                                {scenario.name}
                                {scenario.isBoss && <span className="ml-2 text-rose-500">[BOSS]</span>}
                              </h3>
                              <p className="text-slate-500 text-sm mt-1">{scenario.description}</p>
                            </div>
                            <div className="flex flex-col items-end space-y-2">
                              <div className="text-amber-500 text-sm">
                                {'★'.repeat(scenario.difficulty)}
                              </div>
                              <div className="text-slate-600 text-xs orbitron">{scenario.year}年</div>
                            </div>
                          </div>
                          {!unlocked && (
                            <div className="mt-4 text-xs text-slate-600 orbitron uppercase">
                              需要完成前置关卡
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CampaignMap;

