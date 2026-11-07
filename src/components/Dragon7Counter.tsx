import React, { useState } from 'react';
import { Card, Dragon7BetMode, Dragon7BetRecord, Dragon7Settings, HandResult } from '../types';
import {
  calculateDragon7Advantage,
  calculateDragon7RunningCount,
  calculateDragon7TrueCount,
} from '../utils/dragon7';

interface Dragon7CounterProps {
  handResults: HandResult[];
  burnCard: Card | null;
  burnedCount: number;
  remainingCards: number;
  currentD7Bet: number;
  isDealing: boolean;
  d7Settings: Dragon7Settings;
  d7History: Dragon7BetRecord[];
  d7Bankroll: number;
  onUpdateSettings: (newSettings: Dragon7Settings) => void;
  onSetD7Bet: (amount: number) => void;
  onUpdateBankroll: (newBankroll: number) => void;
  onClearHistory: () => void;
}

export const Dragon7Counter: React.FC<Dragon7CounterProps> = ({
  handResults,
  burnCard,
  remainingCards,
  currentD7Bet,
  isDealing,
  d7Settings,
  d7History,
  d7Bankroll,
  onUpdateSettings,
  onSetD7Bet,
  onUpdateBankroll,
  onClearHistory,
}) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [filterOnlyWins, setFilterOnlyWins] = useState(false);

  // 1. Calculate Running Count & Card Breakdown
  const rcDetails = calculateDragon7RunningCount(handResults, burnCard, d7Settings.countingSystem);

  // 2. Calculate True Count & Decks Remaining
  const tcDetails = calculateDragon7TrueCount(rcDetails.rc, remainingCards, 416);

  // 3. Calculate Advantage & Betting Advice
  const advice = calculateDragon7Advantage(
    tcDetails.tc,
    d7Settings.threshold,
    d7Settings.betMode,
    d7Settings.fixedUnitAmount,
    d7Bankroll
  );

  // 4. Calculate Tracking Statistics
  const totalWagered = d7History.reduce((sum, r) => sum + r.betAmount, 0);
  const sessionProfit = d7History.reduce((sum, r) => sum + r.netProfit, 0);
  const winCount = d7History.filter((r) => r.isWin).length;
  const totalBets = d7History.length;
  const winRate = totalBets > 0 ? ((winCount / totalBets) * 100).toFixed(1) : '0.0';

  // Current shoe D7 profit (from hands in current shoe)
  const currentShoeProfit = handResults.reduce((sum, h) => {
    if (h.aBet.dragon7Amount > 0) {
      return sum + (h.isDragon7 ? h.aBet.dragon7Amount * 40 : -h.aBet.dragon7Amount);
    }
    return sum;
  }, 0);

  const isAdvantageZone = tcDetails.tc >= d7Settings.threshold;

  return (
    <div className="bg-[#051a0b]/95 border-2 border-[#b8860b]/40 rounded-xl p-3 shadow-2xl backdrop-blur-md font-sans text-xs text-[#d4af37]">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2.5 border-b border-[#b8860b]/30">
        <div className="flex items-center space-x-2">
          <span className="text-base sm:text-lg">🐉</span>
          <div>
            <h3 className="font-serif-casino font-bold text-sm text-[#d4af37] tracking-wide flex items-center gap-1.5">
              <span>龙7 (Dragon 7) 侧注算牌辅助</span>
              <span className="text-[10px] bg-red-950/80 text-red-300 px-1.5 py-0.2 rounded border border-red-600/30 font-sans font-normal">
                赔率 40:1
              </span>
            </h3>
            <span className="text-[10px] text-amber-200/60 block">
              标准计数规则: [4,5,6,7] = -1 | [8,9] = +2 | 其他 = 0
            </span>
          </div>
        </div>

        {/* Top Control Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => setShowSettingsDrawer(!showSettingsDrawer)}
            className={`px-2 py-1 rounded text-[11px] font-bold border transition-all cursor-pointer ${
              showSettingsDrawer
                ? 'bg-[#d4af37] text-black border-amber-300'
                : 'bg-black/60 text-amber-200 border-[#b8860b]/40 hover:bg-black/80'
            }`}
          >
            ⚙️ 参数
          </button>
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-2 py-1 rounded text-[11px] font-bold border border-[#b8860b]/40 bg-black/60 text-amber-200 hover:bg-black/80 transition-all cursor-pointer flex items-center gap-1"
          >
            📜 投注记录 ({d7History.length})
          </button>
        </div>
      </div>

      {/* Settings Panel (Collapsible) */}
      {showSettingsDrawer && (
        <div className="mb-3 p-2.5 rounded-lg bg-black/80 border border-[#b8860b]/50 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300 text-[11px]">⚙️ 算牌与建议下注配置:</span>
            <button
              type="button"
              onClick={() => setShowSettingsDrawer(false)}
              className="text-amber-200/60 hover:text-white text-xs cursor-pointer"
            >
              ✕ 收起
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            {/* Threshold Input */}
            <div className="bg-black/50 p-2 rounded border border-[#b8860b]/20">
              <label className="block text-amber-200/80 font-bold mb-1">
                触发下注阈值 (True Count 阈值):
              </label>
              <div className="flex items-center space-x-2">
                {[3.5, 4.0, 4.5, 5.0].map((th) => (
                  <button
                    key={th}
                    type="button"
                    onClick={() => onUpdateSettings({ ...d7Settings, threshold: th })}
                    className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                      d7Settings.threshold === th
                        ? 'bg-[#d4af37] text-black border-amber-200'
                        : 'bg-black/60 text-amber-200 border-[#b8860b]/30'
                    }`}
                  >
                    +{th.toFixed(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Bet Mode Selector */}
            <div className="bg-black/50 p-2 rounded border border-[#b8860b]/20">
              <label className="block text-amber-200/80 font-bold mb-1">下注建议模式:</label>
              <div className="grid grid-cols-3 gap-1">
                {(['FIXED', 'HALF_KELLY', 'FULL_KELLY'] as Dragon7BetMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onUpdateSettings({ ...d7Settings, betMode: mode })}
                    className={`py-1 rounded text-[10px] font-bold border transition-all ${
                      d7Settings.betMode === mode
                        ? 'bg-[#d4af37] text-black border-amber-200 shadow'
                        : 'bg-black/60 text-amber-200/80 border-[#b8860b]/30'
                    }`}
                  >
                    {mode === 'FIXED' ? '固定单位' : mode === 'HALF_KELLY' ? '半 Kelly' : '全 Kelly'}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Fixed Bet Amount */}
            <div className="bg-black/50 p-2 rounded border border-[#b8860b]/20">
              <label className="block text-amber-200/80 font-bold mb-1">自定义固定单位金额 (元):</label>
              <div className="flex items-center space-x-1 mb-1">
                {[20, 50, 100, 200, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => onUpdateSettings({ ...d7Settings, fixedUnitAmount: amt })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                      d7Settings.fixedUnitAmount === amt
                        ? 'bg-[#d4af37] text-black border-amber-200'
                        : 'bg-black/60 text-amber-200 border-[#b8860b]/30'
                    }`}
                  >
                    ¥{amt}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="10"
                step="10"
                value={d7Settings.fixedUnitAmount}
                onChange={(e) =>
                  onUpdateSettings({ ...d7Settings, fixedUnitAmount: Math.max(10, parseInt(e.target.value, 10) || 100) })
                }
                className="w-full bg-black/80 border border-[#b8860b]/40 rounded px-2 py-1 text-amber-300 font-mono text-xs focus:outline-none"
              />
            </div>

            {/* Bankroll Config */}
            <div className="bg-black/50 p-2 rounded border border-[#b8860b]/20">
              <label className="block text-amber-200/80 font-bold mb-1">当前龙7银行roll本金 (元):</label>
              <div className="flex items-center space-x-1">
                <input
                  type="number"
                  min="100"
                  step="500"
                  value={d7Bankroll}
                  onChange={(e) => onUpdateBankroll(Math.max(100, parseInt(e.target.value, 10) || 10000))}
                  className="flex-1 bg-black/80 border border-[#b8860b]/40 rounded px-2 py-1 text-emerald-400 font-mono text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => onUpdateBankroll(d7Bankroll + 2000)}
                  className="px-2 py-1 bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold hover:bg-emerald-900"
                >
                  +¥2000
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Card Counting Metrics (Core Display 1) */}
      <div className="grid grid-cols-3 gap-2 mb-2.5">
        {/* Running Count (RC) Card */}
        <div className="bg-black/70 p-2 sm:p-2.5 rounded-xl border border-[#b8860b]/30 flex flex-col justify-between shadow-inner">
          <div className="text-[10px] text-amber-200/70 flex items-center justify-between">
            <span className="font-bold">跑动计数 (RC)</span>
            <span className="text-[9px] font-mono text-amber-200/50">已见牌:{rcDetails.totalCardsSeen}</span>
          </div>
          <div className="my-1 flex items-baseline justify-center">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                rcDetails.rc > 0 ? 'text-amber-300' : rcDetails.rc < 0 ? 'text-blue-400' : 'text-zinc-400'
              }`}
            >
              {rcDetails.rc > 0 ? `+${rcDetails.rc}` : rcDetails.rc}
            </span>
          </div>
          <div className="text-[9px] text-zinc-400 flex items-center justify-around border-t border-white/10 pt-1 font-mono">
            <span title="4/5/6/7牌张数(每个-1)">[4-7]: <strong className="text-red-400">{rcDetails.negCardsCount}</strong></span>
            <span title="8/9牌张数(每个+2)">[8-9]: <strong className="text-emerald-400">{rcDetails.posCardsCount}</strong></span>
          </div>
        </div>

        {/* Decks Remaining & Penetration Card */}
        <div className="bg-black/70 p-2 sm:p-2.5 rounded-xl border border-[#b8860b]/30 flex flex-col justify-between shadow-inner">
          <div className="text-[10px] text-amber-200/70 flex items-center justify-between">
            <span className="font-bold">剩余副数 / 牌量</span>
            <span className="text-[9px] font-mono text-amber-300/80">{tcDetails.penetrationPercent.toFixed(0)}%走牌</span>
          </div>
          <div className="my-1 flex flex-col items-center justify-center">
            <div className="text-xl sm:text-2xl font-black font-mono text-amber-100">
              {tcDetails.remainingDecks.toFixed(1)} <span className="text-xs text-amber-300/70 font-normal">副</span>
            </div>
            <div className="text-[10px] font-mono text-amber-200/60">
              剩余 <span className="text-amber-300 font-bold">{remainingCards}</span> / 416张
            </div>
          </div>
          {/* Mini progress bar of shoe penetration */}
          <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-[#b8860b]/20">
            <div
              className="bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 h-full rounded-full transition-all duration-300"
              style={{ width: `${tcDetails.penetrationPercent}%` }}
            />
          </div>
        </div>

        {/* True Count (TC) Card (Hero) */}
        <div
          className={`p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between shadow-md transition-all ${
            isAdvantageZone
              ? 'bg-gradient-to-b from-amber-950/90 to-yellow-950/80 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
              : 'bg-black/70 border-[#b8860b]/30'
          }`}
        >
          <div className="text-[10px] flex items-center justify-between">
            <span className={`font-bold ${isAdvantageZone ? 'text-amber-300' : 'text-amber-200/70'}`}>
              真数 (True Count)
            </span>
            <span className="text-[9px] font-mono text-amber-200/60">阈值 ≥ +{d7Settings.threshold.toFixed(1)}</span>
          </div>
          <div className="my-1 flex items-baseline justify-center">
            <span
              className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                isAdvantageZone
                  ? 'text-yellow-300 text-shadow-gold animate-pulse'
                  : tcDetails.tc > 0
                  ? 'text-amber-200'
                  : 'text-zinc-400'
              }`}
            >
              {tcDetails.tcDisplay}
            </span>
          </div>
          <div className="text-[9px] text-center border-t border-white/10 pt-1 font-bold">
            {isAdvantageZone ? (
              <span className="text-emerald-400 flex items-center justify-center gap-1 font-sans">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                🔥 优势区 (EV &gt; 0)
              </span>
            ) : (
              <span className="text-zinc-400 font-sans">⚪ 劣势/观望区</span>
            )}
          </div>
        </div>
      </div>

      {/* High Advantage Alert & Suggested Bet Banner (Core Display 2) */}
      <div
        className={`p-2.5 rounded-xl border mb-2.5 flex flex-wrap items-center justify-between gap-2 transition-all ${
          isAdvantageZone
            ? 'bg-gradient-to-r from-amber-950/90 via-yellow-950/90 to-amber-900/80 border-[#d4af37] shadow-[0_0_18px_rgba(212,175,55,0.3)]'
            : 'bg-black/60 border-[#b8860b]/20 text-amber-200/70'
        }`}
      >
        <div className="flex items-center space-x-2">
          <span className="text-xl">{isAdvantageZone ? '🎯' : '⏳'}</span>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`font-bold text-xs sm:text-sm ${isAdvantageZone ? 'text-yellow-300 text-shadow-gold' : 'text-amber-200/90'}`}>
                {isAdvantageZone ? '【🔥 可以下龙7！】' : '【暂不建议下注】'}
              </span>
              {isAdvantageZone && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold">
                  玩家优势: +{advice.edgePercent.toFixed(2)}%
                </span>
              )}
            </div>
            <span className="text-[10px] text-amber-200/70 block mt-0.5">
              {advice.explanation} (模式: {d7Settings.betMode === 'FIXED' ? '固定单位' : d7Settings.betMode === 'HALF_KELLY' ? '半 Kelly' : '全 Kelly'})
            </span>
          </div>
        </div>

        {/* Suggested Bet Pill & Quick Bet Button */}
        <div className="flex items-center space-x-2">
          {isAdvantageZone && (
            <div className="bg-black/70 px-2.5 py-1 rounded-lg border border-[#d4af37]/60 text-right">
              <span className="text-[9px] text-amber-200/60 block">建议注额</span>
              <span className="text-sm font-black font-mono text-amber-300">¥{advice.suggestedBet}</span>
            </div>
          )}

          {/* Quick Manual Bet Buttons */}
          <button
            type="button"
            onClick={() => onSetD7Bet(advice.suggestedBet > 0 ? advice.suggestedBet : d7Settings.fixedUnitAmount)}
            disabled={isDealing}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
              isAdvantageZone
                ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-yellow-400 hover:to-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                : 'bg-[#b8860b]/30 text-amber-200/80 border border-[#b8860b]/40 hover:bg-[#b8860b]/50'
            }`}
          >
            <span>✍️ 一键下注</span>
            <span className="font-mono text-xs">¥{advice.suggestedBet > 0 ? advice.suggestedBet : d7Settings.fixedUnitAmount}</span>
          </button>

          {currentD7Bet > 0 && (
            <button
              type="button"
              onClick={() => onSetD7Bet(0)}
              disabled={isDealing}
              className="px-2 py-1.5 rounded-lg bg-red-950/80 text-red-300 border border-red-600/40 hover:bg-red-900 text-xs font-bold transition-all cursor-pointer"
              title="清空当前手龙7下注"
            >
              清空
            </button>
          )}
        </div>
      </div>

      {/* Betting Status & Automatic Betting Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-black/75 rounded-lg border border-[#b8860b]/30 text-xs mb-2.5">
        <div className="flex items-center space-x-2">
          <span className="text-amber-200/70 text-[11px]">当前手龙7下注:</span>
          <span
            className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
              currentD7Bet > 0
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : 'text-zinc-500'
            }`}
          >
            {currentD7Bet > 0 ? `¥${currentD7Bet}` : '¥0 (未押)'}
          </span>
        </div>

        {/* System Auto Bet Switch */}
        <label className="flex items-center space-x-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={d7Settings.isAutoBetEnabled}
            onChange={(e) => onUpdateSettings({ ...d7Settings, isAutoBetEnabled: e.target.checked })}
            className="w-4 h-4 accent-[#d4af37] rounded cursor-pointer"
          />
          <span className={`text-[11px] font-bold ${d7Settings.isAutoBetEnabled ? 'text-emerald-400' : 'text-amber-200/70'}`}>
            ⚡ 系统自动下注 (达阈值自动押)
          </span>
        </label>
      </div>

      {/* Bankroll & P&L Tracker Summary (Core Display 3) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-black/60 p-2.5 rounded-xl border border-[#b8860b]/25 text-[11px]">
        {/* Metric 1: Current Shoe D7 Profit */}
        <div>
          <span className="text-amber-200/60 block text-[10px]">当牌靴龙7盈亏</span>
          <span
            className={`font-mono font-bold text-xs sm:text-sm ${
              currentShoeProfit > 0 ? 'text-emerald-400' : currentShoeProfit < 0 ? 'text-red-400' : 'text-zinc-400'
            }`}
          >
            {currentShoeProfit > 0 ? `+¥${currentShoeProfit}` : currentShoeProfit < 0 ? `-¥${Math.abs(currentShoeProfit)}` : '¥0'}
          </span>
        </div>

        {/* Metric 2: Session Total Wagered (成本) */}
        <div>
          <span className="text-amber-200/60 block text-[10px]">已用总成本 (投注总额)</span>
          <span className="font-mono font-bold text-xs sm:text-sm text-amber-100">¥{totalWagered.toLocaleString()}</span>
        </div>

        {/* Metric 3: Session Net Profit */}
        <div>
          <span className="text-amber-200/60 block text-[10px]">本次会话龙7盈亏</span>
          <span
            className={`font-mono font-bold text-xs sm:text-sm ${
              sessionProfit > 0 ? 'text-emerald-400' : sessionProfit < 0 ? 'text-red-400' : 'text-zinc-400'
            }`}
          >
            {sessionProfit > 0 ? `+¥${sessionProfit.toLocaleString()}` : sessionProfit < 0 ? `-¥${Math.abs(sessionProfit).toLocaleString()}` : '¥0'}
          </span>
        </div>

        {/* Metric 4: Bankroll & Hit Rate */}
        <div>
          <span className="text-amber-200/60 block text-[10px]">命中率 (胜/负)</span>
          <div className="flex items-center space-x-1 font-mono">
            <span className="font-bold text-amber-300">{winCount}</span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-400">{totalBets}手</span>
            <span className="text-[10px] text-amber-200/60 font-sans">({winRate}%)</span>
          </div>
        </div>
      </div>

      {/* History Modal / Drawer */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#051a0b] border-2 border-[#b8860b] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-[#b8860b]/40 flex items-center justify-between bg-black/60">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🐉</span>
                <div>
                  <h3 className="font-serif-casino font-bold text-base text-[#d4af37]">龙7 (Dragon 7) 投注历史明细</h3>
                  <span className="text-xs text-amber-200/60 font-mono">
                    总下注: {d7History.length} 次 | 命中: {winCount} 次 (40:1) | 净盈亏:
                    <strong className={`ml-1 ${sessionProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {sessionProfit >= 0 ? `+¥${sessionProfit}` : `-¥${Math.abs(sessionProfit)}`}
                    </strong>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-amber-200/60 hover:text-white text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Filter Bar */}
            <div className="px-4 py-2 bg-black/40 border-b border-[#b8860b]/20 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setFilterOnlyWins(false)}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    !filterOnlyWins ? 'bg-[#d4af37] text-black' : 'bg-black/60 text-amber-200/70'
                  }`}
                >
                  全部 ({d7History.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOnlyWins(true)}
                  className={`px-2 py-0.5 rounded font-bold transition-all ${
                    filterOnlyWins ? 'bg-emerald-500 text-black' : 'bg-black/60 text-amber-200/70'
                  }`}
                >
                  仅中龙7 ({winCount})
                </button>
              </div>

              {d7History.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('确定清空所有龙7投注历史记录吗？')) {
                      onClearHistory();
                    }
                  }}
                  className="text-red-400 hover:text-red-300 text-[11px] underline cursor-pointer"
                >
                  清空历史
                </button>
              )}
            </div>

            {/* Table Records */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
              {d7History.length === 0 ? (
                <div className="text-center py-10 text-amber-200/50">
                  <span>暂无龙7投注记录。当开牌前押注龙7后，系统将自动在此逐笔记录盈亏！</span>
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#b8860b]/40 text-amber-300/80 font-mono text-[11px] bg-black/40">
                      <th className="p-2">序号</th>
                      <th className="p-2">靴/手</th>
                      <th className="p-2">真数(TC)</th>
                      <th className="p-2">下注额</th>
                      <th className="p-2">结果</th>
                      <th className="p-2 text-right">单手净利</th>
                      <th className="p-2 text-right">累计盈亏</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {d7History
                      .filter((r) => (!filterOnlyWins ? true : r.isWin))
                      .slice()
                      .reverse()
                      .map((record, idx) => (
                        <tr
                          key={record.id || idx}
                          className={`hover:bg-white/5 transition-colors ${
                            record.isWin ? 'bg-amber-950/40 text-yellow-200' : 'text-zinc-300'
                          }`}
                        >
                          <td className="p-2 text-zinc-500">#{record.handNumber}</td>
                          <td className="p-2">
                            第{record.shoeNumber}靴-{record.shoeHandNumber}手
                          </td>
                          <td className="p-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                record.tc >= 4.0
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : 'text-zinc-400'
                              }`}
                            >
                              {record.tc > 0 ? `+${record.tc.toFixed(1)}` : record.tc.toFixed(1)}
                            </span>
                          </td>
                          <td className="p-2 font-bold text-amber-300">¥{record.betAmount}</td>
                          <td className="p-2">
                            {record.isWin ? (
                              <span className="bg-emerald-500 text-black px-1.5 py-0.5 rounded font-bold text-[10px] animate-pulse">
                                🐉 命中 40:1
                              </span>
                            ) : (
                              <span className="text-zinc-500 text-[10px]">未中</span>
                            )}
                          </td>
                          <td
                            className={`p-2 text-right font-bold ${
                              record.netProfit > 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {record.netProfit > 0 ? `+¥${record.netProfit}` : `-¥${Math.abs(record.netProfit)}`}
                          </td>
                          <td
                            className={`p-2 text-right font-bold ${
                              record.cumulativeProfitAfter >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {record.cumulativeProfitAfter >= 0
                              ? `+¥${record.cumulativeProfitAfter}`
                              : `-¥${Math.abs(record.cumulativeProfitAfter)}`}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#b8860b]/40 bg-black/60 flex items-center justify-between text-xs">
              <span className="text-amber-200/60">
                龙7规则：庄家以 3 张牌合计 7 点取胜，中注即享 40 倍高额赔付。
              </span>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1.5 bg-[#b8860b] hover:bg-yellow-500 text-black font-bold rounded-lg transition-all cursor-pointer"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
