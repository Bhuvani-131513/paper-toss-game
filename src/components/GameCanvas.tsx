import React, { useRef, useEffect, useCallback } from 'react';
import { LevelConfig, PaperSkin, Particle, WindParticle } from '../types.ts';
import {
  BallState,
  createInitialBall,
  calculateBinGeometry,
  updateBallPhysics,
} from '../game/physics.ts';
import {
  drawBackground,
  drawFan,
  drawBinBack,
  drawBall,
  drawBinFront,
  drawParticles,
} from '../game/renderers.ts';
import { soundEngine } from '../audio/soundEngine.ts';

interface GameCanvasProps {
  level: LevelConfig;
  skin: PaperSkin;
  windSpeed: number;
  onWindChange: (newWind: number) => void;
  onScore: (type: 'swish' | 'rim' | 'miss') => void;
  showTrajectoryGuide: boolean;
  sensitivity: number; // 0.8 to 1.5
  isPaused: boolean;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  skin,
  windSpeed,
  onWindChange,
  onScore,
  showTrajectoryGuide,
  sensitivity,
  isPaused,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Mutable Game States for high-performance 60fps loop
  const ballRef = useRef<BallState>(createInitialBall(400, 700));
  const particlesRef = useRef<Particle[]>([]);
  const windParticlesRef = useRef<WindParticle[]>([]);
  const dragStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const currentDragPosRef = useRef<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const lastTimeRef = useRef<number>(performance.now());
  const resetTimerRef = useRef<number | null>(null);

  // Initialize wind particles
  const initWindParticles = useCallback((w: number, h: number) => {
    const list: WindParticle[] = [];
    for (let i = 0; i < 18; i++) {
      list.push({
        x: Math.random() * w,
        y: Math.random() * (h * 0.7),
        size: Math.random() * 4 + 2,
        speed: Math.random() * 1.5 + 0.8,
        alpha: Math.random() * 0.25 + 0.08,
        angle: Math.random() * Math.PI * 2,
        wobble: Math.random() * 10,
      });
    }
    windParticlesRef.current = list;
  }, []);

  // Spawn confetti particles on swish
  const spawnConfetti = (bx: number, by: number) => {
    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#a855f7', '#ffffff', '#eab308'];
    const count = 38;
    const newParticles: Particle[] = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 1.1) + Math.random() * (Math.PI * 0.8); // Fan upward
      const speed = Math.random() * 320 + 140;
      newParticles.push({
        x: bx + (Math.random() - 0.5) * 20,
        y: by - 10,
        z: level.targetZ,
        vx: Math.cos(angle) * speed + (windSpeed * 15),
        vy: Math.sin(angle) * speed,
        vz: (Math.random() - 0.5) * 20,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 18,
        life: 0,
        maxLife: Math.random() * 0.6 + 0.7,
      });
    }
    particlesRef.current.push(...newParticles);
  };

  // Spawn metallic rim sparks on rim bounce
  const spawnRimSparks = (bx: number, by: number) => {
    const count = 12;
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 120 + 40;
      newParticles.push({
        x: bx,
        y: by,
        z: level.targetZ,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        vz: 0,
        size: Math.random() * 3 + 2,
        color: '#fef08a',
        alpha: 0.9,
        rotation: 0,
        vRot: 0,
        life: 0,
        maxLife: 0.35,
      });
    }
    particlesRef.current.push(...newParticles);
  };

  // Generate a new realistic wind speed for current level
  const randomizeWind = useCallback(() => {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const speed =
      Math.floor(Math.random() * (level.maxWind - level.minWind + 1)) + level.minWind;
    onWindChange(dir * speed);
  }, [level, onWindChange]);

  // Reset ball position
  const resetBall = useCallback(() => {
    if (!canvasRef.current) return;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    ballRef.current = createInitialBall(w, h);
    isDraggingRef.current = false;
    dragStartRef.current = null;
    currentDragPosRef.current = null;
  }, []);

  // Update canvas size
  const handleResize = useCallback(() => {
    if (!canvasRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const rect = container.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }

    if (windParticlesRef.current.length === 0) {
      initWindParticles(rect.width, rect.height);
    }

    if (!ballRef.current.isThrown) {
      ballRef.current.x = rect.width / 2;
      ballRef.current.y = rect.height - 110;
    }
  }, [initWindParticles]);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // Level change: reset ball and randomize wind
  useEffect(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    resetBall();
    randomizeWind();
  }, [level, resetBall, randomizeWind]);

  // Input Handling
  const getCanvasCoords = (e: React.MouseEvent | React.TouchEvent | TouchEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isPaused || ballRef.current.isThrown) return;
    soundEngine.enableAudioOnFirstGesture();

    const pos = getCanvasCoords(e);
    const ball = ballRef.current;

    // Check click near ball or in the lower half of screen
    const dx = pos.x - ball.x;
    const dy = pos.y - ball.y;
    const dist = Math.hypot(dx, dy);

    if (dist < ball.radius * 2.8 || pos.y > (containerRef.current?.clientHeight || 600) * 0.65) {
      isDraggingRef.current = true;
      dragStartRef.current = { x: pos.x, y: pos.y, time: performance.now() };
      currentDragPosRef.current = { x: pos.x, y: pos.y };
    }
  };

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current || ballRef.current.isThrown) return;
    const pos = getCanvasCoords(e);
    currentDragPosRef.current = pos;

    // Visual drag tilt on the ball
    if (dragStartRef.current) {
      const offsetX = (pos.x - dragStartRef.current.x) * 0.4;
      const offsetY = Math.max(-60, Math.min(20, (pos.y - dragStartRef.current.y) * 0.4));
      const w = containerRef.current?.clientWidth || 400;
      const h = containerRef.current?.clientHeight || 700;
      ballRef.current.x = w / 2 + offsetX;
      ballRef.current.y = h - 110 + offsetY;
    }
  };

  const handlePointerUp = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingRef.current || ballRef.current.isThrown || !dragStartRef.current) return;
    isDraggingRef.current = false;

    const pos = getCanvasCoords(e);
    const dt = Math.max(0.04, (performance.now() - dragStartRef.current.time) / 1000);
    const dy = pos.y - dragStartRef.current.y;
    const dx = pos.x - dragStartRef.current.x;

    // Must be a decisive upward swipe
    if (dy < -35 && dt < 0.48) {
      const flickSpeed = Math.min(1800, Math.abs(dy) / dt);
      const forwardRatio = flickSpeed / 800;

      // Depth speed
      const baseVz = (flickSpeed * 0.11 + 65) * sensitivity;
      const baseVy = (dy * 1.35 - flickSpeed * 0.15) * sensitivity;
      const baseVx = (dx / dt) * 0.28 * sensitivity;

      const ball = ballRef.current;
      ball.vx = baseVx;
      ball.vy = baseVy;
      ball.vz = Math.max(70, Math.min(220, baseVz));
      ball.vRot = (dx * 0.05 + (Math.random() - 0.5) * 4);
      ball.isThrown = true;

      soundEngine.playWhoosh(forwardRatio);
    } else {
      // Release cancelled: spring back smoothly
      if (containerRef.current) {
        ballRef.current.x = containerRef.current.clientWidth / 2;
        ballRef.current.y = containerRef.current.clientHeight - 110;
      }
    }

    dragStartRef.current = null;
    currentDragPosRef.current = null;
  };

  // Main Render & Physics Loop
  useEffect(() => {
    let animId: number;

    const renderLoop = (timestamp: number) => {
      animId = requestAnimationFrame(renderLoop);

      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = container.clientWidth;
      const height = container.clientHeight;

      const dt = Math.min(0.033, (timestamp - lastTimeRef.current) / 1000);
      lastTimeRef.current = timestamp;

      if (!isPaused) {
        // 1. Update wind particles
        const windDirection = Math.sign(windSpeed) || 1;
        const windMagnitude = Math.abs(windSpeed);
        windParticlesRef.current.forEach((p) => {
          p.x += windDirection * (p.speed * windMagnitude * 12 + 10) * dt;
          p.y += Math.sin(timestamp * 0.003 + p.wobble) * 8 * dt;
          p.angle += dt * 2;

          if (windDirection > 0 && p.x > width + 20) p.x = -20;
          if (windDirection < 0 && p.x < -20) p.x = width + 20;
        });

        // 2. Update celebratory particles
        particlesRef.current.forEach((p) => {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 450 * dt; // Gravity
          p.rotation += p.vRot * dt;
          p.life += dt;
          p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        });
        particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);

        // 3. Update Ball Physics
        const bin = calculateBinGeometry(width, height, level);
        const { landed, result } = updateBallPhysics(
          ballRef.current,
          bin,
          windSpeed,
          level,
          height,
          dt
        );

        if (landed && result) {
          onScore(result);

          if (result === 'swish') {
            soundEngine.playSwish();
            spawnConfetti(bin.x, bin.rimY);
          } else if (result === 'rim') {
            soundEngine.playRim(skin.metallic || level.binType === 'metal');
            spawnRimSparks(ballRef.current.x, ballRef.current.y);
          } else {
            soundEngine.playMiss();
          }

          // Schedule ball reset and wind change
          const delay = result === 'swish' ? 1200 : 1350;
          if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
          resetTimerRef.current = window.setTimeout(() => {
            resetBall();
            randomizeWind();
          }, delay);
        }
      }

      // --- DRAW FRAME ---
      ctx.save();
      ctx.clearRect(0, 0, width, height);

      // 1. Background, Wall, Floor, Breeze
      drawBackground(ctx, width, height, level, windParticlesRef.current);

      // 2. Animated Fan
      drawFan(ctx, width, height, windSpeed, level, timestamp / 1000);

      // 3. Basket Geometry & 3D Layering
      const bin = calculateBinGeometry(width, height, level);

      // Back of basket
      drawBinBack(ctx, bin, level);

      // Ball (if in flight or settling)
      const ball = ballRef.current;
      const isBallBehindFrontRim = ball.isInBin || (ball.z >= level.targetZ * 0.95 && ball.y > bin.rimY);

      if (!isBallBehindFrontRim) {
        // Ball in front of basket
        drawBall(ctx, ball, skin, level, height);
      }

      // Front of basket (clips ball when ball is inside)
      drawBinFront(ctx, bin, level);

      if (isBallBehindFrontRim) {
        // Ball rendered inside the can cavity
        ctx.save();
        // Clip inside the can body
        ctx.beginPath();
        ctx.rect(bin.x - bin.width / 2, bin.rimY - 5, bin.width, bin.height + 15);
        ctx.clip();
        drawBall(ctx, ball, skin, level, height);
        ctx.restore();
      }

      // 4. Confetti & Sparks
      drawParticles(ctx, particlesRef.current);

      // 5. Trajectory Guide (in practice mode or if toggled)
      if (showTrajectoryGuide && !ball.isThrown && isDraggingRef.current && dragStartRef.current && currentDragPosRef.current) {
        const dy = currentDragPosRef.current.y - dragStartRef.current.y;
        const dx = currentDragPosRef.current.x - dragStartRef.current.x;
        if (dy < -20) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 2.5;
          ctx.setLineDash([4, 6]);
          ctx.beginPath();
          ctx.moveTo(ball.x, ball.y);
          const windPull = windSpeed * 7;
          ctx.quadraticCurveTo(
            ball.x + (dx * 0.7) + windPull * 0.5,
            ball.y + dy * 0.8,
            ball.x + (dx * 1.4) + windPull,
            bin.rimY + 15
          );
          ctx.stroke();
          ctx.restore();
        }
      }

      ctx.restore();
    };

    animId = requestAnimationFrame(renderLoop);
    return () => {
      cancelAnimationFrame(animId);
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [
    isPaused,
    level,
    skin,
    windSpeed,
    onScore,
    resetBall,
    randomizeWind,
    showTrajectoryGuide,
    sensitivity,
  ]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};
