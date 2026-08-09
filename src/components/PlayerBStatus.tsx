import React from 'react';
import { PlayerBBet, PlayerBState } from '../types';

interface PlayerBStatusProps {
  bBankroll: number;
  bState: PlayerBState;
  bCurrentBet: PlayerBBet;
  currentChaseBetAmount: number;
  aIsExhausted: boolean;
  onOpenRechargeB: () => void;
  onChangeChaseBetAmount?: (amt: number) => void;
}

export const PlayerBStatus: React.FC<PlayerBStatusProps> = ({
  bBankroll,
  bState,
  bCurrentBet,
  currentChaseBetAmount,
  aIsExhausted,
  onOpenRechargeB,
  onChangeChaseBetAmount,
}) => {
  return (
    <div className="bg-[#051a0b]/90 border-2 border-[#b8860b]/40 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between border-b border-[#b8860b]/30 pb-3 mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🤖</span>
            <div>
              <h3 className="font-serif-casino font-bold text-[#d4af37] text-base sm:text-lg">玩家B (对家) 追打状态</h3>
              <p className="text-xs text-amber-100/60 font-sans">初始10,000元 | 输一手后自动反向追打</p>
            </div>
          </div>
          <button
            onClick={onOpenRechargeB}
            className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-emerald-100 text-xs font-bold rounded border border-emerald-500/40 font-sans"
          >
            💰 充值B
          </button>
        </div>

        {/* Bankroll & Status Badge */}
        <div className="grid grid-cols-2 gap-3 mb-4 font-sans">
          <div className="bg-black/60 p-3 rounded-xl border border-[#b8860b]/30">
            <span className="text-xs text-amber-200/70 block">玩家B 当前资金</span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">¥{bBankroll.toLocaleString()}</span>
          </div>

          <div className={`p-3 rounded-xl border flex flex-col justify-center items-center ${
            bState.isChasing
              ? 'bg-amber-950/70 border-amber-500/80 shadow-[0_0_15px_rgba(212,175,55,0.3)] animate-pulse'
              : 'bg-black/60 border-[#b8860b]/30'
          }`}>
            <span className="text-xs text-amber-200/70">当前模式</span>
            <span className={`text-base sm:text-lg font-bold font-serif-casino ${
              bState.isChasing ? 'text-amber-300' : 'text-emerald-400'
            }`}>
              {bState.isChasing ? '⚡ 追打中 (Chasing)' : '👀 观望中 (Observing)'}
            </span>
          </div>
        </div>

        {/* Chase Consecutive Win Counter Gauge */}
        <div className="bg-black/60 p-3.5 rounded-xl border border-[#b8860b]/30 mb-4 font-sans">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-amber-100/90 font-bold">玩家A 连续赢局计数 (达3手退出追打)</span>
            <span className="font-mono text-amber-300 font-bold">{bState.aConsecutiveWins} / 3</span>
          </div>

          {/* Progress gauge bar */}
          <div className="w-full bg-black/80 rounded-full h-3 p-0.5 border border-[#b8860b]/30 flex space-x-1">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex-1 h-full rounded-full transition-all duration-300 ${
                  bState.aConsecutiveWins >= step
                    ? 'bg-gradient-to-r from-[#b8860b] to-[#d4af37] shadow-[0_0_8px_#d4af37]'
                    : 'bg-black/40'
                }`}
              />
            ))}
          </div>

          <p className="text-[11px] text-amber-200/60 mt-2 leading-relaxed">
            * 仅计算玩家A实际下注且分出胜负(赢)的手。跳过和局/未注/龙7免佣和局。若A输局，计数归0。
          </p>
        </div>

        {/* Current Bet Config & Status */}
        <div className="space-y-2 text-xs font-sans">
          <div className="bg-black/60 p-2.5 rounded-lg border border-[#b8860b]/30">
            <div className="flex items-center justify-between">
              <span className="text-amber-200/70">设定追打单注金额:</span>
              <span className="font-mono text-amber-300 font-bold text-sm">¥{currentChaseBetAmount}</span>
            </div>
            {onChangeChaseBetAmount && (
              <div className="grid grid-cols-5 gap-1 mt-2 pt-2 border-t border-amber-900/40">
                {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => onChangeChaseBetAmount(amt)}
                    className={`py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                      currentChaseBetAmount === amt
                        ? 'bg-[#d4af37] text-black border border-amber-100 shadow'
                        : 'bg-black/80 text-amber-200/80 border border-amber-900/50 hover:bg-black hover:text-amber-100 hover:border-amber-500/60'
                    }`}
                  >
                    ¥{amt}
                  </button>
                ))}
              </div>
            )}
          </div>

          {aIsExhausted && (
            <div className="bg-red-950/80 border border-red-500/50 p-2 rounded-lg text-red-200 text-[11px] font-medium flex items-center space-x-1.5">
              <span>⚠️ 玩家A资金归零，B触发“输光后固定追打金额”机制 (¥{currentChaseBetAmount})</span>
            </div>
          )}

          <div className="flex items-center justify-between bg-black/60 p-2.5 rounded-lg border border-[#b8860b]/30">
            <span className="text-amber-200/70">本手B预测跟注:</span>
            <span className="font-mono font-bold text-sm">
              {bCurrentBet.mainBet === 'PLAYER' ? (
                <span className="text-blue-400">押闲 ¥{bCurrentBet.mainAmount}</span>
              ) : bCurrentBet.mainBet === 'BANKER' ? (
                <span className="text-red-400">押庄 ¥{bCurrentBet.mainAmount}</span>
              ) : (
                <span className="text-amber-200/40">不下注 (观望/A未注)</span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Chase Stat Summary */}
      <div className="mt-4 pt-3 border-t border-[#b8860b]/30 text-[11px] text-amber-200/70 flex items-center justify-between font-sans">
        <span>已触发追打次数: <strong className="text-amber-300 font-mono">{bState.totalChasesTriggered}</strong></span>
        <span>追打胜率: <strong className="text-emerald-400 font-mono">
          {bState.totalChaseHands > 0 ? `${((bState.chaseWinsB / bState.totalChaseHands) * 100).toFixed(1)}%` : '0%'}
        </strong></span>
      </div>
    </div>
  );
};
