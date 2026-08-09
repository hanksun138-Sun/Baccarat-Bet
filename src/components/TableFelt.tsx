import React, { useState } from 'react';
import { CardView } from './CardView';
import { Card, HandResult, MainBetType, PlayerBet, PlayerBBet } from '../types';

interface TableFeltProps {
  playerCards: Card[];
  bankerCards: Card[];
  playerScore: number;
  bankerScore: number;
  isDealing: boolean;
  lastHandResult: HandResult | null;
  aBet: PlayerBet;
  bBet: PlayerBBet;
  burnCard: Card | null;
  burnedCount: number;
  remainingCards: number;
  totalCards: number;
  aBankroll: number;
  aCumulativeProfit?: number;
  enableSideBets: boolean;
  sideBetAmount: number;
  onDeal: () => void;
  onUpdateBet: (bet: PlayerBet) => void;
  onNewShoe: () => void;
  onResetSession: () => void;
  onOpenRecharge: () => void;
  onOpenSettings: () => void;
}

export const TableFelt: React.FC<TableFeltProps> = ({
  playerCards,
  bankerCards,
  playerScore,
  bankerScore,
  isDealing,
  lastHandResult,
  aBet,
  bBet,
  burnCard,
  burnedCount,
  remainingCards,
  aBankroll,
  aCumulativeProfit,
  enableSideBets,
  sideBetAmount,
  onDeal,
  onUpdateBet,
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
    <div className="relative w-full rounded-2xl p-3 sm:p-5 bg-[#074720] border-4 border-[#221a0f] shadow-[inset_0_0_100px_rgba(0,0,0,0.8),0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden font-sans">
      {/* Felt Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
          backgroundSize: '12px 12px',
        }}
      />

      {/* Gold Inner Oval Frame Line */}
      <div className="absolute inset-2 border border-[#b8860b]/40 rounded-xl pointer-events-none" />

      {/* Top Info Bar: Shoe Deck Status, Player A Bankroll & Quick Controls */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-[#b8860b]/30 text-xs font-sans">
        {/* Deck Status */}
        <div className="flex items-center space-x-2 text-amber-200/90">
          <div className="flex items-center space-x-1.5 bg-black/60 px-2.5 py-1 rounded-full border border-[#b8860b]/40">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-amber-100 text-[11px] sm:text-xs">
              牌靴剩余: <strong className="text-amber-300 font-mono text-sm">{remainingCards}</strong> / 416
            </span>
          </div>
          {burnCard && (
            <div className="hidden sm:flex items-center space-x-1.5 bg-black/60 px-2.5 py-1 rounded-full border border-[#b8860b]/30 text-[11px]">
              <span className="text-[#d4af37]">烧牌:</span>
              <span className="font-bold text-white font-mono">{burnCard.rank}{burnCard.suit[0].toUpperCase()}</span>
              <span className="text-amber-200/60">({burnedCount}张)</span>
            </div>
          )}
        </div>

        {/* Casino Branding Header */}
        <div className="text-[#d4af37] font-serif-casino font-bold text-xs sm:text-sm tracking-widest uppercase text-shadow-gold hidden md:block">
          ★ 免佣百家乐 (No Commission) ★
        </div>

        {/* Player A Bankroll & Profit Pill */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-black/70 px-3 py-1 rounded-full border border-emerald-500/40 text-xs">
            <span className="text-emerald-400/90 font-bold">资金:</span>
            <span className="text-emerald-300 font-mono font-bold text-sm">¥{aBankroll.toLocaleString()}</span>
            {aCumulativeProfit !== undefined && (
              <span className="text-[11px] font-mono ml-1">
                (累计: <strong className={aCumulativeProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {aCumulativeProfit >= 0 ? `+¥${aCumulativeProfit}` : `-¥${Math.abs(aCumulativeProfit)}`}
                </strong>)
              </span>
            )}
          </div>
          <button
            onClick={onOpenRecharge}
            className="px-2 py-0.5 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-[11px] border border-emerald-400/50 shadow active:scale-95 transition-all"
          >
            +充值
          </button>
        </div>
      </div>

      {/* Main Table Cards Layout (PLAYER vs BANKER) */}
      <div className="relative z-10 grid grid-cols-2 gap-2 sm:gap-4 my-1">
        {/* PLAYER ZONE (闲 - Blue Theme) */}
        <div className="relative rounded-xl p-3 bg-blue-950/50 border-2 border-blue-500/50 flex flex-col items-center justify-between min-h-[180px] sm:min-h-[200px] shadow-[0_10px_25px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          <div className="w-full flex items-center justify-between border-b border-blue-500/30 pb-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
              <h2 className="text-lg sm:text-2xl font-black font-serif-casino tracking-wider text-blue-300 uppercase">闲 PLAYER</h2>
            </div>
            <div className="bg-blue-900/90 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-blue-400/60 shadow-lg">
              <span className="text-[10px] sm:text-xs text-blue-200 mr-1 font-sans">点数</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {playerCards.length > 0 ? playerScore : '-'}
              </span>
            </div>
          </div>

          {/* Player Cards Display */}
          <div className="flex items-center justify-center space-x-2 my-2 min-h-[100px] sm:min-h-[110px]">
            {playerCards.length === 0 ? (
              <div className="flex space-x-2 opacity-30">
                <CardView label="闲 1" />
                <CardView label="闲 2" />
              </div>
            ) : (
              playerCards.map((card, idx) => (
                <div key={card.id || idx} className="animate-fade-in">
                  <CardView card={card} />
                </div>
              ))
            )}
          </div>

          {/* Current Bet Chips On Player */}
          <div className="w-full flex flex-wrap items-center justify-around gap-1 pt-1.5 border-t border-blue-500/20 text-[11px] sm:text-xs">
            <div className="text-blue-200">
              我下注: <span className="font-bold font-mono text-amber-300">
                {aBet.mainBet === 'PLAYER' ? `¥${aBet.mainAmount}` : '¥0'}
              </span>
            </div>
            <div className="text-blue-200/80">
              对家(B): <span className="font-bold font-mono text-amber-300/80">
                {bBet.mainBet === 'PLAYER' ? `¥${bBet.mainAmount}` : '¥0'}
              </span>
            </div>
          </div>
        </div>

        {/* BANKER ZONE (庄 - Red Theme) */}
        <div className="relative rounded-xl p-3 bg-red-950/50 border-2 border-red-500/50 flex flex-col items-center justify-between min-h-[180px] sm:min-h-[200px] shadow-[0_10px_25px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          <div className="w-full flex items-center justify-between border-b border-red-500/30 pb-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
              <h2 className="text-lg sm:text-2xl font-black font-serif-casino tracking-wider text-red-300 uppercase">庄 BANKER</h2>
            </div>
            <div className="bg-red-900/90 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-red-400/60 shadow-lg">
              <span className="text-[10px] sm:text-xs text-red-200 mr-1 font-sans">点数</span>
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {bankerCards.length > 0 ? bankerScore : '-'}
              </span>
            </div>
          </div>

          {/* Banker Cards Display */}
          <div className="flex items-center justify-center space-x-2 my-2 min-h-[100px] sm:min-h-[110px]">
            {bankerCards.length === 0 ? (
              <div className="flex space-x-2 opacity-30">
                <CardView label="庄 1" />
                <CardView label="庄 2" />
              </div>
            ) : (
              bankerCards.map((card, idx) => (
                <div key={card.id || idx} className="animate-fade-in">
                  <CardView card={card} />
                </div>
              ))
            )}
          </div>

          {/* Current Bet Chips On Banker */}
          <div className="w-full flex flex-wrap items-center justify-around gap-1 pt-1.5 border-t border-red-500/20 text-[11px] sm:text-xs">
            <div className="text-red-200">
              我下注: <span className="font-bold font-mono text-amber-300">
                {aBet.mainBet === 'BANKER' ? `¥${aBet.mainAmount}` : '¥0'}
              </span>
            </div>
            <div className="text-red-200/80">
              对家(B): <span className="font-bold font-mono text-amber-300/80">
                {bBet.mainBet === 'BANKER' ? `¥${bBet.mainAmount}` : '¥0'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Integrated Player A Betting & Deal Console (直接融于主画面的操作控制台) */}
      <div className="relative z-20 mt-3 p-3 bg-black/75 border-2 border-[#b8860b]/50 rounded-xl shadow-2xl backdrop-blur-md">
        {/* Row 1: Bet Direction Buttons (闲 / 庄 / 观望) */}
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          {/* Bet PLAYER (闲) */}
          <button
            type="button"
            onClick={() => handleSelectBetDirection('PLAYER')}
            disabled={isDealing}
            className={`py-2 px-2 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
              aBet.mainBet === 'PLAYER'
                ? 'bg-blue-600 border-blue-200 text-white shadow-[0_0_15px_rgba(59,130,246,0.8)] scale-[1.02]'
                : 'bg-blue-950/80 border-blue-500/40 text-blue-200 hover:bg-blue-900/90'
            }`}
          >
            <span className="font-serif-casino text-sm sm:text-base">🔵 下注 闲 (PLAYER)</span>
            <span className="text-[11px] font-mono mt-0.5 text-amber-300 font-bold">
              {aBet.mainBet === 'PLAYER' ? `已押 ¥${aBet.mainAmount}` : `+¥${selectedChip}`}
            </span>
          </button>

          {/* Bet BANKER (庄) */}
          <button
            type="button"
            onClick={() => handleSelectBetDirection('BANKER')}
            disabled={isDealing}
            className={`py-2 px-2 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
              aBet.mainBet === 'BANKER'
                ? 'bg-red-600 border-red-200 text-white shadow-[0_0_15px_rgba(239,68,68,0.8)] scale-[1.02]'
                : 'bg-red-950/80 border-red-500/40 text-red-200 hover:bg-red-900/90'
            }`}
          >
            <span className="font-serif-casino text-sm sm:text-base">🔴 下注 庄 (BANKER)</span>
            <span className="text-[11px] font-mono mt-0.5 text-amber-300 font-bold">
              {aBet.mainBet === 'BANKER' ? `已押 ¥${aBet.mainAmount}` : `+¥${selectedChip}`}
            </span>
          </button>

          {/* Pass / Watch (观望) */}
          <button
            type="button"
            onClick={handleClearBet}
            disabled={isDealing}
            className={`py-2 px-2 rounded-xl font-bold text-xs sm:text-sm border-2 transition-all active:scale-95 flex flex-col items-center justify-center cursor-pointer ${
              aBet.mainBet === null
                ? 'bg-amber-900/70 border-amber-300 text-amber-100 shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                : 'bg-black/60 border-amber-900/40 text-amber-200/70 hover:bg-black/80'
            }`}
          >
            <span className="font-serif-casino text-sm sm:text-base">⚪ 观望 (PASS)</span>
            <span className="text-[10px] mt-0.5 text-amber-200/60 font-sans">不投入本局</span>
          </button>
        </div>

        {/* Row 2: Chip Selector & Side Bets & Clear Action */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#b8860b]/30 pt-2 mb-2.5">
          {/* Quick Chip Preset Buttons */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] text-amber-200/70 font-sans hidden sm:inline">选择筹码:</span>
            {chips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setSelectedChip(chip)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold border transition-all cursor-pointer ${
                  selectedChip === chip
                    ? 'bg-[#d4af37] text-black border-amber-100 shadow-md scale-105'
                    : 'bg-black/60 text-amber-200 border-[#b8860b]/30 hover:bg-black'
                }`}
              >
                ¥{chip}
              </button>
            ))}

            {/* Custom Chip Input */}
            <div className="flex items-center space-x-1 ml-1">
              <input
                type="number"
                min="1"
                value={customAmountInput}
                onChange={(e) => setCustomAmountInput(e.target.value)}
                onBlur={handleCustomChipApply}
                placeholder="自定义"
                className="w-14 bg-black/80 border border-[#b8860b]/40 rounded-lg px-1.5 py-0.5 text-amber-300 text-xs font-mono text-center focus:outline-none focus:border-[#d4af37]"
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
                🐉 龙7 (+¥{sideBetAmount})
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
                🐼 猫8 (+¥{sideBetAmount})
              </button>
            </div>
          )}

          {/* Clear Button */}
          {aBet.mainBet !== null && (
            <button
              type="button"
              onClick={handleClearBet}
              className="px-2 py-0.5 rounded-lg bg-red-950/60 text-red-300 text-[11px] border border-red-800/40 hover:bg-red-900/80 transition-all"
            >
              清空下注
            </button>
          )}
        </div>

        {/* Row 3: Deal Button & Quick Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#b8860b]/30 pt-2.5">
          {/* Quick Action Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onNewShoe}
              disabled={isDealing}
              className="px-2.5 py-1.5 rounded-lg bg-amber-950/80 hover:bg-amber-900 disabled:opacity-50 text-amber-200 font-bold text-xs border border-amber-600/40 transition-all active:scale-95"
            >
              🔄 换新鞋
            </button>
            <button
              onClick={onResetSession}
              disabled={isDealing}
              className="px-2.5 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 disabled:opacity-50 text-red-200 font-bold text-xs border border-red-500/40 transition-all active:scale-95"
            >
              ⚠️ 一键恢复初始状态
            </button>
          </div>

          {/* Primary 3D Gold Deal Button */}
          <button
            onClick={onDeal}
            disabled={isDealing}
            className="group relative inline-flex items-center justify-center px-6 sm:px-12 py-2 sm:py-2.5 rounded-xl font-serif-casino font-black text-base sm:text-xl text-black tracking-widest uppercase transition-all duration-75 touch-manipulation select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer
              bg-gradient-to-b from-[#fff5b8] via-[#ffd700] via-40% to-[#b8860b]
              border-2 border-amber-100
              shadow-[0_4px_0_#5c4000,0_8px_15px_rgba(0,0,0,0.6)]
              hover:brightness-110
              active:translate-y-[4px]
              active:shadow-[0_0_0_#5c4000,0_2px_4px_rgba(0,0,0,0.4)]
              active:scale-[0.98]"
          >
            <span className="flex items-center space-x-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              <span>{isDealing ? '⏳ 发牌中...' : '🎴 开 牌 DEAL'}</span>
            </span>
          </button>

          {/* Settings Button */}
          <button
            onClick={onOpenSettings}
            className="px-2.5 py-1.5 rounded-lg bg-black/80 hover:bg-black text-amber-300 font-bold text-xs border border-[#b8860b]/40 transition-all active:scale-95"
          >
            ⚙️ 设置
          </button>
        </div>
      </div>

      {/* Result Display Banner */}
      {lastHandResult && !isDealing && (
        <div className="relative z-10 mt-2.5 p-2.5 rounded-xl bg-black/85 border border-[#b8860b]/60 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm animate-scale-up font-sans">
          <div className="flex items-center space-x-2">
            <span className="text-[#d4af37] font-serif-casino font-bold">本手结算 (第{lastHandResult.handNumber}手):</span>
            <span className={`px-2.5 py-0.5 rounded-md font-bold font-serif-casino text-xs sm:text-sm shadow-md ${
              lastHandResult.winner === 'PLAYER'
                ? 'bg-blue-600 text-white'
                : lastHandResult.winner === 'BANKER'
                ? 'bg-red-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {lastHandResult.winner === 'PLAYER' ? '闲 胜' : lastHandResult.winner === 'BANKER' ? '庄 胜' : '和 局'}
            </span>
            {lastHandResult.aMainResult === 'NO_BET' && (
              <span className="bg-slate-700 text-slate-200 px-1.5 py-0.5 rounded font-bold text-[10px] border border-slate-500/40">
                未下注
              </span>
            )}
            {lastHandResult.isDragon7 && (
              <span className="bg-[#d4af37] text-black px-1.5 py-0.5 rounded font-bold text-[10px]">
                🐉 龙7 (40:1)
              </span>
            )}
            {lastHandResult.isPanda8 && (
              <span className="bg-blue-400 text-black px-1.5 py-0.5 rounded font-bold text-[10px]">
                🐼 猫8 (25:1)
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <div className="flex items-center space-x-1">
              <span className="text-amber-200/80">玩家A:</span>
              <span className={`font-mono font-bold ${lastHandResult.aNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {lastHandResult.aNetProfit >= 0 ? `+¥${lastHandResult.aNetProfit}` : `-¥${Math.abs(lastHandResult.aNetProfit)}`}
              </span>
            </div>
            <div className="flex items-center space-x-1 border-l border-[#b8860b]/30 pl-2">
              <span className="text-amber-200/80">玩家B:</span>
              <span className={`font-mono font-bold ${lastHandResult.bNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {lastHandResult.bNetProfit >= 0 ? `+¥${lastHandResult.bNetProfit}` : `-¥${Math.abs(lastHandResult.bNetProfit)}`}
              </span>
            </div>
            {lastHandResult.cNetProfit !== undefined && (
              <div className="flex items-center space-x-1 border-l border-[#b8860b]/30 pl-2">
                <span className="text-amber-200/80">玩家C:</span>
                <span className={`font-mono font-bold ${lastHandResult.cNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {lastHandResult.cNetProfit >= 0 ? `+¥${lastHandResult.cNetProfit}` : `-¥${Math.abs(lastHandResult.cNetProfit)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

