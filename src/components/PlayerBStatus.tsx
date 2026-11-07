import React from 'react';
import { PlayerBBet, PlayerBotState } from '../types';
import { RechargePlayer } from './RechargeModal';

interface BotCardData {
  id: 'B' | 'B-1' | 'B-2';
  name: string;
  exitRuleText: string;
  maxConsecutiveWins: number;
  takeProfitUnits: number; // 0 means no limit, 2 or 3
  bankroll: number;
  state: PlayerBotState;
  currentBet: PlayerBBet;
  chaseBetAmount: number;
}

interface PlayerBStatusProps {
  bBankroll: number;
  bState: PlayerBotState;
  bCurrentBet: PlayerBBet;
  bChaseBetAmount: number;

  b1Bankroll?: number;
  b1State?: PlayerBotState;
  b1CurrentBet?: PlayerBBet;
  b1ChaseBetAmount?: number;

  b2Bankroll?: number;
  b2State?: PlayerBotState;
  b2CurrentBet?: PlayerBBet;
  b2ChaseBetAmount?: number;

  aIsExhausted: boolean;
  botTakeProfitResetMode?: 'ISOLATED_SHOE' | 'CUMULATIVE';
  onToggleResetMode?: () => void;
  onOpenRecharge: (player: RechargePlayer) => void;
  onChangeBetAmount: (player: 'B' | 'B1' | 'B2', amt: number) => void;
}

export const PlayerBStatus: React.FC<PlayerBStatusProps> = ({
  bBankroll,
  bState,
  bCurrentBet,
  bChaseBetAmount,

  b1Bankroll = 10000,
  b1State,
  b1CurrentBet = { mainBet: null, mainAmount: 0 },
  b1ChaseBetAmount = 200,

  b2Bankroll = 10000,
  b2State,
  b2CurrentBet = { mainBet: null, mainAmount: 0 },
  b2ChaseBetAmount = 200,

  aIsExhausted,
  botTakeProfitResetMode = 'ISOLATED_SHOE',
  onToggleResetMode,
  onOpenRecharge,
  onChangeBetAmount,
}) => {
  const defaultBotState: PlayerBotState = {
    isChasing: false,
    aConsecutiveWins: 0,
    totalChasesTriggered: 0,
    totalChaseHands: 0,
    chaseWins: 0,
    chaseLosses: 0,
    profitSinceReset: 0,
    isTakeProfitStopped: false,
  };

  const bots: BotCardData[] = [
    {
      id: 'B',
      name: '玩家B',
      exitRuleText: 'A连赢3手退出',
      maxConsecutiveWins: 3,
      takeProfitUnits: 0,
      bankroll: bBankroll,
      state: bState || defaultBotState,
      currentBet: bCurrentBet,
      chaseBetAmount: bChaseBetAmount,
    },
    {
      id: 'B-1',
      name: '玩家B-1',
      exitRuleText: 'A连赢3手退出',
      maxConsecutiveWins: 3,
      takeProfitUnits: 3,
      bankroll: b1Bankroll,
      state: b1State || defaultBotState,
      currentBet: b1CurrentBet,
      chaseBetAmount: b1ChaseBetAmount,
    },
    {
      id: 'B-2',
      name: '玩家B-2',
      exitRuleText: 'A连赢3手退出',
      maxConsecutiveWins: 3,
      takeProfitUnits: 2,
      bankroll: b2Bankroll,
      state: b2State || defaultBotState,
      currentBet: b2CurrentBet,
      chaseBetAmount: b2ChaseBetAmount,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Category Bar */}
      <div className="flex flex-wrap items-center justify-between bg-[#051a0b]/90 border border-[#b8860b]/40 rounded-xl p-2 px-3 shadow-lg font-sans gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-[#d4af37]">🤖 追打对家监控面板 (玩家B、B-1、B-2)</span>
          {onToggleResetMode && (
            <button
              type="button"
              onClick={onToggleResetMode}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                botTakeProfitResetMode === 'CUMULATIVE'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
              }`}
              title="点击切换止盈重置模式"
            >
              <span className={botTakeProfitResetMode === 'CUMULATIVE' ? 'text-amber-400' : 'text-emerald-400'}>●</span>
              <span>{botTakeProfitResetMode === 'CUMULATIVE' ? '跨靴累计追亏 (模式)' : '单靴独立重置 (模式)'}</span>
            </button>
          )}
        </div>
        <div className="text-xs text-amber-200/70 font-mono">
          共 3 位追打对家 (A连赢3手退出)
        </div>
      </div>

      {/* Grid of Bot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {bots.map((bot) => {
          const st = bot.state;
          const isTakeProfit = bot.takeProfitUnits > 0;
          const targetProfitAmount = bot.takeProfitUnits * bot.chaseBetAmount;
          const currentProfit = st.profitSinceReset ?? 0;

          // Win rate
          const winRate = st.totalChaseHands > 0 ? ((st.chaseWins / st.totalChaseHands) * 100).toFixed(1) : '0.0';
          const isHitTakeProfit = isTakeProfit && currentProfit >= targetProfitAmount;

          return (
            <div
              key={bot.id}
              className={`bg-[#051a0b]/90 border-2 ${
                st.isTakeProfitStopped
                  ? 'border-yellow-400/80 shadow-[0_0_15px_rgba(234,179,8,0.25)]'
                  : st.isChasing
                  ? 'border-amber-500/80 shadow-[0_0_12px_rgba(212,175,55,0.2)]'
                  : 'border-[#b8860b]/40'
              } rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col justify-between font-sans transition-all`}
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#b8860b]/30 pb-2.5 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">🤖</span>
                    <div>
                      <h3 className="font-serif-casino font-bold text-[#d4af37] text-base flex items-center gap-1.5 flex-wrap">
                        {bot.name}
                        {isTakeProfit && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded-full">
                            止盈+{bot.takeProfitUnits}注
                          </span>
                        )}
                        {!isTakeProfit && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full">
                            持续追打(无止盈)
                          </span>
                        )}
                      </h3>
                      <span className="text-[10px] text-amber-200/60 block">
                        规则: 玩家A输1手触发 | {bot.exitRuleText}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block border ${
                        st.isTakeProfitStopped
                          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-400/50'
                          : st.isChasing
                          ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {st.isTakeProfitStopped
                        ? '🎯 止盈停手'
                        : st.isChasing
                        ? '🔥 追打中'
                        : '💤 观望中'}
                    </span>
                  </div>
                </div>

                {/* Bankroll & Action */}
                <div className="flex items-center justify-between bg-black/60 p-2.5 rounded-xl border border-[#b8860b]/30 mb-3">
                  <div>
                    <span className="text-[10px] text-amber-200/60 block">当前资金</span>
                    <span className="text-lg font-mono font-bold text-amber-100">
                      ¥{bot.bankroll.toLocaleString()}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenRecharge(bot.id)}
                    className="px-2.5 py-1 rounded-lg bg-emerald-800/80 hover:bg-emerald-700 text-amber-100 text-[11px] font-bold border border-emerald-500/40 shadow-sm cursor-pointer transition-all"
                  >
                    + 充值资金
                  </button>
                </div>

                {/* Profit Since Reset / Target */}
                {isTakeProfit && (
                  <div className="bg-black/50 p-2.5 rounded-xl border border-yellow-500/30 mb-3 space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-amber-200/70 text-[11px]">
                        {botTakeProfitResetMode === 'CUMULATIVE' ? '累计追亏净利进度:' : '单靴止盈目标进度:'}
                      </span>
                      <span className="font-mono font-bold">
                        <span className={currentProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {currentProfit >= 0 ? `+¥${currentProfit}` : `-¥${Math.abs(currentProfit)}`}
                        </span>
                        <span className="text-amber-200/50 text-[10px]"> / +¥{targetProfitAmount}</span>
                      </span>
                    </div>

                    <div className="w-full bg-black/80 h-2 rounded-full overflow-hidden border border-amber-900/40 relative">
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, (currentProfit / targetProfitAmount) * 100))}%`,
                        }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          isHitTakeProfit ? 'bg-yellow-400' : 'bg-gradient-to-r from-emerald-600 to-yellow-400'
                        }`}
                      />
                    </div>
                  </div>
                )}

                {/* State Progress & Current Bet */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between bg-black/40 p-2 rounded-lg border border-amber-900/30">
                    <span className="text-amber-200/70 text-[11px]">A连赢计数 (退出门槛 {bot.maxConsecutiveWins}手):</span>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: bot.maxConsecutiveWins }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-mono font-bold border ${
                            st.aConsecutiveWins > idx
                              ? 'bg-yellow-400 text-black border-yellow-200'
                              : 'bg-black/60 text-amber-200/30 border-amber-900/40'
                          }`}
                        >
                          {idx + 1}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chase Bet Selection */}
                  <div className="bg-black/40 p-2 rounded-lg border border-amber-900/30">
                    <div className="flex justify-between items-center mb-1 text-[11px]">
                      <span className="text-amber-200/70">固定追注金额:</span>
                      <span className="text-amber-300 font-mono font-bold">¥{bot.chaseBetAmount}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[100, 200, 300, 500, 1000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            const keyMap: Record<string, 'B' | 'B1' | 'B2'> = {
                              B: 'B',
                              'B-1': 'B1',
                              'B-2': 'B2',
                            };
                            onChangeBetAmount(keyMap[bot.id], amt);
                          }}
                          className={`py-0.5 rounded text-[10px] font-mono font-bold cursor-pointer ${
                            bot.chaseBetAmount === amt
                              ? 'bg-[#d4af37] text-black border border-amber-100'
                              : 'bg-black/80 text-amber-200/70 border border-amber-900/40 hover:bg-black'
                          }`}
                        >
                          ¥{amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {aIsExhausted && (
                    <div className="bg-red-950/80 border border-red-500/50 p-1.5 rounded text-red-200 text-[10px] font-medium">
                      ⚠️ A输光，触发固定追打 (¥{bot.chaseBetAmount})
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-black/60 p-2 rounded-lg border border-[#b8860b]/30">
                    <span className="text-amber-200/70 text-[11px]">本手跟注:</span>
                    <span className="font-mono font-bold text-xs">
                      {st.isTakeProfitStopped ? (
                        <span className="text-yellow-300">🎯 已止盈停手</span>
                      ) : bot.currentBet.mainBet === 'PLAYER' ? (
                        <span className="text-blue-400">押闲 ¥{bot.currentBet.mainAmount}</span>
                      ) : bot.currentBet.mainBet === 'BANKER' ? (
                        <span className="text-red-400">押庄 ¥{bot.currentBet.mainAmount}</span>
                      ) : (
                        <span className="text-amber-200/40">不下注 (观望)</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Stat */}
              <div className="mt-3 pt-2 border-t border-[#b8860b]/30 text-[10px] text-amber-200/70 flex items-center justify-between">
                <span>触发: <strong className="text-amber-300 font-mono">{st.totalChasesTriggered}</strong>次</span>
                <span>胜率: <strong className="text-emerald-400 font-mono">{winRate}%</strong> ({st.chaseWins}胜/{st.chaseLosses}负)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
