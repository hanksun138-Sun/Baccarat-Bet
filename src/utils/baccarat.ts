import { Card, CardRank, HandResult, PlayerBet, PlayerBBet, SideBets, Suit, BigRoadCell } from '../types';

// Mulberry32 PRNG
export function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Generate high-entropy seed combining hardware crypto entropy and high-res timestamp
export function generateRandomSeed(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(2);
    crypto.getRandomValues(arr);
    return `${Date.now()}_${arr[0].toString(16)}${arr[1].toString(16)}`;
  }
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// High quality FNV-1a 32-bit seed hasher
export function stringToSeed(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Baccarat point card value
export function getCardValue(rank: CardRank): number {
  if (rank === 'A') return 1;
  if (['10', 'J', 'Q', 'K'].includes(rank)) return 0;
  return parseInt(rank, 10);
}

// Burn value for burn cards
export function getBurnValue(rank: CardRank): number {
  if (rank === 'A') return 1;
  if (['10', 'J', 'Q', 'K'].includes(rank)) return 10;
  return parseInt(rank, 10);
}

// Create 8 decks (416 cards)
export function createEightDecks(): Card[] {
  const suits: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs'];
  const ranks: CardRank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const deck: Card[] = [];

  let cardId = 0;
  for (let d = 0; d < 8; d++) {
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push({
          id: `c_${d}_${suit}_${rank}_${cardId++}`,
          suit,
          rank,
          value: getCardValue(rank),
          burnValue: getBurnValue(rank),
        });
      }
    }
  }
  return deck;
}

// Fisher-Yates Shuffle using PRNG
export function shuffleDeck(deck: Card[], prng: () => number): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Calculate total point score modulo 10
export function calculateHandScore(cards: Card[]): number {
  const total = cards.reduce((sum, card) => sum + card.value, 0);
  return total % 10;
}

/**
 * Standard Third Card Drawing Rules for Baccarat
 * Returns: { playerCards, bankerCards, playerDrew3rd, bankerDrew3rd }
 */
export function dealHand(shoe: Card[]): {
  playerCards: Card[];
  bankerCards: Card[];
  remainingShoe: Card[];
} {
  const deck = [...shoe];
  const playerCards: Card[] = [];
  const bankerCards: Card[] = [];

  // Deal initial 2 cards alternately: Player, Banker, Player, Banker
  playerCards.push(deck.pop()!);
  bankerCards.push(deck.pop()!);
  playerCards.push(deck.pop()!);
  bankerCards.push(deck.pop()!);

  const pInitial = calculateHandScore(playerCards);
  const bInitial = calculateHandScore(bankerCards);

  // Check Natural (8 or 9)
  if (pInitial >= 8 || bInitial >= 8) {
    return { playerCards, bankerCards, remainingShoe: deck };
  }

  // Player Drawing Rule
  let p3rdCard: Card | null = null;
  if (pInitial <= 5) {
    p3rdCard = deck.pop()!;
    playerCards.push(p3rdCard);
  }

  // Banker Drawing Rule
  let bankerDraws = false;
  if (p3rdCard === null) {
    // Player stood on 6 or 7
    if (bInitial <= 5) {
      bankerDraws = true;
    }
  } else {
    // Player drew a 3rd card
    const p3Val = p3rdCard.value;
    switch (bInitial) {
      case 0:
      case 1:
      case 2:
        bankerDraws = true;
        break;
      case 3:
        bankerDraws = p3Val !== 8; // Draws on 0-7, 9
        break;
      case 4:
        bankerDraws = [2, 3, 4, 5, 6, 7].includes(p3Val);
        break;
      case 5:
        bankerDraws = [4, 5, 6, 7].includes(p3Val);
        break;
      case 6:
        bankerDraws = [6, 7].includes(p3Val);
        break;
      case 7:
      default:
        bankerDraws = false;
        break;
    }
  }

  if (bankerDraws) {
    bankerCards.push(deck.pop()!);
  }

  return { playerCards, bankerCards, remainingShoe: deck };
}

/**
 * Big Road (大路) grid calculation
 */
export function buildBigRoad(results: HandResult[]): BigRoadCell[] {
  const cells: BigRoadCell[] = [];
  if (results.length === 0) return cells;

  let lastCol = 0;
  let lastRow = 0;
  let lastBaseCol = 0;
  let lastWinner: 'PLAYER' | 'BANKER' | 'TIE' | null = null;
  let isDragonTail = false;
  let pendingTies = 0;

  for (const hand of results) {
    const winner = hand.winner;

    if (winner === 'TIE') {
      if (cells.length > 0) {
        cells[cells.length - 1].ties += 1;
      } else {
        pendingTies += 1;
      }
      continue;
    }

    if (lastWinner === null || lastWinner === 'TIE') {
      // First non-TIE win
      if (cells.length > 0 && cells[0].winner === 'TIE') {
        cells[0] = {
          col: 0,
          row: 0,
          winner,
          ties: cells[0].ties + pendingTies,
          isDragon7: hand.isDragon7,
          isPanda8: hand.isPanda8,
          isDragon7Push: hand.isDragon7Push,
        };
      } else {
        cells.push({
          col: 0,
          row: 0,
          winner,
          ties: pendingTies,
          isDragon7: hand.isDragon7,
          isPanda8: hand.isPanda8,
          isDragon7Push: hand.isDragon7Push,
        });
      }
      lastWinner = winner;
      lastCol = 0;
      lastRow = 0;
      lastBaseCol = 0;
      isDragonTail = false;
      pendingTies = 0;
    } else if (winner === lastWinner) {
      // Same outcome
      if (!isDragonTail && lastRow + 1 < 6) {
        // Check if cell directly below is occupied
        const targetRow = lastRow + 1;
        const occupied = cells.some((c) => c.col === lastCol && c.row === targetRow);
        if (!occupied) {
          lastRow = targetRow;
          cells.push({
            col: lastCol,
            row: lastRow,
            winner,
            ties: 0,
            isDragon7: hand.isDragon7,
            isPanda8: hand.isPanda8,
            isDragon7Push: hand.isDragon7Push,
          });
        } else {
          isDragonTail = true;
          lastCol += 1;
          cells.push({
            col: lastCol,
            row: lastRow,
            winner,
            ties: 0,
            isDragon7: hand.isDragon7,
            isPanda8: hand.isPanda8,
            isDragon7Push: hand.isDragon7Push,
          });
        }
      } else {
        // Dragon Tail (dragon tail turn right)
        isDragonTail = true;
        lastCol += 1;
        cells.push({
          col: lastCol,
          row: lastRow,
          winner,
          ties: 0,
          isDragon7: hand.isDragon7,
          isPanda8: hand.isPanda8,
          isDragon7Push: hand.isDragon7Push,
        });
      }
    } else {
      // Winner changed -> Start new column
      lastWinner = winner;
      isDragonTail = false;

      // Find next free column starting from lastBaseCol + 1
      let newCol = lastBaseCol + 1;
      while (cells.some((c) => c.col === newCol && c.row === 0)) {
        newCol++;
      }
      lastBaseCol = newCol;
      lastCol = newCol;
      lastRow = 0;

      cells.push({
        col: lastCol,
        row: lastRow,
        winner,
        ties: 0,
        isDragon7: hand.isDragon7,
        isPanda8: hand.isPanda8,
        isDragon7Push: hand.isDragon7Push,
      });
    }
  }

  // If all hands so far were TIEs and no BANKER/PLAYER outcome has occurred yet:
  if (cells.length === 0 && pendingTies > 0) {
    cells.push({
      col: 0,
      row: 0,
      winner: 'TIE',
      ties: pendingTies,
      isDragon7: false,
      isPanda8: false,
      isDragon7Push: false,
    });
  }

  return cells;
}

/**
 * Calculate total cumulative profit for Player A across all hands in results
 */
export function getCumulativeProfitA(results: HandResult[]): number {
  return results.reduce((acc, r) => acc + r.aNetProfit, 0);
}

export function getCumulativeProfitB(results: HandResult[]): number {
  return results.reduce((acc, r) => acc + r.bNetProfit, 0);
}

export function getCumulativeProfitB1(results: HandResult[]): number {
  return results.reduce((acc, r) => acc + (r.b1NetProfit ?? 0), 0);
}

export function getCumulativeProfitB2(results: HandResult[]): number {
  return results.reduce((acc, r) => acc + (r.b2NetProfit ?? 0), 0);
}

export function getCumulativeProfitB3(results: HandResult[]): number {
  return results.reduce((acc, r) => acc + (r.b3NetProfit ?? 0), 0);
}

export function getCumulativeProfitC(results: HandResult[]): number {
  return results.reduce((acc, r) => acc + (r.cNetProfit ?? 0), 0);
}

export function getCumulativeProfitC1(results: HandResult[]): number {
  return results.reduce((acc, r) => acc + (r.c1NetProfit ?? 0), 0);
}

export function getCumulativeProfitC2(results: HandResult[]): number {
  return results.reduce((acc, r) => acc + (r.c2NetProfit ?? 0), 0);
}

/**
 * Helper to generate CSV export string
 */
export function exportToCSV(results: HandResult[]): string {
  const headers = [
    'Hand #',
    'Shoe Hand #',
    'Time',
    'Player Cards',
    'Player Score',
    'Banker Cards',
    'Banker Score',
    'Winner',
    'Dragon 7?',
    'Panda 8?',
    'Player A Bet',
    'Player A Main Amt',
    'Player A Hand Profit',
    'Player A Cumulative Profit',
    'Player A Bankroll',
    'Player B Chasing?',
    'Player B Bet',
    'Player B Hand Profit',
    'Player B Cumulative Profit',
    'Player B Bankroll',
    'Player B-1 Chasing?',
    'Player B-1 Bet',
    'Player B-1 Hand Profit',
    'Player B-1 Cumulative Profit',
    'Player B-1 Bankroll',
    'Player B-2 Chasing?',
    'Player B-2 Bet',
    'Player B-2 Hand Profit',
    'Player B-2 Cumulative Profit',
    'Player B-2 Bankroll',
    'Player B-3 Chasing?',
    'Player B-3 Bet',
    'Player B-3 Hand Profit',
    'Player B-3 Cumulative Profit',
    'Player B-3 Bankroll',
    'Player C Chasing?',
    'Player C Bet',
    'Player C Hand Profit',
    'Player C Cumulative Profit',
    'Player C Bankroll',
    'Player C-1 Chasing?',
    'Player C-1 Bet',
    'Player C-1 Hand Profit',
    'Player C-1 Cumulative Profit',
    'Player C-1 Bankroll',
    'Player C-2 Chasing?',
    'Player C-2 Bet',
    'Player C-2 Hand Profit',
    'Player C-2 Cumulative Profit',
    'Player C-2 Bankroll',
  ];

  let cumA = 0;
  let cumB = 0;
  let cumB1 = 0;
  let cumB2 = 0;
  let cumB3 = 0;
  let cumC = 0;
  let cumC1 = 0;
  let cumC2 = 0;

  const rows = results.map((r) => {
    cumA += r.aNetProfit;
    cumB += r.bNetProfit;
    cumB1 += r.b1NetProfit ?? 0;
    cumB2 += r.b2NetProfit ?? 0;
    cumB3 += r.b3NetProfit ?? 0;
    cumC += r.cNetProfit ?? 0;
    cumC1 += r.c1NetProfit ?? 0;
    cumC2 += r.c2NetProfit ?? 0;

    const b1Status = r.b1TakeProfitStoppedAfter ? '已止盈' : r.b1WasChasing ? '追打中' : '观望中';
    const b2Status = r.b2TakeProfitStoppedAfter ? '已止盈' : r.b2WasChasing ? '追打中' : '观望中';
    const b3Status = r.b3TakeProfitStoppedAfter ? '已停手(止盈/止损)' : r.b3WasChasing ? '追打中' : '观望中';
    const c1Status = r.c1TakeProfitStoppedAfter ? '已止盈' : r.c1WasChasing ? '追打中' : '观望中';
    const c2Status = r.c2TakeProfitStoppedAfter ? '已止盈' : r.c2WasChasing ? '追打中' : '观望中';

    return [
      r.handNumber,
      r.shoeHandNumber,
      new Date(r.timestamp).toLocaleTimeString(),
      `"${r.playerCards.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`).join(' ')}"`,
      r.playerScore,
      `"${r.bankerCards.map((c) => `${c.rank}${c.suit[0].toUpperCase()}`).join(' ')}"`,
      r.bankerScore,
      r.winner === 'PLAYER' ? '闲' : r.winner === 'BANKER' ? '庄' : '和',
      r.isDragon7 ? '是' : '否',
      r.isPanda8 ? '是' : '否',
      r.aBet.mainBet === 'PLAYER' ? '闲' : r.aBet.mainBet === 'BANKER' ? '庄' : '未注',
      r.aBet.mainAmount,
      r.aNetProfit,
      cumA,
      r.aBankrollAfter,

      r.bWasChasing ? '追打中' : '观望中',
      r.bBet.mainBet === 'PLAYER' ? '闲' : r.bBet.mainBet === 'BANKER' ? '庄' : '未注',
      r.bNetProfit,
      cumB,
      r.bBankrollAfter,

      b1Status,
      r.b1Bet?.mainBet === 'PLAYER' ? '闲' : r.b1Bet?.mainBet === 'BANKER' ? '庄' : '未注',
      r.b1NetProfit ?? 0,
      cumB1,
      r.b1BankrollAfter ?? 0,

      b2Status,
      r.b2Bet?.mainBet === 'PLAYER' ? '闲' : r.b2Bet?.mainBet === 'BANKER' ? '庄' : '未注',
      r.b2NetProfit ?? 0,
      cumB2,
      r.b2BankrollAfter ?? 0,

      b3Status,
      r.b3Bet?.mainBet === 'PLAYER' ? '闲' : r.b3Bet?.mainBet === 'BANKER' ? '庄' : '未注',
      r.b3NetProfit ?? 0,
      cumB3,
      r.b3BankrollAfter ?? 0,

      r.cWasChasing ? '追打中' : '观望中',
      r.cBet?.mainBet === 'PLAYER' ? '闲' : r.cBet?.mainBet === 'BANKER' ? '庄' : '未注',
      r.cNetProfit ?? 0,
      cumC,
      r.cBankrollAfter ?? 0,

      c1Status,
      r.c1Bet?.mainBet === 'PLAYER' ? '闲' : r.c1Bet?.mainBet === 'BANKER' ? '庄' : '未注',
      r.c1NetProfit ?? 0,
      cumC1,
      r.c1BankrollAfter ?? 0,

      c2Status,
      r.c2Bet?.mainBet === 'PLAYER' ? '闲' : r.c2Bet?.mainBet === 'BANKER' ? '庄' : '未注',
      r.c2NetProfit ?? 0,
      cumC2,
      r.c2BankrollAfter ?? 0,
    ];
  });

  // UTF-8 BOM for Excel Chinese rendering compatibility
  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
  return csvContent;
}
