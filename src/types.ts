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

  // Chase State Snapshot After Hand
  bChasingAfter: boolean;
  aConsecutiveWinsAfter: number;
  b1ChasingAfter?: boolean;
  b1TakeProfitStoppedAfter?: boolean;
  b2ChasingAfter?: boolean;
  b2TakeProfitStoppedAfter?: boolean;

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
  d7Profit?: number;
  p8Profit?: number;
  bankerWins: number;
  playerWins: number;
  ties: number;
  dragon7Count: number;
  panda8Count: number;
  aBankrollEnd: number;
  bBankrollEnd: number;
  b1BankrollEnd?: number;
  b2BankrollEnd?: number;
  d7BankrollEnd?: number;
  p8BankrollEnd?: number;
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
  d7MaxBankroll?: number;
  d7MaxDrawdown?: number;
  p8MaxBankroll?: number;
  p8MaxDrawdown?: number;
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
}

export interface TrendPoint {
  handNumber: number;
  aCum: number;
  bCum: number;
  b1Cum: number;
  b2Cum: number;
  d7Cum?: number;
  p8Cum?: number;
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
};

// ==================== Dragon 7 (龙7) 算牌辅助系统类型 ====================
export type Dragon7CountingSystem = 'STANDARD' | 'SIMPLE';
export type Dragon7BetMode = 'FIXED' | 'HALF_KELLY' | 'FULL_KELLY';

export interface Dragon7Settings {
  threshold: number; // 默认 +4.0
  betMode: Dragon7BetMode; // 'FIXED' | 'HALF_KELLY' | 'FULL_KELLY'
  fixedUnitAmount: number; // 自定义固定单位下注金额 (默认 100)
  isAutoBetEnabled: boolean; // 是否开启系统自动下注
  initialBankroll: number; // 龙7专职起始资金 (默认 10000)
  countingSystem: Dragon7CountingSystem; // 'STANDARD' (4-7=-1, 8-9=+2)
}

export const defaultDragon7Settings: Dragon7Settings = {
  threshold: 4.0,
  betMode: 'FIXED',
  fixedUnitAmount: 100,
  isAutoBetEnabled: false,
  initialBankroll: 10000,
  countingSystem: 'STANDARD',
};

export interface Dragon7BetRecord {
  id: string;
  handNumber: number; // 会话总手号
  shoeNumber: number; // 牌靴号
  shoeHandNumber: number; // 当前靴内手号
  rc: number; // 跑动计数 (Running Count)
  tc: number; // 真数 (True Count)
  betAmount: number; // 下注金额
  isWin: boolean; // 是否命中龙7
  payout: number; // 派彩 (40:1)
  netProfit: number; // 单手净盈亏 (+40*bet 或 -bet)
  shoeProfitAfter: number; // 结算后当前靴累计盈亏
  cumulativeProfitAfter: number; // 结算后历史总累计盈亏
  bankrollAfter: number; // 结算后龙7专职资金
  bankerCardsStr: string; // 庄家牌型描述 (例如 "♥4 ♦A ♠2 (7点)")
  playerCardsStr: string; // 闲家牌型描述
  isDragon7: boolean;
  timestamp: number;
}

export interface Dragon7AssistantStats {
  totalWagered: number; // 本次会话已用成本
  sessionProfit: number; // 本次会话当前盈亏
  cumulativeProfit: number; // 跨会话累计总盈亏
  currentBankroll: number; // 当前银行roll余额
  totalBets: number; // 总下注手次数
  winBets: number; // 命中次数
  lossBets: number; // 未中次数
  currentShoeProfit: number; // 当牌靴盈亏
}

// ==================== Panda 8 (熊猫8) 算牌辅助系统类型 ====================
export type Panda8BetMode = 'FIXED' | 'HALF_KELLY' | 'FULL_KELLY';

export interface Panda8Settings {
  threshold: number; // 默认 +11.0 (True Count 阈值)
  betMode: Panda8BetMode; // 'FIXED' | 'HALF_KELLY' | 'FULL_KELLY'
  fixedUnitAmount: number; // 自定义固定单位下注金额 (默认 100)
  isAutoBetEnabled: boolean; // 是否开启系统自动下注
  initialBankroll: number; // 熊猫8专职起始资金 (默认 10000)
}

export const defaultPanda8Settings: Panda8Settings = {
  threshold: 11.0,
  betMode: 'FIXED',
  fixedUnitAmount: 100,
  isAutoBetEnabled: false,
  initialBankroll: 10000,
};

export interface Panda8BetRecord {
  id: string;
  handNumber: number; // 会话总手号
  shoeNumber: number; // 牌靴号
  shoeHandNumber: number; // 当前靴内手号
  rc: number; // 跑动计数 (Running Count)
  tc: number; // 真数 (True Count)
  betAmount: number; // 下注金额
  isWin: boolean; // 是否命中熊猫8
  payout: number; // 派彩 (25:1)
  netProfit: number; // 单手净盈亏 (+25*bet 或 -bet)
  shoeProfitAfter: number; // 结算后当前靴累计盈亏
  cumulativeProfitAfter: number; // 结算后历史总累计盈亏
  bankrollAfter: number; // 结算后熊猫8专职资金
  bankerCardsStr: string;
  playerCardsStr: string;
  isPanda8: boolean;
  timestamp: number;
}

export interface Panda8AssistantStats {
  totalWagered: number;
  sessionProfit: number;
  cumulativeProfit: number;
  currentBankroll: number;
  totalBets: number;
  winBets: number;
  lossBets: number;
  currentShoeProfit: number;
}


