import { Card, CardRank, Dragon7BetMode, Dragon7CountingSystem, HandResult } from '../types';

/**
 * Dragon 7 Card Tag Value
 * Standard Count:
 * 4, 5, 6, 7 = -1
 * 8, 9 = +2
 * Others (A, 2, 3, 10, J, Q, K) = 0
 */
export function getDragon7Tag(rank: CardRank, system: Dragon7CountingSystem = 'STANDARD'): number {
  switch (rank) {
    case '4':
    case '5':
    case '6':
    case '7':
      return -1;
    case '8':
    case '9':
      return 2;
    default:
      return 0; // A, 2, 3, 10, J, Q, K
  }
}

export interface RunningCountDetails {
  rc: number;
  negCardsCount: number; // Count of 4, 5, 6, 7 seen
  posCardsCount: number; // Count of 8, 9 seen
  zeroCardsCount: number; // Count of other cards seen
  totalCardsSeen: number;
}

/**
 * Calculate the current Running Count (RC) for the shoe from all hands and the exposed burn card.
 */
export function calculateDragon7RunningCount(
  handResults: HandResult[],
  burnCard: Card | null,
  system: Dragon7CountingSystem = 'STANDARD'
): RunningCountDetails {
  let rc = 0;
  let negCardsCount = 0;
  let posCardsCount = 0;
  let zeroCardsCount = 0;

  const processCard = (card: Card) => {
    const tag = getDragon7Tag(card.rank, system);
    rc += tag;
    if (tag < 0) negCardsCount++;
    else if (tag > 0) posCardsCount++;
    else zeroCardsCount++;
  };

  // Exposed burn card
  if (burnCard) {
    processCard(burnCard);
  }

  // All hands dealt in the current shoe
  for (const hand of handResults) {
    if (hand.playerCards) {
      for (const card of hand.playerCards) {
        processCard(card);
      }
    }
    if (hand.bankerCards) {
      for (const card of hand.bankerCards) {
        processCard(card);
      }
    }
  }

  return {
    rc,
    negCardsCount,
    posCardsCount,
    zeroCardsCount,
    totalCardsSeen: negCardsCount + posCardsCount + zeroCardsCount,
  };
}

export interface TrueCountDetails {
  rc: number;
  tc: number; // Exact float
  tcDisplay: string; // e.g. "+4.3" or "-1.2"
  remainingCards: number;
  remainingDecks: number; // e.g. 4.2
  playedCards: number;
  penetrationPercent: number; // e.g. 64.5%
}

/**
 * Calculate the True Count (TC)
 * TC = RC / (Remaining Decks)
 * Remaining Decks = remainingCards / 52
 */
export function calculateDragon7TrueCount(rc: number, remainingCards: number, totalShoeCards = 416): TrueCountDetails {
  const safeRemaining = Math.max(1, remainingCards);
  const remainingDecks = safeRemaining / 52;
  const effectiveDecks = Math.max(0.5, remainingDecks);
  const tc = rc / effectiveDecks;
  const playedCards = Math.max(0, totalShoeCards - safeRemaining);
  const penetrationPercent = Math.min(100, Math.max(0, (playedCards / totalShoeCards) * 100));

  const sign = tc > 0.001 ? '+' : '';
  const tcDisplay = `${sign}${tc.toFixed(1)}`;

  return {
    rc,
    tc,
    tcDisplay,
    remainingCards: safeRemaining,
    remainingDecks,
    playedCards,
    penetrationPercent,
  };
}

export interface AdvantageBetAdvice {
  shouldBet: boolean;
  edgePercent: number; // e.g. 2.4%
  suggestedBet: number;
  kellyFraction: number; // e.g. 0.0003
  explanation: string;
}

/**
 * Calculate player expected advantage (Edge) and suggested bet amount
 * Baseline D7 House Edge is approx 7.61%
 * Each +1 TC increases player EV by approx +1.95%
 * Breakeven is approx TC +3.8 ~ +4.0
 */
export function calculateDragon7Advantage(
  tc: number,
  threshold: number,
  betMode: Dragon7BetMode,
  fixedAmount: number,
  bankroll: number
): AdvantageBetAdvice {
  // If TC is below threshold or breakeven, player does not have sufficient edge
  const edgeDecimal = Math.max(0, (tc - 3.8) * 0.0195);
  const edgePercent = edgeDecimal * 100;
  const shouldBet = tc >= threshold;

  if (!shouldBet || bankroll <= 0) {
    return {
      shouldBet: false,
      edgePercent,
      suggestedBet: 0,
      kellyFraction: 0,
      explanation: tc < 3.8 ? '庄家优势中，建议观望' : `真数未达设定阈值 (+${threshold.toFixed(1)})，观望中`,
    };
  }

  let suggestedBet = fixedAmount;
  let kellyFraction = 0;

  if (betMode === 'FIXED') {
    suggestedBet = Math.max(10, fixedAmount);
  } else if (betMode === 'HALF_KELLY' || betMode === 'FULL_KELLY') {
    // Payoff b = 40 (40:1)
    // Full Kelly fraction = Edge / 40
    const fullKelly = edgeDecimal / 40;
    kellyFraction = betMode === 'HALF_KELLY' ? fullKelly / 2 : fullKelly;

    const rawBet = bankroll * kellyFraction;
    // Round to nearest integer (or round to nearest 5 or 10)
    suggestedBet = Math.max(10, Math.round(rawBet / 10) * 10);
  }

  // Ensure bet doesn't exceed 20% of bankroll for safety
  suggestedBet = Math.min(suggestedBet, Math.max(10, Math.floor(bankroll * 0.2)));

  const explanation = `🔥 优势区！预估优势 +${edgePercent.toFixed(2)}%，建议下注 ¥${suggestedBet}`;

  return {
    shouldBet: true,
    edgePercent,
    suggestedBet,
    kellyFraction,
    explanation,
  };
}

export function formatCardsCompact(cards: Card[]): string {
  if (!cards || cards.length === 0) return '-';
  const suitSymbols: Record<string, string> = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
  };
  return cards.map((c) => `${suitSymbols[c.suit] || c.suit[0].toUpperCase()}${c.rank}`).join(' ');
}
