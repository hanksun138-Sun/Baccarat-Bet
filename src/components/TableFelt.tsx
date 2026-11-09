import React from 'react';
import { CardView } from './CardView';
import { Card, PlayerBet, PlayerBBet } from '../types';

interface TableFeltProps {
  playerCards: Card[];
  bankerCards: Card[];
  playerScore: number;
  bankerScore: number;
  isDealing: boolean;
  aBet: PlayerBet;
  bBet: PlayerBBet;
  burnCard: Card | null;
  burnedCount: number;
  remainingCards: number;
  totalCards?: number;
  aBankroll: number;
  aCumulativeProfit?: number;
  onOpenRecharge: () => void;
}

export const TableFelt: React.FC<TableFeltProps> = ({
  playerCards,
  bankerCards,
  playerScore,
  bankerScore,
  isDealing: _isDealing,
  aBet,
  bBet,
  burnCard,
  burnedCount,
  remainingCards,
  totalCards = 416,
  aBankroll,
  aCumulativeProfit,
  onOpenRecharge,
}) => {
  return (
    <div className="relative w-full rounded-xl p-2 sm:p-2.5 bg-[#074720] border-2 sm:border-3 border-[#221a0f] shadow-[inset_0_0_50px_rgba(0,0,0,0.8),0_10px_25px_rgba(0,0,0,0.5)] overflow-hidden font-sans">
      {/* Felt Texture Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `radial-gradient(#fff 1px, transparent 1px)`,
          backgroundSize: '10px 10px',
        }}
      />

      {/* Gold Inner Frame Line */}
      <div className="absolute inset-1 sm:inset-1.5 border border-[#b8860b]/30 rounded-lg pointer-events-none" />

      {/* Top Info Bar: Compact Deck Status, Player A Bankroll & Recharge */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-1.5 mb-1 pb-1 border-b border-[#b8860b]/30 text-[11px] font-sans">
        {/* Deck Status */}
        <div className="flex items-center space-x-1.5 text-amber-200/90">
          <div className="flex items-center space-x-1 bg-black/60 px-2 py-0.5 rounded-full border border-[#b8860b]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-amber-100 text-[10px] sm:text-[11px]">
              剩余: <strong className="text-amber-300 font-mono">{remainingCards}</strong>/{totalCards}
            </span>
          </div>
          {burnCard && (
            <div className="hidden sm:flex items-center space-x-1 bg-black/60 px-2 py-0.5 rounded-full border border-[#b8860b]/30 text-[10px]">
              <span className="text-[#d4af37]">烧牌:</span>
              <span className="font-bold text-white font-mono">{burnCard.rank}{burnCard.suit[0].toUpperCase()}</span>
              <span className="text-amber-200/60">({burnedCount})</span>
            </div>
          )}
        </div>

        {/* Casino Branding Header */}
        <div className="text-[#d4af37] font-serif-casino font-bold text-xs tracking-wider uppercase text-shadow-gold hidden md:block">
          ★ 免佣百家乐对战台面 ★
        </div>

        {/* Player A Bankroll & Profit Pill */}
        <div className="flex items-center space-x-1.5">
          <div className="flex items-center space-x-1.5 bg-black/70 px-2.5 py-0.5 rounded-full border border-emerald-500/40 text-[11px]">
            <span className="text-emerald-400/90 font-bold">资金:</span>
            <span className="text-emerald-300 font-mono font-bold text-xs sm:text-sm">¥{aBankroll.toLocaleString()}</span>
            {aCumulativeProfit !== undefined && (
              <span className="text-[10px] font-mono ml-0.5 hidden xs:inline">
                (
                <strong className={aCumulativeProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {aCumulativeProfit >= 0 ? `+¥${aCumulativeProfit}` : `-¥${Math.abs(aCumulativeProfit)}`}
                </strong>)
              </span>
            )}
          </div>
          <button
            onClick={onOpenRecharge}
            className="px-2 py-0.5 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-white font-bold text-[10px] border border-emerald-400/50 shadow active:scale-95 transition-all cursor-pointer"
          >
            +充值
          </button>
        </div>
      </div>

      {/* Main Table Cards Layout (PLAYER vs BANKER - Ultra Compact Height) */}
      <div className="relative z-10 grid grid-cols-2 gap-1.5 sm:gap-2.5 my-0.5">
        {/* PLAYER ZONE (闲 - Blue Theme) */}
        <div className="relative rounded-lg p-1.5 sm:p-2 bg-blue-950/50 border border-blue-500/50 flex flex-col items-center justify-between min-h-[115px] sm:min-h-[128px] shadow-[0_5px_15px_rgba(0,0,0,0.4)] backdrop-blur-sm">
          <div className="w-full flex items-center justify-between border-b border-blue-500/30 pb-0.5 sm:pb-1">
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
              <h2 className="text-xs sm:text-sm font-black font-serif-casino tracking-wider text-blue-300 uppercase">
                闲 PLAYER
              </h2>
            </div>
            <div className="bg-blue-900/90 px-1.5 sm:px-2 py-0.2 rounded-full border border-blue-400/60 shadow">
              <span className="text-[9px] text-blue-200 mr-1 font-sans">点数</span>
              <span className="text-base sm:text-lg font-black font-mono text-white">
                {playerCards.length > 0 ? playerScore : '-'}
              </span>
            </div>
          </div>

          {/* Player Cards Display */}
          <div className="flex items-center justify-center space-x-1.5 my-0.5 sm:my-1 min-h-[76px] sm:min-h-[88px]">
            {playerCards.length === 0 ? (
              <div className="flex space-x-1.5 opacity-30">
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
          <div className="w-full flex items-center justify-around gap-1 pt-0.5 sm:pt-1 border-t border-blue-500/20 text-[10px]">
            <div className="text-blue-200">
              我:{' '}
              <span className="font-bold font-mono text-amber-300">
                {aBet.mainBet === 'PLAYER' ? `¥${aBet.mainAmount}` : '¥0'}
              </span>
            </div>
            <div className="text-blue-200/80">
              对家:{' '}
              <span className="font-bold font-mono text-amber-300/80">
                {bBet.mainBet === 'PLAYER' ? `¥${bBet.mainAmount}` : '¥0'}
              </span>
            </div>
          </div>
        </div>

        {/* BANKER ZONE (庄 - Red Theme) */}
        <div className="relative rounded-lg p-1.5 sm:p-2 bg-red-950/50 border border-red-500/50 flex flex-col items-center justify-between min-h-[115px] sm:min-h-[128px] shadow-[0_5px_15px_rgba(0,0,0,0.4)] backdrop-blur-sm">
          <div className="w-full flex items-center justify-between border-b border-red-500/30 pb-0.5 sm:pb-1">
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <span className="w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
              <h2 className="text-xs sm:text-sm font-black font-serif-casino tracking-wider text-red-300 uppercase">
                庄 BANKER
              </h2>
            </div>
            <div className="bg-red-900/90 px-1.5 sm:px-2 py-0.2 rounded-full border border-red-400/60 shadow">
              <span className="text-[9px] text-red-200 mr-1 font-sans">点数</span>
              <span className="text-base sm:text-lg font-black font-mono text-white">
                {bankerCards.length > 0 ? bankerScore : '-'}
              </span>
            </div>
          </div>

          {/* Banker Cards Display */}
          <div className="flex items-center justify-center space-x-1.5 my-0.5 sm:my-1 min-h-[76px] sm:min-h-[88px]">
            {bankerCards.length === 0 ? (
              <div className="flex space-x-1.5 opacity-30">
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
          <div className="w-full flex items-center justify-around gap-1 pt-0.5 sm:pt-1 border-t border-red-500/20 text-[10px]">
            <div className="text-red-200">
              我:{' '}
              <span className="font-bold font-mono text-amber-300">
                {aBet.mainBet === 'BANKER' ? `¥${aBet.mainAmount}` : '¥0'}
              </span>
            </div>
            <div className="text-red-200/80">
              对家:{' '}
              <span className="font-bold font-mono text-amber-300/80">
                {bBet.mainBet === 'BANKER' ? `¥${bBet.mainAmount}` : '¥0'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
