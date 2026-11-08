import React, { useRef, useEffect, useState } from 'react';
import {
  BigRoadCell,
  Card,
  Dragon7BetRecord,
  Dragon7Settings,
  HandResult,
  Panda8BetRecord,
  Panda8Settings,
} from '../types';
import { buildBigRoad } from '../utils/baccarat';
import { Dragon7Counter } from './Dragon7Counter';

interface BigRoadProps {
  handResults: HandResult[];
  burnCard?: Card | null;
  burnedCount?: number;
  remainingCards?: number;
  currentD7Bet?: number;
  currentP8Bet?: number;
  isDealing?: boolean;
  d7Settings: Dragon7Settings;
  d7History: Dragon7BetRecord[];
  d7Bankroll: number;
  p8Settings?: Panda8Settings;
  p8History?: Panda8BetRecord[];
  p8Bankroll?: number;
  onUpdateSettings: (newSettings: Dragon7Settings) => void;
  onSetD7Bet: (amount: number) => void;
  onUpdateBankroll: (newBankroll: number) => void;
  onClearHistory: () => void;
  onUpdateP8Settings?: (newSettings: Panda8Settings) => void;
  onSetP8Bet?: (amount: number) => void;
  onUpdateP8Bankroll?: (newBankroll: number) => void;
  onClearP8History?: () => void;
}

export const BigRoad: React.FC<BigRoadProps> = ({
  handResults,
  burnCard = null,
  burnedCount = 0,
  remainingCards = 416,
  currentD7Bet = 0,
  currentP8Bet = 0,
  isDealing = false,
  d7Settings,
  d7History,
  d7Bankroll,
  p8Settings,
  p8History = [],
  p8Bankroll = 10000,
  onUpdateSettings,
  onSetD7Bet,
  onUpdateBankroll,
  onClearHistory,
  onUpdateP8Settings,
  onSetP8Bet,
  onUpdateP8Bankroll,
  onClearP8History,
}) => {
  const [activeTab, setActiveTab] = useState<'both' | 'big' | 'dragon7' | 'history'>('both');
  const [showHistoryTable, setShowHistoryTable] = useState<boolean>(true);
  const bigContainerRef = useRef<HTMLDivElement>(null);

  // Calculate Big Road cells
  const bigCells: BigRoadCell[] = buildBigRoad(handResults);
  const maxBigCol = bigCells.reduce((max, c) => Math.max(max, c.col), 0);
  const totalBigCols = Math.max(maxBigCol + 1, 14);

  // Map Big Road cells
  const bigCellMap = new Map<string, BigRoadCell>();
  bigCells.forEach((c) => {
    bigCellMap.set(`${c.col}-${c.row}`, c);
  });

  // Count summaries
  const bankerWins = handResults.filter((h) => h.winner === 'BANKER').length;
  const playerWins = handResults.filter((h) => h.winner === 'PLAYER').length;
  const tieWins = handResults.filter((h) => h.winner === 'TIE').length;
  const dragon7Count = handResults.filter((h) => h.isDragon7).length;
  const panda8Count = handResults.filter((h) => h.isPanda8).length;

  // Auto scroll to rightmost (newest) columns on update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (bigContainerRef.current) {
        bigContainerRef.current.scrollLeft = bigContainerRef.current.scrollWidth;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [handResults.length, bigCells.length, activeTab]);

  return (
    <div className="bg-[#051a0b]/90 border-2 border-[#b8860b]/40 rounded-xl p-3 shadow-2xl backdrop-blur-md font-sans">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#b8860b]/30">
        <div className="flex items-center space-x-2">
          <span className="text-[#d4af37] font-serif-casino font-bold text-sm sm:text-base">🛣️ 大路走势 & 龙7算牌</span>
          <div className="flex bg-black/60 p-0.5 rounded-lg border border-[#b8860b]/30 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('both')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                activeTab === 'both' ? 'bg-[#d4af37] text-black shadow' : 'text-amber-200/70 hover:text-white'
              }`}
            >
              大路+算牌
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('big')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                activeTab === 'big' ? 'bg-[#d4af37] text-black shadow' : 'text-amber-200/70 hover:text-white'
              }`}
            >
              仅大路
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('dragon7')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1 ${
                activeTab === 'dragon7' ? 'bg-[#d4af37] text-black shadow' : 'text-amber-200/70 hover:text-white'
              }`}
            >
              <span>🐉 龙7算牌</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                activeTab === 'history' ? 'bg-[#d4af37] text-black shadow' : 'text-amber-200/70 hover:text-white'
              }`}
            >
              逐笔开牌 ({handResults.length})
            </button>
          </div>
        </div>

        {/* Counter Summary Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
          <span className="bg-red-950/80 text-red-300 border border-red-600/40 px-2 py-0.5 rounded-md font-bold">
            庄: {bankerWins}
          </span>
          <span className="bg-blue-950/80 text-blue-300 border border-blue-600/40 px-2 py-0.5 rounded-md font-bold">
            闲: {playerWins}
          </span>
          <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 px-2 py-0.5 rounded-md font-bold">
            和: {tieWins}
          </span>
          {dragon7Count > 0 && (
            <span className="bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-md font-bold">
              🐉龙7: {dragon7Count}
            </span>
          )}
          {panda8Count > 0 && (
            <span className="bg-blue-900/80 text-blue-200 border border-blue-400/40 px-2 py-0.5 rounded-md font-bold">
              🐼猫8: {panda8Count}
            </span>
          )}
          <span className="text-amber-200/60 ml-1">
            总局数: <strong className="text-amber-300">{handResults.length}</strong>
          </span>
        </div>
      </div>

      {/* Main Display Grids & Dragon 7 Counter Area */}
      <div className="space-y-3">
        {/* BIG ROAD (大路) */}
        {(activeTab === 'both' || activeTab === 'big') && (
          <div>
            <div className="text-[11px] text-amber-200/80 mb-1 flex items-center justify-between">
              <span className="font-bold">📊 大路 (Big Road)</span>
              <span className="text-amber-200/50 text-[10px]">🔴庄 🔵闲 🟢和局/斜线 🟡D:龙7</span>
            </div>
            <div
              ref={bigContainerRef}
              className="w-full overflow-x-auto custom-scrollbar p-2.5 sm:p-3 bg-black/85 rounded-xl border border-[#b8860b]/40 shadow-inner"
            >
              <div
                className="grid gap-1 select-none w-full"
                style={{
                  gridTemplateColumns: `repeat(${totalBigCols}, minmax(24px, 1fr))`,
                  gridTemplateRows: `repeat(6, 26px)`,
                }}
              >
                {Array.from({ length: 6 }).map((_, r) => (
                  <React.Fragment key={`big_row_${r}`}>
                    {Array.from({ length: totalBigCols }).map((_, c) => {
                      const cellKey = `${c}-${r}`;
                      const cell = bigCellMap.get(cellKey);

                      return (
                        <div
                          key={`big_${cellKey}`}
                          style={{ gridRowStart: r + 1, gridColumnStart: c + 1 }}
                          className="w-full h-6 rounded border border-white/10 bg-black/50 flex items-center justify-center relative overflow-visible"
                        >
                          {cell && (
                            <div className="relative w-6 h-6 flex items-center justify-center">
                              {/* Circle Ring Outcome */}
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center font-mono font-bold text-[9px] ${
                                  cell.winner === 'BANKER'
                                    ? 'border-red-500 text-red-400 bg-red-950/80 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                                    : cell.winner === 'PLAYER'
                                    ? 'border-blue-500 text-blue-400 bg-blue-950/80 shadow-[0_0_6px_rgba(59,130,246,0.6)]'
                                    : 'border-emerald-500 text-emerald-400 bg-emerald-950/80 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                                }`}
                              >
                                {cell.ties > 0 && (
                                  <span className="text-[8px] text-emerald-400 font-black">{cell.ties}</span>
                                )}
                              </div>

                              {/* Tie Green Slash Line */}
                              {cell.ties > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-5 h-0.5 bg-emerald-400 rotate-45 shadow-[0_0_4px_#34d399]" />
                                </div>
                              )}

                              {/* Dragon 7 / Panda 8 Badges */}
                              {cell.isDragon7 && (
                                <span
                                  className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#d4af37] border border-black flex items-center justify-center text-[7px] text-black font-black"
                                  title="龙7"
                                >
                                  D
                                </span>
                              )}
                              {cell.isPanda8 && (
                                <span
                                  className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-400 border border-black flex items-center justify-center text-[7px] text-black font-black"
                                  title="猫8"
                                >
                                  P
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SIDE BETS CARD COUNTING ASSISTANT (龙7与熊猫8双独立算牌系统) */}
        {(activeTab === 'both' || activeTab === 'dragon7') && (
          <div>
            <Dragon7Counter
              handResults={handResults}
              burnCard={burnCard}
              burnedCount={burnedCount}
              remainingCards={remainingCards}
              currentD7Bet={currentD7Bet}
              currentP8Bet={currentP8Bet}
              isDealing={isDealing}
              d7Settings={d7Settings}
              d7History={d7History}
              d7Bankroll={d7Bankroll}
              p8Settings={p8Settings}
              p8History={p8History}
              p8Bankroll={p8Bankroll}
              onUpdateSettings={onUpdateSettings}
              onSetD7Bet={onSetD7Bet}
              onUpdateBankroll={onUpdateBankroll}
              onClearHistory={onClearHistory}
              onUpdateP8Settings={onUpdateP8Settings}
              onSetP8Bet={onSetP8Bet}
              onUpdateP8Bankroll={onUpdateP8Bankroll}
              onClearP8History={onClearP8History}
            />
          </div>
        )}

        {/* STEP-BY-STEP HAND HISTORY LOG (逐笔明细记录) */}
        <div className="pt-2 border-t border-[#b8860b]/30">
          <div className="flex items-center justify-between text-[11px] text-amber-200/90 mb-1.5">
            <span className="font-bold flex items-center">
              📝 逐笔开牌明细记录 (Hand History Log)
              <span className="ml-2 text-[10px] text-amber-200/50 font-normal">
                共 {handResults.length} 手对局
              </span>
            </span>
            <button
              type="button"
              onClick={() => setShowHistoryTable((prev) => !prev)}
              className="text-[10px] text-[#d4af37] hover:underline px-2 py-0.5 rounded bg-black/50 border border-[#b8860b]/30 active:scale-95 transition-transform cursor-pointer"
            >
              {showHistoryTable ? '收起明细 ▲' : '展开明细 ▼'}
            </button>
          </div>

          {showHistoryTable && (
            <div
              className={`w-full overflow-y-auto overflow-x-auto custom-scrollbar bg-black/80 rounded-lg border border-[#b8860b]/30 p-1.5 ${
                activeTab === 'history' ? 'max-h-[500px]' : 'max-h-56'
              }`}
            >
              {handResults.length === 0 ? (
                <div className="text-center py-5 text-xs text-amber-200/50 font-mono">
                  暂无对局明细记录 (点击左侧【开牌 DEAL】或【自动模拟】产生数据)
                </div>
              ) : (
                <table className="w-full text-left text-[11px] font-mono border-collapse min-w-[550px]">
                  <thead>
                    <tr className="border-b border-[#b8860b]/40 text-amber-300 font-bold bg-[#051a0b]/80">
                      <th className="py-1 px-1.5">序号</th>
                      <th className="py-1 px-1.5">胜负</th>
                      <th className="py-1 px-1.5">点数</th>
                      <th className="py-1 px-1.5">特殊牌型</th>
                      <th className="py-1 px-1.5">龙7下注</th>
                      <th className="py-1 px-1.5">猫8下注</th>
                      <th className="py-1 px-1.5">玩家A净利</th>
                      <th className="py-1 px-1.5">玩家B净利</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {handResults
                      .slice()
                      .reverse()
                      .map((hand) => {
                        return (
                          <tr key={hand.handNumber} className="hover:bg-white/5 transition-colors">
                            <td className="py-1 px-1.5 text-amber-200/70 font-mono">
                              #{hand.handNumber}
                            </td>
                            <td className="py-1 px-1.5">
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                  hand.winner === 'BANKER'
                                    ? 'bg-red-950 text-red-400 border border-red-600/40'
                                    : hand.winner === 'PLAYER'
                                    ? 'bg-blue-950 text-blue-400 border border-blue-600/40'
                                    : 'bg-emerald-950 text-emerald-400 border border-emerald-600/40'
                                }`}
                              >
                                {hand.winner === 'BANKER' ? '庄胜' : hand.winner === 'PLAYER' ? '闲胜' : '和局'}
                              </span>
                            </td>
                            <td className="py-1 px-1.5 text-amber-200/90">
                              庄:{hand.bankerScore} 闲:{hand.playerScore}
                            </td>
                            <td className="py-1 px-1.5">
                              {hand.isDragon7 ? (
                                <span className="bg-[#d4af37] text-black px-1.5 py-0.5 rounded font-bold text-[10px]">
                                  🐉 龙7 (40:1)
                                </span>
                              ) : hand.isPanda8 ? (
                                <span className="bg-blue-400 text-black px-1.5 py-0.5 rounded font-bold text-[10px]">
                                  🐼 猫8 (25:1)
                                </span>
                              ) : (
                                <span className="text-zinc-600">-</span>
                              )}
                            </td>
                            <td className="py-1 px-1.5">
                              {hand.aBet.dragon7Amount > 0 ? (
                                <span className={`font-bold ${hand.isDragon7 ? 'text-yellow-400' : 'text-zinc-400'}`}>
                                  ¥{hand.aBet.dragon7Amount} {hand.isDragon7 ? '(中+¥' + (hand.aBet.dragon7Amount * 40) + ')' : ''}
                                </span>
                              ) : (
                                <span className="text-zinc-600">-</span>
                              )}
                            </td>
                            <td className="py-1 px-1.5">
                              {hand.aBet.panda8Amount > 0 ? (
                                <span className={`font-bold ${hand.isPanda8 ? 'text-blue-300' : 'text-zinc-400'}`}>
                                  ¥{hand.aBet.panda8Amount} {hand.isPanda8 ? '(中+¥' + (hand.aBet.panda8Amount * 25) + ')' : ''}
                                </span>
                              ) : (
                                <span className="text-zinc-600">-</span>
                              )}
                            </td>
                            <td
                              className={`py-1 px-1.5 font-bold ${
                                hand.aNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {hand.aNetProfit >= 0 ? `+¥${hand.aNetProfit}` : `-¥${Math.abs(hand.aNetProfit)}`}
                            </td>
                            <td
                              className={`py-1 px-1.5 font-bold ${
                                hand.bNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {hand.bNetProfit >= 0 ? `+¥${hand.bNetProfit}` : `-¥${Math.abs(hand.bNetProfit)}`}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
