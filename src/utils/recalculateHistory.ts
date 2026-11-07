import {
  GameSettings,
  GameStats,
  HandResult,
  PlayerBBet,
  PlayerBotState,
  PlayerBState,
  ShoeRecord,
  TrendPoint,
} from '../types';

export interface RecalculationParams {
  shoeHistory: ShoeRecord[];
  currentHandResults: HandResult[];
  allHandResults: HandResult[];
  settings: GameSettings;
  initialBankrolls?: {
    a?: number;
    b?: number;
    b1?: number;
    b2?: number;
  };
}

export interface RecalculationResult {
  updatedShoeHistory: ShoeRecord[];
  updatedHandResults: HandResult[];
  updatedAllHandResults: HandResult[];
  bankrolls: {
    aBankroll: number;
    bBankroll: number;
    b1Bankroll: number;
    b2Bankroll: number;
  };
  botStates: {
    bState: PlayerBState;
    b1State: PlayerBotState;
    b2State: PlayerBotState;
  };
  trendPoints: TrendPoint[];
  stats: GameStats;
}

interface InternalBotTracker {
  id: string;
  maxWinsToExit: number;
  takeProfitUnits: number;
  betAmount: number;
  bankroll: number;
  isChasing: boolean;
  aConsecutiveWins: number;
  totalChasesTriggered: number;
  totalChaseHands: number;
  chaseWins: number;
  chaseLosses: number;
  profitSinceReset: number;
  isTakeProfitStopped: boolean;
}

/**
 * Re-simulates all historical shoes and hands according to the selected
 * botTakeProfitResetMode ('ISOLATED_SHOE' vs 'CUMULATIVE') and current bet settings for B, B-1, B-2.
 */
export function recalculateFullHistory(params: RecalculationParams): RecalculationResult {
  const {
    shoeHistory,
    currentHandResults,
    allHandResults,
    settings,
    initialBankrolls = {},
  } = params;

  const isIsolated = settings.botTakeProfitResetMode !== 'CUMULATIVE';

  const bBetAmt = settings.bChaseBet || 200;
  const b1BetAmt = settings.b1ChaseBet || 200;
  const b2BetAmt = settings.b2ChaseBet || 200;

  const initA = initialBankrolls.a ?? 1000;
  const initB = initialBankrolls.b ?? 10000;
  const initB1 = initialBankrolls.b1 ?? 10000;
  const initB2 = initialBankrolls.b2 ?? 10000;

  const bots: Record<string, InternalBotTracker> = {
    B: {
      id: 'B',
      maxWinsToExit: 3,
      takeProfitUnits: 0,
      betAmount: bBetAmt,
      bankroll: initB,
      isChasing: false,
      aConsecutiveWins: 0,
      totalChasesTriggered: 0,
      totalChaseHands: 0,
      chaseWins: 0,
      chaseLosses: 0,
      profitSinceReset: 0,
      isTakeProfitStopped: false,
    },
    B1: {
      id: 'B-1',
      maxWinsToExit: 3,
      takeProfitUnits: 3,
      betAmount: b1BetAmt,
      bankroll: initB1,
      isChasing: false,
      aConsecutiveWins: 0,
      totalChasesTriggered: 0,
      totalChaseHands: 0,
      chaseWins: 0,
      chaseLosses: 0,
      profitSinceReset: 0,
      isTakeProfitStopped: false,
    },
    B2: {
      id: 'B-2',
      maxWinsToExit: 3,
      takeProfitUnits: 2,
      betAmount: b2BetAmt,
      bankroll: initB2,
      isChasing: false,
      aConsecutiveWins: 0,
      totalChasesTriggered: 0,
      totalChaseHands: 0,
      chaseWins: 0,
      chaseLosses: 0,
      profitSinceReset: 0,
      isTakeProfitStopped: false,
    },
  };

  let runningBankrollA = initA;
  let maxBankrollA = initA;
  let maxDrawdownA = 0;

  const maxBankrolls: Record<string, number> = {
    B: initB,
    B1: initB1,
    B2: initB2,
  };

  const maxDrawdowns: Record<string, number> = {
    B: 0,
    B1: 0,
    B2: 0,
  };

  const trendPoints: TrendPoint[] = [
    {
      handNumber: 0,
      aCum: 0,
      bCum: 0,
      b1Cum: 0,
      b2Cum: 0,
    },
  ];

  let globalHandIndex = 0;

  const updateStatsForHand = () => {
    maxBankrollA = Math.max(maxBankrollA, runningBankrollA);
    maxDrawdownA = Math.max(maxDrawdownA, maxBankrollA - runningBankrollA);

    for (const key of ['B', 'B1', 'B2']) {
      const b = bots[key];
      maxBankrolls[key] = Math.max(maxBankrolls[key], b.bankroll);
      maxDrawdowns[key] = Math.max(maxDrawdowns[key], maxBankrolls[key] - b.bankroll);
    }
  };

  // Helper to step bots through one hand
  const stepBotsForHand = (
    winner: 'PLAYER' | 'BANKER' | 'TIE',
    aMainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET'
  ): Record<string, { bet: PlayerBBet; netProfit: number; mainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET'; stoppedAfter: boolean }> => {
    const results: Record<string, { bet: PlayerBBet; netProfit: number; mainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET'; stoppedAfter: boolean }> = {};

    for (const key of ['B', 'B1', 'B2']) {
      const bot = bots[key];
      let bet: PlayerBBet = { mainBet: null, mainAmount: 0 };

      if (bot.isChasing && !bot.isTakeProfitStopped) {
        bet = {
          mainBet: 'BANKER',
          mainAmount: bot.betAmount,
        };
      }

      let netProfit = 0;
      let mainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET' = 'NO_BET';

      if (bet.mainAmount > 0) {
        if (winner === 'TIE' || aMainResult === 'PUSH') {
          netProfit = 0;
          mainResult = 'PUSH';
        } else if (aMainResult === 'LOSS') {
          netProfit = bot.betAmount;
          mainResult = 'WIN';
          bot.chaseWins += 1;
          bot.totalChaseHands += 1;
        } else if (aMainResult === 'WIN') {
          netProfit = -bot.betAmount;
          mainResult = 'LOSS';
          bot.chaseLosses += 1;
          bot.totalChaseHands += 1;
        }
      }

      bot.profitSinceReset += netProfit;
      bot.bankroll = Math.max(0, bot.bankroll + netProfit);

      // Check take-profit
      if (bot.takeProfitUnits > 0 && !bot.isTakeProfitStopped) {
        const target = bot.takeProfitUnits * bot.betAmount;
        if (bot.profitSinceReset >= target) {
          bot.isTakeProfitStopped = true;
          bot.isChasing = false;
          bot.aConsecutiveWins = 0;
        }
      }

      // Check exit condition on consecutive wins
      if (bot.isTakeProfitStopped) {
        bot.isChasing = false;
        bot.aConsecutiveWins = 0;
      } else if (!bot.isChasing) {
        if (aMainResult === 'LOSS') {
          bot.isChasing = true;
          bot.aConsecutiveWins = 0;
          bot.totalChasesTriggered += 1;
        }
      } else {
        if (aMainResult === 'WIN') {
          bot.aConsecutiveWins += 1;
          if (bot.aConsecutiveWins >= bot.maxWinsToExit) {
            bot.isChasing = false;
            bot.aConsecutiveWins = 0;
          }
        } else if (aMainResult === 'LOSS') {
          bot.aConsecutiveWins = 0;
        }
      }

      results[key] = {
        bet,
        netProfit,
        mainResult,
        stoppedAfter: bot.isTakeProfitStopped,
      };
    }

    return results;
  };

  // Helper to reset bots between shoes based on the selected mode
  const resetBotsForNewShoe = () => {
    for (const key of ['B', 'B1', 'B2']) {
      const bot = bots[key];
      const reachedTarget = bot.isTakeProfitStopped || (bot.takeProfitUnits > 0 && bot.profitSinceReset >= bot.takeProfitUnits * bot.betAmount);

      bot.isChasing = false;
      bot.aConsecutiveWins = 0;
      bot.isTakeProfitStopped = false;

      if (isIsolated) {
        bot.profitSinceReset = 0;
      } else {
        bot.profitSinceReset = reachedTarget ? 0 : bot.profitSinceReset;
      }
    }
  };

  // 1. Process all completed shoes in shoeHistory
  const updatedShoeHistory: ShoeRecord[] = shoeHistory.map((s, shoeIdx) => {
    if (shoeIdx > 0) {
      resetBotsForNewShoe();
    }

    const shoeNetB = s.bProfit;

    const calcBotShoeNet = (
      botKey: string,
      units: number,
      recordedProfit: number | undefined,
      parentProfit: number
    ) => {
      const bot = bots[botKey];
      const target = units * bot.betAmount;

      if (isIsolated) {
        const profit = recordedProfit !== undefined ? recordedProfit : (parentProfit >= target ? target : parentProfit);
        bot.profitSinceReset = 0;
        bot.bankroll = Math.max(0, bot.bankroll + profit);
        return profit;
      } else {
        const required = target - bot.profitSinceReset;
        if (parentProfit >= required) {
          const profit = required;
          bot.profitSinceReset = 0;
          bot.bankroll = Math.max(0, bot.bankroll + profit);
          return profit;
        } else {
          const profit = parentProfit;
          bot.profitSinceReset += profit;
          bot.bankroll = Math.max(0, bot.bankroll + profit);
          return profit;
        }
      }
    };

    const shoeNetB1 = calcBotShoeNet('B1', 3, isIsolated ? s.b1Profit : undefined, s.bProfit);
    const shoeNetB2 = calcBotShoeNet('B2', 2, isIsolated ? s.b2Profit : undefined, s.bProfit);

    bots.B.bankroll = Math.max(0, bots.B.bankroll + shoeNetB);

    globalHandIndex += s.totalHands || 1;
    updateStatsForHand();

    trendPoints.push({
      handNumber: globalHandIndex,
      aCum: (s.aBankrollEnd || initA) - initA,
      bCum: bots.B.bankroll - initB,
      b1Cum: bots.B1.bankroll - initB1,
      b2Cum: bots.B2.bankroll - initB2,
    });

    runningBankrollA = s.aBankrollEnd ?? runningBankrollA;

    return {
      ...s,
      bProfit: shoeNetB,
      b1Profit: shoeNetB1,
      b2Profit: shoeNetB2,
      bBankrollEnd: bots.B.bankroll,
      b1BankrollEnd: bots.B1.bankroll,
      b2BankrollEnd: bots.B2.bankroll,
    };
  });

  // 2. Process current active shoe (handResults)
  if (shoeHistory.length > 0 && currentHandResults.length > 0) {
    resetBotsForNewShoe();
  }

  const updatedHandResults: HandResult[] = currentHandResults.map((hand) => {
    globalHandIndex += 1;
    const aMainResult = hand.aMainResult || 'NO_BET';
    const res = stepBotsForHand(hand.winner, aMainResult);

    runningBankrollA = hand.aBankrollAfter ?? runningBankrollA;
    updateStatsForHand();

    trendPoints.push({
      handNumber: globalHandIndex,
      aCum: runningBankrollA - initA,
      bCum: bots.B.bankroll - initB,
      b1Cum: bots.B1.bankroll - initB1,
      b2Cum: bots.B2.bankroll - initB2,
    });

    return {
      ...hand,
      bBet: res.B.bet,
      bWasChasing: bots.B.isChasing,
      bMainResult: res.B.mainResult,
      bNetProfit: res.B.netProfit,
      bBankrollAfter: bots.B.bankroll,
      bChasingAfter: bots.B.isChasing,
      aConsecutiveWinsAfter: bots.B.aConsecutiveWins,

      b1Bet: res.B1.bet,
      b1WasChasing: bots.B1.isChasing,
      b1MainResult: res.B1.mainResult,
      b1NetProfit: res.B1.netProfit,
      b1BankrollAfter: bots.B1.bankroll,
      b1TakeProfitStoppedAfter: res.B1.stoppedAfter,
      b1ChasingAfter: bots.B1.isChasing,

      b2Bet: res.B2.bet,
      b2WasChasing: bots.B2.isChasing,
      b2MainResult: res.B2.mainResult,
      b2NetProfit: res.B2.netProfit,
      b2BankrollAfter: bots.B2.bankroll,
      b2TakeProfitStoppedAfter: res.B2.stoppedAfter,
      b2ChasingAfter: bots.B2.isChasing,
    };
  });

  // Downsample trendPoints if large
  let finalTrendPoints = trendPoints;
  if (finalTrendPoints.length > 2000) {
    const first = finalTrendPoints[0];
    const last = finalTrendPoints[finalTrendPoints.length - 1];
    const middle = finalTrendPoints.slice(1, -1).filter((_, idx) => idx % 2 === 0);
    finalTrendPoints = [first, ...middle, last];
  }

  // 3. Assemble Bot States
  const bState: PlayerBState = {
    isChasing: bots.B.isChasing,
    aConsecutiveWins: bots.B.aConsecutiveWins,
    totalChasesTriggered: bots.B.totalChasesTriggered,
    totalChaseHands: bots.B.totalChaseHands,
    chaseWins: bots.B.chaseWins,
    chaseLosses: bots.B.chaseLosses,
    profitSinceReset: bots.B.profitSinceReset,
    isTakeProfitStopped: bots.B.isTakeProfitStopped,
    chaseWinsB: bots.B.chaseWins,
    chaseLossesB: bots.B.chaseLosses,
  };

  const b1State: PlayerBotState = {
    isChasing: bots.B1.isChasing,
    aConsecutiveWins: bots.B1.aConsecutiveWins,
    totalChasesTriggered: bots.B1.totalChasesTriggered,
    totalChaseHands: bots.B1.totalChaseHands,
    chaseWins: bots.B1.chaseWins,
    chaseLosses: bots.B1.chaseLosses,
    profitSinceReset: bots.B1.profitSinceReset,
    isTakeProfitStopped: bots.B1.isTakeProfitStopped,
  };

  const b2State: PlayerBotState = {
    isChasing: bots.B2.isChasing,
    aConsecutiveWins: bots.B2.aConsecutiveWins,
    totalChasesTriggered: bots.B2.totalChasesTriggered,
    totalChaseHands: bots.B2.totalChaseHands,
    chaseWins: bots.B2.chaseWins,
    chaseLosses: bots.B2.chaseLosses,
    profitSinceReset: bots.B2.profitSinceReset,
    isTakeProfitStopped: bots.B2.isTakeProfitStopped,
  };

  const updatedAllHandResults =
    updatedHandResults.length > 0 ? updatedHandResults : allHandResults;

  const stats: GameStats = {
    aTotalHandsBet: globalHandIndex,
    aTotalWins: 0,
    aTotalLosses: 0,
    aTotalPushes: 0,
    aChaseHandsBet: 0,
    aChaseWins: 0,
    aChaseLosses: 0,
    aExhaustedHands: 0,
    aExhaustedWins: 0,
    aExhaustedLosses: 0,
    aMaxBankroll: maxBankrollA,
    aMaxDrawdown: maxDrawdownA,
    bMaxBankroll: maxBankrolls.B,
    bMaxDrawdown: maxDrawdowns.B,
    b1MaxBankroll: maxBankrolls.B1,
    b1MaxDrawdown: maxDrawdowns.B1,
    b2MaxBankroll: maxBankrolls.B2,
    b2MaxDrawdown: maxDrawdowns.B2,
  };

  return {
    updatedShoeHistory,
    updatedHandResults,
    updatedAllHandResults,
    bankrolls: {
      aBankroll: runningBankrollA,
      bBankroll: bots.B.bankroll,
      b1Bankroll: bots.B1.bankroll,
      b2Bankroll: bots.B2.bankroll,
    },
    botStates: {
      bState,
      b1State,
      b2State,
    },
    trendPoints: finalTrendPoints,
    stats,
  };
}
