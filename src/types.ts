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

  // Player B-1 outcome
  b1Bet?: PlayerBBet;
  b1WasChasing?: boolean;
  b1MainResult?: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET';
  b1NetProfit?: number;
  b1CumulativeProfit?: number;
  b1BankrollAfter?: number;

  // Player B-2 outcome
  b2Bet?: PlayerBBet;
  b2WasChasing?: boolean;
  b2MainResult?: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET';
  b2NetProfit?: number;
  b2CumulativeProfit?: number;
  b2BankrollAfter?: number;

  // Player B-3 outcome (Take Profit +3 units, Stop Loss -5 units)
  b3Bet?: PlayerBBet;
  b3WasChasing?: boolean;
  b3MainResult?: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET';
  b3NetProfit?: number;
  b3CumulativeProfit?: number;
  b3BankrollAfter?: number;

  // Player C outcome
  cBet: PlayerBBet;
  cWasChasing: boolean;
  cMainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET';
  cNetProfit: number;
  cCumulativeProfit?: number;
  cBankrollAfter: number;

  // Player C-1 outcome
  c1Bet?: PlayerBBet;
  c1WasChasing?: boolean;
  c1MainResult?: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET';
  c1NetProfit?: number;
  c1CumulativeProfit?: number;
  c1BankrollAfter?: number;

  // Player C-2 outcome
  c2Bet?: PlayerBBet;
  c2WasChasing?: boolean;
  c2MainResult?: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET';
  c2NetProfit?: number;
  c2CumulativeProfit?: number;
  c2BankrollAfter?: number;

  // Chase State Snapshot After Hand
  bChasingAfter: boolean;
  aConsecutiveWinsAfter: number;
  b1ChasingAfter?: boolean;
  b1TakeProfitStoppedAfter?: boolean;
  b2ChasingAfter?: boolean;
  b2TakeProfitStoppedAfter?: boolean;
  b3ChasingAfter?: boolean;
  b3TakeProfitStoppedAfter?: boolean;
  cChasingAfter: boolean;
  aConsecutiveWinsAfterC: number;
  c1ChasingAfter?: boolean;
  c1TakeProfitStoppedAfter?: boolean;
  c2ChasingAfter?: boolean;
  c2TakeProfitStoppedAfter?: boolean;

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

export interface ShoeRecord {
  shoeNumber: number;
  seed: string;
  totalHands: number;
  aProfit: number;
  bProfit: number;
  b1Profit?: number;
  b2Profit?: number;
  b3Profit?: number;
  cProfit: number;
  c1Profit?: number;
  c2Profit?: number;
  bankerWins: number;
  playerWins: number;
  ties: number;
  dragon7Count: number;
  panda8Count: number;
  aBankrollEnd: number;
  bBankrollEnd: number;
  b1BankrollEnd?: number;
  b2BankrollEnd?: number;
  b3BankrollEnd?: number;
  cBankrollEnd: number;
  c1BankrollEnd?: number;
  c2BankrollEnd?: number;
  timestamp: number;
}

export interface GameSettings {
  cutCardDepth: number; // Default 26
  bChaseBet: number; // Default 200 (Player B normal chase bet amount)
  bPostExhaustionChaseBet: number; // Default 200 (Player B chase bet amount after Player A loses all funds)
  b1ChaseBet?: number; // Default 200 (Player B-1 normal chase bet amount)
  b1PostExhaustionChaseBet?: number;
  b2ChaseBet?: number; // Default 200 (Player B-2 normal chase bet amount)
  b2PostExhaustionChaseBet?: number;
  b3ChaseBet?: number; // Default 200 (Player B-3 normal chase bet amount)
  b3PostExhaustionChaseBet?: number;
  cChaseBet: number; // Default 200 (Player C normal chase bet amount)
  cPostExhaustionChaseBet: number; // Default 200 (Player C chase bet amount after Player A loses all funds)
  c1ChaseBet?: number; // Default 200 (Player C-1 normal chase bet amount)
  c1PostExhaustionChaseBet?: number;
  c2ChaseBet?: number; // Default 200 (Player C-2 normal chase bet amount)
  c2PostExhaustionChaseBet?: number;
  aDefaultBet: number; // Default 10
  aEnableSideBets: boolean; // Side bets enabled
  sideBetAmount: number; // Default 10
  prngSeed: string; // PRNG seed
  botTakeProfitResetMode?: 'ISOLATED_SHOE' | 'CUMULATIVE'; // Default ISOLATED_SHOE (当鞋独立重置 vs 跨鞋累计追亏)
}

export interface PlayerBotState {
  isChasing: boolean;
  aConsecutiveWins: number;
  totalChasesTriggered: number;
  totalChaseHands: number;
  chaseWins: number;
  chaseLosses: number;
  profitSinceReset: number; // Cumulative net profit towards take-profit target
  isTakeProfitStopped: boolean; // True if stopped due to hitting take-profit in current shoe
}

export interface PlayerBState extends PlayerBotState {
  chaseWinsB: number;
  chaseLossesB: number;
}

export interface PlayerCState extends PlayerBotState {
  chaseWinsC: number;
  chaseLossesC: number;
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
  b1MaxBankroll?: number;
  b1MaxDrawdown?: number;
  b2MaxBankroll?: number;
  b2MaxDrawdown?: number;
  b3MaxBankroll?: number;
  b3MaxDrawdown?: number;
  cMaxBankroll: number;
  cMaxDrawdown: number;
  c1MaxBankroll?: number;
  c1MaxDrawdown?: number;
  c2MaxBankroll?: number;
  c2MaxDrawdown?: number;
}

export interface D7Stats {
  d7TotalCount: number;
  aD7SideBetHits: number;
  aD7SideBetPayout: number;
  aD7BankerPushes: number;
  aD7PlayerLosses: number;

  bD7BankerPushes: number;
  bD7PlayerLosses: number;
  bD7NoBets: number;

  b1D7BankerPushes: number;
  b1D7PlayerLosses: number;
  b1D7NoBets: number;

  b2D7BankerPushes: number;
  b2D7PlayerLosses: number;
  b2D7NoBets: number;

  b3D7BankerPushes: number;
  b3D7PlayerLosses: number;
  b3D7NoBets: number;

  cD7BankerPushes: number;
  cD7PlayerLosses: number;
  cD7NoBets: number;

  c1D7BankerPushes: number;
  c1D7PlayerLosses: number;
  c1D7NoBets: number;

  c2D7BankerPushes: number;
  c2D7PlayerLosses: number;
  c2D7NoBets: number;
}

export interface TrendPoint {
  handNumber: number;
  aCum: number;
  bCum: number;
  b1Cum: number;
  b2Cum: number;
  b3Cum: number;
  cCum: number;
  c1Cum: number;
  c2Cum: number;
}

export const initialD7Stats: D7Stats = {
  d7TotalCount: 0,
  aD7SideBetHits: 0,
  aD7SideBetPayout: 0,
  aD7BankerPushes: 0,
  aD7PlayerLosses: 0,
  bD7BankerPushes: 0,
  bD7PlayerLosses: 0,
  bD7NoBets: 0,
  b1D7BankerPushes: 0,
  b1D7PlayerLosses: 0,
  b1D7NoBets: 0,
  b2D7BankerPushes: 0,
  b2D7PlayerLosses: 0,
  b2D7NoBets: 0,
  b3D7BankerPushes: 0,
  b3D7PlayerLosses: 0,
  b3D7NoBets: 0,
  cD7BankerPushes: 0,
  cD7PlayerLosses: 0,
  cD7NoBets: 0,
  c1D7BankerPushes: 0,
  c1D7PlayerLosses: 0,
  c1D7NoBets: 0,
  c2D7BankerPushes: 0,
  c2D7PlayerLosses: 0,
  c2D7NoBets: 0,
};

