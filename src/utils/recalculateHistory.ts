import {
  Card,
  GameSettings,
  GameStats,
  HandResult,
  PlayerBBet,
  PlayerBotState,
  PlayerBState,
  PlayerCState,
  ShoeRecord,
  TrendPoint,
} from '../types';
import {
  calculateHandScore,
  createEightDecks,
  dealHand,
  mulberry32,
  shuffleDeck,
  stringToSeed,
} from './baccarat';

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
    b3?: number;
    c?: number;
    c1?: number;
    c2?: number;
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
    b3Bankroll: number;
    cBankroll: number;
    c1Bankroll: number;
    c2Bankroll: number;
  };
  botStates: {
    bState: PlayerBState;
    b1State: PlayerBotState;
    b2State: PlayerBotState;
    b3State: PlayerBotState;
    cState: PlayerCState;
    c1State: PlayerBotState;
    c2State: PlayerBotState;
  };
  trendPoints: TrendPoint[];
  stats: GameStats;
}

interface InternalBotTracker {
  id: string;
  maxWinsToExit: number;
  takeProfitUnits: number;
  stopLossUnits?: number;
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
 * botTakeProfitResetMode ('ISOLATED_SHOE' vs 'CUMULATIVE') and current bet settings.
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
  const b3BetAmt = settings.b3ChaseBet || 200;
  const cBetAmt = settings.cChaseBet || 200;
  const c1BetAmt = settings.c1ChaseBet || 200;
  const c2BetAmt = settings.c2ChaseBet || 200;

  const initA = initialBankrolls.a ?? 1000;
  const initB = initialBankrolls.b ?? 10000;
  const initB1 = initialBankrolls.b1 ?? 10000;
  const initB2 = initialBankrolls.b2 ?? 10000;
  const initB3 = initialBankrolls.b3 ?? 10000;
  const initC = initialBankrolls.c ?? 10000;
  const initC1 = initialBankrolls.c1 ?? 10000;
  const initC2 = initialBankrolls.c2 ?? 10000;

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
    B3: {
      id: 'B-3',
      maxWinsToExit: 3,
      takeProfitUnits: 4,
      betAmount: b3BetAmt,
      bankroll: initB3,
      isChasing: false,
      aConsecutiveWins: 0,
      totalChasesTriggered: 0,
      totalChaseHands: 0,
      chaseWins: 0,
      chaseLosses: 0,
      profitSinceReset: 0,
      isTakeProfitStopped: false,
    },
    C: {
      id: 'C',
      maxWinsToExit: 2,
      takeProfitUnits: 0,
      betAmount: cBetAmt,
      bankroll: initC,
      isChasing: false,
      aConsecutiveWins: 0,
      totalChasesTriggered: 0,
      totalChaseHands: 0,
      chaseWins: 0,
      chaseLosses: 0,
      profitSinceReset: 0,
      isTakeProfitStopped: false,
    },
    C1: {
      id: 'C-1',
      maxWinsToExit: 2,
      takeProfitUnits: 3,
      betAmount: c1BetAmt,
      bankroll: initC1,
      isChasing: false,
      aConsecutiveWins: 0,
      totalChasesTriggered: 0,
      totalChaseHands: 0,
      chaseWins: 0,
      chaseLosses: 0,
      profitSinceReset: 0,
      isTakeProfitStopped: false,
    },
    C2: {
      id: 'C-2',
      maxWinsToExit: 2,
      takeProfitUnits: 2,
      betAmount: c2BetAmt,
      bankroll: initC2,
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
    B3: initB3,
    C: initC,
    C1: initC1,
    C2: initC2,
  };

  const maxDrawdowns: Record<string, number> = {
    B: 0,
    B1: 0,
    B2: 0,
    B3: 0,
    C: 0,
    C1: 0,
    C2: 0,
  };

  const trendPoints: TrendPoint[] = [
    {
      handNumber: 0,
      aCum: 0,
      bCum: 0,
      b1Cum: 0,
      b2Cum: 0,
      b3Cum: 0,
      cCum: 0,
      c1Cum: 0,
      c2Cum: 0,
    },
  ];

  let globalHandIndex = 0;

  const updateStatsForHand = () => {
    maxBankrollA = Math.max(maxBankrollA, runningBankrollA);
    maxDrawdownA = Math.max(maxDrawdownA, maxBankrollA - runningBankrollA);

    for (const key of ['B', 'B1', 'B2', 'B3', 'C', 'C1', 'C2']) {
      const b = bots[key];
      maxBankrolls[key] = Math.max(maxBankrolls[key], b.bankroll);
      maxDrawdowns[key] = Math.max(maxDrawdowns[key], maxBankrolls[key] - b.bankroll);
    }
  };

  // Helper to step all bots through one hand
  const stepBotsForHand = (
    winner: 'PLAYER' | 'BANKER' | 'TIE',
    aMainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET'
  ): Record<string, { bet: PlayerBBet; netProfit: number; mainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET'; stoppedAfter: boolean }> => {
    const results: Record<string, { bet: PlayerBBet; netProfit: number; mainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET'; stoppedAfter: boolean }> = {};

    for (const key of ['B', 'B1', 'B2', 'B3', 'C', 'C1', 'C2']) {
      const bot = bots[key];
      let bet: PlayerBBet = { mainBet: null, mainAmount: 0 };

      if (bot.isChasing && !bot.isTakeProfitStopped) {
        // Bets with the winning trend (opposite to Player A's position)
        bet = {
          mainBet: 'BANKER', // Direction marker
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
          // A lost, so counter-bet bot wins!
          netProfit = bot.betAmount;
          mainResult = 'WIN';
          bot.chaseWins += 1;
          bot.totalChaseHands += 1;
        } else if (aMainResult === 'WIN') {
          // A won, so counter-bet bot loses!
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
    for (const key of ['B', 'B1', 'B2', 'B3', 'C', 'C1', 'C2']) {
      const bot = bots[key];
      const reachedTarget = bot.isTakeProfitStopped || (bot.takeProfitUnits > 0 && bot.profitSinceReset >= bot.takeProfitUnits * bot.betAmount);

      bot.isChasing = false;
      bot.aConsecutiveWins = 0;
      bot.isTakeProfitStopped = false;

      // ISOLATED_SHOE: reset profitSinceReset to 0 every shoe
      // CUMULATIVE: if reached target, reset to 0; if lost/not reached target, keep carrying over!
      if (isIsolated) {
        bot.profitSinceReset = 0;
      } else {
        bot.profitSinceReset = reachedTarget ? 0 : bot.profitSinceReset;
      }
    }
  };

  // 1. Process all completed shoes in shoeHistory
  const updatedShoeHistory: ShoeRecord[] = shoeHistory.map((s, shoeIdx) => {
    // If shoe starts, reset bot shoe states (except for first shoe)
    if (shoeIdx > 0) {
      resetBotsForNewShoe();
    }

    let shoeNetB = 0;
    let shoeNetB1 = 0;
    let shoeNetB2 = 0;
    let shoeNetB3 = 0;
    let shoeNetC = 0;
    let shoeNetC1 = 0;
    let shoeNetC2 = 0;

    let simulatedHands: { winner: 'PLAYER' | 'BANKER' | 'TIE'; aMainResult: 'WIN' | 'LOSS' | 'PUSH' }[] = [];

    if (s.seed && s.totalHands > 0) {
      try {
        const seedNum = stringToSeed(s.seed);
        const prng = mulberry32(seedNum);
        const freshDecks = createEightDecks();
        const shuffled = shuffleDeck(freshDecks, prng);

        // Burn cards
        const topCard = shuffled.pop();
        if (topCard) {
          const burnValue = topCard.burnValue;
          for (let i = 0; i < burnValue; i++) {
            if (shuffled.length > 0) shuffled.pop();
          }
        }

        let currentDeck = shuffled;
        for (let h = 0; h < s.totalHands; h++) {
          if (currentDeck.length < 4) break;
          const res = dealHand(currentDeck);
          currentDeck = res.remainingShoe;
          const pScore = calculateHandScore(res.playerCards);
          const bScore = calculateHandScore(res.bankerCards);
          const winner: 'PLAYER' | 'BANKER' | 'TIE' =
            pScore > bScore ? 'PLAYER' : bScore > pScore ? 'BANKER' : 'TIE';

          // Winner sequence determines A's outcome
          const aMainResult: 'WIN' | 'LOSS' | 'PUSH' =
            winner === 'TIE' ? 'PUSH' : winner === 'BANKER' ? 'WIN' : 'LOSS';

          simulatedHands.push({ winner, aMainResult });
        }
      } catch (err) {
        console.warn(`Simulation failed for shoe #${s.shoeNumber}, using recorded values:`, err);
        simulatedHands = [];
      }
    }

    if (simulatedHands.length > 0) {
      for (const hand of simulatedHands) {
        globalHandIndex += 1;
        const res = stepBotsForHand(hand.winner, hand.aMainResult);
        shoeNetB += res.B.netProfit;
        shoeNetB1 += res.B1.netProfit;
        shoeNetB2 += res.B2.netProfit;
        shoeNetB3 += res.B3.netProfit;
        shoeNetC += res.C.netProfit;
        shoeNetC1 += res.C1.netProfit;
        shoeNetC2 += res.C2.netProfit;

        updateStatsForHand();

        if (globalHandIndex % 5 === 0 || globalHandIndex === s.totalHands) {
          trendPoints.push({
            handNumber: globalHandIndex,
            aCum: (s.aBankrollEnd || initA) - initA,
            bCum: bots.B.bankroll - initB,
            b1Cum: bots.B1.bankroll - initB1,
            b2Cum: bots.B2.bankroll - initB2,
            b3Cum: bots.B3.bankroll - initB3,
            cCum: bots.C.bankroll - initC,
            c1Cum: bots.C1.bankroll - initC1,
            c2Cum: bots.C2.bankroll - initC2,
          });
        }
      }
    } else {
      // Fallback: If simulation could not run, calculate shoe profits based on mode & s.bProfit / s.cProfit
      shoeNetB = s.bProfit;
      shoeNetC = s.cProfit;

      const calcBotShoeNet = (botKey: string, units: number, shoeRawProfit: number) => {
        const bot = bots[botKey];
        const target = units * bot.betAmount;

        if (isIsolated) {
          // In isolated mode, shoe profit is capped at target profit
          const profit = shoeRawProfit >= target ? target : shoeRawProfit;
          bot.profitSinceReset = 0;
          bot.bankroll = Math.max(0, bot.bankroll + profit);
          return profit;
        } else {
          // In cumulative mode, check cumulative progress
          const required = target - bot.profitSinceReset;
          if (shoeRawProfit >= required) {
            const profit = required;
            bot.profitSinceReset = 0;
            bot.bankroll = Math.max(0, bot.bankroll + profit);
            return profit;
          } else {
            const profit = shoeRawProfit;
            bot.profitSinceReset += profit;
            bot.bankroll = Math.max(0, bot.bankroll + profit);
            return profit;
          }
        }
      };

      shoeNetB1 = calcBotShoeNet('B1', 3, s.bProfit);
      shoeNetB2 = calcBotShoeNet('B2', 2, s.bProfit);
      shoeNetB3 = calcBotShoeNet('B3', 4, s.bProfit);
      shoeNetC1 = calcBotShoeNet('C1', 3, s.cProfit);
      shoeNetC2 = calcBotShoeNet('C2', 2, s.cProfit);

      bots.B.bankroll = Math.max(0, bots.B.bankroll + shoeNetB);
      bots.C.bankroll = Math.max(0, bots.C.bankroll + shoeNetC);

      globalHandIndex += s.totalHands;
      updateStatsForHand();

      trendPoints.push({
        handNumber: globalHandIndex,
        aCum: (s.aBankrollEnd || initA) - initA,
        bCum: bots.B.bankroll - initB,
        b1Cum: bots.B1.bankroll - initB1,
        b2Cum: bots.B2.bankroll - initB2,
        b3Cum: bots.B3.bankroll - initB3,
        cCum: bots.C.bankroll - initC,
        c1Cum: bots.C1.bankroll - initC1,
        c2Cum: bots.C2.bankroll - initC2,
      });
    }

    runningBankrollA = s.aBankrollEnd ?? runningBankrollA;

    return {
      ...s,
      bProfit: shoeNetB,
      b1Profit: shoeNetB1,
      b2Profit: shoeNetB2,
      b3Profit: shoeNetB3,
      cProfit: shoeNetC,
      c1Profit: shoeNetC1,
      c2Profit: shoeNetC2,
      bBankrollEnd: bots.B.bankroll,
      b1BankrollEnd: bots.B1.bankroll,
      b2BankrollEnd: bots.B2.bankroll,
      b3BankrollEnd: bots.B3.bankroll,
      cBankrollEnd: bots.C.bankroll,
      c1BankrollEnd: bots.C1.bankroll,
      c2BankrollEnd: bots.C2.bankroll,
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
      b3Cum: bots.B3.bankroll - initB3,
      cCum: bots.C.bankroll - initC,
      c1Cum: bots.C1.bankroll - initC1,
      c2Cum: bots.C2.bankroll - initC2,
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

      b3Bet: res.B3.bet,
      b3WasChasing: bots.B3.isChasing,
      b3MainResult: res.B3.mainResult,
      b3NetProfit: res.B3.netProfit,
      b3BankrollAfter: bots.B3.bankroll,
      b3TakeProfitStoppedAfter: res.B3.stoppedAfter,
      b3ChasingAfter: bots.B3.isChasing,

      cBet: res.C.bet,
      cWasChasing: bots.C.isChasing,
      cMainResult: res.C.mainResult,
      cNetProfit: res.C.netProfit,
      cBankrollAfter: bots.C.bankroll,
      cChasingAfter: bots.C.isChasing,
      aConsecutiveWinsAfterC: bots.C.aConsecutiveWins,

      c1Bet: res.C1.bet,
      c1WasChasing: bots.C1.isChasing,
      c1MainResult: res.C1.mainResult,
      c1NetProfit: res.C1.netProfit,
      c1BankrollAfter: bots.C1.bankroll,
      c1TakeProfitStoppedAfter: res.C1.stoppedAfter,
      c1ChasingAfter: bots.C1.isChasing,

      c2Bet: res.C2.bet,
      c2WasChasing: bots.C2.isChasing,
      c2MainResult: res.C2.mainResult,
      c2NetProfit: res.C2.netProfit,
      c2BankrollAfter: bots.C2.bankroll,
      c2TakeProfitStoppedAfter: res.C2.stoppedAfter,
      c2ChasingAfter: bots.C2.isChasing,
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

  const b3State: PlayerBotState = {
    isChasing: bots.B3.isChasing,
    aConsecutiveWins: bots.B3.aConsecutiveWins,
    totalChasesTriggered: bots.B3.totalChasesTriggered,
    totalChaseHands: bots.B3.totalChaseHands,
    chaseWins: bots.B3.chaseWins,
    chaseLosses: bots.B3.chaseLosses,
    profitSinceReset: bots.B3.profitSinceReset,
    isTakeProfitStopped: bots.B3.isTakeProfitStopped,
  };

  const cState: PlayerCState = {
    isChasing: bots.C.isChasing,
    aConsecutiveWins: bots.C.aConsecutiveWins,
    totalChasesTriggered: bots.C.totalChasesTriggered,
    totalChaseHands: bots.C.totalChaseHands,
    chaseWins: bots.C.chaseWins,
    chaseLosses: bots.C.chaseLosses,
    profitSinceReset: bots.C.profitSinceReset,
    isTakeProfitStopped: bots.C.isTakeProfitStopped,
    chaseWinsC: bots.C.chaseWins,
    chaseLossesC: bots.C.chaseLosses,
  };

  const c1State: PlayerBotState = {
    isChasing: bots.C1.isChasing,
    aConsecutiveWins: bots.C1.aConsecutiveWins,
    totalChasesTriggered: bots.C1.totalChasesTriggered,
    totalChaseHands: bots.C1.totalChaseHands,
    chaseWins: bots.C1.chaseWins,
    chaseLosses: bots.C1.chaseLosses,
    profitSinceReset: bots.C1.profitSinceReset,
    isTakeProfitStopped: bots.C1.isTakeProfitStopped,
  };

  const c2State: PlayerBotState = {
    isChasing: bots.C2.isChasing,
    aConsecutiveWins: bots.C2.aConsecutiveWins,
    totalChasesTriggered: bots.C2.totalChasesTriggered,
    totalChaseHands: bots.C2.totalChaseHands,
    chaseWins: bots.C2.chaseWins,
    chaseLosses: bots.C2.chaseLosses,
    profitSinceReset: bots.C2.profitSinceReset,
    isTakeProfitStopped: bots.C2.isTakeProfitStopped,
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
    b3MaxBankroll: maxBankrolls.B3,
    b3MaxDrawdown: maxDrawdowns.B3,
    cMaxBankroll: maxBankrolls.C,
    cMaxDrawdown: maxDrawdowns.C,
    c1MaxBankroll: maxBankrolls.C1,
    c1MaxDrawdown: maxDrawdowns.C1,
    c2MaxBankroll: maxBankrolls.C2,
    c2MaxDrawdown: maxDrawdowns.C2,
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
      b3Bankroll: bots.B3.bankroll,
      cBankroll: bots.C.bankroll,
      c1Bankroll: bots.C1.bankroll,
      c2Bankroll: bots.C2.bankroll,
    },
    botStates: {
      bState,
      b1State,
      b2State,
      b3State,
      cState,
      c1State,
      c2State,
    },
    trendPoints: finalTrendPoints,
    stats,
  };
}
