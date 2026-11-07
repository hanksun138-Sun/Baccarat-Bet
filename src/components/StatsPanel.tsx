import React, { useState } from 'react';
import {
  D7Stats,
  Dragon7BetRecord,
  GameStats,
  HandResult,
  PlayerBState,
  PlayerBotState,
  ShoeRecord,
  TrendPoint,
} from '../types';
import { exportToCSV } from '../utils/baccarat';

interface StatsPanelProps {
  stats: GameStats;
  d7Stats?: D7Stats;
  trendPoints?: TrendPoint[];
  bState: PlayerBState;
  b1State?: PlayerBotState;
  b2State?: PlayerBotState;
  handResults: HandResult[];
  allHandResults?: HandResult[];
  shoeHistory: ShoeRecord[];
  aBankroll: number;
  bBankroll: number;
  b1Bankroll?: number;
  b2Bankroll?: number;
  d7Bankroll?: number;
  d7History?: Dragon7BetRecord[];
  botTakeProfitResetMode?: 'ISOLATED_SHOE' | 'CUMULATIVE';
  onToggleResetMode?: () => void;
  onResetSession?: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  d7Stats,
  trendPoints,
  bState,
  b1State,
  b2State,
  handResults,
  allHandResults = [],
  shoeHistory = [],
  aBankroll,
  bBankroll,
  b1Bankroll = 10000,
  b2Bankroll = 10000,
  d7Bankroll = 10000,
  d7History = [],
  botTakeProfitResetMode = 'ISOLATED_SHOE',
  onToggleResetMode,
  onResetSession,
}) => {
  const [activeTab, setActiveTab] = useState<'shoes' | 'barchart' | 'curve' | 'details'>('shoes');

  const [copyNotice, setCopyNotice] = useState<string | null>(null);
  const effectiveAllHands = (allHandResults && allHandResults.length > 0) ? allHandResults : handResults;

  const handleExportCSV = async () => {
    if (effectiveAllHands.length === 0 && shoeHistory.length === 0) return;
    const csvStr = exportToCSV(effectiveAllHands);
    const fileName = `baccarat_session_${new Date().toISOString().slice(0, 10)}.csv`;

    // Try modern File System Access API if supported (allows user to select save directory)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: 'CSV Document',
              accept: { 'text/csv': ['.csv'] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(csvStr);
        await writable.close();
        setCopyNotice('CSV 文件已成功另存为到您选择的位置！');
        setTimeout(() => setCopyNotice(null), 3000);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return; // User canceled save dialog
        console.warn('File picker failed, falling back to standard download:', err);
      }
    }

    // Fallback: Standard browser automatic download
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyForAI = () => {
    if (effectiveAllHands.length === 0) {
      alert('暂无对局明细数据，请先发牌产生对局！');
      return;
    }
    const csvStr = exportToCSV(effectiveAllHands);
    const aiPrompt = `以下是百家乐对局模拟器导出的全部对局明细数据（CSV格式），请帮我进行策略与盈亏分析：
【核心信息】
- 总鞋数: ${totalShoesCount}靴 | 总手数: ${totalHandsCount}手
- 玩家A累计盈亏: ¥${runningCumA}
- 玩家B (无止盈): ¥${runningCumB} | B-1 (止盈3注): ¥${runningCumB1} | B-2 (止盈2注): ¥${runningCumB2}
- 🐉 龙7算牌侧注: 累计盈亏 ¥${totalD7Profit} | 下注 ${d7TotalBets} 次，命中 ${d7WinCount} 次 (命中率 ${d7WinRate}%)

【请帮我分析】
1. 各玩家（A及追打对家B/B-1/B-2）的胜率、期望收益及回撤风险。
2. 止盈机制（B-1的+3注、B-2的+2注对比无止盈B）在不同靴次表现与资金留存度。
3. 龙7算牌辅助系统（True Count≥+4切入）的期望值、命中收益与最大回撤表现。
4. 综合策略优化建议。

--- CSV 完整数据 ---
${csvStr}
--- 数据结束 ---`;

    navigator.clipboard.writeText(aiPrompt).then(() => {
      setCopyNotice('已复制 AI 分析数据与 Prompt 到剪贴板！可以直接粘贴给 AI 分析。');
      setTimeout(() => setCopyNotice(null), 3500);
    }).catch(() => {
      alert('复制失败，请尝试使用“导出明细 (CSV)”下载文件。');
    });
  };

  // Process current active shoe
  const currentShoeHands = handResults.length;
  const currentShoeProfitA = handResults.reduce((s, h) => s + h.aNetProfit, 0);
  const currentShoeProfitB = handResults.reduce((s, h) => s + h.bNetProfit, 0);
  const currentShoeProfitB1 = handResults.reduce((s, h) => s + (h.b1NetProfit ?? 0), 0);
  const currentShoeProfitB2 = handResults.reduce((s, h) => s + (h.b2NetProfit ?? 0), 0);
  const currentShoeProfitD7 = handResults.reduce((s, h) => {
    if (h.aBet.dragon7Amount > 0) {
      return s + (h.isDragon7 ? h.aBet.dragon7Amount * 40 : -h.aBet.dragon7Amount);
    }
    return s;
  }, 0);

  const currentShoeBankerWins = handResults.filter((h) => h.winner === 'BANKER').length;
  const currentShoePlayerWins = handResults.filter((h) => h.winner === 'PLAYER').length;
  const currentShoeTies = handResults.filter((h) => h.winner === 'TIE').length;
  const currentShoeD7 = handResults.filter((h) => h.isDragon7).length;
  const currentShoeP8 = handResults.filter((h) => h.isPanda8).length;

  const currentShoeItem: ShoeRecord & { isCurrent: boolean } = {
    shoeNumber: shoeHistory.length + 1,
    seed: '当前',
    totalHands: currentShoeHands,
    aProfit: currentShoeProfitA,
    bProfit: currentShoeProfitB,
    b1Profit: currentShoeProfitB1,
    b2Profit: currentShoeProfitB2,
    d7Profit: currentShoeProfitD7,
    bankerWins: currentShoeBankerWins,
    playerWins: currentShoePlayerWins,
    ties: currentShoeTies,
    dragon7Count: currentShoeD7,
    panda8Count: currentShoeP8,
    aBankrollEnd: aBankroll,
    bBankrollEnd: bBankroll,
    b1BankrollEnd: b1Bankroll,
    b2BankrollEnd: b2Bankroll,
    d7BankrollEnd: d7Bankroll,
    timestamp: Date.now(),
    isCurrent: true,
  };

  const allShoesList = [
    ...shoeHistory.map((s) => ({ ...s, isCurrent: false })),
    ...(currentShoeHands > 0 ? [currentShoeItem] : []),
  ];

  let runningCumA = 0;
  let runningCumB = 0;
  let runningCumB1 = 0;
  let runningCumB2 = 0;
  let runningCumD7 = 0;

  const processedShoes = allShoesList.map((s) => {
    runningCumA += s.aProfit;
    runningCumB += s.bProfit;
    runningCumB1 += s.b1Profit ?? 0;
    runningCumB2 += s.b2Profit ?? 0;
    runningCumD7 += s.d7Profit ?? 0;
    return {
      ...s,
      cumA: runningCumA,
      cumB: runningCumB,
      cumB1: runningCumB1,
      cumB2: runningCumB2,
      cumD7: runningCumD7,
    };
  });

  const totalShoesCount = processedShoes.length;
  const totalHandsCount = processedShoes.reduce((sum, s) => sum + s.totalHands, 0);

  // Dragon 7 History Summary Metrics
  const totalD7Profit = d7History && d7History.length > 0
    ? d7History.reduce((sum, r) => sum + r.netProfit, 0)
    : runningCumD7;
  const totalD7Wagered = d7History ? d7History.reduce((sum, r) => sum + r.betAmount, 0) : 0;
  const d7WinCount = d7History ? d7History.filter((r) => r.isWin).length : 0;
  const d7TotalBets = d7History ? d7History.length : 0;
  const d7WinRate = d7TotalBets > 0 ? ((d7WinCount / d7TotalBets) * 100).toFixed(1) : '0.0';

  // Win Rates
  const aOverallWinRate = stats.aTotalHandsBet > 0 ? ((stats.aTotalWins / stats.aTotalHandsBet) * 100).toFixed(1) : '0.0';
  const bChaseWinRate = bState.totalChaseHands > 0 ? ((bState.chaseWinsB / bState.totalChaseHands) * 100).toFixed(1) : '0.0';
  const b1ChaseWinRate = b1State && b1State.totalChaseHands > 0 ? ((b1State.chaseWins / b1State.totalChaseHands) * 100).toFixed(1) : '0.0';
  const b2ChaseWinRate = b2State && b2State.totalChaseHands > 0 ? ((b2State.chaseWins / b2State.totalChaseHands) * 100).toFixed(1) : '0.0';

  // Dragon 7 Push / Side Bet Statistics Across All History
  const d7TotalCount = d7Stats ? d7Stats.d7TotalCount : effectiveAllHands.filter((h) => h.isDragon7).length;
  const totalHandsForD7 = totalHandsCount > 0 ? totalHandsCount : (effectiveAllHands.length || 1);
  const d7Percent = ((d7TotalCount / totalHandsForD7) * 100).toFixed(1);

  const aD7SideBetHits = d7Stats ? d7Stats.aD7SideBetHits : effectiveAllHands.filter((h) => h.isDragon7 && h.aBet.dragon7Amount > 0).length;
  const aD7SideBetPayout = d7Stats ? d7Stats.aD7SideBetPayout : effectiveAllHands.reduce((sum, h) => sum + (h.isDragon7 ? h.aSidePayout : 0), 0);
  const aD7BankerPushes = d7Stats ? d7Stats.aD7BankerPushes : effectiveAllHands.filter((h) => h.isDragon7 && h.aBet.mainBet === 'BANKER').length;
  const aD7PlayerLosses = d7Stats ? d7Stats.aD7PlayerLosses : effectiveAllHands.filter((h) => h.isDragon7 && h.aBet.mainBet === 'PLAYER').length;

  const bD7BankerPushes = d7Stats ? d7Stats.bD7BankerPushes : effectiveAllHands.filter((h) => h.isDragon7 && h.bBet?.mainBet === 'BANKER').length;
  const bD7PlayerLosses = d7Stats ? d7Stats.bD7PlayerLosses : effectiveAllHands.filter((h) => h.isDragon7 && h.bBet?.mainBet === 'PLAYER').length;
  const bD7NoBets = d7Stats ? d7Stats.bD7NoBets : effectiveAllHands.filter((h) => h.isDragon7 && (!h.bBet || h.bBet.mainBet === null)).length;

  const b1D7BankerPushes = d7Stats ? d7Stats.b1D7BankerPushes : effectiveAllHands.filter((h) => h.isDragon7 && h.b1Bet?.mainBet === 'BANKER').length;
  const b1D7PlayerLosses = d7Stats ? d7Stats.b1D7PlayerLosses : effectiveAllHands.filter((h) => h.isDragon7 && h.b1Bet?.mainBet === 'PLAYER').length;
  const b1D7NoBets = d7Stats ? d7Stats.b1D7NoBets : effectiveAllHands.filter((h) => h.isDragon7 && (!h.b1Bet || h.b1Bet.mainBet === null)).length;

  const b2D7BankerPushes = d7Stats ? d7Stats.b2D7BankerPushes : effectiveAllHands.filter((h) => h.isDragon7 && h.b2Bet?.mainBet === 'BANKER').length;
  const b2D7PlayerLosses = d7Stats ? d7Stats.b2D7PlayerLosses : effectiveAllHands.filter((h) => h.isDragon7 && h.b2Bet?.mainBet === 'PLAYER').length;
  const b2D7NoBets = d7Stats ? d7Stats.b2D7NoBets : effectiveAllHands.filter((h) => h.isDragon7 && (!h.b2Bet || h.b2Bet.mainBet === null)).length;

  // All-Time Historical Cumulative Trend Points
  let runningD7HistoryCum = 0;
  const allTimePoints: TrendPoint[] = (trendPoints && trendPoints.length > 0)
    ? trendPoints
    : [
        { handNumber: 0, aCum: 0, bCum: 0, b1Cum: 0, b2Cum: 0, d7Cum: 0 },
        ...effectiveAllHands.map((h) => {
          if (h.aBet.dragon7Amount > 0) {
            runningD7HistoryCum += h.isDragon7 ? h.aBet.dragon7Amount * 40 : -h.aBet.dragon7Amount;
          }
          return {
            handNumber: h.handNumber,
            aCum: h.aBankrollAfter - 1000,
            bCum: h.bBankrollAfter - 10000,
            b1Cum: (h.b1BankrollAfter ?? 10000) - 10000,
            b2Cum: (h.b2BankrollAfter ?? 10000) - 10000,
            d7Cum: runningD7HistoryCum,
          };
        }),
      ];

  // All-Time Max Drawdowns from stats or fallback
  const histMaxDDA = stats.aMaxDrawdown ?? 0;
  const histMaxDDB = stats.bMaxDrawdown ?? 0;
  const histMaxDDB1 = stats.b1MaxDrawdown ?? 0;
  const histMaxDDB2 = stats.b2MaxDrawdown ?? 0;

  // Compute Dragon 7 Max Drawdown
  let peakD7 = 0;
  let runD7 = 0;
  let calcMaxD7DD = 0;
  for (const r of (d7History || [])) {
    runD7 += r.netProfit;
    if (runD7 > peakD7) peakD7 = runD7;
    const dd = peakD7 - runD7;
    if (dd > calcMaxD7DD) calcMaxD7DD = dd;
  }
  const histMaxDDD7 = stats.d7MaxDrawdown ?? calcMaxD7DD;

  // SVG Chart points
  const svgWidth = 600;
  const svgHeight = 130;

  let aPath = '';
  let bPath = '';
  let b1Path = '';
  let b2Path = '';
  let d7Path = '';
  let zeroY = 65;

  if (allTimePoints.length > 1) {
    let minCum = -500;
    let maxCum = 500;

    for (let i = 0; i < allTimePoints.length; i++) {
      const p = allTimePoints[i];
      if (p.aCum < minCum) minCum = p.aCum;
      if (p.aCum > maxCum) maxCum = p.aCum;
      if (p.bCum < minCum) minCum = p.bCum;
      if (p.bCum > maxCum) maxCum = p.bCum;
      if ((p.b1Cum ?? 0) < minCum) minCum = p.b1Cum ?? 0;
      if ((p.b1Cum ?? 0) > maxCum) maxCum = p.b1Cum ?? 0;
      if ((p.b2Cum ?? 0) < minCum) minCum = p.b2Cum ?? 0;
      if ((p.b2Cum ?? 0) > maxCum) maxCum = p.b2Cum ?? 0;
      if ((p.d7Cum ?? 0) < minCum) minCum = p.d7Cum ?? 0;
      if ((p.d7Cum ?? 0) > maxCum) maxCum = p.d7Cum ?? 0;
    }

    const range = maxCum - minCum || 1;

    const getSvgY = (val: number) =>
      svgHeight - ((val - minCum) / range) * (svgHeight - 24) - 12;

    zeroY = getSvgY(0);

    let samplePoints = allTimePoints;
    if (allTimePoints.length > 500) {
      const step = Math.ceil(allTimePoints.length / 500);
      samplePoints = allTimePoints.filter((_, idx) => idx % step === 0 || idx === allTimePoints.length - 1);
    }

    const totalPts = samplePoints.length - 1 || 1;
    aPath = samplePoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / totalPts) * svgWidth).toFixed(1)} ${getSvgY(d.aCum).toFixed(1)}`).join(' ');
    bPath = samplePoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / totalPts) * svgWidth).toFixed(1)} ${getSvgY(d.bCum).toFixed(1)}`).join(' ');
    b1Path = samplePoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / totalPts) * svgWidth).toFixed(1)} ${getSvgY(d.b1Cum ?? 0).toFixed(1)}`).join(' ');
    b2Path = samplePoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / totalPts) * svgWidth).toFixed(1)} ${getSvgY(d.b2Cum ?? 0).toFixed(1)}`).join(' ');
    d7Path = samplePoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / totalPts) * svgWidth).toFixed(1)} ${getSvgY(d.d7Cum ?? 0).toFixed(1)}`).join(' ');
  }

  const recent10Hands = [...handResults].reverse().slice(0, 10);

  return (
    <div className="bg-[#051a0b]/90 border border-[#b8860b]/40 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
      {/* Top Bar with Title, Export and Tabs */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#b8860b]/30 pb-3 mb-3 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">📊</span>
          <div>
            <h3 className="font-serif-casino font-bold text-[#d4af37] text-base sm:text-lg">
              全息战绩与策略分析 (Stats & Analytics)
            </h3>
            <span className="text-[10px] text-amber-200/60 block">
              涵盖玩家A及精简对家（玩家B、B-1、B-2）的单靴/全周期数据
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <div className="bg-black/60 p-0.5 rounded-lg border border-[#b8860b]/30 flex text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('shoes')}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                activeTab === 'shoes'
                  ? 'bg-[#d4af37] text-black shadow-sm'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
            >
              👟 靴级记录 ({totalShoesCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('barchart')}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                activeTab === 'barchart'
                  ? 'bg-[#d4af37] text-black shadow-sm'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
            >
              📊 柱状对比图
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('curve')}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                activeTab === 'curve'
                  ? 'bg-[#d4af37] text-black shadow-sm'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
            >
              📈 资金曲线/回撤
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-2.5 py-1 rounded font-bold transition-all cursor-pointer ${
                activeTab === 'details'
                  ? 'bg-[#d4af37] text-black shadow-sm'
                  : 'text-amber-200/70 hover:text-amber-100'
              }`}
            >
              📜 最新10手明细
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopyForAI}
            className="px-2.5 py-1 rounded-lg bg-indigo-900/80 hover:bg-indigo-800 text-indigo-100 text-xs font-bold border border-indigo-500/40 shadow-sm flex items-center space-x-1 cursor-pointer transition-all"
            title="一键复制全部对局 CSV 数据与分析 Prompt，直接发给 ChatGPT/Claude 分析"
          >
            <span>🤖</span>
            <span>复制给 AI 分析</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-2.5 py-1 rounded-lg bg-[#b8860b]/30 hover:bg-[#b8860b]/50 text-amber-200 text-xs font-bold border border-[#b8860b]/40 shadow-sm flex items-center space-x-1 cursor-pointer transition-all"
            title="导出全部对局明细数据 (CSV 格式)"
          >
            <span>💾</span>
            <span>导出明细 (CSV)</span>
          </button>

          {onResetSession && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('确定要清空所有历史对局记录，重置整个牌局会话吗？')) {
                  onResetSession();
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/80 text-red-300 text-xs font-bold border border-red-700/40 shadow-sm flex items-center space-x-1 cursor-pointer transition-all"
              title="重置所有数据，从第1靴重新开始"
            >
              <span>🔄</span>
              <span>重置会话</span>
            </button>
          )}
        </div>
      </div>

      {copyNotice && (
        <div className="mb-3 px-3 py-2 bg-emerald-900/90 border border-emerald-400 text-emerald-200 text-xs rounded-lg font-sans flex items-center justify-between shadow-lg animate-fade-in">
          <span>✨ {copyNotice}</span>
          <button type="button" onClick={() => setCopyNotice(null)} className="text-emerald-300 font-bold ml-2">✕</button>
        </div>
      )}

      {/* GLOBAL SUMMARY STAT CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-4 font-sans text-xs">
        <div className="bg-black/75 p-2.5 rounded-xl border border-[#b8860b]/40">
          <span className="text-[10px] text-amber-200/70 block font-bold">总运行靴数/手数</span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-base font-mono font-bold text-[#d4af37]">{totalShoesCount}</span>
            <span className="text-[10px] text-amber-200/60">靴/</span>
            <span className="text-base font-mono font-bold text-amber-100">{totalHandsCount}</span>
            <span className="text-[10px] text-amber-200/60">手</span>
          </div>
          <span className="text-[9px] text-amber-200/50 block mt-0.5">A胜率: {aOverallWinRate}%</span>
        </div>

        <div className="bg-black/75 p-2.5 rounded-xl border border-amber-500/30">
          <span className="text-[10px] text-amber-200/70 block font-bold">玩家A 跨靴盈亏</span>
          <span className={`text-base font-mono font-bold block ${runningCumA >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {runningCumA >= 0 ? `+¥${runningCumA}` : `-¥${Math.abs(runningCumA)}`}
          </span>
          <span className="text-[9px] text-amber-200/50 block">资金: ¥{aBankroll}</span>
        </div>

        <div className="bg-black/75 p-2.5 rounded-xl border border-emerald-500/30">
          <span className="text-[10px] text-amber-200/70 block font-bold">玩家B (无止盈)</span>
          <span className={`text-base font-mono font-bold block ${runningCumB >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {runningCumB >= 0 ? `+¥${runningCumB}` : `-¥${Math.abs(runningCumB)}`}
          </span>
          <span className="text-[9px] text-amber-200/50 block">胜率: {bChaseWinRate}% | 资金: ¥{bBankroll}</span>
        </div>

        <div className="bg-black/75 p-2.5 rounded-xl border border-yellow-500/40">
          <span className="text-[10px] text-yellow-200/80 block font-bold">止盈对家 (B-1 / B-2)</span>
          <div className="text-[10px] font-mono mt-0.5 space-y-0.5">
            <div>B-1(止盈3注): <strong className={runningCumB1 >= 0 ? 'text-emerald-400' : 'text-red-400'}>{runningCumB1 >= 0 ? `+¥${runningCumB1}` : `-¥${Math.abs(runningCumB1)}`}</strong> (胜率{b1ChaseWinRate}%)</div>
            <div>B-2(止盈2注): <strong className={runningCumB2 >= 0 ? 'text-emerald-400' : 'text-red-400'}>{runningCumB2 >= 0 ? `+¥${runningCumB2}` : `-¥${Math.abs(runningCumB2)}`}</strong> (胜率{b2ChaseWinRate}%)</div>
          </div>
        </div>

        <div className="bg-black/75 p-2.5 rounded-xl border border-purple-500/40 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-purple-200/90 block font-bold flex items-center gap-1">
            <span>🐉</span>
            <span>龙7算牌侧注盈亏</span>
          </span>
          <span className={`text-base font-mono font-bold block ${totalD7Profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {totalD7Profit >= 0 ? `+¥${totalD7Profit}` : `-¥${Math.abs(totalD7Profit)}`}
          </span>
          <div className="text-[9px] text-amber-200/60 font-mono mt-0.5 flex justify-between">
            <span>命中: {d7WinRate}% ({d7WinCount}/{d7TotalBets})</span>
            <span>资金: ¥{d7Bankroll}</span>
          </div>
        </div>
      </div>

      {/* DEDICATED DRAGON 7 STATS SECTION */}
      <div className="bg-gradient-to-r from-amber-950/80 via-black/85 to-amber-950/80 border border-[#b8860b]/50 rounded-xl p-3 mb-4 font-sans text-xs shadow-xl">
        <div className="flex flex-wrap items-center justify-between border-b border-[#b8860b]/30 pb-2 mb-2.5 gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🐉</span>
            <div>
              <span className="font-bold text-amber-300 text-sm">全历史 Dragon 7 (龙7) 专项影响与对家表现统计</span>
              <span className="text-[10px] text-amber-200/60 block">
                龙7规则：庄家 3 张牌合计 7 点胜出。押庄平局(PUSH退注)，押闲全输，购买龙7旁注享 40:1 派彩
              </span>
            </div>
          </div>
          <div className="bg-black/60 px-3 py-1 rounded-lg border border-amber-500/30 text-amber-200 text-xs font-mono font-bold">
            全历史龙7开出: <strong className="text-amber-300">{d7TotalCount}</strong> 次 (出现概率: <span className="text-emerald-400">{d7Percent}%</span>)
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Player A */}
          <div className="bg-black/70 p-2.5 rounded-lg border border-amber-500/40">
            <div className="flex items-center justify-between font-bold text-amber-300 text-[11px] mb-1">
              <span>玩家A (我)</span>
              <span className="text-[9px] text-amber-200/60">自定下注</span>
            </div>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between text-amber-200 font-bold">
                <span>买中龙7边注:</span>
                <span className="text-amber-300 font-mono">{aD7SideBetHits}次 (+¥{aD7SideBetPayout})</span>
              </div>
              <div className="flex justify-between text-amber-200/80">
                <span>押庄遇龙7退注:</span>
                <span className="text-emerald-400 font-mono font-bold">{aD7BankerPushes}次</span>
              </div>
              <div className="flex justify-between text-amber-200/60">
                <span>押闲遇龙7亏损:</span>
                <span className="text-red-400 font-mono">{aD7PlayerLosses}次</span>
              </div>
            </div>
          </div>

          {/* Player B */}
          <div className="bg-black/70 p-2.5 rounded-lg border border-emerald-500/30">
            <div className="flex items-center justify-between font-bold text-emerald-400 text-[11px] mb-1">
              <span>玩家B</span>
              <span className="text-[9px] text-emerald-300/60">无止盈</span>
            </div>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between text-emerald-200 font-bold">
                <span>押庄不赢不输:</span>
                <span className="text-emerald-400 font-mono">{bD7BankerPushes}次</span>
              </div>
              <div className="flex justify-between text-amber-200/60">
                <span>押闲遇龙7亏损:</span>
                <span className="text-red-400 font-mono">{bD7PlayerLosses}次</span>
              </div>
              <div className="flex justify-between text-amber-200/40">
                <span>观望未下注:</span>
                <span className="text-amber-200/50 font-mono">{bD7NoBets}次</span>
              </div>
            </div>
          </div>

          {/* Player B-1 */}
          <div className="bg-black/70 p-2.5 rounded-lg border border-yellow-500/30">
            <div className="flex items-center justify-between font-bold text-yellow-400 text-[11px] mb-1">
              <span>玩家B-1</span>
              <span className="text-[9px] text-yellow-300/60">止盈3注</span>
            </div>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between text-yellow-200 font-bold">
                <span>押庄不赢不输:</span>
                <span className="text-emerald-400 font-mono">{b1D7BankerPushes}次</span>
              </div>
              <div className="flex justify-between text-amber-200/60">
                <span>押闲遇龙7亏损:</span>
                <span className="text-red-400 font-mono">{b1D7PlayerLosses}次</span>
              </div>
              <div className="flex justify-between text-amber-200/40">
                <span>观望未下注:</span>
                <span className="text-amber-200/50 font-mono">{b1D7NoBets}次</span>
              </div>
            </div>
          </div>

          {/* Player B-2 */}
          <div className="bg-black/70 p-2.5 rounded-lg border border-yellow-500/30">
            <div className="flex items-center justify-between font-bold text-amber-400 text-[11px] mb-1">
              <span>玩家B-2</span>
              <span className="text-[9px] text-amber-300/60">止盈2注</span>
            </div>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between text-yellow-200 font-bold">
                <span>押庄不赢不输:</span>
                <span className="text-emerald-400 font-mono">{b2D7BankerPushes}次</span>
              </div>
              <div className="flex justify-between text-amber-200/60">
                <span>押闲遇龙7亏损:</span>
                <span className="text-red-400 font-mono">{b2D7PlayerLosses}次</span>
              </div>
              <div className="flex justify-between text-amber-200/40">
                <span>观望未下注:</span>
                <span className="text-amber-200/50 font-mono">{b2D7NoBets}次</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: SHOE HISTORY TABLE */}
      {activeTab === 'shoes' && (
        <div className="space-y-3 font-sans">
          <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30 overflow-x-auto">
            <div className="flex items-center justify-between text-xs mb-2 border-b border-[#b8860b]/20 pb-1.5">
              <span className="text-amber-200 font-bold">
                👟 历次牌靴盈亏对照表 (共 {processedShoes.length} 靴)
              </span>
              {onToggleResetMode && (
                <button
                  type="button"
                  onClick={onToggleResetMode}
                  className="px-2 py-0.5 rounded text-[10px] bg-black/60 border border-amber-500/30 text-amber-300 hover:bg-black/90 cursor-pointer"
                >
                  <span>计算模式: {botTakeProfitResetMode === 'CUMULATIVE' ? '跨靴累计追亏 (点击切换)' : '单靴独立重置 (点击切换)'}</span>
                </button>
              )}
            </div>

            {processedShoes.length === 0 ? (
              <div className="py-6 text-center text-xs text-amber-200/50 font-serif-casino">
                暂无靴级历史记录 (开始发牌更换牌靴后生成记录)
              </div>
            ) : (
              <table className="w-full text-left text-xs text-amber-100/90 font-mono border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-[#b8860b]/40 text-[10px] text-amber-200/70 font-sans bg-amber-950/30">
                    <th className="py-1.5 px-1.5">靴次</th>
                    <th className="py-1.5 px-1.5">手数</th>
                    <th className="py-1.5 px-1.5">庄/闲/和</th>
                    <th className="py-1.5 px-1.5">玩家A</th>
                    <th className="py-1.5 px-1.5">玩家B (无止盈)</th>
                    <th className="py-1.5 px-1.5">玩家B-1 (止盈3注)</th>
                    <th className="py-1.5 px-1.5">玩家B-2 (止盈2注)</th>
                    <th className="py-1.5 px-1.5 text-purple-300">🐉 龙7侧注 (当靴/累计)</th>
                  </tr>
                </thead>
                <tbody>
                  {[...processedShoes].reverse().map((shoe) => {
                    const renderProfitCell = (profit: number, cumProfit: number) => (
                      <td className="py-1 px-1.5 text-[11px]">
                        <span className={profit >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {profit >= 0 ? `+¥${profit}` : `-¥${Math.abs(profit)}`}
                        </span>
                        <span className="text-amber-200/50 text-[9px] block">
                          (计:{cumProfit >= 0 ? `+${cumProfit}` : cumProfit})
                        </span>
                      </td>
                    );

                    return (
                      <tr
                        key={shoe.shoeNumber}
                        className={`border-b border-white/5 hover:bg-white/5 ${
                          shoe.isCurrent ? 'bg-amber-500/10 font-bold' : ''
                        }`}
                      >
                        <td className="py-1 px-1.5 text-amber-300 font-bold text-[11px]">
                          #{shoe.shoeNumber}靴 {shoe.isCurrent && <span className="text-[9px] text-amber-400">进行中</span>}
                        </td>
                        <td className="py-1 px-1.5 font-bold text-[11px]">{shoe.totalHands}手</td>
                        <td className="py-1 px-1.5 text-[10px]">
                          <span className="text-red-400">庄{shoe.bankerWins}</span>/<span className="text-blue-400">闲{shoe.playerWins}</span>/<span className="text-emerald-400">和{shoe.ties}</span>
                        </td>
                        {renderProfitCell(shoe.aProfit, shoe.cumA)}
                        {renderProfitCell(shoe.bProfit, shoe.cumB)}
                        {renderProfitCell(shoe.b1Profit ?? 0, shoe.cumB1)}
                        {renderProfitCell(shoe.b2Profit ?? 0, shoe.cumB2)}
                        {renderProfitCell(shoe.d7Profit ?? 0, shoe.cumD7 ?? 0)}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BAR CHART ANALYSIS */}
      {activeTab === 'barchart' && (
        <div className="space-y-4 font-sans">
          {/* Section 1: Overall Cumulative Net Profit Bar Chart */}
          <div className="bg-black/75 p-4 rounded-xl border border-[#b8860b]/30">
            <div className="flex flex-wrap items-center justify-between text-xs mb-3 gap-1">
              <span className="text-amber-200 font-bold text-sm">📊 玩家累计净盈亏柱状对比 (玩家A vs 玩家B / B-1 / B-2)</span>
              <span className="text-[10px] text-amber-200/60">* 绿色代表盈利，红色代表亏损</span>
            </div>

            {/* Bar Chart Container */}
            {(() => {
              const playerData = [
                { id: 'A', name: '玩家A (我)', profit: runningCumA, color: '#d4af37', bgPos: 'from-amber-500 to-yellow-300' },
                { id: 'B', name: '玩家B (无止盈)', profit: runningCumB, color: '#10b981', bgPos: 'from-emerald-600 to-emerald-400' },
                { id: 'B-1', name: '玩家B-1 (止盈3注)', profit: runningCumB1, color: '#eab308', bgPos: 'from-yellow-600 to-yellow-400' },
                { id: 'B-2', name: '玩家B-2 (止盈2注)', profit: runningCumB2, color: '#f59e0b', bgPos: 'from-amber-600 to-amber-400' },
                { id: 'D7', name: '🐉 龙7侧注', profit: totalD7Profit, color: '#c084fc', bgPos: 'from-purple-600 to-fuchsia-400' },
              ];

              const maxAbs = Math.max(...playerData.map((p) => Math.abs(p.profit)), 500);

              return (
                <div className="space-y-4">
                  {/* Vertical Bar Chart Box */}
                  <div className="bg-black/80 border border-[#b8860b]/20 p-4 rounded-xl">
                    <div className="h-60 relative flex items-center justify-around pt-8 pb-8">
                      {/* Zero baseline line */}
                      <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-[#b8860b]/40 z-0" />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-amber-200/40 font-mono">基准线 (¥0)</span>

                      {playerData.map((p) => {
                        const isPos = p.profit >= 0;
                        const heightPercent = Math.min(100, Math.max(6, (Math.abs(p.profit) / maxAbs) * 80));

                        return (
                          <div key={p.id} className="relative flex flex-col items-center h-full w-1/5 max-w-[100px] z-10 group">
                            {/* Positive Bar Container (Top Half) */}
                            <div className="h-1/2 w-full flex flex-col justify-end items-center relative">
                              {isPos && (
                                <>
                                  <span className="text-[10px] font-mono font-bold text-emerald-400 mb-1 transition-transform group-hover:scale-110">
                                    +¥{p.profit}
                                  </span>
                                  <div
                                    style={{ height: `${heightPercent}%` }}
                                    className={`w-full max-w-[44px] bg-gradient-to-t ${p.bgPos} rounded-t-md shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-500`}
                                  />
                                </>
                              )}
                            </div>

                            {/* Negative Bar Container (Bottom Half) */}
                            <div className="h-1/2 w-full flex flex-col justify-start items-center relative">
                              {!isPos && (
                                <>
                                  <div
                                    style={{ height: `${heightPercent}%` }}
                                    className="w-full max-w-[44px] bg-gradient-to-b from-red-600 to-rose-400 rounded-b-md shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-500"
                                  />
                                  <span className="text-[10px] font-mono font-bold text-red-400 mt-1 transition-transform group-hover:scale-110">
                                    -¥{Math.abs(p.profit)}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Bottom Label */}
                            <div className="absolute -bottom-7 text-center w-full">
                              <span className="text-[11px] font-bold block truncate" style={{ color: p.color }}>
                                {p.name}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Comparison Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2">
                    {playerData.map((p) => (
                      <div key={p.id} className="bg-black/60 p-2.5 rounded-lg border border-[#b8860b]/20 flex items-center justify-between text-xs">
                        <span className="text-[11px] font-bold truncate mr-1" style={{ color: p.color }}>
                          {p.name}:
                        </span>
                        <span className={`font-mono font-bold text-xs ${p.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {p.profit >= 0 ? `+¥${p.profit}` : `-¥${Math.abs(p.profit)}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section 2: Chase Win Rate Comparison Bar Chart */}
          <div className="bg-black/75 p-4 rounded-xl border border-[#b8860b]/30">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-amber-200 font-bold text-sm">🎯 胜率柱状图对比 (%)</span>
            </div>

            <div className="space-y-3">
              {[
                { name: '玩家A (我胜率)', winRate: parseFloat(aOverallWinRate), color: '#d4af37', label: `${stats.aTotalWins}胜/${stats.aTotalLosses}负` },
                { name: '玩家B (无止盈)', winRate: parseFloat(bChaseWinRate), color: '#10b981', label: `${bState.chaseWinsB}胜/${bState.chaseLossesB}负` },
                { name: '玩家B-1 (止盈3注)', winRate: parseFloat(b1ChaseWinRate), color: '#eab308', label: `${b1State?.chaseWins ?? 0}胜/${b1State?.chaseLosses ?? 0}负` },
                { name: '玩家B-2 (止盈2注)', winRate: parseFloat(b2ChaseWinRate), color: '#f59e0b', label: `${b2State?.chaseWins ?? 0}胜/${b2State?.chaseLosses ?? 0}负` },
                { name: '🐉 龙7侧注 (命中率)', winRate: parseFloat(d7WinRate), color: '#c084fc', label: `${d7WinCount}中/${d7TotalBets}手 (40:1)` },
              ].map((item) => (
                <div key={item.name} className="flex items-center text-xs space-x-3">
                  <span className="w-36 font-bold text-amber-100 text-[11px] truncate" style={{ color: item.color }}>
                    {item.name}
                  </span>
                  <div className="flex-1 bg-black/80 h-3.5 rounded-full overflow-hidden border border-amber-900/40 relative">
                    <div
                      style={{ width: `${Math.min(100, Math.max(0, item.winRate))}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-amber-600 to-yellow-400 transition-all duration-500"
                    />
                  </div>
                  <div className="w-28 text-right font-mono font-bold text-[11px] text-amber-300">
                    {item.winRate}% <span className="text-[9px] text-amber-200/50 font-normal">({item.label})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BANKROLL CHART & MAX DRAWDOWNS */}
      {activeTab === 'curve' && (
        <div className="space-y-3 font-sans">
          <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30">
            <div className="flex flex-wrap items-center justify-between text-xs mb-2 gap-2">
              <span className="text-amber-200 font-bold">
                📈 全历史资金累积走势发散图 (全共 {allTimePoints.length - 1} 手对局)
              </span>
              <span className="text-[10px] text-amber-200/60">
                初始基准点均为 0 元起步，直观观察不同追打与止盈策略的收益与波动分化
              </span>
            </div>

            {allTimePoints.length > 1 ? (
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-36 bg-black/80 rounded border border-[#b8860b]/20">
                {/* Horizontal guide lines */}
                <line x1="0" y1="20" x2={svgWidth} y2="20" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="0" y1={svgHeight / 2} x2={svgWidth} y2={svgHeight / 2} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <line x1="0" y1={svgHeight - 20} x2={svgWidth} y2={svgHeight - 20} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />

                {/* Origin Zero Baseline (¥0 Baseline) */}
                <line x1="0" y1={zeroY} x2={svgWidth} y2={zeroY} stroke="rgba(255, 215, 0, 0.45)" strokeWidth="1.5" strokeDasharray="3 2" />
                <text x="5" y={zeroY - 4} fill="rgba(255, 215, 0, 0.7)" fontSize="9" fontFamily="monospace">基准原点 (¥0)</text>

                {/* Player Cumulative Curves */}
                <path d={aPath} fill="none" stroke="#d4af37" strokeWidth="2.5" />
                <path d={bPath} fill="none" stroke="#10b981" strokeWidth="2" />
                <path d={b1Path} fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="4 2" />
                <path d={b2Path} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                <path d={d7Path} fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="3 1" />
              </svg>
            ) : (
              <div className="h-24 flex items-center justify-center text-amber-200/50 text-xs font-serif-casino">
                暂无足够对局数据生成曲线 (请开始发牌)
              </div>
            )}

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-amber-200/70 mt-2 border-t border-amber-900/30 pt-1.5 font-bold">
              <span className="text-[#d4af37]">━ 玩家A</span>
              <span className="text-emerald-400">━ 玩家B (无止盈)</span>
              <span className="text-yellow-400">╍ 玩家B-1 (止盈3注)</span>
              <span className="text-amber-400">┈ 玩家B-2 (止盈2注)</span>
              <span className="text-purple-300">╌ 🐉 龙7算牌侧注</span>
            </div>
          </div>

          {/* Drawdowns */}
          <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30 text-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-200/90 font-bold">📉 历史全过程最大回撤 (Historical Max Drawdown):</span>
              <span className="text-[10px] text-amber-200/50">* 从历史峰值资金下跌的最大幅度</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 font-mono text-[11px]">
              <div className="bg-black/50 p-2.5 rounded border border-amber-500/20 text-center">
                <span className="text-[#d4af37] block text-[10px] font-sans">玩家A</span>
                <strong className="text-red-400">¥{histMaxDDA.toLocaleString()}</strong>
              </div>
              <div className="bg-black/50 p-2.5 rounded border border-emerald-500/20 text-center">
                <span className="text-emerald-400 block text-[10px] font-sans">玩家B (无止盈)</span>
                <strong className="text-red-400">¥{histMaxDDB.toLocaleString()}</strong>
              </div>
              <div className="bg-black/50 p-2.5 rounded border border-yellow-500/20 text-center">
                <span className="text-yellow-400 block text-[10px] font-sans">玩家B-1 (止盈3注)</span>
                <strong className="text-red-400">¥{histMaxDDB1.toLocaleString()}</strong>
              </div>
              <div className="bg-black/50 p-2.5 rounded border border-yellow-500/20 text-center">
                <span className="text-amber-400 block text-[10px] font-sans">玩家B-2 (止盈2注)</span>
                <strong className="text-red-400">¥{histMaxDDB2.toLocaleString()}</strong>
              </div>
              <div className="bg-black/50 p-2.5 rounded border border-purple-500/30 text-center">
                <span className="text-purple-300 block text-[10px] font-sans">🐉 龙7侧注</span>
                <strong className="text-red-400">¥{histMaxDDD7.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RECENT 10 HANDS LEDGER */}
      {activeTab === 'details' && (
        <div className="space-y-3 font-sans">
          {recent10Hands.length > 0 ? (
            <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30 overflow-x-auto">
              <div className="flex items-center justify-between text-xs mb-2 border-b border-[#b8860b]/20 pb-1.5">
                <span className="text-amber-200 font-bold">📜 近期对局资金变动明细 (最新10手)</span>
              </div>
              <table className="w-full text-left text-xs text-amber-100/90 font-mono border-collapse min-w-[650px]">
                <thead>
                  <tr className="border-b border-[#b8860b]/30 text-[10px] text-amber-200/60 font-sans">
                    <th className="py-1 px-1.5">手数</th>
                    <th className="py-1 px-1.5">赛果</th>
                    <th className="py-1 px-1.5">A 押注/盈亏</th>
                    <th className="py-1 px-1.5">B 盈亏</th>
                    <th className="py-1 px-1.5">B-1 盈亏</th>
                    <th className="py-1 px-1.5">B-2 盈亏</th>
                    <th className="py-1 px-1.5 text-purple-300">🐉 龙7侧注</th>
                  </tr>
                </thead>
                <tbody>
                  {recent10Hands.map((h) => {
                    const renderBotNet = (betMain: string | null, net: number, stopped?: boolean) => {
                      if (stopped) return <span className="text-yellow-300 text-[10px]">🎯 止盈停手</span>;
                      if (!betMain) return <span className="text-amber-200/40 text-[10px]">观望</span>;
                      return (
                        <span className={net >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                          {betMain === 'PLAYER' ? '闲' : '庄'} ({net >= 0 ? `+${net}` : net})
                        </span>
                      );
                    };

                    return (
                      <tr key={h.handNumber} className="border-b border-amber-950/40 hover:bg-amber-950/20 text-[11px]">
                        <td className="py-1 px-1.5 font-bold text-amber-300">#{h.handNumber}</td>
                        <td className="py-1 px-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            h.winner === 'PLAYER' ? 'bg-blue-900/80 text-blue-200' : h.winner === 'BANKER' ? 'bg-red-900/80 text-red-200' : 'bg-emerald-900/80 text-emerald-200'
                          }`}>
                            {h.winner === 'PLAYER' ? '闲胜' : h.winner === 'BANKER' ? '庄胜' : '和局'}
                          </span>
                        </td>
                        <td className="py-1 px-1.5">
                          {h.aBet.mainBet ? `${h.aBet.mainBet === 'PLAYER' ? '闲' : '庄'}¥${h.aBet.mainAmount}` : '未注'}{' '}
                          <strong className={h.aNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                            ({h.aNetProfit >= 0 ? `+${h.aNetProfit}` : h.aNetProfit})
                          </strong>
                        </td>
                        <td className="py-1 px-1.5">{renderBotNet(h.bBet?.mainBet ?? null, h.bNetProfit)}</td>
                        <td className="py-1 px-1.5">{renderBotNet(h.b1Bet?.mainBet ?? null, h.b1NetProfit ?? 0, h.b1TakeProfitStoppedAfter)}</td>
                        <td className="py-1 px-1.5">{renderBotNet(h.b2Bet?.mainBet ?? null, h.b2NetProfit ?? 0, h.b2TakeProfitStoppedAfter)}</td>
                        <td className="py-1 px-1.5">
                          {h.aBet.dragon7Amount > 0 ? (
                            <span className={h.isDragon7 ? 'text-yellow-300 font-bold' : 'text-zinc-400'}>
                              ¥{h.aBet.dragon7Amount} ({h.isDragon7 ? `+¥${h.aBet.dragon7Amount * 40}` : `-¥${h.aBet.dragon7Amount}`})
                            </span>
                          ) : (
                            <span className="text-zinc-600 text-[10px]">观望</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-amber-200/50 bg-black/75 rounded-xl border border-[#b8860b]/30">
              当前牌靴暂无近期对局变动记录 (开始发牌后实时显示)
            </div>
          )}
        </div>
      )}
    </div>
  );
};
