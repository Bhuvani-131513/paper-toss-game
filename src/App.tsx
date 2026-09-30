import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GameCanvas } from './components/GameCanvas.tsx';
import { HUD } from './components/HUD.tsx';
import { LevelSelector } from './components/LevelSelector.tsx';
import { BallSelector } from './components/BallSelector.tsx';
import { StatsModal } from './components/StatsModal.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { GameMode, GameStats, LevelConfig, PaperSkin } from './types.ts';
import { LEVELS, PAPER_SKINS } from './game/constants.ts';
import { soundEngine } from './audio/soundEngine.ts';
import { RotateCcw } from 'lucide-react';

const STATS_STORAGE_KEY = 'paper_toss_stats_v2';

export default function App() {
  // Game Setup State
  const [level, setLevel] = useState<LevelConfig>(LEVELS[0]);
  const [skin, setSkin] = useState<PaperSkin>(PAPER_SKINS[0]);
  const [mode, setMode] = useState<GameMode>('classic');

  // Gameplay Scoring State
  const [streak, setStreak] = useState<number>(0);
  const [windSpeed, setWindSpeed] = useState<number>(3);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'swish' | 'rim' | 'miss' | null>(null);
  const [hasThrownOnce, setHasThrownOnce] = useState<boolean>(false);

  // Blitz Mode State
  const [blitzScore, setBlitzScore] = useState<number>(0);
  const [blitzTimeLeft, setBlitzTimeLeft] = useState<number>(60);
  const [isBlitzActive, setIsBlitzActive] = useState<boolean>(false);
  const [blitzGameOver, setBlitzGameOver] = useState<boolean>(false);
  const blitzTimerRef = useRef<number | null>(null);

  // Settings & Audio State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [fanAudioEnabled, setFanAudioEnabled] = useState<boolean>(true);
  const [showTrajectoryGuide, setShowTrajectoryGuide] = useState<boolean>(false);
  const [sensitivity, setSensitivity] = useState<number>(1.0);

  // Modals
  const [isLevelSelectorOpen, setIsLevelSelectorOpen] = useState<boolean>(false);
  const [isSkinSelectorOpen, setIsSkinSelectorOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Lifetime Stats
  const [stats, setStats] = useState<GameStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return {
      totalThrows: 0,
      basketsMade: 0,
      swishes: 0,
      rimHits: 0,
      bestStreaks: {
        cubicle: 0,
        breakroom: 0,
        warehouse: 0,
        airport: 0,
        executive: 0,
      },
      overallBestStreak: 0,
      blitzHighScore: 0,
    };
  });

  // Save Stats
  const saveStats = useCallback((newStats: GameStats) => {
    setStats(newStats);
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
    } catch {
      // Safe catch
    }
  }, []);

  // Update Best Streak for current level
  const currentBestStreak = stats.bestStreaks[level.id] || 0;

  // Blitz countdown timer
  useEffect(() => {
    if (mode === 'blitz' && isBlitzActive && blitzTimeLeft > 0) {
      blitzTimerRef.current = window.setInterval(() => {
        setBlitzTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(blitzTimerRef.current!);
            setIsBlitzActive(false);
            setBlitzGameOver(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (blitzTimerRef.current) clearInterval(blitzTimerRef.current);
    }

    return () => {
      if (blitzTimerRef.current) clearInterval(blitzTimerRef.current);
    };
  }, [mode, isBlitzActive, blitzTimeLeft]);

  // Mode change
  const handleModeChange = (newMode: GameMode) => {
    setMode(newMode);
    setStreak(0);
    if (newMode === 'blitz') {
      setBlitzScore(0);
      setBlitzTimeLeft(60);
      setIsBlitzActive(true);
      setBlitzGameOver(false);
    } else {
      setIsBlitzActive(false);
      setBlitzGameOver(false);
    }
  };

  const startNewBlitz = () => {
    setBlitzScore(0);
    setBlitzTimeLeft(60);
    setIsBlitzActive(true);
    setBlitzGameOver(false);
    setStreak(0);
  };

  // Score Callback from GameCanvas
  const handleScore = useCallback(
    (type: 'swish' | 'rim' | 'miss') => {
      setHasThrownOnce(true);
      setStatusType(type);

      setStats((prev) => {
        const isSwish = type === 'swish';
        const isRim = type === 'rim';
        const newTotal = prev.totalThrows + 1;
        const newMade = prev.basketsMade + (isSwish ? 1 : 0);
        const newSwishes = prev.swishes + (isSwish ? 1 : 0);
        const newRims = prev.rimHits + (isRim ? 1 : 0);

        let newStreak = 0;
        let newScore = blitzScore;

        if (isSwish) {
          newStreak = streak + 1;
          setStreak(newStreak);

          // Milestone fanfare every 5 streak
          if (newStreak % 5 === 0) {
            soundEngine.playMilestoneChime();
          }

          if (mode === 'blitz' && isBlitzActive) {
            const multiplier = Math.min(4, Math.floor(newStreak / 2) + 1);
            newScore = blitzScore + 10 * multiplier;
            setBlitzScore(newScore);
          }
        } else {
          setStreak(0);
        }

        const currentLevelBest = Math.max(prev.bestStreaks[level.id] || 0, newStreak);
        const newBestStreaks = {
          ...prev.bestStreaks,
          [level.id]: currentLevelBest,
        };
        const newOverallBest = Math.max(prev.overallBestStreak, newStreak);
        const newBlitzBest = Math.max(prev.blitzHighScore, newScore);

        const updated: GameStats = {
          totalThrows: newTotal,
          basketsMade: newMade,
          swishes: newSwishes,
          rimHits: newRims,
          bestStreaks: newBestStreaks,
          overallBestStreak: newOverallBest,
          blitzHighScore: newBlitzBest,
        };

        try {
          localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(updated));
        } catch {
          // Ignore
        }

        return updated;
      });

      if (type === 'swish') {
        setStatusText('SWISH! +1');
      } else if (type === 'rim') {
        setStatusText('RIM BOUNCE!');
      } else {
        setStatusText('MISS!');
      }

      window.setTimeout(() => {
        setStatusText(null);
        setStatusType(null);
      }, 1000);
    },
    [streak, level.id, mode, isBlitzActive, blitzScore]
  );

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.setSfxEnabled(next);
  };

  const handleToggleFanAudio = () => {
    const next = !fanAudioEnabled;
    setFanAudioEnabled(next);
    soundEngine.setFanEnabled(next);
  };

  const handleResetStreak = () => {
    setStreak(0);
    if (mode === 'blitz') {
      startNewBlitz();
    }
  };

  const handleResetAllStats = () => {
    const fresh: GameStats = {
      totalThrows: 0,
      basketsMade: 0,
      swishes: 0,
      rimHits: 0,
      bestStreaks: {
        cubicle: 0,
        breakroom: 0,
        warehouse: 0,
        airport: 0,
        executive: 0,
      },
      overallBestStreak: 0,
      blitzHighScore: 0,
    };
    saveStats(fresh);
    setStreak(0);
    setIsStatsOpen(false);
  };

  return (
    <div className="w-screen h-screen bg-slate-950 flex items-center justify-center overflow-hidden font-sans select-none">
      {/* Ambient background glow & office subtle gradient */}
      <div className="absolute inset-0 bg-radial from-slate-900 via-slate-950 to-black opacity-80 pointer-events-none" />

      {/* Main Arcade Frame Container */}
      <main className="relative w-full h-full max-w-[480px] max-h-[880px] sm:rounded-3xl shadow-2xl border border-slate-800/80 overflow-hidden flex flex-col bg-slate-900">
        {/* Heads Up Display */}
        <HUD
          level={level}
          skin={skin}
          mode={mode}
          streak={streak}
          bestStreak={currentBestStreak}
          windSpeed={windSpeed}
          statusText={statusText}
          statusType={statusType}
          hasThrownOnce={hasThrownOnce}
          soundEnabled={soundEnabled}
          blitzTimeLeft={blitzTimeLeft}
          blitzScore={blitzScore}
          onToggleSound={handleToggleSound}
          onOpenLevelSelector={() => setIsLevelSelectorOpen(true)}
          onOpenSkinSelector={() => setIsSkinSelectorOpen(true)}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onResetStreak={handleResetStreak}
          onChangeMode={handleModeChange}
        />

        {/* 3D Canvas Game Engine */}
        <GameCanvas
          level={level}
          skin={skin}
          windSpeed={windSpeed}
          onWindChange={setWindSpeed}
          onScore={handleScore}
          showTrajectoryGuide={showTrajectoryGuide}
          sensitivity={sensitivity}
          isPaused={isLevelSelectorOpen || isSkinSelectorOpen || isStatsOpen || isSettingsOpen}
        />

        {/* Blitz Game Over Overlay */}
        {blitzGameOver && (
          <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
            <div className="w-full max-w-sm bg-slate-900 border border-slate-700/60 rounded-3xl p-6 text-center shadow-2xl space-y-4">
              <div className="text-3xl font-black text-amber-400 font-display">
                TIME UP!
              </div>
              <p className="text-xs text-slate-400">
                Blitz session complete. Here is your final score:
              </p>

              <div className="py-4 bg-slate-800/40 border border-slate-700/40 rounded-2xl">
                <div className="text-[11px] uppercase tracking-wider text-slate-400">
                  Final Score
                </div>
                <div className="text-4xl font-extrabold font-mono-numbers text-emerald-400 mt-1">
                  {blitzScore}
                </div>
                {blitzScore >= stats.blitzHighScore && blitzScore > 0 && (
                  <div className="text-xs font-semibold text-amber-300 mt-1">
                    🏆 NEW PERSONAL BEST!
                  </div>
                )}
              </div>

              <button
                onClick={startNewBlitz}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-98"
              >
                <RotateCcw size={16} /> Play Blitz Again
              </button>

              <button
                onClick={() => handleModeChange('classic')}
                className="w-full py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
              >
                Back to Classic Streak
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {isLevelSelectorOpen && (
        <LevelSelector
          currentLevel={level}
          onSelectLevel={setLevel}
          onClose={() => setIsLevelSelectorOpen(false)}
          bestStreaks={stats.bestStreaks}
        />
      )}

      {isSkinSelectorOpen && (
        <BallSelector
          currentSkin={skin}
          onSelectSkin={setSkin}
          onClose={() => setIsSkinSelectorOpen(false)}
          highestStreakEver={stats.overallBestStreak}
        />
      )}

      {isStatsOpen && (
        <StatsModal
          stats={stats}
          onClose={() => setIsStatsOpen(false)}
          onResetAllStats={handleResetAllStats}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          fanAudioEnabled={fanAudioEnabled}
          onToggleFanAudio={handleToggleFanAudio}
          showTrajectoryGuide={showTrajectoryGuide}
          onToggleTrajectoryGuide={() => setShowTrajectoryGuide((v) => !v)}
          sensitivity={sensitivity}
          onChangeSensitivity={setSensitivity}
        />
      )}
    </div>
  );
}
