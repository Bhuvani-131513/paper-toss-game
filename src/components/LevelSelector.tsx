import React from 'react';
import { X, MapPin, Wind, Ruler } from 'lucide-react';
import { LevelConfig } from '../types.ts';
import { LEVELS } from '../game/constants.ts';

interface LevelSelectorProps {
  currentLevel: LevelConfig;
  onSelectLevel: (lvl: LevelConfig) => void;
  onClose: () => void;
  bestStreaks: Record<string, number>;
}

export const LevelSelector: React.FC<LevelSelectorProps> = ({
  currentLevel,
  onSelectLevel,
  onClose,
  bestStreaks,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MapPin className="text-sky-400" size={20} />
            <h2 className="text-lg font-bold text-white font-display">Select Location</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Level List */}
        <div className="overflow-y-auto py-4 space-y-3 pr-1">
          {LEVELS.map((lvl) => {
            const isSelected = lvl.id === currentLevel.id;
            const best = bestStreaks[lvl.id] || 0;

            return (
              <button
                key={lvl.id}
                onClick={() => {
                  onSelectLevel(lvl);
                  onClose();
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2 relative overflow-hidden group ${
                  isSelected
                    ? 'bg-sky-500/10 border-sky-500/50 shadow-[0_0_20px_rgba(14,165,233,0.15)]'
                    : 'bg-slate-800/50 border-slate-700/40 hover:bg-slate-800/80 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-base font-bold ${isSelected ? 'text-sky-400' : 'text-white'}`}>
                    {lvl.name}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <span>Best:</span>
                    <span className="font-mono-numbers">{best}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {lvl.subtitle}
                </p>

                <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-1">
                  <div className="flex items-center gap-1">
                    <Ruler size={13} className="text-slate-500" />
                    <span>Dist: {lvl.targetZ}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Wind size={13} className="text-slate-500" />
                    <span>Wind: {lvl.minWind}-{lvl.maxWind} MPH</span>
                  </div>
                  <div className="capitalize text-slate-400 font-medium">
                    {lvl.binType} Can
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
