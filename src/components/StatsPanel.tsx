import React from 'react';
import { GameStats, HandResult, PlayerBState } from '../types';
import { exportToCSV, getCumulativeProfitA, getCumulativeProfitB } from '../utils/baccarat';

interface StatsPanelProps {
  stats: GameStats;
  bState: PlayerBState;
  handResults: HandResult[];
  aBankroll: number;
  bBankroll: number;
  onResetSession?: () => void;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  stats,
  bState,
  handResults,
  aBankroll,
  bBankroll,
  onResetSession,
}) => {
  const handleExportCSV = () => {
    if (handResults.length === 0) return;
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

  // Cumulative Net Profit / Loss
  const cumProfitA = getCumulativeProfitA(handResults);
  const cumProfitB = getCumulativeProfitB(handResults);

  // Calculate Win Rates
  const aOverallWinRate = stats.aTotalHandsBet > 0
    ? ((stats.aTotalWins / stats.aTotalHandsBet) * 100).toFixed(1)
    : '0.0';

  const aChaseWinRate = stats.aChaseHandsBet > 0
    ? ((stats.aChaseWins / stats.aChaseHandsBet) * 100).toFixed(1)
    : '0.0';

  const bChaseWinRate = bState.totalChaseHands > 0
    ? ((bState.chaseWinsB / bState.totalChaseHands) * 100).toFixed(1)
    : '0.0';

  const avgChaseLength = bState.totalChasesTriggered > 0
    ? (bState.totalChaseHands / bState.totalChasesTriggered).toFixed(1)
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
    <div className="bg-[#051a0b]/90 border-2 border-[#b8860b]/40 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#b8860b]/30 pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-[#d4af37] font-serif-casino font-bold text-base sm:text-lg">📊 统计分析与资金曲线</span>
          <span className="text-xs text-amber-100/70 font-sans">跨靴会话级累计</span>
        </div>
        <div className="flex items-center space-x-2">
          {onResetSession && (
            <button
              onClick={onResetSession}
              className="px-3 py-1.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-200 font-bold text-xs sm:text-sm border border-red-500/40 shadow-md transition-all active:scale-95 touch-manipulation font-sans"
              title="一键重置所有金额与历史数据"
            >
              ⚠️ 一键恢复初始状态
            </button>
          )}
          <button
            onClick={handleExportCSV}
            disabled={handResults.length === 0}
            className="px-3.5 py-1.5 rounded-lg bg-[#b8860b] hover:bg-yellow-500 disabled:opacity-40 text-black font-bold text-xs sm:text-sm border border-amber-300 shadow-md transition-all active:scale-95 touch-manipulation font-sans"
          >
            📥 导出对局明细 (CSV)
          </button>
        </div>
      </div>

      {/* Primary Cumulative Profit Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 font-sans">
        <div className="bg-black/60 p-3 rounded-xl border border-[#b8860b]/30">
          <span className="text-xs text-amber-200/70 block">玩家A 累计净盈亏</span>
          <span className={`text-xl sm:text-2xl font-mono font-bold ${cumProfitA >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {cumProfitA >= 0 ? `+¥${cumProfitA}` : `-¥${Math.abs(cumProfitA)}`}
          </span>
          <span className="text-[10px] text-amber-200/50 block mt-0.5">当前资金: ¥{aBankroll.toLocaleString()}</span>
        </div>

        <div className="bg-black/60 p-3 rounded-xl border border-[#b8860b]/30">
          <span className="text-xs text-amber-200/70 block">玩家B 累计净盈亏</span>
          <span className={`text-xl sm:text-2xl font-mono font-bold ${cumProfitB >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {cumProfitB >= 0 ? `+¥${cumProfitB}` : `-¥${Math.abs(cumProfitB)}`}
          </span>
          <span className="text-[10px] text-amber-200/50 block mt-0.5">当前资金: ¥{bBankroll.toLocaleString()}</span>
        </div>

        <div className="bg-black/60 p-3 rounded-xl border border-[#b8860b]/30">
          <span className="text-xs text-amber-200/70 block">玩家A 胜率 (下注局)</span>
          <span className="text-xl font-bold font-mono text-[#d4af37]">{aOverallWinRate}%</span>
          <span className="text-[10px] text-amber-200/50 block mt-0.5">({stats.aTotalWins}胜 / {stats.aTotalLosses}负 / {stats.aTotalPushes}和)</span>
        </div>

        <div className="bg-black/60 p-3 rounded-xl border border-[#b8860b]/30">
          <span className="text-xs text-amber-200/70 block">玩家B 追打胜率</span>
          <span className="text-xl font-bold font-mono text-emerald-300">{bChaseWinRate}%</span>
          <span className="text-[10px] text-amber-200/50 block mt-0.5">({bState.chaseWinsB}胜 / {bState.chaseLossesB}负)</span>
        </div>
      </div>

      {/* SVG Bankroll Comparison Chart */}
      <div className="mb-4 bg-black/60 p-3 rounded-xl border border-[#b8860b]/30 font-sans">
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
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-24 sm:h-28 overflow-visible">
            {/* Background Grid Lines */}
            <line x1="0" y1="20" x2={svgWidth} y2="20" stroke="rgba(184,134,11,0.2)" strokeDasharray="3 3" />
            <line x1="0" y1="60" x2={svgWidth} y2="60" stroke="rgba(184,134,11,0.2)" strokeDasharray="3 3" />
            <line x1="0" y1="100" x2={svgWidth} y2="100" stroke="rgba(184,134,11,0.2)" strokeDasharray="3 3" />

            {/* Player B Path */}
            <path d={bPath} fill="none" stroke="#10b981" strokeWidth="2.5" />
            {/* Player A Path */}
            <path d={aPath} fill="none" stroke="#d4af37" strokeWidth="2.5" />
          </svg>
        ) : (
          <div className="h-24 flex items-center justify-center text-amber-200/50 text-xs font-serif-casino">
            暂无足够对局数据生成曲线 (请开始发牌)
          </div>
        )}
      </div>

      {/* Recent 10 Hands Financial Ledger Table */}
      {recent10Hands.length > 0 && (
        <div className="mb-4 bg-black/60 p-3 rounded-xl border border-[#b8860b]/30 font-sans overflow-x-auto">
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
      )}

      {/* Secondary Metrics: Drawdowns & Exhausted Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
        <div className="bg-black/60 p-3 rounded-xl border border-[#b8860b]/30 flex items-center justify-between">
          <span className="text-amber-200/70">最大回撤 (Max Drawdown):</span>
          <div className="space-x-3 font-mono">
            <span>玩家A: <strong className="text-red-400">¥{stats.aMaxDrawdown.toLocaleString()}</strong></span>
            <span>玩家B: <strong className="text-red-400">¥{stats.bMaxDrawdown.toLocaleString()}</strong></span>
          </div>
        </div>

        <div className="bg-black/60 p-3 rounded-xl border border-[#b8860b]/30 flex items-center justify-between">
          <span className="text-amber-200/70">玩家A 输光后对局统计:</span>
          <div className="space-x-2 font-mono text-amber-100">
            <span>局数: <strong className="text-amber-300">{stats.aExhaustedHands}</strong></span>
            <span>胜率: <strong className="text-emerald-400">{aExhaustedWinRate}%</strong></span>
          </div>
        </div>
      </div>
    </div>
  );
};
