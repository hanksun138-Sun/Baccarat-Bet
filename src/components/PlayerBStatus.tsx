import React from 'react';
import { PlayerBBet, PlayerBState, PlayerCState } from '../types';

interface PlayerBStatusProps {
  bBankroll: number;
  bState: PlayerBState;
  bCurrentBet: PlayerBBet;
  currentChaseBetAmount: number;

  cBankroll?: number;
  cState?: PlayerCState;
  cCurrentBet?: PlayerBBet;
  cCurrentChaseBetAmount?: number;

  aIsExhausted: boolean;
  onOpenRechargeB: () => void;
  onOpenRechargeC?: () => void;
  onChangeChaseBetAmount?: (amt: number) => void;
  onChangeCChaseBetAmount?: (amt: number) => void;
}

export const PlayerBStatus: React.FC<PlayerBStatusProps> = ({
  bBankroll,
  bState,
  bCurrentBet,
  currentChaseBetAmount,
  cBankroll = 10000,
  cState,
  cCurrentBet = { mainBet: null, mainAmount: 0 },
  cCurrentChaseBetAmount = 200,
  aIsExhausted,
  onOpenRechargeB,
  onOpenRechargeC,
  onChangeChaseBetAmount,
  onChangeCChaseBetAmount,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Player B Card */}
      <div className="bg-[#051a0b]/90 border-2 border-[#b8860b]/40 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-[#b8860b]/30 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🤖</span>
              <div>
                <h3 className="font-serif-casino font-bold text-[#d4af37] text-base sm:text-lg">玩家B (对家) 追打状态</h3>
                <p className="text-xs text-amber-100/60 font-sans">初始10,000元 | A输后追打 | <span className="text-amber-300 font-bold">A连赢3手退出</span></p>
              </div>
            </div>
            <button
              onClick={onOpenRechargeB}
              className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-emerald-100 text-xs font-bold rounded border border-emerald-500/40 font-sans cursor-pointer"
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
              <span className={`text-base font-bold font-serif-casino ${
                bState.isChasing ? 'text-amber-300' : 'text-emerald-400'
              }`}>
                {bState.isChasing ? '⚡ 追打中' : '👀 观望中'}
              </span>
            </div>
          </div>

          {/* Chase Consecutive Win Counter Gauge (3 wins to stop) */}
          <div className="bg-black/60 p-3.5 rounded-xl border border-[#b8860b]/30 mb-4 font-sans">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-amber-100/90 font-bold">A 连赢计数 (达3手退出)</span>
              <span className="font-mono text-amber-300 font-bold">{bState.aConsecutiveWins} / 3</span>
            </div>

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
            <p className="text-[10px] text-amber-200/50 mt-1.5">
              * A每输1手归0且继续追打，A连赢3手停止追打。
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
                          : 'bg-black/80 text-amber-200/80 border border-amber-900/50 hover:bg-black hover:text-amber-100'
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
                <span>⚠️ A资金归零，B触发固定追打机制 (¥{currentChaseBetAmount})</span>
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
                  <span className="text-amber-200/40">不下注 (观望)</span>
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

      {/* Player C Card */}
      <div className="bg-[#051a0b]/90 border-2 border-[#b8860b]/40 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-[#b8860b]/30 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🤖</span>
              <div>
                <h3 className="font-serif-casino font-bold text-[#d4af37] text-base sm:text-lg">玩家C (对家) 追打状态</h3>
                <p className="text-xs text-amber-100/60 font-sans">初始10,000元 | A输后追打 | <span className="text-amber-300 font-bold">A连赢2手退出</span></p>
              </div>
            </div>
            {onOpenRechargeC && (
              <button
                onClick={onOpenRechargeC}
                className="px-3 py-1 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-emerald-100 text-xs font-bold rounded border border-emerald-500/40 font-sans cursor-pointer"
              >
                💰 充值C
              </button>
            )}
          </div>

          {/* Bankroll & Status Badge */}
          <div className="grid grid-cols-2 gap-3 mb-4 font-sans">
            <div className="bg-black/60 p-3 rounded-xl border border-[#b8860b]/30">
              <span className="text-xs text-amber-200/70 block">玩家C 当前资金</span>
              <span className="text-xl sm:text-2xl font-mono font-bold text-emerald-400">¥{cBankroll.toLocaleString()}</span>
            </div>

            <div className={`p-3 rounded-xl border flex flex-col justify-center items-center ${
              cState?.isChasing
                ? 'bg-amber-950/70 border-amber-500/80 shadow-[0_0_15px_rgba(212,175,55,0.3)] animate-pulse'
                : 'bg-black/60 border-[#b8860b]/30'
            }`}>
              <span className="text-xs text-amber-200/70">当前模式</span>
              <span className={`text-base font-bold font-serif-casino ${
                cState?.isChasing ? 'text-amber-300' : 'text-emerald-400'
              }`}>
                {cState?.isChasing ? '⚡ 追打中' : '👀 观望中'}
              </span>
            </div>
          </div>

          {/* Chase Consecutive Win Counter Gauge (2 wins to stop) */}
          <div className="bg-black/60 p-3.5 rounded-xl border border-[#b8860b]/30 mb-4 font-sans">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-amber-100/90 font-bold">A 连赢计数 (达2手退出)</span>
              <span className="font-mono text-amber-300 font-bold">{cState?.aConsecutiveWins ?? 0} / 2</span>
            </div>

            <div className="w-full bg-black/80 rounded-full h-3 p-0.5 border border-[#b8860b]/30 flex space-x-1">
              {[1, 2].map((step) => (
                <div
                  key={step}
                  className={`flex-1 h-full rounded-full transition-all duration-300 ${
                    (cState?.aConsecutiveWins ?? 0) >= step
                      ? 'bg-gradient-to-r from-[#b8860b] to-[#d4af37] shadow-[0_0_8px_#d4af37]'
                      : 'bg-black/40'
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-amber-200/50 mt-1.5">
              * A每输1手归0且继续追打，A连赢2手停止追打。
            </p>
          </div>

          {/* Current Bet Config & Status */}
          <div className="space-y-2 text-xs font-sans">
            <div className="bg-black/60 p-2.5 rounded-lg border border-[#b8860b]/30">
              <div className="flex items-center justify-between">
                <span className="text-amber-200/70">设定追打单注金额:</span>
                <span className="font-mono text-amber-300 font-bold text-sm">¥{cCurrentChaseBetAmount}</span>
              </div>
              {onChangeCChaseBetAmount && (
                <div className="grid grid-cols-5 gap-1 mt-2 pt-2 border-t border-amber-900/40">
                  {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => onChangeCChaseBetAmount(amt)}
                      className={`py-1 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                        cCurrentChaseBetAmount === amt
                          ? 'bg-[#d4af37] text-black border border-amber-100 shadow'
                          : 'bg-black/80 text-amber-200/80 border border-amber-900/50 hover:bg-black hover:text-amber-100'
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
                <span>⚠️ A资金归零，C触发固定追打机制 (¥{cCurrentChaseBetAmount})</span>
              </div>
            )}

            <div className="flex items-center justify-between bg-black/60 p-2.5 rounded-lg border border-[#b8860b]/30">
              <span className="text-amber-200/70">本手C预测跟注:</span>
              <span className="font-mono font-bold text-sm">
                {cCurrentBet.mainBet === 'PLAYER' ? (
                  <span className="text-blue-400">押闲 ¥{cCurrentBet.mainAmount}</span>
                ) : cCurrentBet.mainBet === 'BANKER' ? (
                  <span className="text-red-400">押庄 ¥{cCurrentBet.mainAmount}</span>
                ) : (
                  <span className="text-amber-200/40">不下注 (观望)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Chase Stat Summary */}
        <div className="mt-4 pt-3 border-t border-[#b8860b]/30 text-[11px] text-amber-200/70 flex items-center justify-between font-sans">
          <span>已触发追打次数: <strong className="text-amber-300 font-mono">{cState?.totalChasesTriggered ?? 0}</strong></span>
          <span>追打胜率: <strong className="text-emerald-400 font-mono">
            {cState && cState.totalChaseHands > 0 ? `${((cState.chaseWinsC / cState.totalChaseHands) * 100).toFixed(1)}%` : '0%'}
          </strong></span>
        </div>
      </div>
    </div>
  );
};
