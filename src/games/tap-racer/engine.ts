import { TAP_RACER_CONFIG } from './config';
import { SoundFX } from './audio';

export type TapRacerState = 'IDLE' | 'PLAYING' | 'PAUSED' | 'GAMEOVER';

export interface TrafficCar {
  lane: number;
  y: number;
  width: number;
  height: number;
  color: string;
  speedMult: number;
  passed: boolean;
}

export interface TrailPoint {
  x: number;
  y: number;
  life: number;
}

export interface SpeedStreak {
  x: number;
  y: number;
  len: number;
  speed: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface TapRacerSnapshot {
  state: TapRacerState;
  score: number;
  highScore: number;
  combo: number;
  boostPct: number;
  speedKmh: number;
  rpm: number;
  gear: number;
  lap: number;
  lapTimeSec: number;
  boostActive: boolean;
}

export interface TapRacerRendererContract {
  getLogicalSize: () => { width: number; height: number };
  draw: (engine: TapRacerEngine) => void;
}

const STORAGE_KEY = 'futuristic_2d_racer_best';

export class TapRacerEngine {
  public renderer: TapRacerRendererContract;
  public sfx: SoundFX;
  public onStateChange: (snapshot: TapRacerSnapshot) => void;
  public reducedMotion: boolean;

  public state: TapRacerState = 'IDLE';
  public score = 0;
  public highScore = 0;
  public combo = 1;
  public boost = 100;
  public boosting = false;
  public speed: number = TAP_RACER_CONFIG.BASE_SPEED;
  public roadOffset = 0;
  public spawnTimer = 0.7;
  public shakeTime = 0;

  // Real-time vehicle telemetry derived from engine state
  public speedKmh = 0;
  public rpm = 1100;
  public gear = 1;
  public lap = 1;
  public lapTimeSec = 0;

  public player = {
    lane: 1,
    x: 0, // normalized -1 to +1 across lanes
    yRatio: 0.78,
    width: 36,
    height: 64,
    trail: [] as TrailPoint[],
  };

  public traffic: TrafficCar[] = [];
  public particles: Particle[] = [];
  public streaks: SpeedStreak[] = [];

  private rafId: number | null = null;
  private lastTime = 0;
  private lastNotifyAt = 0;
  private baseSpeedTrack: number = TAP_RACER_CONFIG.BASE_SPEED;

  constructor({
    renderer,
    sfx,
    onStateChange,
    reducedMotion = false,
  }: {
    renderer: TapRacerRendererContract;
    sfx: SoundFX;
    onStateChange?: (snapshot: TapRacerSnapshot) => void;
    reducedMotion?: boolean;
  }) {
    this.renderer = renderer;
    this.sfx = sfx;
    this.onStateChange = onStateChange || (() => {});
    this.reducedMotion = reducedMotion;

    try {
      this.highScore = Number(window.localStorage.getItem(STORAGE_KEY) || 0) || 0;
    } catch {
      this.highScore = 0;
    }

    this.resetWorld();
  }

  public resetWorld() {
    this.score = 0;
    this.combo = 1;
    this.boost = 100;
    this.boosting = false;
    this.baseSpeedTrack = TAP_RACER_CONFIG.BASE_SPEED;
    this.speed = TAP_RACER_CONFIG.BASE_SPEED;
    this.roadOffset = 0;
    this.spawnTimer = 0.7;
    this.shakeTime = 0;

    this.speedKmh = 0;
    this.rpm = 1100;
    this.gear = 1;
    this.lap = 1;
    this.lapTimeSec = 0;

    this.player.lane = 1;
    this.player.x = 0;
    this.player.trail = [];
    this.traffic = [];
    this.particles = [];
    this.streaks = [];
  }

  public getSnapshot(): TapRacerSnapshot {
    return {
      state: this.state,
      score: Math.floor(this.score),
      highScore: this.highScore,
      combo: this.combo,
      boostPct: Math.round(this.boost),
      speedKmh: Math.round(this.speedKmh),
      rpm: this.rpm,
      gear: this.gear,
      lap: this.lap,
      lapTimeSec: this.lapTimeSec,
      boostActive: this.boosting,
    };
  }

  public start() {
    this.resetWorld();
    this.setState('PLAYING');
    this.sfx.setEngineActive(true);
    this.sfx.tap();
  }

  public setState(next: TapRacerState) {
    this.state = next;
    if (next !== 'PLAYING') {
      this.boosting = false;
      this.sfx.setEngineActive(false);
    } else {
      this.sfx.setEngineActive(true);
    }
    this.onStateChange(this.getSnapshot());
  }

  public steer(dir: -1 | 1) {
    if (this.state === 'IDLE' || this.state === 'GAMEOVER') {
      this.start();
      return;
    }
    if (this.state !== 'PLAYING') return;

    const nextLane = Math.max(0, Math.min(TAP_RACER_CONFIG.LANES - 1, this.player.lane + dir));
    if (nextLane !== this.player.lane) {
      this.player.lane = nextLane;
      this.sfx.tap();
    }
  }

  public center() {
    if (this.state === 'IDLE' || this.state === 'GAMEOVER') {
      this.start();
      return;
    }
    if (this.state !== 'PLAYING') return;
    if (this.player.lane !== 1) {
      this.player.lane = 1;
      this.sfx.tap();
    }
  }

  public setBoost(active: boolean) {
    if (this.state !== 'PLAYING') {
      this.boosting = false;
      return;
    }
    const next = Boolean(active && this.boost > 4);
    if (next && !this.boosting) {
      this.sfx.boost();
    }
    this.boosting = next;
  }

  public runLoop() {
    this.lastTime = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - this.lastTime) / 1000, 0.05);
      this.lastTime = now;

      this.update(dt);
      this.renderer.draw(this);

      if (now - this.lastNotifyAt >= 50) {
        this.lastNotifyAt = now;
        this.onStateChange(this.getSnapshot());
      }

      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  public stopLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.sfx.setEngineActive(false);
  }

  private update(dt: number) {
    if (this.shakeTime > 0) {
      this.shakeTime = Math.max(0, this.shakeTime - dt);
    }
    if (this.state === 'PAUSED') return;

    // Smooth horizontal lane interpolation
    const targetNormX = (this.player.lane / (TAP_RACER_CONFIG.LANES - 1)) * 2 - 1;
    this.player.x +=
      (targetNormX - this.player.x) * Math.min(1, TAP_RACER_CONFIG.LANE_LERP_SPEED * dt);

    const idleSpeed = TAP_RACER_CONFIG.BASE_SPEED * 0.35;
    if (this.state !== 'PLAYING') {
      this.roadOffset = (this.roadOffset + idleSpeed * dt) % 80;
      if (this.state === 'IDLE') {
        this.speedKmh = 0;
        this.gear = 1;
        this.rpm = 1100;
      }
      this.updateParticles(dt);
      return;
    }

    // Boost drain / recharge & velocity curve
    if (this.boosting && this.boost > 0) {
      this.boost = Math.max(0, this.boost - TAP_RACER_CONFIG.BOOST_DRAIN * dt);
      if (this.boost <= 0) {
        this.boost = 0;
        this.boosting = false;
      }
    } else {
      this.boost = Math.min(100, this.boost + TAP_RACER_CONFIG.BOOST_RECHARGE * dt);
    }

    this.baseSpeedTrack = Math.min(
      TAP_RACER_CONFIG.MAX_SPEED,
      this.baseSpeedTrack + TAP_RACER_CONFIG.SPEED_RAMP * dt
    );
    const maxBoostSpeed = TAP_RACER_CONFIG.MAX_SPEED * TAP_RACER_CONFIG.BOOST_MULT;
    const targetSpeed = this.boosting
      ? Math.min(maxBoostSpeed, this.baseSpeedTrack * TAP_RACER_CONFIG.BOOST_MULT)
      : this.baseSpeedTrack;

    this.speed += (targetSpeed - this.speed) * Math.min(1, dt * 8);
    this.roadOffset = (this.roadOffset + this.speed * dt) % 80;

    const prevScore = this.score;
    this.score += this.speed * dt * 0.055 * this.combo;
    this.lapTimeSec += dt;

    // Circuit lap progression
    const prevLap = Math.floor(prevScore / TAP_RACER_CONFIG.LAP_DISTANCE_UNITS) + 1;
    const nextLap = Math.floor(this.score / TAP_RACER_CONFIG.LAP_DISTANCE_UNITS) + 1;
    if (nextLap > prevLap) {
      this.lap = nextLap;
      this.lapTimeSec = 0;
      this.sfx.nearMiss();
    }

    // Engine audio & cockpit telemetry (km/h, 6-speed gearbox, RPM)
    this.sfx.updateEngine(this.speed, maxBoostSpeed, this.boosting);
    const targetKmh = Math.min(320, Math.max(68, (this.speed / maxBoostSpeed) * 320));
    this.speedKmh += (targetKmh - this.speedKmh) * Math.min(1, dt * 10);
    const gearSpan = 53;
    this.gear = Math.min(6, Math.max(1, Math.ceil(this.speedKmh / gearSpan)));
    const gearMin = (this.gear - 1) * gearSpan;
    const gearProgress = Math.min(1, Math.max(0, (this.speedKmh - gearMin) / gearSpan));
    this.rpm = Math.round(
      Math.min(8950, 2250 + gearProgress * 6100 + (this.boosting ? 560 : 0))
    );

    // Spawn rivals
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnRival();
      const speedFactor = TAP_RACER_CONFIG.BASE_SPEED / this.speed;
      this.spawnTimer =
        (TAP_RACER_CONFIG.SPAWN_INTERVAL_MIN +
          Math.random() *
            (TAP_RACER_CONFIG.SPAWN_INTERVAL_MAX - TAP_RACER_CONFIG.SPAWN_INTERVAL_MIN)) *
        Math.max(0.5, speedFactor);
    }

    const { width, height } = this.renderer.getLogicalSize();
    const roadW = width * TAP_RACER_CONFIG.ROAD_WIDTH_RATIO;
    const px = width / 2 + this.player.x * (roadW * 0.36);
    const py = height * this.player.yRatio;

    // Player neon trail ribbon
    this.player.trail.unshift({ x: px, y: py + this.player.height * 0.44, life: 0.24 });
    if (this.player.trail.length > 14) {
      this.player.trail.pop();
    }
    for (let i = this.player.trail.length - 1; i >= 0; i--) {
      this.player.trail[i].y += this.speed * 0.35 * dt;
      this.player.trail[i].life -= dt;
      if (this.player.trail[i].life <= 0) {
        this.player.trail.splice(i, 1);
      }
    }

    // Speed streaks across frame
    if (Math.random() < (this.boosting ? 0.85 : 0.35)) {
      this.streaks.push({
        x: Math.random() * width,
        y: -24,
        len: 18 + Math.random() * 28,
        speed: this.speed * 1.35,
      });
    }
    for (let i = this.streaks.length - 1; i >= 0; i--) {
      this.streaks[i].y += this.streaks[i].speed * dt;
      if (this.streaks[i].y > height + 30) {
        this.streaks.splice(i, 1);
      }
    }

    // Rival movement, collision & near-miss streak + boost reward
    const laneStep = (roadW * 0.72) / (TAP_RACER_CONFIG.LANES - 1);
    for (let i = this.traffic.length - 1; i >= 0; i--) {
      const car = this.traffic[i];
      car.y += this.speed * car.speedMult * dt;
      const cx =
        width / 2 + ((car.lane / (TAP_RACER_CONFIG.LANES - 1)) * 2 - 1) * (roadW * 0.36);

      const hitW = (this.player.width + car.width) * 0.5 * TAP_RACER_CONFIG.HITBOX_SCALE;
      const hitH = (this.player.height + car.height) * 0.5 * TAP_RACER_CONFIG.HITBOX_SCALE;

      if (Math.abs(px - cx) < hitW && Math.abs(py - car.y) < hitH) {
        this.crash(px, py);
        return;
      }

      if (!car.passed && car.y > py + this.player.height * 0.5) {
        car.passed = true;
        if (Math.abs(px - cx) < laneStep * 1.15) {
          this.combo = Math.min(5, this.combo + 1);
          this.boost = Math.min(100, this.boost + 15);
          this.score += 30 * this.combo;
          this.sfx.nearMiss();
        }
      }

      if (car.y > height + 100) {
        this.traffic.splice(i, 1);
      }
    }

    this.updateParticles(dt);
  }

  private spawnRival() {
    const blockedLanes = new Set(this.traffic.filter((c) => c.y < 95).map((c) => c.lane));
    const openLanes = [0, 1, 2].filter((l) => !blockedLanes.has(l));
    const pool = openLanes.length > 0 ? openLanes : [0, 1, 2];
    const lane = pool[Math.floor(Math.random() * pool.length)];
    const color =
      TAP_RACER_CONFIG.COLORS.rivals[
        Math.floor(Math.random() * TAP_RACER_CONFIG.COLORS.rivals.length)
      ];

    this.traffic.push({
      lane,
      y: -80,
      width: 36,
      height: 62,
      color,
      speedMult: 0.62 + Math.random() * 0.18,
      passed: false,
    });
  }

  private crash(x: number, y: number) {
    this.sfx.crash();
    this.boosting = false;
    this.shakeTime = this.reducedMotion ? 0 : 0.32;
    const finalScore = Math.floor(this.score);
    if (finalScore > this.highScore) {
      this.highScore = finalScore;
      try {
        window.localStorage.setItem(STORAGE_KEY, String(finalScore));
      } catch {
        // ignore storage limits
      }
    }

    for (let i = 0; i < 28; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 90 + Math.random() * 260;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.45 + Math.random() * 0.25,
        color:
          i % 2 === 0
            ? TAP_RACER_CONFIG.COLORS.railGlow
            : TAP_RACER_CONFIG.COLORS.boostGlow,
      });
    }

    this.setState('GAMEOVER');
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }
}
