import React, { useState, useEffect, useRef } from 'react';
import { Side } from '../types';
import { soundManager } from '../utils/soundManager';

interface Props {
  isOpen: boolean;
  currentSide: Side;
  onConfirm: (newSide: Side, result: 'PERFECT' | 'NORMAL' | 'FAIL') => void;
  onCancel: () => void;
  volatility: number; // 市场波动率 (0-1)
  baseFee: number; // 基础手续费
}

const PhaseShiftDialog: React.FC<Props> = ({ 
  isOpen, 
  currentSide, 
  onConfirm, 
  onCancel,
  volatility,
  baseFee
}) => {
  const [isActive, setIsActive] = useState(false);
  const [currentAngle, setCurrentAngle] = useState(0);
  const [gapAngle, setGapAngle] = useState(0);
  const [gapWidth, setGapWidth] = useState(45);
  const [rotationSpeed, setRotationSpeed] = useState(100);
  const [comboCount, setComboCount] = useState(0);
  const [overheatActive, setOverheatActive] = useState(false);
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  // 根据波动率更新难度
  useEffect(() => {
    if (!isOpen) return;
    
    // 波动越大，转得越快，缺口越小
    const speed = 100 + volatility * 500;
    const width = Math.max(5, 45 - volatility * 20);
    
    setRotationSpeed(speed);
    setGapWidth(width);
    
    // 随机设置缺口位置
    setGapAngle(Math.random() * 360);
  }, [isOpen, volatility]);

  // 旋转动画
  useEffect(() => {
    if (!isActive || !isOpen) return;

    const animate = (timestamp: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }
      
      const elapsed = timestamp - startTimeRef.current;
      const newAngle = (elapsed * rotationSpeed / 1000) % 360;
      setCurrentAngle(newAngle);
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, rotationSpeed, isOpen]);

  // 开始QTE
  const handleStart = () => {
    setIsActive(true);
    setCurrentAngle(0);
    startTimeRef.current = 0;
    soundManager.playClick();
  };

  // 尝试反手
  const handleAttempt = () => {
    if (!isActive) {
      handleStart();
      return;
    }

    if (overheatActive) {
      // 过热模式：直接成功
      const newSide = currentSide === Side.LONG ? Side.SHORT : Side.LONG;
      soundManager.playSuccess();
      onConfirm(newSide, 'PERFECT');
      setIsActive(false);
      return;
    }

    // 计算指针与缺口的距离
    const normalizedAngle = currentAngle % 360;
    const normalizedGap = gapAngle % 360;
    
    let distance = Math.abs(normalizedAngle - normalizedGap);
    if (distance > 180) {
      distance = 360 - distance;
    }

    const halfGap = gapWidth / 2;
    let result: 'PERFECT' | 'NORMAL' | 'FAIL';

    if (distance < 2) {
      // 完美切入
      result = 'PERFECT';
      soundManager.playSuccess();
      setComboCount(prev => {
        const newCombo = prev + 1;
        if (newCombo >= 3) {
          setOverheatActive(true);
          setTimeout(() => {
            setOverheatActive(false);
            setComboCount(0);
          }, 10000); // 10秒过热时间
        }
        return newCombo;
      });
    } else if (distance < halfGap) {
      // 普通切入
      result = 'NORMAL';
      soundManager.playClick();
      setComboCount(0);
    } else {
      // 操作失误
      result = 'FAIL';
      soundManager.playFailure();
      setComboCount(0);
    }

    setIsActive(false);
    const newSide = currentSide === Side.LONG ? Side.SHORT : Side.LONG;
    onConfirm(newSide, result);
  };

  if (!isOpen) return null;

  const newSide = currentSide === Side.LONG ? Side.SHORT : Side.LONG;
  const feeMultiplier = overheatActive ? 0 : (comboCount >= 3 ? 0.5 : 1);
  const failMultiplier = 3;
  
  const perfectFee = Math.floor(baseFee * 0.5);
  const normalFee = baseFee;
  const failFee = baseFee * failMultiplier;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-cyan-500 p-6 md:p-8 max-w-lg w-full mx-2 md:mx-4 shadow-2xl my-auto relative">
        <h3 className="orbitron text-xl md:text-2xl font-black text-white mb-2 uppercase tracking-wider text-center">
          量子相位突围
        </h3>
        <p className="text-slate-400 text-xs md:text-sm text-center mb-6">
          {currentSide === Side.LONG ? '多头' : '空头'} → {newSide === Side.LONG ? '多头' : '空头'}
        </p>

        {/* 过热模式提示 */}
        {overheatActive && (
          <div className="mb-4 p-3 bg-rose-500/20 border border-rose-500 rounded text-center animate-pulse">
            <div className="text-rose-400 font-bold text-sm md:text-base orbitron">
              ⚡ 量子隧穿模式激活！10秒内免费切换 ⚡
            </div>
          </div>
        )}

        {/* 连击计数 */}
        {comboCount > 0 && !overheatActive && (
          <div className="mb-4 text-center">
            <div className="text-cyan-400 font-bold text-lg orbitron">
              连击: {comboCount}/3
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-rose-500 transition-all duration-300"
                style={{ width: `${(comboCount / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* 旋转环形QTE */}
        <div className="relative w-64 h-64 mx-auto mb-6">
          {/* 外圈罗盘 */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
            <defs>
              {/* 创建遮罩来显示缺口 */}
              <mask id={`gap-mask-${Math.floor(gapAngle)}`}>
                <rect width="200" height="200" fill="black"/>
                <path
                  d={`M 100,100 L ${100 + 90 * Math.cos((gapAngle - gapWidth/2) * Math.PI / 180)},${100 + 90 * Math.sin((gapAngle - gapWidth/2) * Math.PI / 180)} A 90,90 0 ${gapWidth > 180 ? 1 : 0},1 ${100 + 90 * Math.cos((gapAngle + gapWidth/2) * Math.PI / 180)},${100 + 90 * Math.sin((gapAngle + gapWidth/2) * Math.PI / 180)} Z`}
                  fill="white"
                />
              </mask>
            </defs>
            
            {/* 背景圆环 */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="none"
              stroke="rgba(15, 23, 42, 0.8)"
              strokeWidth="8"
            />
            
            {/* 高压电弧区域（红色危险区） */}
            <circle
              cx="100"
              cy="100"
              r="90"
              fill="rgba(239, 68, 68, 0.3)"
              stroke="rgba(239, 68, 68, 0.6)"
              strokeWidth="2"
              className="animate-pulse"
              mask={`url(#gap-mask-${Math.floor(gapAngle)})`}
            />
            
            {/* 安全缺口（绿色） */}
            <path
              d={`M 100,100 L ${100 + 90 * Math.cos((gapAngle - gapWidth/2) * Math.PI / 180)},${100 + 90 * Math.sin((gapAngle - gapWidth/2) * Math.PI / 180)} A 90,90 0 ${gapWidth > 180 ? 1 : 0},1 ${100 + 90 * Math.cos((gapAngle + gapWidth/2) * Math.PI / 180)},${100 + 90 * Math.sin((gapAngle + gapWidth/2) * Math.PI / 180)} Z`}
              fill="rgba(16, 185, 129, 0.4)"
              stroke="rgba(16, 185, 129, 0.8)"
              strokeWidth="3"
            />
            
            {/* 完美区域（中心高亮） */}
            <circle
              cx={100 + 90 * Math.cos(gapAngle * Math.PI / 180)}
              cy={100 + 90 * Math.sin(gapAngle * Math.PI / 180)}
              r="8"
              fill="rgba(16, 185, 129, 1)"
              className="animate-pulse"
            />
            
            {/* 旋转指针 */}
            <line
              x1="100"
              y1="100"
              x2={100 + 90 * Math.cos(currentAngle * Math.PI / 180)}
              y2={100 + 90 * Math.sin(currentAngle * Math.PI / 180)}
              stroke="rgba(6, 182, 212, 1)"
              strokeWidth="4"
              strokeLinecap="round"
              className="transition-all duration-75"
            />
            
            {/* 指针端点 */}
            <circle
              cx={100 + 90 * Math.cos(currentAngle * Math.PI / 180)}
              cy={100 + 90 * Math.sin(currentAngle * Math.PI / 180)}
              r="6"
              fill="rgba(6, 182, 212, 1)"
              className="shadow-[0_0_10px_rgba(6,182,212,0.8)]"
            />
          </svg>

          {/* 中心提示文字 */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              {!isActive ? (
                <div className="text-slate-400 text-sm orbitron">
                  点击开始
                </div>
              ) : overheatActive ? (
                <div className="text-rose-400 text-lg font-bold orbitron animate-pulse">
                  自由切换
                </div>
              ) : (
                <div className="text-cyan-400 text-sm font-bold orbitron">
                  对准缺口
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 手续费说明 */}
        <div className="bg-slate-800/50 p-4 mb-6 border border-slate-700 rounded">
          <div className="text-xs text-slate-400 orbitron uppercase mb-2">手续费说明</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-emerald-400">完美切入:</span>
              <span className="text-white font-bold">${perfectFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cyan-400">普通切入:</span>
              <span className="text-white font-bold">${normalFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-400">操作失误:</span>
              <span className="text-white font-bold">${failFee.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* 难度指示 */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>市场波动率</span>
            <span>{(volatility * 100).toFixed(0)}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 transition-all duration-300"
              style={{ width: `${volatility * 100}%` }}
            />
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm md:text-base orbitron font-bold uppercase tracking-wider transition-all"
          >
            取消
          </button>
          <button
            onClick={handleAttempt}
            className={`flex-1 py-3 text-sm md:text-base orbitron font-black uppercase tracking-wider transition-all ${
              overheatActive
                ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                : isActive
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {!isActive ? '开始' : overheatActive ? '自由切换' : '确认反手'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhaseShiftDialog;

