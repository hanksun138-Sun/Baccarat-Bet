import React, { useState } from 'react';
import {
  Card,
  Dragon7BetMode,
  Dragon7BetRecord,
  Dragon7Settings,
  HandResult,
  Panda8BetMode,
  Panda8BetRecord,
  Panda8Settings,
  defaultPanda8Settings,
} from '../types';
import {
  calculateDragon7Advantage,
  calculateDragon7RunningCount,
  calculateDragon7TrueCount,
  formatCardsCompact,
} from '../utils/dragon7';
import {
  calculatePanda8Advantage,
  calculatePanda8RunningCount,
  calculatePanda8TrueCount,
} from '../utils/panda8';

interface Dragon7CounterProps {
  handResults: HandResult[];
  burnCard: Card | null;
  burnedCount: number;
  remainingCards: number;
  currentD7Bet: number;
  currentP8Bet?: number;
  isDealing: boolean;
  d7Settings: Dragon7Settings;
  d7History: Dragon7BetRecord[];
  d7Bankroll: number;
  p8Settings?: Panda8Settings;
  p8History?: Panda8BetRecord[];
  p8Bankroll?: number;
  onUpdateSettings: (newSettings: Dragon7Settings) => void;
  onSetD7Bet: (amount: number) => void;
  onUpdateBankroll: (newBankroll: number) => void;
  onClearHistory: () => void;
  onUpdateP8Settings?: (newSettings: Panda8Settings) => void;
  onSetP8Bet?: (amount: number) => void;
  onUpdateP8Bankroll?: (newBankroll: number) => void;
  onClearP8History?: () => void;
}

export const Dragon7Counter: React.FC<Dragon7CounterProps> = ({
  handResults,
  burnCard,
  remainingCards,
  currentD7Bet,
  currentP8Bet = 0,
  isDealing,
  d7Settings,
  d7History,
  d7Bankroll,
  p8Settings = defaultPanda8Settings,
  p8History = [],
  p8Bankroll = 10000,
  onUpdateSettings,
  onSetD7Bet,
  onUpdateBankroll,
  onClearHistory,
  onUpdateP8Settings,
  onSetP8Bet,
  onUpdateP8Bankroll,
  onClearP8History,
}) => {
  const [activeSideTab, setActiveSideTab] = useState<'dragon7' | 'panda8'>('dragon7');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);
  const [filterOnlyWins, setFilterOnlyWins] = useState(false);

  // ==================== Dragon 7 Calculations ====================
  const d7RCDetails = calculateDragon7RunningCount(handResults, burnCard, d7Settings.countingSystem);
  const d7TCDetails = calculateDragon7TrueCount(d7RCDetails.rc, remainingCards, 416);
  const d7Advice = calculateDragon7Advantage(
    d7TCDetails.tc,
    d7Settings.threshold,
    d7Settings.betMode,
    d7Settings.fixedUnitAmount,
    d7Bankroll
  );

  const d7TotalWagered = d7History.reduce((sum, r) => sum + r.betAmount, 0);
  const d7SessionProfit = d7History.reduce((sum, r) => sum + r.netProfit, 0);
  const d7WinCount = d7History.filter((r) => r.isWin).length;
  const d7TotalBets = d7History.length;
  const d7WinRate = d7TotalBets > 0 ? ((d7WinCount / d7TotalBets) * 100).toFixed(1) : '0.0';

  const d7CurrentShoeProfit = handResults.reduce((sum, h) => {
    if (h.aBet.dragon7Amount > 0) {
      return sum + (h.isDragon7 ? h.aBet.dragon7Amount * 40 : -h.aBet.dragon7Amount);
    }
    return sum;
  }, 0);

  const isD7AdvantageZone = d7TCDetails.tc >= d7Settings.threshold;

  // ==================== Panda 8 Calculations ====================
  const p8RCDetails = calculatePanda8RunningCount(handResults, burnCard);
  const p8TCDetails = calculatePanda8TrueCount(p8RCDetails.rc, remainingCards, 416);
  const p8Advice = calculatePanda8Advantage(
    p8TCDetails.tc,
    p8Settings.threshold,
    p8Settings.betMode,
    p8Settings.fixedUnitAmount,
    p8Bankroll
  );

  const p8TotalWagered = p8History.reduce((sum, r) => sum + r.betAmount, 0);
  const p8SessionProfit = p8History.reduce((sum, r) => sum + r.netProfit, 0);
  const p8WinCount = p8History.filter((r) => r.isWin).length;
  const p8TotalBets = p8History.length;
  const p8WinRate = p8TotalBets > 0 ? ((p8WinCount / p8TotalBets) * 100).toFixed(1) : '0.0';

  const p8CurrentShoeProfit = handResults.reduce((sum, h) => {
    if (h.aBet.panda8Amount > 0) {
      return sum + (h.isPanda8 ? h.aBet.panda8Amount * 25 : -h.aBet.panda8Amount);
    }
    return sum;
  }, 0);

  const isP8AdvantageZone = p8TCDetails.tc >= p8Settings.threshold;

  return (
    <div className="bg-[#051a0b]/95 border-2 border-[#b8860b]/40 rounded-xl p-3 shadow-2xl backdrop-blur-md font-sans text-xs text-[#d4af37]">
      {/* Top Main Tab Switcher: Dragon 7 vs Panda 8 */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2.5 border-b border-[#b8860b]/30">
        <div className="flex items-center space-x-1.5 bg-black/70 p-1 rounded-xl border border-[#b8860b]/40">
          <button
            type="button"
            onClick={() => {
              setActiveSideTab('dragon7');
              setShowSettingsDrawer(false);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSideTab === 'dragon7'
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-md font-extrabold'
                : 'text-amber-200/70 hover:text-white hover:bg-black/40'
            }`}
          >
            <span>🐉 龙7 算牌</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                isD7AdvantageZone
                  ? activeSideTab === 'dragon7'
                    ? 'bg-black text-amber-300 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-black/50 text-amber-200/60'
              }`}
            >
              TC: {d7TCDetails.tcDisplay} {isD7AdvantageZone ? '🔥' : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveSideTab('panda8');
              setShowSettingsDrawer(false);
            }}
            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              activeSideTab === 'panda8'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md font-extrabold'
                : 'text-blue-200/70 hover:text-white hover:bg-black/40'
            }`}
          >
            <span>🐼 熊猫8 算牌</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                isP8AdvantageZone
                  ? activeSideTab === 'panda8'
                    ? 'bg-black text-blue-200 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                  : 'bg-black/50 text-blue-200/60'
              }`}
            >
              TC: {p8TCDetails.tcDisplay} {isP8AdvantageZone ? '🔥' : ''}
            </span>
          </button>
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
            ⚙️ {activeSideTab === 'dragon7' ? '龙7参数' : '猫8参数'}
          </button>
          <button
            type="button"
            onClick={() => setShowHistoryModal(true)}
            className="px-2 py-1 rounded text-[11px] font-bold border border-[#b8860b]/40 bg-black/60 text-amber-200 hover:bg-black/80 transition-all cursor-pointer flex items-center gap-1"
          >
            📜 投注记录 ({activeSideTab === 'dragon7' ? d7History.length : p8History.length})
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB CONTENT: DRAGON 7 (龙7)                                              */}
      {/* ========================================================================= */}
      {activeSideTab === 'dragon7' && (
        <div className="space-y-2.5">
          {/* Header Subtitle */}
          <div className="flex items-center justify-between text-[11px] text-amber-200/70 pb-1 border-b border-[#b8860b]/20">
            <span className="flex items-center gap-1.5">
              <strong className="text-amber-300">标准龙7计数系统</strong>
              <span className="text-[10px] bg-red-950/80 text-red-300 px-1.5 py-0.2 rounded border border-red-600/30">
                赔率 40:1
              </span>
            </span>
            <span className="text-[10px] text-amber-200/60">
              [4,5,6,7] = -1 | [8,9] = +2 | 其他牌 = 0 | 触发: TC ≥ +{d7Settings.threshold.toFixed(1)}
            </span>
          </div>

          {/* Settings Drawer (Dragon 7) */}
          {showSettingsDrawer && (
            <div className="p-2.5 rounded-lg bg-black/80 border border-[#b8860b]/50 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 text-[11px]">⚙️ 龙7 算牌与建议下注配置:</span>
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
                  <label className="block text-amber-200/80 font-bold mb-1">建议下注模式:</label>
                  <div className="flex items-center space-x-1.5">
                    {(['FIXED', 'HALF_KELLY', 'FULL_KELLY'] as Dragon7BetMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onUpdateSettings({ ...d7Settings, betMode: mode })}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          d7Settings.betMode === mode
                            ? 'bg-[#d4af37] text-black border-amber-200'
                            : 'bg-black/60 text-amber-200/70 border-[#b8860b]/30'
                        }`}
                      >
                        {mode === 'FIXED' ? '固定单位' : mode === 'HALF_KELLY' ? '半 Kelly' : '全 Kelly'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fixed Unit Amount */}
                <div className="bg-black/50 p-2 rounded border border-[#b8860b]/20">
                  <label className="block text-amber-200/80 font-bold mb-1">自定义固定单位注额 (¥):</label>
                  <div className="flex items-center space-x-2">
                    {[50, 100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => onUpdateSettings({ ...d7Settings, fixedUnitAmount: amt })}
                        className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                          d7Settings.fixedUnitAmount === amt
                            ? 'bg-[#d4af37] text-black border-amber-200'
                            : 'bg-black/60 text-amber-200 border-[#b8860b]/30'
                        }`}
                      >
                        ¥{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bankroll Management */}
                <div className="bg-black/50 p-2 rounded border border-[#b8860b]/20">
                  <label className="block text-amber-200/80 font-bold mb-1">龙7当前专职资金 (¥):</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="100"
                      step="500"
                      value={d7Bankroll}
                      onChange={(e) => onUpdateBankroll(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-24 bg-black border border-[#b8860b]/40 rounded px-2 py-0.5 text-amber-300 font-mono text-xs focus:outline-none focus:border-amber-400"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateBankroll(d7Bankroll + 2000)}
                      className="px-2 py-0.5 bg-emerald-950 text-emerald-200 border border-emerald-600/40 rounded text-xs font-bold hover:bg-emerald-900"
                    >
                      +¥2000
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Core Display: RC, Remaining Decks, TC (3-Card Hero Grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Running Count (RC) Card */}
            <div className="bg-black/70 p-2 sm:p-2.5 rounded-xl border border-[#b8860b]/30 flex flex-col justify-between shadow-inner">
              <div className="text-[10px] text-amber-200/70 flex items-center justify-between">
                <span className="font-bold">跑动计数 (Running Count)</span>
                <span className="text-[9px] font-mono text-amber-300/80">已出 {d7RCDetails.totalCardsSeen} 张牌</span>
              </div>
              <div className="my-1 flex items-baseline justify-center">
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    d7RCDetails.rc > 0 ? 'text-emerald-400' : d7RCDetails.rc < 0 ? 'text-red-400' : 'text-amber-100'
                  }`}
                >
                  {d7RCDetails.rc > 0 ? `+${d7RCDetails.rc}` : d7RCDetails.rc}
                </span>
              </div>
              <div className="text-[9px] text-amber-200/60 flex items-center justify-between border-t border-white/10 pt-1 font-mono">
                <span title="4/5/6/7牌张数(每个-1)">[4-7]: <strong className="text-red-400">{d7RCDetails.negCardsCount}</strong></span>
                <span title="8/9牌张数(每个+2)">[8-9]: <strong className="text-emerald-400">{d7RCDetails.posCardsCount}</strong></span>
              </div>
            </div>

            {/* Decks Remaining & Penetration Card */}
            <div className="bg-black/70 p-2 sm:p-2.5 rounded-xl border border-[#b8860b]/30 flex flex-col justify-between shadow-inner">
              <div className="text-[10px] text-amber-200/70 flex items-center justify-between">
                <span className="font-bold">剩余副数 / 牌量</span>
                <span className="text-[9px] font-mono text-amber-300/80">{d7TCDetails.penetrationPercent.toFixed(0)}%走牌</span>
              </div>
              <div className="my-1 flex flex-col items-center justify-center">
                <div className="text-xl sm:text-2xl font-black font-mono text-amber-100">
                  {d7TCDetails.remainingDecks.toFixed(1)} <span className="text-xs text-amber-300/70 font-normal">副</span>
                </div>
                <div className="text-[10px] font-mono text-amber-200/60">
                  剩余 <span className="text-amber-300 font-bold">{remainingCards}</span> / 416张
                </div>
              </div>
              <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-[#b8860b]/20">
                <div
                  className="bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${d7TCDetails.penetrationPercent}%` }}
                />
              </div>
            </div>

            {/* True Count (TC) Card (Hero) */}
            <div
              className={`p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between shadow-md transition-all ${
                isD7AdvantageZone
                  ? 'bg-gradient-to-b from-amber-950/90 to-yellow-950/80 border-[#d4af37] shadow-[0_0_15px_rgba(212,175,55,0.4)]'
                  : 'bg-black/70 border-[#b8860b]/30'
              }`}
            >
              <div className="text-[10px] flex items-center justify-between">
                <span className={`font-bold ${isD7AdvantageZone ? 'text-amber-300' : 'text-amber-200/70'}`}>
                  真数 (True Count)
                </span>
                <span className="text-[9px] font-mono text-amber-200/60">阈值 ≥ +{d7Settings.threshold.toFixed(1)}</span>
              </div>
              <div className="my-1 flex items-baseline justify-center">
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    isD7AdvantageZone
                      ? 'text-yellow-300 text-shadow-gold animate-pulse'
                      : d7TCDetails.tc > 0
                      ? 'text-amber-200'
                      : 'text-zinc-400'
                  }`}
                >
                  {d7TCDetails.tcDisplay}
                </span>
              </div>
              <div className="text-[9px] text-center border-t border-white/10 pt-1 font-bold">
                {isD7AdvantageZone ? (
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

          {/* High Advantage Alert & Suggested Bet Banner */}
          <div
            className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition-all ${
              isD7AdvantageZone
                ? 'bg-gradient-to-r from-amber-950/90 via-yellow-950/90 to-amber-900/80 border-[#d4af37] shadow-[0_0_18px_rgba(212,175,55,0.3)]'
                : 'bg-black/60 border-[#b8860b]/20 text-amber-200/70'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-xl">{isD7AdvantageZone ? '🎯' : '⏳'}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`font-bold text-xs sm:text-sm ${isD7AdvantageZone ? 'text-yellow-300 text-shadow-gold' : 'text-amber-200/90'}`}>
                    {isD7AdvantageZone ? '【🔥 可以下龙7！】' : '【暂不建议下注】'}
                  </span>
                  {isD7AdvantageZone && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold">
                      玩家优势: +{d7Advice.edgePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-amber-200/70 block mt-0.5">
                  {d7Advice.explanation} (模式: {d7Settings.betMode === 'FIXED' ? '固定单位' : d7Settings.betMode === 'HALF_KELLY' ? '半 Kelly' : '全 Kelly'})
                </span>
              </div>
            </div>

            {/* Suggested Bet Pill & Quick Bet Buttons */}
            <div className="flex items-center space-x-2">
              {isD7AdvantageZone && (
                <div className="bg-black/70 px-2.5 py-1 rounded-lg border border-[#d4af37]/60 text-right">
                  <span className="text-[9px] text-amber-200/60 block">建议注额</span>
                  <span className="text-sm font-black font-mono text-amber-300">¥{d7Advice.suggestedBet}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => onSetD7Bet(d7Advice.suggestedBet > 0 ? d7Advice.suggestedBet : d7Settings.fixedUnitAmount)}
                disabled={isDealing}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                  isD7AdvantageZone
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-yellow-400 hover:to-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.5)]'
                    : 'bg-[#b8860b]/30 text-amber-200/80 border border-[#b8860b]/40 hover:bg-[#b8860b]/50'
                }`}
              >
                <span>✍️ 一键下注</span>
                <span className="font-mono text-xs">¥{d7Advice.suggestedBet > 0 ? d7Advice.suggestedBet : d7Settings.fixedUnitAmount}</span>
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
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-black/75 rounded-lg border border-[#b8860b]/30 text-xs">
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

          {/* Bankroll & P&L Tracker Summary (5 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-black/60 p-2.5 rounded-xl border border-[#b8860b]/25 text-[11px]">
            {/* Metric 1: Current Shoe D7 Profit */}
            <div>
              <span className="text-amber-200/60 block text-[10px]">当牌靴龙7盈亏</span>
              <span
                className={`font-mono font-bold text-xs sm:text-sm ${
                  d7CurrentShoeProfit > 0 ? 'text-emerald-400' : d7CurrentShoeProfit < 0 ? 'text-red-400' : 'text-zinc-400'
                }`}
              >
                {d7CurrentShoeProfit > 0 ? `+¥${d7CurrentShoeProfit}` : d7CurrentShoeProfit < 0 ? `-¥${Math.abs(d7CurrentShoeProfit)}` : '¥0'}
              </span>
            </div>

            {/* Metric 2: Session Total Wagered */}
            <div>
              <span className="text-amber-200/60 block text-[10px]">已用总成本</span>
              <span className="font-mono font-bold text-xs sm:text-sm text-amber-100">¥{d7TotalWagered.toLocaleString()}</span>
            </div>

            {/* Metric 3: Session Net Profit */}
            <div>
              <span className="text-amber-200/60 block text-[10px]">本次会话龙7盈亏</span>
              <span
                className={`font-mono font-bold text-xs sm:text-sm ${
                  d7SessionProfit > 0 ? 'text-emerald-400' : d7SessionProfit < 0 ? 'text-red-400' : 'text-zinc-400'
                }`}
              >
                {d7SessionProfit > 0 ? `+¥${d7SessionProfit.toLocaleString()}` : d7SessionProfit < 0 ? `-¥${Math.abs(d7SessionProfit).toLocaleString()}` : '¥0'}
              </span>
            </div>

            {/* Metric 4: Hit Rate */}
            <div>
              <span className="text-amber-200/60 block text-[10px]">命中率 (40:1)</span>
              <div className="flex items-center space-x-1 font-mono">
                <span className="font-bold text-amber-300">{d7WinCount}</span>
                <span className="text-zinc-500">/</span>
                <span className="text-zinc-400">{d7TotalBets}手</span>
                <span className="text-[10px] text-amber-200/60 font-sans">({d7WinRate}%)</span>
              </div>
            </div>

            {/* Metric 5: Current Bankroll (Prominently displayed) */}
            <div className="bg-amber-950/40 p-1.5 rounded-lg border border-amber-500/30">
              <span className="text-amber-300 block text-[10px] font-bold">当前银行roll余额</span>
              <span className="font-mono font-black text-xs sm:text-sm text-yellow-300">
                ¥{d7Bankroll.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB CONTENT: PANDA 8 (熊猫8)                                             */}
      {/* ========================================================================= */}
      {activeSideTab === 'panda8' && (
        <div className="space-y-2.5">
          {/* Header Subtitle */}
          <div className="flex items-center justify-between text-[11px] text-blue-200/70 pb-1 border-b border-blue-900/30">
            <span className="flex items-center gap-1.5">
              <strong className="text-blue-300">熊猫8 (Panda 8) 计数系统</strong>
              <span className="text-[10px] bg-blue-950/90 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/40">
                赔率 25:1
              </span>
            </span>
            <span className="text-[10px] text-blue-200/60">
              [A,2,10-K]=+1 | [3-5,8]=-2 | [6,7]=-1 | [9]=+4 | 触发: TC ≥ +{p8Settings.threshold.toFixed(1)} (优势约+6.34%)
            </span>
          </div>

          {/* Settings Drawer (Panda 8) */}
          {showSettingsDrawer && (
            <div className="p-2.5 rounded-lg bg-black/80 border border-blue-500/50 space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <span className="font-bold text-blue-300 text-[11px]">⚙️ 熊猫8 算牌与建议下注配置:</span>
                <button
                  type="button"
                  onClick={() => setShowSettingsDrawer(false)}
                  className="text-blue-200/60 hover:text-white text-xs cursor-pointer"
                >
                  ✕ 收起
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                {/* Threshold Input */}
                <div className="bg-black/50 p-2 rounded border border-blue-900/40">
                  <label className="block text-blue-200/80 font-bold mb-1">
                    触发下注阈值 (True Count 阈值, 建议 +11.0):
                  </label>
                  <div className="flex items-center space-x-2">
                    {[10.0, 11.0, 12.0, 13.0].map((th) => (
                      <button
                        key={th}
                        type="button"
                        onClick={() => onUpdateP8Settings && onUpdateP8Settings({ ...p8Settings, threshold: th })}
                        className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                          p8Settings.threshold === th
                            ? 'bg-blue-600 text-white border-blue-200 shadow'
                            : 'bg-black/60 text-blue-200 border-blue-900/40'
                        }`}
                      >
                        +{th.toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bet Mode Selector */}
                <div className="bg-black/50 p-2 rounded border border-blue-900/40">
                  <label className="block text-blue-200/80 font-bold mb-1">建议下注模式:</label>
                  <div className="flex items-center space-x-1.5">
                    {(['FIXED', 'HALF_KELLY', 'FULL_KELLY'] as Panda8BetMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onUpdateP8Settings && onUpdateP8Settings({ ...p8Settings, betMode: mode })}
                        className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                          p8Settings.betMode === mode
                            ? 'bg-blue-600 text-white border-blue-200 shadow'
                            : 'bg-black/60 text-blue-200/70 border-blue-900/40'
                        }`}
                      >
                        {mode === 'FIXED' ? '固定单位' : mode === 'HALF_KELLY' ? '半 Kelly' : '全 Kelly'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fixed Unit Amount */}
                <div className="bg-black/50 p-2 rounded border border-blue-900/40">
                  <label className="block text-blue-200/80 font-bold mb-1">自定义固定单位注额 (¥):</label>
                  <div className="flex items-center space-x-2">
                    {[50, 100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => onUpdateP8Settings && onUpdateP8Settings({ ...p8Settings, fixedUnitAmount: amt })}
                        className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${
                          p8Settings.fixedUnitAmount === amt
                            ? 'bg-blue-600 text-white border-blue-200'
                            : 'bg-black/60 text-blue-200 border-blue-900/40'
                        }`}
                      >
                        ¥{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bankroll Management */}
                <div className="bg-black/50 p-2 rounded border border-blue-900/40">
                  <label className="block text-blue-200/80 font-bold mb-1">熊猫8当前专职资金 (¥):</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      min="100"
                      step="500"
                      value={p8Bankroll}
                      onChange={(e) => onUpdateP8Bankroll && onUpdateP8Bankroll(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-24 bg-black border border-blue-500/40 rounded px-2 py-0.5 text-blue-200 font-mono text-xs focus:outline-none focus:border-blue-300"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateP8Bankroll && onUpdateP8Bankroll(p8Bankroll + 2000)}
                      className="px-2 py-0.5 bg-blue-950 text-blue-200 border border-blue-600/40 rounded text-xs font-bold hover:bg-blue-900"
                    >
                      +¥2000
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Core Display: RC, Remaining Decks, TC (3-Card Hero Grid for Panda 8) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Running Count (RC) Card */}
            <div className="bg-black/70 p-2 sm:p-2.5 rounded-xl border border-blue-900/40 flex flex-col justify-between shadow-inner">
              <div className="text-[10px] text-blue-200/70 flex items-center justify-between">
                <span className="font-bold">跑动计数 (Running Count)</span>
                <span className="text-[9px] font-mono text-blue-300/80">已出 {p8RCDetails.totalCardsSeen} 张牌</span>
              </div>
              <div className="my-1 flex items-baseline justify-center">
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    p8RCDetails.rc > 0 ? 'text-emerald-400' : p8RCDetails.rc < 0 ? 'text-red-400' : 'text-blue-100'
                  }`}
                >
                  {p8RCDetails.rc > 0 ? `+${p8RCDetails.rc}` : p8RCDetails.rc}
                </span>
              </div>
              <div className="text-[9px] text-blue-200/60 flex items-center justify-between border-t border-white/10 pt-1 font-mono">
                <span title="[3,4,5,8]:每个-2 | [6,7]:每个-1">负牌: <strong className="text-red-400">{p8RCDetails.minusCardsCount}</strong></span>
                <span title="[9]:每个+4 (最关键)">9张数: <strong className="text-yellow-400">{p8RCDetails.nineCount}</strong></span>
                <span title="[A,2,10-K]:每个+1">正牌: <strong className="text-emerald-400">{p8RCDetails.plusCardsCount}</strong></span>
              </div>
            </div>

            {/* Decks Remaining & Penetration Card */}
            <div className="bg-black/70 p-2 sm:p-2.5 rounded-xl border border-blue-900/40 flex flex-col justify-between shadow-inner">
              <div className="text-[10px] text-blue-200/70 flex items-center justify-between">
                <span className="font-bold">剩余副数 / 牌量</span>
                <span className="text-[9px] font-mono text-blue-300/80">{p8TCDetails.penetrationPercent.toFixed(0)}%走牌</span>
              </div>
              <div className="my-1 flex flex-col items-center justify-center">
                <div className="text-xl sm:text-2xl font-black font-mono text-blue-100">
                  {p8TCDetails.remainingDecks.toFixed(1)} <span className="text-xs text-blue-300/70 font-normal">副</span>
                </div>
                <div className="text-[10px] font-mono text-blue-200/60">
                  剩余 <span className="text-blue-300 font-bold">{remainingCards}</span> / 416张
                </div>
              </div>
              <div className="w-full bg-black/60 rounded-full h-1.5 overflow-hidden border border-blue-900/30">
                <div
                  className="bg-gradient-to-r from-blue-500 via-indigo-400 to-purple-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${p8TCDetails.penetrationPercent}%` }}
                />
              </div>
            </div>

            {/* True Count (TC) Card (Hero) */}
            <div
              className={`p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between shadow-md transition-all ${
                isP8AdvantageZone
                  ? 'bg-gradient-to-b from-blue-950/90 to-indigo-950/80 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  : 'bg-black/70 border-blue-900/40'
              }`}
            >
              <div className="text-[10px] flex items-center justify-between">
                <span className={`font-bold ${isP8AdvantageZone ? 'text-blue-300' : 'text-blue-200/70'}`}>
                  真数 (True Count)
                </span>
                <span className="text-[9px] font-mono text-blue-200/60">阈值 ≥ +{p8Settings.threshold.toFixed(1)}</span>
              </div>
              <div className="my-1 flex items-baseline justify-center">
                <span
                  className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                    isP8AdvantageZone
                      ? 'text-cyan-300 text-shadow-blue animate-pulse'
                      : p8TCDetails.tc > 0
                      ? 'text-blue-200'
                      : 'text-zinc-400'
                  }`}
                >
                  {p8TCDetails.tcDisplay}
                </span>
              </div>
              <div className="text-[9px] text-center border-t border-white/10 pt-1 font-bold">
                {isP8AdvantageZone ? (
                  <span className="text-emerald-400 flex items-center justify-center gap-1 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    🔥 优势区 (EV 约 +6.34%)
                  </span>
                ) : (
                  <span className="text-zinc-400 font-sans">⚪ 劣势/观望区</span>
                )}
              </div>
            </div>
          </div>

          {/* High Advantage Alert & Suggested Bet Banner for Panda 8 */}
          <div
            className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition-all ${
              isP8AdvantageZone
                ? 'bg-gradient-to-r from-blue-950/90 via-indigo-950/90 to-purple-900/80 border-blue-400 shadow-[0_0_18px_rgba(59,130,246,0.4)]'
                : 'bg-black/60 border-blue-900/30 text-blue-200/70'
            }`}
          >
            <div className="flex items-center space-x-2">
              <span className="text-xl">{isP8AdvantageZone ? '🐼' : '⏳'}</span>
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`font-bold text-xs sm:text-sm ${isP8AdvantageZone ? 'text-cyan-300 text-shadow-blue' : 'text-blue-200/90'}`}>
                    {isP8AdvantageZone ? '【🔥 可以下熊猫8！】' : '【暂不建议下注】'}
                  </span>
                  {isP8AdvantageZone && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold">
                      平均优势: 约 +6.34%
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-blue-200/70 block mt-0.5">
                  {p8Advice.explanation} (模式: {p8Settings.betMode === 'FIXED' ? '固定单位' : p8Settings.betMode === 'HALF_KELLY' ? '半 Kelly' : '全 Kelly'})
                </span>
              </div>
            </div>

            {/* Suggested Bet Pill & Quick Bet Buttons */}
            <div className="flex items-center space-x-2">
              {isP8AdvantageZone && (
                <div className="bg-black/70 px-2.5 py-1 rounded-lg border border-blue-400/60 text-right">
                  <span className="text-[9px] text-blue-200/60 block">建议注额</span>
                  <span className="text-sm font-black font-mono text-cyan-300">¥{p8Advice.suggestedBet}</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => onSetP8Bet && onSetP8Bet(p8Advice.suggestedBet > 0 ? p8Advice.suggestedBet : p8Settings.fixedUnitAmount)}
                disabled={isDealing}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                  isP8AdvantageZone
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-400 hover:to-indigo-400 shadow-[0_0_10px_rgba(59,130,246,0.6)]'
                    : 'bg-blue-900/40 text-blue-200/80 border border-blue-600/40 hover:bg-blue-900/60'
                }`}
              >
                <span>✍️ 一键下注</span>
                <span className="font-mono text-xs">¥{p8Advice.suggestedBet > 0 ? p8Advice.suggestedBet : p8Settings.fixedUnitAmount}</span>
              </button>

              {currentP8Bet > 0 && (
                <button
                  type="button"
                  onClick={() => onSetP8Bet && onSetP8Bet(0)}
                  disabled={isDealing}
                  className="px-2 py-1.5 rounded-lg bg-red-950/80 text-red-300 border border-red-600/40 hover:bg-red-900 text-xs font-bold transition-all cursor-pointer"
                  title="清空当前手熊猫8下注"
                >
                  清空
                </button>
              )}
            </div>
          </div>

          {/* Betting Status & Automatic Betting Control Bar for Panda 8 */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-black/75 rounded-lg border border-blue-900/30 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-blue-200/70 text-[11px]">当前手熊猫8下注:</span>
              <span
                className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
                  currentP8Bet > 0
                    ? 'bg-blue-500/20 text-cyan-300 border border-blue-500/50'
                    : 'text-zinc-500'
                }`}
              >
                {currentP8Bet > 0 ? `¥${currentP8Bet}` : '¥0 (未押)'}
              </span>
            </div>

            <label className="flex items-center space-x-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={p8Settings.isAutoBetEnabled}
                onChange={(e) => onUpdateP8Settings && onUpdateP8Settings({ ...p8Settings, isAutoBetEnabled: e.target.checked })}
                className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
              />
              <span className={`text-[11px] font-bold ${p8Settings.isAutoBetEnabled ? 'text-emerald-400' : 'text-blue-200/70'}`}>
                ⚡ 系统自动下注 (达阈值自动押)
              </span>
            </label>
          </div>

          {/* Bankroll & P&L Tracker Summary for Panda 8 (5 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-black/60 p-2.5 rounded-xl border border-blue-900/30 text-[11px]">
            {/* Metric 1: Current Shoe P8 Profit */}
            <div>
              <span className="text-blue-200/60 block text-[10px]">当牌靴猫8盈亏</span>
              <span
                className={`font-mono font-bold text-xs sm:text-sm ${
                  p8CurrentShoeProfit > 0 ? 'text-emerald-400' : p8CurrentShoeProfit < 0 ? 'text-red-400' : 'text-zinc-400'
                }`}
              >
                {p8CurrentShoeProfit > 0 ? `+¥${p8CurrentShoeProfit}` : p8CurrentShoeProfit < 0 ? `-¥${Math.abs(p8CurrentShoeProfit)}` : '¥0'}
              </span>
            </div>

            {/* Metric 2: Session Total Wagered */}
            <div>
              <span className="text-blue-200/60 block text-[10px]">已用总成本</span>
              <span className="font-mono font-bold text-xs sm:text-sm text-blue-100">¥{p8TotalWagered.toLocaleString()}</span>
            </div>

            {/* Metric 3: Session Net Profit */}
            <div>
              <span className="text-blue-200/60 block text-[10px]">本次会话猫8盈亏</span>
              <span
                className={`font-mono font-bold text-xs sm:text-sm ${
                  p8SessionProfit > 0 ? 'text-emerald-400' : p8SessionProfit < 0 ? 'text-red-400' : 'text-zinc-400'
                }`}
              >
                {p8SessionProfit > 0 ? `+¥${p8SessionProfit.toLocaleString()}` : p8SessionProfit < 0 ? `-¥${Math.abs(p8SessionProfit).toLocaleString()}` : '¥0'}
              </span>
            </div>

            {/* Metric 4: Hit Rate */}
            <div>
              <span className="text-blue-200/60 block text-[10px]">命中率 (25:1)</span>
              <div className="flex items-center space-x-1 font-mono">
                <span className="font-bold text-cyan-300">{p8WinCount}</span>
                <span className="text-zinc-500">/</span>
                <span className="text-zinc-400">{p8TotalBets}手</span>
                <span className="text-[10px] text-blue-200/60 font-sans">({p8WinRate}%)</span>
              </div>
            </div>

            {/* Metric 5: Current Bankroll (Prominently displayed) */}
            <div className="bg-blue-950/40 p-1.5 rounded-lg border border-blue-500/30">
              <span className="text-blue-300 block text-[10px] font-bold">当前银行roll余额</span>
              <span className="font-mono font-black text-xs sm:text-sm text-cyan-300">
                ¥{p8Bankroll.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HISTORY MODAL (Unified for Dragon 7 or Panda 8)                           */}
      {/* ========================================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#051a0b] border-2 border-[#b8860b] rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-[#b8860b]/40 flex items-center justify-between bg-black/60">
              <div className="flex items-center space-x-2">
                <span className="text-xl">{activeSideTab === 'dragon7' ? '🐉' : '🐼'}</span>
                <div>
                  <h3 className="font-serif-casino font-bold text-base text-[#d4af37]">
                    {activeSideTab === 'dragon7' ? '龙7 (Dragon 7) 投注历史明细' : '熊猫8 (Panda 8) 投注历史明细'}
                  </h3>
                  <span className="text-xs text-amber-200/60 font-mono">
                    总下注: {activeSideTab === 'dragon7' ? d7History.length : p8History.length} 次 | 命中:{' '}
                    {activeSideTab === 'dragon7' ? d7WinCount : p8WinCount} 次 ({activeSideTab === 'dragon7' ? '40:1' : '25:1'}) | 净盈亏:
                    <strong
                      className={`ml-1 ${
                        (activeSideTab === 'dragon7' ? d7SessionProfit : p8SessionProfit) >= 0
                          ? 'text-emerald-400'
                          : 'text-red-400'
                      }`}
                    >
                      {(activeSideTab === 'dragon7' ? d7SessionProfit : p8SessionProfit) >= 0
                        ? `+¥${activeSideTab === 'dragon7' ? d7SessionProfit : p8SessionProfit}`
                        : `-¥${Math.abs(activeSideTab === 'dragon7' ? d7SessionProfit : p8SessionProfit)}`}
                    </strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setFilterOnlyWins(!filterOnlyWins)}
                  className={`px-2 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                    filterOnlyWins
                      ? 'bg-yellow-500 text-black border-yellow-300'
                      : 'bg-black/60 text-amber-200/70 border-[#b8860b]/30 hover:text-white'
                  }`}
                >
                  {filterOnlyWins ? '✓ 仅看中奖' : '全部记录'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="w-7 h-7 rounded-full bg-black/60 text-amber-200/80 hover:text-white flex items-center justify-center font-bold border border-[#b8860b]/40 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body: Table */}
            <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
              {activeSideTab === 'dragon7' ? (
                d7History.length === 0 ? (
                  <div className="py-12 text-center text-amber-200/50 text-xs font-serif-casino">
                    暂无龙7下注记录。达到阈值 (+4.0) 下注或手动下注后，自动记录于此。
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-[#b8860b]/30 text-amber-300 font-bold bg-black/40 text-[10px]">
                        <th className="py-1.5 px-2">手数</th>
                        <th className="py-1.5 px-2">RC / TC</th>
                        <th className="py-1.5 px-2">下注额</th>
                        <th className="py-1.5 px-2">开牌结果</th>
                        <th className="py-1.5 px-2 text-right">单次盈亏</th>
                        <th className="py-1.5 px-2 text-right">当靴累计</th>
                        <th className="py-1.5 px-2 text-right">银行roll</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px]">
                      {(filterOnlyWins ? d7History.filter((r) => r.isWin) : d7History)
                        .slice()
                        .reverse()
                        .map((r) => (
                          <tr key={r.id} className="hover:bg-amber-950/20">
                            <td className="py-1.5 px-2 text-amber-300 font-bold">
                              #{r.handNumber} <span className="text-[9px] text-amber-200/50">(第{r.shoeNumber}靴第{r.shoeHandNumber}手)</span>
                            </td>
                            <td className="py-1.5 px-2 text-amber-200/80 font-bold">
                              RC {r.rc > 0 ? `+${r.rc}` : r.rc} | TC {r.tc > 0 ? `+${r.tc.toFixed(1)}` : r.tc.toFixed(1)}
                            </td>
                            <td className="py-1.5 px-2 font-bold text-amber-100">¥{r.betAmount}</td>
                            <td className="py-1.5 px-2">
                              {r.isWin ? (
                                <span className="bg-[#d4af37] text-black px-1.5 py-0.2 rounded font-bold text-[10px]">
                                  🐉 龙7命中 (+40倍)
                                </span>
                              ) : (
                                <span className="text-zinc-400 text-[10px]">未中 ({r.bankerCardsStr})</span>
                              )}
                            </td>
                            <td className={`py-1.5 px-2 text-right font-bold ${r.netProfit > 0 ? 'text-yellow-300' : 'text-red-400'}`}>
                              {r.netProfit > 0 ? `+¥${r.netProfit}` : `-¥${Math.abs(r.netProfit)}`}
                            </td>
                            <td className={`py-1.5 px-2 text-right ${r.shoeProfitAfter >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {r.shoeProfitAfter >= 0 ? `+¥${r.shoeProfitAfter}` : `-¥${Math.abs(r.shoeProfitAfter)}`}
                            </td>
                            <td className="py-1.5 px-2 text-right text-amber-300 font-bold">
                              ¥{r.bankrollAfter.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )
              ) : (
                p8History.length === 0 ? (
                  <div className="py-12 text-center text-blue-200/50 text-xs font-serif-casino">
                    暂无熊猫8下注记录。达到阈值 (+11.0) 下注或手动下注后，自动记录于此。
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono border-collapse">
                    <thead>
                      <tr className="border-b border-blue-500/30 text-blue-300 font-bold bg-black/40 text-[10px]">
                        <th className="py-1.5 px-2">手数</th>
                        <th className="py-1.5 px-2">RC / TC</th>
                        <th className="py-1.5 px-2">下注额</th>
                        <th className="py-1.5 px-2">开牌结果</th>
                        <th className="py-1.5 px-2 text-right">单次盈亏</th>
                        <th className="py-1.5 px-2 text-right">当靴累计</th>
                        <th className="py-1.5 px-2 text-right">银行roll</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-[11px]">
                      {(filterOnlyWins ? p8History.filter((r) => r.isWin) : p8History)
                        .slice()
                        .reverse()
                        .map((r) => (
                          <tr key={r.id} className="hover:bg-blue-950/20">
                            <td className="py-1.5 px-2 text-blue-300 font-bold">
                              #{r.handNumber} <span className="text-[9px] text-blue-200/50">(第{r.shoeNumber}靴第{r.shoeHandNumber}手)</span>
                            </td>
                            <td className="py-1.5 px-2 text-blue-200/80 font-bold">
                              RC {r.rc > 0 ? `+${r.rc}` : r.rc} | TC {r.tc > 0 ? `+${r.tc.toFixed(1)}` : r.tc.toFixed(1)}
                            </td>
                            <td className="py-1.5 px-2 font-bold text-blue-100">¥{r.betAmount}</td>
                            <td className="py-1.5 px-2">
                              {r.isWin ? (
                                <span className="bg-blue-500 text-white px-1.5 py-0.2 rounded font-bold text-[10px]">
                                  🐼 猫8命中 (+25倍)
                                </span>
                              ) : (
                                <span className="text-zinc-400 text-[10px]">未中 ({r.playerCardsStr})</span>
                              )}
                            </td>
                            <td className={`py-1.5 px-2 text-right font-bold ${r.netProfit > 0 ? 'text-cyan-300' : 'text-red-400'}`}>
                              {r.netProfit > 0 ? `+¥${r.netProfit}` : `-¥${Math.abs(r.netProfit)}`}
                            </td>
                            <td className={`py-1.5 px-2 text-right ${r.shoeProfitAfter >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {r.shoeProfitAfter >= 0 ? `+¥${r.shoeProfitAfter}` : `-¥${Math.abs(r.shoeProfitAfter)}`}
                            </td>
                            <td className="py-1.5 px-2 text-right text-blue-300 font-bold">
                              ¥{r.bankrollAfter.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-2 border-t border-[#b8860b]/30 flex items-center justify-between bg-black/60 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (activeSideTab === 'dragon7') {
                    if (window.confirm('确定要清空龙7的全部历史投注记录吗？')) onClearHistory();
                  } else {
                    if (window.confirm('确定要清空熊猫8的全部历史投注记录吗？') && onClearP8History) onClearP8History();
                  }
                }}
                className="text-red-400/80 hover:text-red-300 hover:underline cursor-pointer"
              >
                🗑️ 清空{activeSideTab === 'dragon7' ? '龙7' : '熊猫8'}投注记录
              </button>
              <button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-1 rounded bg-[#b8860b]/40 hover:bg-[#b8860b]/60 text-amber-200 font-bold cursor-pointer"
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
