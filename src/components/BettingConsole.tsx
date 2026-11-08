import React, { useState } from 'react';
import { HandResult, MainBetType, PlayerBet, PlayerBBet } from '../types';

interface BettingConsoleProps {
  isDealing: boolean;
  aBet: PlayerBet;
  bBet: PlayerBBet;
  aBankroll: number;
  enableSideBets: boolean;
  sideBetAmount: number;
  lastHandResult: HandResult | null;
  onDeal: () => void;
  onUpdateBet: (bet: PlayerBet) => void;
  onNewShoe: () => void;
  onResetSession: () => void;
  onOpenSettings: () => void;
}

export const BettingConsole: React.FC<BettingConsoleProps> = ({
  isDealing,
  aBet,
  bBet,
  aBankroll,
  enableSideBets,
  sideBetAmount,
  lastHandResult,
  onDeal,
  onUpdateBet,
  onNewShoe,
  onResetSession,
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
    <div className="bg-[#051a0b]/95 border-2 border-[#b8860b]/50 rounded-xl p-3 shadow-2xl backdrop-blur-md font-sans text-xs text-[#d4af37]">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-[#b8860b]/30">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🎮</span>
          <div>
            <h4 className="font-serif-casino font-bold text-sm text-[#d4af37]">
              玩家A 投注操作台 (Betting Console)
            </h4>
            <span className="text-[10px] text-amber-200/60 block">
              请选择主注方向、筹码与旁注，点击开牌
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 text-[11px] font-mono">
          <span className="text-amber-200/70">可用资金:</span>
          <span className="text-emerald-400 font-bold">¥{aBankroll.toLocaleString()}</span>
        </div>
      </div>

      {/* Row 1: Bet Direction Buttons (闲 / 庄 / 观望) */}
      <div className="grid grid-cols-3 gap-2 mb-2.5">
        {/* Bet PLAYER (闲) */}
        <button
          type="button"
          onClick={() => handleSelectBetDirection('PLAYER')}
          disabled={isDealing}
          className={`py-2 px-1.5 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
            aBet.mainBet === 'PLAYER'
              ? 'bg-blue-600 border-blue-200 text-white shadow-[0_0_15px_rgba(59,130,246,0.8)] scale-[1.02]'
              : 'bg-blue-950/80 border-blue-500/40 text-blue-200 hover:bg-blue-900/90'
          }`}
        >
          <span className="font-serif-casino text-xs sm:text-sm">🔵 下注 闲 (PLAYER)</span>
          <span className="text-[11px] font-mono mt-0.5 text-amber-300 font-bold">
            {aBet.mainBet === 'PLAYER' ? `已押 ¥${aBet.mainAmount}` : `+¥${selectedChip}`}
          </span>
        </button>

        {/* Bet BANKER (庄) */}
        <button
          type="button"
          onClick={() => handleSelectBetDirection('BANKER')}
          disabled={isDealing}
          className={`py-2 px-1.5 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
            aBet.mainBet === 'BANKER'
              ? 'bg-red-600 border-red-200 text-white shadow-[0_0_15px_rgba(239,68,68,0.8)] scale-[1.02]'
              : 'bg-red-950/80 border-red-500/40 text-red-200 hover:bg-red-900/90'
          }`}
        >
          <span className="font-serif-casino text-xs sm:text-sm">🔴 下注 庄 (BANKER)</span>
          <span className="text-[11px] font-mono mt-0.5 text-amber-300 font-bold">
            {aBet.mainBet === 'BANKER' ? `已押 ¥${aBet.mainAmount}` : `+¥${selectedChip}`}
          </span>
        </button>

        {/* Pass / Watch (观望) */}
        <button
          type="button"
          onClick={handleClearBet}
          disabled={isDealing}
          className={`py-2 px-1.5 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
            aBet.mainBet === null
              ? 'bg-amber-900/70 border-amber-300 text-amber-100 shadow-[0_0_12px_rgba(212,175,55,0.4)]'
              : 'bg-black/60 border-amber-900/40 text-amber-200/70 hover:bg-black/80'
          }`}
        >
          <span className="font-serif-casino text-xs sm:text-sm">⚪ 观望 (PASS)</span>
          <span className="text-[10px] mt-0.5 text-amber-200/60 font-sans">不投入本局</span>
        </button>
      </div>

      {/* Row 2: Chip Selector & Side Bets & Clear Action */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#b8860b]/30 pt-2 mb-2.5">
        {/* Quick Chip Preset Buttons */}
        <div className="flex items-center space-x-1.5">
          <span className="text-[11px] text-amber-200/70 font-sans hidden sm:inline">筹码:</span>
          {chips.map((chip) => (
            <button
              key={chip}
              type="button"
              onClick={() => setSelectedChip(chip)}
              className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                selectedChip === chip
                  ? 'bg-[#d4af37] text-black border-amber-100 shadow-md scale-105'
                  : 'bg-black/60 text-amber-200 border-[#b8860b]/30 hover:bg-black'
              }`}
            >
              ¥{chip}
            </button>
          ))}

          {/* Custom Chip Input */}
          <div className="flex items-center space-x-1 ml-0.5">
            <input
              type="number"
              min="1"
              value={customAmountInput}
              onChange={(e) => setCustomAmountInput(e.target.value)}
              onBlur={handleCustomChipApply}
              placeholder="自定义"
              className="w-14 bg-black/80 border border-[#b8860b]/40 rounded-lg px-1 py-0.5 text-amber-300 text-xs font-mono text-center focus:outline-none focus:border-[#d4af37]"
            />
          </div>
        </div>

        {/* Side Bets (Dragon 7 & Panda 8) */}
        {enableSideBets && (
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handleToggleDragon7}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                aBet.dragon7Amount > 0
                  ? 'bg-[#d4af37] text-black border-amber-100 shadow'
                  : 'bg-black/60 text-amber-200/80 border-[#b8860b]/30 hover:bg-black'
              }`}
            >
              🐉 龙7 ({aBet.dragon7Amount > 0 ? `¥${aBet.dragon7Amount}` : `+¥${sideBetAmount}`})
            </button>
            <button
              type="button"
              onClick={handleTogglePanda8}
              className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-all cursor-pointer ${
                aBet.panda8Amount > 0
                  ? 'bg-blue-500 text-white border-blue-200 shadow'
                  : 'bg-black/60 text-blue-200/80 border-blue-900/50 hover:bg-black'
              }`}
            >
              🐼 猫8 ({aBet.panda8Amount > 0 ? `¥${aBet.panda8Amount}` : `+¥${sideBetAmount}`})
            </button>
          </div>
        )}

        {/* Clear Button */}
        {aBet.mainBet !== null && (
          <button
            type="button"
            onClick={handleClearBet}
            className="px-2 py-0.5 rounded-lg bg-red-950/60 text-red-300 text-[11px] border border-red-800/40 hover:bg-red-900/80 transition-all cursor-pointer"
          >
            清空下注
          </button>
        )}
      </div>

      {/* Row 3: Deal Button & Quick Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#b8860b]/30 pt-2.5">
        {/* Quick Action Tools */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={onNewShoe}
            disabled={isDealing}
            className="px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 disabled:opacity-50 text-amber-200 font-bold text-xs border border-amber-600/40 transition-all active:scale-95 cursor-pointer"
          >
            🔄 换新鞋
          </button>
          <button
            onClick={onResetSession}
            disabled={isDealing}
            className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 disabled:opacity-50 text-red-200 font-bold text-xs border border-red-500/40 transition-all active:scale-95 cursor-pointer"
          >
            ⚠️ 恢复初始
          </button>
          <button
            onClick={onOpenSettings}
            className="px-2 py-1.5 rounded-lg bg-black/80 hover:bg-black text-amber-300 font-bold text-xs border border-[#b8860b]/40 transition-all active:scale-95 cursor-pointer"
          >
            ⚙️ 设置
          </button>
        </div>

        {/* Primary 3D Gold Deal Button */}
        <button
          onClick={onDeal}
          disabled={isDealing}
          className="group relative inline-flex items-center justify-center px-6 sm:px-10 py-2 sm:py-2.5 rounded-xl font-serif-casino font-black text-sm sm:text-lg text-black tracking-widest uppercase transition-all duration-75 touch-manipulation select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer
            bg-gradient-to-b from-[#fff5b8] via-[#ffd700] via-40% to-[#b8860b]
            border-2 border-amber-100
            shadow-[0_4px_0_#5c4000,0_8px_15px_rgba(0,0,0,0.6)]
            hover:brightness-110
            active:translate-y-[4px]
            active:shadow-[0_0_0_#5c4000,0_2px_4px_rgba(0,0,0,0.4)]
            active:scale-[0.98]"
        >
          <span className="flex items-center space-x-1.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
            <span>{isDealing ? '⏳ 发牌中...' : '🎴 开 牌 DEAL'}</span>
          </span>
        </button>
      </div>

      {/* Result Display Banner */}
      {lastHandResult && !isDealing && (
        <div className="relative z-10 mt-2.5 p-2 rounded-xl bg-black/85 border border-[#b8860b]/60 flex flex-wrap items-center justify-between gap-1.5 text-xs animate-scale-up font-sans">
          <div className="flex items-center space-x-1.5">
            <span className="text-[#d4af37] font-serif-casino font-bold text-[11px]">结算 #{lastHandResult.handNumber}:</span>
            <span
              className={`px-2 py-0.2 rounded-md font-bold font-serif-casino text-xs ${
                lastHandResult.winner === 'PLAYER'
                  ? 'bg-blue-600 text-white'
                  : lastHandResult.winner === 'BANKER'
                  ? 'bg-red-600 text-white'
                  : 'bg-emerald-600 text-white'
              }`}
            >
              {lastHandResult.winner === 'PLAYER' ? '闲胜' : lastHandResult.winner === 'BANKER' ? '庄胜' : '和局'}
            </span>
            {lastHandResult.isDragon7 && (
              <span className="bg-[#d4af37] text-black px-1.5 py-0.2 rounded font-bold text-[10px]">
                🐉 龙7(40:1)
              </span>
            )}
            {lastHandResult.isPanda8 && (
              <span className="bg-blue-400 text-black px-1.5 py-0.2 rounded font-bold text-[10px]">
                🐼 猫8(25:1)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-mono">
            <div className="flex items-center space-x-1">
              <span className="text-amber-200/80">A:</span>
              <span className={`font-bold ${lastHandResult.aNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {lastHandResult.aNetProfit >= 0 ? `+¥${lastHandResult.aNetProfit}` : `-¥${Math.abs(lastHandResult.aNetProfit)}`}
              </span>
            </div>
            <div className="flex items-center space-x-1 border-l border-[#b8860b]/30 pl-1.5">
              <span className="text-amber-200/80">B:</span>
              <span className={`font-bold ${lastHandResult.bNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {lastHandResult.bNetProfit >= 0 ? `+¥${lastHandResult.bNetProfit}` : `-¥${Math.abs(lastHandResult.bNetProfit)}`}
              </span>
            </div>
            {lastHandResult.aBet.dragon7Amount > 0 && (
              <div className="flex items-center space-x-1 border-l border-[#b8860b]/40 pl-1.5">
                <span className="text-amber-300">🐉:</span>
                <span className={`font-bold ${lastHandResult.isDragon7 ? 'text-yellow-300' : 'text-red-400'}`}>
                  {lastHandResult.isDragon7
                    ? `+¥${lastHandResult.aBet.dragon7Amount * 40}`
                    : `-¥${lastHandResult.aBet.dragon7Amount}`}
                </span>
              </div>
            )}
            {lastHandResult.aBet.panda8Amount > 0 && (
              <div className="flex items-center space-x-1 border-l border-blue-500/40 pl-1.5">
                <span className="text-cyan-300">🐼:</span>
                <span className={`font-bold ${lastHandResult.isPanda8 ? 'text-cyan-300' : 'text-red-400'}`}>
                  {lastHandResult.isPanda8
                    ? `+¥${lastHandResult.aBet.panda8Amount * 25}`
                    : `-¥${lastHandResult.aBet.panda8Amount}`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
