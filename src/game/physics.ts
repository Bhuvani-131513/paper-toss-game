import { LevelConfig } from '../types.ts';

export interface BallState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rot: number;
  vRot: number;
  radius: number;
  isThrown: boolean;
  isSettled: boolean;
  isInBin: boolean;
  isBouncingRim: boolean;
  settleResult: 'swish' | 'rim' | 'miss' | null;
  rimBounceCount: number;
}

export interface BinState {
  x: number;
  y: number;
  width: number;
  height: number;
  rimHeight: number;
  rimY: number;
}

export function createInitialBall(canvasWidth: number, canvasHeight: number): BallState {
  return {
    x: canvasWidth / 2,
    y: canvasHeight - 110,
    z: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    rot: 0,
    vRot: 0,
    radius: 28,
    isThrown: false,
    isSettled: false,
    isInBin: false,
    isBouncingRim: false,
    settleResult: null,
    rimBounceCount: 0,
  };
}

export function calculateBinGeometry(
  canvasWidth: number,
  canvasHeight: number,
  level: LevelConfig
): BinState {
  const baseWidth = 84 * level.binScale;
  const baseHeight = 104 * level.binScale;
  const rimHeight = 22 * level.binScale;
  
  // Bin sits naturally on the floor
  const floorY = canvasHeight * level.floorLineYRatio;
  // Bin center Y
  const y = floorY - baseHeight * 0.42;
  const x = canvasWidth / 2;
  const rimY = y - baseHeight / 2 + rimHeight / 2;

  return {
    x,
    y,
    width: baseWidth,
    height: baseHeight,
    rimHeight,
    rimY,
  };
}

export function projectScale(z: number): number {
  const d0 = 65;
  return Math.max(0.25, d0 / (d0 + z));
}

// Simulates a single frame of physics
export function updateBallPhysics(
  ball: BallState,
  bin: BinState,
  windSpeed: number,
  level: LevelConfig,
  canvasHeight: number,
  dt = 0.016
): { landed: boolean; result?: 'swish' | 'rim' | 'miss' } {
  if (!ball.isThrown || ball.isSettled) {
    return { landed: false };
  }

  // Spin ball
  ball.rot += ball.vRot * dt;

  if (ball.isInBin) {
    // Ball settling inside the bin
    ball.y += ball.vy * dt;
    ball.vy += 450 * dt;
    // Bottom of bin constraint
    const binBottomY = bin.y + bin.height * 0.4;
    if (ball.y > binBottomY) {
      ball.y = binBottomY;
      ball.vy = -ball.vy * 0.25;
      if (Math.abs(ball.vy) < 15) {
        ball.vy = 0;
        ball.isSettled = true;
      }
    }
    return { landed: false };
  }

  if (ball.isBouncingRim) {
    // Ball bouncing away from rim after hitting metal
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.z += ball.vz * dt;
    ball.vy += 650 * dt; // Gravity

    const floorY = canvasHeight * level.floorLineYRatio + 40;
    if (ball.y >= floorY) {
      ball.y = floorY;
      ball.vy = -ball.vy * 0.3;
      ball.vx *= 0.5;
      ball.vz *= 0.5;
      if (Math.abs(ball.vy) < 25) {
        ball.isSettled = true;
      }
    }
    return { landed: false };
  }

  // Active in-flight motion
  ball.z += ball.vz * dt;

  // Wind accelerates sideways motion with gentle turbulence
  const windEffect = windSpeed * 22 * (1 + (ball.z / level.targetZ) * 0.8);
  ball.vx += (windEffect - ball.vx * 0.3) * dt;

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;
  
  // Gravity arc
  ball.vy += 420 * dt;

  // Check if ball reached target distance plane
  if (ball.z >= level.targetZ) {
    // Evaluate basket collision
    const rimRadiusX = (bin.width / 2) * 0.95;
    const rimRadiusY = (bin.rimHeight / 2) * 1.05;
    const dx = ball.x - bin.x;
    const dy = ball.y - bin.rimY;

    const normDist = Math.sqrt(
      Math.pow(dx / rimRadiusX, 2) + Math.pow(dy / rimRadiusY, 2)
    );

    if (normDist <= 0.62) {
      // CLEAN SWISH!
      ball.isInBin = true;
      ball.vx = 0;
      ball.vz = 0;
      ball.vy = Math.abs(ball.vy) * 0.4 + 50;
      ball.settleResult = 'swish';
      return { landed: true, result: 'swish' };
    } else if (normDist <= 1.25) {
      // RIM BOUNCE!
      ball.isBouncingRim = true;
      ball.settleResult = 'rim';
      ball.rimBounceCount++;

      // Compute bounce normal vector
      const nx = dx / rimRadiusX;
      const ny = dy / rimRadiusY;
      const len = Math.hypot(nx, ny) || 1;
      const dirX = nx / len;
      const dirY = ny / len;

      ball.vx = dirX * 180 + (Math.random() - 0.5) * 50;
      ball.vy = -Math.abs(dirY * 160) - 80;
      ball.vz = -20;
      ball.vRot = (Math.random() - 0.5) * 15;

      return { landed: true, result: 'rim' };
    } else {
      // COMPLETE MISS!
      ball.settleResult = 'miss';
      ball.isBouncingRim = true;
      ball.vRot = (Math.random() - 0.5) * 8;
      return { landed: true, result: 'miss' };
    }
  }

  return { landed: false };
}
