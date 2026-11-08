import React, { useRef, useEffect, useState } from 'react';
import { BigRoadCell, HandResult } from '../types';
import { buildBigRoad } from '../utils/baccarat';

interface BigRoadProps {
  handResults: HandResult[];
}

export const BigRoad: React.FC<BigRoadProps> = ({ handResults }) => {
  const [activeTab, setActiveTab] = useState<'both' | 'big' | 'history'>('both');
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
          <span className="text-[#d4af37] font-serif-casino font-bold text-sm sm:text-base">🛣️ 大路走势 &amp; 开牌记录</span>
          <div className="flex bg-black/60 p-0.5 rounded-lg border border-[#b8860b]/30 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('both')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                activeTab === 'both' ? 'bg-[#d4af37] text-black shadow' : 'text-amber-200/70 hover:text-white'
              }`}
            >
              全部显示
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
            局数: <strong className="text-amber-300">{handResults.length}</strong>
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {/* BIG ROAD MATRIX DISPLAY */}
        {(activeTab === 'both' || activeTab === 'big') && (
          <div>
            <div className="flex items-center justify-between text-[11px] text-amber-200/80 mb-1">
              <span className="font-bold">经典大路 (Big Road):</span>
              <span className="text-[10px] text-amber-200/60 font-mono">
                红色=庄 | 蓝色=闲 | 绿色斜线=和局 | 数字=连和次数
              </span>
            </div>

            <div
              ref={bigContainerRef}
              className="w-full overflow-x-auto bg-[#031006] p-1.5 rounded-lg border border-[#b8860b]/30 shadow-inner custom-scrollbar"
            >
              <div
                className="grid grid-rows-6 gap-[1.5px] bg-[#0e3b1c]/50 p-1 rounded min-w-max"
                style={{
                  gridTemplateColumns: `repeat(${totalBigCols}, minmax(26px, 1fr))`,
                  width: `${Math.max(totalBigCols * 28, 380)}px`,
                }}
              >
                {Array.from({ length: 6 }).map((_, r) => (
                  <React.Fragment key={`big-row-${r}`}>
                    {Array.from({ length: totalBigCols }).map((__, c) => {
                      const cell = bigCellMap.get(`${c}-${r}`);
                      return (
                        <div
                          key={`big-cell-${c}-${r}`}
                          className="w-[26px] h-[26px] bg-[#051c0d] rounded-sm flex items-center justify-center relative border border-emerald-950/40"
                        >
                          {cell && (
                            <div className="relative w-full h-full flex items-center justify-center">
                              {/* Big Road Hollow Circle */}
                              <div
                                className={`w-[20px] h-[20px] rounded-full border-2 flex items-center justify-center font-bold text-[9px] ${
                                  cell.winner === 'BANKER'
                                    ? 'border-red-500 bg-red-950/40 text-red-300'
                                    : 'border-blue-500 bg-blue-950/40 text-blue-300'
                                }`}
                              >
                                {cell.ties > 1 ? (
                                  <span className="text-emerald-400 font-extrabold text-[9px] scale-90">
                                    {cell.ties}
                                  </span>
                                ) : null}
                              </div>

                              {/* Single Tie Green Slash */}
                              {cell.ties === 1 && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <div className="w-[18px] h-[2px] bg-emerald-400 rotate-45 transform shadow-[0_0_2px_#10b981]" />
                                </div>
                              )}

                              {/* Dragon 7 Gold Indicator Dot */}
                              {cell.isDragon7 && (
                                <div
                                  className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full border border-black shadow"
                                  title="Dragon 7 (庄3张合计7点胜)"
                                />
                              )}

                              {/* Panda 8 Cyan Indicator Dot */}
                              {cell.isPanda8 && (
                                <div
                                  className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full border border-black shadow"
                                  title="Panda 8 (闲3张合计8点胜)"
                                />
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

        {/* STEP-BY-STEP HAND HISTORY LOG (逐笔明细记录) */}
        {(activeTab === 'both' || activeTab === 'history') && (
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
                    暂无对局明细记录 (点击下方【开牌 DEAL】开始游戏)
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
        )}
      </div>
    </div>
  );
};
