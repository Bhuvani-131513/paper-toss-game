import React from 'react';
import { X, Sparkles, Lock, Check } from 'lucide-react';
import { PaperSkin } from '../types.ts';
import { PAPER_SKINS } from '../game/constants.ts';

interface BallSelectorProps {
  currentSkin: PaperSkin;
  onSelectSkin: (skin: PaperSkin) => void;
  onClose: () => void;
  highestStreakEver: number;
}

export const BallSelector: React.FC<BallSelectorProps> = ({
  currentSkin,
  onSelectSkin,
  onClose,
  highestStreakEver,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-400" size={20} />
            <h2 className="text-lg font-bold text-white font-display">Toss Papers</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Paper Skins Grid */}
        <div className="overflow-y-auto py-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pr-1">
          {PAPER_SKINS.map((skin) => {
            const isUnlocked =
              skin.unlockedByDefault || highestStreakEver >= skin.unlockStreakRequirement;
            const isSelected = skin.id === currentSkin.id;

            return (
              <button
                key={skin.id}
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    onSelectSkin(skin);
                    onClose();
                  }
                }}
                className={`text-left p-3.5 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden group ${
                  isSelected
                    ? 'bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
                    : isUnlocked
                    ? 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/70 hover:border-slate-600'
                    : 'bg-slate-900/40 border-slate-800/40 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between w-full mb-2">
                  {/* Paper Sphere Preview Mini Icon */}
                  <div
                    className="w-10 h-10 rounded-full border border-white/20 shadow-md flex items-center justify-center relative overflow-hidden"
                    style={{
                      backgroundColor: skin.secondaryColor,
                      backgroundImage: `radial-gradient(circle at 35% 35%, ${skin.primaryColor} 0%, ${skin.secondaryColor} 70%, ${skin.wrinkleColor} 100%)`,
                    }}
                  >
                    {skin.type === 'dollar' && (
                      <span className="text-green-900 font-bold text-xs">$</span>
                    )}
                  </div>

                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center">
                      <Check size={14} strokeWidth={3} />
                    </div>
                  ) : !isUnlocked ? (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                      <Lock size={11} />
                      <span>{skin.unlockStreakRequirement} Streak</span>
                    </div>
                  ) : null}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{skin.name}</h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{skin.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
