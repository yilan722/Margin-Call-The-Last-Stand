import React from 'react';
import { Scenario, Chapter, PlayerProfile } from '../types';
import { SCENARIOS_BY_CHAPTER } from '../constants';
import { i18n } from '../utils/i18n';
import { getScenarioTranslation } from '../utils/scenarioTranslations';

interface Props {
  profile: PlayerProfile;
  onSelectLevel: (scenario: Scenario) => void;
  onBack: () => void;
}

const CampaignMap: React.FC<Props> = ({ profile, onSelectLevel, onBack }) => {
  const chapterNames: Record<Chapter, { name: string; period: string }> = {
    [Chapter.GOLDEN_AGE]: { name: i18n.t('campaignMap.chapters.goldenAge'), period: '1990-2000' },
    [Chapter.SUBPRIME_STORM]: { name: i18n.t('campaignMap.chapters.subprimeStorm'), period: '2000-2010' },
    [Chapter.QUANTUM_RUSH]: { name: i18n.t('campaignMap.chapters.quantumRush'), period: '2010-2020' },
    [Chapter.CYBER_ERA]: { name: i18n.t('campaignMap.chapters.cyberEra'), period: '2020-2025' }
  };

  // 判断关卡是否可玩（基于线性进度）
  const isLevelPlayable = (scenario: Scenario): boolean => {
    // 只能玩当前关卡
    return scenario.chapter === profile.currentChapter && 
           scenario.level === profile.currentLevel && 
           scenario.phase === profile.currentPhase;
  };

  // 判断关卡是否已完成（在当前进度之前）
  const isLevelCompleted = (scenario: Scenario): boolean => {
    const chapters = Object.values(Chapter);
    const currentChapterIndex = chapters.indexOf(profile.currentChapter);
    const scenarioChapterIndex = chapters.indexOf(scenario.chapter);
    
    // 如果章节更早，则已完成
    if (scenarioChapterIndex < currentChapterIndex) return true;
    // 如果章节相同但关卡更早，则已完成
    if (scenarioChapterIndex === currentChapterIndex && scenario.level < profile.currentLevel) return true;
    // 如果章节、关卡相同但阶段更早，则已完成
    if (scenarioChapterIndex === currentChapterIndex && 
        scenario.level === profile.currentLevel && 
        scenario.phase < profile.currentPhase) return true;
    
    return false;
  };

  return (
    <div className="z-30 w-full h-full bg-slate-950 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-b from-slate-900 to-transparent pb-4 md:pb-8 pt-4 md:pt-8 px-4 md:px-16 border-b border-slate-800">
        <div className="flex justify-between items-center mb-4 md:mb-6">
          <h1 className="orbitron text-2xl md:text-5xl font-black text-white tracking-tighter">{i18n.t('campaignMap.title')}</h1>
          <button
            onClick={onBack}
            className="px-3 py-1.5 md:px-6 md:py-3 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all orbitron text-xs md:text-sm uppercase tracking-widest"
          >
            {i18n.t('common.back')}
          </button>
        </div>
        
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">💎</span>
            <div>
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest">{i18n.t('campaignMap.timeDiamonds')}</div>
              <div className="text-2xl font-bold text-cyan-400 orbitron">{profile.timeDiamonds}</div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-2xl">📊</span>
            <div>
              <div className="text-slate-500 text-xs orbitron uppercase tracking-widest">{i18n.t('campaignMap.currentProgress')}</div>
              <div className="text-lg font-bold text-white orbitron">
                {chapterNames[profile.currentChapter].name} - {i18n.t('campaignMap.level')} {profile.currentLevel}
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
          // 章节已解锁：如果当前章节等于或晚于该章节
          const chapters = Object.values(Chapter);
          const currentChapterIndex = chapters.indexOf(profile.currentChapter);
          const chapterIndex = chapters.indexOf(chapter);
          const isChapterUnlocked = chapterIndex <= currentChapterIndex;

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
              <div className="relative pl-8 md:pl-20">
                {/* Timeline Line */}
                <div className={`absolute left-8 top-0 bottom-0 w-1 ${
                  isChapterUnlocked ? 'bg-cyan-500/30' : 'bg-slate-800'
                }`}></div>

                <div className="space-y-12">
                  {/* 按level分组显示 */}
                  {Array.from(new Set(scenarios.map(s => s.level))).map((level) => {
                    const levelScenarios = scenarios.filter(s => s.level === level).sort((a, b) => a.phase - b.phase);
                    const firstScenario = levelScenarios[0];
                    const isCurrentLevel = profile.currentChapter === chapter && profile.currentLevel === level;
                    const completedPhases = levelScenarios.filter(s => isLevelCompleted(s)).length;
                    const hasPlayablePhase = levelScenarios.some(s => isLevelPlayable(s));

                    return (
                      <div key={`level-${level}`} className="relative">
                        {/* Level Header */}
                        <div className="mb-4 flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                            isCurrentLevel || completedPhases > 0
                              ? 'bg-cyan-500/20 border-cyan-500'
                              : 'bg-slate-800 border-slate-700'
                          }`}>
                            {firstScenario.isBoss ? (
                              <span className="text-xl">👹</span>
                            ) : (
                              <span className="text-sm font-black text-white orbitron">{level}</span>
                            )}
                          </div>
                          <div>
                            <h3 className={`orbitron text-lg font-black ${
                              isCurrentLevel || completedPhases > 0 ? 'text-white' : 'text-slate-600'
                            }`}>
                              {(() => {
                                const lang = i18n.getLanguage();
                                const trans = getScenarioTranslation(firstScenario.id, lang);
                                return trans.name.split(' - ')[0];
                              })()}
                              {firstScenario.isBoss && <span className="ml-2 text-rose-500">[BOSS]</span>}
                            </h3>
                            <p className="text-slate-500 text-xs">
                              {(() => {
                                const lang = i18n.getLanguage();
                                const trans = getScenarioTranslation(firstScenario.id, lang);
                                return trans.description;
                              })()}
                            </p>
                          </div>
                          <div className="ml-auto flex items-center space-x-2">
                            <div className="text-amber-500 text-xs">
                              {'★'.repeat(firstScenario.difficulty)}
                            </div>
                            <div className="text-slate-600 text-xs orbitron">{firstScenario.year} {i18n.t('campaignMap.year')}</div>
                          </div>
                        </div>

                        {/* Phase Nodes */}
                        <div className="ml-16 grid grid-cols-4 gap-3">
                          {levelScenarios.map((scenario) => {
                            const playable = isLevelPlayable(scenario);
                            const completed = isLevelCompleted(scenario);
                            const isCurrent = playable;

                            return (
                              <div
                                key={scenario.id}
                                className={`p-3 border-2 rounded transition-all ${
                                  isCurrent
                                    ? 'border-cyan-500 bg-cyan-500/10 cursor-pointer animate-pulse'
                                    : completed
                                    ? 'border-emerald-500/30 bg-emerald-500/5 opacity-60 cursor-default'
                                    : 'border-slate-800 bg-slate-950/50 opacity-30 cursor-not-allowed'
                                }`}
                                onClick={() => {
                                  if (playable) {
                                    onSelectLevel(scenario);
                                  }
                                }}
                                title={playable ? `${i18n.t('common.start')} ${scenario.name}` : completed ? i18n.t('campaignMap.unlocked') : i18n.t('campaignMap.notUnlocked')}
                              >
                                <div className="text-center">
                                  <div className={`text-xs font-bold orbitron mb-1 ${
                                    playable ? 'text-cyan-400' : completed ? 'text-emerald-400' : 'text-slate-600'
                                  }`}>
                                    {i18n.t('campaignMap.phase')} {scenario.phase}
                                  </div>
                                  <div className={`text-xs ${
                                    playable ? 'text-slate-300' : completed ? 'text-slate-500' : 'text-slate-600'
                                  }`}>
                                    {scenario.phase === 1 && i18n.t('campaignMap.phaseNames.early')}
                                    {scenario.phase === 2 && i18n.t('campaignMap.phaseNames.mid')}
                                    {scenario.phase === 3 && i18n.t('campaignMap.phaseNames.late')}
                                    {scenario.phase === 4 && i18n.t('campaignMap.phaseNames.final')}
                                  </div>
                                  {completed && (
                                    <div className="text-xs text-emerald-400 mt-1">{i18n.t('campaignMap.unlocked')}</div>
                                  )}
                                  {playable && (
                                    <div className="text-xs text-cyan-400 mt-1 font-bold">▶ {i18n.t('campaignMap.currentLevel')}</div>
                                  )}
                                  {!playable && !completed && (
                                    <div className="text-xs text-slate-600 mt-1">{i18n.t('campaignMap.locked')}</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {completedPhases > 0 && completedPhases < 4 && (
                          <div className="ml-16 mt-2 text-xs text-slate-500">
                            {i18n.t('campaignMap.progress')}: {completedPhases}/4 {i18n.t('campaignMap.phase')}
                          </div>
                        )}
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

