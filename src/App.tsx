import React, { useState, useEffect } from 'react';
import { TableFelt } from './components/TableFelt';
import { Dragon7Counter } from './components/Dragon7Counter';
import { BettingConsole } from './components/BettingConsole';
import { HandHistoryLog } from './components/HandHistoryLog';
import { PlayerBStatus } from './components/PlayerBStatus';
import { BigRoad } from './components/BigRoad';
import { StatsPanel } from './components/StatsPanel';
import { SettingsModal } from './components/SettingsModal';
import { RechargeModal, RechargePlayer } from './components/RechargeModal';
import {
  Card,
  D7Stats,
  Dragon7BetRecord,
  Dragon7Settings,
  defaultDragon7Settings,
  GameSettings,
  GameStats,
  HandResult,
  PlayerBet,
  PlayerBBet,
  PlayerBState,
  PlayerBotState,
  ShoeRecord,
  TrendPoint,
  initialD7Stats,
  Panda8BetRecord,
  Panda8Settings,
  defaultPanda8Settings,
} from './types';
import {
  calculateHandScore,
  createEightDecks,
  dealHand,
  generateRandomSeed,
  mulberry32,
  shuffleDeck,
  stringToSeed,
} from './utils/baccarat';
import {
  calculateDragon7Advantage,
  calculateDragon7RunningCount,
  calculateDragon7TrueCount,
  formatCardsCompact,
} from './utils/dragon7';
import {
  calculatePanda8Advantage,
  calculatePanda8RunningCount,
  calculatePanda8TrueCount,
} from './utils/panda8';
import { downloadStandaloneHtmlFile } from './utils/exportSingleFileHtml';
import { recalculateFullHistory } from './utils/recalculateHistory';

const LOCAL_STORAGE_KEY = 'baccarat_session_v2';

const defaultBotState: PlayerBotState = {
  isChasing: false,
  aConsecutiveWins: 0,
  totalChasesTriggered: 0,
  totalChaseHands: 0,
  chaseWins: 0,
  chaseLosses: 0,
  profitSinceReset: 0,
  isTakeProfitStopped: false,
};

export default function App() {
  // Default Settings
  const [settings, setSettings] = useState<GameSettings>({
    cutCardDepth: 26,
    bChaseBet: 200,
    bPostExhaustionChaseBet: 200,
    b1ChaseBet: 200,
    b1PostExhaustionChaseBet: 200,
    b2ChaseBet: 200,
    b2PostExhaustionChaseBet: 200,
    aDefaultBet: 10,
    aEnableSideBets: true,
    sideBetAmount: 10,
    prngSeed: Date.now().toString(),
    botTakeProfitResetMode: 'ISOLATED_SHOE',
  });

  // Game Engine & Shoe State
  const [shoe, setShoe] = useState<Card[]>([]);
  const [burnedCount, setBurnedCount] = useState<number>(0);
  const [burnCard, setBurnCard] = useState<Card | null>(null);
  const [shoeHandCount, setShoeHandCount] = useState<number>(0);
  const [totalHandCount, setTotalHandCount] = useState<number>(0);

  // Active Hand Cards
  const [playerCards, setPlayerCards] = useState<Card[]>([]);
  const [bankerCards, setBankerCards] = useState<Card[]>([]);
  const [isDealing, setIsDealing] = useState<boolean>(false);

  // Player Funds
  const [aBankroll, setABankroll] = useState<number>(1000);
  const [bBankroll, setBBankroll] = useState<number>(10000);
  const [b1Bankroll, setB1Bankroll] = useState<number>(10000);
  const [b2Bankroll, setB2Bankroll] = useState<number>(10000);

  // Current Bet Selections
  const [aBet, setABet] = useState<PlayerBet>({
    mainBet: null,
    mainAmount: 10,
    dragon7Amount: 0,
    panda8Amount: 0,
  });

  // Bots State Machines
  const [bState, setBState] = useState<PlayerBState>({
    ...defaultBotState,
    chaseWinsB: 0,
    chaseLossesB: 0,
  });
  const [b1State, setB1State] = useState<PlayerBotState>(defaultBotState);
  const [b2State, setB2State] = useState<PlayerBotState>(defaultBotState);

  // History & Statistics
  const [handResults, setHandResults] = useState<HandResult[]>([]);
  const [allHandResults, setAllHandResults] = useState<HandResult[]>([]);
  const [shoeHistory, setShoeHistory] = useState<ShoeRecord[]>([]);
  const [d7Stats, setD7Stats] = useState<D7Stats>(initialD7Stats);
  const [trendPoints, setTrendPoints] = useState<TrendPoint[]>([
    { handNumber: 0, aCum: 0, bCum: 0, b1Cum: 0, b2Cum: 0 },
  ]);
  const [stats, setStats] = useState<GameStats>({
    aTotalHandsBet: 0,
    aTotalWins: 0,
    aTotalLosses: 0,
    aTotalPushes: 0,
    aChaseHandsBet: 0,
    aChaseWins: 0,
    aChaseLosses: 0,
    aExhaustedHands: 0,
    aExhaustedWins: 0,
    aExhaustedLosses: 0,
    aMaxBankroll: 1000,
    aMaxDrawdown: 0,
    bMaxBankroll: 10000,
    bMaxDrawdown: 0,
    b1MaxBankroll: 10000,
    b1MaxDrawdown: 0,
    b2MaxBankroll: 10000,
    b2MaxDrawdown: 0,
  });

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [rechargePlayer, setRechargePlayer] = useState<RechargePlayer | null>(null);

  // Dragon 7 Card Counting Assistant State
  const [d7Settings, setD7Settings] = useState<Dragon7Settings>(defaultDragon7Settings);
  const [d7History, setD7History] = useState<Dragon7BetRecord[]>([]);
  const [d7Bankroll, setD7Bankroll] = useState<number>(10000);

  // Panda 8 Card Counting Assistant State
  const [p8Settings, setP8Settings] = useState<Panda8Settings>(defaultPanda8Settings);
  const [p8History, setP8History] = useState<Panda8BetRecord[]>([]);
  const [p8Bankroll, setP8Bankroll] = useState<number>(10000);

  // Initialize or Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.aBankroll !== undefined) setABankroll(parsed.aBankroll);
        if (parsed.bBankroll !== undefined) setBBankroll(parsed.bBankroll);
        if (parsed.b1Bankroll !== undefined) setB1Bankroll(parsed.b1Bankroll);
        if (parsed.b2Bankroll !== undefined) setB2Bankroll(parsed.b2Bankroll);

        if (parsed.bState) setBState(parsed.bState);
        if (parsed.b1State) setB1State(parsed.b1State);
        if (parsed.b2State) setB2State(parsed.b2State);
        if (parsed.settings) setSettings((prev) => ({ ...prev, ...parsed.settings }));
        if (parsed.handResults) setHandResults(parsed.handResults);
        
        let handsForInit: HandResult[] = parsed.allHandResults || parsed.handResults || [];
        let loadedShoes: ShoeRecord[] = parsed.shoeHistory || [];

        if (parsed.allHandResults) setAllHandResults(parsed.allHandResults);
        else if (parsed.handResults) setAllHandResults(parsed.handResults);
        
        setShoeHistory(loadedShoes);
        if (parsed.totalHandCount) setTotalHandCount(parsed.totalHandCount);

        if (parsed.d7Stats) {
          setD7Stats(parsed.d7Stats);
        } else if (handsForInit.length > 0) {
          const reconstructedD7: D7Stats = { ...initialD7Stats };
          handsForInit.forEach((h) => {
            if (h.isDragon7) {
              reconstructedD7.d7TotalCount++;
              if (h.aBet.dragon7Amount > 0) reconstructedD7.aD7SideBetHits++;
              reconstructedD7.aD7SideBetPayout += h.aSidePayout || 0;
              if (h.aBet.mainBet === 'BANKER') reconstructedD7.aD7BankerPushes++;
              if (h.aBet.mainBet === 'PLAYER') reconstructedD7.aD7PlayerLosses++;

              if (h.bBet?.mainBet === 'BANKER') reconstructedD7.bD7BankerPushes++;
              if (h.bBet?.mainBet === 'PLAYER') reconstructedD7.bD7PlayerLosses++;
              if (!h.bBet || h.bBet.mainBet === null) reconstructedD7.bD7NoBets++;

              if (h.b1Bet?.mainBet === 'BANKER') reconstructedD7.b1D7BankerPushes++;
              if (h.b1Bet?.mainBet === 'PLAYER') reconstructedD7.b1D7PlayerLosses++;
              if (!h.b1Bet || h.b1Bet.mainBet === null) reconstructedD7.b1D7NoBets++;

              if (h.b2Bet?.mainBet === 'BANKER') reconstructedD7.b2D7BankerPushes++;
              if (h.b2Bet?.mainBet === 'PLAYER') reconstructedD7.b2D7PlayerLosses++;
              if (!h.b2Bet || h.b2Bet.mainBet === null) reconstructedD7.b2D7NoBets++;
            }
          });
          setD7Stats(reconstructedD7);
        }

        if (parsed.d7Settings) setD7Settings(parsed.d7Settings);
        if (parsed.d7History) setD7History(parsed.d7History);
        if (parsed.d7Bankroll !== undefined) setD7Bankroll(parsed.d7Bankroll);

        if (parsed.p8Settings) setP8Settings(parsed.p8Settings);
        if (parsed.p8History) setP8History(parsed.p8History);
        if (parsed.p8Bankroll !== undefined) setP8Bankroll(parsed.p8Bankroll);

        if (parsed.trendPoints) {
          setTrendPoints(parsed.trendPoints);
        } else if (handsForInit.length > 0) {
          const reconstructedPts: TrendPoint[] = [
            { handNumber: 0, aCum: 0, bCum: 0, b1Cum: 0, b2Cum: 0 },
            ...handsForInit.map((h) => ({
              handNumber: h.handNumber,
              aCum: h.aBankrollAfter - 1000,
              bCum: h.bBankrollAfter - 10000,
              b1Cum: (h.b1BankrollAfter ?? 10000) - 10000,
              b2Cum: (h.b2BankrollAfter ?? 10000) - 10000,
            })),
          ];
          setTrendPoints(reconstructedPts);
        }
      } catch (e) {
        console.error('Failed to parse saved session:', e);
      }
    }
    initializeShoe(settings.prngSeed);
  }, []);

  // Save session state to localStorage on update (debounced to avoid performance bottlenecks in fast auto-play)
  useEffect(() => {
    if (totalHandCount > 0 || shoeHistory.length > 0) {
      const timer = setTimeout(() => {
        const stateToSave = {
          aBankroll,
          bBankroll,
          b1Bankroll,
          b2Bankroll,
          bState,
          b1State,
          b2State,
          stats,
          d7Stats,
          trendPoints,
          settings,
          handResults,
          allHandResults: allHandResults.slice(-300),
          shoeHistory: shoeHistory.slice(-5000),
          totalHandCount,
          d7Settings,
          d7History: d7History.slice(-500),
          d7Bankroll,
          p8Settings,
          p8History: p8History.slice(-500),
          p8Bankroll,
        };

        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
        } catch (err) {
          console.warn('LocalStorage save limit reached:', err);
        }
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [
    aBankroll,
    bBankroll,
    b1Bankroll,
    b2Bankroll,
    bState,
    b1State,
    b2State,
    stats,
    d7Stats,
    trendPoints,
    settings,
    handResults,
    allHandResults,
    shoeHistory,
    totalHandCount,
    d7Settings,
    d7History,
    d7Bankroll,
    p8Settings,
    p8History,
    p8Bankroll,
  ]);

  // Synchronize Dragon 7 auto-bet when auto-bet is enabled and system is idle
  useEffect(() => {
    if (d7Settings.isAutoBetEnabled && !isDealing && shoe.length > 0) {
      const rc = calculateDragon7RunningCount(handResults, burnCard, d7Settings.countingSystem);
      const tc = calculateDragon7TrueCount(rc.rc, shoe.length, 416);
      const adv = calculateDragon7Advantage(
        tc.tc,
        d7Settings.threshold,
        d7Settings.betMode,
        d7Settings.fixedUnitAmount,
        d7Bankroll
      );
      if (adv.shouldBet) {
        setABet((prev) => (prev.dragon7Amount !== adv.suggestedBet ? { ...prev, dragon7Amount: adv.suggestedBet } : prev));
      }
    }
  }, [
    d7Settings.isAutoBetEnabled,
    d7Settings.threshold,
    d7Settings.betMode,
    d7Settings.fixedUnitAmount,
    d7Bankroll,
    handResults.length,
    shoe.length,
    isDealing,
  ]);

  // Synchronize Panda 8 auto-bet when auto-bet is enabled and system is idle
  useEffect(() => {
    if (p8Settings.isAutoBetEnabled && !isDealing && shoe.length > 0) {
      const rc = calculatePanda8RunningCount(handResults, burnCard);
      const tc = calculatePanda8TrueCount(rc.rc, shoe.length, 416);
      const adv = calculatePanda8Advantage(
        tc.tc,
        p8Settings.threshold,
        p8Settings.betMode,
        p8Settings.fixedUnitAmount,
        p8Bankroll
      );
      if (adv.shouldBet) {
        setABet((prev) => (prev.panda8Amount !== adv.suggestedBet ? { ...prev, panda8Amount: adv.suggestedBet } : prev));
      }
    }
  }, [
    p8Settings.isAutoBetEnabled,
    p8Settings.threshold,
    p8Settings.betMode,
    p8Settings.fixedUnitAmount,
    p8Bankroll,
    handResults.length,
    shoe.length,
    isDealing,
  ]);

  // Initialize a new shoe (Shuffle + Burn)
  const initializeShoe = (seedStr: string) => {
    const seedNum = stringToSeed(seedStr);
    const prng = mulberry32(seedNum);
    const freshDecks = createEightDecks();
    const shuffled = shuffleDeck(freshDecks, prng);

    // Burn Cards: Flip top card
    const topCard = shuffled.pop()!;
    const burnValue = topCard.burnValue;
    const burnedCards: Card[] = [topCard];

    for (let i = 0; i < burnValue; i++) {
      if (shuffled.length > 0) {
        burnedCards.push(shuffled.pop()!);
      }
    }

    setShoe(shuffled);
    setBurnCard(topCard);
    setBurnedCount(burnedCards.length);
    setShoeHandCount(0);
    setPlayerCards([]);
    setBankerCards([]);
  };

  // Handle New Shoe
  const handleNewShoe = () => {
    if (handResults.length > 0) {
      const aProfit = handResults.reduce((sum, h) => sum + h.aNetProfit, 0);
      const bProfit = handResults.reduce((sum, h) => sum + h.bNetProfit, 0);
      const b1Profit = handResults.reduce((sum, h) => sum + (h.b1NetProfit ?? 0), 0);
      const b2Profit = handResults.reduce((sum, h) => sum + (h.b2NetProfit ?? 0), 0);
      const d7Profit = handResults.reduce((sum, h) => {
        if (h.aBet.dragon7Amount > 0) {
          return sum + (h.isDragon7 ? h.aBet.dragon7Amount * 40 : -h.aBet.dragon7Amount);
        }
        return sum;
      }, 0);
      const p8Profit = handResults.reduce((sum, h) => {
        if (h.aBet.panda8Amount > 0) {
          return sum + (h.isPanda8 ? h.aBet.panda8Amount * 25 : -h.aBet.panda8Amount);
        }
        return sum;
      }, 0);

      const bankerWins = handResults.filter((h) => h.winner === 'BANKER').length;
      const playerWins = handResults.filter((h) => h.winner === 'PLAYER').length;
      const ties = handResults.filter((h) => h.winner === 'TIE').length;
      const dragon7Count = handResults.filter((h) => h.isDragon7).length;
      const panda8Count = handResults.filter((h) => h.isPanda8).length;

      const record: ShoeRecord = {
        shoeNumber: shoeHistory.length + 1,
        seed: settings.prngSeed,
        totalHands: handResults.length,
        aProfit,
        bProfit,
        b1Profit,
        b2Profit,
        d7Profit,
        p8Profit,
        bankerWins,
        playerWins,
        ties,
        dragon7Count,
        panda8Count,
        aBankrollEnd: aBankroll,
        bBankrollEnd: bBankroll,
        b1BankrollEnd: b1Bankroll,
        b2BankrollEnd: b2Bankroll,
        d7BankrollEnd: d7Bankroll,
        p8BankrollEnd: p8Bankroll,
        timestamp: Date.now(),
      };

      setShoeHistory((prev) => [...prev, record]);
    }

    // Reset Bot states for the new shoe based on setting
    const isIsolatedMode = settings.botTakeProfitResetMode !== 'CUMULATIVE'; // default: 当鞋独立认亏，下一鞋重新起算
    const resetBotForNewShoe = (st: PlayerBotState): PlayerBotState => {
      const reachedTarget = st.isTakeProfitStopped;
      return {
        ...st,
        isChasing: false,
        aConsecutiveWins: 0,
        isTakeProfitStopped: false,
        profitSinceReset: isIsolatedMode ? 0 : (reachedTarget ? 0 : st.profitSinceReset),
      };
    };

    setBState((prev) => ({
      ...resetBotForNewShoe(prev),
      chaseWinsB: prev.chaseWinsB,
      chaseLossesB: prev.chaseLossesB,
    }));
    setB1State(resetBotForNewShoe);
    setB2State(resetBotForNewShoe);

    const newSeed = generateRandomSeed();
    setSettings((prev) => ({ ...prev, prngSeed: newSeed }));
    initializeShoe(newSeed);
    setHandResults([]); // Clear road map for the new shoe
  };

  // Handle Global Session Reset
  const handleResetSession = () => {
    if (window.confirm('确认要一键恢复所有金额、对局记录和数据统计分析为初始状态吗？这将重置所有对家（B/B-1/B-2）资金、追打状态和所有历史对局记录。')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setABankroll(1000);
      setBBankroll(10000);
      setB1Bankroll(10000);
      setB2Bankroll(10000);

      setABet({
        mainBet: null,
        mainAmount: settings.aDefaultBet,
        dragon7Amount: 0,
        panda8Amount: 0,
      });

      const freshBotState: PlayerBotState = {
        isChasing: false,
        aConsecutiveWins: 0,
        totalChasesTriggered: 0,
        totalChaseHands: 0,
        chaseWins: 0,
        chaseLosses: 0,
        profitSinceReset: 0,
        isTakeProfitStopped: false,
      };

      setBState({ ...freshBotState, chaseWinsB: 0, chaseLossesB: 0 });
      setB1State(freshBotState);
      setB2State(freshBotState);

      setStats({
        aTotalHandsBet: 0,
        aTotalWins: 0,
        aTotalLosses: 0,
        aTotalPushes: 0,
        aChaseHandsBet: 0,
        aChaseWins: 0,
        aChaseLosses: 0,
        aExhaustedHands: 0,
        aExhaustedWins: 0,
        aExhaustedLosses: 0,
        aMaxBankroll: 1000,
        aMaxDrawdown: 0,
        bMaxBankroll: 10000,
        bMaxDrawdown: 0,
        b1MaxBankroll: 10000,
        b1MaxDrawdown: 0,
        b2MaxBankroll: 10000,
        b2MaxDrawdown: 0,
      });

      setD7Stats(initialD7Stats);
      setTrendPoints([
        { handNumber: 0, aCum: 0, bCum: 0, b1Cum: 0, b2Cum: 0 },
      ]);
      setHandResults([]);
      setAllHandResults([]);
      setShoeHistory([]);
      setTotalHandCount(0);
      handleNewShoe();
    }
  };

  // Helper to get predicted bet for any bot
  const getBotBet = (
    st: PlayerBotState,
    chaseBetAmt: number,
    aMainBet: 'PLAYER' | 'BANKER' | null
  ): PlayerBBet => {
    if (st.isChasing && !st.isTakeProfitStopped) {
      if (aMainBet !== null) {
        return {
          mainBet: aMainBet === 'PLAYER' ? 'BANKER' : 'PLAYER',
          mainAmount: chaseBetAmt,
        };
      }
    }
    return { mainBet: null, mainAmount: 0 };
  };

  // Process Hand logic for a single bot
  const processBotHand = ({
    currentState,
    currentBankroll,
    chaseBetAmount,
    maxWinsToExit,
    takeProfitUnits,
    stopLossUnits,
    aMainResult,
    aBetMainBet,
    winner,
  }: {
    currentState: PlayerBotState;
    currentBankroll: number;
    chaseBetAmount: number;
    maxWinsToExit: number;
    takeProfitUnits: number;
    stopLossUnits?: number;
    aMainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET';
    aBetMainBet: 'PLAYER' | 'BANKER' | null;
    winner: 'PLAYER' | 'BANKER' | 'TIE';
  }) => {
    let bet: PlayerBBet = { mainBet: null, mainAmount: 0 };

    if (currentState.isChasing && !currentState.isTakeProfitStopped) {
      if (aBetMainBet !== null) {
        bet = {
          mainBet: aBetMainBet === 'PLAYER' ? 'BANKER' : 'PLAYER',
          mainAmount: chaseBetAmount,
        };
      }
    }

    let netProfit = 0;
    let mainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET' = 'NO_BET';

    if (bet.mainBet !== null && bet.mainAmount > 0) {
      if (winner === 'TIE') {
        netProfit = 0;
        mainResult = 'PUSH';
      } else if (bet.mainBet === 'BANKER') {
        if (winner === 'BANKER') {
          netProfit = bet.mainAmount;
          mainResult = 'WIN';
        } else {
          netProfit = -bet.mainAmount;
          mainResult = 'LOSS';
        }
      } else if (bet.mainBet === 'PLAYER') {
        if (winner === 'PLAYER') {
          netProfit = bet.mainAmount;
          mainResult = 'WIN';
        } else {
          netProfit = -bet.mainAmount;
          mainResult = 'LOSS';
        }
      }
    }

    const bankrollAfter = Math.max(0, currentBankroll + netProfit);

    let profitSinceReset = (currentState.profitSinceReset ?? 0) + netProfit;
    let isTakeProfitStopped = currentState.isTakeProfitStopped ?? false;

    if (takeProfitUnits > 0 && !isTakeProfitStopped) {
      const targetProfit = takeProfitUnits * chaseBetAmount;
      if (profitSinceReset >= targetProfit) {
        isTakeProfitStopped = true;
      }
    }

    if (stopLossUnits && stopLossUnits > 0 && !isTakeProfitStopped) {
      const stopLossLimit = stopLossUnits * chaseBetAmount;
      if (profitSinceReset <= -stopLossLimit) {
        isTakeProfitStopped = true;
      }
    }

    let nextIsChasing = currentState.isChasing;
    let nextConsecutiveWins = currentState.aConsecutiveWins;
    let totalChasesTriggered = currentState.totalChasesTriggered;
    let totalChaseHands = currentState.totalChaseHands;
    let chaseWins = currentState.chaseWins;
    let chaseLosses = currentState.chaseLosses;

    if (isTakeProfitStopped) {
      nextIsChasing = false;
      nextConsecutiveWins = 0;
    } else if (!currentState.isChasing) {
      if (aMainResult === 'LOSS') {
        nextIsChasing = true;
        nextConsecutiveWins = 0;
        totalChasesTriggered += 1;
      }
    } else {
      if (bet.mainBet !== null) {
        totalChaseHands += 1;
        if (mainResult === 'WIN') chaseWins += 1;
        if (mainResult === 'LOSS') chaseLosses += 1;
      }

      if (aMainResult === 'NO_BET' || aMainResult === 'PUSH') {
        nextConsecutiveWins = currentState.aConsecutiveWins;
      } else if (aMainResult === 'WIN') {
        nextConsecutiveWins = currentState.aConsecutiveWins + 1;
        if (nextConsecutiveWins >= maxWinsToExit) {
          nextIsChasing = false;
          nextConsecutiveWins = 0;
        }
      } else if (aMainResult === 'LOSS') {
        nextConsecutiveWins = 0;
      }
    }

    const nextState: PlayerBotState = {
      isChasing: nextIsChasing,
      aConsecutiveWins: nextConsecutiveWins,
      totalChasesTriggered,
      totalChaseHands,
      chaseWins,
      chaseLosses,
      profitSinceReset,
      isTakeProfitStopped,
    };

    return {
      bet,
      mainResult,
      netProfit,
      bankrollAfter,
      nextState,
      takeProfitStoppedAfter: isTakeProfitStopped,
    };
  };

  // Deal Next Hand
  const handleDealNextHand = () => {
    if (isDealing) return;

    if (shoe.length < settings.cutCardDepth) {
      alert(`牌鞋剩余牌数 (${shoe.length}) 已少于切牌深度 (${settings.cutCardDepth})。请点击【换新鞋】按钮开始新靴！`);
      return;
    }

    setIsDealing(true);

    const aIsExhausted = aBankroll === 0;

    // Current Dragon 7 Count & Advice before deal
    const currentRCDetails = calculateDragon7RunningCount(handResults, burnCard, d7Settings.countingSystem);
    const currentTCDetails = calculateDragon7TrueCount(currentRCDetails.rc, shoe.length, 416);
    const currentD7Advice = calculateDragon7Advantage(
      currentTCDetails.tc,
      d7Settings.threshold,
      d7Settings.betMode,
      d7Settings.fixedUnitAmount,
      d7Bankroll
    );

    // Current Panda 8 Count & Advice before deal
    const currentP8RCDetails = calculatePanda8RunningCount(handResults, burnCard);
    const currentP8TCDetails = calculatePanda8TrueCount(currentP8RCDetails.rc, shoe.length, 416);
    const currentP8Advice = calculatePanda8Advantage(
      currentP8TCDetails.tc,
      p8Settings.threshold,
      p8Settings.betMode,
      p8Settings.fixedUnitAmount,
      p8Bankroll
    );

    // Determine actual Dragon 7 bet amount (Never wipe user's manual bet! Supports auto-bet when threshold is reached)
    let effectiveD7Bet = aBet.dragon7Amount;
    if (effectiveD7Bet <= 0 && d7Settings.isAutoBetEnabled && currentD7Advice.shouldBet) {
      effectiveD7Bet = currentD7Advice.suggestedBet;
    }

    // Determine actual Panda 8 bet amount (Never wipe user's manual bet! Supports auto-bet when threshold is reached)
    let effectiveP8Bet = aBet.panda8Amount;
    if (effectiveP8Bet <= 0 && p8Settings.isAutoBetEnabled && currentP8Advice.shouldBet) {
      effectiveP8Bet = currentP8Advice.suggestedBet;
    }

    // Deal Cards from Shoe
    const { playerCards: pCards, bankerCards: bCards, remainingShoe } = dealHand(shoe);
    setShoe(remainingShoe);

    const pScore = calculateHandScore(pCards);
    const bScore = calculateHandScore(bCards);

    // Winner Determination
    const winner = pScore > bScore ? 'PLAYER' : bScore > pScore ? 'BANKER' : 'TIE';

    const isDragon7 = bScore === 7 && bCards.length === 3 && winner === 'BANKER';
    const isPanda8 = pScore === 8 && pCards.length === 3 && winner === 'PLAYER';
    const isDragon7Push = false;

    // 1. Calculate Player A Payout
    let aMainPayout = 0;
    let aMainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET' = 'NO_BET';

    if (aBet.mainBet !== null && aBet.mainAmount > 0) {
      if (winner === 'TIE') {
        aMainPayout = 0;
        aMainResult = 'PUSH';
      } else if (aBet.mainBet === 'BANKER') {
        if (winner === 'BANKER') {
          aMainPayout = aBet.mainAmount;
          aMainResult = 'WIN';
        } else {
          aMainPayout = -aBet.mainAmount;
          aMainResult = 'LOSS';
        }
      } else if (aBet.mainBet === 'PLAYER') {
        if (winner === 'PLAYER') {
          aMainPayout = aBet.mainAmount;
          aMainResult = 'WIN';
        } else {
          aMainPayout = -aBet.mainAmount;
          aMainResult = 'LOSS';
        }
      }
    }

    // Side Bets Payout (with effective Dragon 7 and Panda 8 bets)
    let aSidePayout = 0;
    if (effectiveD7Bet > 0) {
      aSidePayout += isDragon7 ? effectiveD7Bet * 40 : -effectiveD7Bet;
    }
    if (effectiveP8Bet > 0) {
      aSidePayout += isPanda8 ? effectiveP8Bet * 25 : -effectiveP8Bet;
    }

    const aNetProfit = aMainPayout + aSidePayout;
    const aBankrollAfter = Math.max(0, aBankroll + aNetProfit);

    // 2. Process Bot B (3 wins exit, no take profit)
    const bChaseBetAmt = aIsExhausted ? settings.bPostExhaustionChaseBet : settings.bChaseBet;
    const bRes = processBotHand({
      currentState: bState,
      currentBankroll: bBankroll,
      chaseBetAmount: bChaseBetAmt,
      maxWinsToExit: 3,
      takeProfitUnits: 0,
      aMainResult,
      aBetMainBet: aBet.mainBet,
      winner,
    });

    // 3. Process Bot B-1 (3 wins exit, 3 units take profit)
    const b1ChaseBetAmt = aIsExhausted ? (settings.b1PostExhaustionChaseBet ?? 200) : (settings.b1ChaseBet ?? 200);
    const b1Res = processBotHand({
      currentState: b1State,
      currentBankroll: b1Bankroll,
      chaseBetAmount: b1ChaseBetAmt,
      maxWinsToExit: 3,
      takeProfitUnits: 3,
      aMainResult,
      aBetMainBet: aBet.mainBet,
      winner,
    });

    // 4. Process Bot B-2 (3 wins exit, 2 units take profit)
    const b2ChaseBetAmt = aIsExhausted ? (settings.b2PostExhaustionChaseBet ?? 200) : (settings.b2ChaseBet ?? 200);
    const b2Res = processBotHand({
      currentState: b2State,
      currentBankroll: b2Bankroll,
      chaseBetAmount: b2ChaseBetAmt,
      maxWinsToExit: 3,
      takeProfitUnits: 2,
      aMainResult,
      aBetMainBet: aBet.mainBet,
      winner,
    });

    // Hand numbers
    const newHandNum = totalHandCount + 1;
    const newShoeHandNum = shoeHandCount + 1;

    const prevACumulative = handResults.length > 0 ? (handResults[handResults.length - 1].aCumulativeProfit ?? 0) : 0;
    const aCumulativeProfit = prevACumulative + aNetProfit;

    const prevBCumulative = handResults.length > 0 ? (handResults[handResults.length - 1].bCumulativeProfit ?? 0) : 0;
    const bCumulativeProfit = prevBCumulative + bRes.netProfit;

    const handRes: HandResult = {
      handNumber: newHandNum,
      shoeHandNumber: newShoeHandNum,
      playerCards: pCards,
      bankerCards: bCards,
      playerScore: pScore,
      bankerScore: bScore,
      winner,
      isDragon7,
      isPanda8,
      isDragon7Push,

      aBet: { ...aBet, dragon7Amount: effectiveD7Bet, panda8Amount: effectiveP8Bet },
      aMainResult,
      aMainPayout,
      aSidePayout,
      aNetProfit,
      aCumulativeProfit,
      aBankrollAfter,

      bBet: bRes.bet,
      bWasChasing: bState.isChasing,
      bMainResult: bRes.mainResult,
      bNetProfit: bRes.netProfit,
      bCumulativeProfit,
      bBankrollAfter: bRes.bankrollAfter,

      b1Bet: b1Res.bet,
      b1WasChasing: b1State.isChasing,
      b1MainResult: b1Res.mainResult,
      b1NetProfit: b1Res.netProfit,
      b1BankrollAfter: b1Res.bankrollAfter,
      b1TakeProfitStoppedAfter: b1Res.takeProfitStoppedAfter,

      b2Bet: b2Res.bet,
      b2WasChasing: b2State.isChasing,
      b2MainResult: b2Res.mainResult,
      b2NetProfit: b2Res.netProfit,
      b2BankrollAfter: b2Res.bankrollAfter,
      b2TakeProfitStoppedAfter: b2Res.takeProfitStoppedAfter,

      bChasingAfter: bRes.nextState.isChasing,
      aConsecutiveWinsAfter: bRes.nextState.aConsecutiveWins,
      aWasExhausted: aIsExhausted,
      timestamp: Date.now(),
    };

    // Record Dragon 7 Bet Tracking Record
    if (effectiveD7Bet > 0) {
      const d7Net = isDragon7 ? effectiveD7Bet * 40 : -effectiveD7Bet;
      const newD7Bankroll = Math.max(0, d7Bankroll + d7Net);
      setD7Bankroll(newD7Bankroll);

      const prevShoeProfit = handResults.reduce((sum, h) => {
        if (h.aBet.dragon7Amount > 0) {
          return sum + (h.isDragon7 ? h.aBet.dragon7Amount * 40 : -h.aBet.dragon7Amount);
        }
        return sum;
      }, 0);
      const shoeProfitAfter = prevShoeProfit + d7Net;

      const prevCum = d7History.length > 0 ? d7History[d7History.length - 1].cumulativeProfitAfter : 0;
      const cumulativeProfitAfter = prevCum + d7Net;

      const d7Record: Dragon7BetRecord = {
        id: `d7_${newHandNum}_${Date.now()}`,
        handNumber: newHandNum,
        shoeNumber: shoeHistory.length + 1,
        shoeHandNumber: newShoeHandNum,
        rc: currentRCDetails.rc,
        tc: currentTCDetails.tc,
        betAmount: effectiveD7Bet,
        isWin: isDragon7,
        payout: isDragon7 ? effectiveD7Bet * 40 : 0,
        netProfit: d7Net,
        shoeProfitAfter,
        cumulativeProfitAfter,
        bankrollAfter: newD7Bankroll,
        bankerCardsStr: formatCardsCompact(bCards),
        playerCardsStr: formatCardsCompact(pCards),
        isDragon7,
        timestamp: Date.now(),
      };

      setD7History((prev) => [...prev, d7Record]);
    }

    // Record Panda 8 Bet Tracking Record
    if (effectiveP8Bet > 0) {
      const p8Net = isPanda8 ? effectiveP8Bet * 25 : -effectiveP8Bet;
      const newP8Bankroll = Math.max(0, p8Bankroll + p8Net);
      setP8Bankroll(newP8Bankroll);

      const prevShoeProfitP8 = handResults.reduce((sum, h) => {
        if (h.aBet.panda8Amount > 0) {
          return sum + (h.isPanda8 ? h.aBet.panda8Amount * 25 : -h.aBet.panda8Amount);
        }
        return sum;
      }, 0);
      const shoeProfitAfter = prevShoeProfitP8 + p8Net;

      const prevCumP8 = p8History.length > 0 ? p8History[p8History.length - 1].cumulativeProfitAfter : 0;
      const cumulativeProfitAfter = prevCumP8 + p8Net;

      const p8Record: Panda8BetRecord = {
        id: `p8_${newHandNum}_${Date.now()}`,
        handNumber: newHandNum,
        shoeNumber: shoeHistory.length + 1,
        shoeHandNumber: newShoeHandNum,
        rc: currentP8RCDetails.rc,
        tc: currentP8TCDetails.tc,
        betAmount: effectiveP8Bet,
        isWin: isPanda8,
        payout: isPanda8 ? effectiveP8Bet * 25 : 0,
        netProfit: p8Net,
        shoeProfitAfter,
        cumulativeProfitAfter,
        bankrollAfter: newP8Bankroll,
        bankerCardsStr: formatCardsCompact(bCards),
        playerCardsStr: formatCardsCompact(pCards),
        isPanda8,
        timestamp: Date.now(),
      };

      setP8History((prev) => [...prev, p8Record]);
    }

    // Update States
    setPlayerCards(pCards);
    setBankerCards(bCards);
    setABankroll(aBankrollAfter);
    setBBankroll(bRes.bankrollAfter);
    setB1Bankroll(b1Res.bankrollAfter);
    setB2Bankroll(b2Res.bankrollAfter);

    // Calculate Next Hand's count and advice for Auto Bet (Both Dragon 7 & Panda 8)
    const nextRCDetailsD7 = calculateDragon7RunningCount([...handResults, handRes], burnCard, d7Settings.countingSystem);
    const nextTCDetailsD7 = calculateDragon7TrueCount(nextRCDetailsD7.rc, remainingShoe.length, 416);
    const nextD7Advice = calculateDragon7Advantage(
      nextTCDetailsD7.tc,
      d7Settings.threshold,
      d7Settings.betMode,
      d7Settings.fixedUnitAmount,
      d7Bankroll
    );

    const nextRCDetailsP8 = calculatePanda8RunningCount([...handResults, handRes], burnCard);
    const nextTCDetailsP8 = calculatePanda8TrueCount(nextRCDetailsP8.rc, remainingShoe.length, 416);
    const nextP8Advice = calculatePanda8Advantage(
      nextTCDetailsP8.tc,
      p8Settings.threshold,
      p8Settings.betMode,
      p8Settings.fixedUnitAmount,
      p8Bankroll
    );

    setABet({
      mainBet: null,
      mainAmount: settings.aDefaultBet,
      dragon7Amount: d7Settings.isAutoBetEnabled && nextD7Advice.shouldBet ? nextD7Advice.suggestedBet : 0,
      panda8Amount: p8Settings.isAutoBetEnabled && nextP8Advice.shouldBet ? nextP8Advice.suggestedBet : 0,
    });

    setBState({
      ...bRes.nextState,
      chaseWinsB: bRes.nextState.chaseWins,
      chaseLossesB: bRes.nextState.chaseLosses,
    });
    setB1State(b1Res.nextState);
    setB2State(b2Res.nextState);

    setTotalHandCount(newHandNum);
    setShoeHandCount(newShoeHandNum);
    setHandResults((prev) => [...prev, handRes]);
    setAllHandResults((prev) => {
      const updated = [...prev, handRes];
      return updated.length > 1000 ? updated.slice(-1000) : updated;
    });

    // Update Dragon 7 Incremental Stats
    if (handRes.isDragon7) {
      setD7Stats((prev) => ({
        d7TotalCount: prev.d7TotalCount + 1,
        aD7SideBetHits: prev.aD7SideBetHits + (handRes.aBet.dragon7Amount > 0 ? 1 : 0),
        aD7SideBetPayout: prev.aD7SideBetPayout + handRes.aSidePayout,
        aD7BankerPushes: prev.aD7BankerPushes + (handRes.aBet.mainBet === 'BANKER' ? 1 : 0),
        aD7PlayerLosses: prev.aD7PlayerLosses + (handRes.aBet.mainBet === 'PLAYER' ? 1 : 0),

        bD7BankerPushes: prev.bD7BankerPushes + (handRes.bBet?.mainBet === 'BANKER' ? 1 : 0),
        bD7PlayerLosses: prev.bD7PlayerLosses + (handRes.bBet?.mainBet === 'PLAYER' ? 1 : 0),
        bD7NoBets: prev.bD7NoBets + (!handRes.bBet || handRes.bBet.mainBet === null ? 1 : 0),

        b1D7BankerPushes: prev.b1D7BankerPushes + (handRes.b1Bet?.mainBet === 'BANKER' ? 1 : 0),
        b1D7PlayerLosses: prev.b1D7PlayerLosses + (handRes.b1Bet?.mainBet === 'PLAYER' ? 1 : 0),
        b1D7NoBets: prev.b1D7NoBets + (!handRes.b1Bet || handRes.b1Bet.mainBet === null ? 1 : 0),

        b2D7BankerPushes: prev.b2D7BankerPushes + (handRes.b2Bet?.mainBet === 'BANKER' ? 1 : 0),
        b2D7PlayerLosses: prev.b2D7PlayerLosses + (handRes.b2Bet?.mainBet === 'PLAYER' ? 1 : 0),
        b2D7NoBets: prev.b2D7NoBets + (!handRes.b2Bet || handRes.b2Bet.mainBet === null ? 1 : 0),
      }));
    }

    // Update Trend Points (Keep array small with downsampling if over 2000 points)
    const latestD7Net = effectiveD7Bet > 0 ? (isDragon7 ? effectiveD7Bet * 40 : -effectiveD7Bet) : 0;
    const prevD7Cum = d7History.length > 0 ? d7History[d7History.length - 1].cumulativeProfitAfter : 0;
    const currentD7Cum = prevD7Cum + latestD7Net;

    const latestP8Net = effectiveP8Bet > 0 ? (isPanda8 ? effectiveP8Bet * 25 : -effectiveP8Bet) : 0;
    const prevP8Cum = p8History.length > 0 ? p8History[p8History.length - 1].cumulativeProfitAfter : 0;
    const currentP8Cum = prevP8Cum + latestP8Net;

    const newTrendPt: TrendPoint = {
      handNumber: newHandNum,
      aCum: aBankrollAfter - 1000,
      bCum: bRes.bankrollAfter - 10000,
      b1Cum: (b1Res.bankrollAfter ?? 10000) - 10000,
      b2Cum: (b2Res.bankrollAfter ?? 10000) - 10000,
      d7Cum: currentD7Cum,
      p8Cum: currentP8Cum,
    };

    setTrendPoints((prev) => {
      const updated = [...prev, newTrendPt];
      if (updated.length > 2000) {
        const first = updated[0];
        const last = updated[updated.length - 1];
        const middle = updated.slice(1, -1).filter((_, idx) => idx % 2 === 0);
        return [first, ...middle, last];
      }
      return updated;
    });

    // Update Statistics
    setStats((prev) => {
      let aTotalHandsBet = prev.aTotalHandsBet;
      let aTotalWins = prev.aTotalWins;
      let aTotalLosses = prev.aTotalLosses;
      let aTotalPushes = prev.aTotalPushes;

      let aExhaustedHands = prev.aExhaustedHands;
      let aExhaustedWins = prev.aExhaustedWins;
      let aExhaustedLosses = prev.aExhaustedLosses;

      if (aBet.mainBet !== null) {
        aTotalHandsBet += 1;
        if (aMainResult === 'WIN') aTotalWins += 1;
        if (aMainResult === 'LOSS') aTotalLosses += 1;
        if (aMainResult === 'PUSH') aTotalPushes += 1;

        if (aIsExhausted) {
          aExhaustedHands += 1;
          if (aMainResult === 'WIN') aExhaustedWins += 1;
          if (aMainResult === 'LOSS') aExhaustedLosses += 1;
        }
      }

      const aMaxBankroll = Math.max(prev.aMaxBankroll, aBankrollAfter);
      const aMaxDrawdown = Math.max(prev.aMaxDrawdown, aMaxBankroll - aBankrollAfter);

      const bMaxBankroll = Math.max(prev.bMaxBankroll, bRes.bankrollAfter);
      const bMaxDrawdown = Math.max(prev.bMaxDrawdown, bMaxBankroll - bRes.bankrollAfter);

      const b1MaxBankroll = Math.max(prev.b1MaxBankroll ?? 10000, b1Res.bankrollAfter);
      const b1MaxDrawdown = Math.max(prev.b1MaxDrawdown ?? 0, b1MaxBankroll - b1Res.bankrollAfter);

      const b2MaxBankroll = Math.max(prev.b2MaxBankroll ?? 10000, b2Res.bankrollAfter);
      const b2MaxDrawdown = Math.max(prev.b2MaxDrawdown ?? 0, b2MaxBankroll - b2Res.bankrollAfter);

      const latestD7Bankroll = effectiveD7Bet > 0 ? (isDragon7 ? d7Bankroll + effectiveD7Bet * 40 : d7Bankroll - effectiveD7Bet) : d7Bankroll;
      const d7MaxBankroll = Math.max(prev.d7MaxBankroll ?? 10000, latestD7Bankroll);
      const d7MaxDrawdown = Math.max(prev.d7MaxDrawdown ?? 0, d7MaxBankroll - latestD7Bankroll);

      const latestP8Bankroll = effectiveP8Bet > 0 ? (isPanda8 ? p8Bankroll + effectiveP8Bet * 25 : p8Bankroll - effectiveP8Bet) : p8Bankroll;
      const p8MaxBankroll = Math.max(prev.p8MaxBankroll ?? 10000, latestP8Bankroll);
      const p8MaxDrawdown = Math.max(prev.p8MaxDrawdown ?? 0, p8MaxBankroll - latestP8Bankroll);

      return {
        aTotalHandsBet,
        aTotalWins,
        aTotalLosses,
        aTotalPushes,
        aChaseHandsBet: prev.aChaseHandsBet,
        aChaseWins: prev.aChaseWins,
        aChaseLosses: prev.aChaseLosses,
        aExhaustedHands,
        aExhaustedWins,
        aExhaustedLosses,
        aMaxBankroll,
        aMaxDrawdown,
        bMaxBankroll,
        bMaxDrawdown,
        b1MaxBankroll,
        b1MaxDrawdown,
        b2MaxBankroll,
        b2MaxDrawdown,
        d7MaxBankroll,
        d7MaxDrawdown,
        p8MaxBankroll,
        p8MaxDrawdown,
      };
    });

    setIsDealing(false);
  };

  const handleConfirmRecharge = (player: RechargePlayer, amount: number) => {
    if (player === 'A') setABankroll((prev) => prev + amount);
    else if (player === 'B') setBBankroll((prev) => prev + amount);
    else if (player === 'B-1') setB1Bankroll((prev) => prev + amount);
    else if (player === 'B-2') setB2Bankroll((prev) => prev + amount);
  };

  const handleSaveSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);

    // If historical shoes or current hand results exist, dynamically recalculate all data
    if (shoeHistory.length > 0 || handResults.length > 0) {
      const result = recalculateFullHistory({
        shoeHistory,
        currentHandResults: handResults,
        allHandResults,
        settings: newSettings,
        initialBankrolls: {
          a: 1000,
          b: 10000,
          b1: 10000,
          b2: 10000,
        },
      });

      setShoeHistory(result.updatedShoeHistory);
      setHandResults(result.updatedHandResults);
      setAllHandResults(result.updatedAllHandResults);

      setBBankroll(result.bankrolls.bBankroll);
      setB1Bankroll(result.bankrolls.b1Bankroll);
      setB2Bankroll(result.bankrolls.b2Bankroll);

      setBState(result.botStates.bState);
      setB1State(result.botStates.b1State);
      setB2State(result.botStates.b2State);

      setTrendPoints(result.trendPoints);
      setStats((prev) => ({
        ...prev,
        bMaxBankroll: result.stats.bMaxBankroll,
        bMaxDrawdown: result.stats.bMaxDrawdown,
        b1MaxBankroll: result.stats.b1MaxBankroll,
        b1MaxDrawdown: result.stats.b1MaxDrawdown,
        b2MaxBankroll: result.stats.b2MaxBankroll,
        b2MaxDrawdown: result.stats.b2MaxDrawdown,
      }));

      // Immediate localStorage synchronization
      try {
        const stateToSave = {
          aBankroll,
          bBankroll: result.bankrolls.bBankroll,
          b1Bankroll: result.bankrolls.b1Bankroll,
          b2Bankroll: result.bankrolls.b2Bankroll,
          bState: result.botStates.bState,
          b1State: result.botStates.b1State,
          b2State: result.botStates.b2State,
          stats: {
            ...stats,
            bMaxBankroll: result.stats.bMaxBankroll,
            bMaxDrawdown: result.stats.bMaxDrawdown,
            b1MaxBankroll: result.stats.b1MaxBankroll,
            b1MaxDrawdown: result.stats.b1MaxDrawdown,
            b2MaxBankroll: result.stats.b2MaxBankroll,
            b2MaxDrawdown: result.stats.b2MaxDrawdown,
          },
          d7Stats,
          trendPoints: result.trendPoints,
          settings: newSettings,
          handResults: result.updatedHandResults,
          allHandResults: result.updatedAllHandResults.slice(-300),
          shoeHistory: result.updatedShoeHistory.slice(-5000),
          totalHandCount,
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (e) {
        console.warn('LocalStorage save failed:', e);
      }
    }
  };

  const handleToggleResetMode = () => {
    const nextMode = settings.botTakeProfitResetMode === 'CUMULATIVE' ? 'ISOLATED_SHOE' : 'CUMULATIVE';
    handleSaveSettings({
      ...settings,
      botTakeProfitResetMode: nextMode,
    });
  };

  const handleChangeBotBetAmount = (player: 'B' | 'B1' | 'B2', amt: number) => {
    let updated = { ...settings };
    switch (player) {
      case 'B': updated = { ...updated, bChaseBet: amt }; break;
      case 'B1': updated = { ...updated, b1ChaseBet: amt }; break;
      case 'B2': updated = { ...updated, b2ChaseBet: amt }; break;
    }
    handleSaveSettings(updated);
  };

  const lastHandResult = handResults.length > 0 ? handResults[handResults.length - 1] : null;

  return (
    <div className="min-h-screen bg-[#051a0b] text-[#d4af37] p-1.5 sm:p-2.5 md:p-3 font-serif-casino selection:bg-[#b8860b] selection:text-black">
      <div className="max-w-7xl mx-auto space-y-2.5 sm:space-y-3.5">
        {/* Top Casino Header Bar */}
        <header className="flex flex-wrap justify-between items-center px-3 sm:px-4 py-1.5 bg-black/60 border-b border-[#b8860b]/40 rounded-xl shadow-2xl backdrop-blur-md gap-2">
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🎰</span>
              <h1 className="text-sm sm:text-base font-black font-serif-casino text-[#d4af37] tracking-wider text-shadow-gold">
                传统百家乐多对家追打系统
              </h1>
            </div>
            <div className="hidden md:block h-4 w-px bg-[#b8860b]/30" />
            <span className="text-[11px] text-[#d4af37]/70 font-sans hidden md:inline">
              SEED: <span className="text-white font-mono">{settings.prngSeed.slice(0, 10)}</span>
            </span>
            <div className="hidden md:block h-4 w-px bg-[#b8860b]/30" />
            <span className="text-[11px] text-[#d4af37]/70 font-sans">
              DECK: <span className="text-white font-mono font-bold">{shoe.length}</span> CARDS REMAIN
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-sans">
            {/* Quick Reset Mode Switcher */}
            <button
              type="button"
              onClick={handleToggleResetMode}
              className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1 border ${
                settings.botTakeProfitResetMode === 'CUMULATIVE'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 hover:bg-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 hover:bg-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              }`}
              title="点击直接切换止盈重置模式：单靴独立重置 vs 跨靴累计追亏"
            >
              <span className={settings.botTakeProfitResetMode === 'CUMULATIVE' ? 'text-amber-400' : 'text-emerald-400'}>●</span>
              <span>{settings.botTakeProfitResetMode === 'CUMULATIVE' ? '跨靴累计追亏' : '单靴独立重置'}</span>
            </button>

            <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-lg border border-emerald-500/30">
              <span className="text-emerald-400/80 font-serif italic text-[11px]">玩家A:</span>
              <span className="text-emerald-400 font-bold font-mono text-xs sm:text-sm">¥{aBankroll.toLocaleString()}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="bg-[#b8860b] hover:bg-yellow-500 text-black px-2.5 py-1 rounded font-bold text-[11px] uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              ⚙️ 设置
            </button>
          </div>
        </header>

        {/* Main Screen Layout */}
        <div className="space-y-2.5 sm:space-y-3.5">
          {/* iPad & Desktop Top Screen Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-2.5 sm:gap-3.5 items-start">
            {/* Left ~60%: Main Gaming Table Felt & Dragon-Panda Dual Counter (左右区分) */}
            <div className="lg:col-span-3 space-y-2 sm:space-y-2.5">
              <TableFelt
                playerCards={playerCards}
                bankerCards={bankerCards}
                playerScore={calculateHandScore(playerCards)}
                bankerScore={calculateHandScore(bankerCards)}
                isDealing={isDealing}
                aBet={aBet}
                bBet={getBotBet(bState, aBankroll === 0 ? settings.bPostExhaustionChaseBet : settings.bChaseBet, aBet.mainBet)}
                burnCard={burnCard}
                burnedCount={burnedCount}
                remainingCards={shoe.length}
                totalCards={416}
                aBankroll={aBankroll}
                aCumulativeProfit={handResults.length > 0 ? (handResults[handResults.length - 1].aCumulativeProfit ?? 0) : 0}
                onOpenRecharge={() => setRechargePlayer('A')}
              />

              {/* 龙猫双独立算牌系统 (左右区分: 左侧龙7, 右侧熊猫8, iPad横竖屏全幅展开直接可见) */}
              <Dragon7Counter
                handResults={handResults}
                burnCard={burnCard}
                burnedCount={burnedCount}
                remainingCards={shoe.length}
                currentD7Bet={aBet.dragon7Amount}
                currentP8Bet={aBet.panda8Amount}
                isDealing={isDealing}
                d7Settings={d7Settings}
                d7History={d7History}
                d7Bankroll={d7Bankroll}
                p8Settings={p8Settings}
                p8History={p8History}
                p8Bankroll={p8Bankroll}
                onUpdateSettings={setD7Settings}
                onSetD7Bet={(amt) => setABet((prev) => ({ ...prev, dragon7Amount: amt }))}
                onUpdateBankroll={setD7Bankroll}
                onClearHistory={() => setD7History([])}
                onUpdateP8Settings={setP8Settings}
                onSetP8Bet={(amt) => setABet((prev) => ({ ...prev, panda8Amount: amt }))}
                onUpdateP8Bankroll={setP8Bankroll}
                onClearP8History={() => setP8History([])}
              />
            </div>

            {/* Right ~40%: Big Road, Player A Betting Console & Hand History Log */}
            <div className="lg:col-span-2 space-y-2 sm:space-y-2.5">
              {/* 大路走势 */}
              <BigRoad handResults={handResults} />

              {/* 玩家A 投注操作台 (紧随大路下方，方便即时下注与点击开牌) */}
              <BettingConsole
                isDealing={isDealing}
                aBet={aBet}
                bBet={getBotBet(bState, aBankroll === 0 ? settings.bPostExhaustionChaseBet : settings.bChaseBet, aBet.mainBet)}
                aBankroll={aBankroll}
                enableSideBets={settings.aEnableSideBets}
                sideBetAmount={settings.sideBetAmount}
                lastHandResult={lastHandResult}
                onDeal={handleDealNextHand}
                onUpdateBet={setABet}
                onNewShoe={handleNewShoe}
                onResetSession={handleResetSession}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />

              {/* 逐笔开牌明细记录 (置于操作台下方，可一键折叠/展开，便于操作) */}
              <HandHistoryLog handResults={handResults} />
            </div>
          </div>

          {/* Player B, B-1, B-2 Status Panel */}
          <PlayerBStatus
            bBankroll={bBankroll}
            bState={bState}
            bCurrentBet={getBotBet(bState, aBankroll === 0 ? settings.bPostExhaustionChaseBet : settings.bChaseBet, aBet.mainBet)}
            bChaseBetAmount={aBankroll === 0 ? settings.bPostExhaustionChaseBet : settings.bChaseBet}

            b1Bankroll={b1Bankroll}
            b1State={b1State}
            b1CurrentBet={getBotBet(b1State, aBankroll === 0 ? (settings.b1PostExhaustionChaseBet ?? 200) : (settings.b1ChaseBet ?? 200), aBet.mainBet)}
            b1ChaseBetAmount={aBankroll === 0 ? (settings.b1PostExhaustionChaseBet ?? 200) : (settings.b1ChaseBet ?? 200)}

            b2Bankroll={b2Bankroll}
            b2State={b2State}
            b2CurrentBet={getBotBet(b2State, aBankroll === 0 ? (settings.b2PostExhaustionChaseBet ?? 200) : (settings.b2ChaseBet ?? 200), aBet.mainBet)}
            b2ChaseBetAmount={aBankroll === 0 ? (settings.b2PostExhaustionChaseBet ?? 200) : (settings.b2ChaseBet ?? 200)}

            aIsExhausted={aBankroll === 0}
            botTakeProfitResetMode={settings.botTakeProfitResetMode}
            onToggleResetMode={handleToggleResetMode}
            onOpenRecharge={setRechargePlayer}
            onChangeBetAmount={handleChangeBotBetAmount}
          />

          {/* Statistics & Analysis Panel */}
          <StatsPanel
            stats={stats}
            d7Stats={d7Stats}
            trendPoints={trendPoints}
            bState={bState}
            b1State={b1State}
            b2State={b2State}
            handResults={handResults}
            allHandResults={allHandResults}
            shoeHistory={shoeHistory}
            aBankroll={aBankroll}
            bBankroll={bBankroll}
            b1Bankroll={b1Bankroll}
            b2Bankroll={b2Bankroll}
            d7Bankroll={d7Bankroll}
            d7History={d7History}
            p8Bankroll={p8Bankroll}
            p8History={p8History}
            botTakeProfitResetMode={settings.botTakeProfitResetMode}
            onToggleResetMode={handleToggleResetMode}
            onResetSession={handleResetSession}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
        onExportSingleFileHTML={downloadStandaloneHtmlFile}
        onResetSession={handleResetSession}
      />

      {/* Recharge Modal */}
      <RechargeModal
        isOpen={rechargePlayer !== null}
        targetPlayer={rechargePlayer}
        onClose={() => setRechargePlayer(null)}
        onConfirmRecharge={handleConfirmRecharge}
      />
    </div>
  );
}
