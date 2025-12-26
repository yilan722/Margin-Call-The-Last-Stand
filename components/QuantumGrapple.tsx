import React, { useState, useEffect } from 'react';
import { Side } from '../types';
import { soundManager } from '../utils/soundManager';
import { i18n } from '../utils/i18n';

interface Props {
  isActive: boolean;
  currentSide: Side;
  onSwitch: (newSide: Side, fee: number, result: 'PERFECT' | 'NORMAL' | 'FAIL') => void;
  onCancel: () => void;
  volatility: number;
  baseFee: number;
}

const QuantumGrapple: React.FC<Props> = ({
  isActive,
  currentSide,
  onSwitch,
  onCancel,
  volatility,
  baseFee
}) => {
  const [timing, setTiming] = useState(50); // 时机值 0-100
  const [isTiming, setIsTiming] = useState(true); // 默认开始移动
  const [result, setResult] = useState<'PERFECT' | 'NORMAL' | 'FAIL' | null>(null);

  const newSide = currentSide === Side.LONG ? Side.SHORT : Side.LONG;

  // 时机选择循环 - 持续随机移动
  useEffect(() => {
    if (!isActive || !isTiming) {
      return;
    }

    // 随机移动速度（根据波动率调整）
    const baseSpeed = 3 + volatility * 5;
    
    const interval = setInterval(() => {
      setTiming(prev => {
        // 随机方向移动
        const direction = Math.random() > 0.5 ? 1 : -1;
        const change = (Math.random() * baseSpeed + baseSpeed * 0.5) * direction;
        let newTiming = prev + change;
        
        // 边界处理：反弹或限制
        if (newTiming > 100) {
          newTiming = 100 - (newTiming - 100) * 0.3; // 反弹
        } else if (newTiming < 0) {
          newTiming = Math.abs(newTiming) * 0.3; // 反弹
        }
        
        // 确保在 0-100 范围内
        return Math.max(0, Math.min(100, newTiming));
      });
    }, 50); // 每50ms更新一次

    return () => clearInterval(interval);
  }, [isActive, isTiming, volatility]);

  // 确认切换 - 停止移动并确定结果
  const handleConfirm = () => {
    if (!isTiming) {
      return; // 已经停止，不应该再点击
    }

    // 停止移动
    setIsTiming(false);
    
    let finalResult: 'PERFECT' | 'NORMAL' | 'FAIL';
    let fee = 0;

    // 根据时机值决定结果
    if (timing >= 90) {
      // 完美时机（90-100）
      finalResult = 'PERFECT';
      fee = 0;
      soundManager.playSuccess();
    } else if (timing >= 60) {
      // 良好时机（60-89）
      finalResult = 'NORMAL';
      fee = Math.floor(baseFee * 0.3);
      soundManager.playClick();
    } else if (timing >= 40) {
      // 普通时机（40-59）
      finalResult = 'NORMAL';
      fee = Math.floor(baseFee * 0.6);
      soundManager.playClick();
    } else {
      // 糟糕时机（0-39）
      finalResult = 'FAIL';
      fee = baseFee * 2;
      soundManager.playFailure();
    }

    setResult(finalResult);

    setTimeout(() => {
      onSwitch(newSide, fee, finalResult);
    }, 2000);
  };

  if (!isActive) return null;

  // 计算时机区域颜色
  const getTimingColor = () => {
    if (timing >= 90) return 'from-yellow-400 to-yellow-600';
    if (timing >= 60) return 'from-emerald-400 to-emerald-600';
    if (timing >= 40) return 'from-cyan-400 to-cyan-600';
    return 'from-rose-400 to-rose-600';
  };

        // 计算时机文字
        const getTimingText = () => {
          if (timing >= 90) return i18n.t('quantumGrapple.perfectTiming');
          if (timing >= 60) return i18n.t('quantumGrapple.goodTiming');
          if (timing >= 40) return i18n.t('quantumGrapple.normalTiming');
          return i18n.t('quantumGrapple.badTiming');
        };

  // 计算费用预览
  const getFeePreview = () => {
    if (timing >= 90) return 0;
    if (timing >= 60) return Math.floor(baseFee * 0.3);
    if (timing >= 40) return Math.floor(baseFee * 0.6);
    return baseFee * 2;
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-md flex items-center justify-center">
      <div className="bg-slate-900 border-2 border-cyan-500/50 rounded-lg p-6 md:p-8 max-w-md w-full mx-4">
        {/* 标题 */}
        <div className="text-center mb-6">
          <h2 className="text-3xl md:text-4xl font-black orbitron text-cyan-400 mb-2">
            {i18n.t('quantumGrapple.title')}
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            {currentSide === Side.LONG ? i18n.t('betting.long') : i18n.t('betting.short')} → {newSide === Side.LONG ? i18n.t('betting.long') : i18n.t('betting.short')}
          </p>
        </div>

        {/* 时机选择器 */}
        {!result && (
          <>
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400 text-sm">{i18n.t('quantumGrapple.timingSelection')}</span>
                {isTiming && (
                  <span className={`text-sm font-bold ${
                    timing >= 90 ? 'text-yellow-400' :
                    timing >= 60 ? 'text-emerald-400' :
                    timing >= 40 ? 'text-cyan-400' :
                    'text-rose-400'
                  }`}>
                    {getTimingText()} ({Math.round(timing)}%)
                  </span>
                )}
              </div>
              
              {/* 进度条 */}
              <div className="relative h-12 bg-slate-800 rounded-full overflow-hidden border-2 border-slate-700">
                {/* 区域标记 */}
                <div className="absolute inset-0 flex">
                  <div className="flex-1 bg-rose-500/20"></div>
                  <div className="flex-1 bg-cyan-500/20"></div>
                  <div className="flex-1 bg-emerald-500/20"></div>
                  <div className="flex-1 bg-yellow-500/20"></div>
                </div>
                
                {/* 时机指示器 */}
                {isTiming && (
                  <div
                    className={`absolute top-0 bottom-0 w-2 bg-gradient-to-b ${getTimingColor()} rounded-full transition-all duration-75 shadow-lg`}
                    style={{ left: `${timing}%`, transform: 'translateX(-50%)' }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-bold text-white whitespace-nowrap">
                      👆
                    </div>
                  </div>
                )}
                
                {/* 区域标签 */}
                <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                  <div className="flex w-full justify-between px-2">
                    <span>{i18n.t('quantumGrapple.badTiming')}</span>
                    <span>{i18n.t('quantumGrapple.normalTiming')}</span>
                    <span>{i18n.t('quantumGrapple.goodTiming')}</span>
                    <span>{i18n.t('quantumGrapple.perfectTiming')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 费用预览 */}
            {isTiming && (
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="text-center">
                  <div className="text-slate-400 text-sm mb-1">{i18n.t('quantumGrapple.feePreview')}</div>
                  <div className={`text-2xl md:text-3xl font-black ${
                    timing >= 90 ? 'text-yellow-400' :
                    timing >= 60 ? 'text-emerald-400' :
                    timing >= 40 ? 'text-cyan-400' :
                    'text-rose-400'
                  }`}>
                    ${getFeePreview().toLocaleString()}
                  </div>
                  {timing >= 90 && (
                    <div className="text-emerald-400 text-sm mt-2">{i18n.t('quantumGrapple.perfectFree')}</div>
                  )}
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="flex gap-4">
              <button
                onClick={onCancel}
                className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold orbitron uppercase transition-all rounded-lg"
              >
                {i18n.t('common.cancel')}
              </button>
              <button
                onClick={handleConfirm}
                className={`flex-1 px-4 py-3 font-bold orbitron uppercase transition-all rounded-lg ${
                  isTiming
                    ? timing >= 90
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                      : timing >= 60
                      ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      : timing >= 40
                      ? 'bg-cyan-500 hover:bg-cyan-600 text-white'
                      : 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-cyan-500 hover:bg-cyan-600 text-white'
                }`}
              >
                {isTiming ? i18n.t('quantumGrapple.confirmShift') : i18n.t('quantumGrapple.startTiming')}
              </button>
            </div>

            {/* 说明 */}
            <div className="mt-6 p-4 bg-slate-800/30 rounded-lg border border-slate-700">
              <div className="text-slate-400 text-xs md:text-sm space-y-1">
                <div>💡 <span className="text-white">{i18n.t('quantumGrapple.instructions.title')}</span></div>
                <div>1. {i18n.t('quantumGrapple.instructions.step1')}</div>
                <div>2. {i18n.t('quantumGrapple.instructions.step2')}</div>
                <div>3. {i18n.t('quantumGrapple.instructions.step3')}</div>
                <div>4. {i18n.t('quantumGrapple.instructions.step4')}</div>
                <div>5. {i18n.t('quantumGrapple.instructions.step5')}</div>
              </div>
            </div>
          </>
        )}

        {/* 结果反馈 */}
        {result && (
          <div className="text-center">
            <div className={`text-5xl md:text-6xl font-black orbitron mb-4 ${
              result === 'PERFECT' ? 'text-yellow-400' :
              result === 'NORMAL' ? 'text-cyan-400' :
              'text-rose-400'
            }`}>
              {result === 'PERFECT' && i18n.t('quantumGrapple.results.perfect')}
              {result === 'NORMAL' && i18n.t('quantumGrapple.results.normal')}
              {result === 'FAIL' && i18n.t('quantumGrapple.results.fail')}
            </div>
            {result !== 'PERFECT' && (
              <div className="text-2xl md:text-3xl text-slate-300 mb-4">
                {i18n.t('quantumGrapple.results.fee')}: ${getFeePreview().toLocaleString()}
              </div>
            )}
            <div className="text-slate-400 text-sm">
              {i18n.t('quantumGrapple.results.continueIn')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuantumGrapple;
