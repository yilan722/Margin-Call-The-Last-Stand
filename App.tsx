
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GamePhase, Side, PlayerState, Scenario } from './types';
import { SCENARIOS, LEVERAGE_OPTIONS } from './constants';
import BettingOverlay from './components/BettingOverlay';
import GameView from './components/GameView';
import ResultOverlay from './components/ResultOverlay';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [phase, setPhase] = useState<GamePhase>(GamePhase.LOBBY);
  const [scenario, setScenario] = useState<Scenario>(SCENARIOS[0]);
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [commentary, setCommentary] = useState("量子交易塔已连接。等待入场指令...");
  const [isShaking, setIsShaking] = useState(false);
  const [marginBuffer, setMarginBuffer] = useState(0); // Temporary safety net from "Margin+"

  // Use ReturnType<typeof setInterval> instead of NodeJS.Timeout to fix namespace error in browser environment
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startGame = (selectedSide: Side, selectedLeverage: number, selectedScenario: Scenario) => {
    setScenario(selectedScenario);
    const initialPrice = selectedScenario.data[0].price;
    setPlayer({
      id: 'local-user',
      name: '赌徒之神',
      leverage: selectedLeverage,
      side: selectedSide,
      entryPrice: initialPrice,
      currentPnl: 0,
      isDead: false,
      isExited: false,
      highPnl: 0
    });
    setCurrentIndex(0);
    setMarginBuffer(0);
    setPhase(GamePhase.TRADING);
  };

  const updateCommentary = async (price: number, pnl: number) => {
    try {
      // Create a new GoogleGenAI instance right before making an API call to ensure it always uses the most up-to-date API key
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
            setPhase(GamePhase.RESULT);
            return prev;
          }
          return next;
        });
        
        // Decay margin buffer over time
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

    // Trigger shake on big volatility
    if (stepChange > 2) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
    }

    const actualPnl = player.side === Side.LONG ? priceChangePct * player.leverage : -priceChangePct * player.leverage;

    setPlayer(prev => {
      if (!prev || prev.isDead || prev.isExited) return prev;
      
      const adjustedPnl = actualPnl + marginBuffer; // Margin+ adds temporary virtual Pnl safety
      const isDead = adjustedPnl <= -100;
      const highPnl = Math.max(prev.highPnl, actualPnl);

      if (isDead) {
        setPhase(GamePhase.RESULT);
        return { ...prev, currentPnl: -100, isDead: true, highPnl };
      }

      return { ...prev, currentPnl: actualPnl, highPnl };
    });

    if (currentIndex % 20 === 0) {
      updateCommentary(currentPrice, actualPnl);
    }
  }, [currentIndex, scenario, phase, marginBuffer]);

  const handleJumpOut = () => {
    if (!player || player.isDead || player.isExited) return;
    setPlayer(prev => prev ? ({
      ...prev,
      isExited: true,
      exitPrice: scenario.data[currentIndex].price,
      exitPnl: prev.currentPnl
    }) : null);
    setPhase(GamePhase.RESULT);
  };

  const handleAddMargin = () => {
    // Simulated cooperative rescue: adds 20% safety buffer that decays
    setMarginBuffer(prev => prev + 25);
    setCommentary(">>> 警告：收到外部保证金注入！暂时脱离死亡区！");
  };

  const handleUseHammer = () => {
    // Visual effect mainly, adds a bit of "chaos"
    setIsShaking(true);
    setCommentary(">>> 扰动脉冲已发射：市场流动性正在崩塌！");
  };

  return (
    <div className={`h-screen w-screen relative bg-slate-950 flex flex-col items-center justify-center overflow-hidden ${isShaking ? 'shake' : ''}`}>
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none"></div>
      
      {phase === GamePhase.LOBBY && (
        <div className="z-20 text-center flex flex-col items-center">
          <div className="mb-8 w-32 h-32 border-4 border-cyan-500 rounded-full flex items-center justify-center animate-pulse">
            <span className="text-6xl">👁️</span>
          </div>
          <h1 className="orbitron text-7xl font-black mb-4 glitch-text tracking-[0.2em] text-white">MARGIN CALL</h1>
          <p className="text-cyan-400 mb-12 tracking-[0.5em] orbitron text-xs">DECIDE YOUR FATE IN THE DATA ABYSS</p>
          <button 
            onClick={() => setPhase(GamePhase.BETTING)}
            className="px-16 py-6 border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white transition-all duration-300 font-black text-2xl orbitron uppercase tracking-[0.3em] hover:shadow-[0_0_50px_rgba(6,182,212,0.5)] group"
          >
            ENTER SIM <span className="inline-block group-hover:translate-x-2 transition-transform">→</span>
          </button>
        </div>
      )}

      {phase === GamePhase.BETTING && (
        <BettingOverlay 
          onStart={startGame} 
          scenarios={SCENARIOS}
          leverageOptions={LEVERAGE_OPTIONS}
        />
      )}

      {phase === GamePhase.TRADING && player && (
        <GameView 
          scenario={scenario}
          player={player}
          currentIndex={currentIndex}
          commentary={commentary}
          onJumpOut={handleJumpOut}
          onAddMargin={handleAddMargin}
          onUseHammer={handleUseHammer}
          marginBuffer={marginBuffer}
        />
      )}

      {phase === GamePhase.RESULT && player && (
        <ResultOverlay 
          player={player} 
          scenario={scenario}
          onRestart={() => setPhase(GamePhase.LOBBY)} 
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
