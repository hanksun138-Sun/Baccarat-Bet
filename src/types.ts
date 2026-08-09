export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs';
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  id: string;
  suit: Suit;
  rank: CardRank;
  value: number; // Point value in Baccarat (A=1, 2-9=2-9, 10/J/Q/K=0)
  burnValue: number; // Value used for burning (A=1, 2-9=2-9, 10/J/Q/K=10)
}

export type MainBetType = 'PLAYER' | 'BANKER' | null;

export interface SideBets {
  dragon7: boolean; // Dragon 7: Banker wins with 3 cards totaling 7 (40:1)
  panda8: boolean;  // Panda 8: Player wins with 3 cards totaling 8 (25:1)
}

export interface PlayerBet {
  mainBet: MainBetType;
  mainAmount: number;
  dragon7Amount: number;
  panda8Amount: number;
}

export interface PlayerBBet {
  mainBet: MainBetType;
  mainAmount: number;
}

export type HandWinner = 'PLAYER' | 'BANKER' | 'TIE';

export interface HandResult {
  handNumber: number;
  shoeHandNumber: number;
  playerCards: Card[];
  bankerCards: Card[];
  playerScore: number;
  bankerScore: number;
  winner: HandWinner;
  isDragon7: boolean; // Banker wins with 3 cards totaling 7
  isPanda8: boolean;  // Player wins with 3 cards totaling 8
  isDragon7Push: boolean; // Banker 3-card 7 win causing Banker main bet PUSH

  // Player A outcome
  aBet: PlayerBet;
  aMainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET';
  aMainPayout: number; // Net profit/loss for main bet
  aSidePayout: number; // Net profit/loss for side bets
  aNetProfit: number;
  aCumulativeProfit?: number;
  aBankrollAfter: number;

  // Player B outcome
  bBet: PlayerBBet;
  bWasChasing: boolean;
  bMainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET';
  bNetProfit: number;
  bCumulativeProfit?: number;
  bBankrollAfter: number;

  // Chase State Snapshot After Hand
  bChasingAfter: boolean;
  aConsecutiveWinsAfter: number;

  // Flag if A's bankroll was 0 before this hand
  aWasExhausted: boolean;

  timestamp: number;
}

export interface BigRoadCell {
  col: number;
  row: number;
  winner: 'PLAYER' | 'BANKER' | 'TIE';
  ties: number;
  isDragon7: boolean;
  isPanda8: boolean;
  isDragon7Push: boolean;
}

export interface GameSettings {
  cutCardDepth: number; // Default 26
  bChaseBet: number; // Default 200 (Player B normal chase bet amount)
  bPostExhaustionChaseBet: number; // Default 200 (Player B chase bet amount after Player A loses all funds)
  aDefaultBet: number; // Default 10
  aEnableSideBets: boolean; // Side bets enabled
  sideBetAmount: number; // Default 10
  prngSeed: string; // PRNG seed
}

export interface PlayerBState {
  isChasing: boolean;
  aConsecutiveWins: number;
  totalChasesTriggered: number;
  totalChaseHands: number;
  chaseWinsB: number;
  chaseLossesB: number;
}

export interface GameStats {
  aTotalHandsBet: number;
  aTotalWins: number;
  aTotalLosses: number;
  aTotalPushes: number;
  
  aChaseHandsBet: number;
  aChaseWins: number;
  aChaseLosses: number;

  aExhaustedHands: number;
  aExhaustedWins: number;
  aExhaustedLosses: number;

  aMaxBankroll: number;
  aMaxDrawdown: number;
  bMaxBankroll: number;
  bMaxDrawdown: number;
}
