import React, { useState } from 'react';
import { D7Stats, GameStats, HandResult, PlayerBState, PlayerBotState, PlayerCState, ShoeRecord, TrendPoint } from '../types';
import { exportToCSV } from '../utils/baccarat';

interface StatsPanelProps {
  stats: GameStats;
  d7Stats?: D7Stats;
  trendPoints?: TrendPoint[];
  bState: PlayerBState;
  b1State?: PlayerBotState;
  b2State?: PlayerBotState;
  b3State?: PlayerBotState;
  cState?: PlayerCState;
  c1State?: PlayerBotState;
  c2State?: PlayerBotState;
  handResults: HandResult[];
  allHandResults?: HandResult[];
  shoeHistory: ShoeRecord[];
  aBankroll: number;
  bBankroll: number;
  b1Bankroll?: number;
  b2Bankroll?: number;
  b3Bankroll?: number;
  cBankroll: number;
  c1Bankroll?: number;
  c2Bankroll?: number;
  onResetSession?: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  d7Stats,
  trendPoints,
  bState,
  b1State,
  b2State,
  b3State,
  cState,
  c1State,
  c2State,
  handResults,
  allHandResults = [],
  shoeHistory = [],
  aBankroll,
  bBankroll,
  b1Bankroll = 10000,
  b2Bankroll = 10000,
  b3Bankroll = 10000,
  cBankroll,
  c1Bankroll = 10000,
  c2Bankroll = 10000,
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
- 玩家B (无止盈): ¥${runningCumB} | B-1 (止盈3注): ¥${runningCumB1} | B-2 (止盈2注): ¥${runningCumB2} | B-3 (止盈+3/止损-5): ¥${runningCumB3}
- 玩家C (无止盈): ¥${runningCumC} | C-1 (止盈3注): ¥${runningCumC1} | C-2 (止盈2注): ¥${runningCumC2}

【请帮我分析】
1. 各玩家（A及追打对家B/B-1/B-2/B-3/C/C-1/C-2）的胜率、期望收益及回撤风险。
2. 止盈止损机制（B-3的单靴+3止盈与-5止损对比B-1/B-2及无限制）在面对多靴连败/长龙时的风控有效性。
3. 给出的追打策略建议。

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
  const currentShoeProfitB3 = handResults.reduce((s, h) => s + (h.b3NetProfit ?? 0), 0);
  const currentShoeProfitC = handResults.reduce((s, h) => s + h.cNetProfit, 0);
  const currentShoeProfitC1 = handResults.reduce((s, h) => s + (h.c1NetProfit ?? 0), 0);
  const currentShoeProfitC2 = handResults.reduce((s, h) => s + (h.c2NetProfit ?? 0), 0);

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
    b3Profit: currentShoeProfitB3,
    cProfit: currentShoeProfitC,
    c1Profit: currentShoeProfitC1,
    c2Profit: currentShoeProfitC2,
    bankerWins: currentShoeBankerWins,
    playerWins: currentShoePlayerWins,
    ties: currentShoeTies,
    dragon7Count: currentShoeD7,
    panda8Count: currentShoeP8,
    aBankrollEnd: aBankroll,
    bBankrollEnd: bBankroll,
    b1BankrollEnd: b1Bankroll,
    b2BankrollEnd: b2Bankroll,
    b3BankrollEnd: b3Bankroll,
    cBankrollEnd: cBankroll,
    c1BankrollEnd: c1Bankroll,
    c2BankrollEnd: c2Bankroll,
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
  let runningCumB3 = 0;
  let runningCumC = 0;
  let runningCumC1 = 0;
  let runningCumC2 = 0;

  const processedShoes = allShoesList.map((s) => {
    runningCumA += s.aProfit;
    runningCumB += s.bProfit;
    runningCumB1 += s.b1Profit ?? 0;
    runningCumB2 += s.b2Profit ?? 0;
    runningCumB3 += s.b3Profit ?? 0;
    runningCumC += s.cProfit ?? 0;
    runningCumC1 += s.c1Profit ?? 0;
    runningCumC2 += s.c2Profit ?? 0;
    return {
      ...s,
      cumA: runningCumA,
      cumB: runningCumB,
      cumB1: runningCumB1,
      cumB2: runningCumB2,
      cumB3: runningCumB3,
      cumC: runningCumC,
      cumC1: runningCumC1,
      cumC2: runningCumC2,
    };
  });

  const totalShoesCount = processedShoes.length;
  const totalHandsCount = processedShoes.reduce((sum, s) => sum + s.totalHands, 0);

  // Win Rates
  const aOverallWinRate = stats.aTotalHandsBet > 0 ? ((stats.aTotalWins / stats.aTotalHandsBet) * 100).toFixed(1) : '0.0';
  const bChaseWinRate = bState.totalChaseHands > 0 ? ((bState.chaseWinsB / bState.totalChaseHands) * 100).toFixed(1) : '0.0';
  const b1ChaseWinRate = b1State && b1State.totalChaseHands > 0 ? ((b1State.chaseWins / b1State.totalChaseHands) * 100).toFixed(1) : '0.0';
  const b2ChaseWinRate = b2State && b2State.totalChaseHands > 0 ? ((b2State.chaseWins / b2State.totalChaseHands) * 100).toFixed(1) : '0.0';
  const b3ChaseWinRate = b3State && b3State.totalChaseHands > 0 ? ((b3State.chaseWins / b3State.totalChaseHands) * 100).toFixed(1) : '0.0';
  const cChaseWinRate = cState && cState.totalChaseHands > 0 ? ((cState.chaseWinsC / cState.totalChaseHands) * 100).toFixed(1) : '0.0';
  const c1ChaseWinRate = c1State && c1State.totalChaseHands > 0 ? ((c1State.chaseWins / c1State.totalChaseHands) * 100).toFixed(1) : '0.0';
  const c2ChaseWinRate = c2State && c2State.totalChaseHands > 0 ? ((c2State.chaseWins / c2State.totalChaseHands) * 100).toFixed(1) : '0.0';

  const aExhaustedWinRate = stats.aExhaustedHands > 0 ? ((stats.aExhaustedWins / stats.aExhaustedHands) * 100).toFixed(1) : '0.0';

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

  const b3D7BankerPushes = d7Stats ? d7Stats.b3D7BankerPushes : effectiveAllHands.filter((h) => h.isDragon7 && h.b3Bet?.mainBet === 'BANKER').length;
  const b3D7PlayerLosses = d7Stats ? d7Stats.b3D7PlayerLosses : effectiveAllHands.filter((h) => h.isDragon7 && h.b3Bet?.mainBet === 'PLAYER').length;
  const b3D7NoBets = d7Stats ? d7Stats.b3D7NoBets : effectiveAllHands.filter((h) => h.isDragon7 && (!h.b3Bet || h.b3Bet.mainBet === null)).length;

  const cD7BankerPushes = d7Stats ? d7Stats.cD7BankerPushes : effectiveAllHands.filter((h) => h.isDragon7 && h.cBet?.mainBet === 'BANKER').length;
  const cD7PlayerLosses = d7Stats ? d7Stats.cD7PlayerLosses : effectiveAllHands.filter((h) => h.isDragon7 && h.cBet?.mainBet === 'PLAYER').length;
  const cD7NoBets = d7Stats ? d7Stats.cD7NoBets : effectiveAllHands.filter((h) => h.isDragon7 && (!h.cBet || h.cBet.mainBet === null)).length;

  const c1D7BankerPushes = d7Stats ? d7Stats.c1D7BankerPushes : effectiveAllHands.filter((h) => h.isDragon7 && h.c1Bet?.mainBet === 'BANKER').length;
  const c1D7PlayerLosses = d7Stats ? d7Stats.c1D7PlayerLosses : effectiveAllHands.filter((h) => h.isDragon7 && h.c1Bet?.mainBet === 'PLAYER').length;
  const c1D7NoBets = d7Stats ? d7Stats.c1D7NoBets : effectiveAllHands.filter((h) => h.isDragon7 && (!h.c1Bet || h.c1Bet.mainBet === null)).length;

  const c2D7BankerPushes = d7Stats ? d7Stats.c2D7BankerPushes : effectiveAllHands.filter((h) => h.isDragon7 && h.c2Bet?.mainBet === 'BANKER').length;
  const c2D7PlayerLosses = d7Stats ? d7Stats.c2D7PlayerLosses : effectiveAllHands.filter((h) => h.isDragon7 && h.c2Bet?.mainBet === 'PLAYER').length;
  const c2D7NoBets = d7Stats ? d7Stats.c2D7NoBets : effectiveAllHands.filter((h) => h.isDragon7 && (!h.c2Bet || h.c2Bet.mainBet === null)).length;

  // All-Time Historical Cumulative Trend Points
  const allTimePoints: TrendPoint[] = (trendPoints && trendPoints.length > 0)
    ? trendPoints
    : [
        { handNumber: 0, aCum: 0, bCum: 0, b1Cum: 0, b2Cum: 0, b3Cum: 0, cCum: 0, c1Cum: 0, c2Cum: 0 },
        ...effectiveAllHands.map((h) => ({
          handNumber: h.handNumber,
          aCum: h.aBankrollAfter - 1000,
          bCum: h.bBankrollAfter - 10000,
          b1Cum: (h.b1BankrollAfter ?? 10000) - 10000,
          b2Cum: (h.b2BankrollAfter ?? 10000) - 10000,
          b3Cum: (h.b3BankrollAfter ?? 10000) - 10000,
          cCum: (h.cBankrollAfter ?? 10000) - 10000,
          c1Cum: (h.c1BankrollAfter ?? 10000) - 10000,
          c2Cum: (h.c2BankrollAfter ?? 10000) - 10000,
        })),
      ];

  // All-Time Max Drawdowns from stats or fallback
  const histMaxDDA = stats.aMaxDrawdown ?? 0;
  const histMaxDDB = stats.bMaxDrawdown ?? 0;
  const histMaxDDB1 = stats.b1MaxDrawdown ?? 0;
  const histMaxDDB2 = stats.b2MaxDrawdown ?? 0;
  const histMaxDDB3 = stats.b3MaxDrawdown ?? 0;
  const histMaxDDC = stats.cMaxDrawdown ?? 0;
  const histMaxDDC1 = stats.c1MaxDrawdown ?? 0;
  const histMaxDDC2 = stats.c2MaxDrawdown ?? 0;

  // SVG Chart points
  const svgWidth = 600;
  const svgHeight = 130;

  let aPath = '';
  let bPath = '';
  let b1Path = '';
  let b2Path = '';
  let b3Path = '';
  let cPath = '';
  let c1Path = '';
  let c2Path = '';
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
      if (p.b1Cum < minCum) minCum = p.b1Cum;
      if (p.b1Cum > maxCum) maxCum = p.b1Cum;
      if (p.b2Cum < minCum) minCum = p.b2Cum;
      if (p.b2Cum > maxCum) maxCum = p.b2Cum;
      if ((p.b3Cum ?? 0) < minCum) minCum = (p.b3Cum ?? 0);
      if ((p.b3Cum ?? 0) > maxCum) maxCum = (p.b3Cum ?? 0);
      if (p.cCum < minCum) minCum = p.cCum;
      if (p.cCum > maxCum) maxCum = p.cCum;
      if (p.c1Cum < minCum) minCum = p.c1Cum;
      if (p.c1Cum > maxCum) maxCum = p.c1Cum;
      if (p.c2Cum < minCum) minCum = p.c2Cum;
      if (p.c2Cum > maxCum) maxCum = p.c2Cum;
    }

    const range = maxCum - minCum || 1;

    const getSvgY = (val: number) =>
      svgHeight - ((val - minCum) / range) * (svgHeight - 24) - 12;

    zeroY = getSvgY(0);

    // Downsample points if dataset is extremely large to keep SVG rendering performant
    let samplePoints = allTimePoints;
    if (allTimePoints.length > 500) {
      const step = Math.ceil(allTimePoints.length / 500);
      samplePoints = allTimePoints.filter((_, idx) => idx % step === 0 || idx === allTimePoints.length - 1);
    }

    const totalPts = samplePoints.length - 1 || 1;
    aPath = samplePoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / totalPts) * svgWidth).toFixed(1)} ${getSvgY(d.aCum).toFixed(1)}`).join(' ');
    bPath = samplePoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / totalPts) * svgWidth).toFixed(1)} ${getSvgY(d.bCum).toFixed(1)}`).join(' ');
    b1Path = samplePoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / totalPts) * svgWidth).toFixed(1)} ${getSvgY(d.b1Cum).toFixed(1)}`).join(' ');
    b2Path = samplePoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / totalPts) * svgWidth).toFixed(1)} ${getSvgY(d.b2Cum).toFixed(1)}`).join(' ');
    b3Path = samplePoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / totalPts) * svgWidth).toFixed(1)} ${getSvgY(d.b3Cum ?? 0).toFixed(1)}`).join(' ');
    cPath = samplePoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / totalPts) * svgWidth).toFixed(1)} ${getSvgY(d.cCum).toFixed(1)}`).join(' ');
    c1Path = samplePoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / totalPts) * svgWidth).toFixed(1)} ${getSvgY(d.c1Cum).toFixed(1)}`).join(' ');
    c2Path = samplePoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / totalPts) * svgWidth).toFixed(1)} ${getSvgY(d.c2Cum).toFixed(1)}`).join(' ');
  }

  const recent10Hands = [...handResults].reverse().slice(0, 10);

  return (
    <div className="bg-[#051a0b]/90 border-2 border-[#b8860b]/40 rounded-2xl p-3 sm:p-5 shadow-2xl backdrop-blur-md">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#b8860b]/30 pb-3 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-[#d4af37] font-serif-casino font-bold text-base sm:text-lg">📊 跨靴统计与资金数据分析 (6位对家)</span>
        </div>
        <div className="flex items-center space-x-2">
          {onResetSession && (
            <button
              type="button"
              onClick={onResetSession}
              className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 font-bold text-xs border border-red-500/40 shadow transition-all active:scale-95 cursor-pointer font-sans"
            >
              ⚠️ 恢复初始状态
            </button>
          )}
          <button
            type="button"
            onClick={handleCopyForAI}
            disabled={handResults.length === 0}
            className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 text-white font-bold text-xs border border-emerald-400 shadow transition-all active:scale-95 cursor-pointer font-sans flex items-center space-x-1"
            title="一键复制完整对局CSV与AI分析指令，直接粘贴给 AI 分析"
          >
            <span>🤖</span>
            <span>复制 AI 分析 Prompt</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={handResults.length === 0 && shoeHistory.length === 0}
            className="px-3 py-1 rounded-lg bg-[#b8860b] hover:bg-yellow-500 disabled:opacity-40 text-black font-bold text-xs border border-amber-300 shadow transition-all active:scale-95 cursor-pointer font-sans"
            title="使用另存为下载 CSV 明细"
          >
            📥 导出明细 (CSV)
          </button>
        </div>
      </div>

      {copyNotice && (
        <div className="mb-3 px-3 py-2 bg-emerald-900/90 border border-emerald-400 text-emerald-200 text-xs rounded-lg font-sans flex items-center justify-between shadow-lg animate-fade-in">
          <span>✨ {copyNotice}</span>
          <button type="button" onClick={() => setCopyNotice(null)} className="text-emerald-300 font-bold ml-2">✕</button>
        </div>
      )}

      {/* GLOBAL SUMMARY STAT CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4 font-sans text-xs">
        <div className="bg-black/75 p-2 rounded-xl border border-[#b8860b]/40">
          <span className="text-[10px] text-amber-200/70 block font-bold">总运行靴数/手数</span>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-base font-mono font-bold text-[#d4af37]">{totalShoesCount}</span>
            <span className="text-[10px] text-amber-200/60">靴/</span>
            <span className="text-base font-mono font-bold text-amber-100">{totalHandsCount}</span>
            <span className="text-[10px] text-amber-200/60">手</span>
          </div>
          <span className="text-[9px] text-amber-200/50 block mt-0.5">A胜率: {aOverallWinRate}%</span>
        </div>

        <div className="bg-black/75 p-2 rounded-xl border border-amber-500/30">
          <span className="text-[10px] text-amber-200/70 block font-bold">玩家A 跨靴盈亏</span>
          <span className={`text-base font-mono font-bold block ${runningCumA >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {runningCumA >= 0 ? `+¥${runningCumA}` : `-¥${Math.abs(runningCumA)}`}
          </span>
          <span className="text-[9px] text-amber-200/50 block">资金: ¥{aBankroll}</span>
        </div>

        <div className="bg-black/75 p-2 rounded-xl border border-emerald-500/30">
          <span className="text-[10px] text-amber-200/70 block font-bold">玩家B (无止盈)</span>
          <span className={`text-base font-mono font-bold block ${runningCumB >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {runningCumB >= 0 ? `+¥${runningCumB}` : `-¥${Math.abs(runningCumB)}`}
          </span>
          <span className="text-[9px] text-amber-200/50 block">胜率: {bChaseWinRate}%</span>
        </div>

        <div className="bg-black/75 p-2 rounded-xl border border-yellow-500/40">
          <span className="text-[10px] text-yellow-200/80 block font-bold">玩家B-1 (止盈3注)</span>
          <span className={`text-base font-mono font-bold block ${runningCumB1 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {runningCumB1 >= 0 ? `+¥${runningCumB1}` : `-¥${Math.abs(runningCumB1)}`}
          </span>
          <span className="text-[9px] text-amber-200/50 block">胜率: {b1ChaseWinRate}%</span>
        </div>

        <div className="bg-black/75 p-2 rounded-xl border border-yellow-500/40">
          <span className="text-[10px] text-yellow-200/80 block font-bold">玩家B-2 (止盈2注)</span>
          <span className={`text-base font-mono font-bold block ${runningCumB2 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {runningCumB2 >= 0 ? `+¥${runningCumB2}` : `-¥${Math.abs(runningCumB2)}`}
          </span>
          <span className="text-[9px] text-amber-200/50 block">胜率: {b2ChaseWinRate}%</span>
        </div>

        <div className="bg-black/75 p-2 rounded-xl border border-amber-400/50">
          <span className="text-[10px] text-amber-200/90 block font-bold">玩家B-3 (+3/-5)</span>
          <span className={`text-base font-mono font-bold block ${runningCumB3 >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {runningCumB3 >= 0 ? `+¥${runningCumB3}` : `-¥${Math.abs(runningCumB3)}`}
          </span>
          <span className="text-[9px] text-amber-200/50 block">胜率: {b3ChaseWinRate}%</span>
        </div>

        <div className="bg-black/75 p-2 rounded-xl border border-sky-500/30">
          <span className="text-[10px] text-amber-200/70 block font-bold">玩家C (无止盈)</span>
          <span className={`text-base font-mono font-bold block ${runningCumC >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {runningCumC >= 0 ? `+¥${runningCumC}` : `-¥${Math.abs(runningCumC)}`}
          </span>
          <span className="text-[9px] text-amber-200/50 block">胜率: {cChaseWinRate}%</span>
        </div>

        <div className="bg-black/75 p-2 rounded-xl border border-sky-400/40">
          <span className="text-[10px] text-sky-200/80 block font-bold">玩家C-1 / C-2</span>
          <div className="text-[10px] font-mono mt-0.5 space-y-0.5">
            <div>C-1(3注): <strong className={runningCumC1 >= 0 ? 'text-emerald-400' : 'text-red-400'}>{runningCumC1 >= 0 ? `+¥${runningCumC1}` : `-¥${Math.abs(runningCumC1)}`}</strong></div>
            <div>C-2(2注): <strong className={runningCumC2 >= 0 ? 'text-emerald-400' : 'text-red-400'}>{runningCumC2 >= 0 ? `+¥${runningCumC2}` : `-¥${Math.abs(runningCumC2)}`}</strong></div>
          </div>
        </div>
      </div>

      {/* DEDICATED DRAGON 7 STATS SECTION */}
      <div className="bg-gradient-to-r from-amber-950/80 via-black/85 to-amber-950/80 border border-[#b8860b]/50 rounded-xl p-3 mb-4 font-sans text-xs shadow-xl">
        <div className="flex flex-wrap items-center justify-between border-b border-[#b8860b]/30 pb-2 mb-2.5 gap-2">
          <div className="flex items-center space-x-2">
            <span className="text-amber-300 font-bold text-sm flex items-center gap-1.5">
              <span>🐲</span> 庄赢3张牌 (龙七 / Dragon 7) ～ 押庄不赢不输 (Push) 专项统计
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 text-[10px] font-mono">
              全历史触发: <strong className="text-amber-300 font-bold">{d7TotalCount}</strong> 次 ({d7Percent}%)
            </span>
          </div>
          <span className="text-[10px] text-amber-200/60">
            * EZ免水规则: 庄家3张牌7点获胜，押【庄】免扣抽水不赢不输(和局退注)；买中【龙7边注】40:1派彩
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-2">
          {/* Player A */}
          <div className="bg-black/70 p-2 rounded-lg border border-amber-500/40">
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
          <div className="bg-black/70 p-2 rounded-lg border border-emerald-500/30">
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
          <div className="bg-black/70 p-2 rounded-lg border border-yellow-500/30">
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
          <div className="bg-black/70 p-2 rounded-lg border border-yellow-500/30">
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

          {/* Player B-3 */}
          <div className="bg-black/70 p-2 rounded-lg border border-amber-400/40">
            <div className="flex items-center justify-between font-bold text-amber-300 text-[11px] mb-1">
              <span>玩家B-3</span>
              <span className="text-[9px] text-amber-200/70">+3/-5注</span>
            </div>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between text-amber-200 font-bold">
                <span>押庄不赢不输:</span>
                <span className="text-emerald-400 font-mono">{b3D7BankerPushes}次</span>
              </div>
              <div className="flex justify-between text-amber-200/60">
                <span>押闲遇龙7亏损:</span>
                <span className="text-red-400 font-mono">{b3D7PlayerLosses}次</span>
              </div>
              <div className="flex justify-between text-amber-200/40">
                <span>观望未下注:</span>
                <span className="text-amber-200/50 font-mono">{b3D7NoBets}次</span>
              </div>
            </div>
          </div>

          {/* Player C */}
          <div className="bg-black/70 p-2 rounded-lg border border-sky-500/30">
            <div className="flex items-center justify-between font-bold text-sky-400 text-[11px] mb-1">
              <span>玩家C</span>
              <span className="text-[9px] text-sky-300/60">无止盈</span>
            </div>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between text-sky-200 font-bold">
                <span>押庄不赢不输:</span>
                <span className="text-emerald-400 font-mono">{cD7BankerPushes}次</span>
              </div>
              <div className="flex justify-between text-amber-200/60">
                <span>押闲遇龙7亏损:</span>
                <span className="text-red-400 font-mono">{cD7PlayerLosses}次</span>
              </div>
              <div className="flex justify-between text-amber-200/40">
                <span>观望未下注:</span>
                <span className="text-amber-200/50 font-mono">{cD7NoBets}次</span>
              </div>
            </div>
          </div>

          {/* Player C-1 */}
          <div className="bg-black/70 p-2 rounded-lg border border-cyan-500/30">
            <div className="flex items-center justify-between font-bold text-cyan-400 text-[11px] mb-1">
              <span>玩家C-1</span>
              <span className="text-[9px] text-cyan-300/60">止盈3注</span>
            </div>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between text-cyan-200 font-bold">
                <span>押庄不赢不输:</span>
                <span className="text-emerald-400 font-mono">{c1D7BankerPushes}次</span>
              </div>
              <div className="flex justify-between text-amber-200/60">
                <span>押闲遇龙7亏损:</span>
                <span className="text-red-400 font-mono">{c1D7PlayerLosses}次</span>
              </div>
              <div className="flex justify-between text-amber-200/40">
                <span>观望未下注:</span>
                <span className="text-amber-200/50 font-mono">{c1D7NoBets}次</span>
              </div>
            </div>
          </div>

          {/* Player C-2 */}
          <div className="bg-black/70 p-2 rounded-lg border border-blue-500/30">
            <div className="flex items-center justify-between font-bold text-blue-400 text-[11px] mb-1">
              <span>玩家C-2</span>
              <span className="text-[9px] text-blue-300/60">止盈2注</span>
            </div>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between text-blue-200 font-bold">
                <span>押庄不赢不输:</span>
                <span className="text-emerald-400 font-mono">{c2D7BankerPushes}次</span>
              </div>
              <div className="flex justify-between text-amber-200/60">
                <span>押闲遇龙7亏损:</span>
                <span className="text-red-400 font-mono">{c2D7PlayerLosses}次</span>
              </div>
              <div className="flex justify-between text-amber-200/40">
                <span>观望未下注:</span>
                <span className="text-amber-200/50 font-mono">{c2D7NoBets}次</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex flex-wrap border-b border-[#b8860b]/30 mb-3 text-xs font-sans gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('shoes')}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'shoes' ? 'bg-[#b8860b] text-black shadow' : 'text-amber-200/70 hover:text-white bg-black/40'
          }`}
        >
          🥿 各鞋/靴盈亏明细 ({processedShoes.length}靴)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('barchart')}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'barchart' ? 'bg-[#b8860b] text-black shadow' : 'text-amber-200/70 hover:text-white bg-black/40'
          }`}
        >
          📊 盈亏柱状图分析
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('curve')}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'curve' ? 'bg-[#b8860b] text-black shadow' : 'text-amber-200/70 hover:text-white bg-black/40'
          }`}
        >
          📈 资金走势与回撤
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors cursor-pointer ${
            activeTab === 'details' ? 'bg-[#b8860b] text-black shadow' : 'text-amber-200/70 hover:text-white bg-black/40'
          }`}
        >
          📜 逐笔/近期下注台账
        </button>
      </div>

      {/* TAB 1: SHOE HISTORY TABLE */}
      {activeTab === 'shoes' && (
        <div className="space-y-3 font-sans">
          <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30 overflow-x-auto">
            <div className="flex items-center justify-between text-xs mb-2 border-b border-[#b8860b]/20 pb-1.5">
              <span className="text-amber-200 font-bold">🥿 每一鞋/靴盈亏与胜负明细 (A vs B, B-1, B-2 vs C, C-1, C-2)</span>
            </div>

            {processedShoes.length === 0 ? (
              <div className="py-6 text-center text-xs text-amber-200/50 font-serif-casino">
                暂无靴级历史记录 (开始发牌更换牌靴后生成记录)
              </div>
            ) : (
              <table className="w-full text-left text-xs text-amber-100/90 font-mono border-collapse min-w-[920px]">
                <thead>
                  <tr className="border-b border-[#b8860b]/40 text-[10px] text-amber-200/70 font-sans bg-amber-950/30">
                    <th className="py-1.5 px-1.5">靴次</th>
                    <th className="py-1.5 px-1.5">手数</th>
                    <th className="py-1.5 px-1.5">庄/闲/和</th>
                    <th className="py-1.5 px-1.5">玩家A</th>
                    <th className="py-1.5 px-1.5">玩家B</th>
                    <th className="py-1.5 px-1.5">玩家B-1(止盈3注)</th>
                    <th className="py-1.5 px-1.5">玩家B-2(止盈2注)</th>
                    <th className="py-1.5 px-1.5">玩家B-3(+3/-5)</th>
                    <th className="py-1.5 px-1.5">玩家C</th>
                    <th className="py-1.5 px-1.5">玩家C-1(止盈3注)</th>
                    <th className="py-1.5 px-1.5">玩家C-2(止盈2注)</th>
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
                        {renderProfitCell(shoe.b3Profit ?? 0, shoe.cumB3)}
                        {renderProfitCell(shoe.cProfit ?? 0, shoe.cumC)}
                        {renderProfitCell(shoe.c1Profit ?? 0, shoe.cumC1)}
                        {renderProfitCell(shoe.c2Profit ?? 0, shoe.cumC2)}
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
              <span className="text-amber-200 font-bold text-sm">📊 8位玩家总累计净盈亏柱状图对比 (A vs B/B-1/B-2/B-3 vs C/C-1/C-2)</span>
              <span className="text-[10px] text-amber-200/60">* 绿色代表盈利，红色代表亏损</span>
            </div>

            {/* Bar Chart Container */}
            {(() => {
              const playerData = [
                { id: 'A', name: '玩家A (我)', profit: runningCumA, color: '#d4af37', bgPos: 'from-amber-500 to-yellow-300' },
                { id: 'B', name: '玩家B (无止盈)', profit: runningCumB, color: '#10b981', bgPos: 'from-emerald-600 to-emerald-400' },
                { id: 'B-1', name: '玩家B-1 (止盈3注)', profit: runningCumB1, color: '#eab308', bgPos: 'from-yellow-600 to-yellow-400' },
                { id: 'B-2', name: '玩家B-2 (止盈2注)', profit: runningCumB2, color: '#f59e0b', bgPos: 'from-amber-600 to-amber-400' },
                { id: 'B-3', name: '玩家B-3 (+3/-5注)', profit: runningCumB3, color: '#fbbf24', bgPos: 'from-amber-500 to-yellow-200' },
                { id: 'C', name: '玩家C (无止盈)', profit: runningCumC, color: '#38bdf8', bgPos: 'from-sky-600 to-sky-400' },
                { id: 'C-1', name: '玩家C-1 (止盈3注)', profit: runningCumC1, color: '#06b6d4', bgPos: 'from-cyan-600 to-cyan-400' },
                { id: 'C-2', name: '玩家C-2 (止盈2注)', profit: runningCumC2, color: '#0284c7', bgPos: 'from-blue-600 to-blue-400' },
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
                          <div key={p.id} className="relative flex flex-col items-center h-full w-1/8 max-w-[80px] z-10 group">
                            {/* Positive Bar Container (Top Half) */}
                            <div className="h-1/2 w-full flex flex-col justify-end items-center relative">
                              {isPos && (
                                <>
                                  <span className="text-[10px] font-mono font-bold text-emerald-400 mb-1 transition-transform group-hover:scale-110">
                                    +¥{p.profit}
                                  </span>
                                  <div
                                    style={{ height: `${heightPercent}%` }}
                                    className={`w-full max-w-[36px] bg-gradient-to-t ${p.bgPos} rounded-t-md shadow-[0_0_10px_rgba(16,185,129,0.3)] transition-all duration-500`}
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
                                    className="w-full max-w-[36px] bg-gradient-to-b from-red-600 to-rose-400 rounded-b-md shadow-[0_0_10px_rgba(239,68,68,0.3)] transition-all duration-500"
                                  />
                                  <span className="text-[10px] font-mono font-bold text-red-400 mt-1 transition-transform group-hover:scale-110">
                                    -¥{Math.abs(p.profit)}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Bottom Label */}
                            <div className="absolute -bottom-6 text-center">
                              <span className="text-[11px] font-bold font-serif-casino block" style={{ color: p.color }}>
                                {p.id}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Horizontal Detail Progress Bars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                    {playerData.map((p) => {
                      const isPos = p.profit >= 0;
                      const widthPercent = Math.min(100, (Math.abs(p.profit) / maxAbs) * 100);

                      return (
                        <div key={p.id} className="bg-black/60 p-2.5 rounded-lg border border-[#b8860b]/20 flex items-center justify-between text-xs">
                          <div className="w-28 flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                            <span className="font-bold text-amber-100 text-[11px] truncate">{p.name}</span>
                          </div>
                          <div className="flex-1 mx-3 bg-black/80 h-3 rounded-full overflow-hidden border border-amber-900/40 relative">
                            <div
                              style={{ width: `${widthPercent}%` }}
                              className={`h-full rounded-full transition-all duration-500 ${
                                isPos ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' : 'bg-gradient-to-r from-red-600 to-rose-400'
                              }`}
                            />
                          </div>
                          <div className="w-20 text-right font-mono font-bold text-[11px]">
                            <span className={isPos ? 'text-emerald-400' : 'text-red-400'}>
                              {isPos ? `+¥${p.profit}` : `-¥${Math.abs(p.profit)}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section 2: Shoe-by-Shoe Bar Chart Comparison */}
          <div className="bg-black/75 p-4 rounded-xl border border-[#b8860b]/30">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-amber-200 font-bold text-sm">🥿 各靴次玩家盈亏对比柱状图 ({processedShoes.length}靴)</span>
            </div>

            {processedShoes.length === 0 ? (
              <div className="py-8 text-center text-xs text-amber-200/50 font-serif-casino">
                暂无靴级数据生成柱状图 (开始发牌更换牌靴后实时显示)
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {processedShoes.map((s) => {
                  const shoePlayers = [
                    { name: 'A', profit: s.aProfit, color: '#d4af37' },
                    { name: 'B', profit: s.bProfit, color: '#10b981' },
                    { name: 'B-1', profit: s.b1Profit ?? 0, color: '#eab308' },
                    { name: 'B-2', profit: s.b2Profit ?? 0, color: '#f59e0b' },
                    { name: 'B-3', profit: s.b3Profit ?? 0, color: '#fbbf24' },
                    { name: 'C', profit: s.cProfit ?? 0, color: '#38bdf8' },
                    { name: 'C-1', profit: s.c1Profit ?? 0, color: '#06b6d4' },
                    { name: 'C-2', profit: s.c2Profit ?? 0, color: '#0284c7' },
                  ];

                  const maxShoeAbs = Math.max(...shoePlayers.map((p) => Math.abs(p.profit)), 200);

                  return (
                    <div key={s.shoeNumber} className="bg-black/80 p-3 rounded-lg border border-[#b8860b]/20">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-[#d4af37]">
                          #{s.shoeNumber}靴 {s.isCurrent && <span className="text-[10px] text-amber-400 font-normal">(进行中)</span>} - 共{s.totalHands}手
                        </span>
                        <span className="text-[10px] text-amber-200/60 font-mono">
                          庄{s.bankerWins} / 闲{s.playerWins} / 和{s.ties}
                        </span>
                      </div>

                      {/* Bar group for this shoe */}
                      <div className="grid grid-cols-8 gap-1 pt-1">
                        {shoePlayers.map((p) => {
                          const isPos = p.profit >= 0;
                          const barWidth = Math.min(100, (Math.abs(p.profit) / maxShoeAbs) * 100);

                          return (
                            <div key={p.name} className="flex flex-col items-center bg-black/50 p-1 rounded border border-white/5">
                              <span className="text-[9px] font-bold" style={{ color: p.color }}>
                                {p.name}
                              </span>
                              <div className="w-full bg-black h-1.5 rounded-full my-1 overflow-hidden">
                                <div
                                  style={{ width: `${barWidth}%` }}
                                  className={`h-full rounded-full ${isPos ? 'bg-emerald-400' : 'bg-red-500'}`}
                                />
                              </div>
                              <span className={`text-[8px] font-mono font-bold ${isPos ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isPos ? `+${p.profit}` : p.profit}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 3: Chase Win Rate Comparison Bar Chart */}
          <div className="bg-black/75 p-4 rounded-xl border border-[#b8860b]/30">
            <div className="flex items-center justify-between text-xs mb-3">
              <span className="text-amber-200 font-bold text-sm">🎯 追打对家胜率柱状图对比 (%)</span>
            </div>

            <div className="space-y-2.5">
              {[
                { name: '玩家A (我胜率)', winRate: parseFloat(aOverallWinRate), color: '#d4af37', label: `${stats.aTotalWins}胜/${stats.aTotalLosses}负` },
                { name: '玩家B (无止盈)', winRate: parseFloat(bChaseWinRate), color: '#10b981', label: `${bState.chaseWinsB}胜/${bState.chaseLossesB}负` },
                { name: '玩家B-1 (止盈3注)', winRate: parseFloat(b1ChaseWinRate), color: '#eab308', label: `${b1State?.chaseWins ?? 0}胜/${b1State?.chaseLosses ?? 0}负` },
                { name: '玩家B-2 (止盈2注)', winRate: parseFloat(b2ChaseWinRate), color: '#f59e0b', label: `${b2State?.chaseWins ?? 0}胜/${b2State?.chaseLosses ?? 0}负` },
                { name: '玩家B-3 (+3/-5注)', winRate: parseFloat(b3ChaseWinRate), color: '#fbbf24', label: `${b3State?.chaseWins ?? 0}胜/${b3State?.chaseLosses ?? 0}负` },
                { name: '玩家C (无止盈)', winRate: parseFloat(cChaseWinRate), color: '#38bdf8', label: `${cState?.chaseWinsC ?? 0}胜/${cState?.chaseLossesC ?? 0}负` },
                { name: '玩家C-1 (止盈3注)', winRate: parseFloat(c1ChaseWinRate), color: '#06b6d4', label: `${c1State?.chaseWins ?? 0}胜/${c1State?.chaseLosses ?? 0}负` },
                { name: '玩家C-2 (止盈2注)', winRate: parseFloat(c2ChaseWinRate), color: '#0284c7', label: `${c2State?.chaseWins ?? 0}胜/${c2State?.chaseLosses ?? 0}负` },
              ].map((item) => (
                <div key={item.name} className="flex items-center text-xs space-x-3">
                  <span className="w-32 font-bold text-amber-100 text-[11px] truncate" style={{ color: item.color }}>
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
                * 所有玩家初始点均对齐于原点 ¥0 变动基准线，根据历史净盈亏向外发散
              </span>
            </div>

            {allTimePoints.length > 1 ? (
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-36 overflow-visible">
                {/* Background Grid Lines */}
                <line x1="0" y1="15" x2={svgWidth} y2="15" stroke="rgba(184,134,11,0.15)" strokeDasharray="3 3" />
                <line x1="0" y1="115" x2={svgWidth} y2="115" stroke="rgba(184,134,11,0.15)" strokeDasharray="3 3" />

                {/* Origin Zero Baseline (¥0 Baseline) */}
                <line x1="0" y1={zeroY} x2={svgWidth} y2={zeroY} stroke="rgba(255, 215, 0, 0.45)" strokeWidth="1.5" strokeDasharray="3 2" />
                <text x="5" y={zeroY - 4} fill="rgba(255, 215, 0, 0.7)" fontSize="9" fontFamily="monospace">基准原点 (¥0)</text>

                {/* Player Cumulative Curves */}
                <path d={aPath} fill="none" stroke="#d4af37" strokeWidth="2.5" />
                <path d={bPath} fill="none" stroke="#10b981" strokeWidth="2" />
                <path d={b1Path} fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="4 2" />
                <path d={b2Path} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
                <path d={b3Path} fill="none" stroke="#fbbf24" strokeWidth="2" strokeDasharray="6 2" />
                <path d={cPath} fill="none" stroke="#38bdf8" strokeWidth="2" />
                <path d={c1Path} fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="4 2" />
                <path d={c2Path} fill="none" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="2 2" />
              </svg>
            ) : (
              <div className="h-24 flex items-center justify-center text-amber-200/50 text-xs font-serif-casino">
                暂无足够对局数据生成曲线 (请开始发牌)
              </div>
            )}

            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-amber-200/70 mt-2 border-t border-amber-900/30 pt-1.5">
              <span className="text-[#d4af37]">━ 玩家A</span>
              <span className="text-emerald-400">━ 玩家B (无止盈)</span>
              <span className="text-yellow-400">╍ 玩家B-1 (止盈3注)</span>
              <span className="text-amber-400">┈ 玩家B-2 (止盈2注)</span>
              <span className="text-amber-300 font-bold">╍ 玩家B-3 (+3/-5)</span>
              <span className="text-sky-400">━ 玩家C (无止盈)</span>
              <span className="text-cyan-400">╍ 玩家C-1 (止盈3注)</span>
              <span className="text-blue-400">┈ 玩家C-2 (止盈2注)</span>
            </div>
          </div>

          {/* Drawdowns */}
          <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30 text-xs">
            <div className="flex justify-between items-center mb-2">
              <span className="text-amber-200/90 font-bold">📉 历史全过程最大回撤 (Historical Max Drawdown):</span>
              <span className="text-[10px] text-amber-200/50">* 从历史峰值资金下跌的最大幅度</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 font-mono text-[11px]">
              <div className="bg-black/50 p-2 rounded border border-amber-500/20 text-center">
                <span className="text-[#d4af37] block text-[10px] font-sans">玩家A</span>
                <strong className="text-red-400">¥{histMaxDDA.toLocaleString()}</strong>
              </div>
              <div className="bg-black/50 p-2 rounded border border-emerald-500/20 text-center">
                <span className="text-emerald-400 block text-[10px] font-sans">玩家B</span>
                <strong className="text-red-400">¥{histMaxDDB.toLocaleString()}</strong>
              </div>
              <div className="bg-black/50 p-2 rounded border border-yellow-500/20 text-center">
                <span className="text-yellow-400 block text-[10px] font-sans">玩家B-1</span>
                <strong className="text-red-400">¥{histMaxDDB1.toLocaleString()}</strong>
              </div>
              <div className="bg-black/50 p-2 rounded border border-yellow-500/20 text-center">
                <span className="text-amber-400 block text-[10px] font-sans">玩家B-2</span>
                <strong className="text-red-400">¥{histMaxDDB2.toLocaleString()}</strong>
              </div>
              <div className="bg-black/70 p-2 rounded border border-amber-400/40 text-center">
                <span className="text-amber-300 block text-[10px] font-sans">玩家B-3</span>
                <strong className="text-red-400">¥{histMaxDDB3.toLocaleString()}</strong>
              </div>
              <div className="bg-black/50 p-2 rounded border border-sky-500/20 text-center">
                <span className="text-sky-400 block text-[10px] font-sans">玩家C</span>
                <strong className="text-red-400">¥{histMaxDDC.toLocaleString()}</strong>
              </div>
              <div className="bg-black/50 p-2 rounded border border-cyan-500/20 text-center">
                <span className="text-cyan-400 block text-[10px] font-sans">玩家C-1</span>
                <strong className="text-red-400">¥{histMaxDDC1.toLocaleString()}</strong>
              </div>
              <div className="bg-black/50 p-2 rounded border border-blue-500/20 text-center">
                <span className="text-blue-400 block text-[10px] font-sans">玩家C-2</span>
                <strong className="text-red-400">¥{histMaxDDC2.toLocaleString()}</strong>
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
              <table className="w-full text-left text-xs text-amber-100/90 font-mono border-collapse min-w-[920px]">
                <thead>
                  <tr className="border-b border-[#b8860b]/30 text-[10px] text-amber-200/60 font-sans">
                    <th className="py-1 px-1.5">手数</th>
                    <th className="py-1 px-1.5">赛果</th>
                    <th className="py-1 px-1.5">A 押注/盈亏</th>
                    <th className="py-1 px-1.5">B 盈亏</th>
                    <th className="py-1 px-1.5">B-1 盈亏</th>
                    <th className="py-1 px-1.5">B-2 盈亏</th>
                    <th className="py-1 px-1.5">B-3 盈亏</th>
                    <th className="py-1 px-1.5">C 盈亏</th>
                    <th className="py-1 px-1.5">C-1 盈亏</th>
                    <th className="py-1 px-1.5">C-2 盈亏</th>
                  </tr>
                </thead>
                <tbody>
                  {recent10Hands.map((h) => {
                    const renderBotNet = (betMain: string | null, net: number, stopped?: boolean) => {
                      if (stopped) return <span className="text-yellow-300 text-[10px]">🎯 止盈/止损停手</span>;
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
                        <td className="py-1 px-1.5">{renderBotNet(h.b3Bet?.mainBet ?? null, h.b3NetProfit ?? 0, h.b3TakeProfitStoppedAfter)}</td>
                        <td className="py-1 px-1.5">{renderBotNet(h.cBet?.mainBet ?? null, h.cNetProfit ?? 0)}</td>
                        <td className="py-1 px-1.5">{renderBotNet(h.c1Bet?.mainBet ?? null, h.c1NetProfit ?? 0, h.c1TakeProfitStoppedAfter)}</td>
                        <td className="py-1 px-1.5">{renderBotNet(h.c2Bet?.mainBet ?? null, h.c2NetProfit ?? 0, h.c2TakeProfitStoppedAfter)}</td>
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
