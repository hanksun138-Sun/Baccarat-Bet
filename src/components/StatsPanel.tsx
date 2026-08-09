import React, { useState } from 'react';
import { GameStats, HandResult, PlayerBState, ShoeRecord } from '../types';
import { exportToCSV, getCumulativeProfitA, getCumulativeProfitB } from '../utils/baccarat';

interface StatsPanelProps {
  stats: GameStats;
  bState: PlayerBState;
  handResults: HandResult[];
  shoeHistory: ShoeRecord[];
  aBankroll: number;
  bBankroll: number;
  onResetSession?: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  bState,
  handResults,
  shoeHistory = [],
  aBankroll,
  bBankroll,
  onResetSession,
}) => {
  const [activeTab, setActiveTab] = useState<'shoes' | 'curve' | 'details'>('shoes');

  const handleExportCSV = () => {
    if (handResults.length === 0 && shoeHistory.length === 0) return;
    const csvStr = exportToCSV(handResults);
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `baccarat_session_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Process current active shoe
  const currentShoeHands = handResults.length;
  const currentShoeProfitA = handResults.reduce((s, h) => s + h.aNetProfit, 0);
  const currentShoeProfitB = handResults.reduce((s, h) => s + h.bNetProfit, 0);
  const currentShoeBankerWins = handResults.filter((h) => h.winner === 'BANKER').length;
  const currentShoePlayerWins = handResults.filter((h) => h.winner === 'PLAYER').length;
  const currentShoeTies = handResults.filter((h) => h.winner === 'TIE').length;
  const currentShoeD7 = handResults.filter((h) => h.isDragon7).length;
  const currentShoeP8 = handResults.filter((h) => h.isPanda8).length;

  const currentShoeItem = {
    shoeNumber: shoeHistory.length + 1,
    seed: '当前',
    totalHands: currentShoeHands,
    aProfit: currentShoeProfitA,
    bProfit: currentShoeProfitB,
    bankerWins: currentShoeBankerWins,
    playerWins: currentShoePlayerWins,
    ties: currentShoeTies,
    dragon7Count: currentShoeD7,
    panda8Count: currentShoeP8,
    aBankrollEnd: aBankroll,
    bBankrollEnd: bBankroll,
    timestamp: Date.now(),
    isCurrent: true,
  };

  // Combine finished shoes + active shoe if hands exist
  const allShoesList = [
    ...shoeHistory.map((s) => ({ ...s, isCurrent: false })),
    ...(currentShoeHands > 0 ? [currentShoeItem] : []),
  ];

  let runningCumA = 0;
  let runningCumB = 0;
  const processedShoes = allShoesList.map((s) => {
    runningCumA += s.aProfit;
    runningCumB += s.bProfit;
    return {
      ...s,
      cumA: runningCumA,
      cumB: runningCumB,
    };
  });

  const totalShoesCount = processedShoes.length;
  const totalHandsCount = processedShoes.reduce((sum, s) => sum + s.totalHands, 0);

  // Cumulative Net Profit / Loss for current shoe
  const cumProfitA = getCumulativeProfitA(handResults);
  const cumProfitB = getCumulativeProfitB(handResults);

  // Calculate Win Rates
  const aOverallWinRate = stats.aTotalHandsBet > 0
    ? ((stats.aTotalWins / stats.aTotalHandsBet) * 100).toFixed(1)
    : '0.0';

  const bChaseWinRate = bState.totalChaseHands > 0
    ? ((bState.chaseWinsB / bState.totalChaseHands) * 100).toFixed(1)
    : '0.0';

  const aExhaustedWinRate = stats.aExhaustedHands > 0
    ? ((stats.aExhaustedWins / stats.aExhaustedHands) * 100).toFixed(1)
    : '0.0';

  // Build SVG Path points for Bankroll Chart
  const svgWidth = 600;
  const svgHeight = 120;
  const dataPoints = handResults.slice(-50); // Show last 50 hands for performance

  let aPath = '';
  let bPath = '';

  if (dataPoints.length > 1) {
    const minBankroll = Math.min(
      ...dataPoints.map((d) => Math.min(d.aBankrollAfter, d.bBankrollAfter)),
      0
    );
    const maxBankroll = Math.max(
      ...dataPoints.map((d) => Math.max(d.aBankrollAfter, d.bBankrollAfter)),
      12000
    );

    const range = maxBankroll - minBankroll || 1;

    aPath = dataPoints
      .map((d, i) => {
        const x = (i / (dataPoints.length - 1)) * svgWidth;
        const y = svgHeight - ((d.aBankrollAfter - minBankroll) / range) * (svgHeight - 20) - 10;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');

    bPath = dataPoints
      .map((d, i) => {
        const x = (i / (dataPoints.length - 1)) * svgWidth;
        const y = svgHeight - ((d.bBankrollAfter - minBankroll) / range) * (svgHeight - 20) - 10;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  }

  // Last 10 hands for financial ledger table
  const recent10Hands = [...handResults].reverse().slice(0, 10);

  return (
    <div className="bg-[#051a0b]/90 border-2 border-[#b8860b]/40 rounded-2xl p-3 sm:p-5 shadow-2xl backdrop-blur-md">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#b8860b]/30 pb-3 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <span className="text-[#d4af37] font-serif-casino font-bold text-base sm:text-lg">📊 跨靴统计与资金数据分析</span>
          <span className="text-xs text-amber-200/70 font-sans hidden sm:inline">全场多鞋监控</span>
        </div>
        <div className="flex items-center space-x-2">
          {onResetSession && (
            <button
              onClick={onResetSession}
              className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 font-bold text-xs border border-red-500/40 shadow transition-all active:scale-95 touch-manipulation font-sans"
              title="一键重置所有金额与历史数据"
            >
              ⚠️ 恢复初始状态
            </button>
          )}
          <button
            onClick={handleExportCSV}
            disabled={handResults.length === 0 && shoeHistory.length === 0}
            className="px-3 py-1 rounded-lg bg-[#b8860b] hover:bg-yellow-500 disabled:opacity-40 text-black font-bold text-xs border border-amber-300 shadow transition-all active:scale-95 touch-manipulation font-sans"
          >
            📥 导出明细 (CSV)
          </button>
        </div>
      </div>

      {/* GLOBAL RUNNING SUMMARY CARDS (总共运行了多少鞋多少手的盈亏情况) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4 font-sans">
        <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/40">
          <span className="text-[11px] text-amber-200/70 block font-bold">总运行鞋数 / 手数</span>
          <div className="flex items-baseline space-x-1 mt-1">
            <span className="text-xl sm:text-2xl font-mono font-bold text-[#d4af37]">{totalShoesCount}</span>
            <span className="text-xs text-amber-200/60">靴 /</span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-amber-100">{totalHandsCount}</span>
            <span className="text-xs text-amber-200/60">手</span>
          </div>
          <span className="text-[10px] text-amber-200/50 block mt-1">
            已打完 {shoeHistory.length} 靴 {currentShoeHands > 0 ? `| 第${shoeHistory.length + 1}靴进行中 (${currentShoeHands}手)` : ''}
          </span>
        </div>

        <div className="bg-black/75 p-3 rounded-xl border border-emerald-500/30">
          <span className="text-[11px] text-amber-200/70 block font-bold">玩家A 跨靴累计盈亏</span>
          <span className={`text-xl sm:text-2xl font-mono font-bold mt-0.5 block ${runningCumA >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {runningCumA >= 0 ? `+¥${runningCumA.toLocaleString()}` : `-¥${Math.abs(runningCumA).toLocaleString()}`}
          </span>
          <span className="text-[10px] text-amber-200/50 block mt-1">当前资金: ¥{aBankroll.toLocaleString()}</span>
        </div>

        <div className="bg-black/75 p-3 rounded-xl border border-amber-500/30">
          <span className="text-[11px] text-amber-200/70 block font-bold">玩家B 跨靴累计盈亏</span>
          <span className={`text-xl sm:text-2xl font-mono font-bold mt-0.5 block ${runningCumB >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {runningCumB >= 0 ? `+¥${runningCumB.toLocaleString()}` : `-¥${Math.abs(runningCumB).toLocaleString()}`}
          </span>
          <span className="text-[10px] text-amber-200/50 block mt-1">当前资金: ¥{bBankroll.toLocaleString()}</span>
        </div>

        <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30">
          <span className="text-[11px] text-amber-200/70 block font-bold">胜率统计 (下注局)</span>
          <div className="text-xs font-mono mt-1 space-y-0.5">
            <div>A胜率: <strong className="text-[#d4af37]">{aOverallWinRate}%</strong> ({stats.aTotalWins}胜/{stats.aTotalLosses}负)</div>
            <div>B追打胜率: <strong className="text-emerald-300">{bChaseWinRate}%</strong> ({bState.chaseWinsB}胜/{bState.chaseLossesB}负)</div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-[#b8860b]/30 mb-3 text-xs font-sans">
        <button
          onClick={() => setActiveTab('shoes')}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors ${
            activeTab === 'shoes'
              ? 'bg-[#b8860b] text-black shadow'
              : 'text-amber-200/70 hover:text-white bg-black/40'
          }`}
        >
          🥿 各鞋/靴盈亏明细 ({processedShoes.length}靴)
        </button>
        <button
          onClick={() => setActiveTab('curve')}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors ml-1 ${
            activeTab === 'curve'
              ? 'bg-[#b8860b] text-black shadow'
              : 'text-amber-200/70 hover:text-white bg-black/40'
          }`}
        >
          📈 资金走势曲线与指标
        </button>
        <button
          onClick={() => setActiveTab('details')}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors ml-1 ${
            activeTab === 'details'
              ? 'bg-[#b8860b] text-black shadow'
              : 'text-amber-200/70 hover:text-white bg-black/40'
          }`}
        >
          📜 逐笔/近期下注台账
        </button>
      </div>

      {/* TAB 1: SHOE BY SHOE PROFIT & LOSS BREAKDOWN */}
      {activeTab === 'shoes' && (
        <div className="space-y-3 font-sans">
          {/* Shoe History Table */}
          <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30 overflow-x-auto">
            <div className="flex items-center justify-between text-xs mb-2 border-b border-[#b8860b]/20 pb-1.5">
              <span className="text-amber-200 font-bold flex items-center">
                🥿 每一鞋/靴盈亏与胜负明细 (Shoe-by-Shoe Summary)
              </span>
              <span className="text-amber-200/50 text-[10px]">
                点击【换新鞋】自动结算存档当前鞋
              </span>
            </div>

            {processedShoes.length === 0 ? (
              <div className="py-6 text-center text-xs text-amber-200/50 font-serif-casino">
                暂无靴级历史记录 (点击左侧【开始发牌】产生对局，更换牌靴后将生成第一靴记录)
              </div>
            ) : (
              <table className="w-full text-left text-xs text-amber-100/90 font-mono border-collapse min-w-[620px]">
                <thead>
                  <tr className="border-b border-[#b8860b]/40 text-[11px] text-amber-200/70 font-sans bg-amber-950/30">
                    <th className="py-1.5 px-2">靴次</th>
                    <th className="py-1.5 px-2">状态</th>
                    <th className="py-1.5 px-2">对局手数</th>
                    <th className="py-1.5 px-2">庄 vs 闲 vs 和 (特殊)</th>
                    <th className="py-1.5 px-2">玩家A 本靴盈亏</th>
                    <th className="py-1.5 px-2">玩家A 累计盈亏</th>
                    <th className="py-1.5 px-2">玩家B 本靴盈亏</th>
                    <th className="py-1.5 px-2">玩家B 累计盈亏</th>
                  </tr>
                </thead>
                <tbody>
                  {[...processedShoes].reverse().map((shoe) => {
                    return (
                      <tr
                        key={shoe.shoeNumber}
                        className={`border-b border-white/5 hover:bg-white/5 text-[11px] ${
                          shoe.isCurrent ? 'bg-amber-500/10 font-bold' : ''
                        }`}
                      >
                        <td className="py-1.5 px-2 font-bold text-amber-300">
                          第 {shoe.shoeNumber} 靴
                        </td>
                        <td className="py-1.5 px-2">
                          {shoe.isCurrent ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500 text-black font-bold animate-pulse">
                              进行中
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950/80 text-emerald-300 border border-emerald-700/50">
                              已完成
                            </span>
                          )}
                        </td>
                        <td className="py-1.5 px-2 font-bold">{shoe.totalHands} 手</td>
                        <td className="py-1.5 px-2 text-[10px]">
                          <span className="text-red-400">庄{shoe.bankerWins}</span> /{' '}
                          <span className="text-blue-400">闲{shoe.playerWins}</span> /{' '}
                          <span className="text-emerald-400">和{shoe.ties}</span>
                          {(shoe.dragon7Count > 0 || shoe.panda8Count > 0) && (
                            <span className="ml-1 text-amber-200/60">
                              (🐉{shoe.dragon7Count} 🐼{shoe.panda8Count})
                            </span>
                          )}
                        </td>
                        <td
                          className={`py-1.5 px-2 font-bold ${
                            shoe.aProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {shoe.aProfit >= 0 ? `+¥${shoe.aProfit.toLocaleString()}` : `-¥${Math.abs(shoe.aProfit).toLocaleString()}`}
                        </td>
                        <td
                          className={`py-1.5 px-2 font-bold ${
                            shoe.cumA >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {shoe.cumA >= 0 ? `+¥${shoe.cumA.toLocaleString()}` : `-¥${Math.abs(shoe.cumA).toLocaleString()}`}
                        </td>
                        <td
                          className={`py-1.5 px-2 font-bold ${
                            shoe.bProfit >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {shoe.bProfit >= 0 ? `+¥${shoe.bProfit.toLocaleString()}` : `-¥${Math.abs(shoe.bProfit).toLocaleString()}`}
                        </td>
                        <td
                          className={`py-1.5 px-2 font-bold ${
                            shoe.cumB >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {shoe.cumB >= 0 ? `+¥${shoe.cumB.toLocaleString()}` : `-¥${Math.abs(shoe.cumB).toLocaleString()}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Visual Bar/Trend Chart for Multi-Shoe Profits */}
          {processedShoes.length > 0 && (
            <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30">
              <span className="text-amber-200 text-xs font-bold block mb-2">
                📊 多靴累积盈亏柱状图 (Cumulative Shoe Profit Visualizer)
              </span>
              <div className="flex items-end space-x-2 h-28 pt-4 pb-2 px-2 overflow-x-auto border-b border-[#b8860b]/20 custom-scrollbar">
                {processedShoes.map((shoe) => {
                  const maxAbs = Math.max(
                    ...processedShoes.map((s) => Math.max(Math.abs(s.cumA), Math.abs(s.cumB))),
                    1000
                  );
                  const heightA = Math.min(100, Math.max(10, (Math.abs(shoe.cumA) / maxAbs) * 70));
                  const heightB = Math.min(100, Math.max(10, (Math.abs(shoe.cumB) / maxAbs) * 70));

                  return (
                    <div key={shoe.shoeNumber} className="flex flex-col items-center space-y-1 min-w-[50px]">
                      <div className="flex items-end space-x-1 h-16">
                        {/* Player A bar */}
                        <div
                          style={{ height: `${heightA}%` }}
                          className={`w-3.5 rounded-t transition-all ${
                            shoe.cumA >= 0 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          title={`Shoe #${shoe.shoeNumber} A Cum: ¥${shoe.cumA}`}
                        />
                        {/* Player B bar */}
                        <div
                          style={{ height: `${heightB}%` }}
                          className={`w-3.5 rounded-t transition-all ${
                            shoe.cumB >= 0 ? 'bg-emerald-400' : 'bg-red-400'
                          }`}
                          title={`Shoe #${shoe.shoeNumber} B Cum: ¥${shoe.cumB}`}
                        />
                      </div>
                      <span className="text-[10px] text-amber-200/70 font-mono">第{shoe.shoeNumber}靴</span>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center text-[10px] text-amber-200/60 mt-1">
                <span>黄/红柱: 玩家A 累积盈亏</span>
                <span>绿/红柱: 玩家B 累积盈亏</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BANKROLL CHART & MAX DRAWDOWNS */}
      {activeTab === 'curve' && (
        <div className="space-y-3 font-sans">
          <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30">
            <div className="flex items-center justify-between text-xs mb-2">
              <div className="flex items-center space-x-4">
                <span className="text-[#d4af37] font-bold flex items-center">
                  <span className="w-3 h-0.5 bg-[#d4af37] inline-block mr-1.5" /> 玩家A 资金: ¥{aBankroll.toLocaleString()}
                </span>
                <span className="text-emerald-400 font-bold flex items-center">
                  <span className="w-3 h-0.5 bg-emerald-400 inline-block mr-1.5" /> 玩家B 资金: ¥{bBankroll.toLocaleString()}
                </span>
              </div>
              <span className="text-amber-200/50 text-[10px]">近50手资金走势</span>
            </div>

            {dataPoints.length > 1 ? (
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-28 overflow-visible">
                <line x1="0" y1="20" x2={svgWidth} y2="20" stroke="rgba(184,134,11,0.2)" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2={svgWidth} y2="60" stroke="rgba(184,134,11,0.2)" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2={svgWidth} y2="100" stroke="rgba(184,134,11,0.2)" strokeDasharray="3 3" />

                <path d={bPath} fill="none" stroke="#10b981" strokeWidth="2.5" />
                <path d={aPath} fill="none" stroke="#d4af37" strokeWidth="2.5" />
              </svg>
            ) : (
              <div className="h-24 flex items-center justify-center text-amber-200/50 text-xs font-serif-casino">
                暂无足够对局数据生成曲线 (请开始发牌)
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
            <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30 flex items-center justify-between">
              <span className="text-amber-200/70">最大回撤 (Max Drawdown):</span>
              <div className="space-x-3 font-mono">
                <span>玩家A: <strong className="text-red-400">¥{stats.aMaxDrawdown.toLocaleString()}</strong></span>
                <span>玩家B: <strong className="text-red-400">¥{stats.bMaxDrawdown.toLocaleString()}</strong></span>
              </div>
            </div>

            <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30 flex items-center justify-between">
              <span className="text-amber-200/70">玩家A 输光后对局统计:</span>
              <div className="space-x-2 font-mono text-amber-100">
                <span>局数: <strong className="text-amber-300">{stats.aExhaustedHands}</strong></span>
                <span>胜率: <strong className="text-emerald-400">{aExhaustedWinRate}%</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECENT 10 HANDS LEDGER */}
      {activeTab === 'details' && (
        <div className="space-y-3 font-sans">
          {recent10Hands.length > 0 ? (
            <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30 overflow-x-auto">
              <div className="flex items-center justify-between text-xs mb-2 border-b border-[#b8860b]/20 pb-1.5">
                <span className="text-amber-200 font-bold">📜 近期对局资金变动明细 (最新10手)</span>
                <span className="text-amber-200/50 text-[10px]">实时核算</span>
              </div>
              <table className="w-full text-left text-xs text-amber-100/90 font-mono border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b border-[#b8860b]/30 text-[11px] text-amber-200/60 font-sans">
                    <th className="py-1 px-1.5">手数</th>
                    <th className="py-1 px-1.5">玩家A押注</th>
                    <th className="py-1 px-1.5">赛果</th>
                    <th className="py-1 px-1.5">A本手盈亏</th>
                    <th className="py-1 px-1.5">A累计盈亏</th>
                    <th className="py-1 px-1.5">A资金余额</th>
                    <th className="py-1 px-1.5">B下注及盈亏</th>
                  </tr>
                </thead>
                <tbody>
                  {recent10Hands.map((h, idx) => {
                    const aCum = h.aCumulativeProfit ?? handResults.slice(0, handResults.length - idx).reduce((s, x) => s + x.aNetProfit, 0);
                    return (
                      <tr key={h.handNumber} className="border-b border-amber-950/40 hover:bg-amber-950/20 text-[11px]">
                        <td className="py-1 px-1.5 font-bold text-amber-300">#{h.handNumber}</td>
                        <td className="py-1 px-1.5">
                          {h.aBet.mainBet === 'PLAYER' ? (
                            <span className="text-blue-400 font-bold">闲 ¥{h.aBet.mainAmount}</span>
                          ) : h.aBet.mainBet === 'BANKER' ? (
                            <span className="text-red-400 font-bold">庄 ¥{h.aBet.mainAmount}</span>
                          ) : (
                            <span className="text-amber-200/40">未下注</span>
                          )}
                        </td>
                        <td className="py-1 px-1.5">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            h.winner === 'PLAYER' ? 'bg-blue-900/80 text-blue-200' : h.winner === 'BANKER' ? 'bg-red-900/80 text-red-200' : 'bg-emerald-900/80 text-emerald-200'
                          }`}>
                            {h.winner === 'PLAYER' ? '闲胜' : h.winner === 'BANKER' ? '庄胜' : '和局'}
                          </span>
                        </td>
                        <td className={`py-1 px-1.5 font-bold ${h.aNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {h.aNetProfit >= 0 ? `+¥${h.aNetProfit}` : `-¥${Math.abs(h.aNetProfit)}`}
                        </td>
                        <td className={`py-1 px-1.5 font-bold ${aCum >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {aCum >= 0 ? `+¥${aCum}` : `-¥${Math.abs(aCum)}`}
                        </td>
                        <td className="py-1 px-1.5 font-mono text-amber-200">
                          ¥{h.aBankrollAfter.toLocaleString()}
                        </td>
                        <td className="py-1 px-1.5">
                          {h.bBet.mainBet ? (
                            <span>
                              {h.bBet.mainBet === 'PLAYER' ? '闲' : '庄'} ¥{h.bBet.mainAmount} (
                              <strong className={h.bNetProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                {h.bNetProfit >= 0 ? `+${h.bNetProfit}` : h.bNetProfit}
                              </strong>)
                            </span>
                          ) : (
                            <span className="text-amber-200/40">观望</span>
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

