import { LevelConfig, PaperSkin, Particle, WindParticle } from '../types.ts';
import { BallState, BinState, projectScale } from './physics.ts';

// Deterministic crumpled polygon offsets
const CRUMPLE_OFFSETS = [
  0.92, 1.05, 0.88, 1.08, 0.95, 1.06, 0.86, 1.04,
  0.91, 1.08, 0.89, 1.03, 0.94, 1.07, 0.87, 1.02
];

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  level: LevelConfig,
  windParticles: WindParticle[]
) {
  const floorY = height * level.floorLineYRatio;

  // 1. Wall gradient
  const wallGrad = ctx.createLinearGradient(0, 0, 0, floorY);
  wallGrad.addColorStop(0, level.wallColorTop);
  wallGrad.addColorStop(1, level.wallColorBottom);
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, width, floorY);

  // Office ambient details
  if (level.id === 'cubicle') {
    // Cubicle partition lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(width * 0.15, 0);
    ctx.lineTo(width * 0.15, floorY);
    ctx.moveTo(width * 0.85, 0);
    ctx.lineTo(width * 0.85, floorY);
    ctx.stroke();

    // Small sticky note on background wall
    ctx.fillStyle = 'rgba(254, 240, 138, 0.2)';
    ctx.fillRect(width * 0.18, floorY * 0.35, 24, 24);
  } else if (level.id === 'airport') {
    // Large tinted glass window frame & runway lights
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(width * 0.1, floorY * 0.15, width * 0.8, floorY * 0.65);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.strokeRect(width * 0.1, floorY * 0.15, width * 0.8, floorY * 0.65);
    
    // Distant runway light dots
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.arc(width * 0.2 + i * (width * 0.11), floorY * 0.58, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (level.id === 'warehouse') {
    // Concrete joints & ceiling rafters
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, floorY * 0.4);
    ctx.lineTo(width, floorY * 0.4);
    ctx.stroke();
  }

  // 2. Baseboard / wall-floor boundary
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(0, floorY - 6, width, 6);

  // 3. Floor gradient with perspective tiles
  const floorGrad = ctx.createLinearGradient(0, floorY, 0, height);
  floorGrad.addColorStop(0, level.floorColorTop);
  floorGrad.addColorStop(1, level.floorColorBottom);
  ctx.fillStyle = floorGrad;
  ctx.fillRect(0, floorY, width, height - floorY);

  // Perspective floor grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  const numLines = 7;
  for (let i = 0; i <= numLines; i++) {
    const bottomX = (width / numLines) * i;
    const topX = width * 0.5 + (bottomX - width * 0.5) * 0.35;
    ctx.beginPath();
    ctx.moveTo(topX, floorY);
    ctx.lineTo(bottomX, height);
    ctx.stroke();
  }

  // Horizontal perspective depth floor lines
  for (let d = 1; d <= 4; d++) {
    const ratio = Math.pow(d / 4.5, 1.8);
    const lineY = floorY + (height - floorY) * ratio;
    ctx.beginPath();
    ctx.moveTo(0, lineY);
    ctx.lineTo(width, lineY);
    ctx.stroke();
  }

  // 4. Floating breeze particles (drifting with the wind)
  windParticles.forEach((p) => {
    ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size * 0.6);
    ctx.restore();
  });
}

export function drawFan(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  windSpeed: number,
  level: LevelConfig,
  timeSec: number
) {
  const isLeft = windSpeed < 0;
  const fanX = isLeft ? Math.max(38, width * 0.11) : Math.min(width - 38, width * 0.89);
  const floorY = height * level.floorLineYRatio;
  const fanBaseY = floorY + 12;
  const fanCenterY = floorY - 38;

  // Gentle head oscillation
  const oscAngle = Math.sin(timeSec * 2.2) * 0.08 * (isLeft ? 1 : -1);

  // 1. Floor shadow under fan
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(fanX, fanBaseY, 22, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. Fan stand base
  const baseGrad = ctx.createLinearGradient(fanX - 18, 0, fanX + 18, 0);
  baseGrad.addColorStop(0, '#334155');
  baseGrad.addColorStop(0.5, '#64748b');
  baseGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = baseGrad;
  ctx.beginPath();
  ctx.ellipse(fanX, fanBaseY - 2, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stand neck / pole
  ctx.fillStyle = '#475569';
  ctx.fillRect(fanX - 4, fanCenterY, 8, fanBaseY - fanCenterY - 2);

  // 3. Fan head (cage + blades)
  ctx.save();
  ctx.translate(fanX, fanCenterY);
  ctx.rotate(oscAngle);

  // Cage back
  const cageRadius = level.fanType === 'industrial' ? 34 : 28;
  ctx.fillStyle = level.fanType === 'industrial' ? '#ca8a04' : '#1e293b';
  ctx.beginPath();
  ctx.arc(0, 0, cageRadius, 0, Math.PI * 2);
  ctx.fill();

  // Spinning blades
  const spinSpeed = (Math.abs(windSpeed) * 4 + 8) * (isLeft ? -1 : 1);
  const bladeAngle = timeSec * spinSpeed;
  const numBlades = level.fanType === 'industrial' ? 4 : 3;

  ctx.save();
  ctx.rotate(bladeAngle);
  ctx.fillStyle = level.fanType === 'industrial' ? '#fde047' : '#94a3b8';
  for (let i = 0; i < numBlades; i++) {
    ctx.rotate((Math.PI * 2) / numBlades);
    ctx.beginPath();
    ctx.ellipse(0, cageRadius * 0.45, cageRadius * 0.22, cageRadius * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Central motor hub
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.arc(0, 0, 4, 0, Math.PI * 2);
  ctx.fill();

  // Wire cage front grill
  ctx.strokeStyle = level.fanType === 'industrial' ? '#eab308' : '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, cageRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Cross wire ribs
  for (let a = 0; a < 6; a++) {
    ctx.beginPath();
    const rad = (a * Math.PI) / 6;
    ctx.moveTo(Math.cos(rad) * -cageRadius, Math.sin(rad) * -cageRadius);
    ctx.lineTo(Math.cos(rad) * cageRadius, Math.sin(rad) * cageRadius);
    ctx.stroke();
  }

  // Inner ring
  ctx.beginPath();
  ctx.arc(0, 0, cageRadius * 0.55, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// 3D Basket - Back Interior (rendered behind the ball)
export function drawBinBack(
  ctx: CanvasRenderingContext2D,
  bin: BinState,
  level: LevelConfig
) {
  const { x, y, width: w, height: h, rimHeight: rh } = bin;
  const rimY = y - h / 2 + rh / 2;

  // 1. Bin Floor Drop Shadow
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.ellipse(x, y + h / 2 + 2, (w / 2) * 1.15, rh * 0.65, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 2. Interior cavity shadow
  ctx.save();
  ctx.fillStyle = '#05070a';
  ctx.beginPath();
  ctx.ellipse(x, rimY, w / 2, rh / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Inner back wall gradient
  const innerGrad = ctx.createLinearGradient(0, rimY - rh / 2, 0, y + h / 2);
  innerGrad.addColorStop(0, '#090d16');
  innerGrad.addColorStop(1, '#020617');
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.ellipse(x, rimY, w / 2, rh / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Back half of top rim
  ctx.strokeStyle = level.binType === 'wood' ? '#d97706' : '#94a3b8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(x, rimY, w / 2, rh / 2, 0, Math.PI, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

// 3D Basket - Front Mesh Body & Front Rim (rendered in front of ball if in bin)
export function drawBinFront(
  ctx: CanvasRenderingContext2D,
  bin: BinState,
  level: LevelConfig
) {
  const { x, y, width: w, height: h, rimHeight: rh } = bin;
  const rimY = y - h / 2 + rh / 2;
  const bottomY = y + h / 2;
  const bottomW = w * 0.76;

  ctx.save();

  // 1. Can Body Silhouette
  ctx.beginPath();
  ctx.moveTo(x - w / 2, rimY);
  ctx.lineTo(x + w / 2, rimY);
  ctx.lineTo(x + bottomW / 2, bottomY);
  ctx.lineTo(x - bottomW / 2, bottomY);
  ctx.closePath();

  // Fill based on bin type
  if (level.binType === 'recycling') {
    const greenGrad = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    greenGrad.addColorStop(0, '#15803d');
    greenGrad.addColorStop(0.5, '#22c55e');
    greenGrad.addColorStop(1, '#166534');
    ctx.fillStyle = greenGrad;
    ctx.fill();

    // Recycling logo hint
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('♻', x, y + 4);
  } else if (level.binType === 'wood') {
    const woodGrad = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    woodGrad.addColorStop(0, '#78350f');
    woodGrad.addColorStop(0.5, '#b45309');
    woodGrad.addColorStop(1, '#451a03');
    ctx.fillStyle = woodGrad;
    ctx.fill();

    // Vertical wooden slat lines
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    for (let s = -3; s <= 3; s++) {
      ctx.beginPath();
      const topOffset = (w / 8) * s;
      const botOffset = (bottomW / 8) * s;
      ctx.moveTo(x + topOffset, rimY);
      ctx.lineTo(x + botOffset, bottomY);
      ctx.stroke();
    }
  } else if (level.binType === 'metal') {
    const metalGrad = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    metalGrad.addColorStop(0, '#475569');
    metalGrad.addColorStop(0.4, '#e2e8f0');
    metalGrad.addColorStop(0.7, '#94a3b8');
    metalGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = metalGrad;
    ctx.fill();
  } else if (level.binType === 'plastic') {
    const plasticGrad = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    plasticGrad.addColorStop(0, '#1e3a8a');
    plasticGrad.addColorStop(0.5, '#3b82f6');
    plasticGrad.addColorStop(1, '#172554');
    ctx.fillStyle = plasticGrad;
    ctx.fill();
  } else {
    // Classic Wire Mesh Can
    const meshGrad = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    meshGrad.addColorStop(0, 'rgba(71, 85, 105, 0.95)');
    meshGrad.addColorStop(0.5, 'rgba(203, 213, 225, 0.85)');
    meshGrad.addColorStop(1, 'rgba(30, 41, 59, 0.95)');
    ctx.fillStyle = meshGrad;
    ctx.fill();

    // Wire diamond mesh pattern lines
    ctx.save();
    ctx.clip();
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.4)';
    ctx.lineWidth = 1;
    const meshSpacing = 9;
    for (let ox = -w; ox < w * 2; ox += meshSpacing) {
      ctx.beginPath();
      ctx.moveTo(x + ox, rimY);
      ctx.lineTo(x + ox + 35, bottomY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(x + ox, rimY);
      ctx.lineTo(x + ox - 35, bottomY);
      ctx.stroke();
    }
    ctx.restore();
  }

  // 2. Can bottom base ring
  ctx.strokeStyle = level.binType === 'wood' ? '#f59e0b' : '#f8fafc';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(x, bottomY, bottomW / 2, rh * 0.35, 0, 0, Math.PI);
  ctx.stroke();

  // 3. Front half of the top rim
  ctx.strokeStyle = level.binType === 'wood' ? '#f59e0b' : '#f8fafc';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.ellipse(x, rimY, w / 2, rh / 2, 0, 0, Math.PI);
  ctx.stroke();

  ctx.restore();
}

// Draw Paper Ball with realistic crumple textures, rotation, and shadow
export function drawBall(
  ctx: CanvasRenderingContext2D,
  ball: BallState,
  skin: PaperSkin,
  level: LevelConfig,
  canvasHeight: number
) {
  const scale = projectScale(ball.z);
  const r = ball.radius * scale;

  ctx.save();

  // 1. Projected Floor Shadow
  if (!ball.isInBin) {
    const floorY = canvasHeight * level.floorLineYRatio;
    // Ground level height below ball
    const shadowY = Math.max(ball.y + r * 0.8, floorY + (ball.z / level.targetZ) * 45);
    const heightAboveGround = Math.max(0, shadowY - ball.y);
    const shadowAlpha = Math.max(0.08, 0.4 - (heightAboveGround / 350) * 0.3);
    const shadowScale = Math.max(0.3, 1 - (heightAboveGround / 400) * 0.4);

    ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
    ctx.beginPath();
    ctx.ellipse(
      ball.x,
      shadowY,
      r * 1.05 * shadowScale,
      r * 0.35 * shadowScale,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // 2. Ball Body
  ctx.translate(ball.x, ball.y);
  ctx.rotate(ball.rot);

  // Subtle glow for gold skin
  if (skin.glow) {
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 14;
  }

  // Crumpled polygon contour
  ctx.beginPath();
  const numVerts = CRUMPLE_OFFSETS.length;
  for (let i = 0; i < numVerts; i++) {
    const angle = (i / numVerts) * Math.PI * 2;
    const rad = r * CRUMPLE_OFFSETS[i];
    const px = Math.cos(angle) * rad;
    const py = Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();

  // Shading Gradient
  const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  grad.addColorStop(0, skin.primaryColor);
  grad.addColorStop(0.65, skin.secondaryColor);
  grad.addColorStop(1, skin.wrinkleColor);
  ctx.fillStyle = grad;
  ctx.fill();

  // Metallic shine highlight if foil/metallic
  if (skin.metallic) {
    const shine = ctx.createLinearGradient(-r, -r, r, r);
    shine.addColorStop(0, 'rgba(255,255,255,0.7)');
    shine.addColorStop(0.4, 'rgba(255,255,255,0)');
    shine.addColorStop(0.8, 'rgba(255,255,255,0.5)');
    ctx.fillStyle = shine;
    ctx.fill();
  }

  // Specific skin patterns (e.g. Dollar or Lined Memo)
  if (skin.type === 'dollar') {
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = Math.max(1, r * 0.08);
    ctx.strokeRect(-r * 0.45, -r * 0.3, r * 0.9, r * 0.6);
    ctx.fillStyle = '#166534';
    ctx.font = `bold ${Math.max(8, Math.floor(r * 0.45))}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 0);
  } else if (skin.type === 'classic') {
    // Ruled lines on white notebook paper
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.25);
    ctx.lineTo(r * 0.45, -r * 0.25);
    ctx.moveTo(-r * 0.6, 0);
    ctx.lineTo(r * 0.55, 0);
    ctx.moveTo(-r * 0.45, r * 0.25);
    ctx.lineTo(r * 0.5, r * 0.25);
    ctx.stroke();
  }

  // Organic Crumple Wrinkle Creases
  ctx.strokeStyle = skin.wrinkleColor;
  ctx.lineWidth = Math.max(1, r * 0.06);
  ctx.beginPath();
  ctx.moveTo(-r * 0.45, -r * 0.25);
  ctx.lineTo(r * 0.1, -r * 0.55);
  ctx.lineTo(r * 0.55, -r * 0.1);
  ctx.lineTo(r * 0.2, r * 0.3);
  ctx.lineTo(-r * 0.35, r * 0.45);
  ctx.lineTo(-r * 0.1, 0);
  ctx.lineTo(-r * 0.45, -r * 0.25);

  ctx.moveTo(0, -r * 0.2);
  ctx.lineTo(r * 0.35, 0);
  ctx.lineTo(0, r * 0.35);
  ctx.stroke();

  ctx.restore();
}

// Celebration / Rim particles
export function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[]
) {
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.7);
    ctx.restore();
  });
}
