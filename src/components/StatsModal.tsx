import React from 'react';
import { X, Trophy, Target, Flame, RotateCcw } from 'lucide-react';
import { GameStats } from '../types.ts';
import { LEVELS } from '../game/constants.ts';

interface StatsModalProps {
  stats: GameStats;
  onClose: () => void;
  onResetAllStats: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({
  stats,
  onClose,
  onResetAllStats,
}) => {
  const accuracy =
    stats.totalThrows > 0
      ? Math.round((stats.basketsMade / stats.totalThrows) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-400" size={20} />
            <h2 className="text-lg font-bold text-white font-display">Toss Records & Stats</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Overview Stat Grid */}
        <div className="overflow-y-auto py-4 space-y-4 pr-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-2xl">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Flame size={13} className="text-amber-400" /> Best Streak
              </div>
              <div className="text-2xl font-bold font-mono-numbers text-amber-400 mt-1">
                {stats.overallBestStreak}
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-2xl">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Target size={13} className="text-emerald-400" /> Accuracy
              </div>
              <div className="text-2xl font-bold font-mono-numbers text-emerald-400 mt-1">
                {accuracy}%
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-2xl">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Total Throws
              </div>
              <div className="text-xl font-bold font-mono-numbers text-white mt-1">
                {stats.totalThrows}
              </div>
            </div>

            <div className="p-3.5 bg-slate-800/40 border border-slate-700/40 rounded-2xl">
              <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
                Clean Swishes
              </div>
              <div className="text-xl font-bold font-mono-numbers text-sky-400 mt-1">
                {stats.swishes}
              </div>
            </div>
          </div>

          {/* Blitz High Score */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">
                60s Blitz High Score
              </div>
              <div className="text-[11px] text-slate-400">
                Most points scored in one minute
              </div>
            </div>
            <div className="text-2xl font-bold font-mono-numbers text-emerald-400">
              {stats.blitzHighScore}
            </div>
          </div>

          {/* Streaks by Level */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Personal Best by Location
            </h3>
            <div className="space-y-1.5 bg-slate-800/25 border border-slate-800 rounded-2xl p-2.5">
              {LEVELS.map((lvl) => (
                <div
                  key={lvl.id}
                  className="flex items-center justify-between py-1.5 px-2 rounded-xl text-xs hover:bg-slate-800/50"
                >
                  <span className="text-slate-300 font-medium">{lvl.name}</span>
                  <span className="font-bold font-mono-numbers text-amber-400">
                    {stats.bestStreaks[lvl.id] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reset All Data Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                if (window.confirm('Reset all lifetime throws, streaks, and records?')) {
                  onResetAllStats();
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-colors"
            >
              <RotateCcw size={14} />
              Reset All Lifetime Stats
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
