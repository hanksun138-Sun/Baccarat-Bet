import React, { useRef, useEffect, useState } from 'react';
import { BigRoadCell, HandResult } from '../types';
import { buildBigRoad } from '../utils/baccarat';

interface BeadRoadCell {
  col: number;
  row: number;
  winner: 'PLAYER' | 'BANKER' | 'TIE';
  handNumber: number;
  isDragon7: boolean;
  isPanda8: boolean;
}

interface BigRoadProps {
  handResults: HandResult[];
}

export const BigRoad: React.FC<BigRoadProps> = ({ handResults }) => {
  const [activeTab, setActiveTab] = useState<'both' | 'big' | 'bead' | 'history'>('both');
  const [showHistoryTable, setShowHistoryTable] = useState<boolean>(true);
  const bigContainerRef = useRef<HTMLDivElement>(null);
  const beadContainerRef = useRef<HTMLDivElement>(null);

  // Calculate Big Road cells
  const bigCells: BigRoadCell[] = buildBigRoad(handResults);
  const maxBigCol = bigCells.reduce((max, c) => Math.max(max, c.col), 0);
  const totalBigCols = Math.max(maxBigCol + 1, 14);

  // Map Big Road cells
  const bigCellMap = new Map<string, BigRoadCell>();
  bigCells.forEach((c) => {
    bigCellMap.set(`${c.col}-${c.row}`, c);
  });

  // Calculate Bead Road cells
  const beadCells: BeadRoadCell[] = handResults.map((hand, idx) => ({
    col: Math.floor(idx / 6),
    row: idx % 6,
    winner: hand.winner,
    handNumber: hand.handNumber,
    isDragon7: hand.isDragon7,
    isPanda8: hand.isPanda8,
  }));
  const maxBeadCol = beadCells.reduce((max, c) => Math.max(max, c.col), 0);
  const totalBeadCols = Math.max(maxBeadCol + 1, 14);

  const beadCellMap = new Map<string, BeadRoadCell>();
  beadCells.forEach((c) => {
    beadCellMap.set(`${c.col}-${c.row}`, c);
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
      if (beadContainerRef.current) {
        beadContainerRef.current.scrollLeft = beadContainerRef.current.scrollWidth;
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [handResults.length, bigCells.length, beadCells.length, activeTab]);

  return (
    <div className="bg-[#051a0b]/90 border-2 border-[#b8860b]/40 rounded-xl p-3 shadow-2xl backdrop-blur-md font-sans">
      {/* Header & Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 pb-2 border-b border-[#b8860b]/30">
        <div className="flex items-center space-x-2">
          <span className="text-[#d4af37] font-serif-casino font-bold text-sm sm:text-base">🛣️ 走势路单 (Road Maps)</span>
          <div className="flex bg-black/60 p-0.5 rounded-lg border border-[#b8860b]/30 text-xs">
            <button
              onClick={() => setActiveTab('both')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                activeTab === 'both' ? 'bg-[#d4af37] text-black shadow' : 'text-amber-200/70 hover:text-white'
              }`}
            >
              全景
            </button>
            <button
              onClick={() => setActiveTab('big')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                activeTab === 'big' ? 'bg-[#d4af37] text-black shadow' : 'text-amber-200/70 hover:text-white'
              }`}
            >
              大路
            </button>
            <button
              onClick={() => setActiveTab('bead')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                activeTab === 'bead' ? 'bg-[#d4af37] text-black shadow' : 'text-amber-200/70 hover:text-white'
              }`}
            >
              珠盘路
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all ${
                activeTab === 'history' ? 'bg-[#d4af37] text-black shadow' : 'text-amber-200/70 hover:text-white'
              }`}
            >
              逐笔记录 ({handResults.length})
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
          <span className="text-amber-200/60 ml-1">总局数: <strong className="text-amber-300">{handResults.length}</strong></span>
        </div>
      </div>

      {/* Road Map Display Grids */}
      <div className="space-y-3">
        {/* BIG ROAD (大路) */}
        {(activeTab === 'both' || activeTab === 'big') && (
          <div>
            <div className="text-[11px] text-amber-200/80 mb-1 flex items-center justify-between">
              <span className="font-bold">📊 大路 (Big Road)</span>
              <span className="text-amber-200/50 text-[10px]">🔴庄 🔵闲 🟢和局/斜线</span>
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
                                {cell.ties > 0 && <span className="text-[8px] text-emerald-400 font-black">{cell.ties}</span>}
                              </div>

                              {/* Tie Green Slash Line */}
                              {cell.ties > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-5 h-0.5 bg-emerald-400 rotate-45 shadow-[0_0_4px_#34d399]" />
                                </div>
                              )}

                              {/* Dragon 7 / Panda 8 Badges */}
                              {cell.isDragon7 && (
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#d4af37] border border-black flex items-center justify-center text-[7px] text-black font-black" title="龙7">
                                  D
                                </span>
                              )}
                              {cell.isPanda8 && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-blue-400 border border-black flex items-center justify-center text-[7px] text-black font-black" title="猫8">
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

        {/* BEAD ROAD (珠盘路) */}
        {(activeTab === 'both' || activeTab === 'bead') && (
          <div>
            <div className="text-[11px] text-amber-200/80 mb-1 flex items-center justify-between">
              <span className="font-bold">🔵🔴 珠盘路 (Bead Road)</span>
              <span className="text-amber-200/50 text-[10px]">顺序发牌走势</span>
            </div>
            <div
              ref={beadContainerRef}
              className="w-full overflow-x-auto custom-scrollbar p-2.5 sm:p-3 bg-black/85 rounded-xl border border-[#b8860b]/40 shadow-inner"
            >
              <div
                className="grid gap-1 select-none w-full"
                style={{
                  gridTemplateColumns: `repeat(${totalBeadCols}, minmax(24px, 1fr))`,
                  gridTemplateRows: `repeat(6, 26px)`,
                }}
              >
                {Array.from({ length: 6 }).map((_, r) => (
                  <React.Fragment key={`bead_row_${r}`}>
                    {Array.from({ length: totalBeadCols }).map((_, c) => {
                      const cellKey = `${c}-${r}`;
                      const cell = beadCellMap.get(cellKey);

                      return (
                        <div
                          key={`bead_${cellKey}`}
                          style={{ gridRowStart: r + 1, gridColumnStart: c + 1 }}
                          className="w-full h-6 rounded border border-white/10 bg-black/50 flex items-center justify-center relative overflow-visible"
                        >
                          {cell && (
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-sm relative ${
                                cell.winner === 'BANKER'
                                  ? 'bg-red-600 border border-red-300 shadow-[0_0_6px_rgba(239,68,68,0.6)]'
                                  : cell.winner === 'PLAYER'
                                  ? 'bg-blue-600 border border-blue-300 shadow-[0_0_6px_rgba(59,130,246,0.6)]'
                                  : 'bg-emerald-600 border border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.6)]'
                              }`}
                            >
                              <span>{cell.winner === 'BANKER' ? '庄' : cell.winner === 'PLAYER' ? '闲' : '和'}</span>
                              {cell.isDragon7 && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#d4af37] border border-black" title="龙7" />
                              )}
                              {cell.isPanda8 && (
                                <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-300 border border-black" title="猫8" />
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

        {/* STEP-BY-STEP HAND HISTORY LOG (逐笔明细记录 - ALWAYS VISIBLE) */}
        <div className="pt-2 border-t border-[#b8860b]/30">
          <div className="flex items-center justify-between text-[11px] text-amber-200/90 mb-1.5">
            <span className="font-bold flex items-center">
              📝 逐笔路单明细记录 (Step-by-Step Hand Log)
              <span className="ml-2 text-[10px] text-amber-200/50 font-normal">
                共 {handResults.length} 手对局
              </span>
            </span>
            <button
              onClick={() => setShowHistoryTable((prev) => !prev)}
              className="text-[10px] text-[#d4af37] hover:underline px-2 py-0.5 rounded bg-black/50 border border-[#b8860b]/30 active:scale-95 transition-transform"
            >
              {showHistoryTable ? '收起明细 ▲' : '展开明细 ▼'}
            </button>
          </div>

          {showHistoryTable && (
            <div className={`w-full overflow-y-auto overflow-x-auto custom-scrollbar bg-black/80 rounded-lg border border-[#b8860b]/30 p-1.5 ${activeTab === 'history' ? 'max-h-[500px]' : 'max-h-64'}`}>
              {handResults.length === 0 ? (
                <div className="text-center py-5 text-xs text-amber-200/50 font-mono">
                  暂无对局明细记录 (点击左侧【开始发牌】或【自动模拟】产生数据)
                </div>
              ) : (
                <table className="w-full text-left text-[11px] font-mono border-collapse min-w-[500px]">
                  <thead>
                    <tr className="border-b border-[#b8860b]/30 text-amber-200/70 text-[10px] bg-amber-950/30 sticky top-0 backdrop-blur-md">
                      <th className="py-1 px-1.5">手数</th>
                      <th className="py-1 px-1.5">结果</th>
                      <th className="py-1 px-1.5">闲 vs 庄 点数持牌</th>
                      <th className="py-1 px-1.5">特殊</th>
                      <th className="py-1 px-1.5">玩家A 押注/盈亏</th>
                      <th className="py-1 px-1.5">玩家B 追打/盈亏</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...handResults].reverse().map((hand) => {
                      const formatCards = (cards: typeof hand.playerCards) => {
                        const suitMap: Record<string, string> = {
                          spades: '♠',
                          hearts: '♥',
                          diamonds: '♦',
                          clubs: '♣',
                        };
                        return cards
                          .map((c) => `${suitMap[c.suit] || ''}${c.rank}`)
                          .join(' ');
                      };

                      return (
                        <tr
                          key={hand.handNumber}
                          className="border-b border-white/5 hover:bg-white/10 transition-colors text-[10px]"
                        >
                          <td className="py-1 px-1.5 font-bold text-amber-300">
                            #{hand.handNumber}
                          </td>
                          <td className="py-1 px-1.5 font-bold">
                            {hand.winner === 'BANKER' ? (
                              <span className="text-red-400 bg-red-950/80 px-1 py-0.5 rounded border border-red-800/50">
                                🔴 庄胜 ({hand.bankerScore}点)
                              </span>
                            ) : hand.winner === 'PLAYER' ? (
                              <span className="text-blue-400 bg-blue-950/80 px-1 py-0.5 rounded border border-blue-800/50">
                                🔵 闲胜 ({hand.playerScore}点)
                              </span>
                            ) : (
                              <span className="text-emerald-400 bg-emerald-950/80 px-1 py-0.5 rounded border border-emerald-800/50">
                                🟢 和局 ({hand.playerScore}点)
                              </span>
                            )}
                          </td>
                          <td className="py-1 px-1.5 text-amber-100/90 whitespace-nowrap">
                            <span className="text-blue-300">
                              闲[{formatCards(hand.playerCards)}]
                            </span>{' '}
                            <span className="text-amber-200/50">vs</span>{' '}
                            <span className="text-red-300">
                              庄[{formatCards(hand.bankerCards)}]
                            </span>
                          </td>
                          <td className="py-1 px-1.5">
                            {hand.isDragon7 ? (
                              <span className="text-amber-300 bg-amber-950/80 px-1 py-0.5 rounded border border-amber-500/40 font-bold">
                                🐉 龙7
                              </span>
                            ) : hand.isPanda8 ? (
                              <span className="text-blue-200 bg-blue-900/80 px-1 py-0.5 rounded border border-blue-400/40 font-bold">
                                🐼 猫8
                              </span>
                            ) : (
                              <span className="text-amber-200/30">-</span>
                            )}
                          </td>
                          <td className="py-1 px-1.5 whitespace-nowrap">
                            {hand.aBet.mainBet ? (
                              <span>
                                {hand.aBet.mainBet === 'PLAYER' ? '闲' : '庄'} ¥
                                {hand.aBet.mainAmount} (
                                <strong
                                  className={
                                    hand.aNetProfit >= 0
                                      ? 'text-emerald-400'
                                      : 'text-red-400'
                                  }
                                >
                                  {hand.aNetProfit >= 0
                                    ? `+¥${hand.aNetProfit}`
                                    : `-¥${Math.abs(hand.aNetProfit)}`}
                                </strong>
                                )
                              </span>
                            ) : (
                              <span className="text-amber-200/40">未押注</span>
                            )}
                          </td>
                          <td className="py-1 px-1.5 whitespace-nowrap">
                            {hand.bBet.mainBet ? (
                              <span>
                                {hand.bBet.mainBet === 'PLAYER' ? '闲' : '庄'} ¥
                                {hand.bBet.mainAmount} (
                                <strong
                                  className={
                                    hand.bNetProfit >= 0
                                      ? 'text-emerald-400'
                                      : 'text-red-400'
                                  }
                                >
                                  {hand.bNetProfit >= 0
                                    ? `+¥${hand.bNetProfit}`
                                    : `-¥${Math.abs(hand.bNetProfit)}`}
                                </strong>
                                )
                              </span>
                            ) : (
                              <span className="text-amber-200/40">观望</span>
                            )}
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

