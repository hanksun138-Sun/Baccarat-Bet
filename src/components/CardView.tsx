import React from 'react';
import { Card } from '../types';

interface CardViewProps {
  card?: Card;
  faceDown?: boolean;
  label?: string;
}

export const CardView: React.FC<CardViewProps> = ({ card, faceDown = false, label }) => {
  if (!card && !faceDown) {
    return (
      <div className="w-12 h-18 sm:w-14 sm:h-20 md:w-15 md:h-22 border-2 border-dashed border-amber-500/30 rounded-md flex items-center justify-center bg-black/10">
        {label && <span className="text-[10px] sm:text-xs text-amber-300/40 font-serif uppercase tracking-wider">{label}</span>}
      </div>
    );
  }

  if (faceDown || !card) {
    return (
      <div className="w-12 h-18 sm:w-14 sm:h-20 md:w-15 md:h-22 rounded-md bg-gradient-to-br from-amber-800 via-amber-950 to-amber-900 border-2 border-amber-400/80 shadow-md flex items-center justify-center p-0.5 relative overflow-hidden">
        <div className="w-full h-full border border-amber-400/40 rounded flex items-center justify-center bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:6px_6px]">
          <div className="w-6 h-6 rounded-full border border-amber-300/60 flex items-center justify-center text-amber-300/80 font-serif text-[10px] font-bold">
            ★
          </div>
        </div>
      </div>
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitSymbols = {
    spades: '♠',
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
  };

  return (
    <div className="w-12 h-18 sm:w-14 sm:h-20 md:w-15 md:h-22 bg-white rounded-md border-2 border-amber-200 shadow-lg flex flex-col justify-between p-1 sm:p-1.5 relative select-none transform transition-transform duration-200 hover:-translate-y-0.5">
      {/* Top Left Rank */}
      <div className={`flex flex-col items-center leading-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="font-bold font-serif text-xs sm:text-sm tracking-tighter">{card.rank}</span>
        <span className="text-[9px] sm:text-[10px] leading-tight">{suitSymbols[card.suit]}</span>
      </div>

      {/* Center Suit */}
      <div className={`absolute inset-0 flex items-center justify-center opacity-85 pointer-events-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="text-xl sm:text-2xl leading-none">{suitSymbols[card.suit]}</span>
      </div>

      {/* Bottom Right Rank inverted */}
      <div className={`flex flex-col items-center leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="font-bold font-serif text-xs sm:text-sm tracking-tighter">{card.rank}</span>
        <span className="text-[9px] sm:text-[10px] leading-tight">{suitSymbols[card.suit]}</span>
      </div>
    </div>
  );
};
