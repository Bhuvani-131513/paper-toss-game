export type GameMode = 'classic' | 'blitz' | 'practice';

export interface LevelConfig {
  id: string;
  name: string;
  subtitle: string;
  targetZ: number; // Base depth distance to bin (e.g. 100 is medium, 80 close, 140 far)
  binScale: number; // Scale multiplier for bin width/height
  minWind: number; // Min wind MPH
  maxWind: number; // Max wind MPH
  wallColorTop: string;
  wallColorBottom: string;
  floorColorTop: string;
  floorColorBottom: string;
  floorLineYRatio: number; // Horizon position (e.g. 0.65)
  binType: 'mesh' | 'recycling' | 'metal' | 'wood' | 'plastic';
  fanType: 'desk' | 'floor' | 'industrial' | 'retro';
  ambientDwellText: string;
}

export interface PaperSkin {
  id: string;
  name: string;
  description: string;
  type: 'classic' | 'sticky' | 'dollar' | 'foil' | 'crimson' | 'can';
  primaryColor: string;
  secondaryColor: string;
  wrinkleColor: string;
  metallic?: boolean;
  glow?: boolean;
  unlockedByDefault: boolean;
  unlockStreakRequirement: number;
}

export interface GameStats {
  totalThrows: number;
  basketsMade: number;
  swishes: number;
  rimHits: number;
  bestStreaks: Record<string, number>; // levelId -> streak
  overallBestStreak: number;
  blitzHighScore: number;
}

export interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
}

export interface WindParticle {
  x: number;
  y: number;
  size: number;
  speed: number;
  alpha: number;
  angle: number;
  wobble: number;
}
