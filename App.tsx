import React, { useState, useEffect, useRef } from 'react';
import { GamePhase, Side, PlayerState, Scenario, PlayerProfile, Chapter, EquipmentType, ConsumableType, Equipment, Consumable, TemporaryItemType } from './types';
import { SCENARIOS, LEVERAGE_OPTIONS, EQUIPMENT_PRICES, CONSUMABLE_PRICES, getReviveCost, INITIAL_CASH, TEMPORARY_ITEM_PRICES } from './constants';
import { calculateLevelResult, calculateNextLevelTarget } from './gameLogic';
import { calculateFailurePenalty, calculateLiquidationPenalty, calculateNextLevelCash } from './lossSystem';
import BettingOverlay from './components/BettingOverlay';
import GameView from './components/GameView';
import ResultOverlay from './components/ResultOverlay';
import CampaignMap from './components/CampaignMap';
import DarkPoolShop from './components/DarkPoolShop';
import LevelBriefing from './components/LevelBriefing';
import IntermissionShop from './components/IntermissionShop';
import MarginDialog from './components/MarginDialog';
import PhaseShiftDialog from './components/PhaseShiftDialog';
import QuantumGrapple from './components/QuantumGrapple';
import DiamondShop from './components/DiamondShop';
import { soundManager } from './utils/soundManager';
import { GoogleGenAI } from "@google/genai";
import { i18n, Language } from './utils/i18n';
import { getTotalDiamonds } from './utils/paymentConfig';
import { initiateStripeCheckout, verifyPaymentAndAddDiamonds } from './utils/paymentService';
import { getPlayerFromNeon, syncPlayerToNeon, pollDiamondUpdates } from './utils/neonService';

// 初始化玩家档案
const createInitialProfile = (): PlayerProfile => ({
  timeDiamonds: 0,
  currentCash: INITIAL_CASH, // 初始资金 $10,000
  currentChapter: Chapter.GOLDEN_AGE,
  currentLevel: 1,
  currentPhase: 1, // 从第一个阶段开始
  equipment: [],
  consumables: [],
  totalDiamondsEarned: 0,
  totalDeaths: 0
});

// 重置玩家数据到初始状态（死亡后重新开始）
const resetProfile = (): PlayerProfile => {
  return createInitialProfile();
};

// 获取当前可玩的关卡（基于线性进度）
const getCurrentScenario = (profile: PlayerProfile): Scenario | null => {
  return SCENARIOS.find(
    s => s.chapter === profile.currentChapter && 
         s.level === profile.currentLevel && 
         s.phase === profile.currentPhase
  ) || null;
};

const App: React.FC = () => {
  // 初始化语言状态
  const [language, setLanguage] = useState<Language>(() => {
    return i18n.getLanguage();
  });
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
      // 迁移旧存档：如果没有currentPhase字段，设置为1
      if (parsed.currentPhase === undefined) {
        parsed.currentPhase = 1;
      }
      // 移除旧的unlockedLevels字段（不再使用）
      delete parsed.unlockedLevels;
      
      return parsed;
    }
    return createInitialProfile();
  });
  const [scenario, setScenario] = useState<Scenario>(() => {
    // 基于当前进度获取关卡
    const current = getCurrentScenario(profile);
    // 确保找到第一个关卡
    return current || SCENARIOS.find(s => s.id === '1-1-p1') || SCENARIOS.find(s => s.chapter === Chapter.GOLDEN_AGE && s.level === 1 && s.phase === 1) || SCENARIOS[0];
  });
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [commentary, setCommentary] = useState(() => i18n.t('commentary.default'));
  const [isShaking, setIsShaking] = useState(false);
  const [marginBuffer, setMarginBuffer] = useState(0);
  const [hasStopLossProtection, setHasStopLossProtection] = useState(false); // 熔断保护器状态
  const [temporaryItems, setTemporaryItems] = useState<{ type: TemporaryItemType; count: number }[]>([]); // 临时道具
  const [showMarginDialog, setShowMarginDialog] = useState<'margin' | 'cut' | null>(null); // 显示补仓/砍仓对话框
  const [showPhaseShiftDialog, setShowPhaseShiftDialog] = useState(false); // 显示反手对话框（旧版）
  const [showQuantumGrapple, setShowQuantumGrapple] = useState(false); // 显示光速飞爪
  const [showDiamondShop, setShowDiamondShop] = useState(false); // 显示钻石商店
  const [currentBalance, setCurrentBalance] = useState(0); // 当前余额（用于对话框）
  const [currentLevelTarget, setCurrentLevelTarget] = useState(0); // 当前关卡目标金额
  const [finalBalance, setFinalBalance] = useState(0); // 关卡结束时的最终余额
  const [levelStartingCash, setLevelStartingCash] = useState(0); // 关卡开始时的起始本金（用于计算损失）
  const [levelResult, setLevelResult] = useState<{
    diamonds: number;
    nextTarget: number;
    growthRate: string;
    profit: number;
  } | null>(null); // 关卡结算结果

  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 保存档案到localStorage
  useEffect(() => {
    localStorage.setItem('timeTraderProfile', JSON.stringify(profile));
  }, [profile]);

  // 初始化音效系统（在用户首次交互后）
  useEffect(() => {
    const initSound = () => {
      // 尝试初始化 AudioContext（需要用户交互）
      soundManager.setEnabled(true);
    };
    // 在用户首次点击时初始化
    document.addEventListener('click', initSound, { once: true });
    document.addEventListener('touchstart', initSound, { once: true });
    return () => {
      document.removeEventListener('click', initSound);
      document.removeEventListener('touchstart', initSound);
    };
  }, []);

  // 同步语言状态（确保与 i18n 保持一致）
  useEffect(() => {
    const currentLang = i18n.getLanguage();
    setLanguage(currentLang);
  }, []);

  // 当进度更新时，同步更新当前关卡
  useEffect(() => {
    const current = getCurrentScenario(profile);
    if (current) {
      setScenario(current);
    } else {
      // 如果找不到，强制设置为第一个关卡
      const firstScenario = SCENARIOS.find(s => s.id === '1-1-p1') || 
                           SCENARIOS.find(s => s.chapter === Chapter.GOLDEN_AGE && s.level === 1 && s.phase === 1) || 
                           SCENARIOS[0];
      if (firstScenario) {
        setScenario(firstScenario);
      }
    }
  }, [profile.currentChapter, profile.currentLevel, profile.currentPhase]);

  // 计算关卡目标金额（使用动态难度系统）
  const calculateLevelTarget = (scenario: Scenario, currentCash: number, previousTarget?: number): number => {
    // 使用新的动态难度计算函数
    return calculateNextLevelTarget(currentCash, previousTarget || 0, scenario.targetMultiplier);
  };

  // 计算最终余额（基于收益率）
  const calculateFinalBalance = (currentCash: number, pnl: number): number => {
    return Math.floor(currentCash * (1 + pnl / 100));
  };

  const startGame = (selectedSide: Side, selectedLeverage: number, selectedScenario: Scenario) => {
    soundManager.playClick(); // 游戏开始音效
    setScenario(selectedScenario);
    const initialPrice = selectedScenario.data[0].price;
    
    // 记录关卡开始时的起始本金（如果还没有记录）
    if (levelStartingCash === 0) {
      setLevelStartingCash(profile.currentCash);
    }
    
    // 检查是否有熔断保护器
    const stopLossBot = profile.consumables.find(c => c.type === ConsumableType.STOP_LOSS_BOT);
    setHasStopLossProtection(stopLossBot ? stopLossBot.count > 0 : false);
    
    // 应用临时道具效果
    const activeTemporaryItems: TemporaryItemType[] = [];
    temporaryItems.forEach(item => {
      for (let i = 0; i < item.count; i++) {
        activeTemporaryItems.push(item.type);
      }
    });
    
    // 幸运草效果：在游戏开始时会显示前10秒的走势预览（在 GameView 中处理）
    
    // 时间冻结液效果：增加交易时间（在游戏循环中处理）
    const hasTimeFreeze = activeTemporaryItems.includes(TemporaryItemType.TIME_FREEZE);
    const timeFreezeCount = activeTemporaryItems.filter(t => t === TemporaryItemType.TIME_FREEZE).length;
    
    setPlayer({
      id: 'local-user',
      name: i18n.t('gameView.playerName'),
      leverage: selectedLeverage,
      side: selectedSide,
      entryPrice: initialPrice,
      currentPnl: 0,
      currentYield: 0,
      isDead: false,
      isExited: false,
      highPnl: 0,
      usedConsumables: [],
      marginAdded: 0, // 初始补仓金额为0
      positionSize: 100, // 初始仓位100%（满仓）
      temporaryItems: activeTemporaryItems // 保存临时道具到玩家状态
    });
    setCurrentIndex(0);
    setMarginBuffer(0);
    
    // 清空临时道具（已应用到本局）
    setTemporaryItems([]);
    
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
      // 时间冻结液效果：每使用一个增加10秒（约33个数据点，每个300ms）
      const timeFreezeCount = player.temporaryItems?.filter(t => t === TemporaryItemType.TIME_FREEZE).length || 0;
      const extraDataPoints = timeFreezeCount * 33; // 每个时间冻结液增加33个数据点（约10秒）
      const maxDataLength = scenario.data.length + extraDataPoints;
      
      gameLoopRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const next = prev + 1;
          // 如果有时间冻结液，允许超出原始数据长度（重复最后一个价格）
          if (next >= maxDataLength) {
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
                exitPrice: scenario.data[scenario.data.length - 1]?.price || prev.entryPrice,
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
  }, [phase, player, scenario, profile.currentCash]);

  // 止损机器人功能：按空格键锁定当前PnL（紧急止损）
  useEffect(() => {
    if (!player || phase !== GamePhase.TRADING || player.isDead || player.isExited) return;
    
    const hasDynamite = player.temporaryItems?.includes(TemporaryItemType.DYNAMITE);
    if (!hasDynamite || player.stopLossActivated) return; // 已激活则不再响应
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !player?.isDead && !player?.isExited && !player?.stopLossActivated) {
        e.preventDefault();
        
        // 紧急止损：锁定当前PnL，防止继续亏损
        // 只能在亏损超过-30%时使用，且只能使用一次
        if (player.currentPnl < -30) {
          soundManager.playWarning();
          setCommentary(i18n.t('commentary.stopLossActivated', { pnl: player.currentPnl.toFixed(2) }));
          
          // 移除一个止损机器人
          setPlayer(prev => {
            if (!prev) return null;
            const newItems = [...(prev.temporaryItems || [])];
            const dynamiteIndex = newItems.indexOf(TemporaryItemType.DYNAMITE);
            if (dynamiteIndex > -1) {
              newItems.splice(dynamiteIndex, 1);
            }
            
            return {
              ...prev,
              stopLossActivated: true, // 标记已激活
              stopLossLockedPnl: prev.currentPnl, // 锁定当前PnL
              temporaryItems: newItems
            };
          });
        } else {
          // 亏损不够，提示用户
          soundManager.playClick();
          setCommentary(i18n.t('commentary.stopLossNotReady', { threshold: -30 }));
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [player, phase]);

  useEffect(() => {
    if (!player || phase !== GamePhase.TRADING) return;

    // 时间冻结液效果：如果超出原始数据长度，使用最后一个价格
    const actualIndex = Math.min(currentIndex, scenario.data.length - 1);
    const currentPrice = scenario.data[actualIndex].price;
    const prevPrice = actualIndex > 0 ? scenario.data[actualIndex - 1].price : currentPrice;
    const priceChangePct = ((currentPrice - player.entryPrice) / player.entryPrice) * 100;
    const stepChange = Math.abs((currentPrice - prevPrice) / prevPrice) * 100;

    if (stepChange > 2) {
      setIsShaking(true);
      soundManager.playMarketShock(); // 市场波动音效
      setTimeout(() => setIsShaking(false), 500);
    }

    // 计算基础 PnL（考虑仓位大小和杠杆）
    const basePnl = player.side === Side.LONG ? priceChangePct : -priceChangePct;
    const effectiveLeverage = player.leverage * (player.positionSize / 100); // 砍仓后杠杆降低
    const actualPnl = basePnl * effectiveLeverage;
    
    // 计算补仓效果：补仓金额相当于增加了保证金，可以抵消部分亏损
    // 补仓效果 = 补仓金额 / 总本金 * 50（最多抵消50%的亏损）
    const totalCapital = profile.currentCash + player.marginAdded;
    const marginEffect = player.marginAdded > 0 && totalCapital > 0
      ? Math.min(50, (player.marginAdded / totalCapital) * 100) // 补仓可以抵消最多50%的亏损
      : 0;

    setPlayer(prev => {
      if (!prev || prev.isDead || prev.isExited) return prev;
      
      // 补仓效果：如果亏损，补仓可以抵消部分亏损
      const adjustedPnl = actualPnl + marginEffect;
      let isDead = adjustedPnl <= -100;
      
      // 更新当前余额（用于对话框显示）
      const balance = calculateFinalBalance(profile.currentCash - prev.marginAdded, adjustedPnl);
      setCurrentBalance(balance);
      
      // 熔断保护器效果
      if (isDead && hasStopLossProtection && !prev.usedConsumables.includes(ConsumableType.STOP_LOSS_BOT)) {
        isDead = false;
        setHasStopLossProtection(false);
        soundManager.playWarning(); // 熔断保护器激活音效
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
        soundManager.playLiquidation(); // 爆仓音效
        const endBalance = calculateFinalBalance(profile.currentCash, -100);
        setFinalBalance(endBalance);
        setPhase(GamePhase.RESULT);
        setProfile(prevProfile => ({ ...prevProfile, totalDeaths: prevProfile.totalDeaths + 1 }));
        return { ...prev, currentPnl: -100, currentYield: -100, isDead: true, highPnl };
      }

      // 危险警告：当 PnL 接近 -90% 时播放警告音效（只播放一次）
      if (adjustedPnl <= -90 && adjustedPnl > -95 && prev.currentPnl > -90) {
        soundManager.playDanger();
      }
      
      // 危险警告：当 PnL 接近 -90% 时播放警告音效
      if (adjustedPnl <= -90 && adjustedPnl > -95 && prev.currentPnl > -90) {
        soundManager.playDanger();
      }

      // 如果止损已激活，使用锁定的PnL
      const finalPnl = prev.stopLossActivated && prev.stopLossLockedPnl !== undefined 
        ? prev.stopLossLockedPnl 
        : actualPnl;
      
      return { ...prev, currentPnl: finalPnl, currentYield: finalPnl, highPnl };
    });

    if (currentIndex % 20 === 0) {
      updateCommentary(currentPrice, actualPnl);
    }
  }, [currentIndex, scenario, phase, marginBuffer, hasStopLossProtection]);

  // 当进入RESULT阶段且玩家完成关卡时，自动推进到下一关
  useEffect(() => {
    if (phase === GamePhase.RESULT && player && !player.isDead && player.isExited) {
      // 注意：这里不直接推进，而是在结算成功后才推进（在handleExtractDiamonds中）
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

  // 推进到下一关卡（线性进度系统）
  const advanceToNextLevel = (currentScenario: Scenario) => {
    // 如果当前phase不是最后一个（4），推进到下一个phase
    if (currentScenario.phase < 4) {
      const nextPhase = currentScenario.phase + 1;
      setProfile(prev => ({
        ...prev,
        currentPhase: nextPhase
      }));
      return;
    }
    
    // 如果当前phase是最后一个（4），推进到下一个level的第一个phase
    if (currentScenario.phase === 4) {
    const nextLevel = currentScenario.level + 1;
      const nextScenario = SCENARIOS.find(
        s => s.chapter === currentScenario.chapter && 
             s.level === nextLevel && 
             s.phase === 1
      );
    
    if (nextScenario) {
        setProfile(prev => ({
          ...prev,
          currentLevel: nextLevel,
          currentPhase: 1
        }));
        return;
      }
      
      // 如果当前章节没有下一个level，推进到下一章节的第一个level的第一个phase
      const chapters = Object.values(Chapter);
      const currentIndex = chapters.indexOf(currentScenario.chapter);
      if (currentIndex < chapters.length - 1) {
        const nextChapter = chapters[currentIndex + 1];
        setProfile(prev => ({
              ...prev,
              currentChapter: nextChapter,
              currentLevel: 1,
          currentPhase: 1
        }));
      }
    }
  };

  const handleSafeExtract = () => {
    if (!player || player.isDead || player.isExited) return;
    soundManager.playSuccess(); // 安全撤离音效
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

  // 计算结算结果（使用新的钻石计算系统）
  const calculateResult = (endBalance: number, targetBalance: number) => {
    if (endBalance <= 0) return { status: 'LIQUIDATED' as const }; // 爆仓
    if (endBalance < targetBalance) return { status: 'FAILED' as const }; // 未达标

    // 成功通关 - 使用新的钻石计算系统
    const result = calculateLevelResult(endBalance, targetBalance);
    
    return {
      status: 'SUCCESS' as const,
      nextCash: endBalance, // 本金带入下一关（现金继承）
      diamondGain: result.diamonds, // 使用阶梯计算的钻石
      nextTarget: result.nextTarget, // 下一关目标
      growthRate: result.growthRate, // 增长率
      profit: result.profit // 超额利润
    };
  };

  const handleExtractDiamonds = () => {
    if (!player) return;
    
    const finalPnl = player.isDead ? -100 : (player.exitPnl || player.currentPnl);
    const startingCash = levelStartingCash || profile.currentCash; // 使用关卡开始时的起始本金
    const endBalance = calculateFinalBalance(startingCash, finalPnl);
    setFinalBalance(endBalance);
    
    const result = calculateResult(endBalance, currentLevelTarget);
    
    if (result.status === 'LIQUIDATED') {
      soundManager.playLiquidation(); // 爆仓音效
      // 爆仓归零 - 应用爆仓惩罚
      const liquidationPenalty = calculateLiquidationPenalty(startingCash, i18n.getLanguage());
      const baseReviveCost = 100;
      const dynamicCost = Math.floor(startingCash / 1000);
      const reviveCost = Math.min(500, baseReviveCost + dynamicCost);
      const diamondsAfterPenalty = Math.max(0, profile.timeDiamonds - liquidationPenalty.diamondPenalty);
      
      // 检查是否可以复活
      if (diamondsAfterPenalty >= reviveCost) {
        // 可以复活，让玩家选择
        setProfile(prev => {
          const updated = {
        ...prev,
            currentCash: liquidationPenalty.remainingCash, // 现金归零
            timeDiamonds: Math.max(0, prev.timeDiamonds - liquidationPenalty.diamondPenalty), // 扣减钻石
        totalDeaths: prev.totalDeaths + 1
          };
          localStorage.setItem('timeTraderProfile', JSON.stringify(updated));
          return updated;
        });
      } else {
        // 无法复活：重置所有数据，重新开始
        const reset = resetProfile();
        // 立即清除并保存新的初始数据到 localStorage
        localStorage.setItem('timeTraderProfile', JSON.stringify(reset));
        setProfile(reset);
        // 更新当前关卡到第一关
        const firstScenario = getCurrentScenario(reset) || 
                             SCENARIOS.find(s => s.id === '1-1-p1') || 
                             SCENARIOS.find(s => s.chapter === Chapter.GOLDEN_AGE && s.level === 1 && s.phase === 1) || 
                             SCENARIOS[0];
        if (firstScenario) {
          setScenario(firstScenario);
        }
        // 立即返回地图
        setPhase(GamePhase.CAMPAIGN_MAP);
        return; // 提前返回，避免执行后面的代码
      }
    } else if (result.status === 'FAILED') {
      soundManager.playFailure(); // 失败音效
      // 业绩未达标 - 应用损失惩罚
      const failurePenalty = calculateFailurePenalty(endBalance, currentLevelTarget, startingCash, i18n.getLanguage());
      const shortage = currentLevelTarget - endBalance;
      const baseReviveCost = 50;
      const dynamicCost = Math.floor(shortage / 5000);
      const reviveCost = Math.min(200, baseReviveCost + dynamicCost);
      const diamondsAfterPenalty = Math.max(0, profile.timeDiamonds - failurePenalty.diamondPenalty);
      
      // 检查是否可以复活
      if (diamondsAfterPenalty >= reviveCost) {
        // 可以复活，让玩家选择
        setProfile(prev => {
          const updated = {
            ...prev,
            currentCash: failurePenalty.remainingCash, // 扣减后的现金
            timeDiamonds: Math.max(0, prev.timeDiamonds - failurePenalty.diamondPenalty), // 扣减钻石
          };
          localStorage.setItem('timeTraderProfile', JSON.stringify(updated));
          return updated;
        });
    } else {
        // 无法复活：重置所有数据，重新开始
        const reset = resetProfile();
        // 立即清除并保存新的初始数据到 localStorage
        localStorage.setItem('timeTraderProfile', JSON.stringify(reset));
        setProfile(reset);
        // 更新当前关卡到第一关
        const firstScenario = getCurrentScenario(reset) || 
                             SCENARIOS.find(s => s.id === '1-1-p1') || 
                             SCENARIOS.find(s => s.chapter === Chapter.GOLDEN_AGE && s.level === 1 && s.phase === 1) || 
                             SCENARIOS[0];
        if (firstScenario) {
          setScenario(firstScenario);
        }
        // 立即返回地图
        setPhase(GamePhase.CAMPAIGN_MAP);
        return; // 提前返回，避免执行后面的代码
      }
    } else {
      // 成功通关 - 确保现金和钻石都正确继承
      soundManager.playSuccess(); // 成功音效
      const diamondMiner = profile.equipment.find(e => e.type === EquipmentType.DIAMOND_MINER);
      const bonus = diamondMiner ? diamondMiner.level * 0.1 : 0;
      const finalDiamonds = Math.floor(result.diamondGain * (1 + bonus));
      
      // 如果获得钻石，播放钻石音效
      if (finalDiamonds > 0) {
        setTimeout(() => soundManager.playDiamondEarned(), 300);
      }
      
      // 使用函数式更新确保状态正确同步
      setProfile(prev => {
        const updated = {
        ...prev,
          currentCash: result.nextCash, // 现金继承：使用最终余额作为下一关本金
          timeDiamonds: prev.timeDiamonds + finalDiamonds, // 钻石继承：累加获得的钻石
        totalDiamondsEarned: prev.totalDiamondsEarned + finalDiamonds
        };
        // 立即保存到 localStorage（虽然 useEffect 也会保存，但这里确保同步）
        localStorage.setItem('timeTraderProfile', JSON.stringify(updated));
        return updated;
      });
      
      // 成功通关后推进到下一关
      advanceToNextLevel(scenario);
    }
    
    // 进入局间商店（如果成功）或返回地图
    if (result.status === 'SUCCESS') {
      setPhase(GamePhase.INTERMISSION_SHOP);
    } else {
      setPhase(GamePhase.CAMPAIGN_MAP);
    }
  };

  const handleRevive = () => {
    if (!player) {
      console.error('handleRevive: player is null');
      return;
    }
    console.log('handleRevive called', { player, levelStartingCash, currentLevelTarget });
    
    // 判断是爆仓还是业绩未达标
    const finalPnl = player.isDead ? -100 : (player.exitPnl || player.currentPnl);
    const startingCash = levelStartingCash || profile.currentCash; // 使用关卡开始时的起始本金
    const endBalance = calculateFinalBalance(startingCash, finalPnl);
    const result = calculateResult(endBalance, currentLevelTarget);
    
    if (result.status === 'LIQUIDATED') {
      // 爆仓归零：申请紧急救助金
      // 成本：根据起始本金动态计算，最低100💎，最高500💎
      const baseReviveCost = 100;
      const dynamicCost = Math.floor(startingCash / 1000); // 每$1000本金增加1💎成本
      const reviveCost = Math.min(500, baseReviveCost + dynamicCost);
      
      // 注意：这里应该使用惩罚后的钻石数量
      const currentDiamonds = profile.timeDiamonds;
      const liquidationPenalty = calculateLiquidationPenalty(startingCash, i18n.getLanguage());
      const diamondsAfterPenalty = Math.max(0, currentDiamonds - liquidationPenalty.diamondPenalty);
      
      if (diamondsAfterPenalty >= reviveCost) {
        soundManager.playRevive(); // 复活音效
        setProfile(prev => {
          // 先应用惩罚，再扣除复活成本
          const afterPenalty = Math.max(0, prev.timeDiamonds - liquidationPenalty.diamondPenalty);
          return {
          ...prev,
            timeDiamonds: afterPenalty - reviveCost,
          currentCash: Math.floor(INITIAL_CASH * 0.5) // 恢复50%初始本金
          };
        });
        // 重新挑战本关
        setPhase(GamePhase.LEVEL_BRIEFING);
      } else {
        // 无法复活：重置所有数据，重新开始
        const reset = resetProfile();
        // 立即清除并保存新的初始数据到 localStorage
        localStorage.setItem('timeTraderProfile', JSON.stringify(reset));
        setProfile(reset);
        // 更新当前关卡到第一关
        const firstScenario = getCurrentScenario(reset);
        if (firstScenario) {
          setScenario(firstScenario);
        }
        setPhase(GamePhase.CAMPAIGN_MAP);
      }
    } else if (result.status === 'FAILED') {
      // 业绩未达标：贿赂HR补齐差额
      const shortage = currentLevelTarget - endBalance;
      // 成本：根据差额动态计算，最低50💎，最高200💎
      const baseReviveCost = 50;
      const dynamicCost = Math.floor(shortage / 5000); // 每$5000差额增加1💎成本
      const reviveCost = Math.min(200, baseReviveCost + dynamicCost);
      
      // 注意：这里应该使用惩罚后的钻石数量
      const currentDiamonds = profile.timeDiamonds;
      const failurePenalty = calculateFailurePenalty(endBalance, currentLevelTarget, startingCash, i18n.getLanguage());
      const diamondsAfterPenalty = Math.max(0, currentDiamonds - failurePenalty.diamondPenalty);
      
      if (diamondsAfterPenalty >= reviveCost) {
        soundManager.playRevive(); // 复活音效
        setProfile(prev => {
          // 先应用惩罚，再扣除复活成本
          const afterPenalty = Math.max(0, prev.timeDiamonds - failurePenalty.diamondPenalty);
          return {
          ...prev,
            timeDiamonds: afterPenalty - reviveCost,
            currentCash: currentLevelTarget // 补齐到目标金额（避免惩罚）
          };
        });
        // 贿赂成功后推进到下一关
        advanceToNextLevel(scenario);
        setPhase(GamePhase.INTERMISSION_SHOP);
      } else {
        // 无法复活：重置所有数据，重新开始
        const reset = resetProfile();
        // 立即清除并保存新的初始数据到 localStorage
        localStorage.setItem('timeTraderProfile', JSON.stringify(reset));
        setProfile(reset);
        // 更新当前关卡到第一关
        const firstScenario = getCurrentScenario(reset);
        if (firstScenario) {
          setScenario(firstScenario);
        }
        setPhase(GamePhase.CAMPAIGN_MAP);
      }
    }
  };

  // 处理钻石购买
  const handlePurchaseDiamonds = async (packageId: string) => {
    try {
      console.log('Initiating purchase for package:', packageId);
      
      // 检查是否使用真实支付
      const useRealPayment = import.meta.env.VITE_USE_REAL_PAYMENT === 'true' || !import.meta.env.DEV;
      
      // 如果是开发环境且未启用真实支付，直接添加钻石（模拟支付成功）
      if (import.meta.env.DEV && !useRealPayment) {
        const diamondsToAdd = getTotalDiamonds(packageId);
        setProfile(prev => ({
          ...prev,
          timeDiamonds: prev.timeDiamonds + diamondsToAdd
        }));
        soundManager.playPurchase();
        soundManager.playDiamondEarned();
        setShowDiamondShop(false);
        alert(`Successfully purchased ${diamondsToAdd} diamonds! (Development mode)`);
      } else {
        // 使用真实 Stripe Checkout
        const userId = localStorage.getItem('userId') || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (!localStorage.getItem('userId')) {
          localStorage.setItem('userId', userId);
        }
        const currentDiamonds = profile.timeDiamonds;
        
        // 启动支付流程
        await initiateStripeCheckout(packageId);
        
        // 关闭钻石商店
        setShowDiamondShop(false);
        
        // 显示提示信息
        alert('Payment window opened. Please complete the payment. The game will automatically update when payment is successful.');
        
        // 开始轮询检查钻石更新（每2秒检查一次，最多30次，共60秒）
        pollDiamondUpdates(
          userId,
          currentDiamonds,
          (newDiamonds: number) => {
            console.log('✅ Diamonds updated from database:', newDiamonds);
            setProfile(prev => {
              const updated = {
                ...prev,
                timeDiamonds: newDiamonds
              };
              localStorage.setItem('timeTraderProfile', JSON.stringify(updated));
              return updated;
            });
            soundManager.playPurchase();
            soundManager.playDiamondEarned();
            alert(`Payment successful! Added ${newDiamonds - currentDiamonds} diamonds to your account. Total: ${newDiamonds}`);
          },
          30, // 最多轮询30次
          2000 // 每2秒检查一次
        );
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert(i18n.t('diamondShop.purchaseError'));
    }
  };

  // 处理支付成功回调（从 Stripe 重定向回来）
  useEffect(() => {
    // 首先尝试从当前窗口读取参数（如果游戏在顶层窗口）
    const urlParams = new URLSearchParams(window.location.search);
    let paymentStatus = urlParams.get('payment');
    let sessionId = urlParams.get('session_id');
    let packageId = urlParams.get('package_id');

    // 如果当前窗口没有参数，尝试从顶层窗口读取（如果允许）
    if (!paymentStatus && window.top && window.top !== window.self) {
      try {
        const topUrlParams = new URLSearchParams(window.top.location.search);
        paymentStatus = topUrlParams.get('payment');
        sessionId = topUrlParams.get('session_id');
        packageId = topUrlParams.get('package_id');
        console.log('📋 Found payment params in top window:', { paymentStatus, sessionId, packageId });
      } catch (e) {
        console.log('⚠️ Cannot access top window URL (cross-origin):', e);
        // 如果无法访问顶层窗口，监听来自顶层窗口的消息
        console.log('👂 Will listen for payment params from top window via postMessage');
      }
    }

    console.log('Payment callback check:', { paymentStatus, sessionId, packageId, currentUrl: window.location.href, isTopWindow: window.top === window.self });

    if (paymentStatus === 'success' && sessionId && packageId) {
      console.log('✅ Payment success detected:', { sessionId, packageId });
      // 验证支付并添加钻石
      verifyPaymentAndAddDiamonds(sessionId, packageId)
        .then(diamonds => {
          console.log('✅ Payment verified, adding diamonds:', diamonds);
          
          // 从 localStorage 读取最新数据（确保使用最新值）
          const saved = localStorage.getItem('timeTraderProfile');
          let currentProfile = profile;
          if (saved) {
            try {
              currentProfile = JSON.parse(saved);
            } catch (e) {
              console.error('Failed to parse saved profile:', e);
            }
          }
          
          const newDiamonds = currentProfile.timeDiamonds + diamonds;
          const updated = {
            ...currentProfile,
            timeDiamonds: newDiamonds
          };
          
          // 立即保存到 localStorage（确保持久化）
          localStorage.setItem('timeTraderProfile', JSON.stringify(updated));
          console.log('✅ Profile updated and saved to localStorage:', updated);
          console.log('✅ Current timeDiamonds:', newDiamonds);
          
          // 更新状态
          setProfile(updated);
          
          soundManager.playPurchase();
          soundManager.playDiamondEarned();
          
          // 清除 URL 参数
          window.history.replaceState({}, '', window.location.pathname);
          
          // 如果是在新窗口，尝试通知原窗口并关闭
          try {
            if (window.opener && !window.opener.closed) {
              console.log('📤 Sending payment success message to opener window...');
              // 通知原窗口支付成功
              window.opener.postMessage({
                type: 'PAYMENT_SUCCESS',
                diamonds: diamonds,
                totalDiamonds: newDiamonds,
                sessionId: sessionId
              }, '*');
              console.log('✅ Message sent to opener window');
              // 延迟关闭窗口，给用户看到成功消息的时间
              setTimeout(() => {
                try {
                  window.close();
                } catch (e) {
                  console.log('Cannot close window (may be blocked by browser):', e);
                }
              }, 2000);
            } else {
              console.log('⚠️ No opener window found or opener is closed');
            }
          } catch (e) {
            console.error('❌ Cannot communicate with opener window:', e);
          }
          
          alert(`Payment successful! Added ${diamonds} diamonds to your account. Total: ${newDiamonds}`);
        })
        .catch(error => {
          console.error('❌ Payment verification failed:', error);
          alert('Payment verification failed. Please contact support with session ID: ' + sessionId);
        });
    } else if (paymentStatus === 'cancelled') {
      // 用户取消了支付
      console.log('Payment cancelled by user');
      window.history.replaceState({}, '', window.location.pathname);
      // 尝试关闭窗口
      try {
        if (window.opener && !window.opener.closed) {
          setTimeout(() => window.close(), 1000);
        }
      } catch (e) {
        // 忽略错误
      }
    }
  }, []); // 只在组件挂载时执行一次

  // 监听来自支付窗口或顶层窗口的消息
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      console.log('📨 Received message:', event.data, 'from origin:', event.origin);
      
      // 处理来自顶层窗口的支付参数（当游戏在 iframe 中时）
      if (event.data && event.data.type === 'PAYMENT_PARAMS') {
        const { paymentStatus, sessionId, packageId } = event.data;
        console.log('📋 Received payment params from top window:', { paymentStatus, sessionId, packageId });
        
        if (paymentStatus === 'success' && sessionId && packageId) {
          // 处理支付成功
          handlePaymentSuccess(sessionId, packageId);
        }
        return;
      }
      
      // 验证消息来源（可选，但建议在生产环境中验证）
      if (event.data && event.data.type === 'PAYMENT_SUCCESS') {
        console.log('✅ Received payment success message from payment window:', event.data);
        const { diamonds, totalDiamonds } = event.data;
        
        // 从 localStorage 读取最新数据
        const saved = localStorage.getItem('timeTraderProfile');
        if (saved) {
          try {
            const currentProfile = JSON.parse(saved);
            const updated = {
              ...currentProfile,
              timeDiamonds: totalDiamonds || (currentProfile.timeDiamonds + diamonds)
            };
            localStorage.setItem('timeTraderProfile', JSON.stringify(updated));
            console.log('✅ Updating profile state from message:', updated);
            setProfile(updated);
            console.log('✅ Profile updated from payment window message:', updated);
            soundManager.playPurchase();
            soundManager.playDiamondEarned();
            alert(`Payment successful! Added ${diamonds} diamonds to your account. Total: ${updated.timeDiamonds}`);
          } catch (e) {
            console.error('❌ Failed to update profile from message:', e);
          }
        } else {
          console.error('❌ No saved profile found in localStorage');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    console.log('👂 Listening for payment messages...');
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 添加定期检查 localStorage 的机制（作为备用方案）
  useEffect(() => {
    // 每5秒检查一次 localStorage 是否有更新（用于支付回调）
    const checkInterval = setInterval(() => {
      const saved = localStorage.getItem('timeTraderProfile');
      if (saved) {
        try {
          const savedProfile = JSON.parse(saved);
          // 如果 localStorage 中的钻石数量与当前状态不同，更新状态
          if (savedProfile.timeDiamonds !== profile.timeDiamonds) {
            console.log('🔄 Detected diamond change in localStorage, updating state:', {
              current: profile.timeDiamonds,
              saved: savedProfile.timeDiamonds
            });
            setProfile(savedProfile);
          }
        } catch (e) {
          console.error('Failed to check localStorage:', e);
        }
      }
    }, 5000); // 每5秒检查一次

    return () => clearInterval(checkInterval);
  }, [profile.timeDiamonds]);

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
    
    soundManager.playClick(); // 使用消耗品音效
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
    if (!player) return;
    // 显示补仓对话框
    const balance = calculateFinalBalance(profile.currentCash - player.marginAdded, player.currentPnl);
    setCurrentBalance(balance);
    setShowMarginDialog('margin');
  };

  const handleUseHammer = () => {
    if (!player) return;
    // 显示砍仓对话框
    const balance = calculateFinalBalance(profile.currentCash - player.marginAdded, player.currentPnl);
    setCurrentBalance(balance);
    setShowMarginDialog('cut');
  };

  const handleMarginConfirm = (amount: number) => {
    if (!player) {
      setShowMarginDialog(null);
      return;
    }
    
    let success = false;
    
    if (showMarginDialog === 'margin') {
      // 补仓：从现金中扣除，增加保证金
      const availableCash = profile.currentCash - player.marginAdded;
      if (amount > 0 && amount <= availableCash) {
        soundManager.playMarginAdd(); // 补仓音效
        setProfile(prev => ({
          ...prev,
          currentCash: prev.currentCash - amount
        }));
        setPlayer(prev => prev ? {
          ...prev,
          marginAdded: (prev.marginAdded || 0) + amount
        } : null);
        setCommentary(`>>> 补仓 $${amount.toLocaleString()}！保证金增加，爆仓风险降低！`);
        success = true;
      } else {
        // 验证失败，不关闭对话框
        return;
      }
    } else if (showMarginDialog === 'cut') {
      // 砍仓：减少仓位大小
      if (amount > 0 && amount <= 100) {
        soundManager.playPositionCut(); // 砍仓音效
        setPlayer(prev => prev ? {
          ...prev,
          positionSize: Math.max(10, (prev.positionSize || 100) - amount) // 最少保留10%仓位
        } : null);
        setCommentary(`>>> 砍仓 ${amount}%！仓位减少，杠杆影响降低！`);
        success = true;
      } else {
        // 验证失败，不关闭对话框
        return;
      }
    }
    
    // 只有成功时才关闭对话框
    if (success) {
      setShowMarginDialog(null);
    }
  };

  const handleMarginCancel = () => {
    setShowMarginDialog(null);
  };

  // 计算市场波动率（基于最近的价格变化）
  const calculateVolatility = (): number => {
    if (!player || currentIndex < 5) return 0.1; // 默认低波动
    
    const recentPrices = scenario.data.slice(Math.max(0, currentIndex - 10), currentIndex + 1);
    if (recentPrices.length < 2) return 0.1;
    
    // 计算价格变化的标准差
    const changes = [];
    for (let i = 1; i < recentPrices.length; i++) {
      const change = Math.abs((recentPrices[i].price - recentPrices[i - 1].price) / recentPrices[i - 1].price);
      changes.push(change);
    }
    
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    const variance = changes.reduce((sum, change) => sum + Math.pow(change - avgChange, 2), 0) / changes.length;
    const stdDev = Math.sqrt(variance);
    
    // 归一化到 0-1 范围（波动率通常在 0.01-0.1 之间，我们放大到 0-1）
    const volatility = Math.min(1, stdDev * 100);
    return volatility;
  };

  // 计算基础手续费（基于当前现金和杠杆）
  const calculateBaseFee = (): number => {
    if (!player) return 1000;
    // 基础手续费 = 当前现金的 1% * 杠杆倍数
    const base = Math.floor(profile.currentCash * 0.01);
    const leverageMultiplier = 1 + (player.leverage - 1) * 0.1; // 杠杆越高，手续费越高
    return Math.floor(base * leverageMultiplier);
  };

  // 处理反手
  const handlePhaseShift = (newSide: Side, result: 'PERFECT' | 'NORMAL' | 'FAIL') => {
    if (!player) return;

    const baseFee = calculateBaseFee();
    let fee = 0;

    switch (result) {
      case 'PERFECT':
        fee = Math.floor(baseFee * 0.5); // 50% 手续费
        soundManager.playSuccess();
        setCommentary(i18n.t('commentary.phaseShiftPerfectOld'));
          break;
        case 'NORMAL':
          fee = baseFee; // 标准手续费
          soundManager.playClick();
          setCommentary(i18n.t('commentary.phaseShiftNormal', { fee: baseFee.toLocaleString() }));
          break;
        case 'FAIL':
          fee = baseFee * 3; // 3倍手续费
          soundManager.playFailure();
          setCommentary(i18n.t('commentary.phaseShiftFail', { fee: fee.toLocaleString() }));
        // 失败时不切换方向
        setProfile(prev => ({
          ...prev,
          currentCash: Math.max(0, prev.currentCash - fee)
        }));
        setShowPhaseShiftDialog(false);
        return;
    }

    // 扣除手续费并切换方向
    if (profile.currentCash >= fee) {
      setProfile(prev => ({
        ...prev,
        currentCash: prev.currentCash - fee
      }));
      
      // 切换方向，重置入场价格
      const currentPrice = scenario.data[currentIndex].price;
      setPlayer(prev => prev ? {
        ...prev,
        side: newSide,
        entryPrice: currentPrice,
        currentPnl: 0, // 重置PnL
        currentYield: 0
      } : null);
      
      setShowPhaseShiftDialog(false);
    } else {
      alert(`现金不足！需要 $${fee.toLocaleString()}，当前只有 $${profile.currentCash.toLocaleString()}`);
      setShowPhaseShiftDialog(false);
    }
  };

  // 处理反手（光速飞爪版本）
  const handleQuantumGrapple = (newSide: Side, fee: number, result: 'PERFECT' | 'NORMAL' | 'FAIL') => {
    if (!player) return;

    // 计算转换前的实际余额（考虑当前的PnL和补仓）
    const currentBalance = calculateFinalBalance(profile.currentCash - player.marginAdded, player.currentPnl);
    const balanceAfterMargin = currentBalance + player.marginAdded; // 加上补仓金额得到实际总余额
    
    // 检查是否有足够余额支付手续费
    if (balanceAfterMargin >= fee) {
      // 计算转换后的新本金：实际余额 - 手续费
      const newCash = Math.max(0, balanceAfterMargin - fee);
      
      // 更新本金为转换后的余额（从新本金开始计算）
      setProfile(prev => ({
        ...prev,
        currentCash: newCash
      }));
      
      // 切换方向，重置入场价格和PnL
      const currentPrice = scenario.data[currentIndex].price;
      setPlayer(prev => prev ? {
        ...prev,
        side: newSide,
        entryPrice: currentPrice,
        currentPnl: 0, // 重置PnL，从0开始计算
        currentYield: 0,
        marginAdded: 0, // 重置补仓金额（因为本金已经更新为实际余额）
        positionSize: 100 // 重置仓位为100%
      } : null);
      
      // 设置反馈消息
      switch (result) {
        case 'PERFECT':
          setCommentary(i18n.t('commentary.phaseShiftPerfect'));
          break;
        case 'NORMAL':
          setCommentary(i18n.t('commentary.phaseShiftNormal', { fee: fee.toLocaleString() }));
          break;
        case 'FAIL':
          setCommentary(i18n.t('commentary.phaseShiftFail', { fee: fee.toLocaleString() }));
          break;
      }
      
      setShowQuantumGrapple(false);
    } else {
      alert(i18n.t('commentary.insufficientCash', { fee: fee.toLocaleString(), current: Math.floor(balanceAfterMargin).toLocaleString() }));
      setShowQuantumGrapple(false);
    }
  };

  // 打开反手对话框（使用光速飞爪）
  const handleOpenPhaseShift = () => {
    if (!player) {
      console.warn('Cannot open phase shift: player is null');
      return;
    }
    console.log('Opening Quantum Grapple, player side:', player.side);
    setShowQuantumGrapple(true);
  };

  return (
    <div className={`h-screen w-screen relative bg-slate-950 flex flex-col items-center justify-center overflow-hidden ${isShaking ? 'shake' : ''}`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
      
      {phase === GamePhase.LOBBY && (
        <div className="z-20 text-center flex flex-col items-center">
          <div className="mb-8 w-32 h-32 border-4 border-amber-500 rounded-full flex items-center justify-center animate-pulse bg-gradient-to-br from-amber-900/30 to-yellow-900/30 shadow-[0_0_30px_rgba(245,158,11,0.4)] relative overflow-hidden">
            {/* 大富翁风格图标：高帽商人 */}
            <div className="flex flex-col items-center justify-center relative z-10">
              <div className="text-5xl mb-0 leading-none">🎩</div>
              <div className="text-4xl mt-0 leading-none">👔</div>
              <div className="text-2xl mt-0 leading-none">💼</div>
            </div>
            {/* 背景装饰：金币 */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20">
              <span className="text-6xl">💰</span>
            </div>
          </div>
          <h1 className="orbitron text-7xl font-black mb-4 glitch-text tracking-[0.2em] text-white">{i18n.t('lobby.title')}</h1>
          <p className="text-cyan-400 mb-4 tracking-[0.5em] orbitron text-xs">{i18n.t('lobby.subtitle')}</p>
          <p className="text-slate-500 mb-12 tracking-[0.3em] orbitron text-xs">{i18n.t('lobby.description')}</p>
          <div className="flex space-x-4">
            <button 
              onClick={() => {
                soundManager.playClick();
                setPhase(GamePhase.CAMPAIGN_MAP);
              }}
              className="px-12 py-5 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all duration-300 font-black text-xl orbitron uppercase tracking-[0.3em] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)]"
            >
              {i18n.t('lobby.startJourney')}
            </button>
            <button 
              onClick={() => {
                soundManager.playClick();
                setPhase(GamePhase.SHOP);
              }}
              className="px-12 py-5 border-2 border-purple-500 text-purple-400 hover:bg-purple-500 hover:text-white transition-all duration-300 font-black text-xl orbitron uppercase tracking-[0.3em] hover:shadow-[0_0_50px_rgba(168,85,247,0.5)]"
            >
              {i18n.t('lobby.darkMarket')}
            </button>
          </div>
          {/* Language Switcher */}
          <div className="mt-8 flex items-center space-x-4">
            <span className="text-slate-500 text-sm">{i18n.t('common.language')}:</span>
            <button
              onClick={() => {
                const currentLang = i18n.getLanguage();
                const newLang: Language = currentLang === 'en' ? 'zh' : 'en';
                i18n.setLanguage(newLang);
                setLanguage(newLang);
                soundManager.playClick();
              }}
              className="px-4 py-2 border border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white transition-all text-sm orbitron uppercase"
            >
              {i18n.getLanguage() === 'en' ? '中文' : 'English'}
            </button>
          </div>
        </div>
      )}

      {phase === GamePhase.CAMPAIGN_MAP && (
        <CampaignMap
          key={`campaign-${profile.timeDiamonds}-${profile.currentCash}-${profile.currentChapter}-${profile.currentLevel}-${profile.currentPhase}`} // 强制在进度更新时重新渲染
          profile={profile}
          onSelectLevel={(scenario) => {
            setScenario(scenario);
            // 计算目标金额（使用动态难度，传入上一关目标作为参考）
            // 如果是第一关，previousTarget 为 0，会使用基础倍率
            const target = calculateLevelTarget(scenario, profile.currentCash, currentLevelTarget);
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
          timeDiamonds={profile.timeDiamonds}
          onStart={() => {
            setLevelStartingCash(profile.currentCash); // 记录关卡开始时的起始本金
            setPhase(GamePhase.BETTING);
          }}
          onBack={() => setPhase(GamePhase.CAMPAIGN_MAP)}
        />
      )}

      {phase === GamePhase.SHOP && (
        <DarkPoolShop
          profile={profile}
          onPurchase={handlePurchase}
          onBack={() => setPhase(GamePhase.LOBBY)}
          onOpenDiamondShop={() => setShowDiamondShop(true)}
        />
      )}

      {/* Diamond Shop Modal */}
      {showDiamondShop && (
        <DiamondShop
          currentDiamonds={profile.timeDiamonds}
          onPurchase={handlePurchaseDiamonds}
          onClose={() => setShowDiamondShop(false)}
        />
      )}

      {phase === GamePhase.BETTING && (
        <BettingOverlay 
          onStart={startGame} 
          scenarios={[scenario]} // 只允许玩当前关卡
          leverageOptions={LEVERAGE_OPTIONS}
          onBack={() => setPhase(GamePhase.CAMPAIGN_MAP)}
          initialScenario={scenario}
          temporaryItems={temporaryItems}
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
          onPhaseShift={handleOpenPhaseShift}
          onUseConsumable={handleUseConsumable}
          marginBuffer={marginBuffer}
          equipment={profile.equipment}
          consumables={profile.consumables}
          currentCash={profile.currentCash - (player?.marginAdded || 0)}
          targetCash={currentLevelTarget}
        />
      )}

      {phase === GamePhase.RESULT && player && (() => {
        // 计算结算结果用于显示
        const result = calculateResult(finalBalance, currentLevelTarget);
        const startingCash = levelStartingCash || profile.currentCash;
        
        // 计算损失惩罚（如果失败）
        let penaltyInfo = null;
        if (result.status === 'LIQUIDATED') {
          const liquidationPenalty = calculateLiquidationPenalty(startingCash, i18n.getLanguage());
          penaltyInfo = {
            cashPenalty: liquidationPenalty.cashPenalty,
            diamondPenalty: liquidationPenalty.diamondPenalty,
            remainingCash: liquidationPenalty.remainingCash,
            message: liquidationPenalty.message
          };
        } else if (result.status === 'FAILED') {
          const failurePenalty = calculateFailurePenalty(finalBalance, currentLevelTarget, startingCash, i18n.getLanguage());
          penaltyInfo = {
            cashPenalty: failurePenalty.cashPenalty,
            diamondPenalty: failurePenalty.diamondPenalty,
            remainingCash: failurePenalty.remainingCash,
            message: failurePenalty.message
          };
        }
        
        const displayResult = result.status === 'SUCCESS' ? {
          diamonds: result.diamondGain,
          nextTarget: result.nextTarget,
          growthRate: result.growthRate,
          profit: result.profit
        } : null;
        
        return (
        <ResultOverlay 
          player={player} 
          scenario={scenario}
          timeDiamonds={profile.timeDiamonds}
            currentCash={startingCash}
          targetCash={currentLevelTarget}
          finalBalance={finalBalance}
            levelResult={displayResult}
            penaltyInfo={penaltyInfo}
          onExtract={handleExtractDiamonds}
          onRevive={handleRevive}
          onOpenDiamondShop={() => setShowDiamondShop(true)}
            onContinue={() => {
              // 点击"放弃本关"：如果失败/爆仓，直接重置（因为玩家选择放弃，不想复活）
              if (player) {
                const finalPnl = player.isDead ? -100 : (player.exitPnl || player.currentPnl);
                const startingCash = levelStartingCash || profile.currentCash;
                const endBalance = calculateFinalBalance(startingCash, finalPnl);
                const result = calculateResult(endBalance, currentLevelTarget);
                
                // 如果失败或爆仓，且玩家选择放弃，直接重置
                if (result.status === 'LIQUIDATED' || result.status === 'FAILED') {
                  const reset = resetProfile();
                  // 立即清除并保存新的初始数据到 localStorage
                  localStorage.setItem('timeTraderProfile', JSON.stringify(reset));
                  setProfile(reset);
                  // 更新当前关卡到第一关
                  const firstScenario = getCurrentScenario(reset) || 
                                       SCENARIOS.find(s => s.id === '1-1-p1') || 
                                       SCENARIOS.find(s => s.chapter === Chapter.GOLDEN_AGE && s.level === 1 && s.phase === 1) || 
                                       SCENARIOS[0];
                  if (firstScenario) {
                    setScenario(firstScenario);
                  }
                  setPhase(GamePhase.CAMPAIGN_MAP);
                  return; // 提前返回
                }
              }
              setPhase(GamePhase.CAMPAIGN_MAP);
            }}
          onRestart={() => {
              const target = calculateLevelTarget(scenario, profile.currentCash, currentLevelTarget);
            setCurrentLevelTarget(target);
              setLevelStartingCash(profile.currentCash); // 重新记录起始本金
            setPhase(GamePhase.LEVEL_BRIEFING);
          }}
          onBack={() => setPhase(GamePhase.CAMPAIGN_MAP)}
        />
        );
      })()}

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
            // 临时道具会在下一关开始时应用，这里不清空
            // 它们会在 startGame 时应用并清空
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

      {/* 音效开关（右下角） */}
      <div className="absolute bottom-4 right-6 z-50">
        <button
          onClick={() => {
            const currentEnabled = soundManager.enabled;
            soundManager.setEnabled(!currentEnabled);
            if (!currentEnabled) {
              soundManager.playClick();
            }
          }}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800/80 border border-slate-700 hover:bg-slate-700 flex items-center justify-center transition-all"
          title="音效开关"
        >
          <span className="text-lg md:text-xl">
            {soundManager.enabled ? '🔊' : '🔇'}
          </span>
        </button>
      </div>

      {showMarginDialog && player && (
        <MarginDialog
          currentCash={profile.currentCash - player.marginAdded}
          currentBalance={currentBalance}
          onConfirm={handleMarginConfirm}
          onCancel={handleMarginCancel}
          type={showMarginDialog}
        />
      )}

      {showPhaseShiftDialog && player && (
        <PhaseShiftDialog
          isOpen={showPhaseShiftDialog}
          currentSide={player.side}
          onConfirm={handlePhaseShift}
          onCancel={() => setShowPhaseShiftDialog(false)}
          volatility={calculateVolatility()}
          baseFee={calculateBaseFee()}
        />
      )}

      {showQuantumGrapple && player && (
        <QuantumGrapple
          isActive={true}
          currentSide={player.side}
          onSwitch={handleQuantumGrapple}
          onCancel={() => {
            setShowQuantumGrapple(false);
            soundManager.playClick();
          }}
          volatility={calculateVolatility()}
          baseFee={calculateBaseFee()}
        />
      )}
    </div>
  );
};

export default App;
