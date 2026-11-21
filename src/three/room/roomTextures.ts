import * as THREE from 'three';
import { RacingGameEngineState } from './racingGameEngine';

/**
 * Rich wood plank floor matching #6b442e base color with natural wood grain and plank seams.
 */
export function createWoodFloorTexture(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
} {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  if (cCtx && bCtx) {
    cCtx.fillStyle = '#6b442e';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    const planks = 8;
    const plankH = size / planks;
    for (let i = 0; i < planks; i++) {
      const shade = ((i * 13) % 18) - 9;
      const r = 107 + shade;
      const g = 68 + Math.round(shade * 0.65);
      const b = 46 + Math.round(shade * 0.45);
      cCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      cCtx.fillRect(0, i * plankH, size, plankH - 2);

      const bumpBase = 134 + ((i * 19) % 24);
      bCtx.fillStyle = `rgb(${bumpBase},${bumpBase},${bumpBase})`;
      bCtx.fillRect(0, i * plankH, size, plankH - 2);

      for (let s = 0; s < 10; s++) {
        const yOff = i * plankH + 4 + s * ((plankH - 8) / 10);
        cCtx.strokeStyle =
          s % 2 === 0 ? 'rgba(255,235,215,0.06)' : 'rgba(28,14,8,0.22)';
        cCtx.lineWidth = 1.1;
        cCtx.beginPath();
        cCtx.moveTo(0, yOff);
        cCtx.bezierCurveTo(size * 0.3, yOff + 1.8, size * 0.7, yOff - 1.8, size, yOff);
        cCtx.stroke();

        bCtx.strokeStyle = 'rgba(255,255,255,0.09)';
        bCtx.beginPath();
        bCtx.moveTo(0, yOff);
        bCtx.lineTo(size, yOff);
        bCtx.stroke();
      }

      cCtx.fillStyle = '#2c1910';
      cCtx.fillRect(0, (i + 1) * plankH - 2, size, 2);
      bCtx.fillStyle = '#202020';
      bCtx.fillRect(0, (i + 1) * plankH - 2, size, 2);

      const stagger = ((i % 2) * size) / 2 + 86;
      cCtx.fillRect(stagger % size, i * plankH, 2, plankH);
      bCtx.fillRect(stagger % size, i * plankH, 2, plankH);
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(4.5, 4.5);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(4.5, 4.5);

  return { map, bumpMap };
}

export function createWalnutGrainTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d');

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d');

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d');

  if (cCtx && bCtx && rCtx) {
    cCtx.fillStyle = '#402c22';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#909090';
    rCtx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 2) {
      const wave = Math.sin(y * 0.045) * 14 + Math.cos(y * 0.017) * 9;
      const shade = ((y * 37) % 18) - 9;
      cCtx.strokeStyle = `rgb(${64 + shade}, ${44 + Math.round(shade * 0.7)}, ${34 + Math.round(shade * 0.5)})`;
      cCtx.lineWidth = 2;
      cCtx.beginPath();
      cCtx.moveTo(0, y);
      cCtx.bezierCurveTo(size * 0.33, y + wave * 0.4, size * 0.66, y - wave * 0.4, size, y);
      cCtx.stroke();

      const bVal = 128 + shade * 2;
      bCtx.strokeStyle = `rgb(${bVal},${bVal},${bVal})`;
      bCtx.beginPath();
      bCtx.moveTo(0, y);
      bCtx.lineTo(size, y);
      bCtx.stroke();

      const rVal = 120 + ((y * 19) % 45);
      rCtx.strokeStyle = `rgb(${rVal},${rVal},${rVal})`;
      rCtx.beginPath();
      rCtx.moveTo(0, y);
      rCtx.lineTo(size, y);
      rCtx.stroke();
    }
  }

  const map = new THREE.CanvasTexture(cCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap, roughnessMap };
}

export function createFabricWeaveTextures(): {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 256;
  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d');

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d');

  if (bCtx && rCtx) {
    bCtx.fillStyle = '#787878';
    bCtx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#c8c8c8';
    rCtx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 4) {
      bCtx.fillStyle = y % 8 === 0 ? '#a0a0a0' : '#585858';
      bCtx.fillRect(0, y, size, 2);
      rCtx.fillStyle = y % 8 === 0 ? '#dcdcdc' : '#b2b2b2';
      rCtx.fillRect(0, y, size, 2);
    }
    for (let x = 0; x < size; x += 4) {
      bCtx.fillStyle = x % 8 === 0 ? 'rgba(220,220,220,0.28)' : 'rgba(40,40,40,0.28)';
      bCtx.fillRect(x, 0, 2, size);
    }
  }

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(6, 6);

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(6, 6);

  return { bumpMap, roughnessMap };
}

export function createDeskMatTexture(accentHex: string): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#11151c';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = y % 6 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, y, w, 1);
    }
    ctx.strokeStyle = accentHex;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWovenRugTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#23262c';
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 4) {
      ctx.fillStyle = y % 8 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, y, size, 2);
    }
    ctx.strokeStyle = 'rgba(248,249,250,0.18)';
    ctx.lineWidth = 5;
    ctx.strokeRect(10, 10, size - 20, size - 20);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createNightSkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#090d16');
    grad.addColorStop(0.65, '#172336');
    grad.addColorStop(1, '#262b34');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const moon = ctx.createRadialGradient(185, 68, 4, 185, 68, 46);
    moon.addColorStop(0, 'rgba(248, 249, 250, 0.95)');
    moon.addColorStop(0.22, 'rgba(186, 214, 245, 0.35)');
    moon.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = moon;
    ctx.fillRect(120, 12, 120, 120);

    ctx.fillStyle = '#090b10';
    const heights = [36, 54, 42, 72, 48, 66, 38, 58, 44, 62];
    heights.forEach((h, idx) => {
      ctx.fillRect(idx * 26, 256 - h, 24, h);
    });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createMonitorDesktopTexture(accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 1024, 576);
    bg.addColorStop(0, '#061830');
    bg.addColorStop(0.55, '#0b223d');
    bg.addColorStop(1, '#083344');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 576);

    ctx.fillStyle = 'rgba(15, 19, 32, 0.72)';
    ctx.fillRect(0, 0, 1024, 30);
    ctx.fillStyle = '#F8F9FA';
    ctx.font = '600 13px sans-serif';
    ctx.fillText('JashedOS   File   Edit   View   Window', 20, 20);

    ctx.fillStyle = 'rgba(18, 22, 34, 0.84)';
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(190, 92, 644, 348, 18);
    ctx.fill();
    ctx.stroke();

    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(218 + i * 20, 114, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#F8F9FA';
    ctx.font = '600 42px sans-serif';
    ctx.fillText('Jashed', 238, 214);
    ctx.fillStyle = accentHex;
    ctx.fillText('.dev', 392, 214);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '400 18px sans-serif';
    ctx.fillText('Developer Workstation & Portfolio OS', 238, 252);
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Power on PC to launch Projects, Terminal & 3D Journey', 238, 282);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.roundRect(312, 508, 400, 50, 16);
    ctx.fill();
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createSideMonitorTexture(accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 896;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0c0f15';
    ctx.fillRect(0, 0, 512, 896);
    ctx.fillStyle = '#161a22';
    ctx.fillRect(0, 0, 512, 46);
    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(24 + i * 18, 23, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#9CA3AF';
    ctx.font = '500 15px monospace';
    ctx.fillText('studio_architecture.ts', 90, 28);

    const lines = [
      'const studio = {',
      '  walls: "cool-gray #6e7378",',
      '  woodFloor: "#6b442e",',
      '  ledPanels: "#f8f9fa",',
      '  cooling: ["Inverter AC", "BLDC Fan"],',
      '  stations: {',
      '    desk: "Dual Monitor + PC",',
      '    bed: "North Platform Bed",',
      '    phone: "East Charging Dock",',
      '    gaming: "GT Racing Sim Rig",',
      '  },',
      '};',
      '',
      'jashed@studio:~$ ready',
    ];
    lines.forEach((line, i) => {
      const y = 96 + i * 36;
      ctx.fillStyle = '#4B5563';
      ctx.font = '400 14px monospace';
      ctx.fillText(String(i + 1).padStart(2, '0'), 18, y);
      ctx.fillStyle = line.includes('#')
        ? '#E2E8F0'
        : line.includes('const')
          ? accentHex
          : '#CBD5E1';
      ctx.fillText(line, 56, y);
    });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export interface RacingGameCanvasController {
  texture: THREE.CanvasTexture;
  drawFrame: (engine: RacingGameEngineState) => void;
}

/**
 * Creates a reusable, high-fidelity Car Racing Game canvas & texture
 * featuring lateral player steering, curved perspective circuit, multi-car AI traffic,
 * F1 countdown lights, nitro speed streaks, cockpit dashboard, needle speedometer,
 * and bottom-right RPM / gear / lap timer HUD.
 */
export function createRacingGameCanvas(): RacingGameCanvasController {
  const w = 1024;
  const h = 576;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const drawFrame: RacingGameCanvasController['drawFrame'] = (engine) => {
    if (!ctx) return;

    const {
      phase,
      countdownVal,
      steerDeg,
      speedKmh,
      rpm,
      gear,
      distanceM,
      lapLengthM,
      lap,
      totalLaps,
      lapTimeSec,
      bestLapSec,
      position,
      totalCars,
      playerX,
      nitroPct,
      nitroActive,
      offTrack,
      collisionTimer,
      trackCurvature,
      rivals,
    } = engine;

    if (phase === 'standby') {
      const standbyBg = ctx.createLinearGradient(0, 0, 0, h);
      standbyBg.addColorStop(0, '#0a0e16');
      standbyBg.addColorStop(1, '#111827');
      ctx.fillStyle = standbyBg;
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 2;
      ctx.strokeRect(48, 48, w - 96, h - 96);

      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 18px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('APEX GT RACING · STANDBY', w / 2, 240);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '600 28px sans-serif';
      ctx.fillText('Click Console or Start Race to Drive', w / 2, 288);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '400 15px monospace';
      ctx.fillText('W Gas · S Brake · A / D Steer · Space Nitro Boost', w / 2, 330);
      texture.needsUpdate = true;
      return;
    }

    // Subtle cockpit shake on off-track rumble strips or car contact
    const rumbleJitter =
      offTrack && speedKmh > 40
        ? Math.sin(distanceM * 1.4) * 3.5
        : collisionTimer > 0.35
          ? Math.sin(performance.now() * 0.08) * 6
          : 0;

    const horizonY = 232 + rumbleJitter;
    const roadBottomY = 420;
    const curveShift = trackCurvature * 145;
    const playerShiftPx = -playerX * 155;
    const vanishX = w / 2 + curveShift * 0.62 + playerShiftPx * 0.18;
    const roadBottomCenterX = w / 2 + playerShiftPx;

    // 1. Sunset / Dusk Sky & Distant Mountains
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#0f172a');
    skyGrad.addColorStop(0.48, '#1e3a5f');
    skyGrad.addColorStop(0.84, '#b45309');
    skyGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, horizonY);

    // Distant Grandstand & Mountain Ridge Silhouette
    ctx.fillStyle = '#18202c';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.lineTo(130, horizonY - 26);
    ctx.lineTo(280, horizonY - 12);
    ctx.lineTo(440, horizonY - 34);
    ctx.lineTo(620, horizonY - 16);
    ctx.lineTo(790, horizonY - 38);
    ctx.lineTo(940, horizonY - 18);
    ctx.lineTo(w, horizonY - 28);
    ctx.lineTo(w, horizonY);
    ctx.closePath();
    ctx.fill();

    // 2. Grass Track Verge & Perspective Ground Bands
    ctx.fillStyle = offTrack ? '#28361c' : '#1c3a24';
    ctx.fillRect(0, horizonY, w, roadBottomY - horizonY);

    const stripeCount = 14;
    const scrollFrac = (distanceM * 0.16) % 1;
    for (let i = 0; i < stripeCount; i++) {
      const z0 = (i + scrollFrac) / stripeCount;
      const z1 = (i + 1 + scrollFrac) / stripeCount;
      const p0 = Math.pow(z0, 1.85);
      const p1 = Math.pow(z1, 1.85);
      const y0 = horizonY + p0 * (roadBottomY - horizonY);
      const y1 = horizonY + p1 * (roadBottomY - horizonY);
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(16, 42, 24, 0.45)';
        ctx.fillRect(0, y0, w, y1 - y0);
      }
    }

    // Helper for road centerline X at perspective depth p (0 = horizon, 1 = foreground)
    const getRoadCenterX = (p: number) =>
      vanishX + (roadBottomCenterX - vanishX) * p - curveShift * 0.28 * (1 - p) * p * 4;

    // 3. Perspective Asphalt Road Surface with Curve & Rumble Curbs
    const halfRoadTop = 34;
    const halfRoadBot = 450;

    // Left & Right FIA Rumble Curbs (Red & White)
    for (let i = 0; i < stripeCount; i++) {
      const z0 = Math.max(0, (i + scrollFrac - 0.5) / stripeCount);
      const z1 = Math.min(1, (i + 0.5 + scrollFrac) / stripeCount);
      const p0 = Math.pow(z0, 1.85);
      const p1 = Math.pow(z1, 1.85);
      const y0 = horizonY + p0 * (roadBottomY - horizonY);
      const y1 = horizonY + p1 * (roadBottomY - horizonY);

      const cx0 = getRoadCenterX(p0);
      const cx1 = getRoadCenterX(p1);
      const hw0 = halfRoadTop + (halfRoadBot - halfRoadTop) * p0;
      const hw1 = halfRoadTop + (halfRoadBot - halfRoadTop) * p1;
      const kw0 = 6 + 24 * p0;
      const kw1 = 6 + 24 * p1;

      ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#f8fafc';
      // Left curb
      ctx.beginPath();
      ctx.moveTo(cx0 - hw0 - kw0, y0);
      ctx.lineTo(cx0 - hw0, y0);
      ctx.lineTo(cx1 - hw1, y1);
      ctx.lineTo(cx1 - hw1 - kw1, y1);
      ctx.closePath();
      ctx.fill();

      // Right curb
      ctx.beginPath();
      ctx.moveTo(cx0 + hw0, y0);
      ctx.lineTo(cx0 + hw0 + kw0, y0);
      ctx.lineTo(cx1 + hw1 + kw1, y1);
      ctx.lineTo(cx1 + hw1, y1);
      ctx.closePath();
      ctx.fill();
    }

    // Asphalt surface polygon (segmented for subtle curve bend)
    const roadGrad = ctx.createLinearGradient(0, horizonY, 0, roadBottomY);
    roadGrad.addColorStop(0, '#333942');
    roadGrad.addColorStop(1, '#191d24');
    ctx.fillStyle = roadGrad;
    for (let s = 0; s < 10; s++) {
      const p0 = Math.pow(s / 10, 1.6);
      const p1 = Math.pow((s + 1) / 10, 1.6);
      const y0 = horizonY + p0 * (roadBottomY - horizonY);
      const y1 = horizonY + p1 * (roadBottomY - horizonY);
      const cx0 = getRoadCenterX(p0);
      const cx1 = getRoadCenterX(p1);
      const hw0 = halfRoadTop + (halfRoadBot - halfRoadTop) * p0;
      const hw1 = halfRoadTop + (halfRoadBot - halfRoadTop) * p1;
      ctx.beginPath();
      ctx.moveTo(cx0 - hw0, y0);
      ctx.lineTo(cx0 + hw0, y0);
      ctx.lineTo(cx1 + hw1, y1 + 1);
      ctx.lineTo(cx1 - hw1, y1 + 1);
      ctx.closePath();
      ctx.fill();
    }

    // White Track Edge Lines & Scrolling Center Lane Dashes
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.72)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let s = 0; s <= 10; s++) {
      const p = Math.pow(s / 10, 1.6);
      const y = horizonY + p * (roadBottomY - horizonY);
      const cx = getRoadCenterX(p);
      const hw = halfRoadTop + (halfRoadBot - halfRoadTop) * p;
      if (s === 0) ctx.moveTo(cx - hw + 4, y);
      else ctx.lineTo(cx - hw + 4, y);
    }
    for (let s = 0; s <= 10; s++) {
      const p = Math.pow(s / 10, 1.6);
      const y = horizonY + p * (roadBottomY - horizonY);
      const cx = getRoadCenterX(p);
      const hw = halfRoadTop + (halfRoadBot - halfRoadTop) * p;
      if (s === 0) ctx.moveTo(cx + hw - 4, y);
      else ctx.lineTo(cx + hw - 4, y);
    }
    ctx.stroke();

    for (let i = 0; i < stripeCount; i += 2) {
      const z0 = (i + scrollFrac) / stripeCount;
      const z1 = Math.min(1, (i + 0.85 + scrollFrac) / stripeCount);
      const p0 = Math.pow(z0, 1.85);
      const p1 = Math.pow(z1, 1.85);
      const y0 = horizonY + p0 * (roadBottomY - horizonY);
      const y1 = horizonY + p1 * (roadBottomY - horizonY);
      const cx0 = getRoadCenterX(p0);
      const cx1 = getRoadCenterX(p1);
      const dw0 = 2 + 5 * p0;
      const dw1 = 2 + 5 * p1;
      ctx.fillStyle = 'rgba(248, 250, 252, 0.78)';
      ctx.beginPath();
      ctx.moveTo(cx0 - dw0, y0);
      ctx.lineTo(cx0 + dw0, y0);
      ctx.lineTo(cx1 + dw1, y1);
      ctx.lineTo(cx1 - dw1, y1);
      ctx.closePath();
      ctx.fill();
    }

    // Corner Apex Chevron Warning Boards on steep curves
    if (Math.abs(trackCurvature) > 0.45) {
      const side = trackCurvature > 0 ? -1 : 1;
      for (let b = 0; b < 3; b++) {
        const p = 0.22 + b * 0.16;
        const by = horizonY + p * (roadBottomY - horizonY);
        const bcx = getRoadCenterX(p);
        const bhw = halfRoadTop + (halfRoadBot - halfRoadTop) * p;
        const bx = bcx + side * (bhw + 26 + b * 14);
        const bw = 18 + b * 10;
        const bh = 14 + b * 8;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bx - bw / 2, by - bh, bw, bh);
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx - side * (bw * 0.25), by - bh * 0.78);
        ctx.lineTo(bx + side * (bw * 0.22), by - bh * 0.5);
        ctx.lineTo(bx - side * (bw * 0.25), by - bh * 0.22);
        ctx.stroke();
      }
    }

    // Trackside Overhead Sponsor / Timing Gantry passing periodically
    const gantryPhase = (distanceM * 0.018) % 1;
    if (gantryPhase > 0.18 && gantryPhase < 0.94) {
      const gp = Math.pow(gantryPhase, 1.9);
      const gy = horizonY + gp * 118;
      const gh = 14 + gp * 65;
      const gx = getRoadCenterX(gp * 0.65);
      const gHalf = (halfRoadTop + (halfRoadBot - halfRoadTop) * (gp * 0.65)) * 1.16;
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(gx - gHalf, gy - gh, gHalf * 2, 10 + gp * 18);
      ctx.fillRect(gx - gHalf, gy - gh, 6 + gp * 8, gh);
      ctx.fillRect(gx + gHalf - (6 + gp * 8), gy - gh, 6 + gp * 8, gh);
      ctx.fillStyle = '#38BDF8';
      ctx.font = `700 ${Math.round(9 + gp * 10)}px monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(`APEX CIRCUIT · LAP ${lap}/${totalLaps}`, gx, gy - gh + 10 + gp * 10);
    }

    // Multi-Car AI Traffic rendered farthest -> closest
    const visibleRivals = rivals
      .map((r) => ({ rival: r, relDist: r.distanceM - distanceM }))
      .filter((item) => item.relDist > 4 && item.relDist < 260)
      .sort((a, b) => b.relDist - a.relDist);

    visibleRivals.forEach(({ rival, relDist }) => {
      const depthFrac = 1 - Math.min(1, Math.max(0, relDist / 260));
      const p = Math.pow(depthFrac, 2.2);
      const carY = horizonY + p * (roadBottomY - horizonY - 22);
      const roadCx = getRoadCenterX(p);
      const halfW = halfRoadTop + (halfRoadBot - halfRoadTop) * p;
      const carX = roadCx + rival.lane * halfW * 0.85;
      const carScale = 0.24 + p * 1.38;
      const cw = 72 * carScale;
      const ch = 26 * carScale;

      // Ground shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(carX, carY + ch * 0.35, cw * 0.56, ch * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();

      // GT Rear Bodywork
      ctx.fillStyle = rival.color;
      ctx.beginPath();
      ctx.roundRect(carX - cw / 2, carY - ch * 0.65, cw, ch, 5 * carScale);
      ctx.fill();

      // Cabin greenhouse
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(carX - cw * 0.32, carY - ch * 1.05, cw * 0.64, ch * 0.48, 4 * carScale);
      ctx.fill();

      // Carbon GT Rear Wing
      ctx.fillStyle = '#111827';
      ctx.fillRect(carX - cw * 0.54, carY - ch * 1.12, cw * 1.08, Math.max(2, 4.5 * carScale));
      ctx.fillRect(carX - cw * 0.25, carY - ch * 0.96, Math.max(1.5, 3 * carScale), ch * 0.34);
      ctx.fillRect(carX + cw * 0.22, carY - ch * 0.96, Math.max(1.5, 3 * carScale), ch * 0.34);

      // Glowing Red Tail Lights
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(carX - cw * 0.43, carY - ch * 0.38, cw * 0.22, Math.max(2, 4.5 * carScale));
      ctx.fillRect(carX + cw * 0.21, carY - ch * 0.38, cw * 0.22, Math.max(2, 4.5 * carScale));
    });

    // Nitro Boost & High-Speed Peripheral Airflow Streaks
    if (nitroActive || speedKmh > 235) {
      const streakCount = nitroActive ? 14 : 7;
      ctx.strokeStyle = nitroActive ? 'rgba(56, 189, 248, 0.55)' : 'rgba(226, 232, 240, 0.25)';
      ctx.lineWidth = nitroActive ? 2.5 : 1.5;
      for (let k = 0; k < streakCount; k++) {
        const ang = (k / streakCount) * Math.PI * 2 + (distanceM * 0.05) % 1;
        const r0 = 260 + ((k * 37) % 80);
        const r1 = r0 + (nitroActive ? 130 : 75);
        ctx.beginPath();
        ctx.moveTo(w / 2 + Math.cos(ang) * r0, 220 + Math.sin(ang) * r0 * 0.55);
        ctx.lineTo(w / 2 + Math.cos(ang) * r1, 220 + Math.sin(ang) * r1 * 0.55);
        ctx.stroke();
      }
    }

    // Collision Impact Vignette Flash
    if (collisionTimer > 0.35) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.18)';
      ctx.fillRect(0, 0, w, roadBottomY);
    }

    // Subtle Car Bonnet / Hood over bottom windshield (tilted slightly with steering)
    const hoodShift = -steerDeg * 0.14;
    ctx.fillStyle = '#1e2430';
    ctx.beginPath();
    ctx.moveTo(185 + hoodShift, 412 + rumbleJitter * 0.4);
    ctx.lineTo(839 + hoodShift, 412 + rumbleJitter * 0.4);
    ctx.lineTo(940, 442);
    ctx.lineTo(84, 442);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = nitroActive ? 'rgba(56, 189, 248, 0.5)' : 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(185 + hoodShift, 412 + rumbleJitter * 0.4);
    ctx.lineTo(839 + hoodShift, 412 + rumbleJitter * 0.4);
    ctx.stroke();

    // 4. Windshield Frame, A-Pillars & Rear-View Mirror
    ctx.fillStyle = '#090b10';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(74, 0);
    ctx.lineTo(28, 410);
    ctx.lineTo(0, 410);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w, 0);
    ctx.lineTo(w - 74, 0);
    ctx.lineTo(w - 28, 410);
    ctx.lineTo(w, 410);
    ctx.closePath();
    ctx.fill();

    // Rear-view mirror at top center
    ctx.fillStyle = '#0b0e14';
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(w / 2 - 115, 16, 230, 52, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(w / 2 - 104, 24, 208, 36);
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(w / 2 - 18, 36);
    ctx.lineTo(w / 2 + 18, 36);
    ctx.lineTo(w / 2 + 64, 60);
    ctx.lineTo(w / 2 - 64, 60);
    ctx.closePath();
    ctx.fill();

    // 5. Realistic Vehicle Cockpit Dashboard Cowl (Bottom 34%)
    const dashGrad = ctx.createLinearGradient(0, 396, 0, h);
    dashGrad.addColorStop(0, '#161a22');
    dashGrad.addColorStop(0.2, '#0d1016');
    dashGrad.addColorStop(1, '#07090d');
    ctx.fillStyle = dashGrad;
    ctx.beginPath();
    ctx.moveTo(0, 424);
    ctx.quadraticCurveTo(w * 0.28, 386, w * 0.5, 404);
    ctx.quadraticCurveTo(w * 0.72, 386, w, 424);
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.14)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Instrument Cluster Binnacle Backing (Centered Left-of-Center Driver Cluster)
    const cxSpeed = 198;
    const cyGauge = 486;
    const rGauge = 70;

    const cxRpm = 484;

    // Helper: Draw Analog Circular Gauge with Tapered Animated Needle
    const drawDial = (
      cx: number,
      cy: number,
      r: number,
      title: string,
      valueText: string,
      unitText: string,
      fraction: number,
      accent: string,
      redlineStart?: number,
      scaleLabels?: number[]
    ) => {
      const clampedFrac = Math.min(1, Math.max(0, fraction));

      ctx.fillStyle = '#090c12';
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 4;
      ctx.stroke();

      const startAng = Math.PI * 0.75;
      const sweepAng = Math.PI * 1.5;

      // Track background arc
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.14)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 9, startAng, startAng + sweepAng);
      ctx.stroke();

      // Active arc fill
      ctx.strokeStyle = accent;
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 9, startAng, startAng + sweepAng * clampedFrac);
      ctx.stroke();

      if (redlineStart !== undefined) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(cx, cy, r - 9, startAng + sweepAng * redlineStart, startAng + sweepAng);
        ctx.stroke();
      }

      // Major & Minor Tick marks
      const tickCount = 16;
      for (let t = 0; t <= tickCount; t++) {
        const frac = t / tickCount;
        const ang = startAng + frac * sweepAng;
        const isMajor = t % 2 === 0;
        const inner = isMajor ? r - 18 : r - 13;
        const outer = r - 5;
        ctx.strokeStyle =
          redlineStart !== undefined && frac >= redlineStart
            ? '#ef4444'
            : isMajor
              ? '#CBD5E1'
              : '#64748B';
        ctx.lineWidth = isMajor ? 2.2 : 1.1;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
        ctx.lineTo(cx + Math.cos(ang) * outer, cy + Math.sin(ang) * outer);
        ctx.stroke();
      }

      // Numeric Scale Graduations
      if (scaleLabels && scaleLabels.length > 1) {
        ctx.fillStyle = '#94A3B8';
        ctx.font = '600 9px monospace';
        ctx.textAlign = 'center';
        scaleLabels.forEach((lbl, idx) => {
          const frac = idx / (scaleLabels.length - 1);
          const ang = startAng + frac * sweepAng;
          const lr = r - 27;
          ctx.fillText(String(lbl), cx + Math.cos(ang) * lr, cy + Math.sin(ang) * lr + 3);
        });
      }

      // Tapered Racing Needle + Counterweight
      const nAng = startAng + sweepAng * clampedFrac;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(nAng);
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-14, -3.2);
      ctx.lineTo(r - 15, -1.1);
      ctx.lineTo(r - 15, 1.1);
      ctx.lineTo(-14, 3.2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.arc(cx, cy, 7.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 10px monospace';
      ctx.fillText(title, cx, cy - 16);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '700 24px monospace';
      ctx.fillText(valueText, cx, cy + 36);

      ctx.fillStyle = accent;
      ctx.font = '600 10px monospace';
      ctx.fillText(unitText, cx, cy + 51);
    };

    // Speedometer Dial (Left — completely clear of steering wheel rim)
    drawDial(
      cxSpeed,
      cyGauge,
      rGauge,
      'SPEED',
      String(Math.round(speedKmh)),
      'KM/H',
      speedKmh / 320,
      speedKmh >= 260 ? '#EF4444' : speedKmh >= 200 ? '#F59E0B' : '#38BDF8',
      260 / 320,
      [0, 80, 160, 240, 320]
    );

    // Tachometer / RPM + Gear Dial (Center-Right)
    drawDial(
      cxRpm,
      cyGauge,
      rGauge,
      'RPM x1000',
      `G${gear}`,
      `${(rpm / 1000).toFixed(1)}k`,
      rpm / 9000,
      '#22C55E',
      0.8
    );

    // Compact Center-Console Track Minimap Card (Left of Bottom-Right HUD)
    ctx.fillStyle = '#090d14';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(566, 434, 108, 124, 12);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 10px monospace';
    ctx.fillText('CIRCUIT', 620, 454);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(620, 496, 35, 23, 0.25, 0, Math.PI * 2);
    ctx.stroke();

    // Rival car dots on circuit minimap
    rivals.forEach((rv) => {
      const rAng = ((rv.distanceM % lapLengthM) / lapLengthM) * Math.PI * 2;
      ctx.fillStyle = rv.color;
      ctx.beginPath();
      ctx.arc(
        620 + Math.cos(rAng) * 35 * Math.cos(0.25) - Math.sin(rAng) * 23 * Math.sin(0.25),
        496 + Math.cos(rAng) * 35 * Math.sin(0.25) + Math.sin(rAng) * 23 * Math.cos(0.25),
        3.2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });

    const mapDotAng = ((distanceM % lapLengthM) / lapLengthM) * Math.PI * 2;
    ctx.fillStyle = '#38BDF8';
    ctx.beginPath();
    ctx.arc(
      620 + Math.cos(mapDotAng) * 35 * Math.cos(0.25) - Math.sin(mapDotAng) * 23 * Math.sin(0.25),
      496 + Math.cos(mapDotAng) * 35 * Math.sin(0.25) + Math.sin(mapDotAng) * 23 * Math.cos(0.25),
      5.2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '600 10px monospace';
    ctx.fillText(`POS ${position} / ${totalCars}`, 620, 544);

    // 6. Rotating Cockpit Steering Wheel Silhouette (Centered Between Speedometer & Tachometer)
    ctx.save();
    ctx.translate(342, 548);
    ctx.rotate((steerDeg * Math.PI) / 180);

    // Spokes
    ctx.fillStyle = '#1f2430';
    ctx.fillRect(-86, -10, 172, 20);
    ctx.fillRect(-12, 0, 24, 86);

    // Outer wheel rim
    ctx.strokeStyle = '#12151c';
    ctx.lineWidth = 19;
    ctx.beginPath();
    ctx.arc(0, 0, 94, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 104, 0, Math.PI * 2);
    ctx.stroke();

    // Top 12-o'clock center stripe
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(-5, -104, 10, 19);

    // Center hub + shift LEDs
    ctx.fillStyle = '#181c24';
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#38BDF8';
    ctx.font = '700 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`G${gear}`, 0, 5);
    ctx.restore();

    // 7. Real-Time Bottom-Right Racing HUD (Engine RPM, Current Gear, Lap Timer)
    const hudX = 688;
    const hudY = 414;
    const hudW = 318;
    const hudH = 144;
    const rpmClamped = Math.min(9000, Math.max(0, Math.round(rpm)));
    const rpmFrac = rpmClamped / 9000;
    const isRedline = rpmClamped >= 7600;
    const isShiftWarn = rpmClamped >= 6400 && !isRedline;

    ctx.fillStyle = 'rgba(8, 12, 20, 0.92)';
    ctx.strokeStyle = isRedline ? 'rgba(239, 68, 68, 0.72)' : 'rgba(56, 189, 248, 0.45)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 12);
    ctx.fill();
    ctx.stroke();

    // Subtle top accent line inside HUD card
    ctx.fillStyle = isRedline ? '#EF4444' : '#38BDF8';
    ctx.fillRect(hudX + 14, hudY + 1, hudW - 28, 2.5);

    // Engine RPM header & digital readout
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 10px monospace';
    ctx.fillText('ENGINE RPM', hudX + 16, hudY + 24);

    ctx.textAlign = 'right';
    ctx.fillStyle = isRedline ? '#EF4444' : isShiftWarn ? '#F59E0B' : '#F8FAFC';
    ctx.font = '700 15px monospace';
    ctx.fillText(`${rpmClamped.toLocaleString('en-US')} RPM`, hudX + hudW - 16, hudY + 25);

    // 16-segment progressive RPM bar
    const segCount = 16;
    const segGap = 4;
    const barLeft = hudX + 16;
    const barTop = hudY + 34;
    const barW = hudW - 32;
    const segW = (barW - segGap * (segCount - 1)) / segCount;
    const activeSegs = Math.round(rpmFrac * segCount);

    for (let s = 0; s < segCount; s++) {
      const sx = barLeft + s * (segW + segGap);
      const lit = s < activeSegs;
      if (lit) {
        ctx.fillStyle = s >= 13 ? '#EF4444' : s >= 10 ? '#F59E0B' : s >= 7 ? '#22C55E' : '#38BDF8';
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.16)';
      }
      ctx.beginPath();
      ctx.roundRect(sx, barTop, segW, 18, 3);
      ctx.fill();
    }

    // RPM scale ticks
    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748B';
    ctx.font = '500 9px monospace';
    ctx.fillText('0', barLeft, hudY + 64);
    ctx.textAlign = 'center';
    ctx.fillText('3K', barLeft + barW * 0.33, hudY + 64);
    ctx.fillText('6K', barLeft + barW * 0.66, hudY + 64);
    ctx.textAlign = 'right';
    ctx.fillStyle = isRedline ? '#EF4444' : '#64748B';
    ctx.fillText('9K', barLeft + barW, hudY + 64);

    // Divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(hudX + 16, hudY + 72);
    ctx.lineTo(hudX + hudW - 16, hudY + 72);
    ctx.stroke();

    // Current Gear Box (Bottom-Left inside HUD card)
    const gearBoxX = hudX + 16;
    const gearBoxY = hudY + 82;
    const gearBoxW = 76;
    const gearBoxH = 48;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.strokeStyle = isRedline ? 'rgba(239, 68, 68, 0.6)' : 'rgba(56, 189, 248, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(gearBoxX, gearBoxY, gearBoxW, gearBoxH, 8);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 9px monospace';
    ctx.fillText('GEAR', gearBoxX + gearBoxW / 2, gearBoxY + 13);

    ctx.fillStyle = isRedline ? '#EF4444' : '#38BDF8';
    ctx.font = '700 26px monospace';
    ctx.fillText(`${gear}`, gearBoxX + gearBoxW / 2, gearBoxY + 41);

    // Lap Timer Readout (Bottom-Right inside HUD card)
    const lapX = gearBoxX + gearBoxW + 14;
    const lapRight = hudX + hudW - 16;
    const mins = Math.floor(lapTimeSec / 60);
    const secs = (lapTimeSec % 60).toFixed(2).padStart(5, '0');

    ctx.textAlign = 'left';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 10px monospace';
    ctx.fillText('LAP TIMER', lapX, gearBoxY + 13);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#38BDF8';
    ctx.font = '600 10px monospace';
    ctx.fillText(`LAP 0${lap} / 0${totalLaps}`, lapRight, gearBoxY + 13);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 28px monospace';
    ctx.fillText(`${String(mins).padStart(2, '0')}:${secs}`, lapX, gearBoxY + 43);

    // 8. Top-Left Windshield Race Telemetry Banner (Position, Best Lap, Nitro)
    ctx.fillStyle = 'rgba(8, 12, 20, 0.86)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(88, 18, 246, 56, 10);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#38BDF8';
    ctx.font = '700 16px monospace';
    ctx.fillText(`P${position}/${totalCars}`, 102, 41);

    const bestLabel =
      bestLapSec !== null
        ? `${String(Math.floor(bestLapSec / 60)).padStart(2, '0')}:${(bestLapSec % 60).toFixed(2).padStart(5, '0')}`
        : '--:--.--';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '600 11px monospace';
    ctx.fillText(`BEST ${bestLabel}`, 172, 40);

    ctx.fillStyle = nitroActive ? '#38BDF8' : '#64748B';
    ctx.font = '600 9px monospace';
    ctx.fillText('NITRO', 102, 62);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.beginPath();
    ctx.roundRect(142, 54, 174, 9, 4);
    ctx.fill();
    ctx.fillStyle = nitroActive ? '#F59E0B' : '#38BDF8';
    ctx.beginPath();
    ctx.roundRect(142, 54, Math.max(4, 1.74 * nitroPct), 9, 4);
    ctx.fill();

    // Off-track rumble warning pill
    if (offTrack) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.88)';
      ctx.beginPath();
      ctx.roundRect(w - 252, 22, 164, 28, 7);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '700 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('OFF TRACK · CURB', w - 170, 40);
    }

    // 9. Race Start Countdown Lights Overlay OR Finish Checkered Flag Overlay
    if (phase === 'countdown') {
      ctx.fillStyle = 'rgba(8, 12, 20, 0.88)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(w / 2 - 140, 108, 280, 92, 14);
      ctx.fill();
      ctx.stroke();

      for (let li = 0; li < 3; li++) {
        const lit = li >= 3 - countdownVal;
        ctx.fillStyle = lit ? '#EF4444' : '#1E293B';
        ctx.beginPath();
        ctx.arc(w / 2 - 56 + li * 56, 142, 16, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.textAlign = 'center';
      ctx.fillStyle = '#F8FAFC';
      ctx.font = '700 15px monospace';
      ctx.fillText(`LIGHTS IN ${countdownVal}... HOLD [W]`, w / 2, 184);
    } else if (phase === 'finished') {
      ctx.fillStyle = 'rgba(8, 12, 20, 0.9)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(w / 2 - 180, 108, 360, 108, 14);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = 'center';
      ctx.fillStyle = '#38BDF8';
      ctx.font = '700 13px monospace';
      ctx.fillText('CHECKERED FLAG · RACE COMPLETE', w / 2, 138);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = '700 26px monospace';
      ctx.fillText(`FINISHED P${position} / ${totalCars}`, w / 2, 174);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 12px monospace';
      ctx.fillText(`BEST LAP ${bestLabel} · CLICK RESTART TO RACE AGAIN`, w / 2, 200);
    }

    texture.needsUpdate = true;
  };

  return { texture, drawFrame };
}

export function createPhoneScreenTexture(charging: boolean, battery = 64): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0c1017';
    ctx.fillRect(0, 0, 256, 512);

    ctx.fillStyle = '#F8F9FA';
    ctx.font = '600 44px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('10:42', 128, 126);

    ctx.fillStyle = '#9CA3AF';
    ctx.font = '500 16px monospace';
    ctx.fillText('JASHED MOBILE', 128, 164);

    ctx.strokeStyle = charging ? '#22C55E' : '#64748B';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(44, 236, 168, 64, 14);
    ctx.stroke();

    ctx.fillStyle = charging ? '#22C55E' : '#38BDF8';
    ctx.fillRect(52, 244, Math.max(12, Math.round((battery / 100) * 152)), 48);

    ctx.fillStyle = '#F8F9FA';
    ctx.font = '700 20px monospace';
    ctx.fillText(charging ? `CHARGING ${battery}%` : `${battery}%`, 128, 344);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createWallSwitchPlateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 512, 320);
    grad.addColorStop(0, '#22262e');
    grad.addColorStop(1, '#14171d');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);

    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 496, 304);

    ctx.fillStyle = 'rgba(248, 249, 250, 0.78)';
    ctx.font = '600 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STUDIO WALL SWITCHBOARD', 256, 36);

    const labels = ['CEILING', 'DESK', 'LED WALL', 'LAMP', 'FAN', 'AC'];
    const cols = 3;
    labels.forEach((lbl, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = 104 + col * 152;
      const cy = row === 0 ? 150 : 284;
      ctx.fillStyle = 'rgba(248, 249, 250, 0.88)';
      ctx.font = '600 16px sans-serif';
      ctx.fillText(lbl, cx, cy);
    });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
