import React, { useState } from 'react';
import { HandResult } from '../types';

interface HandHistoryLogProps {
  handResults: HandResult[];
}

export const HandHistoryLog: React.FC<HandHistoryLogProps> = ({ handResults }) => {
  const [showHistoryTable, setShowHistoryTable] = useState<boolean>(true);

  return (
    <div className="bg-[#051a0b]/90 border-2 border-[#b8860b]/40 rounded-xl p-3 shadow-2xl backdrop-blur-md font-sans">
      {/* Header with Collapse Button */}
      <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#b8860b]/30">
        <div className="flex items-center space-x-2">
          <span className="text-base">📝</span>
          <div>
            <h4 className="font-serif-casino font-bold text-xs sm:text-sm text-[#d4af37]">
              逐笔开牌明细记录 (Hand History Log)
            </h4>
            <span className="text-[10px] text-amber-200/60 font-mono">
              已记录 {handResults.length} 手对局
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowHistoryTable((prev) => !prev)}
          className="text-[10px] text-[#d4af37] hover:underline px-2.5 py-1 rounded bg-black/60 border border-[#b8860b]/40 active:scale-95 transition-transform cursor-pointer font-bold"
        >
          {showHistoryTable ? '收起明细 ▲' : '展开明细 ▼'}
        </button>
      </div>

      {/* Collapsible History Table */}
      {showHistoryTable && (
        <div className="w-full overflow-y-auto overflow-x-auto custom-scrollbar bg-black/80 rounded-lg border border-[#b8860b]/30 p-1.5 max-h-60 sm:max-h-72">
          {handResults.length === 0 ? (
            <div className="text-center py-6 text-xs text-amber-200/50 font-mono">
              暂无对局明细记录 (点击上方【开牌 DEAL】开始游戏)
            </div>
          ) : (
            <table className="w-full text-left text-[11px] font-mono border-collapse min-w-[550px]">
              <thead>
                <tr className="border-b border-[#b8860b]/40 text-amber-300 font-bold bg-[#051a0b]/80 sticky top-0 z-10">
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
                  .map((hand) => (
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
                  ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};
