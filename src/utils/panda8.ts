import { Card, CardRank, HandResult, Panda8BetMode } from '../types';

/**
 * Panda 8 (熊猫8) Card Tag Values
 * Specified system:
 * • A = +1
 * • 2 = +1
 * • 3 = -2
 * • 4 = -2
 * • 5 = -2
 * • 6 = -1
 * • 7 = -1
 * • 8 = -2
 * • 9 = +4
 * • 10, J, Q, K = +1
 */
export function getPanda8Tag(rank: CardRank): number {
  switch (rank) {
    case 'A':
    case '2':
      return 1;
    case '3':
    case '4':
    case '5':
    case '8':
      return -2;
    case '6':
    case '7':
      return -1;
    case '9':
      return 4;
    case '10':
    case 'J':
    case 'Q':
    case 'K':
      return 1;
    default:
      return 0;
  }
}

export interface Panda8RunningCountDetails {
  rc: number;
  plusCardsCount: number; // Cards with positive tag (+1, +4)
  minusCardsCount: number; // Cards with negative tag (-1, -2)
  nineCount: number; // Specific count of 9s (+4)
  totalCardsSeen: number;
}

/**
 * Calculate the current Running Count (RC) for Panda 8 from dealt hands and the burn card.
 */
export function calculatePanda8RunningCount(
  handResults: HandResult[],
  burnCard: Card | null
): Panda8RunningCountDetails {
  let rc = 0;
  let plusCardsCount = 0;
  let minusCardsCount = 0;
  let nineCount = 0;

  const processCard = (card: Card) => {
    const tag = getPanda8Tag(card.rank);
    rc += tag;
    if (tag > 0) plusCardsCount++;
    else if (tag < 0) minusCardsCount++;
    if (card.rank === '9') nineCount++;
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
    plusCardsCount,
    minusCardsCount,
    nineCount,
    totalCardsSeen: plusCardsCount + minusCardsCount,
  };
}

export interface Panda8TrueCountDetails {
  rc: number;
  tc: number; // Float
  tcDisplay: string; // e.g. "+11.5" or "+3.2"
  remainingCards: number;
  remainingDecks: number;
  playedCards: number;
  penetrationPercent: number;
}

/**
 * Calculate True Count for Panda 8
 * TC = RC / (Remaining Decks)
 * Remaining Decks = remainingCards / 52
 */
export function calculatePanda8TrueCount(
  rc: number,
  remainingCards: number,
  totalShoeCards = 416
): Panda8TrueCountDetails {
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

export interface Panda8AdvantageBetAdvice {
  shouldBet: boolean;
  edgePercent: number; // e.g. +6.34%
  suggestedBet: number;
  kellyFraction: number;
  explanation: string;
}

/**
 * Calculate player expected advantage (Edge) and suggested bet for Panda 8
 * Baseline House Edge is ~10.19%
 * Trigger: True Count >= +11 gives approx +6.34% player advantage
 * Payoff: 25:1
 */
export function calculatePanda8Advantage(
  tc: number,
  threshold: number,
  betMode: Panda8BetMode,
  fixedAmount: number,
  bankroll: number
): Panda8AdvantageBetAdvice {
  const shouldBet = tc >= threshold;
  // Edge estimation around threshold: base advantage +6.34% at +11, increasing ~0.8% per TC above 11
  let edgeDecimal = 0;
  if (tc >= 10.0) {
    edgeDecimal = 0.055 + Math.max(0, tc - 10.0) * 0.0084; // ~0.0634 at +11.0
  }
  const edgePercent = edgeDecimal * 100;

  if (!shouldBet || bankroll <= 0) {
    return {
      shouldBet: false,
      edgePercent,
      suggestedBet: 0,
      kellyFraction: 0,
      explanation: tc < 10.0 ? '庄家优势中，建议观望' : `真数未达熊猫8触发阈值 (+${threshold.toFixed(1)})，观望中`,
    };
  }

  let suggestedBet = fixedAmount;
  let kellyFraction = 0;

  if (betMode === 'FIXED') {
    suggestedBet = Math.max(10, fixedAmount);
  } else if (betMode === 'HALF_KELLY' || betMode === 'FULL_KELLY') {
    // Payoff b = 25 (25:1)
    // Full Kelly fraction = Edge / 25
    const fullKelly = edgeDecimal / 25;
    kellyFraction = betMode === 'HALF_KELLY' ? fullKelly / 2 : fullKelly;

    const rawBet = bankroll * kellyFraction;
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
