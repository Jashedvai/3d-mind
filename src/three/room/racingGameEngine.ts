import { RacePhase, RacingTelemetry } from './roomTypes';

export interface RivalCarState {
  id: number;
  lane: number; // -0.68 to +0.68 across asphalt
  distanceM: number; // total circuit progress in meters
  baseSpeedKmh: number;
  color: string;
}

export interface RacingGameEngineState {
  phase: RacePhase;
  countdownTimer: number; // counts down from 2.4s -> 0
  countdownVal: number; // 3, 2, 1, 0
  speedKmh: number;
  rpm: number;
  gear: number;
  steerDeg: number; // visual wheel angle (-85..+85)
  playerX: number; // -1.25..+1.25 (-1..+1 is asphalt)
  distanceM: number;
  lapLengthM: number;
  lap: number;
  totalLaps: number;
  lapTimeSec: number;
  bestLapSec: number | null;
  position: number;
  totalCars: number;
  nitroPct: number;
  nitroActive: boolean;
  offTrack: boolean;
  collisionTimer: number;
  trackCurvature: number; // -1..+1 curve intensity
  rivals: RivalCarState[];
}

const RIVAL_COLORS = ['#EF4444', '#38BDF8', '#F59E0B', '#22C55E', '#E2E8F0'];

function createInitialRivals(): RivalCarState[] {
  return [
    { id: 1, lane: -0.42, distanceM: 58, baseSpeedKmh: 162, color: RIVAL_COLORS[0] },
    { id: 2, lane: 0.44, distanceM: 124, baseSpeedKmh: 176, color: RIVAL_COLORS[1] },
    { id: 3, lane: -0.15, distanceM: 210, baseSpeedKmh: 192, color: RIVAL_COLORS[2] },
    { id: 4, lane: 0.52, distanceM: 320, baseSpeedKmh: 205, color: RIVAL_COLORS[3] },
    { id: 5, lane: -0.5, distanceM: 445, baseSpeedKmh: 218, color: RIVAL_COLORS[4] },
  ];
}

export function createRacingGameEngine(): RacingGameEngineState {
  return {
    phase: 'standby',
    countdownTimer: 2.4,
    countdownVal: 3,
    speedKmh: 0,
    rpm: 1100,
    gear: 1,
    steerDeg: 0,
    playerX: 0,
    distanceM: 0,
    lapLengthM: 1200,
    lap: 1,
    totalLaps: 3,
    lapTimeSec: 0,
    bestLapSec: null,
    position: 8,
    totalCars: 12,
    nitroPct: 100,
    nitroActive: false,
    offTrack: false,
    collisionTimer: 0,
    trackCurvature: 0,
    rivals: createInitialRivals(),
  };
}

export function resetRacingGameEngine(state: RacingGameEngineState, startActive: boolean) {
  state.phase = startActive ? 'countdown' : 'standby';
  state.countdownTimer = 2.4;
  state.countdownVal = 3;
  state.speedKmh = 0;
  state.rpm = 1100;
  state.gear = 1;
  state.steerDeg = 0;
  state.playerX = 0;
  state.distanceM = 0;
  state.lap = 1;
  state.lapTimeSec = 0;
  state.bestLapSec = null;
  state.position = 8;
  state.nitroPct = 100;
  state.nitroActive = false;
  state.offTrack = false;
  state.collisionTimer = 0;
  state.trackCurvature = 0;
  state.rivals = createInitialRivals();
}

export interface StepInput {
  gamingMode: boolean;
  throttle: boolean;
  brake: boolean;
  steerDir: number; // -1 left, 0 neutral, +1 right
  manualSteerDeg: number; // fallback angle if buttons clicked
  nitro: boolean;
  dt: number;
}

export function stepRacingGameEngine(state: RacingGameEngineState, input: StepInput) {
  const { gamingMode, throttle, brake, steerDir, manualSteerDeg, nitro, dt } = input;

  if (!gamingMode) {
    if (state.phase !== 'standby') {
      resetRacingGameEngine(state, false);
    }
    return;
  }

  // Transition from standby into snappy race countdown
  if (state.phase === 'standby') {
    resetRacingGameEngine(state, true);
  }

  // Countdown phase (2.4 seconds: 3 -> 2 -> 1 -> GO)
  if (state.phase === 'countdown') {
    state.countdownTimer = Math.max(0, state.countdownTimer - dt);
    state.countdownVal = Math.ceil((state.countdownTimer / 2.4) * 3);
    // Allow revving engine on the grid during countdown!
    const targetRevRpm = throttle ? 6800 + Math.sin(performance.now() * 0.03) * 420 : 1450;
    state.rpm = Math.round(state.rpm + (targetRevRpm - state.rpm) * Math.min(1, dt * 10));
    // Smooth steering wheel wiggle check on grid
    const desiredSteer = steerDir !== 0 ? steerDir * 58 : manualSteerDeg;
    state.steerDeg += (desiredSteer - state.steerDeg) * Math.min(1, dt * 9);
    if (state.countdownTimer <= 0) {
      state.phase = 'racing';
      state.countdownVal = 0;
      state.speedKmh = throttle ? 42 : 18;
    }
    return;
  }

  // Finished phase: gentle victory cooldown cruise
  if (state.phase === 'finished') {
    state.speedKmh = Math.max(0, state.speedKmh - 55 * dt);
    state.rpm = Math.round(1150 + state.speedKmh * 12);
    state.nitroActive = false;
    return;
  }

  // === ACTIVE RACING SIMULATION ===
  if (state.collisionTimer > 0) {
    state.collisionTimer = Math.max(0, state.collisionTimer - dt);
  }

  // Steering input + auto-centering
  const desiredSteerDeg = steerDir !== 0 ? steerDir * 68 : manualSteerDeg;
  state.steerDeg += (desiredSteerDeg - state.steerDeg) * Math.min(1, dt * 10);

  // Dynamic procedural track curvature based on distance along circuit
  const rawCurve =
    Math.sin(state.distanceM * 0.0085) * 0.65 + Math.cos(state.distanceM * 0.021) * 0.35;
  state.trackCurvature = Math.max(-1, Math.min(1, rawCurve));

  // Lateral position update: steering moves car, corner centrifugal force pulls slightly outward
  const speedRatio = Math.min(1, state.speedKmh / 180);
  const lateralRate = (state.steerDeg / 68) * 1.45 * (0.25 + speedRatio * 0.75);
  const centrifugalDrift = -state.trackCurvature * speedRatio * 0.32;
  state.playerX = Math.max(-1.28, Math.min(1.28, state.playerX + (lateralRate + centrifugalDrift) * dt));
  state.offTrack = Math.abs(state.playerX) > 0.98;

  // Nitro boost management
  const canNitro = nitro && state.nitroPct > 4 && !brake;
  state.nitroActive = canNitro;
  if (canNitro) {
    state.nitroPct = Math.max(0, state.nitroPct - 28 * dt);
  } else {
    state.nitroPct = Math.min(100, state.nitroPct + (throttle ? 7.5 : 11) * dt);
  }

  // Longitudinal speed physics
  let targetSpeed = 128; // baseline roll/gear cruise if neither gas nor brake held
  let accelRate = 1.4;

  if (brake) {
    targetSpeed = 18;
    accelRate = 5.2;
  } else if (throttle && canNitro) {
    targetSpeed = 314;
    accelRate = 3.2;
  } else if (throttle) {
    targetSpeed = 276;
    accelRate = 2.1;
  } else if (canNitro) {
    targetSpeed = 292;
    accelRate = 2.8;
  }

  // Off-track grass/gravel drag & corner scrub penalty
  if (state.offTrack) {
    targetSpeed = Math.min(targetSpeed, 132);
    accelRate = Math.max(accelRate, 3.1);
  }
  if (Math.abs(state.steerDeg) > 35 && state.speedKmh > 170) {
    targetSpeed -= (Math.abs(state.steerDeg) - 35) * 0.55;
  }

  state.speedKmh += (targetSpeed - state.speedKmh) * Math.min(1, dt * accelRate);
  state.speedKmh = Math.max(0, Math.min(320, state.speedKmh));

  // Distance & Lap Timer Progression
  const prevDistance = state.distanceM;
  state.distanceM += (state.speedKmh / 3.6) * dt;
  state.lapTimeSec += dt;

  const prevLapIndex = Math.floor(prevDistance / state.lapLengthM);
  const nextLapIndex = Math.floor(state.distanceM / state.lapLengthM);

  if (nextLapIndex > prevLapIndex) {
    if (state.bestLapSec === null || state.lapTimeSec < state.bestLapSec) {
      state.bestLapSec = state.lapTimeSec;
    }
    if (state.lap >= state.totalLaps) {
      state.phase = 'finished';
    } else {
      state.lap += 1;
      state.lapTimeSec = 0;
    }
  }

  // 6-speed Sequential Gearbox & Engine RPM
  const gearSpan = 48;
  const gear = Math.min(6, Math.max(1, Math.ceil(Math.max(1, state.speedKmh) / gearSpan)));
  const gearMinSpeed = (gear - 1) * gearSpan;
  const gearProgress = Math.min(1, Math.max(0, (state.speedKmh - gearMinSpeed) / gearSpan));
  state.gear = gear;
  state.rpm = Math.round(
    Math.min(
      8950,
      1900 + gearProgress * 6250 + (throttle ? 480 : 0) + (canNitro ? 350 : 0)
    )
  );

  // Rival GT Cars simulation + overtaking + collision detection
  let carsAhead = 0;
  for (const rival of state.rivals) {
    // Rivals weave subtly through corners
    rival.distanceM += (rival.baseSpeedKmh / 3.6) * dt;

    // Recycle rival cars far behind back ahead of the pack so circuit stays lively
    const relDist = rival.distanceM - state.distanceM;
    if (relDist < -38) {
      rival.distanceM = state.distanceM + 260 + ((rival.id * 73) % 140);
      rival.lane = ((rival.id % 3) - 1) * 0.44;
    } else if (relDist > 480) {
      rival.distanceM = state.distanceM + 110 + ((rival.id * 49) % 120);
    }

    // Collision check when right alongside rival in same lane
    if (relDist > -3.5 && relDist < 6.5 && Math.abs(rival.lane - state.playerX) < 0.24) {
      if (state.collisionTimer <= 0 && state.speedKmh > 65) {
        state.collisionTimer = 0.65;
        state.speedKmh = Math.max(45, state.speedKmh * 0.72);
        // Nudge car cleanly out of collision overlap
        state.playerX += state.playerX >= rival.lane ? 0.22 : -0.22;
      }
    }

    if (rival.distanceM > state.distanceM) {
      carsAhead += 1;
    }
  }

  // Position scales smoothly from P8 down to P1 based on overtakes & pace
  const lapBonus = (state.lap - 1) * 1;
  state.position = Math.max(1, Math.min(state.totalCars, 2 + carsAhead - lapBonus));
}

export function getTelemetrySnapshot(state: RacingGameEngineState): RacingTelemetry {
  return {
    speedKmh: Math.round(state.speedKmh),
    gear: state.gear,
    rpm: state.rpm,
    lapTimeSec: state.lapTimeSec,
    bestLapSec: state.bestLapSec,
    lap: state.lap,
    totalLaps: state.totalLaps,
    position: state.position,
    totalCars: state.totalCars,
    nitroPct: Math.round(state.nitroPct),
    nitroActive: state.nitroActive,
    phase: state.phase,
    countdownVal: state.countdownVal,
    offTrack: state.offTrack,
    steerDeg: Math.round(state.steerDeg),
  };
}
