import React, { useState } from 'react';
import { PlayerBBet, PlayerBotState } from '../types';
import { RechargePlayer } from './RechargeModal';

interface BotCardData {
  id: 'B' | 'B-1' | 'B-2' | 'C' | 'C-1' | 'C-2';
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

  cBankroll?: number;
  cState?: PlayerBotState;
  cCurrentBet?: PlayerBBet;
  cChaseBetAmount?: number;

  c1Bankroll?: number;
  c1State?: PlayerBotState;
  c1CurrentBet?: PlayerBBet;
  c1ChaseBetAmount?: number;

  c2Bankroll?: number;
  c2State?: PlayerBotState;
  c2CurrentBet?: PlayerBBet;
  c2ChaseBetAmount?: number;

  aIsExhausted: boolean;
  onOpenRecharge: (player: RechargePlayer) => void;
  onChangeBetAmount: (player: 'B' | 'B1' | 'B2' | 'C' | 'C1' | 'C2', amt: number) => void;
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

  cBankroll = 10000,
  cState,
  cCurrentBet = { mainBet: null, mainAmount: 0 },
  cChaseBetAmount = 200,

  c1Bankroll = 10000,
  c1State,
  c1CurrentBet = { mainBet: null, mainAmount: 0 },
  c1ChaseBetAmount = 200,

  c2Bankroll = 10000,
  c2State,
  c2CurrentBet = { mainBet: null, mainAmount: 0 },
  c2ChaseBetAmount = 200,

  aIsExhausted,
  onOpenRecharge,
  onChangeBetAmount,
}) => {
  const [filterGroup, setFilterGroup] = useState<'ALL' | 'B' | 'C'>('ALL');

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
    {
      id: 'C',
      name: '玩家C',
      exitRuleText: 'A连赢2手退出',
      maxConsecutiveWins: 2,
      takeProfitUnits: 0,
      bankroll: cBankroll,
      state: cState || defaultBotState,
      currentBet: cCurrentBet,
      chaseBetAmount: cChaseBetAmount,
    },
    {
      id: 'C-1',
      name: '玩家C-1',
      exitRuleText: 'A连赢2手退出',
      maxConsecutiveWins: 2,
      takeProfitUnits: 3,
      bankroll: c1Bankroll,
      state: c1State || defaultBotState,
      currentBet: c1CurrentBet,
      chaseBetAmount: c1ChaseBetAmount,
    },
    {
      id: 'C-2',
      name: '玩家C-2',
      exitRuleText: 'A连赢2手退出',
      maxConsecutiveWins: 2,
      takeProfitUnits: 2,
      bankroll: c2Bankroll,
      state: c2State || defaultBotState,
      currentBet: c2CurrentBet,
      chaseBetAmount: c2ChaseBetAmount,
    },
  ];

  const visibleBots = bots.filter((bot) => {
    if (filterGroup === 'B') return bot.id.startsWith('B');
    if (filterGroup === 'C') return bot.id.startsWith('C');
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Category Filter Selector */}
      <div className="flex items-center justify-between bg-[#051a0b]/90 border border-[#b8860b]/40 rounded-xl p-2 px-3 shadow-lg font-sans">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-bold text-[#d4af37]">🤖 追打对家监控面板 (6位对家)</span>
        </div>
        <div className="flex space-x-1.5 text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilterGroup('ALL')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filterGroup === 'ALL'
                ? 'bg-[#d4af37] text-black shadow'
                : 'bg-black/60 text-amber-200/70 hover:bg-black hover:text-amber-100 border border-[#b8860b]/30'
            }`}
          >
            全部对家 (6个)
          </button>
          <button
            type="button"
            onClick={() => setFilterGroup('B')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filterGroup === 'B'
                ? 'bg-[#d4af37] text-black shadow'
                : 'bg-black/60 text-amber-200/70 hover:bg-black hover:text-amber-100 border border-[#b8860b]/30'
            }`}
          >
            B系列 (B, B-1, B-2)
          </button>
          <button
            type="button"
            onClick={() => setFilterGroup('C')}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              filterGroup === 'C'
                ? 'bg-[#d4af37] text-black shadow'
                : 'bg-black/60 text-amber-200/70 hover:bg-black hover:text-amber-100 border border-[#b8860b]/30'
            }`}
          >
            C系列 (C, C-1, C-2)
          </button>
        </div>
      </div>

      {/* Grid of Bot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleBots.map((bot) => {
          const st = bot.state;
          const isTakeProfit = bot.takeProfitUnits > 0;
          const targetProfitAmount = bot.takeProfitUnits * bot.chaseBetAmount;
          const currentProfit = st.profitSinceReset ?? 0;

          // Win rate
          const winRate = st.totalChaseHands > 0 ? ((st.chaseWins / st.totalChaseHands) * 100).toFixed(1) : '0.0';

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
                      <h3 className="font-serif-casino font-bold text-[#d4af37] text-base flex items-center gap-1.5">
                        {bot.name}
                        {isTakeProfit && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 rounded-full">
                            止盈{bot.takeProfitUnits}注
                          </span>
                        )}
                      </h3>
                      <p className="text-[11px] text-amber-100/60 font-sans">
                        A输后追打 | <span className="text-amber-300 font-bold">{bot.exitRuleText}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenRecharge(bot.id)}
                    className="px-2.5 py-1 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-emerald-100 text-[11px] font-bold rounded border border-emerald-500/40 cursor-pointer"
                  >
                    💰 充值
                  </button>
                </div>

                {/* Bankroll & Status Badge */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-black/60 p-2.5 rounded-xl border border-[#b8860b]/30">
                    <span className="text-[10px] text-amber-200/70 block">当前资金</span>
                    <span className="text-lg font-mono font-bold text-emerald-400">¥{bot.bankroll.toLocaleString()}</span>
                  </div>

                  <div
                    className={`p-2.5 rounded-xl border flex flex-col justify-center items-center ${
                      st.isTakeProfitStopped
                        ? 'bg-yellow-950/80 border-yellow-400/90 text-yellow-300'
                        : st.isChasing
                        ? 'bg-amber-950/70 border-amber-500/80 text-amber-300 animate-pulse'
                        : 'bg-black/60 border-[#b8860b]/30 text-emerald-400'
                    }`}
                  >
                    <span className="text-[10px] text-amber-200/70">当前模式</span>
                    <span className="text-xs sm:text-sm font-bold font-serif-casino">
                      {st.isTakeProfitStopped
                        ? '🎯 已止盈 (本靴停手)'
                        : st.isChasing
                        ? '⚡ 追打中'
                        : '👀 观望中'}
                    </span>
                  </div>
                </div>

                {/* Chase Consecutive Win Counter Gauge */}
                <div className="bg-black/60 p-2.5 rounded-xl border border-[#b8860b]/30 mb-3">
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <span className="text-amber-100/90 font-bold">A 连赢计数 ({bot.exitRuleText})</span>
                    <span className="font-mono text-amber-300 font-bold">
                      {st.aConsecutiveWins} / {bot.maxConsecutiveWins}
                    </span>
                  </div>

                  <div className="w-full bg-black/80 rounded-full h-2.5 p-0.5 border border-[#b8860b]/30 flex space-x-1">
                    {Array.from({ length: bot.maxConsecutiveWins }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`flex-1 h-full rounded-full transition-all duration-300 ${
                          st.aConsecutiveWins >= idx + 1
                            ? 'bg-gradient-to-r from-[#b8860b] to-[#d4af37] shadow-[0_0_8px_#d4af37]'
                            : 'bg-black/40'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Take Profit Target Progress Bar (If bot has Take Profit target) */}
                {isTakeProfit && (
                  <div className="bg-black/60 p-2.5 rounded-xl border border-yellow-500/30 mb-3">
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-yellow-200/90 font-bold">止盈目标进度 ({bot.takeProfitUnits}注 = +¥{targetProfitAmount})</span>
                      <span className={`font-mono font-bold ${currentProfit >= targetProfitAmount ? 'text-yellow-300' : currentProfit > 0 ? 'text-emerald-400' : 'text-amber-200/70'}`}>
                        {currentProfit >= 0 ? `+¥${currentProfit}` : `-¥${Math.abs(currentProfit)}`} / +¥{targetProfitAmount}
                      </span>
                    </div>

                    <div className="w-full bg-black/80 rounded-full h-2.5 p-0.5 border border-yellow-500/30 overflow-hidden">
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, (currentProfit / targetProfitAmount) * 100))}%`,
                        }}
                        className={`h-full rounded-full transition-all duration-300 ${
                          currentProfit >= targetProfitAmount
                            ? 'bg-gradient-to-r from-yellow-500 to-amber-300 shadow-[0_0_10px_#f59e0b]'
                            : currentProfit > 0
                            ? 'bg-emerald-500'
                            : 'bg-red-500/50'
                        }`}
                      />
                    </div>
                    <p className="text-[9px] text-amber-200/50 mt-1">
                      * 达标后本靴停止追打，换新鞋重置；未达标跨靴累积。
                    </p>
                  </div>
                )}

                {/* Bet Config & Prediction */}
                <div className="space-y-2 text-xs">
                  <div className="bg-black/60 p-2 rounded-lg border border-[#b8860b]/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-200/70">追打单注金额:</span>
                      <span className="font-mono text-amber-300 font-bold">¥{bot.chaseBetAmount}</span>
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[100, 200, 300, 400, 500].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            const keyMap: Record<string, 'B' | 'B1' | 'B2' | 'C' | 'C1' | 'C2'> = {
                              B: 'B',
                              'B-1': 'B1',
                              'B-2': 'B2',
                              C: 'C',
                              'C-1': 'C1',
                              'C-2': 'C2',
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
