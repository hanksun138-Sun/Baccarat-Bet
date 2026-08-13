import React, { useState, useEffect } from 'react';
import { TableFelt } from './components/TableFelt';
import { PlayerBStatus } from './components/PlayerBStatus';
import { BigRoad } from './components/BigRoad';
import { StatsPanel } from './components/StatsPanel';
import { SettingsModal } from './components/SettingsModal';
import { RechargeModal, RechargePlayer } from './components/RechargeModal';
import {
  Card,
  D7Stats,
  GameSettings,
  GameStats,
  HandResult,
  PlayerBet,
  PlayerBBet,
  PlayerBState,
  PlayerBotState,
  PlayerCState,
  ShoeRecord,
  TrendPoint,
  initialD7Stats,
} from './types';
import {
  calculateHandScore,
  createEightDecks,
  dealHand,
  mulberry32,
  shuffleDeck,
  stringToSeed,
} from './utils/baccarat';
import { downloadStandaloneHtmlFile } from './utils/exportSingleFileHtml';

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
    cChaseBet: 200,
    cPostExhaustionChaseBet: 200,
    c1ChaseBet: 200,
    c1PostExhaustionChaseBet: 200,
    c2ChaseBet: 200,
    c2PostExhaustionChaseBet: 200,
    aDefaultBet: 10,
    aEnableSideBets: true,
    sideBetAmount: 10,
    prngSeed: Date.now().toString(),
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
  const [cBankroll, setCBankroll] = useState<number>(10000);
  const [c1Bankroll, setC1Bankroll] = useState<number>(10000);
  const [c2Bankroll, setC2Bankroll] = useState<number>(10000);

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

  const [cState, setCState] = useState<PlayerCState>({
    ...defaultBotState,
    chaseWinsC: 0,
    chaseLossesC: 0,
  });
  const [c1State, setC1State] = useState<PlayerBotState>(defaultBotState);
  const [c2State, setC2State] = useState<PlayerBotState>(defaultBotState);

  // History & Statistics
  const [handResults, setHandResults] = useState<HandResult[]>([]);
  const [allHandResults, setAllHandResults] = useState<HandResult[]>([]);
  const [shoeHistory, setShoeHistory] = useState<ShoeRecord[]>([]);
  const [d7Stats, setD7Stats] = useState<D7Stats>(initialD7Stats);
  const [trendPoints, setTrendPoints] = useState<TrendPoint[]>([
    { handNumber: 0, aCum: 0, bCum: 0, b1Cum: 0, b2Cum: 0, cCum: 0, c1Cum: 0, c2Cum: 0 },
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
    cMaxBankroll: 10000,
    cMaxDrawdown: 0,
    c1MaxBankroll: 10000,
    c1MaxDrawdown: 0,
    c2MaxBankroll: 10000,
    c2MaxDrawdown: 0,
  });

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [rechargePlayer, setRechargePlayer] = useState<RechargePlayer | null>(null);

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
        if (parsed.cBankroll !== undefined) setCBankroll(parsed.cBankroll);
        if (parsed.c1Bankroll !== undefined) setC1Bankroll(parsed.c1Bankroll);
        if (parsed.c2Bankroll !== undefined) setC2Bankroll(parsed.c2Bankroll);

        if (parsed.bState) setBState(parsed.bState);
        if (parsed.b1State) setB1State(parsed.b1State);
        if (parsed.b2State) setB2State(parsed.b2State);
        if (parsed.cState) setCState(parsed.cState);
        if (parsed.c1State) setC1State(parsed.c1State);
        if (parsed.c2State) setC2State(parsed.c2State);

        if (parsed.stats) setStats(parsed.stats);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.handResults) setHandResults(parsed.handResults);
        
        const handsForInit: HandResult[] = parsed.allHandResults || parsed.handResults || [];
        if (parsed.allHandResults) setAllHandResults(parsed.allHandResults);
        else if (parsed.handResults) setAllHandResults(parsed.handResults);
        
        if (parsed.shoeHistory) setShoeHistory(parsed.shoeHistory);
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

              if (h.cBet?.mainBet === 'BANKER') reconstructedD7.cD7BankerPushes++;
              if (h.cBet?.mainBet === 'PLAYER') reconstructedD7.cD7PlayerLosses++;
              if (!h.cBet || h.cBet.mainBet === null) reconstructedD7.cD7NoBets++;

              if (h.c1Bet?.mainBet === 'BANKER') reconstructedD7.c1D7BankerPushes++;
              if (h.c1Bet?.mainBet === 'PLAYER') reconstructedD7.c1D7PlayerLosses++;
              if (!h.c1Bet || h.c1Bet.mainBet === null) reconstructedD7.c1D7NoBets++;

              if (h.c2Bet?.mainBet === 'BANKER') reconstructedD7.c2D7BankerPushes++;
              if (h.c2Bet?.mainBet === 'PLAYER') reconstructedD7.c2D7PlayerLosses++;
              if (!h.c2Bet || h.c2Bet.mainBet === null) reconstructedD7.c2D7NoBets++;
            }
          });
          setD7Stats(reconstructedD7);
        }

        if (parsed.trendPoints) {
          setTrendPoints(parsed.trendPoints);
        } else if (handsForInit.length > 0) {
          const reconstructedPts: TrendPoint[] = [
            { handNumber: 0, aCum: 0, bCum: 0, b1Cum: 0, b2Cum: 0, cCum: 0, c1Cum: 0, c2Cum: 0 },
            ...handsForInit.map((h) => ({
              handNumber: h.handNumber,
              aCum: h.aBankrollAfter - 1000,
              bCum: h.bBankrollAfter - 10000,
              b1Cum: (h.b1BankrollAfter ?? 10000) - 10000,
              b2Cum: (h.b2BankrollAfter ?? 10000) - 10000,
              cCum: (h.cBankrollAfter ?? 10000) - 10000,
              c1Cum: (h.c1BankrollAfter ?? 10000) - 10000,
              c2Cum: (h.c2BankrollAfter ?? 10000) - 10000,
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
          cBankroll,
          c1Bankroll,
          c2Bankroll,
          bState,
          b1State,
          b2State,
          cState,
          c1State,
          c2State,
          stats,
          d7Stats,
          trendPoints,
          settings,
          handResults,
          allHandResults: allHandResults.slice(-300),
          shoeHistory: shoeHistory.slice(-5000),
          totalHandCount,
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
    cBankroll,
    c1Bankroll,
    c2Bankroll,
    bState,
    b1State,
    b2State,
    cState,
    c1State,
    c2State,
    stats,
    d7Stats,
    trendPoints,
    settings,
    handResults,
    allHandResults,
    shoeHistory,
    totalHandCount,
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
      const cProfit = handResults.reduce((sum, h) => sum + (h.cNetProfit ?? 0), 0);
      const c1Profit = handResults.reduce((sum, h) => sum + (h.c1NetProfit ?? 0), 0);
      const c2Profit = handResults.reduce((sum, h) => sum + (h.c2NetProfit ?? 0), 0);

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
        cProfit,
        c1Profit,
        c2Profit,
        bankerWins,
        playerWins,
        ties,
        dragon7Count,
        panda8Count,
        aBankrollEnd: aBankroll,
        bBankrollEnd: bBankroll,
        b1BankrollEnd: b1Bankroll,
        b2BankrollEnd: b2Bankroll,
        cBankrollEnd: cBankroll,
        c1BankrollEnd: c1Bankroll,
        c2BankrollEnd: c2Bankroll,
        timestamp: Date.now(),
      };

      setShoeHistory((prev) => [...prev, record]);
    }

    // Reset Bot states for the new shoe
    const resetBotForNewShoe = (st: PlayerBotState): PlayerBotState => {
      const reachedTarget = st.isTakeProfitStopped;
      return {
        ...st,
        isChasing: false,
        aConsecutiveWins: 0,
        isTakeProfitStopped: false,
        // If reached target in previous shoe, reset profit cycle to 0. Otherwise carry over loss/progress!
        profitSinceReset: reachedTarget ? 0 : st.profitSinceReset,
      };
    };

    setBState((prev) => ({
      ...resetBotForNewShoe(prev),
      chaseWinsB: prev.chaseWinsB,
      chaseLossesB: prev.chaseLossesB,
    }));
    setB1State(resetBotForNewShoe);
    setB2State(resetBotForNewShoe);
    setCState((prev) => ({
      ...resetBotForNewShoe(prev),
      chaseWinsC: prev.chaseWinsC,
      chaseLossesC: prev.chaseLossesC,
    }));
    setC1State(resetBotForNewShoe);
    setC2State(resetBotForNewShoe);

    const newSeed = Date.now().toString();
    setSettings((prev) => ({ ...prev, prngSeed: newSeed }));
    initializeShoe(newSeed);
    setHandResults([]); // Clear road map for the new shoe
  };

  // Handle Global Session Reset
  const handleResetSession = () => {
    if (window.confirm('确认要一键恢复所有金额、对局记录和数据统计分析为初始状态吗？这将重置所有6位对家资金、追打状态和所有历史对局记录。')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setABankroll(1000);
      setBBankroll(10000);
      setB1Bankroll(10000);
      setB2Bankroll(10000);
      setCBankroll(10000);
      setC1Bankroll(10000);
      setC2Bankroll(10000);

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
      setCState({ ...freshBotState, chaseWinsC: 0, chaseLossesC: 0 });
      setC1State(freshBotState);
      setC2State(freshBotState);

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
        cMaxBankroll: 10000,
        cMaxDrawdown: 0,
        c1MaxBankroll: 10000,
        c1MaxDrawdown: 0,
        c2MaxBankroll: 10000,
        c2MaxDrawdown: 0,
      });

      setD7Stats(initialD7Stats);
      setTrendPoints([
        { handNumber: 0, aCum: 0, bCum: 0, b1Cum: 0, b2Cum: 0, cCum: 0, c1Cum: 0, c2Cum: 0 },
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
    aMainResult,
    aBetMainBet,
    winner,
  }: {
    currentState: PlayerBotState;
    currentBankroll: number;
    chaseBetAmount: number;
    maxWinsToExit: number;
    takeProfitUnits: number;
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

    // Side Bets Payout
    let aSidePayout = 0;
    if (aBet.dragon7Amount > 0) {
      aSidePayout += isDragon7 ? aBet.dragon7Amount * 40 : -aBet.dragon7Amount;
    }
    if (aBet.panda8Amount > 0) {
      aSidePayout += isPanda8 ? aBet.panda8Amount * 25 : -aBet.panda8Amount;
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

    // 5. Process Bot C (2 wins exit, no take profit)
    const cChaseBetAmt = aIsExhausted ? (settings.cPostExhaustionChaseBet ?? 200) : (settings.cChaseBet ?? 200);
    const cRes = processBotHand({
      currentState: cState,
      currentBankroll: cBankroll,
      chaseBetAmount: cChaseBetAmt,
      maxWinsToExit: 2,
      takeProfitUnits: 0,
      aMainResult,
      aBetMainBet: aBet.mainBet,
      winner,
    });

    // 6. Process Bot C-1 (2 wins exit, 3 units take profit)
    const c1ChaseBetAmt = aIsExhausted ? (settings.c1PostExhaustionChaseBet ?? 200) : (settings.c1ChaseBet ?? 200);
    const c1Res = processBotHand({
      currentState: c1State,
      currentBankroll: c1Bankroll,
      chaseBetAmount: c1ChaseBetAmt,
      maxWinsToExit: 2,
      takeProfitUnits: 3,
      aMainResult,
      aBetMainBet: aBet.mainBet,
      winner,
    });

    // 7. Process Bot C-2 (2 wins exit, 2 units take profit)
    const c2ChaseBetAmt = aIsExhausted ? (settings.c2PostExhaustionChaseBet ?? 200) : (settings.c2ChaseBet ?? 200);
    const c2Res = processBotHand({
      currentState: c2State,
      currentBankroll: c2Bankroll,
      chaseBetAmount: c2ChaseBetAmt,
      maxWinsToExit: 2,
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

    const prevCCumulative = handResults.length > 0 ? (handResults[handResults.length - 1].cCumulativeProfit ?? 0) : 0;
    const cCumulativeProfit = prevCCumulative + cRes.netProfit;

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

      aBet: { ...aBet },
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

      cBet: cRes.bet,
      cWasChasing: cState.isChasing,
      cMainResult: cRes.mainResult,
      cNetProfit: cRes.netProfit,
      cCumulativeProfit,
      cBankrollAfter: cRes.bankrollAfter,

      c1Bet: c1Res.bet,
      c1WasChasing: c1State.isChasing,
      c1MainResult: c1Res.mainResult,
      c1NetProfit: c1Res.netProfit,
      c1BankrollAfter: c1Res.bankrollAfter,
      c1TakeProfitStoppedAfter: c1Res.takeProfitStoppedAfter,

      c2Bet: c2Res.bet,
      c2WasChasing: c2State.isChasing,
      c2MainResult: c2Res.mainResult,
      c2NetProfit: c2Res.netProfit,
      c2BankrollAfter: c2Res.bankrollAfter,
      c2TakeProfitStoppedAfter: c2Res.takeProfitStoppedAfter,

      bChasingAfter: bRes.nextState.isChasing,
      aConsecutiveWinsAfter: bRes.nextState.aConsecutiveWins,
      cChasingAfter: cRes.nextState.isChasing,
      aConsecutiveWinsAfterC: cRes.nextState.aConsecutiveWins,
      aWasExhausted: aIsExhausted,
      timestamp: Date.now(),
    };

    // Update States
    setPlayerCards(pCards);
    setBankerCards(bCards);
    setABankroll(aBankrollAfter);
    setBBankroll(bRes.bankrollAfter);
    setB1Bankroll(b1Res.bankrollAfter);
    setB2Bankroll(b2Res.bankrollAfter);
    setCBankroll(cRes.bankrollAfter);
    setC1Bankroll(c1Res.bankrollAfter);
    setC2Bankroll(c2Res.bankrollAfter);

    setABet({
      mainBet: null,
      mainAmount: settings.aDefaultBet,
      dragon7Amount: 0,
      panda8Amount: 0,
    });

    setBState({
      ...bRes.nextState,
      chaseWinsB: bRes.nextState.chaseWins,
      chaseLossesB: bRes.nextState.chaseLosses,
    });
    setB1State(b1Res.nextState);
    setB2State(b2Res.nextState);

    setCState({
      ...cRes.nextState,
      chaseWinsC: cRes.nextState.chaseWins,
      chaseLossesC: cRes.nextState.chaseLosses,
    });
    setC1State(c1Res.nextState);
    setC2State(c2Res.nextState);

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

        cD7BankerPushes: prev.cD7BankerPushes + (handRes.cBet?.mainBet === 'BANKER' ? 1 : 0),
        cD7PlayerLosses: prev.cD7PlayerLosses + (handRes.cBet?.mainBet === 'PLAYER' ? 1 : 0),
        cD7NoBets: prev.cD7NoBets + (!handRes.cBet || handRes.cBet.mainBet === null ? 1 : 0),

        c1D7BankerPushes: prev.c1D7BankerPushes + (handRes.c1Bet?.mainBet === 'BANKER' ? 1 : 0),
        c1D7PlayerLosses: prev.c1D7PlayerLosses + (handRes.c1Bet?.mainBet === 'PLAYER' ? 1 : 0),
        c1D7NoBets: prev.c1D7NoBets + (!handRes.c1Bet || handRes.c1Bet.mainBet === null ? 1 : 0),

        c2D7BankerPushes: prev.c2D7BankerPushes + (handRes.c2Bet?.mainBet === 'BANKER' ? 1 : 0),
        c2D7PlayerLosses: prev.c2D7PlayerLosses + (handRes.c2Bet?.mainBet === 'PLAYER' ? 1 : 0),
        c2D7NoBets: prev.c2D7NoBets + (!handRes.c2Bet || handRes.c2Bet.mainBet === null ? 1 : 0),
      }));
    }

    // Update Trend Points (Keep array small with downsampling if over 2000 points)
    const newTrendPt: TrendPoint = {
      handNumber: newHandNum,
      aCum: aBankrollAfter - 1000,
      bCum: bRes.bankrollAfter - 10000,
      b1Cum: (b1Res.bankrollAfter ?? 10000) - 10000,
      b2Cum: (b2Res.bankrollAfter ?? 10000) - 10000,
      cCum: (cRes.bankrollAfter ?? 10000) - 10000,
      c1Cum: (c1Res.bankrollAfter ?? 10000) - 10000,
      c2Cum: (c2Res.bankrollAfter ?? 10000) - 10000,
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

      const cMaxBankroll = Math.max(prev.cMaxBankroll, cRes.bankrollAfter);
      const cMaxDrawdown = Math.max(prev.cMaxDrawdown, cMaxBankroll - cRes.bankrollAfter);

      const c1MaxBankroll = Math.max(prev.c1MaxBankroll ?? 10000, c1Res.bankrollAfter);
      const c1MaxDrawdown = Math.max(prev.c1MaxDrawdown ?? 0, c1MaxBankroll - c1Res.bankrollAfter);

      const c2MaxBankroll = Math.max(prev.c2MaxBankroll ?? 10000, c2Res.bankrollAfter);
      const c2MaxDrawdown = Math.max(prev.c2MaxDrawdown ?? 0, c2MaxBankroll - c2Res.bankrollAfter);

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
        cMaxBankroll,
        cMaxDrawdown,
        c1MaxBankroll,
        c1MaxDrawdown,
        c2MaxBankroll,
        c2MaxDrawdown,
      };
    });

    setIsDealing(false);
  };

  const handleConfirmRecharge = (player: RechargePlayer, amount: number) => {
    if (player === 'A') setABankroll((prev) => prev + amount);
    else if (player === 'B') setBBankroll((prev) => prev + amount);
    else if (player === 'B-1') setB1Bankroll((prev) => prev + amount);
    else if (player === 'B-2') setB2Bankroll((prev) => prev + amount);
    else if (player === 'C') setCBankroll((prev) => prev + amount);
    else if (player === 'C-1') setC1Bankroll((prev) => prev + amount);
    else if (player === 'C-2') setC2Bankroll((prev) => prev + amount);
  };

  const handleChangeBotBetAmount = (player: 'B' | 'B1' | 'B2' | 'C' | 'C1' | 'C2', amt: number) => {
    setSettings((prev) => {
      switch (player) {
        case 'B': return { ...prev, bChaseBet: amt };
        case 'B1': return { ...prev, b1ChaseBet: amt };
        case 'B2': return { ...prev, b2ChaseBet: amt };
        case 'C': return { ...prev, cChaseBet: amt };
        case 'C1': return { ...prev, c1ChaseBet: amt };
        case 'C2': return { ...prev, c2ChaseBet: amt };
        default: return prev;
      }
    });
  };

  const lastHandResult = handResults.length > 0 ? handResults[handResults.length - 1] : null;

  return (
    <div className="min-h-screen bg-[#051a0b] text-[#d4af37] p-2 sm:p-4 md:p-6 font-serif-casino selection:bg-[#b8860b] selection:text-black">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Top Casino Header Bar */}
        <header className="flex flex-wrap justify-between items-center px-4 sm:px-6 py-2.5 bg-black/60 border-b border-[#b8860b]/40 rounded-xl shadow-2xl backdrop-blur-md gap-3">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🎰</span>
              <h1 className="text-base sm:text-lg font-black font-serif-casino text-[#d4af37] tracking-wider text-shadow-gold">
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

          <div className="flex items-center gap-2 sm:gap-4 text-xs font-sans">
            <div className="flex items-center gap-1.5 bg-black/50 px-2.5 py-1.5 rounded-lg border border-emerald-500/30">
              <span className="text-emerald-400/80 font-serif italic text-[11px]">玩家A:</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">¥{aBankroll.toLocaleString()}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="bg-[#b8860b] hover:bg-yellow-500 text-black px-3 py-1.5 rounded font-bold text-[11px] uppercase tracking-wider transition-all shadow-md active:scale-95 cursor-pointer"
            >
              ⚙️ 设置
            </button>
          </div>
        </header>

        {/* Main Screen Layout */}
        <div className="space-y-4 md:space-y-5">
          {/* iPad Top Screen Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 md:gap-5 items-start">
            {/* Left ~60%: Main Gaming Table */}
            <div className="lg:col-span-3">
              <TableFelt
                playerCards={playerCards}
                bankerCards={bankerCards}
                playerScore={calculateHandScore(playerCards)}
                bankerScore={calculateHandScore(bankerCards)}
                isDealing={isDealing}
                lastHandResult={lastHandResult}
                aBet={aBet}
                bBet={getBotBet(bState, aBankroll === 0 ? settings.bPostExhaustionChaseBet : settings.bChaseBet, aBet.mainBet)}
                burnCard={burnCard}
                burnedCount={burnedCount}
                remainingCards={shoe.length}
                totalCards={416}
                aBankroll={aBankroll}
                aCumulativeProfit={handResults.length > 0 ? (handResults[handResults.length - 1].aCumulativeProfit ?? 0) : 0}
                enableSideBets={settings.aEnableSideBets}
                sideBetAmount={settings.sideBetAmount}
                onDeal={handleDealNextHand}
                onUpdateBet={setABet}
                onNewShoe={handleNewShoe}
                onResetSession={handleResetSession}
                onOpenRecharge={() => setRechargePlayer('A')}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            </div>

            {/* Right ~40%: Road Maps */}
            <div className="lg:col-span-2">
              <BigRoad handResults={handResults} />
            </div>
          </div>

          {/* Player B, B-1, B-2, C, C-1, C-2 Status Panel */}
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

            cBankroll={cBankroll}
            cState={cState}
            cCurrentBet={getBotBet(cState, aBankroll === 0 ? (settings.cPostExhaustionChaseBet ?? 200) : (settings.cChaseBet ?? 200), aBet.mainBet)}
            cChaseBetAmount={aBankroll === 0 ? (settings.cPostExhaustionChaseBet ?? 200) : (settings.cChaseBet ?? 200)}

            c1Bankroll={c1Bankroll}
            c1State={c1State}
            c1CurrentBet={getBotBet(c1State, aBankroll === 0 ? (settings.c1PostExhaustionChaseBet ?? 200) : (settings.c1ChaseBet ?? 200), aBet.mainBet)}
            c1ChaseBetAmount={aBankroll === 0 ? (settings.c1PostExhaustionChaseBet ?? 200) : (settings.c1ChaseBet ?? 200)}

            c2Bankroll={c2Bankroll}
            c2State={c2State}
            c2CurrentBet={getBotBet(c2State, aBankroll === 0 ? (settings.c2PostExhaustionChaseBet ?? 200) : (settings.c2ChaseBet ?? 200), aBet.mainBet)}
            c2ChaseBetAmount={aBankroll === 0 ? (settings.c2PostExhaustionChaseBet ?? 200) : (settings.c2ChaseBet ?? 200)}

            aIsExhausted={aBankroll === 0}
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
            cState={cState}
            c1State={c1State}
            c2State={c2State}
            handResults={handResults}
            allHandResults={allHandResults}
            shoeHistory={shoeHistory}
            aBankroll={aBankroll}
            bBankroll={bBankroll}
            b1Bankroll={b1Bankroll}
            b2Bankroll={b2Bankroll}
            cBankroll={cBankroll}
            c1Bankroll={c1Bankroll}
            c2Bankroll={c2Bankroll}
            onResetSession={handleResetSession}
          />
        </div>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={setSettings}
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
