import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Flame,
  Gamepad2,
  Gauge,
  OctagonX,
  Power,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { soundEngine } from '../../audio/soundEngine';
import { RacingTelemetry } from '../../three/room/roomTypes';

interface GamingSetupProps {
  telemetry: RacingTelemetry;
  onToggleGamingMode: () => void;
  onSteerWheel: (deltaDeg: number, reset?: boolean) => void;
  onRacingInput: (throttle: boolean, brake: boolean) => void;
  onExitGamingView: () => void;
}

/**
 * Interactive HUD for the L-wing Gaming Console, Sim-Racing Steering Wheel,
 * live car racing dashboard telemetry, and throttle/brake controls.
 * Zero backdrop-blur over WebGL.
 */
export function GamingSetup({
  telemetry,
  onToggleGamingMode,
  onSteerWheel,
  onRacingInput,
  onExitGamingView,
}: GamingSetupProps) {
  const { cameraPose, gamingMode, steeringAngle, reducedMotion } = useWorkspace();
  const [throttleDown, setThrottleDown] = useState(false);
  const [brakeDown, setBrakeDown] = useState(false);
  const [displaySpeed, setDisplaySpeed] = useState(telemetry.speedKmh);

  useEffect(() => {
    onRacingInput(throttleDown, brakeDown);
  }, [throttleDown, brakeDown, onRacingInput]);

  // Smooth rAF needle damping synced to simulated vehicle speedKmh
  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const animateNeedle = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      setDisplaySpeed((prev) => {
        const target = gamingMode ? telemetry.speedKmh : 0;
        if (reducedMotion) return target;
        const diff = target - prev;
        if (Math.abs(diff) < 0.08) return target;
        return prev + diff * Math.min(1, dt * 14);
      });

      rafId = requestAnimationFrame(animateNeedle);
    };

    rafId = requestAnimationFrame(animateNeedle);
    return () => cancelAnimationFrame(rafId);
  }, [telemetry.speedKmh, gamingMode, reducedMotion]);

  useEffect(() => {
    if (cameraPose !== 'GAMING' || !gamingMode) {
      setThrottleDown(false);
      setBrakeDown(false);
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
        onSteerWheel(-18);
      } else if (k === 'd' || e.key === 'ArrowRight') {
        onSteerWheel(18);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || e.key === 'ArrowUp') {
        setThrottleDown(false);
      } else if (k === 's' || e.key === 'ArrowDown') {
        setBrakeDown(false);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [cameraPose, gamingMode, onSteerWheel]);

  if (cameraPose !== 'GAMING' && !gamingMode) {
    return null;
  }

  const maxSpeed = 320;
  const clampedSpeed = Math.min(maxSpeed, Math.max(0, displaySpeed));
  const speedFraction = clampedSpeed / maxSpeed;
  // 270-degree sweep from -135deg (0 km/h) to +135deg (320 km/h), 0deg = straight up
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

  return (
    <div className="fixed bottom-5 left-4 right-4 sm:left-6 sm:right-auto z-30 pointer-events-none">
      <div className="pointer-events-auto w-full sm:w-[404px] rounded-2xl border border-white/15 bg-[#12151c]/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.75)] space-y-3">
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
            <span className="text-xs font-semibold text-white">Apex GT Racing Rig</span>
          </div>
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

        <div className="flex items-center justify-between gap-2">
          <div className="space-y-0.5">
            <p className="text-[11px] text-[#9CA3AF]">Console state</p>
            <p className="text-xs font-mono text-white">
              {gamingMode ? 'Active · Car Racing Sim' : 'Standby'}
            </p>
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

        {/* Needle-Based Speedometer Dial + Gear / RPM / Lap Telemetry */}
        <div className="grid grid-cols-[140px_1fr] gap-3 pt-2 border-t border-white/10 items-center">
          {/* Animated SVG Needle Speedometer */}
          <div className="rounded-xl bg-[#090C12] border border-white/10 p-1.5 flex items-center justify-center">
            <svg
              viewBox="0 0 132 124"
              className="w-[128px] h-[120px] select-none"
              role="img"
              aria-label={`Speedometer ${Math.round(clampedSpeed)} kilometers per hour`}
            >
              {/* Dial background ring */}
              <circle cx={cx} cy={cy} r={54} fill="#0B0F17" stroke="#1E293B" strokeWidth="1.5" />

              {/* Track scale arc */}
              <path
                d={describeArc(arcRadius, startRad, trackEndRad)}
                fill="none"
                stroke="rgba(148, 163, 184, 0.16)"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Redzone high-speed arc */}
              <path
                d={describeArc(arcRadius, redlineStartRad, trackEndRad)}
                fill="none"
                stroke="rgba(239, 68, 68, 0.45)"
                strokeWidth="5"
                strokeLinecap="round"
              />

              {/* Live active speed arc */}
              {speedFraction > 0.005 && (
                <path
                  d={describeArc(arcRadius, startRad, activeEndRad)}
                  fill="none"
                  stroke={needleColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                />
              )}

              {/* Minor & major tick marks */}
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
                    stroke={frac >= 260 / maxSpeed ? '#EF4444' : isMajor ? '#CBD5E1' : '#64748B'}
                    strokeWidth={isMajor ? 1.6 : 1}
                  />
                );
              })}

              {/* Numeric scale labels */}
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

              {/* Rotating Tapered Needle + Rear Counterweight */}
              <g transform={`rotate(${needleAngleDeg} ${cx} ${cy})`}>
                <polygon
                  points={`${cx - 2.4},${cy + 11} ${cx + 2.4},${cy + 11} ${cx + 0.9},${cy - 41} ${cx - 0.9},${cy - 41}`}
                  fill="#F97316"
                />
                <circle cx={cx} cy={cy} r={6} fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.5" />
                <circle cx={cx} cy={cy} r={2} fill="#0F172A" />
              </g>

              {/* Digital speed readout inside lower dial well */}
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

          {/* Right Column: Gear, Engine RPM & Lap Timer */}
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

            <div className="rounded-xl bg-white/[0.04] border border-white/10 px-3 py-2 flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#9CA3AF]">Lap timer</span>
              <span className="text-sm font-mono font-semibold text-white tabular-nums">
                {String(Math.floor((telemetry.lapTimeSec % 68) / 60)).padStart(2, '0')}:
                {((telemetry.lapTimeSec % 68) % 60).toFixed(2).padStart(5, '0')}
              </span>
            </div>
          </div>
        </div>

        {/* Pedal Controls: Brake + Accelerate */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={!gamingMode}
            onPointerDown={() => setBrakeDown(true)}
            onPointerUp={() => setBrakeDown(false)}
            onPointerLeave={() => setBrakeDown(false)}
            onPointerCancel={() => setBrakeDown(false)}
            className={`py-2 px-3 rounded-xl border text-xs font-mono inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 ${
              brakeDown
                ? 'border-[#EF4444] bg-[#EF4444]/25 text-white'
                : 'border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-[#FCA5A5]'
            }`}
          >
            <OctagonX className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Brake [S]</span>
          </button>

          <button
            type="button"
            disabled={!gamingMode}
            onPointerDown={() => setThrottleDown(true)}
            onPointerUp={() => setThrottleDown(false)}
            onPointerLeave={() => setThrottleDown(false)}
            onPointerCancel={() => setThrottleDown(false)}
            className={`py-2 px-3 rounded-xl border text-xs font-mono inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 ${
              throttleDown
                ? 'border-[#22C55E] bg-[#22C55E]/25 text-white'
                : 'border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-[#86EFAC]'
            }`}
          >
            <Flame className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Gas [W]</span>
          </button>
        </div>

        {/* Steering Wheel Axis Controls */}
        <div className="pt-2 border-t border-white/10 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="inline-flex items-center gap-1.5 text-[#9CA3AF]">
              <Gauge className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
              <span>Steering wheel</span>
            </span>
            <span className="text-white tabular-nums">
              {steeringAngle >= 0 ? `+${steeringAngle}` : steeringAngle} deg
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => onSteerWheel(-35)}
              className="py-1.5 px-2 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-xs font-mono text-white inline-flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3 h-3" aria-hidden="true" />
              <span>Left</span>
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
              onClick={() => onSteerWheel(35)}
              className="py-1.5 px-2 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] text-xs font-mono text-white inline-flex items-center justify-center gap-1"
            >
              <span>Right</span>
              <RotateCw className="w-3 h-3" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

