import React from 'react';
import { ArrowLeft, ArrowRight, Volume2, VolumeX, Sparkles, MapPin, Trophy, Settings, RotateCcw, Timer } from 'lucide-react';
import { GameMode, LevelConfig, PaperSkin } from '../types.ts';

interface HUDProps {
  level: LevelConfig;
  skin: PaperSkin;
  mode: GameMode;
  streak: number;
  bestStreak: number;
  windSpeed: number;
  statusText: string | null;
  statusType: 'swish' | 'rim' | 'miss' | null;
  hasThrownOnce: boolean;
  soundEnabled: boolean;
  blitzTimeLeft: number;
  blitzScore: number;
  onToggleSound: () => void;
  onOpenLevelSelector: () => void;
  onOpenSkinSelector: () => void;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  onResetStreak: () => void;
  onChangeMode: (mode: GameMode) => void;
}

export const HUD: React.FC<HUDProps> = ({
  level,
  skin,
  mode,
  streak,
  bestStreak,
  windSpeed,
  statusText,
  statusType,
  hasThrownOnce,
  soundEnabled,
  blitzTimeLeft,
  blitzScore,
  onToggleSound,
  onOpenLevelSelector,
  onOpenSkinSelector,
  onOpenStats,
  onOpenSettings,
  onResetStreak,
  onChangeMode,
}) => {
  const isLeft = windSpeed < 0;
  const absWind = Math.abs(windSpeed);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
      {/* Top Bar Stats */}
      <div className="flex items-center justify-between gap-3">
        {/* Streak or Blitz Score */}
        <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-3">
          {mode === 'blitz' ? (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Score</div>
              <div className="text-2xl font-bold font-mono-numbers text-emerald-400 leading-none">
                {blitzScore}
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Streak</div>
              <div className="flex items-center gap-1.5">
                <span className="text-2xl font-bold font-mono-numbers text-emerald-400 leading-none">
                  {streak}
                </span>
                {streak >= 5 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                    🔥 HOT
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center Wind Gauge */}
        <div className="pointer-events-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl px-4 py-2 shadow-lg flex items-center gap-2.5">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
              absWind > 8
                ? 'bg-rose-500/20 text-rose-400'
                : absWind > 4
                ? 'bg-amber-500/20 text-amber-400'
                : 'bg-sky-500/20 text-sky-400'
            }`}
          >
            {isLeft ? <ArrowLeft size={16} strokeWidth={2.5} /> : <ArrowRight size={16} strokeWidth={2.5} />}
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
              {isLeft ? 'Wind Left' : 'Wind Right'}
            </div>
            <div className="text-base font-bold font-mono-numbers text-white leading-tight">
              {absWind} <span className="text-xs font-normal text-slate-400">MPH</span>
            </div>
          </div>
        </div>

        {/* Best / Timer Box */}
        <div className="pointer-events-auto bg-slate-900/80 backdrop-blur-md border border-slate-700/50 rounded-2xl px-4 py-2.5 shadow-lg flex items-center gap-3 text-right">
          {mode === 'blitz' ? (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400 flex items-center justify-end gap-1">
                <Timer size={12} /> Time
              </div>
              <div className={`text-2xl font-bold font-mono-numbers leading-none ${blitzTimeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-amber-400'}`}>
                {blitzTimeLeft}s
              </div>
            </div>
          ) : (
            <div>
              <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Best</div>
              <div className="text-2xl font-bold font-mono-numbers text-amber-400 leading-none">
                {bestStreak}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mode & Level Sub-Bar */}
      <div className="flex items-center justify-between mt-2">
        <button
          onClick={onOpenLevelSelector}
          className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/70 hover:bg-slate-800 text-xs font-medium text-slate-300 border border-slate-700/40 backdrop-blur-sm transition-all hover:scale-102 active:scale-98"
          title="Change Office Location"
        >
          <MapPin size={13} className="text-sky-400" />
          <span className="font-semibold text-white">{level.name}</span>
          <span className="text-slate-500">·</span>
          <span className="text-slate-400 text-[11px]">Z:{level.targetZ}</span>
        </button>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-xl border border-slate-700/50 backdrop-blur-sm">
            <button
              onClick={() => onChangeMode('classic')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                mode === 'classic'
                  ? 'bg-slate-700 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Classic
            </button>
            <button
              onClick={() => onChangeMode('blitz')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                mode === 'blitz'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              60s Blitz
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onToggleSound}
            className="w-8 h-8 rounded-xl bg-slate-900/70 hover:bg-slate-800 text-slate-300 border border-slate-700/40 flex items-center justify-center transition-all active:scale-95"
            title={soundEnabled ? 'Mute Audio' : 'Unmute Audio'}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} className="text-rose-400" />}
          </button>
        </div>
      </div>

      {/* Floating Center Status Banner (Popups on Swish/Rim/Miss) */}
      <div className="flex-1 flex items-center justify-center pointer-events-none">
        {statusText && (
          <div
            className={`transform transition-all duration-300 text-center animate-bounce ${
              statusType === 'swish'
                ? 'text-emerald-400 drop-shadow-[0_4px_16px_rgba(34,197,94,0.6)]'
                : statusType === 'rim'
                ? 'text-amber-300 drop-shadow-[0_4px_16px_rgba(245,158,11,0.6)]'
                : 'text-rose-400 drop-shadow-[0_4px_16px_rgba(244,63,94,0.6)]'
            }`}
          >
            <div className="text-4xl md:text-5xl font-black font-display tracking-tight uppercase">
              {statusText}
            </div>
            {statusType === 'swish' && streak > 1 && (
              <div className="text-sm font-bold tracking-widest text-emerald-300 mt-1 uppercase">
                {streak} In a row!
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="flex flex-col items-center gap-3">
        {/* Swipe instructions (visible before first throw) */}
        {!hasThrownOnce && (
          <div className="text-xs font-semibold text-slate-300 bg-slate-950/70 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700/40 animate-pulse text-center">
            👆 Flick / Swipe UP swiftly to toss paper
          </div>
        )}

        <div className="w-full flex items-center justify-between gap-2 pointer-events-auto">
          {/* Paper Skin Selector */}
          <button
            onClick={onOpenSkinSelector}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700/50 backdrop-blur-md transition-all active:scale-95 shadow-md"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span className="hidden sm:inline">Skin:</span>
            <span className="font-semibold text-white">{skin.name}</span>
          </button>

          <div className="flex items-center gap-2">
            {/* Stats Trigger */}
            <button
              onClick={onOpenStats}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50 backdrop-blur-md transition-all active:scale-95 shadow-md"
              title="View Statistics & Trophies"
            >
              <Trophy size={16} />
            </button>

            {/* Reset Streak */}
            <button
              onClick={onResetStreak}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50 backdrop-blur-md transition-all active:scale-95 shadow-md"
              title="Reset Current Streak"
            >
              <RotateCcw size={16} />
            </button>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700/50 backdrop-blur-md transition-all active:scale-95 shadow-md"
              title="Settings & Audio"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
