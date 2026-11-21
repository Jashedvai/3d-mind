import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Flame,
  Gamepad2,
  OctagonX,
  Pause,
  Play,
  Power,
  RotateCcw,
  RotateCw,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { soundEngine } from '../../audio/soundEngine';
import { RacingTelemetry } from '../../three/room/roomTypes';
import { mountTapRacer, TapRacerBridge } from '../../games/tap-racer/console-bridge';
import { TapRacerSnapshot } from '../../games/tap-racer/engine';

interface GamingSetupProps {
  telemetry: RacingTelemetry;
  onToggleGamingMode: () => void;
  onSteerWheel: (deltaDeg: number, reset?: boolean) => void;
  onRacingInput: (throttle: boolean, brake: boolean, steerDir?: number, nitro?: boolean) => void;
  onRestartRace: () => void;
  onExitGamingView: () => void;
}

type ConsoleTab = 'cockpit' | 'tap-racer';

function formatLapClock(sec: number | null): string {
  if (sec === null) return '--:--.--';
  const mins = Math.floor(sec / 60);
  const rem = (sec % 60).toFixed(2).padStart(5, '0');
  return `${String(mins).padStart(2, '0')}:${rem}`;
}

/**
 * Interactive HUD for the Apex GT Racing Rig & Console Screen:
 * - Tab 1 (3D Cockpit): Needle-based animated speedometer synced to 3D engine speedKmh,
 *   live Position, Lap, Best Lap, Gear, RPM, Nitro, and continuous wheel/pedal controls.
 * - Tab 2 (Tap Racer): Medium-weight HiDPI HTML5 Canvas lane-tap arcade racer with
 *   Web Audio SFX, near-miss streak multiplier, localStorage best score, and a real-time
 *   bottom-right HUD displaying Engine RPM, Current Gear, and Lap Timer on screen.
 * Zero backdrop-blur over WebGL.
 */
export function GamingSetup({
  telemetry,
  onToggleGamingMode,
  onSteerWheel,
  onRacingInput,
  onRestartRace,
  onExitGamingView,
}: GamingSetupProps) {
  const { cameraPose, gamingMode, reducedMotion } = useWorkspace();
  const [activeTab, setActiveTab] = useState<ConsoleTab>('cockpit');

  // 3D Cockpit input states
  const [throttleDown, setThrottleDown] = useState(false);
  const [brakeDown, setBrakeDown] = useState(false);
  const [nitroDown, setNitroDown] = useState(false);
  const [steerLeftDown, setSteerLeftDown] = useState(false);
  const [steerRightDown, setSteerRightDown] = useState(false);
  const [displaySpeed, setDisplaySpeed] = useState(telemetry.speedKmh);

  // Tap Racer cartridge state & lifecycle bridge
  const tapHostRef = useRef<HTMLDivElement | null>(null);
  const tapBridgeRef = useRef<TapRacerBridge | null>(null);
  const [tapMuted, setTapMuted] = useState(false);
  const [tapSnapshot, setTapSnapshot] = useState<TapRacerSnapshot>({
    state: 'IDLE',
    score: 0,
    highScore: 0,
    combo: 1,
    boostPct: 100,
    speedKmh: 0,
    rpm: 1100,
    gear: 1,
    lap: 1,
    lapTimeSec: 0,
    boostActive: false,
  });

  const steerDir = (steerRightDown ? 1 : 0) - (steerLeftDown ? 1 : 0);

  // Sync driving inputs directly to the 3D racing game engine when in Cockpit tab
  useEffect(() => {
    if (activeTab === 'cockpit') {
      onRacingInput(throttleDown, brakeDown, steerDir, nitroDown);
    } else {
      onRacingInput(false, false, 0, false);
    }
  }, [activeTab, throttleDown, brakeDown, steerDir, nitroDown, onRacingInput]);

  // Mount & cleanly destroy Tap Racer when Tap Racer console screen tab is active
  useEffect(() => {
    if (activeTab !== 'tap-racer' || (cameraPose !== 'GAMING' && !gamingMode)) {
      tapBridgeRef.current?.destroy();
      tapBridgeRef.current = null;
      return;
    }
    const host = tapHostRef.current;
    if (!host) return;

    const bridge = mountTapRacer(host, {
      reducedMotion,
      onStateChange: (snap) => setTapSnapshot(snap),
    });
    tapBridgeRef.current = bridge;

    return () => {
      bridge.destroy();
      tapBridgeRef.current = null;
    };
  }, [activeTab, cameraPose, gamingMode, reducedMotion]);

  // Smooth rAF needle animation synced to simulated vehicle speedKmh
  const activeEngineSpeed = activeTab === 'tap-racer' ? tapSnapshot.speedKmh : telemetry.speedKmh;
  const activeRunning = activeTab === 'tap-racer' ? tapSnapshot.state === 'PLAYING' : gamingMode;

  const targetSpeedRef = useRef(activeEngineSpeed);
  targetSpeedRef.current = activeRunning ? activeEngineSpeed : 0;

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const animateNeedle = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      setDisplaySpeed((prev) => {
        const target = targetSpeedRef.current;
        if (reducedMotion) return target;
        const diff = target - prev;
        if (Math.abs(diff) < 0.08 && target < 235) return target;
        const damped = prev + diff * Math.min(1, dt * 15);
        const tremor = target >= 235 ? Math.sin(now * 0.045) * 0.65 : 0;
        return Math.max(0, Math.min(320, damped + tremor * dt * 18));
      });

      rafId = requestAnimationFrame(animateNeedle);
    };

    rafId = requestAnimationFrame(animateNeedle);
    return () => cancelAnimationFrame(rafId);
  }, [reducedMotion]);

  // Continuous keyboard racing controls for 3D Cockpit mode
  useEffect(() => {
    if (activeTab !== 'cockpit' || cameraPose !== 'GAMING' || !gamingMode) {
      setThrottleDown(false);
      setBrakeDown(false);
      setNitroDown(false);
      setSteerLeftDown(false);
      setSteerRightDown(false);
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') {
        setThrottleDown(true);
      } else if (k === 's' || e.key === 'ArrowDown') {
        setBrakeDown(true);
      } else if (k === 'a' || e.key === 'ArrowLeft') {
        setSteerLeftDown(true);
      } else if (k === 'd' || e.key === 'ArrowRight') {
        setSteerRightDown(true);
      } else if (e.code === 'Space' || k === 'shift') {
        if (e.code === 'Space') e.preventDefault();
        setNitroDown(true);
      } else if (k === 'r') {
        onRestartRace();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') {
        setThrottleDown(false);
      } else if (k === 's' || e.key === 'ArrowDown') {
        setBrakeDown(false);
      } else if (k === 'a' || e.key === 'ArrowLeft') {
        setSteerLeftDown(false);
      } else if (k === 'd' || e.key === 'ArrowRight') {
        setSteerRightDown(false);
      } else if (e.code === 'Space' || k === 'shift') {
        setNitroDown(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [activeTab, cameraPose, gamingMode, onRestartRace]);

  if (cameraPose !== 'GAMING' && !gamingMode) {
    return null;
  }

  const maxSpeed = 320;
  const clampedSpeed = Math.min(maxSpeed, Math.max(0, displaySpeed));
  const speedFraction = clampedSpeed / maxSpeed;
  const needleAngleDeg = -135 + speedFraction * 270;

  const cx = 66;
  const cy = 64;
  const arcRadius = 48;
  const startRad = (135 * Math.PI) / 180;
  const totalSweepRad = (270 * Math.PI) / 180;
  const activeSweepRad = totalSweepRad * speedFraction;

  const arcPoint = (r: number, rad: number) => ({
    x: cx + Math.cos(rad) * r,
    y: cy + Math.sin(rad) * r,
  });

  const describeArc = (r: number, a0: number, a1: number) => {
    const p0 = arcPoint(r, a0);
    const p1 = arcPoint(r, a1);
    const largeArc = a1 - a0 > Math.PI ? 1 : 0;
    return `M ${p0.x.toFixed(2)} ${p0.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`;
  };

  const trackEndRad = startRad + totalSweepRad;
  const activeEndRad = startRad + activeSweepRad;
  const redlineStartRad = startRad + totalSweepRad * (260 / maxSpeed);
  const needleColor = clampedSpeed >= 260 ? '#EF4444' : clampedSpeed >= 200 ? '#F59E0B' : '#38BDF8';
  const speedTicks = [0, 40, 80, 120, 160, 200, 240, 280, 320];

  const phaseLabel =
    telemetry.phase === 'countdown'
      ? `Countdown · ${telemetry.countdownVal}`
      : telemetry.phase === 'racing'
        ? telemetry.offTrack
          ? 'Off track · Curb'
          : 'Live · Racing'
        : telemetry.phase === 'finished'
          ? `Finished · P${telemetry.position}`
          : 'Standby';

  return (
    <div className="fixed bottom-5 left-4 right-4 sm:left-6 sm:right-auto z-30 pointer-events-none">
      <div className="pointer-events-auto w-full sm:w-[420px] rounded-2xl border border-white/15 bg-[#12151c]/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.75)] space-y-3">
        {/* Header Bar with Mode Switcher */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2 min-w-0">
            <Gamepad2 className="w-4 h-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
            <div className="inline-flex rounded-lg bg-[#090C12] p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('cockpit')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  activeTab === 'cockpit'
                    ? 'bg-[#38BDF8] text-[#070912]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                3D Cockpit
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('tap-racer')}
                className={`px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  activeTab === 'tap-racer'
                    ? 'bg-[#38BDF8] text-[#070912]'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                Tap Racer
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {activeTab === 'cockpit' && gamingMode && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playMouseClick();
                  onRestartRace();
                }}
                className="px-2 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-[11px] font-mono text-[#CBD5E1]"
              >
                Restart
              </button>
            )}
            {cameraPose === 'GAMING' && (
              <button
                type="button"
                onClick={onExitGamingView}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-[11px] font-medium text-white"
              >
                <ArrowLeft className="w-3 h-3" aria-hidden="true" />
                <span>Overview</span>
              </button>
            )}
          </div>
        </div>

        {activeTab === 'tap-racer' ? (
          /* ======================== TAP RACER CONSOLE VIEWPORT ======================== */
          <div className="space-y-3">
            {/* Console Toolbar */}
            <div className="flex items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-[#9CA3AF]">
                  Score <strong className="text-white tabular-nums">{tapSnapshot.score}</strong>
                </span>
                <span className="text-[#9CA3AF]">
                  Best <strong className="text-[#22D3EE] tabular-nums">{tapSnapshot.highScore}</strong>
                </span>
                <span className="text-[#9CA3AF]">
                  Streak <strong className="text-[#F59E0B] tabular-nums">x{tapSnapshot.combo}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = tapBridgeRef.current?.toggleMute() ?? false;
                    setTapMuted(nextMuted);
                  }}
                  className="p-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-[#CBD5E1]"
                  aria-label={tapMuted ? 'Unmute game audio' : 'Mute game audio'}
                >
                  {tapMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => tapBridgeRef.current?.togglePause()}
                  className="p-1.5 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-[#CBD5E1]"
                  aria-label={tapSnapshot.state === 'PAUSED' ? 'Resume game' : 'Pause game'}
                >
                  {tapSnapshot.state === 'PAUSED' ? (
                    <Play className="w-3.5 h-3.5" />
                  ) : (
                    <Pause className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => tapBridgeRef.current?.restart()}
                  className="px-2 py-1 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-[11px] font-mono text-white"
                >
                  {tapSnapshot.state === 'IDLE'
                    ? 'Start'
                    : tapSnapshot.state === 'GAMEOVER'
                      ? 'Retry'
                      : 'Restart'}
                </button>
              </div>
            </div>

            {/* Embedded HiDPI Console Screen Canvas (includes bottom-right RPM/Gear/Lap HUD) */}
            <div
              ref={tapHostRef}
              className="w-full h-[248px] rounded-xl overflow-hidden border border-white/15 bg-[#070A12]"
            />

            {/* Synced Needle Speedometer + Boost & Telemetry Strip */}
            <div className="grid grid-cols-[96px_1fr] gap-3 items-center rounded-xl bg-[#090C12] border border-white/10 p-2">
              <div className="flex items-center justify-center">
                <svg
                  viewBox="0 0 132 124"
                  className="w-[88px] h-[82px] select-none"
                  role="img"
                  aria-label={`Tap Racer speedometer ${Math.round(clampedSpeed)} kilometers per hour`}
                >
                  <circle cx={cx} cy={cy} r={54} fill="#0B0F17" stroke="#1E293B" strokeWidth="1.5" />
                  <path
                    d={describeArc(arcRadius, startRad, trackEndRad)}
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.16)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <path
                    d={describeArc(arcRadius, redlineStartRad, trackEndRad)}
                    fill="none"
                    stroke="rgba(239, 68, 68, 0.45)"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  {speedFraction > 0.005 && (
                    <path
                      d={describeArc(arcRadius, startRad, activeEndRad)}
                      fill="none"
                      stroke={needleColor}
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                  )}
                  <g transform={`rotate(${needleAngleDeg} ${cx} ${cy})`}>
                    <polygon
                      points={`${cx - 2.4},${cy + 11} ${cx + 2.4},${cy + 11} ${cx + 0.9},${cy - 41} ${cx - 0.9},${cy - 41}`}
                      fill="#F97316"
                    />
                    <circle cx={cx} cy={cy} r={6} fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />
                    <circle cx={cx} cy={cy} r={2} fill="#0F172A" />
                  </g>
                  <text
                    x={cx}
                    y={cy + 30}
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize="16"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    {Math.round(clampedSpeed)}
                  </text>
                  <text
                    x={cx}
                    y={cy + 41}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    KM/H
                  </text>
                </svg>
              </div>

              <div className="space-y-2 pr-1">
                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono">
                  <div className="rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1">
                    <span className="block text-[9px] text-[#9CA3AF]">Gear</span>
                    <span className="text-[#22D3EE] font-semibold tabular-nums">G{tapSnapshot.gear}</span>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1">
                    <span className="block text-[9px] text-[#9CA3AF]">RPM</span>
                    <span className="text-white font-semibold tabular-nums">{tapSnapshot.rpm}</span>
                  </div>
                  <div className="rounded-lg bg-white/[0.04] border border-white/10 px-2 py-1">
                    <span className="block text-[9px] text-[#9CA3AF]">Lap {tapSnapshot.lap}</span>
                    <span className="text-[#5EEAD4] font-semibold tabular-nums">
                      {formatLapClock(tapSnapshot.lapTimeSec)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#9CA3AF]">Boost reserve</span>
                    <span className="text-[#22D3EE] tabular-nums">{tapSnapshot.boostPct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded transition-all duration-75 ${
                        tapSnapshot.boostActive ? 'bg-[#F59E0B]' : 'bg-[#22D3EE]'
                      }`}
                      style={{ width: `${tapSnapshot.boostPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* On-Screen Console Controls: Left, Center, Right + Hold Boost */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onPointerDown={() => tapBridgeRef.current?.steerLeft()}
                  className="py-2 px-2 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.14] text-xs font-mono text-white inline-flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Left</span>
                  <kbd className="px-1 py-0.5 text-[10px] rounded bg-black/40 border border-white/15">A</kbd>
                </button>

                <button
                  type="button"
                  onPointerDown={() => tapBridgeRef.current?.steerCenter()}
                  className="py-2 px-2 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.14] text-xs font-mono text-[#CBD5E1] inline-flex items-center justify-center gap-1.5"
                >
                  <span>Center</span>
                  <kbd className="px-1 py-0.5 text-[10px] rounded bg-black/40 border border-white/15">C</kbd>
                </button>

                <button
                  type="button"
                  onPointerDown={() => tapBridgeRef.current?.steerRight()}
                  className="py-2 px-2 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.14] text-xs font-mono text-white inline-flex items-center justify-center gap-1.5"
                >
                  <span>Right</span>
                  <kbd className="px-1 py-0.5 text-[10px] rounded bg-black/40 border border-white/15">D</kbd>
                  <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>

              <button
                type="button"
                disabled={tapSnapshot.state === 'PLAYING' && tapSnapshot.boostPct < 4}
                onPointerDown={() => tapBridgeRef.current?.setBoost(true)}
                onPointerUp={() => tapBridgeRef.current?.setBoost(false)}
                onPointerLeave={() => tapBridgeRef.current?.setBoost(false)}
                onPointerCancel={() => tapBridgeRef.current?.setBoost(false)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-mono inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-40 ${
                  tapSnapshot.boostActive
                    ? 'border-[#F59E0B] bg-[#F59E0B]/25 text-white'
                    : 'border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-[#22D3EE]'
                }`}
              >
                <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Hold to boost</span>
                <kbd className="px-1.5 py-0.5 text-[10px] rounded bg-black/40 border border-white/15">Space</kbd>
              </button>
            </div>
          </div>
        ) : (
          /* ======================== 3D COCKPIT RIG HUD ======================== */
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-[#94A3B8]">
                  {phaseLabel}
                </span>
                <div>
                  <span className="text-[#9CA3AF]">Pos </span>
                  <span className="text-[#38BDF8] font-semibold tabular-nums">
                    P{telemetry.position}/{telemetry.totalCars}
                  </span>
                </div>
                <div>
                  <span className="text-[#9CA3AF]">Lap </span>
                  <span className="text-white font-semibold tabular-nums">
                    {telemetry.lap}/{telemetry.totalLaps}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playMouseClick();
                  onToggleGamingMode();
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                  gamingMode
                    ? 'bg-[#38BDF8] text-[#070912] font-semibold'
                    : 'bg-white/10 hover:bg-white/18 text-white border border-white/15'
                }`}
              >
                <Power className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{gamingMode ? 'Power Off' : 'Start Race'}</span>
              </button>
            </div>

            {/* Needle-Based Speedometer Dial + Gear / RPM / Lap Timer / Nitro */}
            <div className="grid grid-cols-[140px_1fr] gap-3 pt-2 border-t border-white/10 items-center">
              <div className="rounded-xl bg-[#090C12] border border-white/10 p-1.5 flex items-center justify-center">
                <svg
                  viewBox="0 0 132 124"
                  className="w-[128px] h-[120px] select-none"
                  role="img"
                  aria-label={`Speedometer ${Math.round(clampedSpeed)} kilometers per hour`}
                >
                  <circle cx={cx} cy={cy} r={54} fill="#0B0F17" stroke="#1E293B" strokeWidth="1.5" />
                  <path
                    d={describeArc(arcRadius, startRad, trackEndRad)}
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.16)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  <path
                    d={describeArc(arcRadius, redlineStartRad, trackEndRad)}
                    fill="none"
                    stroke="rgba(239, 68, 68, 0.45)"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                  {speedFraction > 0.005 && (
                    <path
                      d={describeArc(arcRadius, startRad, activeEndRad)}
                      fill="none"
                      stroke={needleColor}
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                  )}

                  {Array.from({ length: 17 }).map((_, idx) => {
                    const frac = idx / 16;
                    const rad = startRad + frac * totalSweepRad;
                    const isMajor = idx % 2 === 0;
                    const pIn = arcPoint(isMajor ? 39 : 42, rad);
                    const pOut = arcPoint(46, rad);
                    return (
                      <line
                        key={idx}
                        x1={pIn.x}
                        y1={pIn.y}
                        x2={pOut.x}
                        y2={pOut.y}
                        stroke={
                          frac >= 260 / maxSpeed ? '#EF4444' : isMajor ? '#CBD5E1' : '#64748B'
                        }
                        strokeWidth={isMajor ? 1.6 : 1}
                      />
                    );
                  })}

                  {speedTicks.map((val, idx) => {
                    if (idx % 2 !== 0 && val !== 320) return null;
                    const rad = startRad + (val / maxSpeed) * totalSweepRad;
                    const pt = arcPoint(30, rad);
                    return (
                      <text
                        key={val}
                        x={pt.x}
                        y={pt.y + 3}
                        textAnchor="middle"
                        fill="#64748B"
                        fontSize="7"
                        fontFamily="monospace"
                        fontWeight="600"
                      >
                        {val}
                      </text>
                    );
                  })}

                  <g transform={`rotate(${needleAngleDeg} ${cx} ${cy})`}>
                    <polygon
                      points={`${cx - 2.4},${cy + 11} ${cx + 2.4},${cy + 11} ${cx + 0.9},${cy - 41} ${cx - 0.9},${cy - 41}`}
                      fill="#F97316"
                    />
                    <circle cx={cx} cy={cy} r={6} fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />
                    <circle cx={cx} cy={cy} r={2} fill="#0F172A" />
                  </g>

                  <text
                    x={cx}
                    y={cy + 30}
                    textAnchor="middle"
                    fill="#F8FAFC"
                    fontSize="16"
                    fontFamily="monospace"
                    fontWeight="700"
                  >
                    {Math.round(clampedSpeed)}
                  </text>
                  <text
                    x={cx}
                    y={cy + 40}
                    textAnchor="middle"
                    fill="#94A3B8"
                    fontSize="7"
                    fontFamily="monospace"
                    fontWeight="600"
                  >
                    KM/H
                  </text>
                </svg>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-white/[0.04] border border-white/10 px-2.5 py-2">
                    <p className="text-[10px] font-mono text-[#9CA3AF]">Gear</p>
                    <p className="text-base font-mono font-semibold text-[#38BDF8] tabular-nums">
                      G{telemetry.gear}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/[0.04] border border-white/10 px-2.5 py-2">
                    <p className="text-[10px] font-mono text-[#9CA3AF]">RPM</p>
                    <p className="text-base font-mono font-semibold text-white tabular-nums">
                      {telemetry.rpm}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-[#9CA3AF]">Lap timer</span>
                  <span className="text-sm font-mono font-semibold text-white tabular-nums">
                    {formatLapClock(telemetry.lapTimeSec)}
                  </span>
                </div>

                <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-1.5 space-y-1">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-[#9CA3AF]">Nitro</span>
                    <span className="text-[#38BDF8] tabular-nums">{telemetry.nitroPct}%</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.08] overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-75 ${
                        telemetry.nitroActive ? 'bg-[#F59E0B]' : 'bg-[#38BDF8]'
                      }`}
                      style={{ width: `${telemetry.nitroPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Driving Controls: Brake, Gas, Nitro */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={!gamingMode}
                onPointerDown={() => setBrakeDown(true)}
                onPointerUp={() => setBrakeDown(false)}
                onPointerLeave={() => setBrakeDown(false)}
                onPointerCancel={() => setBrakeDown(false)}
                className={`py-2 px-2 rounded-xl border text-xs font-mono inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 ${
                  brakeDown
                    ? 'border-[#EF4444] bg-[#EF4444]/25 text-white'
                    : 'border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-[#FCA5A5]'
                }`}
              >
                <OctagonX className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Brake</span>
                <kbd className="px-1 py-0.5 text-[10px] rounded bg-black/40 border border-white/15">S</kbd>
              </button>

              <button
                type="button"
                disabled={!gamingMode}
                onPointerDown={() => setThrottleDown(true)}
                onPointerUp={() => setThrottleDown(false)}
                onPointerLeave={() => setThrottleDown(false)}
                onPointerCancel={() => setThrottleDown(false)}
                className={`py-2 px-2 rounded-xl border text-xs font-mono inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 ${
                  throttleDown
                    ? 'border-[#22C55E] bg-[#22C55E]/25 text-white'
                    : 'border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-[#86EFAC]'
                }`}
              >
                <Flame className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Gas</span>
                <kbd className="px-1 py-0.5 text-[10px] rounded bg-black/40 border border-white/15">W</kbd>
              </button>

              <button
                type="button"
                disabled={!gamingMode || telemetry.nitroPct < 4}
                onPointerDown={() => setNitroDown(true)}
                onPointerUp={() => setNitroDown(false)}
                onPointerLeave={() => setNitroDown(false)}
                onPointerCancel={() => setNitroDown(false)}
                className={`py-2 px-2 rounded-xl border text-xs font-mono inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 ${
                  nitroDown
                    ? 'border-[#F59E0B] bg-[#F59E0B]/25 text-white'
                    : 'border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-[#38BDF8]'
                }`}
              >
                <Zap className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Nitro</span>
                <kbd className="px-1 py-0.5 text-[10px] rounded bg-black/40 border border-white/15">Space</kbd>
              </button>
            </div>

            {/* Continuous Hold-to-Steer Wheel Axis Controls */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#9CA3AF]">Steering wheel</span>
                <span className="text-white tabular-nums">
                  {telemetry.steerDeg >= 0 ? `+${telemetry.steerDeg}` : telemetry.steerDeg} deg
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={!gamingMode}
                  onPointerDown={() => setSteerLeftDown(true)}
                  onPointerUp={() => setSteerLeftDown(false)}
                  onPointerLeave={() => setSteerLeftDown(false)}
                  onPointerCancel={() => setSteerLeftDown(false)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono inline-flex items-center justify-center gap-1.5 disabled:opacity-40 ${
                    steerLeftDown
                      ? 'bg-[#38BDF8] text-[#070912] font-semibold'
                      : 'bg-white/[0.07] hover:bg-white/[0.14] text-white'
                  }`}
                >
                  <RotateCcw className="w-3 h-3" aria-hidden="true" />
                  <span>Left</span>
                  <kbd className="px-1 py-0.2 text-[10px] rounded bg-black/30 border border-white/15">A</kbd>
                </button>
                <button
                  type="button"
                  onClick={() => onSteerWheel(0, true)}
                  className="py-1.5 px-2 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-xs font-mono text-[#CBD5E1]"
                >
                  Center
                </button>
                <button
                  type="button"
                  disabled={!gamingMode}
                  onPointerDown={() => setSteerRightDown(true)}
                  onPointerUp={() => setSteerRightDown(false)}
                  onPointerLeave={() => setSteerRightDown(false)}
                  onPointerCancel={() => setSteerRightDown(false)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono inline-flex items-center justify-center gap-1.5 disabled:opacity-40 ${
                    steerRightDown
                      ? 'bg-[#38BDF8] text-[#070912] font-semibold'
                      : 'bg-white/[0.07] hover:bg-white/[0.14] text-white'
                  }`}
                >
                  <span>Right</span>
                  <kbd className="px-1 py-0.2 text-[10px] rounded bg-black/30 border border-white/15">D</kbd>
                  <RotateCw className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
