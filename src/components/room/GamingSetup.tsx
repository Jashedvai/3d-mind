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
  const { cameraPose, gamingMode, steeringAngle } = useWorkspace();
  const [throttleDown, setThrottleDown] = useState(false);
  const [brakeDown, setBrakeDown] = useState(false);

  useEffect(() => {
    onRacingInput(throttleDown, brakeDown);
  }, [throttleDown, brakeDown, onRacingInput]);

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

  return (
    <div className="fixed bottom-5 left-4 right-4 sm:left-6 sm:right-auto z-30 pointer-events-none">
      <div className="pointer-events-auto w-full sm:w-[400px] rounded-2xl border border-white/15 bg-[#12151c]/95 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.75)] space-y-3">
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

        {/* Live Speedometer / Gear / RPM / Lap Timer Telemetry Strip */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
          <div className="rounded-xl bg-white/[0.04] border border-white/10 px-2.5 py-2">
            <p className="text-[10px] font-mono text-[#9CA3AF]">Speed</p>
            <p className="text-sm font-mono font-semibold text-white tabular-nums">
              {telemetry.speedKmh} <span className="text-[10px] text-[#9CA3AF]">km/h</span>
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.04] border border-white/10 px-2.5 py-2">
            <p className="text-[10px] font-mono text-[#9CA3AF]">Gear</p>
            <p className="text-sm font-mono font-semibold text-[#38BDF8] tabular-nums">
              G{telemetry.gear}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.04] border border-white/10 px-2.5 py-2">
            <p className="text-[10px] font-mono text-[#9CA3AF]">RPM</p>
            <p className="text-sm font-mono font-semibold text-white tabular-nums">
              {telemetry.rpm}
            </p>
          </div>
          <div className="rounded-xl bg-white/[0.04] border border-white/10 px-2.5 py-2">
            <p className="text-[10px] font-mono text-[#9CA3AF]">Lap</p>
            <p className="text-sm font-mono font-semibold text-white tabular-nums">
              {String(Math.floor((telemetry.lapTimeSec % 68) / 60)).padStart(2, '0')}:
              {((telemetry.lapTimeSec % 68) % 60).toFixed(1).padStart(4, '0')}
            </p>
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

