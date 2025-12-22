import React, { useState, useEffect, useRef } from 'react';
import { GamePhase, Side, PlayerState, Scenario, PlayerProfile, Chapter, EquipmentType, ConsumableType, Equipment, Consumable, TemporaryItemType } from './types';
import { SCENARIOS, LEVERAGE_OPTIONS, EQUIPMENT_PRICES, CONSUMABLE_PRICES, getReviveCost, INITIAL_CASH, TEMPORARY_ITEM_PRICES } from './constants';
import BettingOverlay from './components/BettingOverlay';
import GameView from './components/GameView';
import ResultOverlay from './components/ResultOverlay';
import CampaignMap from './components/CampaignMap';
import DarkPoolShop from './components/DarkPoolShop';
import LevelBriefing from './components/LevelBriefing';
import IntermissionShop from './components/IntermissionShop';
import { GoogleGenAI } from "@google/genai";

// 初始化玩家档案
const createInitialProfile = (): PlayerProfile => ({
  timeDiamonds: 0,
  currentCash: INITIAL_CASH, // 初始资金 $10,000
  currentChapter: Chapter.GOLDEN_AGE,
  currentLevel: 1,
  unlockedLevels: ['1-1'],
  equipment: [],
  consumables: [],
  totalDiamondsEarned: 0,
  totalDeaths: 0
});

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.LOBBY);
  const [profile, setProfile] = useState<PlayerProfile>(() => {
    // 从localStorage加载或创建新档案
    const saved = localStorage.getItem('timeTraderProfile');
    if (saved) {
      const parsed = JSON.parse(saved);
      // 迁移旧存档：如果没有currentCash字段，设置为初始值
      if (parsed.currentCash === undefined) {
        parsed.currentCash = INITIAL_CASH;
      }
      return parsed;
    }
    return createInitialProfile();
  });
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [commentary, setCommentary] = useState("量子交易塔已连接。等待入场指令...");
  const [isShaking, setIsShaking] = useState(false);
  const [marginBuffer, setMarginBuffer] = useState(0);
  const [hasStopLossProtection, setHasStopLossProtection] = useState(false); // 熔断保护器状态
  const [temporaryItems, setTemporaryItems] = useState<{ type: TemporaryItemType; count: number }[]>([]); // 临时道具
  const [currentLevelTarget, setCurrentLevelTarget] = useState(0); // 当前关卡目标金额
  const [finalBalance, setFinalBalance] = useState(0); // 关卡结束时的最终余额

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 保存档案到localStorage
  useEffect(() => {
    localStorage.setItem('timeTraderProfile', JSON.stringify(profile));
  }, [profile]);

  // 计算关卡目标金额
  const calculateLevelTarget = (scenario: Scenario, currentCash: number): number => {
    if (scenario.targetMultiplier) {
      return Math.floor(currentCash * scenario.targetMultiplier);
    }
    // 默认目标：增长20%
    return Math.floor(currentCash * 1.2);
  };

  // 计算最终余额（基于收益率）
  const calculateFinalBalance = (currentCash: number, pnl: number): number => {
    return Math.floor(currentCash * (1 + pnl / 100));
  };

  const startGame = (selectedSide: Side, selectedLeverage: number, selectedScenario: Scenario) => {
    setScenario(selectedScenario);
    const initialPrice = selectedScenario.data[0].price;
    
    // 检查是否有熔断保护器
    const stopLossBot = profile.consumables.find(c => c.type === ConsumableType.STOP_LOSS_BOT);
    setHasStopLossProtection(stopLossBot ? stopLossBot.count > 0 : false);
    
    setPlayer({
      id: 'local-user',
      name: '时空交易员',
      leverage: selectedLeverage,
      side: selectedSide,
      entryPrice: initialPrice,
      currentPnl: 0,
      currentYield: 0,
      isDead: false,
      isExited: false,
      highPnl: 0,
      usedConsumables: []
    });
    setCurrentIndex(0);
    setMarginBuffer(0);
    setPhase(GamePhase.TRADING);
  };

  const updateCommentary = async (price: number, pnl: number) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `当前行情数据：价格 ${price}, 我的收益率 ${pnl.toFixed(2)}% (杠杆 ${player?.leverage}x)。`,
        config: {
          systemInstruction: `你是一个《黑镜》风格、毒舌、冷酷且专业的金融AI播报员。你正在量子交易塔直播这一场生存挑战。
          1. 评论必须简短有力（不超过20字）。
          2. 语气要带有嘲讽或冷酷的警示。
          3. 如果玩家亏损严重，嘲笑他们的贪婪。
          4. 如果玩家盈利巨大，提醒他们由于杠杆，下一秒就可能归零。
          5. 使用专业术语如：流动性陷阱、熔断、爆仓、多头埋伏。`
        }
      });
      setCommentary(response.text || "市场正在呼吸...");
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (phase === GamePhase.TRADING && player && !player.isDead && !player.isExited) {
      gameLoopRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const next = prev + 1;
          if (next >= scenario.data.length) {
            if (gameLoopRef.current) {
              clearInterval(gameLoopRef.current);
            }
            // 数据走完，标记为已完成（存活完成关卡）
            setPlayer(prev => {
              if (!prev) return null;
              const finalPnl = prev.currentPnl;
              const endBalance = calculateFinalBalance(profile.currentCash, finalPnl);
              setFinalBalance(endBalance);
              return {
                ...prev,
                isExited: true,
                exitPrice: scenario.data[prev]?.price || prev.entryPrice,
                exitPnl: finalPnl
              };
            });
            setPhase(GamePhase.RESULT);
            return prev;
          }
          return next;
        });
        
        setMarginBuffer(prev => Math.max(0, prev - 1));
      }, 300);
    } else {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    }
    return () => { if (gameLoopRef.current) clearInterval(gameLoopRef.current); };
  }, [phase, player, scenario]);

  useEffect(() => {
    if (!player || phase !== GamePhase.TRADING) return;

    const currentPrice = scenario.data[currentIndex].price;
    const prevPrice = currentIndex > 0 ? scenario.data[currentIndex - 1].price : currentPrice;
    const priceChangePct = ((currentPrice - player.entryPrice) / player.entryPrice) * 100;
    const stepChange = Math.abs((currentPrice - prevPrice) / prevPrice) * 100;

    if (stepChange > 2) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }

    const actualPnl = player.side === Side.LONG ? priceChangePct * player.leverage : -priceChangePct * player.leverage;

    setPlayer(prev => {
      if (!prev || prev.isDead || prev.isExited) return prev;
      
      const adjustedPnl = actualPnl + marginBuffer;
      let isDead = adjustedPnl <= -100;
      
      // 熔断保护器效果
      if (isDead && hasStopLossProtection && !prev.usedConsumables.includes(ConsumableType.STOP_LOSS_BOT)) {
        isDead = false;
        setHasStopLossProtection(false);
        setCommentary(">>> 熔断保护器激活！抵挡了一次必死爆仓！");
        // 消耗一个熔断保护器
        setProfile(prevProfile => ({
          ...prevProfile,
          consumables: prevProfile.consumables.map(c => 
            c.type === ConsumableType.STOP_LOSS_BOT 
              ? { ...c, count: Math.max(0, c.count - 1) }
              : c
          )
        }));
        return { ...prev, usedConsumables: [...prev.usedConsumables, ConsumableType.STOP_LOSS_BOT] };
      }
      
      const highPnl = Math.max(prev.highPnl, actualPnl);

      if (isDead) {
        const endBalance = calculateFinalBalance(profile.currentCash, -100);
        setFinalBalance(endBalance);
        setPhase(GamePhase.RESULT);
        setProfile(prevProfile => ({ ...prevProfile, totalDeaths: prevProfile.totalDeaths + 1 }));
        return { ...prev, currentPnl: -100, currentYield: -100, isDead: true, highPnl };
      }

      return { ...prev, currentPnl: actualPnl, currentYield: actualPnl, highPnl };
    });

    if (currentIndex % 20 === 0) {
      updateCommentary(currentPrice, actualPnl);
    }
  }, [currentIndex, scenario, phase, marginBuffer, hasStopLossProtection]);

  // 当进入RESULT阶段且玩家完成关卡时，自动解锁下一关
  useEffect(() => {
    if (phase === GamePhase.RESULT && player && !player.isDead && player.isExited) {
      unlockNextLevel(scenario);
    }
  }, [phase, player, scenario]);

  const handleJumpOut = () => {
    if (!player || player.isDead || player.isExited) return;
    setPlayer(prev => {
      if (!prev) return null;
      const finalPnl = prev.currentPnl;
      const endBalance = calculateFinalBalance(profile.currentCash, finalPnl);
      setFinalBalance(endBalance);
      return {
        ...prev,
        isExited: true,
        exitPrice: scenario.data[currentIndex].price,
        exitPnl: finalPnl
      };
    });
    setPhase(GamePhase.RESULT);
  };

  // 统一的关卡解锁逻辑
  const unlockNextLevel = (currentScenario: Scenario) => {
    const nextLevel = currentScenario.level + 1;
    const nextScenario = SCENARIOS.find(s => s.chapter === currentScenario.chapter && s.level === nextLevel);
    
    if (nextScenario) {
      setProfile(prev => {
        // 检查是否已经解锁（避免重复解锁）
        if (prev.unlockedLevels.includes(nextScenario.id)) {
          return prev;
        }
        return {
          ...prev,
          currentLevel: nextLevel,
          unlockedLevels: [...new Set([...prev.unlockedLevels, nextScenario.id])]
        };
      });
    } else {
      // 章节完成，解锁下一章节的第一关
      const chapters = Object.values(Chapter);
      const currentIndex = chapters.indexOf(currentScenario.chapter);
      if (currentIndex < chapters.length - 1) {
        const nextChapter = chapters[currentIndex + 1];
        const firstLevelOfNextChapter = SCENARIOS.find(s => s.chapter === nextChapter && s.level === 1);
        if (firstLevelOfNextChapter) {
          setProfile(prev => {
            // 检查是否已经解锁
            if (prev.unlockedLevels.includes(firstLevelOfNextChapter.id)) {
              return prev;
            }
            return {
              ...prev,
              currentChapter: nextChapter,
              currentLevel: 1,
              unlockedLevels: [...new Set([...prev.unlockedLevels, firstLevelOfNextChapter.id])]
            };
          });
        }
      }
    }
  };

  const handleSafeExtract = () => {
    if (!player || player.isDead || player.isExited) return;
    // 提前结算：如果已经达到目标，可以提前结束
    const finalPnl = player.currentPnl;
    const endBalance = calculateFinalBalance(profile.currentCash, finalPnl);
    setFinalBalance(endBalance);
    
    setPlayer(prev => prev ? ({
      ...prev,
      isExited: true,
      exitPrice: scenario.data[currentIndex].price,
      exitPnl: finalPnl
    }) : null);
    setPhase(GamePhase.RESULT);
  };

  // 计算结算结果
  const calculateResult = (endBalance: number, targetBalance: number) => {
    if (endBalance <= 0) return { status: 'LIQUIDATED' as const }; // 爆仓
    if (endBalance < targetBalance) return { status: 'FAILED' as const }; // 未达标

    // 成功通关
    const profit = endBalance - targetBalance;
    const diamondReward = Math.floor(profit / 100); // 超额部分换钻石
    
    return {
      status: 'SUCCESS' as const,
      nextCash: endBalance, // 本金带入下一关
      diamondGain: diamondReward
    };
  };

  const handleExtractDiamonds = () => {
    if (!player) return;
    
    const finalPnl = player.isDead ? -100 : (player.exitPnl || player.currentPnl);
    const endBalance = calculateFinalBalance(profile.currentCash, finalPnl);
    setFinalBalance(endBalance);
    
    const result = calculateResult(endBalance, currentLevelTarget);
    
    if (result.status === 'LIQUIDATED') {
      // 爆仓归零
      setProfile(prev => ({
        ...prev,
        currentCash: 0,
        totalDeaths: prev.totalDeaths + 1
      }));
      // 可以选择进入复活界面或直接结束
    } else if (result.status === 'FAILED') {
      // 业绩未达标
      // 不更新现金，保持当前状态，让玩家选择是否用钻石补救
    } else {
      // 成功通关
      const diamondMiner = profile.equipment.find(e => e.type === EquipmentType.DIAMOND_MINER);
      const bonus = diamondMiner ? diamondMiner.level * 0.1 : 0;
      const finalDiamonds = Math.floor(result.diamondGain * (1 + bonus));
      
      setProfile(prev => ({
        ...prev,
        currentCash: result.nextCash, // 更新本金
        timeDiamonds: prev.timeDiamonds + finalDiamonds,
        totalDiamondsEarned: prev.totalDiamondsEarned + finalDiamonds
      }));
      
      unlockNextLevel(scenario);
    }
    
    // 进入局间商店（如果成功）或返回地图
    if (result.status === 'SUCCESS') {
      setPhase(GamePhase.INTERMISSION_SHOP);
    } else {
      setPhase(GamePhase.CAMPAIGN_MAP);
    }
  };

  const handleRevive = () => {
    if (!player) return;
    
    // 判断是爆仓还是业绩未达标
    const finalPnl = player.isDead ? -100 : (player.exitPnl || player.currentPnl);
    const endBalance = calculateFinalBalance(profile.currentCash, finalPnl);
    const result = calculateResult(endBalance, currentLevelTarget);
    
    if (result.status === 'LIQUIDATED') {
      // 爆仓归零：申请紧急救助金
      const reviveCost = 100; // 固定100钻石
      if (profile.timeDiamonds >= reviveCost) {
        setProfile(prev => ({
          ...prev,
          timeDiamonds: prev.timeDiamonds - reviveCost,
          currentCash: Math.floor(INITIAL_CASH * 0.5) // 恢复50%初始本金
        }));
        // 重新挑战本关
        setPhase(GamePhase.LEVEL_BRIEFING);
      }
    } else if (result.status === 'FAILED') {
      // 业绩未达标：贿赂HR补齐差额
      const shortage = currentLevelTarget - endBalance;
      const reviveCost = 50; // 固定50钻石
      if (profile.timeDiamonds >= reviveCost) {
        setProfile(prev => ({
          ...prev,
          timeDiamonds: prev.timeDiamonds - reviveCost,
          currentCash: currentLevelTarget // 补齐到目标金额
        }));
        unlockNextLevel(scenario);
        setPhase(GamePhase.INTERMISSION_SHOP);
      }
    }
  };

  const handlePurchase = (type: 'equipment' | 'consumable', itemType: EquipmentType | ConsumableType) => {
    if (type === 'equipment') {
      const equipmentType = itemType as EquipmentType;
      const currentLevel = profile.equipment.find(e => e.type === equipmentType)?.level || 0;
      const price = EQUIPMENT_PRICES[equipmentType][currentLevel];
      
      if (profile.timeDiamonds >= price && currentLevel < 5) {
        setProfile(prev => {
          const existing = prev.equipment.find(e => e.type === equipmentType);
          return {
            ...prev,
            timeDiamonds: prev.timeDiamonds - price,
            equipment: existing
              ? prev.equipment.map(e => e.type === equipmentType ? { ...e, level: e.level + 1 } : e)
              : [...prev.equipment, { type: equipmentType, level: 1, maxLevel: 5 }]
          };
        });
      }
    } else {
      const consumableType = itemType as ConsumableType;
      const price = CONSUMABLE_PRICES[consumableType];
      
      if (profile.timeDiamonds >= price) {
        setProfile(prev => {
          const existing = prev.consumables.find(c => c.type === consumableType);
          return {
            ...prev,
            timeDiamonds: prev.timeDiamonds - price,
            consumables: existing
              ? prev.consumables.map(c => c.type === consumableType ? { ...c, count: c.count + 1 } : c)
              : [...prev.consumables, { type: consumableType, count: 1 }]
          };
        });
      }
    }
  };

  const handleUseConsumable = (type: ConsumableType) => {
    if (!player || player.usedConsumables.includes(type)) return;
    
    if (type === ConsumableType.TIME_CAPSULE) {
      // 时间胶囊：回退3秒（约10个数据点）
      setCurrentIndex(prev => Math.max(0, prev - 10));
      setCommentary(">>> 时间胶囊激活！K线回退3秒！");
    } else if (type === ConsumableType.INSIDER_INFO) {
      // 内幕消息：显示未来走势（这里只是提示，实际需要在前端显示）
      setCommentary(">>> 内幕消息：未来5秒走势已显示在图表上（虚线）");
    }
    
    setPlayer(prev => prev ? ({
      ...prev,
      usedConsumables: [...prev.usedConsumables, type]
    }) : null);
    
    // 消耗一个
    setProfile(prev => ({
      ...prev,
      consumables: prev.consumables.map(c => 
        c.type === type ? { ...c, count: Math.max(0, c.count - 1) } : c
      )
    }));
  };

  const handleAddMargin = () => {
    setMarginBuffer(prev => prev + 25);
    setCommentary(">>> 警告：收到外部保证金注入！暂时脱离死亡区！");
  };

  const handleUseHammer = () => {
    setIsShaking(true);
    setCommentary(">>> 扰动脉冲已发射：市场流动性正在崩塌！");
  };

  return (
    <div className={`h-screen w-screen relative bg-slate-950 flex flex-col items-center justify-center overflow-hidden ${isShaking ? 'shake' : ''}`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
      
      {phase === GamePhase.LOBBY && (
        <div className="z-20 text-center flex flex-col items-center">
          <div className="mb-8 w-32 h-32 border-4 border-cyan-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-6xl">🤖</span>
          </div>
          <h1 className="orbitron text-7xl font-black mb-4 glitch-text tracking-[0.2em] text-white">MARGIN CALL</h1>
          <p className="text-cyan-400 mb-4 tracking-[0.5em] orbitron text-xs">THE LAST STAND</p>
          <p className="text-slate-500 mb-12 tracking-[0.3em] orbitron text-xs">时空交易员 - 从1990到2025的金融生存</p>
          <div className="flex space-x-4">
            <button 
              onClick={() => setPhase(GamePhase.CAMPAIGN_MAP)}
              className="px-12 py-5 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all duration-300 font-black text-xl orbitron uppercase tracking-[0.3em] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)]"
            >
              开始征程
            </button>
            <button 
              onClick={() => setPhase(GamePhase.SHOP)}
              className="px-12 py-5 border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white transition-all duration-300 font-black text-xl orbitron uppercase tracking-[0.3em] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)]"
            >
              黑市商店
            </button>
          </div>
        </div>
      )}

      {phase === GamePhase.CAMPAIGN_MAP && (
        <CampaignMap
          profile={profile}
          onSelectLevel={(scenario) => {
            setScenario(scenario);
            // 计算目标金额
            const target = calculateLevelTarget(scenario, profile.currentCash);
            setCurrentLevelTarget(target);
            setPhase(GamePhase.LEVEL_BRIEFING);
          }}
          onBack={() => setPhase(GamePhase.LOBBY)}
        />
      )}

      {phase === GamePhase.LEVEL_BRIEFING && (
        <LevelBriefing
          scenario={scenario}
          currentCash={profile.currentCash}
          targetCash={currentLevelTarget}
          onStart={() => setPhase(GamePhase.BETTING)}
          onBack={() => setPhase(GamePhase.CAMPAIGN_MAP)}
        />
      )}

      {phase === GamePhase.SHOP && (
        <DarkPoolShop
          profile={profile}
          onPurchase={handlePurchase}
          onBack={() => setPhase(GamePhase.LOBBY)}
        />
      )}

      {phase === GamePhase.BETTING && (
        <BettingOverlay 
          onStart={startGame} 
          scenarios={SCENARIOS.filter(s => profile.unlockedLevels.includes(s.id))}
          leverageOptions={LEVERAGE_OPTIONS}
          onBack={() => setPhase(GamePhase.CAMPAIGN_MAP)}
          initialScenario={scenario}
        />
      )}

      {phase === GamePhase.TRADING && player && (
        <GameView 
          scenario={scenario}
          player={player}
          currentIndex={currentIndex}
          commentary={commentary}
          onJumpOut={handleJumpOut}
          onSafeExtract={handleSafeExtract}
          onAddMargin={handleAddMargin}
          onUseHammer={handleUseHammer}
          onUseConsumable={handleUseConsumable}
          marginBuffer={marginBuffer}
          equipment={profile.equipment}
          consumables={profile.consumables}
          currentCash={profile.currentCash}
          targetCash={currentLevelTarget}
        />
      )}

      {phase === GamePhase.RESULT && player && (
        <ResultOverlay 
          player={player} 
          scenario={scenario}
          timeDiamonds={profile.timeDiamonds}
          currentCash={profile.currentCash}
          targetCash={currentLevelTarget}
          finalBalance={finalBalance}
          onExtract={handleExtractDiamonds}
          onRevive={handleRevive}
          onContinue={() => setPhase(GamePhase.CAMPAIGN_MAP)}
          onRestart={() => {
            const target = calculateLevelTarget(scenario, profile.currentCash);
            setCurrentLevelTarget(target);
            setPhase(GamePhase.LEVEL_BRIEFING);
          }}
          onBack={() => setPhase(GamePhase.CAMPAIGN_MAP)}
        />
      )}

      {phase === GamePhase.INTERMISSION_SHOP && (
        <IntermissionShop
          currentCash={profile.currentCash}
          temporaryItems={temporaryItems}
          onPurchase={(type) => {
            const price = TEMPORARY_ITEM_PRICES[type];
            if (profile.currentCash >= price) {
              setProfile(prev => ({
                ...prev,
                currentCash: prev.currentCash - price
              }));
              setTemporaryItems(prev => {
                const existing = prev.find(i => i.type === type);
                if (existing) {
                  return prev.map(i => i.type === type ? { ...i, count: i.count + 1 } : i);
                }
                return [...prev, { type, count: 1 }];
              });
            }
          }}
          onContinue={() => {
            // 清空临时道具（它们会在下一关开始时生效）
            setTemporaryItems([]);
            setPhase(GamePhase.CAMPAIGN_MAP);
          }}
          onBack={() => setPhase(GamePhase.CAMPAIGN_MAP)}
        />
      )}

      <div className="absolute bottom-4 left-6 flex space-x-4">
        <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
            <span className="text-[10px] text-slate-500 orbitron">SERVER: QUANTUM_NYC_01</span>
        </div>
      </div>

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] text-slate-700 uppercase tracking-[0.4em] pointer-events-none text-center">
        HISTORY REPLAY SIMULATION | NO REAL FINANCIAL RISK | STAY VIGILANT
      </div>
    </div>
  );
};

export default App;
