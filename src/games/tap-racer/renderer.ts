import { TAP_RACER_CONFIG } from './config';
import { TapRacerEngine, TapRacerRendererContract } from './engine';

export class CanvasRenderer implements TapRacerRendererContract {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private logicalW = 360;
  private logicalH = 260;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('2D Canvas context unavailable');
    }
    this.ctx = context;
    this.resize();
  }

  public resize() {
    const parent = this.canvas.parentElement;
    const rect = parent?.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.logicalW = Math.max(240, rect?.width || 360);
    this.logicalH = Math.max(220, rect?.height || 260);

    this.canvas.width = Math.floor(this.logicalW * dpr);
    this.canvas.height = Math.floor(this.logicalH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  public getLogicalSize() {
    return { width: this.logicalW, height: this.logicalH };
  }

  public draw(engine: TapRacerEngine) {
    const { ctx, logicalW: w, logicalH: h } = this;
    ctx.save();

    if (engine.shakeTime > 0 && !engine.reducedMotion) {
      const mag = engine.shakeTime * 22;
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }

    // 1. Deep Obsidian Shoulder & Road Surface
    ctx.fillStyle = TAP_RACER_CONFIG.COLORS.bg;
    ctx.fillRect(0, 0, w, h);

    const roadW = w * TAP_RACER_CONFIG.ROAD_WIDTH_RATIO;
    const roadX = (w - roadW) / 2;

    ctx.fillStyle = TAP_RACER_CONFIG.COLORS.shoulder;
    ctx.fillRect(0, 0, roadX, h);
    ctx.fillRect(roadX + roadW, 0, roadX, h);

    ctx.fillStyle = TAP_RACER_CONFIG.COLORS.road;
    ctx.fillRect(roadX, 0, roadW, h);

    // Subtle futuristic telemetry grid & center chevrons
    ctx.strokeStyle = TAP_RACER_CONFIG.COLORS.gridLine;
    ctx.lineWidth = 1;
    const gridSpacing = 40;
    const gridYOffset = (engine.roadOffset * 0.5) % gridSpacing;
    for (let gy = gridYOffset; gy < h; gy += gridSpacing) {
      ctx.beginPath();
      ctx.moveTo(roadX, gy);
      ctx.lineTo(roadX + roadW, gy);
      ctx.stroke();
    }

    // Glowing Cyan / Amber Highway Edge Rails
    const railColor = engine.boosting
      ? TAP_RACER_CONFIG.COLORS.boostGlow
      : TAP_RACER_CONFIG.COLORS.railGlow;
    ctx.fillStyle = railColor;
    ctx.fillRect(roadX, 0, 3, h);
    ctx.fillRect(roadX + roadW - 3, 0, 3, h);

    // Soft side rail aura
    ctx.fillStyle = engine.boosting ? 'rgba(245, 158, 11, 0.14)' : 'rgba(34, 211, 238, 0.12)';
    ctx.fillRect(roadX + 3, 0, 8, h);
    ctx.fillRect(roadX + roadW - 11, 0, 8, h);

    // Dashed Lane Dividers
    ctx.strokeStyle = TAP_RACER_CONFIG.COLORS.laneDivider;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([34, 46]);
    ctx.lineDashOffset = -engine.roadOffset;
    for (let i = 1; i < TAP_RACER_CONFIG.LANES; i++) {
      const lx = roadX + (roadW / TAP_RACER_CONFIG.LANES) * i;
      ctx.beginPath();
      ctx.moveTo(lx, -80);
      ctx.lineTo(lx, h + 80);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 2. Speed Streaks
    for (const st of engine.streaks) {
      ctx.strokeStyle = engine.boosting
        ? 'rgba(245, 158, 11, 0.35)'
        : 'rgba(34, 211, 238, 0.22)';
      ctx.lineWidth = engine.boosting ? 2 : 1.2;
      ctx.beginPath();
      ctx.moveTo(st.x, st.y);
      ctx.lineTo(st.x, st.y + st.len);
      ctx.stroke();
    }

    // 3. Player Neon Trail Ribbon
    if (engine.player.trail.length > 1) {
      for (let i = 0; i < engine.player.trail.length - 1; i++) {
        const pt = engine.player.trail[i];
        const next = engine.player.trail[i + 1];
        const alpha = Math.max(0, pt.life / 0.24) * (engine.boosting ? 0.65 : 0.36);
        ctx.strokeStyle = engine.boosting
          ? `rgba(245, 158, 11, ${alpha})`
          : `rgba(94, 234, 212, ${alpha})`;
        ctx.lineWidth = Math.max(2, 12 * (pt.life / 0.24));
        ctx.beginPath();
        ctx.moveTo(pt.x - 8, pt.y);
        ctx.lineTo(next.x - 8, next.y);
        ctx.moveTo(pt.x + 8, pt.y);
        ctx.lineTo(next.x + 8, next.y);
        ctx.stroke();
      }
    }

    // 4. Rival GT Cars
    for (const car of engine.traffic) {
      const cx = w / 2 + ((car.lane / (TAP_RACER_CONFIG.LANES - 1)) * 2 - 1) * (roadW * 0.36);
      this.drawCar(cx, car.y, car.width, car.height, car.color, '#0F172A', false, false);
    }

    // 5. Player Vector Car with Underglow & Boost Exhaust
    const px = w / 2 + engine.player.x * (roadW * 0.36);
    const py = h * engine.player.yRatio;
    this.drawCar(
      px,
      py,
      engine.player.width,
      engine.player.height,
      TAP_RACER_CONFIG.COLORS.playerBody,
      TAP_RACER_CONFIG.COLORS.playerTrim,
      true,
      engine.boosting
    );

    // 6. Crash Spark Bursts
    for (const p of engine.particles) {
      ctx.globalAlpha = Math.max(0, p.life * 1.5);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x - 2.5, p.y - 2.5, 5, 5);
    }
    ctx.globalAlpha = 1;

    // 7. Futuristic Top Telemetry Strip + Bottom-Right Real-Time HUD + Overlays
    this.drawHUD(engine, w, h);
    ctx.restore();
  }

  private drawCar(
    cx: number,
    cy: number,
    w: number,
    h: number,
    bodyColor: string,
    trimColor: string,
    isPlayer: boolean,
    boosting: boolean
  ) {
    const { ctx } = this;
    const x = cx - w / 2;
    const y = cy - h / 2;

    // Underglow halo for player
    if (isPlayer) {
      ctx.fillStyle = boosting ? 'rgba(245, 158, 11, 0.24)' : 'rgba(34, 211, 238, 0.2)';
      ctx.beginPath();
      ctx.roundRect(x - 4, y - 4, w + 8, h + 8, 12);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(x + 2, y + 4, w, h, 8);
      ctx.fill();
    }

    // Aerodynamic Bodywork
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 9);
    ctx.fill();

    // Hood / Roof Center Stripe
    if (isPlayer) {
      ctx.fillStyle = trimColor;
      ctx.fillRect(cx - 2, y + 4, 4, h - 10);
    }

    // Canopy Glass
    ctx.fillStyle = '#070B14';
    ctx.beginPath();
    ctx.roundRect(x + 5, y + (isPlayer ? 15 : 21), w - 10, h * 0.42, 4);
    ctx.fill();

    // Headlights / Tail Lights / Boost Flare
    if (isPlayer) {
      ctx.fillStyle = '#E0F2FE';
      ctx.fillRect(x + 5, y + 3, 7, 4);
      ctx.fillRect(x + w - 12, y + 3, 7, 4);

      ctx.fillStyle = boosting ? '#F59E0B' : '#EF4444';
      ctx.fillRect(x + 5, y + h - 5, 8, 3.5);
      ctx.fillRect(x + w - 13, y + h - 5, 8, 3.5);
    } else {
      ctx.fillStyle = '#EF4444';
      ctx.fillRect(x + 5, y + h - 6, 8, 3.5);
      ctx.fillRect(x + w - 13, y + h - 6, 8, 3.5);
    }
  }

  private drawHUD(engine: TapRacerEngine, w: number, h: number) {
    const { ctx } = this;

    // Top Futuristic Telemetry Bar
    ctx.fillStyle = TAP_RACER_CONFIG.COLORS.hudBg;
    ctx.strokeStyle = TAP_RACER_CONFIG.COLORS.hudBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(8, 8, w - 16, 30, 8);
    ctx.fill();
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = TAP_RACER_CONFIG.COLORS.text;
    ctx.font = '700 11px monospace';
    ctx.fillText(`SCR ${Math.floor(engine.score)}`, 16, 27);

    ctx.fillStyle = TAP_RACER_CONFIG.COLORS.railGlow;
    ctx.fillText(`BST ${engine.highScore}`, 98, 27);

    // Compact Boost Bar in top strip
    const boostBarX = w - 116;
    ctx.fillStyle = TAP_RACER_CONFIG.COLORS.muted;
    ctx.font = '600 9px monospace';
    ctx.fillText('BOOST', boostBarX, 20);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.beginPath();
    ctx.roundRect(boostBarX, 24, 96, 6, 3);
    ctx.fill();
    ctx.fillStyle = engine.boosting
      ? TAP_RACER_CONFIG.COLORS.boostGlow
      : TAP_RACER_CONFIG.COLORS.railGlow;
    ctx.beginPath();
    ctx.roundRect(boostBarX, 24, Math.max(3, 0.96 * engine.boost), 6, 3);
    ctx.fill();

    if (engine.combo > 1 && engine.state === 'PLAYING') {
      ctx.textAlign = 'left';
      ctx.fillStyle = TAP_RACER_CONFIG.COLORS.playerTrim;
      ctx.font = '700 11px monospace';
      ctx.fillText(`x${engine.combo} STREAK`, 14, 54);
    }

    // Real-Time Bottom-Right Console HUD: Engine RPM, Current Gear & Lap Timer
    const hudW = 152;
    const hudH = 68;
    const hudX = w - hudW - 10;
    const hudY = h - hudH - 10;
    const isRedline = engine.rpm >= 7600;
    const isWarn = engine.rpm >= 6400 && !isRedline;

    ctx.fillStyle = TAP_RACER_CONFIG.COLORS.hudBg;
    ctx.strokeStyle = isRedline ? 'rgba(239, 68, 68, 0.78)' : TAP_RACER_CONFIG.COLORS.hudBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(hudX, hudY, hudW, hudH, 8);
    ctx.fill();
    ctx.stroke();

    // RPM Header + Digital Readout
    ctx.textAlign = 'left';
    ctx.fillStyle = TAP_RACER_CONFIG.COLORS.muted;
    ctx.font = '600 9px monospace';
    ctx.fillText('RPM', hudX + 8, hudY + 13);

    ctx.textAlign = 'right';
    ctx.fillStyle = isRedline ? '#EF4444' : isWarn ? '#F59E0B' : '#F8FAFC';
    ctx.font = '700 10px monospace';
    ctx.fillText(`${engine.rpm.toLocaleString('en-US')}`, hudX + hudW - 8, hudY + 13);

    // 10-Segment Progressive RPM LED Strip
    const segCount = 10;
    const segGap = 2.5;
    const barW = hudW - 16;
    const segW = (barW - segGap * (segCount - 1)) / segCount;
    const litSegs = Math.round((Math.min(9000, engine.rpm) / 9000) * segCount);
    for (let s = 0; s < segCount; s++) {
      const sx = hudX + 8 + s * (segW + segGap);
      if (s < litSegs) {
        ctx.fillStyle = s >= 8 ? '#EF4444' : s >= 6 ? '#F59E0B' : s >= 4 ? '#22C55E' : '#22D3EE';
      } else {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.18)';
      }
      ctx.beginPath();
      ctx.roundRect(sx, hudY + 18, segW, 7, 1.5);
      ctx.fill();
    }

    // Current Gear Box
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.roundRect(hudX + 8, hudY + 31, 36, 29, 5);
    ctx.fill();

    ctx.textAlign = 'center';
    ctx.fillStyle = TAP_RACER_CONFIG.COLORS.muted;
    ctx.font = '600 8px monospace';
    ctx.fillText('GEAR', hudX + 26, hudY + 41);
    ctx.fillStyle = isRedline ? '#EF4444' : TAP_RACER_CONFIG.COLORS.railGlow;
    ctx.font = '700 14px monospace';
    ctx.fillText(`${engine.gear}`, hudX + 26, hudY + 56);

    // Live Lap Timer
    const mins = Math.floor(engine.lapTimeSec / 60);
    const secs = (engine.lapTimeSec % 60).toFixed(2).padStart(5, '0');

    ctx.textAlign = 'right';
    ctx.fillStyle = TAP_RACER_CONFIG.COLORS.railGlow;
    ctx.font = '600 8px monospace';
    ctx.fillText(`LAP 0${engine.lap}`, hudX + hudW - 8, hudY + 41);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 13px monospace';
    ctx.fillText(`${String(mins).padStart(2, '0')}:${secs}`, hudX + hudW - 8, hudY + 56);

    // State Overlays: IDLE, PAUSED, GAMEOVER
    if (engine.state === 'IDLE' || engine.state === 'PAUSED' || engine.state === 'GAMEOVER') {
      ctx.fillStyle = 'rgba(7, 10, 18, 0.78)';
      ctx.fillRect(0, 0, w, h);

      ctx.textAlign = 'center';
      ctx.fillStyle = TAP_RACER_CONFIG.COLORS.text;
      ctx.font = '700 20px sans-serif';
      const title =
        engine.state === 'IDLE'
          ? 'Apex Tap Racer'
          : engine.state === 'PAUSED'
            ? 'Race Paused'
            : 'Collision · Run Ended';
      ctx.fillText(title, w / 2, h * 0.42);

      ctx.font = '500 11px monospace';
      ctx.fillStyle = TAP_RACER_CONFIG.COLORS.playerTrim;
      const hint =
        engine.state === 'GAMEOVER'
          ? `SCORE ${Math.floor(engine.score)} · TAP OR RETRY TO RACE`
          : engine.state === 'PAUSED'
            ? 'PRESS P OR RESUME TO CONTINUE'
            : 'TAP LEFT / RIGHT OR ← → · SPACE TO BOOST';
      ctx.fillText(hint, w / 2, h * 0.54);
    }
  }
}
