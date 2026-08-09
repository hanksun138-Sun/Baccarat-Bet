import React, { useState, useEffect } from 'react';
import { TableFelt } from './components/TableFelt';
import { BetPanel } from './components/BetPanel';
import { PlayerBStatus } from './components/PlayerBStatus';
import { BigRoad } from './components/BigRoad';
import { StatsPanel } from './components/StatsPanel';
import { SettingsModal } from './components/SettingsModal';
import { RechargeModal } from './components/RechargeModal';
import {
  Card,
  GameSettings,
  GameStats,
  HandResult,
  PlayerBet,
  PlayerBBet,
  PlayerBState,
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

const LOCAL_STORAGE_KEY = 'baccarat_session_v1';

export default function App() {
  // Default Settings
  const [settings, setSettings] = useState<GameSettings>({
    cutCardDepth: 26,
    bChaseBet: 200,
    bPostExhaustionChaseBet: 200,
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

  // Current Bet Selections
  const [aBet, setABet] = useState<PlayerBet>({
    mainBet: null,
    mainAmount: 10,
    dragon7Amount: 0,
    panda8Amount: 0,
  });

  // Player B Chase State Machine
  const [bState, setBState] = useState<PlayerBState>({
    isChasing: false,
    aConsecutiveWins: 0,
    totalChasesTriggered: 0,
    totalChaseHands: 0,
    chaseWinsB: 0,
    chaseLossesB: 0,
  });

  // History & Statistics
  const [handResults, setHandResults] = useState<HandResult[]>([]);
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
  });

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [rechargePlayer, setRechargePlayer] = useState<'A' | 'B' | null>(null);

  // Initialize or Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.aBankroll !== undefined) setABankroll(parsed.aBankroll);
        if (parsed.bBankroll !== undefined) setBBankroll(parsed.bBankroll);
        if (parsed.bState) setBState(parsed.bState);
        if (parsed.stats) setStats(parsed.stats);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.handResults) setHandResults(parsed.handResults);
        if (parsed.totalHandCount) setTotalHandCount(parsed.totalHandCount);
      } catch (e) {
        console.error('Failed to parse saved session:', e);
      }
    }
    initializeShoe(settings.prngSeed);
  }, []);

  // Save session state to localStorage on update
  useEffect(() => {
    if (totalHandCount > 0) {
      const stateToSave = {
        aBankroll,
        bBankroll,
        bState,
        stats,
        settings,
        handResults,
        totalHandCount,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [aBankroll, bBankroll, bState, stats, settings, handResults, totalHandCount]);

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
    const newSeed = Date.now().toString();
    setSettings((prev) => ({ ...prev, prngSeed: newSeed }));
    initializeShoe(newSeed);
  };

  // Handle Global Session Reset
  const handleResetSession = () => {
    if (window.confirm('确认要一键恢复所有金额、买卖记录和数据统计分析为初始状态吗？这将重置双方资金、追打状态和所有历史对局记录。')) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      setABankroll(1000);
      setBBankroll(10000);
      setABet({
        mainBet: null,
        mainAmount: settings.aDefaultBet,
        dragon7Amount: 0,
        panda8Amount: 0,
      });
      setBState({
        isChasing: false,
        aConsecutiveWins: 0,
        totalChasesTriggered: 0,
        totalChaseHands: 0,
        chaseWinsB: 0,
        chaseLossesB: 0,
      });
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
      });
      setHandResults([]);
      setTotalHandCount(0);
      handleNewShoe();
    }
  };

  // Determine current predicted bet for Player B
  const getCurrentBBet = (): PlayerBBet => {
    const aIsExhausted = aBankroll === 0;
    const currentChaseAmount = aIsExhausted ? settings.bPostExhaustionChaseBet : settings.bChaseBet;

    if (bState.isChasing) {
      if (aBet.mainBet !== null) {
        return {
          mainBet: aBet.mainBet === 'PLAYER' ? 'BANKER' : 'PLAYER',
          mainAmount: currentChaseAmount,
        };
      }
    }
    return { mainBet: null, mainAmount: 0 };
  };

  // Deal Next Hand
  const handleDealNextHand = () => {
    if (isDealing) return;

    // Check if shoe cards remaining < cut depth
    if (shoe.length < settings.cutCardDepth) {
      alert(`牌鞋剩余牌数 (${shoe.length}) 已少于切牌深度 (${settings.cutCardDepth})。请点击【换新鞋】按钮开始新靴！`);
      return;
    }

    setIsDealing(true);

    const aIsExhausted = aBankroll === 0;
    const bBet = getCurrentBBet();

    // Deal Cards from Shoe
    const { playerCards: pCards, bankerCards: bCards, remainingShoe } = dealHand(shoe);
    setShoe(remainingShoe);

    const pScore = calculateHandScore(pCards);
    const bScore = calculateHandScore(bCards);

    // Winner Determination
    const winner = pScore > bScore ? 'PLAYER' : bScore > pScore ? 'BANKER' : 'TIE';

    const isDragon7 = bScore === 7 && bCards.length === 3 && winner === 'BANKER';
    const isPanda8 = pScore === 8 && pCards.length === 3 && winner === 'PLAYER';
    const isDragon7Push = false; // 免佣规则：所有庄赢均为1:1，不抽水也不和局

    // 1. Calculate Player A Payout
    let aMainPayout = 0;
    let aMainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET' = 'NO_BET';

    if (aBet.mainBet !== null && aBet.mainAmount > 0) {
      if (winner === 'TIE') {
        aMainPayout = 0; // Push refund
        aMainResult = 'PUSH';
      } else if (aBet.mainBet === 'BANKER') {
        if (winner === 'BANKER') {
          aMainPayout = aBet.mainAmount; // 1:1 免佣全赔
          aMainResult = 'WIN';
        } else {
          aMainPayout = -aBet.mainAmount;
          aMainResult = 'LOSS';
        }
      } else if (aBet.mainBet === 'PLAYER') {
        if (winner === 'PLAYER') {
          aMainPayout = aBet.mainAmount; // 1:1
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

    // 2. Calculate Player B Payout
    let bNetProfit = 0;
    let bMainResult: 'WIN' | 'LOSS' | 'PUSH' | 'NO_BET' = 'NO_BET';

    if (bBet.mainBet !== null && bBet.mainAmount > 0) {
      if (winner === 'TIE') {
        bNetProfit = 0;
        bMainResult = 'PUSH';
      } else if (bBet.mainBet === 'BANKER') {
        if (winner === 'BANKER') {
          bNetProfit = bBet.mainAmount; // 1:1 免佣全赔
          bMainResult = 'WIN';
        } else {
          bNetProfit = -bBet.mainAmount;
          bMainResult = 'LOSS';
        }
      } else if (bBet.mainBet === 'PLAYER') {
        if (winner === 'PLAYER') {
          bNetProfit = bBet.mainAmount;
          bMainResult = 'WIN';
        } else {
          bNetProfit = -bBet.mainAmount;
          bMainResult = 'LOSS';
        }
      }
    }

    const bBankrollAfter = Math.max(0, bBankroll + bNetProfit);

    // 3. Update Player B Chase State Machine
    let nextIsChasing = bState.isChasing;
    let nextConsecutiveWins = bState.aConsecutiveWins;
    let totalChasesTriggered = bState.totalChasesTriggered;
    let totalChaseHands = bState.totalChaseHands;
    let chaseWinsB = bState.chaseWinsB;
    let chaseLossesB = bState.chaseLossesB;

    if (!bState.isChasing) {
      // Trigger Chase condition: Player A lost a main bet
      if (aMainResult === 'LOSS') {
        nextIsChasing = true;
        nextConsecutiveWins = 0;
        totalChasesTriggered += 1;
      }
    } else {
      // Currently Chasing
      if (bBet.mainBet !== null) {
        totalChaseHands += 1;
        if (bMainResult === 'WIN') chaseWinsB += 1;
        if (bMainResult === 'LOSS') chaseLossesB += 1;
      }

      // Exit or streak evaluation
      if (aMainResult === 'NO_BET' || aMainResult === 'PUSH') {
        // Skip: Consecutive win count remains unchanged
        nextConsecutiveWins = bState.aConsecutiveWins;
      } else if (aMainResult === 'WIN') {
        nextConsecutiveWins = bState.aConsecutiveWins + 1;
        if (nextConsecutiveWins >= 3) {
          nextIsChasing = false; // Exit chase mode
          nextConsecutiveWins = 0;
        }
      } else if (aMainResult === 'LOSS') {
        nextConsecutiveWins = 0; // Reset win streak, stay chasing
      }
    }

    // Hand numbers
    const newHandNum = totalHandCount + 1;
    const newShoeHandNum = shoeHandCount + 1;

    const prevACumulative = handResults.length > 0 ? (handResults[handResults.length - 1].aCumulativeProfit ?? 0) : 0;
    const aCumulativeProfit = prevACumulative + aNetProfit;

    const prevBCumulative = handResults.length > 0 ? (handResults[handResults.length - 1].bCumulativeProfit ?? 0) : 0;
    const bCumulativeProfit = prevBCumulative + bNetProfit;

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

      bBet,
      bWasChasing: bState.isChasing,
      bMainResult,
      bNetProfit,
      bCumulativeProfit,
      bBankrollAfter,

      bChasingAfter: nextIsChasing,
      aConsecutiveWinsAfter: nextConsecutiveWins,
      aWasExhausted: aIsExhausted,
      timestamp: Date.now(),
    };

    // Update States
    setPlayerCards(pCards);
    setBankerCards(bCards);
    setABankroll(aBankrollAfter);
    setBBankroll(bBankrollAfter);

    // Reset Player A bet selection for the next hand
    setABet({
      mainBet: null,
      mainAmount: settings.aDefaultBet,
      dragon7Amount: 0,
      panda8Amount: 0,
    });

    setBState({
      isChasing: nextIsChasing,
      aConsecutiveWins: nextConsecutiveWins,
      totalChasesTriggered,
      totalChaseHands,
      chaseWinsB,
      chaseLossesB,
    });

    setTotalHandCount(newHandNum);
    setShoeHandCount(newShoeHandNum);
    setHandResults((prev) => [...prev, handRes]);

    // Update Statistics
    setStats((prev) => {
      let aTotalHandsBet = prev.aTotalHandsBet;
      let aTotalWins = prev.aTotalWins;
      let aTotalLosses = prev.aTotalLosses;
      let aTotalPushes = prev.aTotalPushes;

      let aChaseHandsBet = prev.aChaseHandsBet;
      let aChaseWins = prev.aChaseWins;
      let aChaseLosses = prev.aChaseLosses;

      let aExhaustedHands = prev.aExhaustedHands;
      let aExhaustedWins = prev.aExhaustedWins;
      let aExhaustedLosses = prev.aExhaustedLosses;

      if (aBet.mainBet !== null) {
        aTotalHandsBet += 1;
        if (aMainResult === 'WIN') aTotalWins += 1;
        if (aMainResult === 'LOSS') aTotalLosses += 1;
        if (aMainResult === 'PUSH') aTotalPushes += 1;

        if (bState.isChasing) {
          aChaseHandsBet += 1;
          if (aMainResult === 'WIN') aChaseWins += 1;
          if (aMainResult === 'LOSS') aChaseLosses += 1;
        }

        if (aIsExhausted) {
          aExhaustedHands += 1;
          if (aMainResult === 'WIN') aExhaustedWins += 1;
          if (aMainResult === 'LOSS') aExhaustedLosses += 1;
        }
      }

      const aMaxBankroll = Math.max(prev.aMaxBankroll, aBankrollAfter);
      const aMaxDrawdown = Math.max(prev.aMaxDrawdown, aMaxBankroll - aBankrollAfter);

      const bMaxBankroll = Math.max(prev.bMaxBankroll, bBankrollAfter);
      const bMaxDrawdown = Math.max(prev.bMaxDrawdown, bMaxBankroll - bBankrollAfter);

      return {
        aTotalHandsBet,
        aTotalWins,
        aTotalLosses,
        aTotalPushes,
        aChaseHandsBet,
        aChaseWins,
        aChaseLosses,
        aExhaustedHands,
        aExhaustedWins,
        aExhaustedLosses,
        aMaxBankroll,
        aMaxDrawdown,
        bMaxBankroll,
        bMaxDrawdown,
      };
    });

    setIsDealing(false);
  };

  // Handle Manual Top-up
  const handleConfirmRecharge = (player: 'A' | 'B', amount: number) => {
    if (player === 'A') {
      setABankroll((prev) => prev + amount);
    } else {
      setBBankroll((prev) => prev + amount);
    }
  };

  const lastHandResult = handResults.length > 0 ? handResults[handResults.length - 1] : null;
  const currentChaseAmount = aBankroll === 0 ? settings.bPostExhaustionChaseBet : settings.bChaseBet;

  return (
    <div className="min-h-screen bg-[#051a0b] text-[#d4af37] p-2 sm:p-4 md:p-6 font-serif-casino selection:bg-[#b8860b] selection:text-black">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Top Casino Header Bar */}
        <header className="flex flex-wrap justify-between items-center px-4 sm:px-6 py-2.5 bg-black/60 border-b border-[#b8860b]/40 rounded-xl shadow-2xl backdrop-blur-md gap-3">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🎰</span>
              <h1 className="text-base sm:text-lg font-black font-serif-casino text-[#d4af37] tracking-wider text-shadow-gold">
                传统百家乐双人对战
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

          <div className="flex items-center gap-3 sm:gap-6 text-xs font-sans">
            <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-lg border border-emerald-500/30">
              <span className="text-emerald-400/80 font-serif italic text-[11px]">PLAYER A:</span>
              <span className="text-emerald-400 font-bold font-mono text-sm">¥{aBankroll.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-black/50 px-3 py-1.5 rounded-lg border border-amber-500/30">
              <span className="text-amber-400/80 font-serif italic text-[11px]">PLAYER B:</span>
              <span className="text-amber-400 font-bold font-mono text-sm">¥{bBankroll.toLocaleString()}</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="bg-[#b8860b] hover:bg-yellow-500 text-black px-3 py-1.5 rounded font-bold text-[11px] uppercase tracking-wider transition-all shadow-md active:scale-95 touch-manipulation"
            >
              ⚙️ 设置
            </button>
          </div>
        </header>

        {/* iPad-Optimized Main Screen: Unified Cards + Operation Console & Road Maps & Player B Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
          <div className="lg:col-span-2 space-y-4">
            <TableFelt
              playerCards={playerCards}
              bankerCards={bankerCards}
              playerScore={calculateHandScore(playerCards)}
              bankerScore={calculateHandScore(bankerCards)}
              isDealing={isDealing}
              lastHandResult={lastHandResult}
              aBet={aBet}
              bBet={getCurrentBBet()}
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

            {/* Player B Chase Status Panel */}
            <PlayerBStatus
              bBankroll={bBankroll}
              bState={bState}
              bCurrentBet={getCurrentBBet()}
              currentChaseBetAmount={currentChaseAmount}
              aIsExhausted={aBankroll === 0}
              onOpenRechargeB={() => setRechargePlayer('B')}
              onChangeChaseBetAmount={(amt) => setSettings((prev) => ({ ...prev, bChaseBet: amt }))}
            />
          </div>

          <div className="lg:col-span-1">
            {/* Road Maps (大路 & 珠盘路走势) */}
            <BigRoad handResults={handResults} />
          </div>
        </div>

        {/* Statistics & Bankroll Curve */}
        <StatsPanel
          stats={stats}
          bState={bState}
          handResults={handResults}
          aBankroll={aBankroll}
          bBankroll={bBankroll}
          onResetSession={handleResetSession}
        />
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
