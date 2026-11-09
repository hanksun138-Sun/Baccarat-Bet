import React, { useRef, useEffect } from 'react';
import { BigRoadCell, HandResult } from '../types';
import { buildBigRoad } from '../utils/baccarat';

interface BigRoadProps {
  handResults: HandResult[];
}

export const BigRoad: React.FC<BigRoadProps> = ({ handResults }) => {
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
  }, [handResults.length, bigCells.length]);

  return (
    <div className="bg-[#051a0b]/90 border-2 border-[#b8860b]/40 rounded-xl p-3 shadow-2xl backdrop-blur-md font-sans">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b border-[#b8860b]/30">
        <div className="flex items-center space-x-2">
          <span className="text-[#d4af37] font-serif-casino font-bold text-sm sm:text-base">
            🛣️ 大路走势 (Big Road)
          </span>
          <span className="text-[10px] text-amber-200/60 font-mono">
            红色=庄 | 蓝色=闲 | 绿斜线=和
          </span>
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

      {/* BIG ROAD MATRIX DISPLAY */}
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
  );
};
