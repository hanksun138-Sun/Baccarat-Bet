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
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTab, setHistoryTab] = useState<'dragon7' | 'panda8'>('dragon7');
  const [showD7Settings, setShowD7Settings] = useState(false);
  const [showP8Settings, setShowP8Settings] = useState(false);
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
    <div className="bg-[#051a0b]/95 border-2 border-[#b8860b]/40 rounded-2xl p-3 sm:p-4 shadow-2xl backdrop-blur-md font-sans text-xs text-[#d4af37]">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-[#b8860b]/30">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-xl sm:text-2xl">
            <span>🐉</span>
            <span className="text-sm text-amber-200/50">✕</span>
            <span>🐼</span>
          </div>
          <div>
            <h3 className="font-serif-casino font-bold text-sm sm:text-base text-[#d4af37] flex items-center gap-2">
              <span>百家乐「龙7 &amp; 熊猫8」双侧注实时算牌系统</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                双通道并行运行中
              </span>
            </h3>
            <span className="text-[10px] text-amber-200/60 block">
              左右两侧同时进行独立计数、真数推导、优势判定与自动化下注
            </span>
          </div>
        </div>

        {/* Global Control Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            type="button"
            onClick={() => {
              setHistoryTab('dragon7');
              setShowHistoryModal(true);
            }}
            className="px-2.5 py-1 rounded-lg text-[11px] font-bold border border-[#b8860b]/40 bg-black/60 text-amber-200 hover:bg-black/90 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
          >
            <span>📜</span>
            <span>投注历史明细 (龙7: {d7History.length} / 猫8: {p8History.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MAIN TWO-COLUMN SIMULTANEOUS LAYOUT                                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3.5">
        {/* ======================================================================= */}
        {/* LEFT COLUMN: 🐉 DRAGON 7 (龙7) 算牌系统                                 */}
        {/* ======================================================================= */}
        <div className="bg-gradient-to-b from-amber-950/40 via-black/70 to-black/80 rounded-xl p-3 border border-amber-500/30 flex flex-col justify-between space-y-3 shadow-lg">
          {/* Column Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-amber-500/20">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🐉</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif-casino font-bold text-amber-300 text-sm">龙7 (Dragon 7)</span>
                  <span className="text-[10px] bg-red-950/90 text-red-300 px-1.5 py-0.2 rounded border border-red-600/40 font-bold">
                    赔率 40:1
                  </span>
                  {isD7AdvantageZone && (
                    <span className="text-[10px] bg-amber-500 text-black px-1.5 py-0.2 rounded font-extrabold animate-pulse">
                      优势切入点
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-amber-200/60 block">
                  庄3张合计7点胜出 | [4-7]=-1, [8-9]=+2 | 触发: TC ≥ +{d7Settings.threshold.toFixed(1)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowD7Settings(!showD7Settings)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                showD7Settings
                  ? 'bg-[#d4af37] text-black border-amber-300'
                  : 'bg-black/60 text-amber-200 border-[#b8860b]/40 hover:bg-black/90'
              }`}
            >
              ⚙️ 参数
            </button>
          </div>

          {/* Settings Drawer (Dragon 7) */}
          {showD7Settings && (
            <div className="p-2.5 rounded-lg bg-black/90 border border-amber-500/40 space-y-2 text-[11px] animate-fadeIn">
              <div className="flex items-center justify-between border-b border-amber-500/20 pb-1">
                <span className="font-bold text-amber-300">⚙️ 龙7 算牌与建议配置:</span>
                <button
                  type="button"
                  onClick={() => setShowD7Settings(false)}
                  className="text-amber-200/60 hover:text-white text-xs cursor-pointer"
                >
                  ✕ 收起
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Threshold */}
                <div className="bg-black/60 p-1.5 rounded border border-[#b8860b]/20">
                  <label className="block text-amber-200/80 font-bold text-[10px] mb-1">
                    触发真数阈值 (TC):
                  </label>
                  <div className="flex items-center space-x-1.5">
                    {[3.5, 4.0, 4.5, 5.0].map((th) => (
                      <button
                        key={th}
                        type="button"
                        onClick={() => onUpdateSettings({ ...d7Settings, threshold: th })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
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

                {/* Bet Mode */}
                <div className="bg-black/60 p-1.5 rounded border border-[#b8860b]/20">
                  <label className="block text-amber-200/80 font-bold text-[10px] mb-1">下注模式:</label>
                  <div className="flex items-center space-x-1">
                    {(['FIXED', 'HALF_KELLY', 'FULL_KELLY'] as Dragon7BetMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onUpdateSettings({ ...d7Settings, betMode: mode })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          d7Settings.betMode === mode
                            ? 'bg-[#d4af37] text-black border-amber-200'
                            : 'bg-black/60 text-amber-200/70 border-[#b8860b]/30'
                        }`}
                      >
                        {mode === 'FIXED' ? '固定' : mode === 'HALF_KELLY' ? '半Kelly' : '全Kelly'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fixed Unit */}
                <div className="bg-black/60 p-1.5 rounded border border-[#b8860b]/20">
                  <label className="block text-amber-200/80 font-bold text-[10px] mb-1">自定义固定单位注额 (¥):</label>
                  <div className="flex items-center space-x-1.5">
                    {[50, 100, 200, 500].map((amt) => (
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
                </div>

                {/* Bankroll */}
                <div className="bg-black/60 p-1.5 rounded border border-[#b8860b]/20">
                  <label className="block text-amber-200/80 font-bold text-[10px] mb-1">专职起始本金 (¥):</label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      min="100"
                      step="500"
                      value={d7Bankroll}
                      onChange={(e) => onUpdateBankroll(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-20 bg-black border border-[#b8860b]/40 rounded px-1.5 py-0.5 text-amber-300 font-mono text-[10px] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateBankroll(d7Bankroll + 2000)}
                      className="px-1.5 py-0.5 bg-emerald-950 text-emerald-200 border border-emerald-600/40 rounded text-[10px] font-bold hover:bg-emerald-900"
                    >
                      +¥2000
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3 Indicators Hero (RC, Decks, TC) */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Running Count (RC) Card */}
            <div className="bg-black/75 p-2 rounded-lg border border-amber-500/30 flex flex-col justify-between shadow-inner">
              <span className="text-[9px] text-amber-200/70 block truncate font-bold">跑动计数 (RC)</span>
              <div className="my-0.5 text-center">
                <span
                  className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                    d7RCDetails.rc > 0 ? 'text-emerald-400' : d7RCDetails.rc < 0 ? 'text-red-400' : 'text-amber-100'
                  }`}
                >
                  {d7RCDetails.rc > 0 ? `+${d7RCDetails.rc}` : d7RCDetails.rc}
                </span>
              </div>
              <div className="text-[8px] text-amber-200/60 flex items-center justify-between border-t border-white/10 pt-0.5 font-mono">
                <span title="4/5/6/7牌(各-1)">4-7: <strong className="text-red-400">{d7RCDetails.negCardsCount}</strong></span>
                <span title="8/9牌(各+2)">8-9: <strong className="text-emerald-400">{d7RCDetails.posCardsCount}</strong></span>
              </div>
            </div>

            {/* Decks Remaining */}
            <div className="bg-black/75 p-2 rounded-lg border border-amber-500/30 flex flex-col justify-between shadow-inner">
              <span className="text-[9px] text-amber-200/70 block truncate font-bold">剩余副数/牌量</span>
              <div className="my-0.5 text-center">
                <span className="text-base sm:text-lg font-black font-mono text-amber-100">
                  {d7TCDetails.remainingDecks.toFixed(1)} <span className="text-[9px] text-amber-300/70 font-normal">副</span>
                </span>
                <span className="text-[8px] text-amber-200/50 block font-mono">
                  余 {remainingCards} / 416张
                </span>
              </div>
              <div className="w-full bg-black/60 rounded-full h-1 overflow-hidden border border-amber-900/30">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-amber-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${d7TCDetails.penetrationPercent}%` }}
                />
              </div>
            </div>

            {/* True Count (TC) */}
            <div
              className={`p-2 rounded-lg border flex flex-col justify-between shadow-md transition-all ${
                isD7AdvantageZone
                  ? 'bg-gradient-to-b from-amber-950/90 to-yellow-950/80 border-[#d4af37] shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                  : 'bg-black/75 border-amber-500/30'
              }`}
            >
              <div className="flex items-center justify-between text-[9px]">
                <span className={`font-bold ${isD7AdvantageZone ? 'text-amber-300' : 'text-amber-200/70'}`}>
                  真数 (TC)
                </span>
                <span className="text-[8px] font-mono text-amber-200/50">≥+{d7Settings.threshold.toFixed(1)}</span>
              </div>
              <div className="my-0.5 text-center">
                <span
                  className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
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
              <div className="text-[8px] text-center border-t border-white/10 pt-0.5 font-bold">
                {isD7AdvantageZone ? (
                  <span className="text-emerald-400 font-sans">🔥 优势区 (EV &gt; 0)</span>
                ) : (
                  <span className="text-zinc-400 font-sans">⚪ 劣势/观望</span>
                )}
              </div>
            </div>
          </div>

          {/* High Advantage Alert & Suggested Bet Banner */}
          <div
            className={`p-2 rounded-lg border flex flex-wrap items-center justify-between gap-1.5 transition-all ${
              isD7AdvantageZone
                ? 'bg-gradient-to-r from-amber-950/90 to-yellow-950/90 border-[#d4af37]'
                : 'bg-black/60 border-amber-900/30 text-amber-200/70'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <span className="text-lg">{isD7AdvantageZone ? '🎯' : '⏳'}</span>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className={`font-bold text-xs ${isD7AdvantageZone ? 'text-yellow-300' : 'text-amber-200/90'}`}>
                    {isD7AdvantageZone ? '【🔥 可以下龙7！】' : '【观望中，未达阈值】'}
                  </span>
                  {isD7AdvantageZone && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-1 py-0.2 rounded text-[9px] font-mono font-bold">
                      优势: +{d7Advice.edgePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-amber-200/60 block mt-0.5">
                  建议: {d7Advice.suggestedBet > 0 ? `¥${d7Advice.suggestedBet}` : '观望'} ({d7Settings.betMode === 'FIXED' ? '固定单位' : d7Settings.betMode === 'HALF_KELLY' ? '半Kelly' : '全Kelly'})
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => onSetD7Bet(d7Advice.suggestedBet > 0 ? d7Advice.suggestedBet : d7Settings.fixedUnitAmount)}
                disabled={isDealing}
                className={`px-2 py-1 rounded font-bold text-[11px] shadow transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                  isD7AdvantageZone
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                    : 'bg-[#b8860b]/30 text-amber-200/80 border border-[#b8860b]/40 hover:bg-[#b8860b]/50'
                }`}
              >
                <span>✍️ 下注</span>
                <span className="font-mono">¥{d7Advice.suggestedBet > 0 ? d7Advice.suggestedBet : d7Settings.fixedUnitAmount}</span>
              </button>

              <button
                type="button"
                onClick={() => onSetD7Bet(currentD7Bet + 100)}
                disabled={isDealing}
                className="px-1.5 py-1 rounded bg-black/60 border border-amber-500/30 text-amber-200 hover:text-white text-[10px] font-bold"
                title="手动加注 ¥100"
              >
                +100
              </button>

              {currentD7Bet > 0 && (
                <button
                  type="button"
                  onClick={() => onSetD7Bet(0)}
                  disabled={isDealing}
                  className="px-1.5 py-1 rounded bg-red-950/80 text-red-300 border border-red-600/40 hover:bg-red-900 text-[10px] font-bold transition-all cursor-pointer"
                  title="清空当前手龙7下注"
                >
                  清空
                </button>
              )}
            </div>
          </div>

          {/* Betting Status & Automatic Betting Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-black/80 rounded-lg border border-amber-500/30 text-[11px]">
            <div className="flex items-center space-x-1.5">
              <span className="text-amber-200/70 text-[10px]">当前手龙7下注:</span>
              <span
                className={`font-mono font-bold text-xs px-1.5 py-0.2 rounded ${
                  currentD7Bet > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                    : 'text-zinc-500'
                }`}
              >
                {currentD7Bet > 0 ? `¥${currentD7Bet}` : '¥0 (未押)'}
              </span>
            </div>

            <label className="flex items-center space-x-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={d7Settings.isAutoBetEnabled}
                onChange={(e) => onUpdateSettings({ ...d7Settings, isAutoBetEnabled: e.target.checked })}
                className="w-3.5 h-3.5 accent-[#d4af37] rounded cursor-pointer"
              />
              <span className={`text-[10px] font-bold ${d7Settings.isAutoBetEnabled ? 'text-emerald-400' : 'text-amber-200/70'}`}>
                ⚡ 自动下注 (达标自动押)
              </span>
            </label>
          </div>

          {/* Bankroll & P&L Tracker Summary (5 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-black/60 p-2 rounded-lg border border-amber-500/20 text-[10px]">
            <div>
              <span className="text-amber-200/60 block text-[9px]">当牌靴盈亏</span>
              <span
                className={`font-mono font-bold text-xs ${
                  d7CurrentShoeProfit > 0 ? 'text-emerald-400' : d7CurrentShoeProfit < 0 ? 'text-red-400' : 'text-zinc-400'
                }`}
              >
                {d7CurrentShoeProfit > 0 ? `+¥${d7CurrentShoeProfit}` : d7CurrentShoeProfit < 0 ? `-¥${Math.abs(d7CurrentShoeProfit)}` : '¥0'}
              </span>
            </div>

            <div>
              <span className="text-amber-200/60 block text-[9px]">已用总成本</span>
              <span className="font-mono font-bold text-xs text-amber-100">¥{d7TotalWagered.toLocaleString()}</span>
            </div>

            <div>
              <span className="text-amber-200/60 block text-[9px]">会话总盈亏</span>
              <span
                className={`font-mono font-bold text-xs ${
                  d7SessionProfit > 0 ? 'text-emerald-400' : d7SessionProfit < 0 ? 'text-red-400' : 'text-zinc-400'
                }`}
              >
                {d7SessionProfit > 0 ? `+¥${d7SessionProfit.toLocaleString()}` : d7SessionProfit < 0 ? `-¥${Math.abs(d7SessionProfit).toLocaleString()}` : '¥0'}
              </span>
            </div>

            <div>
              <span className="text-amber-200/60 block text-[9px]">命中率 (40:1)</span>
              <div className="font-mono">
                <span className="font-bold text-amber-300">{d7WinCount}</span>
                <span className="text-zinc-500">/{d7TotalBets}手</span>
                <span className="text-[9px] text-amber-200/60 font-sans ml-0.5">({d7WinRate}%)</span>
              </div>
            </div>

            <div className="bg-amber-950/40 p-1 rounded border border-amber-500/30">
              <span className="text-amber-300 block text-[9px] font-bold">银行roll余额</span>
              <span className="font-mono font-black text-xs text-yellow-300">
                ¥{d7Bankroll.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* ======================================================================= */}
        {/* RIGHT COLUMN: 🐼 PANDA 8 (熊猫8) 算牌系统                                */}
        {/* ======================================================================= */}
        <div className="bg-gradient-to-b from-blue-950/40 via-black/70 to-black/80 rounded-xl p-3 border border-blue-500/30 flex flex-col justify-between space-y-3 shadow-lg">
          {/* Column Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-blue-500/20">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🐼</span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-serif-casino font-bold text-blue-300 text-sm">熊猫8 (Panda 8)</span>
                  <span className="text-[10px] bg-blue-950/90 text-blue-300 px-1.5 py-0.2 rounded border border-blue-500/40 font-bold">
                    赔率 25:1
                  </span>
                  {isP8AdvantageZone && (
                    <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.2 rounded font-extrabold animate-pulse">
                      优势切入点
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-blue-200/60 block">
                  闲3张合计8点胜出 | [3-5,8]=-2, [6,7]=-1, [9]=+4, 其余+1 | 触发: TC ≥ +{p8Settings.threshold.toFixed(1)}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowP8Settings(!showP8Settings)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-all cursor-pointer ${
                showP8Settings
                  ? 'bg-blue-600 text-white border-blue-300'
                  : 'bg-black/60 text-blue-200 border-blue-900/40 hover:bg-black/90'
              }`}
            >
              ⚙️ 参数
            </button>
          </div>

          {/* Settings Drawer (Panda 8) */}
          {showP8Settings && (
            <div className="p-2.5 rounded-lg bg-black/90 border border-blue-500/40 space-y-2 text-[11px] animate-fadeIn">
              <div className="flex items-center justify-between border-b border-blue-500/20 pb-1">
                <span className="font-bold text-blue-300">⚙️ 熊猫8 算牌与建议配置:</span>
                <button
                  type="button"
                  onClick={() => setShowP8Settings(false)}
                  className="text-blue-200/60 hover:text-white text-xs cursor-pointer"
                >
                  ✕ 收起
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Threshold */}
                <div className="bg-black/60 p-1.5 rounded border border-blue-900/30">
                  <label className="block text-blue-200/80 font-bold text-[10px] mb-1">
                    触发真数阈值 (TC, 建议 +11.0):
                  </label>
                  <div className="flex items-center space-x-1.5">
                    {[10.0, 11.0, 12.0, 13.0].map((th) => (
                      <button
                        key={th}
                        type="button"
                        onClick={() => onUpdateP8Settings && onUpdateP8Settings({ ...p8Settings, threshold: th })}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          p8Settings.threshold === th
                            ? 'bg-blue-600 text-white border-blue-200'
                            : 'bg-black/60 text-blue-200 border-blue-900/30'
                        }`}
                      >
                        +{th.toFixed(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bet Mode */}
                <div className="bg-black/60 p-1.5 rounded border border-blue-900/30">
                  <label className="block text-blue-200/80 font-bold text-[10px] mb-1">下注模式:</label>
                  <div className="flex items-center space-x-1">
                    {(['FIXED', 'HALF_KELLY', 'FULL_KELLY'] as Panda8BetMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => onUpdateP8Settings && onUpdateP8Settings({ ...p8Settings, betMode: mode })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                          p8Settings.betMode === mode
                            ? 'bg-blue-600 text-white border-blue-200'
                            : 'bg-black/60 text-blue-200/70 border-blue-900/30'
                        }`}
                      >
                        {mode === 'FIXED' ? '固定' : mode === 'HALF_KELLY' ? '半Kelly' : '全Kelly'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fixed Unit */}
                <div className="bg-black/60 p-1.5 rounded border border-blue-900/30">
                  <label className="block text-blue-200/80 font-bold text-[10px] mb-1">自定义固定单位注额 (¥):</label>
                  <div className="flex items-center space-x-1.5">
                    {[50, 100, 200, 500].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => onUpdateP8Settings && onUpdateP8Settings({ ...p8Settings, fixedUnitAmount: amt })}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          p8Settings.fixedUnitAmount === amt
                            ? 'bg-blue-600 text-white border-blue-200'
                            : 'bg-black/60 text-blue-200 border-blue-900/30'
                        }`}
                      >
                        ¥{amt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bankroll */}
                <div className="bg-black/60 p-1.5 rounded border border-blue-900/30">
                  <label className="block text-blue-200/80 font-bold text-[10px] mb-1">专职起始本金 (¥):</label>
                  <div className="flex items-center space-x-1.5">
                    <input
                      type="number"
                      min="100"
                      step="500"
                      value={p8Bankroll}
                      onChange={(e) => onUpdateP8Bankroll && onUpdateP8Bankroll(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-20 bg-black border border-blue-500/40 rounded px-1.5 py-0.5 text-blue-200 font-mono text-[10px] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateP8Bankroll && onUpdateP8Bankroll(p8Bankroll + 2000)}
                      className="px-1.5 py-0.5 bg-blue-950 text-blue-200 border border-blue-600/40 rounded text-[10px] font-bold hover:bg-blue-900"
                    >
                      +¥2000
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3 Indicators Hero (RC, Decks, TC) */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* Running Count (RC) Card */}
            <div className="bg-black/75 p-2 rounded-lg border border-blue-500/30 flex flex-col justify-between shadow-inner">
              <span className="text-[9px] text-blue-200/70 block truncate font-bold">跑动计数 (RC)</span>
              <div className="my-0.5 text-center">
                <span
                  className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                    p8RCDetails.rc > 0 ? 'text-emerald-400' : p8RCDetails.rc < 0 ? 'text-red-400' : 'text-blue-100'
                  }`}
                >
                  {p8RCDetails.rc > 0 ? `+${p8RCDetails.rc}` : p8RCDetails.rc}
                </span>
              </div>
              <div className="text-[8px] text-blue-200/60 flex items-center justify-between border-t border-white/10 pt-0.5 font-mono">
                <span title="负牌[3-5,8]:-2, [6,7]:-1">负: <strong className="text-red-400">{p8RCDetails.minusCardsCount}</strong></span>
                <span title="[9]:每个+4">9张: <strong className="text-yellow-400">{p8RCDetails.nineCount}</strong></span>
                <span title="正牌[A,2,10-K]:+1">正: <strong className="text-emerald-400">{p8RCDetails.plusCardsCount}</strong></span>
              </div>
            </div>

            {/* Decks Remaining */}
            <div className="bg-black/75 p-2 rounded-lg border border-blue-500/30 flex flex-col justify-between shadow-inner">
              <span className="text-[9px] text-blue-200/70 block truncate font-bold">剩余副数/牌量</span>
              <div className="my-0.5 text-center">
                <span className="text-base sm:text-lg font-black font-mono text-blue-100">
                  {p8TCDetails.remainingDecks.toFixed(1)} <span className="text-[9px] text-blue-300/70 font-normal">副</span>
                </span>
                <span className="text-[8px] text-blue-200/50 block font-mono">
                  余 {remainingCards} / 416张
                </span>
              </div>
              <div className="w-full bg-black/60 rounded-full h-1 overflow-hidden border border-blue-900/30">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${p8TCDetails.penetrationPercent}%` }}
                />
              </div>
            </div>

            {/* True Count (TC) */}
            <div
              className={`p-2 rounded-lg border flex flex-col justify-between shadow-md transition-all ${
                isP8AdvantageZone
                  ? 'bg-gradient-to-b from-blue-950/90 to-indigo-950/80 border-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.5)]'
                  : 'bg-black/75 border-blue-500/30'
              }`}
            >
              <div className="flex items-center justify-between text-[9px]">
                <span className={`font-bold ${isP8AdvantageZone ? 'text-blue-300' : 'text-blue-200/70'}`}>
                  真数 (TC)
                </span>
                <span className="text-[8px] font-mono text-blue-200/50">≥+{p8Settings.threshold.toFixed(1)}</span>
              </div>
              <div className="my-0.5 text-center">
                <span
                  className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
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
              <div className="text-[8px] text-center border-t border-white/10 pt-0.5 font-bold">
                {isP8AdvantageZone ? (
                  <span className="text-emerald-400 font-sans">🔥 优势区 (EV 约 +6.34%)</span>
                ) : (
                  <span className="text-zinc-400 font-sans">⚪ 劣势/观望</span>
                )}
              </div>
            </div>
          </div>

          {/* High Advantage Alert & Suggested Bet Banner */}
          <div
            className={`p-2 rounded-lg border flex flex-wrap items-center justify-between gap-1.5 transition-all ${
              isP8AdvantageZone
                ? 'bg-gradient-to-r from-blue-950/90 to-indigo-950/90 border-blue-400'
                : 'bg-black/60 border-blue-900/30 text-blue-200/70'
            }`}
          >
            <div className="flex items-center space-x-1.5">
              <span className="text-lg">{isP8AdvantageZone ? '🐼' : '⏳'}</span>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className={`font-bold text-xs ${isP8AdvantageZone ? 'text-cyan-300' : 'text-blue-200/90'}`}>
                    {isP8AdvantageZone ? '【🔥 可以下熊猫8！】' : '【观望中，未达阈值】'}
                  </span>
                  {isP8AdvantageZone && (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-1 py-0.2 rounded text-[9px] font-mono font-bold">
                      平均优势: 约 +6.34%
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-blue-200/60 block mt-0.5">
                  建议: {p8Advice.suggestedBet > 0 ? `¥${p8Advice.suggestedBet}` : '观望'} ({p8Settings.betMode === 'FIXED' ? '固定单位' : p8Settings.betMode === 'HALF_KELLY' ? '半Kelly' : '全Kelly'})
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                onClick={() => onSetP8Bet && onSetP8Bet(p8Advice.suggestedBet > 0 ? p8Advice.suggestedBet : p8Settings.fixedUnitAmount)}
                disabled={isDealing}
                className={`px-2 py-1 rounded font-bold text-[11px] shadow transition-all active:scale-95 cursor-pointer flex items-center gap-1 ${
                  isP8AdvantageZone
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                    : 'bg-blue-900/40 text-blue-200/80 border border-blue-600/40 hover:bg-blue-900/60'
                }`}
              >
                <span>✍️ 下注</span>
                <span className="font-mono">¥{p8Advice.suggestedBet > 0 ? p8Advice.suggestedBet : p8Settings.fixedUnitAmount}</span>
              </button>

              <button
                type="button"
                onClick={() => onSetP8Bet && onSetP8Bet(currentP8Bet + 100)}
                disabled={isDealing}
                className="px-1.5 py-1 rounded bg-black/60 border border-blue-500/30 text-blue-200 hover:text-white text-[10px] font-bold"
                title="手动加注 ¥100"
              >
                +100
              </button>

              {currentP8Bet > 0 && (
                <button
                  type="button"
                  onClick={() => onSetP8Bet && onSetP8Bet(0)}
                  disabled={isDealing}
                  className="px-1.5 py-1 rounded bg-red-950/80 text-red-300 border border-red-600/40 hover:bg-red-900 text-[10px] font-bold transition-all cursor-pointer"
                  title="清空当前手熊猫8下注"
                >
                  清空
                </button>
              )}
            </div>
          </div>

          {/* Betting Status & Automatic Betting Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-black/80 rounded-lg border border-blue-500/30 text-[11px]">
            <div className="flex items-center space-x-1.5">
              <span className="text-blue-200/70 text-[10px]">当前手熊猫8下注:</span>
              <span
                className={`font-mono font-bold text-xs px-1.5 py-0.2 rounded ${
                  currentP8Bet > 0
                    ? 'bg-blue-500/20 text-cyan-300 border border-blue-500/50'
                    : 'text-zinc-500'
                }`}
              >
                {currentP8Bet > 0 ? `¥${currentP8Bet}` : '¥0 (未押)'}
              </span>
            </div>

            <label className="flex items-center space-x-1 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={p8Settings.isAutoBetEnabled}
                onChange={(e) => onUpdateP8Settings && onUpdateP8Settings({ ...p8Settings, isAutoBetEnabled: e.target.checked })}
                className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
              />
              <span className={`text-[10px] font-bold ${p8Settings.isAutoBetEnabled ? 'text-emerald-400' : 'text-blue-200/70'}`}>
                ⚡ 自动下注 (达标自动押)
              </span>
            </label>
          </div>

          {/* Bankroll & P&L Tracker Summary (5 Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-black/60 p-2 rounded-lg border border-blue-500/20 text-[10px]">
            <div>
              <span className="text-blue-200/60 block text-[9px]">当牌靴盈亏</span>
              <span
                className={`font-mono font-bold text-xs ${
                  p8CurrentShoeProfit > 0 ? 'text-emerald-400' : p8CurrentShoeProfit < 0 ? 'text-red-400' : 'text-zinc-400'
                }`}
              >
                {p8CurrentShoeProfit > 0 ? `+¥${p8CurrentShoeProfit}` : p8CurrentShoeProfit < 0 ? `-¥${Math.abs(p8CurrentShoeProfit)}` : '¥0'}
              </span>
            </div>

            <div>
              <span className="text-blue-200/60 block text-[9px]">已用总成本</span>
              <span className="font-mono font-bold text-xs text-blue-100">¥{p8TotalWagered.toLocaleString()}</span>
            </div>

            <div>
              <span className="text-blue-200/60 block text-[9px]">会话总盈亏</span>
              <span
                className={`font-mono font-bold text-xs ${
                  p8SessionProfit > 0 ? 'text-emerald-400' : p8SessionProfit < 0 ? 'text-red-400' : 'text-zinc-400'
                }`}
              >
                {p8SessionProfit > 0 ? `+¥${p8SessionProfit.toLocaleString()}` : p8SessionProfit < 0 ? `-¥${Math.abs(p8SessionProfit).toLocaleString()}` : '¥0'}
              </span>
            </div>

            <div>
              <span className="text-blue-200/60 block text-[9px]">命中率 (25:1)</span>
              <div className="font-mono">
                <span className="font-bold text-cyan-300">{p8WinCount}</span>
                <span className="text-zinc-500">/{p8TotalBets}手</span>
                <span className="text-[9px] text-blue-200/60 font-sans ml-0.5">({p8WinRate}%)</span>
              </div>
            </div>

            <div className="bg-blue-950/40 p-1 rounded border border-blue-500/30">
              <span className="text-blue-300 block text-[9px] font-bold">银行roll余额</span>
              <span className="font-mono font-black text-xs text-cyan-300">
                ¥{p8Bankroll.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* HISTORY MODAL (Unified with tabs for Dragon 7 & Panda 8)                  */}
      {/* ========================================================================= */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#051a0b] border-2 border-[#b8860b] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden font-sans">
            {/* Modal Header */}
            <div className="px-4 py-3 border-b border-[#b8860b]/40 flex flex-wrap items-center justify-between bg-black/70 gap-2">
              <div className="flex items-center space-x-2">
                <div className="flex bg-black/60 p-0.5 rounded-lg border border-[#b8860b]/30 text-xs">
                  <button
                    type="button"
                    onClick={() => setHistoryTab('dragon7')}
                    className={`px-3 py-1 rounded font-bold cursor-pointer transition-all ${
                      historyTab === 'dragon7'
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-amber-200/70 hover:text-white'
                    }`}
                  >
                    🐉 龙7 记录 ({d7History.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistoryTab('panda8')}
                    className={`px-3 py-1 rounded font-bold cursor-pointer transition-all ${
                      historyTab === 'panda8'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-blue-200/70 hover:text-white'
                    }`}
                  >
                    🐼 熊猫8 记录 ({p8History.length})
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs">
                <span className="font-mono text-amber-200/80">
                  {historyTab === 'dragon7' ? (
                    <>
                      命中: {d7WinCount}/{d7TotalBets} | 净盈亏:{' '}
                      <strong className={d7SessionProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {d7SessionProfit >= 0 ? `+¥${d7SessionProfit}` : `-¥${Math.abs(d7SessionProfit)}`}
                      </strong>
                    </>
                  ) : (
                    <>
                      命中: {p8WinCount}/{p8TotalBets} | 净盈亏:{' '}
                      <strong className={p8SessionProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {p8SessionProfit >= 0 ? `+¥${p8SessionProfit}` : `-¥${Math.abs(p8SessionProfit)}`}
                      </strong>
                    </>
                  )}
                </span>

                <button
                  type="button"
                  onClick={() => setFilterOnlyWins(!filterOnlyWins)}
                  className={`px-2 py-1 rounded text-xs font-bold border transition-colors cursor-pointer ${
                    filterOnlyWins
                      ? 'bg-yellow-500 text-black border-yellow-300'
                      : 'bg-black/60 text-amber-200/70 border-[#b8860b]/30 hover:text-white'
                  }`}
                >
                  {filterOnlyWins ? '✓ 仅看中奖' : '全部'}
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
              {historyTab === 'dragon7' ? (
                d7History.length === 0 ? (
                  <div className="py-12 text-center text-amber-200/50 text-xs font-serif-casino">
                    暂无龙7下注记录。达到阈值 (+4.0) 下注或手动下注后，自动记录于此。
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono border-collapse min-w-[650px]">
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
                  <table className="w-full text-left text-xs font-mono border-collapse min-w-[650px]">
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
                                  🐼 熊猫8命中 (+25倍)
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
          </div>
        </div>
      )}
    </div>
  );
};
