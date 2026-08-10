import React, { useState } from 'react';

export type RechargePlayer = 'A' | 'B' | 'B-1' | 'B-2' | 'C' | 'C-1' | 'C-2';

interface RechargeModalProps {
  isOpen: boolean;
  targetPlayer: RechargePlayer | null;
  onClose: () => void;
  onConfirmRecharge: (player: RechargePlayer, amount: number) => void;
}

export const RechargeModal: React.FC<RechargeModalProps> = ({
  isOpen,
  targetPlayer,
  onClose,
  onConfirmRecharge,
}) => {
  const [amountInput, setAmountInput] = useState<string>('1000');

  if (!isOpen || !targetPlayer) return null;

  const handleConfirm = () => {
    const amt = parseInt(amountInput, 10);
    if (!isNaN(amt) && amt > 0) {
      onConfirmRecharge(targetPlayer, amt);
      onClose();
    }
  };

  const presetAmounts = [500, 1000, 5000, 10000];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#051a0b] border-2 border-[#b8860b] rounded-2xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-scale-up text-amber-100 font-sans">
        <div className="flex items-center justify-between border-b border-[#b8860b]/30 pb-3">
          <h3 className="text-lg font-serif-casino font-bold text-[#d4af37]">
            💰 资金充值 ({targetPlayer === 'A' ? '玩家A (我)' : targetPlayer === 'B' ? '玩家B' : targetPlayer === 'B-1' ? '玩家B-1 (止盈3注)' : targetPlayer === 'B-2' ? '玩家B-2 (止盈2注)' : targetPlayer === 'C' ? '玩家C' : targetPlayer === 'C-1' ? '玩家C-1 (止盈3注)' : '玩家C-2 (止盈2注)'})
          </h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-black/60 hover:bg-black/90 text-amber-300 font-bold flex items-center justify-center border border-[#b8860b]/40"
          >
            ✕
          </button>
        </div>

        <div>
          <label className="block text-xs text-amber-200/70 mb-2">选择或输入追加资金金额 (元):</label>
          <div className="flex space-x-2 mb-3">
            {presetAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmountInput(amt.toString())}
                className={`flex-1 py-1.5 rounded border text-xs font-mono font-bold ${
                  amountInput === amt.toString()
                    ? 'bg-[#d4af37] text-black border-yellow-200'
                    : 'bg-black/60 text-amber-200 border-[#b8860b]/30'
                }`}
              >
                +¥{amt}
              </button>
            ))}
          </div>

          <input
            type="number"
            min="100"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            className="w-full bg-black/70 border border-[#b8860b]/40 rounded-xl p-3 text-amber-300 font-mono text-center text-lg font-bold focus:outline-none focus:border-[#d4af37]"
          />
        </div>

        <div className="flex space-x-3 pt-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-black/60 hover:bg-black text-amber-200 font-bold text-sm border border-[#b8860b]/30"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-sm shadow-md border border-emerald-500/40"
          >
            确认充值
          </button>
        </div>
      </div>
    </div>
  );
};
