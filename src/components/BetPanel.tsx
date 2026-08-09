import React, { useState } from 'react';
import { MainBetType, PlayerBet } from '../types';

interface BetPanelProps {
  aBet: PlayerBet;
  aBankroll: number;
  aCumulativeProfit?: number;
  isDealing: boolean;
  enableSideBets: boolean;
  sideBetAmount: number;
  onUpdateBet: (bet: PlayerBet) => void;
  onDeal?: () => void;
  onNewShoe: () => void;
  onResetSession: () => void;
  onOpenRecharge: () => void;
  onOpenSettings: () => void;
}

export const BetPanel: React.FC<BetPanelProps> = ({
  aBet,
  aBankroll,
  aCumulativeProfit,
  isDealing,
  enableSideBets,
  sideBetAmount,
  onUpdateBet,
  onDeal,
  onNewShoe,
  onResetSession,
  onOpenRecharge,
  onOpenSettings,
}) => {
  const [selectedChip, setSelectedChip] = useState<number>(10);
  const [customAmountInput, setCustomAmountInput] = useState<string>('10');

  const chips = [10, 50, 100, 500];

  const handleSelectBetDirection = (direction: MainBetType) => {
    if (isDealing) return;
    if (aBet.mainBet === direction) {
      onUpdateBet({
        ...aBet,
        mainAmount: Math.min(aBankroll, aBet.mainAmount + selectedChip),
      });
    } else {
      onUpdateBet({
        ...aBet,
        mainBet: direction,
        mainAmount: Math.min(aBankroll, selectedChip),
      });
    }
  };

  const handleClearBet = () => {
    if (isDealing) return;
    onUpdateBet({
      mainBet: null,
      mainAmount: 0,
      dragon7Amount: 0,
      panda8Amount: 0,
    });
  };

  const handleToggleDragon7 = () => {
    if (isDealing) return;
    const newAmt = aBet.dragon7Amount > 0 ? 0 : sideBetAmount;
    onUpdateBet({
      ...aBet,
      dragon7Amount: newAmt,
    });
  };

  const handleTogglePanda8 = () => {
    if (isDealing) return;
    const newAmt = aBet.panda8Amount > 0 ? 0 : sideBetAmount;
    onUpdateBet({
      ...aBet,
      panda8Amount: newAmt,
    });
  };

  const handleCustomChipApply = () => {
    const val = parseInt(customAmountInput, 10);
    if (!isNaN(val) && val > 0) {
      setSelectedChip(val);
      if (aBet.mainBet) {
        onUpdateBet({
          ...aBet,
          mainAmount: Math.min(aBankroll, val),
        });
      }
    }
  };

  return (
    <div className="bg-[#051a0b]/90 border-2 border-[#b8860b]/40 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
      {/* Top Controls Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#b8860b]/30">
        <div className="flex items-center space-x-3">
          <span className="text-[#d4af37] font-serif-casino font-bold text-base sm:text-lg">玩家A (我) 操作区</span>
          <div className="text-xs font-sans flex items-center space-x-2">
            <span className="text-amber-100/70">
              资金: <strong className="text-emerald-400 font-mono text-base">¥{aBankroll.toLocaleString()}</strong>
            </span>
            {aCumulativeProfit !== undefined && (
              <span className="text-amber-100/70">
                (累计: <strong className={`font-mono text-sm ${aCumulativeProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {aCumulativeProfit >= 0 ? `+¥${aCumulativeProfit}` : `-¥${Math.abs(aCumulativeProfit)}`}
                </strong>)
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 font-sans">
          <button
            onClick={onOpenRecharge}
            className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm border border-emerald-500/50 transition-all shadow-md touch-manipulation"
          >
            💰 充值
          </button>
          <button
            onClick={onNewShoe}
            disabled={isDealing}
            className="px-3 py-1.5 rounded-lg bg-amber-950 hover:bg-amber-900 disabled:opacity-50 active:scale-95 text-amber-200 font-bold text-xs sm:text-sm border border-[#b8860b]/50 transition-all shadow-md touch-manipulation"
          >
            🔄 换新鞋
          </button>
          <button
            onClick={onOpenSettings}
            className="px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 active:scale-95 text-[#d4af37] font-bold text-xs sm:text-sm border border-[#b8860b]/40 transition-all shadow-md touch-manipulation"
          >
            ⚙️ 设置
          </button>
          <button
            onClick={onResetSession}
            disabled={isDealing}
            className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 disabled:opacity-50 text-red-200 font-bold text-xs sm:text-sm border border-red-500/40 transition-all active:scale-95 touch-manipulation"
            title="清空所有对局走势与统计数据，恢复双方初始资金"
          >
            ⚠️ 一键恢复初始状态
          </button>
        </div>
      </div>

      {/* Main Bet Direction Selection Buttons (Large touch targets for iPad) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 font-sans">
        {/* BET PLAYER BUTTON */}
        <button
          onClick={() => handleSelectBetDirection('PLAYER')}
          disabled={isDealing}
          className={`relative h-20 sm:h-24 rounded-xl border-2 transition-all duration-150 flex flex-col items-center justify-center p-2 shadow-lg active:scale-[0.98] touch-manipulation ${
            aBet.mainBet === 'PLAYER'
              ? 'bg-gradient-to-r from-blue-700 to-blue-600 border-blue-300 shadow-[0_0_20px_rgba(59,130,246,0.6)] text-white'
              : 'bg-black/50 hover:bg-black/70 border-blue-500/40 text-blue-200'
          }`}
        >
          <span className="text-xl sm:text-2xl font-black font-serif-casino tracking-wider">押 闲 PLAYER</span>
          <span className="text-xs sm:text-sm mt-1 opacity-90">
            赔率 1:1 {aBet.mainBet === 'PLAYER' && ` | 已下注: ¥${aBet.mainAmount}`}
          </span>
          {aBet.mainBet === 'PLAYER' && (
            <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-blue-300 animate-ping" />
          )}
        </button>

        {/* BET BANKER BUTTON */}
        <button
          onClick={() => handleSelectBetDirection('BANKER')}
          disabled={isDealing}
          className={`relative h-20 sm:h-24 rounded-xl border-2 transition-all duration-150 flex flex-col items-center justify-center p-2 shadow-lg active:scale-[0.98] touch-manipulation ${
            aBet.mainBet === 'BANKER'
              ? 'bg-gradient-to-r from-red-700 to-red-600 border-red-300 shadow-[0_0_20px_rgba(239,68,68,0.6)] text-white'
              : 'bg-black/50 hover:bg-black/70 border-red-500/40 text-red-200'
          }`}
        >
          <span className="text-xl sm:text-2xl font-black font-serif-casino tracking-wider">押 庄 BANKER</span>
          <span className="text-xs sm:text-sm mt-1 opacity-90">
            赔率 1:1 (免佣不抽水) {aBet.mainBet === 'BANKER' && ` | 已下注: ¥${aBet.mainAmount}`}
          </span>
          {aBet.mainBet === 'BANKER' && (
            <span className="absolute top-2 right-2 w-3 h-3 rounded-full bg-red-300 animate-ping" />
          )}
        </button>
      </div>

      {/* Chip Amount Selectors & Side Bets Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 font-sans">
        {/* Chips selection */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-[#d4af37] font-bold mr-1">筹码:</span>
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => setSelectedChip(chip)}
              className={`w-11 h-11 sm:w-12 sm:h-12 rounded-full font-bold font-mono text-sm border-2 shadow-md transition-transform active:scale-90 touch-manipulation ${
                selectedChip === chip
                  ? 'bg-[#d4af37] text-black border-yellow-200 scale-110 shadow-[0_0_15px_#d4af37]'
                  : 'bg-black/70 text-[#d4af37] border-[#b8860b]/40 hover:border-[#d4af37]'
              }`}
            >
              ¥{chip}
            </button>
          ))}

          {/* Custom chip input */}
          <div className="flex items-center space-x-1 ml-2">
            <input
              type="number"
              min="1"
              max={aBankroll || 10000}
              value={customAmountInput}
              onChange={(e) => setCustomAmountInput(e.target.value)}
              className="w-16 h-10 bg-black/80 border border-[#b8860b]/50 rounded text-amber-300 font-mono text-center text-sm focus:outline-none focus:border-[#d4af37]"
            />
            <button
              onClick={handleCustomChipApply}
              className="px-2.5 py-2 bg-[#b8860b] hover:bg-yellow-500 text-black text-xs rounded font-bold border border-amber-300 transition-colors"
            >
              确定
            </button>
          </div>
        </div>

        {/* Clear Bet Button */}
        <button
          onClick={handleClearBet}
          disabled={isDealing || (!aBet.mainBet && aBet.dragon7Amount === 0 && aBet.panda8Amount === 0)}
          className="px-4 py-2 rounded-lg bg-black/60 hover:bg-black/80 disabled:opacity-40 text-amber-200/80 font-bold text-xs border border-[#b8860b]/40 active:scale-95 touch-manipulation"
        >
          🚫 不下注 / 清空本手
        </button>
      </div>

      {/* Optional Side Bets Row */}
      {enableSideBets && (
        <div className="grid grid-cols-2 gap-3 mb-5 p-3 rounded-xl bg-black/60 border border-[#b8860b]/30 font-sans">
          <button
            onClick={handleToggleDragon7}
            disabled={isDealing}
            className={`p-2.5 rounded-lg border text-xs sm:text-sm font-bold flex items-center justify-between transition-all touch-manipulation ${
              aBet.dragon7Amount > 0
                ? 'bg-[#b8860b]/40 border-amber-400 text-amber-200 shadow-[0_0_12px_#d4af37]'
                : 'bg-black/40 border-amber-900/40 text-amber-200/60 hover:border-[#b8860b]/40'
            }`}
          >
            <span>🐉 龙7 旁注 (40:1)</span>
            <span className="font-mono text-amber-300">{aBet.dragon7Amount > 0 ? `¥${aBet.dragon7Amount}` : '未买'}</span>
          </button>

          <button
            onClick={handleTogglePanda8}
            disabled={isDealing}
            className={`p-2.5 rounded-lg border text-xs sm:text-sm font-bold flex items-center justify-between transition-all touch-manipulation ${
              aBet.panda8Amount > 0
                ? 'bg-blue-600/40 border-blue-400 text-blue-200 shadow-[0_0_12px_#3b82f6]'
                : 'bg-black/40 border-blue-950/40 text-blue-200/60 hover:border-blue-500/40'
            }`}
          >
            <span>🐼 猫8 旁注 (25:1)</span>
            <span className="font-mono text-blue-300">{aBet.panda8Amount > 0 ? `¥${aBet.panda8Amount}` : '未买'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
