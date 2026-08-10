import React, { useState } from 'react';
import { GameStats, HandResult, PlayerBState, PlayerBotState, PlayerCState, ShoeRecord } from '../types';
import { exportToCSV } from '../utils/baccarat';

interface StatsPanelProps {
  stats: GameStats;
  bState: PlayerBState;
  b1State?: PlayerBotState;
  b2State?: PlayerBotState;
  cState?: PlayerCState;
  c1State?: PlayerBotState;
  c2State?: PlayerBotState;
  handResults: HandResult[];
  shoeHistory: ShoeRecord[];
  aBankroll: number;
  bBankroll: number;
  b1Bankroll?: number;
  b2Bankroll?: number;
  cBankroll: number;
  c1Bankroll?: number;
  c2Bankroll?: number;
  onResetSession?: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  bState,
  b1State,
  b2State,
  cState,
  c1State,
  c2State,
  handResults,
  shoeHistory = [],
  aBankroll,
  bBankroll,
  b1Bankroll = 10000,
  b2Bankroll = 10000,
  cBankroll,
  c1Bankroll = 10000,
  c2Bankroll = 10000,
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
  const currentShoeProfitB1 = handResults.reduce((s, h) => s + (h.b1NetProfit ?? 0), 0);
  const currentShoeProfitB2 = handResults.reduce((s, h) => s + (h.b2NetProfit ?? 0), 0);
  const currentShoeProfitC = handResults.reduce((s, h) => s + (h.cNetProfit ?? 0), 0);
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
  let runningCumC = 0;
  let runningCumC1 = 0;
  let runningCumC2 = 0;

  const processedShoes = allShoesList.map((s) => {
    runningCumA += s.aProfit;
    runningCumB += s.bProfit;
    runningCumB1 += s.b1Profit ?? 0;
    runningCumB2 += s.b2Profit ?? 0;
    runningCumC += s.cProfit ?? 0;
    runningCumC1 += s.c1Profit ?? 0;
    runningCumC2 += s.c2Profit ?? 0;
    return {
      ...s,
      cumA: runningCumA,
      cumB: runningCumB,
      cumB1: runningCumB1,
      cumB2: runningCumB2,
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
  const cChaseWinRate = cState && cState.totalChaseHands > 0 ? ((cState.chaseWinsC / cState.totalChaseHands) * 100).toFixed(1) : '0.0';
  const c1ChaseWinRate = c1State && c1State.totalChaseHands > 0 ? ((c1State.chaseWins / c1State.totalChaseHands) * 100).toFixed(1) : '0.0';
  const c2ChaseWinRate = c2State && c2State.totalChaseHands > 0 ? ((c2State.chaseWins / c2State.totalChaseHands) * 100).toFixed(1) : '0.0';

  const aExhaustedWinRate = stats.aExhaustedHands > 0 ? ((stats.aExhaustedWins / stats.aExhaustedHands) * 100).toFixed(1) : '0.0';

  // SVG Chart points
  const svgWidth = 600;
  const svgHeight = 120;
  const dataPoints = handResults.slice(-50);

  let aPath = '';
  let bPath = '';
  let b1Path = '';
  let b2Path = '';
  let cPath = '';
  let c1Path = '';
  let c2Path = '';

  if (dataPoints.length > 1) {
    const minBankroll = Math.min(
      ...dataPoints.map((d) =>
        Math.min(
          d.aBankrollAfter,
          d.bBankrollAfter,
          d.b1BankrollAfter ?? 10000,
          d.b2BankrollAfter ?? 10000,
          d.cBankrollAfter ?? 10000,
          d.c1BankrollAfter ?? 10000,
          d.c2BankrollAfter ?? 10000
        )
      ),
      0
    );
    const maxBankroll = Math.max(
      ...dataPoints.map((d) =>
        Math.max(
          d.aBankrollAfter,
          d.bBankrollAfter,
          d.b1BankrollAfter ?? 10000,
          d.b2BankrollAfter ?? 10000,
          d.cBankrollAfter ?? 10000,
          d.c1BankrollAfter ?? 10000,
          d.c2BankrollAfter ?? 10000
        )
      ),
      12000
    );

    const range = maxBankroll - minBankroll || 1;

    const getSvgY = (val: number) =>
      svgHeight - ((val - minBankroll) / range) * (svgHeight - 20) - 10;

    aPath = dataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / (dataPoints.length - 1)) * svgWidth).toFixed(1)} ${getSvgY(d.aBankrollAfter).toFixed(1)}`).join(' ');
    bPath = dataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / (dataPoints.length - 1)) * svgWidth).toFixed(1)} ${getSvgY(d.bBankrollAfter).toFixed(1)}`).join(' ');
    b1Path = dataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / (dataPoints.length - 1)) * svgWidth).toFixed(1)} ${getSvgY(d.b1BankrollAfter ?? 10000).toFixed(1)}`).join(' ');
    b2Path = dataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / (dataPoints.length - 1)) * svgWidth).toFixed(1)} ${getSvgY(d.b2BankrollAfter ?? 10000).toFixed(1)}`).join(' ');
    cPath = dataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / (dataPoints.length - 1)) * svgWidth).toFixed(1)} ${getSvgY(d.cBankrollAfter ?? 10000).toFixed(1)}`).join(' ');
    c1Path = dataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / (dataPoints.length - 1)) * svgWidth).toFixed(1)} ${getSvgY(d.c1BankrollAfter ?? 10000).toFixed(1)}`).join(' ');
    c2Path = dataPoints.map((d, i) => `${i === 0 ? 'M' : 'L'} ${((i / (dataPoints.length - 1)) * svgWidth).toFixed(1)} ${getSvgY(d.c2BankrollAfter ?? 10000).toFixed(1)}`).join(' ');
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
            onClick={handleExportCSV}
            disabled={handResults.length === 0 && shoeHistory.length === 0}
            className="px-3 py-1 rounded-lg bg-[#b8860b] hover:bg-yellow-500 disabled:opacity-40 text-black font-bold text-xs border border-amber-300 shadow transition-all active:scale-95 cursor-pointer font-sans"
          >
            📥 导出明细 (CSV)
          </button>
        </div>
      </div>

      {/* GLOBAL SUMMARY STAT CARDS GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mb-4 font-sans text-xs">
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

        <div className="bg-black/75 p-2 rounded-xl border border-sky-500/30">
          <span className="text-[10px] text-amber-200/70 block font-bold">玩家C (无止盈)</span>
          <span className={`text-base font-mono font-bold block ${runningCumC >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {runningCumC >= 0 ? `+¥${runningCumC}` : `-¥${Math.abs(runningCumC)}`}
          </span>
          <span className="text-[9px] text-amber-200/50 block">胜率: {cChaseWinRate}%</span>
        </div>

        <div className="bg-black/75 p-2 rounded-xl border border-sky-400/40 col-span-2 md:col-span-1">
          <span className="text-[10px] text-sky-200/80 block font-bold">玩家C-1 / C-2 盈亏</span>
          <div className="text-[10px] font-mono mt-0.5 space-y-0.5">
            <div>C-1(3注): <strong className={runningCumC1 >= 0 ? 'text-emerald-400' : 'text-red-400'}>{runningCumC1 >= 0 ? `+¥${runningCumC1}` : `-¥${Math.abs(runningCumC1)}`}</strong></div>
            <div>C-2(2注): <strong className={runningCumC2 >= 0 ? 'text-emerald-400' : 'text-red-400'}>{runningCumC2 >= 0 ? `+¥${runningCumC2}` : `-¥${Math.abs(runningCumC2)}`}</strong></div>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-[#b8860b]/30 mb-3 text-xs font-sans">
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
          onClick={() => setActiveTab('curve')}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors ml-1 cursor-pointer ${
            activeTab === 'curve' ? 'bg-[#b8860b] text-black shadow' : 'text-amber-200/70 hover:text-white bg-black/40'
          }`}
        >
          📈 资金走势与回撤
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className={`px-3 py-1.5 font-bold rounded-t-lg transition-colors ml-1 cursor-pointer ${
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
              <table className="w-full text-left text-xs text-amber-100/90 font-mono border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-[#b8860b]/40 text-[10px] text-amber-200/70 font-sans bg-amber-950/30">
                    <th className="py-1.5 px-1.5">靴次</th>
                    <th className="py-1.5 px-1.5">手数</th>
                    <th className="py-1.5 px-1.5">庄/闲/和</th>
                    <th className="py-1.5 px-1.5">玩家A</th>
                    <th className="py-1.5 px-1.5">玩家B</th>
                    <th className="py-1.5 px-1.5">玩家B-1(止盈3注)</th>
                    <th className="py-1.5 px-1.5">玩家B-2(止盈2注)</th>
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

      {/* TAB 2: BANKROLL CHART & MAX DRAWDOWNS */}
      {activeTab === 'curve' && (
        <div className="space-y-3 font-sans">
          <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-amber-200 font-bold">📈 近50手资金走势对比 (A, B, B-1, B-2, C, C-1, C-2)</span>
            </div>

            {dataPoints.length > 1 ? (
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-32 overflow-visible">
                <line x1="0" y1="20" x2={svgWidth} y2="20" stroke="rgba(184,134,11,0.2)" strokeDasharray="3 3" />
                <line x1="0" y1="60" x2={svgWidth} y2="60" stroke="rgba(184,134,11,0.2)" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2={svgWidth} y2="100" stroke="rgba(184,134,11,0.2)" strokeDasharray="3 3" />

                <path d={aPath} fill="none" stroke="#d4af37" strokeWidth="2.5" />
                <path d={bPath} fill="none" stroke="#10b981" strokeWidth="2" />
                <path d={b1Path} fill="none" stroke="#eab308" strokeWidth="1.5" strokeDasharray="4 2" />
                <path d={b2Path} fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
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
              <span className="text-sky-400">━ 玩家C (无止盈)</span>
              <span className="text-cyan-400">╍ 玩家C-1 (止盈3注)</span>
              <span className="text-blue-400">┈ 玩家C-2 (止盈2注)</span>
            </div>
          </div>

          {/* Drawdowns */}
          <div className="bg-black/75 p-3 rounded-xl border border-[#b8860b]/30 text-xs">
            <span className="text-amber-200/70 block font-bold mb-2">最大回撤 (Max Drawdown):</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-[11px]">
              <div>A: <strong className="text-red-400">¥{stats.aMaxDrawdown.toLocaleString()}</strong></div>
              <div>B: <strong className="text-red-400">¥{stats.bMaxDrawdown.toLocaleString()}</strong></div>
              <div>B-1: <strong className="text-red-400">¥{(stats.b1MaxDrawdown ?? 0).toLocaleString()}</strong></div>
              <div>B-2: <strong className="text-red-400">¥{(stats.b2MaxDrawdown ?? 0).toLocaleString()}</strong></div>
              <div>C: <strong className="text-red-400">¥{(stats.cMaxDrawdown ?? 0).toLocaleString()}</strong></div>
              <div>C-1: <strong className="text-red-400">¥{(stats.c1MaxDrawdown ?? 0).toLocaleString()}</strong></div>
              <div>C-2: <strong className="text-red-400">¥{(stats.c2MaxDrawdown ?? 0).toLocaleString()}</strong></div>
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
              </div>
              <table className="w-full text-left text-xs text-amber-100/90 font-mono border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-[#b8860b]/30 text-[10px] text-amber-200/60 font-sans">
                    <th className="py-1 px-1.5">手数</th>
                    <th className="py-1 px-1.5">赛果</th>
                    <th className="py-1 px-1.5">A 押注/盈亏</th>
                    <th className="py-1 px-1.5">B 盈亏</th>
                    <th className="py-1 px-1.5">B-1 盈亏</th>
                    <th className="py-1 px-1.5">B-2 盈亏</th>
                    <th className="py-1 px-1.5">C 盈亏</th>
                    <th className="py-1 px-1.5">C-1 盈亏</th>
                    <th className="py-1 px-1.5">C-2 盈亏</th>
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
