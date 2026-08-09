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
      <div className="w-16 h-24 sm:w-20 sm:h-28 md:w-22 md:h-32 border-2 border-dashed border-amber-500/30 rounded-lg flex items-center justify-center bg-black/10">
        {label && <span className="text-xs text-amber-300/40 font-serif uppercase tracking-widest">{label}</span>}
      </div>
    );
  }

  if (faceDown || !card) {
    return (
      <div className="w-16 h-24 sm:w-20 sm:h-28 md:w-22 md:h-32 rounded-lg bg-gradient-to-br from-amber-800 via-amber-950 to-amber-900 border-2 border-amber-400/80 shadow-lg flex items-center justify-center p-1 relative overflow-hidden">
        <div className="w-full h-full border border-amber-400/40 rounded flex items-center justify-center bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:8px_8px]">
          <div className="w-8 h-8 rounded-full border border-amber-300/60 flex items-center justify-center text-amber-300/80 font-serif text-xs font-bold">
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
    <div className="w-16 h-24 sm:w-20 sm:h-28 md:w-22 md:h-32 bg-white rounded-lg border-2 border-amber-200 shadow-xl flex flex-col justify-between p-1.5 sm:p-2 relative select-none transform transition-transform duration-200 hover:-translate-y-1">
      {/* Top Left Rank */}
      <div className={`flex flex-col items-center leading-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="font-bold font-serif text-sm sm:text-base md:text-lg tracking-tighter">{card.rank}</span>
        <span className="text-xs sm:text-sm">{suitSymbols[card.suit]}</span>
      </div>

      {/* Center Giant Suit */}
      <div className={`absolute inset-0 flex items-center justify-center opacity-80 pointer-events-none ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="text-2xl sm:text-3xl md:text-4xl">{suitSymbols[card.suit]}</span>
      </div>

      {/* Bottom Right Rank inverted */}
      <div className={`flex flex-col items-center leading-none rotate-180 ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
        <span className="font-bold font-serif text-sm sm:text-base md:text-lg tracking-tighter">{card.rank}</span>
        <span className="text-xs sm:text-sm">{suitSymbols[card.suit]}</span>
      </div>
    </div>
  );
};
