import { ArrowLeft, BedDouble, Lamp, Moon, Smartphone, Sun } from 'lucide-react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { soundEngine } from '../../audio/soundEngine';

interface InteractiveBedProps {
  onExitBed: () => void;
  onToggleBedLamp: () => void;
  onToggleMasterLights: () => void;
  onGoToPhone: () => void;
}

/**
 * Dedicated Bed Rest Perspective Overlay displayed when lying on the platform bed.
 * Physically and functionally decoupled from the East-sideboard Phone Charging Station.
 * Note: Zero backdrop-blur used over the active WebGL canvas.
 */
export function InteractiveBed({
  onExitBed,
  onToggleBedLamp,
  onToggleMasterLights,
  onGoToPhone,
}: InteractiveBedProps) {
  const { devices, roomLightsOn } = useWorkspace();

  return (
    <div className="fixed inset-0 z-30 pointer-events-none flex flex-col justify-between p-4 sm:p-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 pointer-events-auto">
        <button
          type="button"
          onClick={onExitBed}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/15 bg-[#12151c]/95 hover:bg-[#1a1f29] text-xs font-medium text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Get up from bed</span>
        </button>

        <button
          type="button"
          onClick={onGoToPhone}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-white/15 bg-[#12151c]/95 hover:bg-[#1a1f29] text-xs font-medium text-[#E5E7EB] hover:text-white transition-colors"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
          <span>Check phone dock</span>
        </button>
      </div>

      {/* Bottom Bed Rest Card */}
      <div className="flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-white/15 bg-[#12151c]/95 p-4 shadow-[0_24px_64px_rgba(0,0,0,0.8)] space-y-3">
          <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/35 flex items-center justify-center text-[#38BDF8]">
                <BedDouble className="w-4 h-4" aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-xs font-semibold text-white">Bed Rest Perspective</h2>
                <p className="text-[11px] text-[#9CA3AF]">
                  Platform bed · Nightstand warm lamp within reach
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono text-white/45">© 2026 Jashed</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playKeyClick(false);
                onToggleBedLamp();
              }}
              className={`p-2.5 rounded-xl border text-left transition-colors flex items-center gap-2.5 ${
                devices.bedLight
                  ? 'border-[#F59E0B]/50 bg-[#231b11] text-[#FDE68A]'
                  : 'border-white/12 bg-white/[0.04] text-[#9CA3AF] hover:text-white'
              }`}
            >
              <Lamp className="w-4 h-4 shrink-0" aria-hidden="true" />
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">Bedside lamp</div>
                <div className="text-[10px] font-mono opacity-80">
                  {devices.bedLight ? '2700K On' : 'Off'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playKeyClick(false);
                onToggleMasterLights();
              }}
              className={`p-2.5 rounded-xl border text-left transition-colors flex items-center gap-2.5 ${
                roomLightsOn
                  ? 'border-white/20 bg-white/[0.09] text-white'
                  : 'border-[#38BDF8]/50 bg-[#0d141d] text-[#7DD3FC]'
              }`}
            >
              {roomLightsOn ? (
                <Sun className="w-4 h-4 shrink-0" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <div className="min-w-0">
                <div className="text-xs font-medium truncate">Room lights</div>
                <div className="text-[10px] font-mono opacity-80">
                  {roomLightsOn ? 'Lights on' : 'Dark mode'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

