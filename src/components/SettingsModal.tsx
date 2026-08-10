import React, { useState } from 'react';
import { GameSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  settings: GameSettings;
  onClose: () => void;
  onSave: (newSettings: GameSettings) => void;
  onExportSingleFileHTML: () => void;
  onResetSession?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
  onExportSingleFileHTML,
  onResetSession,
}) => {
  const [cutCardDepth, setCutCardDepth] = useState<number>(settings.cutCardDepth);
  const [bChaseBet, setBChaseBet] = useState<number>(settings.bChaseBet);
  const [bPostExhaustionChaseBet, setBPostExhaustionChaseBet] = useState<number>(settings.bPostExhaustionChaseBet);
  const [b1ChaseBet, setB1ChaseBet] = useState<number>(settings.b1ChaseBet ?? 200);
  const [b2ChaseBet, setB2ChaseBet] = useState<number>(settings.b2ChaseBet ?? 200);
  const [cChaseBet, setCChaseBet] = useState<number>(settings.cChaseBet ?? 200);
  const [cPostExhaustionChaseBet, setCPostExhaustionChaseBet] = useState<number>(settings.cPostExhaustionChaseBet ?? 200);
  const [c1ChaseBet, setC1ChaseBet] = useState<number>(settings.c1ChaseBet ?? 200);
  const [c2ChaseBet, setC2ChaseBet] = useState<number>(settings.c2ChaseBet ?? 200);
  const [aDefaultBet, setADefaultBet] = useState<number>(settings.aDefaultBet);
  const [aEnableSideBets, setAEnableSideBets] = useState<boolean>(settings.aEnableSideBets);
  const [prngSeed, setPrngSeed] = useState<string>(settings.prngSeed);

  if (!isOpen) return null;

  const handleRandomizeSeed = () => {
    setPrngSeed(Date.now().toString());
  };

  const handleSave = () => {
    onSave({
      cutCardDepth: Math.max(1, cutCardDepth),
      bChaseBet: Math.max(10, bChaseBet),
      bPostExhaustionChaseBet: Math.max(10, bPostExhaustionChaseBet),
      b1ChaseBet: Math.max(10, b1ChaseBet),
      b1PostExhaustionChaseBet: Math.max(10, b1ChaseBet),
      b2ChaseBet: Math.max(10, b2ChaseBet),
      b2PostExhaustionChaseBet: Math.max(10, b2ChaseBet),
      cChaseBet: Math.max(10, cChaseBet),
      cPostExhaustionChaseBet: Math.max(10, cPostExhaustionChaseBet),
      c1ChaseBet: Math.max(10, c1ChaseBet),
      c1PostExhaustionChaseBet: Math.max(10, c1ChaseBet),
      c2ChaseBet: Math.max(10, c2ChaseBet),
      c2PostExhaustionChaseBet: Math.max(10, c2ChaseBet),
      aDefaultBet: Math.max(1, aDefaultBet),
      aEnableSideBets,
      sideBetAmount: 10,
      prngSeed: prngSeed || Date.now().toString(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#051a0b] border-2 border-[#b8860b] rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scale-up text-amber-100 font-sans">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#b8860b]/30 pb-3">
          <h2 className="text-xl font-serif-casino font-bold text-[#d4af37]">⚙️ 游戏设置 (Game Settings)</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/90 text-amber-300 font-bold flex items-center justify-center border border-[#b8860b]/40"
          >
            ✕
          </button>
        </div>

        {/* Settings Form */}
        <div className="space-y-4 text-xs sm:text-sm max-h-[60vh] overflow-y-auto custom-scrollbar pr-1">
          {/* Cut Card Depth */}
          <div>
            <label className="block text-amber-200 font-bold mb-1">
              切牌深度 (剩余少于此张数时换鞋，默认 26):
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={cutCardDepth}
              onChange={(e) => setCutCardDepth(parseInt(e.target.value, 10) || 26)}
              className="w-full bg-black/70 border border-[#b8860b]/40 rounded-lg p-2.5 text-amber-300 font-mono focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Player B Normal Chase Bet Amount */}
          <div>
            <label className="block text-amber-200 font-bold mb-1">
              玩家B 固定追打金额 (可选 100 ~ 1000 元):
            </label>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBChaseBet(amt)}
                  className={`py-1 rounded border text-xs font-mono font-bold transition-all ${
                    bChaseBet === amt
                      ? 'bg-[#d4af37] text-black border-amber-200 shadow-sm'
                      : 'bg-black/60 text-amber-200 border-[#b8860b]/30 hover:bg-black/90'
                  }`}
                >
                  ¥{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="10"
              step="100"
              value={bChaseBet}
              onChange={(e) => setBChaseBet(parseInt(e.target.value, 10) || 200)}
              className="w-full bg-black/70 border border-[#b8860b]/40 rounded-lg p-2.5 text-amber-300 font-mono focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Player B Post-Exhaustion Chase Bet Amount */}
          <div>
            <label className="block text-amber-200 font-bold mb-1">
              玩家A输光后 玩家B追打金额 (可选 100 ~ 1000 元):
            </label>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setBPostExhaustionChaseBet(amt)}
                  className={`py-1 rounded border text-xs font-mono font-bold transition-all ${
                    bPostExhaustionChaseBet === amt
                      ? 'bg-[#d4af37] text-black border-amber-200 shadow-sm'
                      : 'bg-black/60 text-amber-200 border-[#b8860b]/30 hover:bg-black/90'
                  }`}
                >
                  ¥{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="10"
              step="100"
              value={bPostExhaustionChaseBet}
              onChange={(e) => setBPostExhaustionChaseBet(parseInt(e.target.value, 10) || 200)}
              className="w-full bg-black/70 border border-[#b8860b]/40 rounded-lg p-2.5 text-amber-300 font-mono focus:outline-none focus:border-[#d4af37]"
            />
            <span className="text-[11px] text-amber-200/60 mt-1 block">
              * 当玩家A资金归零后，B触发追打时使用此固定金额 (A连赢3手退出)。
            </span>
          </div>

          {/* Player C Normal Chase Bet Amount */}
          <div>
            <label className="block text-amber-200 font-bold mb-1">
              玩家C 固定追打金额 (连赢2手退出，默认 200 元):
            </label>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCChaseBet(amt)}
                  className={`py-1 rounded border text-xs font-mono font-bold transition-all ${
                    cChaseBet === amt
                      ? 'bg-[#d4af37] text-black border-amber-200 shadow-sm'
                      : 'bg-black/60 text-amber-200 border-[#b8860b]/30 hover:bg-black/90'
                  }`}
                >
                  ¥{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="10"
              step="100"
              value={cChaseBet}
              onChange={(e) => setCChaseBet(parseInt(e.target.value, 10) || 200)}
              className="w-full bg-black/70 border border-[#b8860b]/40 rounded-lg p-2.5 text-amber-300 font-mono focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Player C Post-Exhaustion Chase Bet Amount */}
          <div>
            <label className="block text-amber-200 font-bold mb-1">
              玩家A输光后 玩家C追打金额 (可选 100 ~ 1000 元):
            </label>
            <div className="grid grid-cols-5 gap-1.5 mb-2">
              {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCPostExhaustionChaseBet(amt)}
                  className={`py-1 rounded border text-xs font-mono font-bold transition-all ${
                    cPostExhaustionChaseBet === amt
                      ? 'bg-[#d4af37] text-black border-amber-200 shadow-sm'
                      : 'bg-black/60 text-amber-200 border-[#b8860b]/30 hover:bg-black/90'
                  }`}
                >
                  ¥{amt}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="10"
              step="100"
              value={cPostExhaustionChaseBet}
              onChange={(e) => setCPostExhaustionChaseBet(parseInt(e.target.value, 10) || 200)}
              className="w-full bg-black/70 border border-[#b8860b]/40 rounded-lg p-2.5 text-amber-300 font-mono focus:outline-none focus:border-[#d4af37]"
            />
            <span className="text-[11px] text-amber-200/60 mt-1 block">
              * 当玩家A资金归零后，C触发追打时使用此固定金额 (A连赢2手退出)。
            </span>
          </div>

          {/* Player A Default Flat Bet */}
          <div>
            <label className="block text-amber-200 font-bold mb-1">
              玩家A 默认平注金额 (默认 10元):
            </label>
            <input
              type="number"
              min="1"
              value={aDefaultBet}
              onChange={(e) => setADefaultBet(parseInt(e.target.value, 10) || 10)}
              className="w-full bg-black/70 border border-[#b8860b]/40 rounded-lg p-2.5 text-amber-300 font-mono focus:outline-none focus:border-[#d4af37]"
            />
          </div>

          {/* Enable Side Bets */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/60 border border-[#b8860b]/30">
            <div>
              <span className="block font-bold text-amber-100">开启龙7/猫8旁注 (Side Bets)</span>
              <span className="text-[11px] text-amber-200/60">仅玩家A可购买 (龙7 40:1, 猫8 25:1)</span>
            </div>
            <input
              type="checkbox"
              checked={aEnableSideBets}
              onChange={(e) => setAEnableSideBets(e.target.checked)}
              className="w-5 h-5 accent-[#d4af37] rounded cursor-pointer"
            />
          </div>

          {/* PRNG Seed */}
          <div>
            <label className="block text-amber-200 font-bold mb-1">
              洗牌伪随机数种子 (mulberry32 PRNG Seed):
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={prngSeed}
                onChange={(e) => setPrngSeed(e.target.value)}
                className="flex-1 bg-black/70 border border-[#b8860b]/40 rounded-lg p-2.5 text-amber-300 font-mono text-xs focus:outline-none focus:border-[#d4af37]"
              />
              <button
                type="button"
                onClick={handleRandomizeSeed}
                className="px-3 py-2 bg-black/80 hover:bg-black text-[#d4af37] rounded-lg font-bold border border-[#b8860b]/40"
              >
                🎲 随机种子
              </button>
            </div>
          </div>
        </div>

        {/* Single File Export & Reset Options */}
        <div className="pt-2 border-t border-[#b8860b]/30 flex flex-col space-y-2">
          {onResetSession && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onResetSession();
              }}
              className="w-full py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 text-red-200 font-bold text-xs border border-red-500/40 shadow-md transition-all active:scale-95"
            >
              ⚠️ 一键恢复所有金额与买卖数据为初始状态
            </button>
          )}

          <button
            type="button"
            onClick={onExportSingleFileHTML}
            className="w-full py-2.5 rounded-xl bg-black/80 hover:bg-black text-[#d4af37] font-bold text-xs border border-[#b8860b]/50 shadow-md"
          >
            📄 导出/下载 纯单文件 HTML (Offline HTML File)
          </button>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-black/60 hover:bg-black text-amber-200 font-bold text-sm border border-[#b8860b]/30"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-xl bg-[#b8860b] hover:bg-yellow-500 text-black font-bold text-sm shadow-md"
            >
              保存设置
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
