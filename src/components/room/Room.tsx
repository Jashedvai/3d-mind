import React from 'react';
import {
  Armchair,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BedDouble,
  Fan,
  Gamepad2,
  Lamp,
  Lightbulb,
  Monitor,
  Moon,
  Power,
  Smartphone,
  Snowflake,
  Sun,
  ToggleRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  ACCENT_COLORS,
  RoomDevicesState,
  useWorkspace,
} from '../../context/WorkspaceContext';
import { PROFILE } from '../../data/portfolioData';
import { soundEngine } from '../../audio/soundEngine';
import { LightingMode, RoomInteractivePart } from '../../three/roomScene';

export const PART_LABELS: Record<RoomInteractivePart, string> = {
  chair: 'Workstation chair · Click to sit at desk',
  desk: 'Main workstation desk · Click to glide to workstation',
  power: 'PC tower · Click power button to boot JashedOS',
  monitor: 'Dual monitors · Boot PC or sit at workstation',
  headphones: 'Studio headphones · Toggle ambient synth soundtrack',
  keyboard: 'Mechanical keyboard · Tactile switches',
  ac: 'Inverter split AC · Click to toggle',
  fan: 'Ceiling fan · Click to toggle',
  wallart: 'Personal portrait gallery',
  bed: 'Platform bed · Click to lie down and rest',
  phone: 'Smartphone dock · Click to open mobile portfolio',
  outlet: 'Virtual wall outlet · Click to toggle phone charger',
  console: 'Gaming console · Click to launch Car Racing Sim',
  wheel: 'Steering wheel peripheral · Click to steer wheel',
  gaming_monitor: 'Gaming display · Click to play Car Racing Sim',
  light_ceiling: 'Ceiling downlights · Click to toggle',
  light_desk: 'Desk lightbar · Click to toggle',
  light_rgb: 'Geometric LED wall panel · Click to toggle',
  light_bed: 'Bedside warm lamp · Click to toggle',
  switch_ceiling: 'Wall switch 1 · Ceiling lights',
  switch_desk: 'Wall switch 2 · Desk lightbar',
  switch_rgb: 'Wall switch 3 · LED wall panel',
  switch_bed: 'Wall switch 4 · Bedside lamp',
  switch_fan: 'Wall switch 5 · Ceiling fan',
  switch_ac: 'Wall switch 6 · Inverter AC',
};

export const LIGHTING_MODES: { id: LightingMode; label: string }[] = [
  { id: 'coding', label: 'Coding' },
  { id: 'study', label: 'Study' },
  { id: 'relax', label: 'Relax' },
  { id: 'cinematic', label: 'Mood' },
];

interface RoomProps {
  canvasHostRef: React.RefObject<HTMLDivElement | null>;
  webglFailed: boolean;
  hoveredPart: RoomInteractivePart | null;
  roomNotice: string | null;
  lightingMode: LightingMode;
  switchPanelOpen: boolean;
  inspectingSwitches: boolean;
  onToggleSwitchPanel: () => void;
  onToggleMasterLights: () => void;
  onApplyLightingMode: (mode: LightingMode) => void;
  onToggleDevice: (key: keyof RoomDevicesState, label: string) => void;
  onSetAllDevices: (enabled: boolean) => void;
  onToggleInspectSwitches: () => void;
  onTriggerSit: () => void;
  onTriggerLieOnBed: () => void;
  onTriggerPhoneView: () => void;
  onTriggerGamingView: () => void;
  onDpadMove: (dx: number, dz: number) => void;
}

/**
 * Interactive 3D Bedroom canvas container and architectural HUD controls.
 * Uses solid neutral surfaces (no backdrop-blur over WebGL) and zero purple grading.
 */
export function Room({
  canvasHostRef,
  webglFailed,
  hoveredPart,
  roomNotice,
  lightingMode,
  switchPanelOpen,
  inspectingSwitches,
  onToggleSwitchPanel,
  onToggleMasterLights,
  onApplyLightingMode,
  onToggleDevice,
  onSetAllDevices,
  onToggleInspectSwitches,
  onTriggerSit,
  onTriggerLieOnBed,
  onTriggerPhoneView,
  onTriggerGamingView,
  onDpadMove,
}: RoomProps) {
  const {
    experienceState,
    cameraPose,
    roomLightsOn,
    devices,
    gamingMode,
    enterRoom,
    powerOnPC,
    skipToDesktop,
    setExperienceState,
    setCameraPose,
    reducedMotion,
    setReducedMotion,
    accent,
    audioState,
  } = useWorkspace();

  const accentHex = ACCENT_COLORS[accent].hex;
  const activeLightsCount = [
    devices.ceilingLight,
    devices.deskLight,
    devices.rgbLight,
    devices.bedLight,
  ].filter(Boolean).length;

  const isBedView = cameraPose === 'BED_LYING';
  const isPhoneView = cameraPose === 'PHONE';
  const isGamingView = cameraPose === 'GAMING';
  const isFocusedOverlayView = isBedView || isPhoneView;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#090b0f] text-[#F8F9FA] select-none">
      {/* 3D WebGL Room Canvas OR Graceful Fallback */}
      {!webglFailed ? (
        <div
          ref={canvasHostRef}
          className="absolute inset-0 w-full h-full"
          aria-label="Interactive 3D developer bedroom and gaming studio"
        />
      ) : (
        <div className="absolute inset-0">
          <img
            src={PROFILE.setupPhotoDark}
            alt="Jashed Developer Workstation"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-[#090b0f]/70" />
        </div>
      )}

      {/* Top Architectural Controls Bar (Hidden cleanly while inside Bed or Phone dock views) */}
      {!isFocusedOverlayView && (
        <header className="relative z-30 px-4 sm:px-6 pt-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-3">
            <span className="font-display font-semibold text-base sm:text-lg tracking-tight text-white">
              {PROFILE.brand}
              <span style={{ color: accentHex }}>.dev</span>
            </span>
            <span className="hidden xl:inline text-xs font-mono text-[#9CA3AF]">
              14×16 ft Sim-Racing &amp; Developer Studio · 224 sq. ft.
            </span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            {/* Master Global Room Lights ON/OFF Toggle */}
            <button
              type="button"
              onClick={onToggleMasterLights}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors min-h-[38px] whitespace-nowrap shrink-0 ${
                roomLightsOn
                  ? 'border-white/20 bg-[#181c24]/95 text-[#F8F9FA] hover:bg-[#222732]'
                  : 'border-[#38BDF8]/50 bg-[#0d141d]/95 text-[#38BDF8]'
              }`}
              title="Toggle all room lights on or off"
            >
              {roomLightsOn ? (
                <Sun className="w-3.5 h-3.5 text-[#F8F9FA]" aria-hidden="true" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
              )}
              <span>{roomLightsOn ? 'Lights on' : 'Lights off'}</span>
            </button>

            {/* 4-Mode Room Lighting Switcher (Desktop) */}
            <div className="hidden md:flex items-center gap-1 p-1 rounded-lg border border-white/15 bg-[#12151c]/95">
              {LIGHTING_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playMouseClick();
                    onApplyLightingMode(m.id);
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                    lightingMode === m.id
                      ? 'bg-[#F8F9FA] text-[#0b0e14] font-semibold'
                      : 'text-[#9CA3AF] hover:text-white'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Wall Switchboard Panel Toggle */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playMouseClick();
                onToggleSwitchPanel();
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors min-h-[38px] whitespace-nowrap shrink-0 ${
                switchPanelOpen
                  ? 'border-[#38BDF8]/65 bg-[#17212e]/95 text-white'
                  : 'border-white/15 bg-[#12151c]/95 text-[#E5E7EB] hover:bg-[#1b202a]'
              }`}
              title="Wall switches, fan and AC controls"
              aria-expanded={switchPanelOpen}
            >
              <ToggleRight className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
              <span>Switches</span>
              <span className="text-[10px] text-white/60 tabular-nums">{activeLightsCount}/4</span>
            </button>

            <button
              type="button"
              onClick={onTriggerGamingView}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors min-h-[38px] whitespace-nowrap shrink-0 ${
                isGamingView || gamingMode
                  ? 'border-[#38BDF8]/60 bg-[#14202d]/95 text-[#38BDF8]'
                  : 'border-white/15 bg-[#12151c]/95 text-[#D1D5DB] hover:text-white'
              }`}
              title="Focus gaming console and steering wheel"
            >
              <Gamepad2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Gaming</span>
            </button>

            <button
              type="button"
              onClick={onTriggerLieOnBed}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-[#12151c]/95 text-xs font-medium text-[#D1D5DB] hover:text-white transition-colors min-h-[38px] whitespace-nowrap shrink-0"
              title="Lie on platform bed"
            >
              <BedDouble className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Bed</span>
            </button>

            <button
              type="button"
              onClick={onTriggerPhoneView}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-[#12151c]/95 text-xs font-medium text-[#D1D5DB] hover:text-white transition-colors min-h-[38px] whitespace-nowrap shrink-0"
              title="Inspect phone charging dock on sideboard"
            >
              <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Phone</span>
            </button>

            <button
              type="button"
              onClick={() => setReducedMotion((r) => !r)}
              className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-[#12151c]/95 text-xs font-mono text-[#9CA3AF] hover:text-white transition-colors min-h-[38px] whitespace-nowrap shrink-0"
              title="Toggle reduced camera motion"
            >
              <span>{reducedMotion ? 'Motion: reduced' : 'Motion: smooth'}</span>
            </button>

            <button
              type="button"
              onClick={() => soundEngine.setMuted(!audioState.muted)}
              className="w-9 h-9 rounded-lg border border-white/15 bg-[#12151c]/95 inline-flex items-center justify-center text-[#D1D5DB] hover:text-white transition-colors shrink-0"
              aria-label={audioState.muted ? 'Unmute audio' : 'Mute audio'}
            >
              {audioState.muted ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={() => skipToDesktop()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-white/15 bg-[#F8F9FA] text-[#0b0e14] text-xs font-semibold hover:bg-white/90 transition-colors min-h-[38px] whitespace-nowrap shrink-0"
            >
              <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Open OS</span>
            </button>
          </div>
        </header>
      )}

      {/* Expandable Wall Switchboard Drawer (Zero backdrop-blur over WebGL) */}
      {switchPanelOpen && !isFocusedOverlayView && (
        <aside
          aria-label="Studio wall switchboard"
          className="fixed top-16 right-4 sm:right-6 z-40 w-[min(336px,calc(100vw-32px))] rounded-2xl border border-white/18 bg-[#12151c]/96 p-4 shadow-[0_24px_60px_rgba(0,0,0,0.82)] space-y-3"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
            <div>
              <p className="text-xs font-semibold text-white">Wall switchboard</p>
              <p className="text-[11px] text-[#9CA3AF]">
                Toggle circuits individually or click switches in 3D
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => onSetAllDevices(true)}
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/18 text-[10px] font-mono text-white"
              >
                All on
              </button>
              <button
                type="button"
                onClick={() => onSetAllDevices(false)}
                className="px-2 py-1 rounded bg-white/[0.05] hover:bg-white/14 text-[10px] font-mono text-[#D1D5DB]"
              >
                All off
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { key: 'ceilingLight', label: 'Ceiling lights', sub: '4x 4000K', icon: Sun },
                { key: 'deskLight', label: 'Desk lightbar', sub: 'Task spot', icon: Lightbulb },
                { key: 'rgbLight', label: 'Wall LED', sub: 'X-Cross + Cove', icon: Lightbulb },
                { key: 'bedLight', label: 'Bedside lamp', sub: '2700K warm', icon: Lamp },
                { key: 'fan', label: 'Ceiling fan', sub: '48 in BLDC', icon: Fan },
                { key: 'ac', label: 'Inverter AC', sub: '24 C split', icon: Snowflake },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const isOn = devices[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onToggleDevice(item.key, item.label)}
                  className={`p-2.5 rounded-xl border text-left transition-colors flex items-center gap-2.5 ${
                    isOn
                      ? 'bg-white/[0.11] border-white/25 text-white'
                      : 'bg-white/[0.03] border-white/10 text-[#9CA3AF] hover:bg-white/[0.07]'
                  }`}
                >
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10 ${
                      isOn ? 'bg-[#38BDF8]/20 text-[#38BDF8]' : 'bg-white/[0.04] text-[#6B7280]'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold truncate">{item.label}</div>
                    <div className="text-[10px] font-mono opacity-75 truncate">
                      {isOn ? 'On' : 'Off'} · {item.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onToggleInspectSwitches}
            className="w-full py-2 px-3 rounded-xl border border-white/15 bg-white/[0.08] hover:bg-white/[0.15] text-xs font-medium text-white transition-colors flex items-center justify-center gap-2"
          >
            <ToggleRight className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" />
            <span>
              {inspectingSwitches ? 'Return to overview' : 'Focus camera on wall switchboard'}
            </span>
          </button>
        </aside>
      )}

      {/* Hover / Interaction Toast */}
      {(hoveredPart || roomNotice) && !isFocusedOverlayView && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-lg border border-white/15 bg-[#12151c]/95 text-xs font-mono text-[#E5E7EB] pointer-events-none whitespace-nowrap max-w-[92vw] truncate">
          {roomNotice || (hoveredPart ? PART_LABELS[hoveredPart] : '')}
        </div>
      )}

      {/* ENTRANCE OVERLAY — Clean Architectural Monolith Card (Zero Purple / Zero Hype) */}
      {experienceState === 'ENTRANCE' && !isFocusedOverlayView && !isGamingView && (
        <div className="absolute inset-x-0 bottom-5 sm:bottom-8 z-20 px-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl rounded-2xl border border-white/[0.14] bg-[#12151c]/95 p-4 sm:p-6 shadow-[0_28px_70px_rgba(0,0,0,0.75)] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
              <div className="sm:col-span-5 relative rounded-xl bg-[#252932] overflow-hidden min-h-[152px] sm:min-h-[184px] flex items-end justify-center border border-white/10">
                <div className="absolute top-0 left-0 bg-[#12151c] px-3 py-1 rounded-br-xl font-mono text-[11px] tracking-[0.18em] text-white/85">
                  01 / AHJ
                </div>
                <img
                  src={PROFILE.portraitPath}
                  alt={PROFILE.fullName}
                  className="w-full h-full max-h-[200px] object-cover object-top"
                />
                <div className="absolute bottom-0 right-0 bg-[#12151c] pl-3 pt-1 pb-1 pr-2 rounded-tl-xl text-[10px] font-mono tracking-wider text-white/75">
                  Studio 3D
                </div>
              </div>

              <div className="sm:col-span-7 flex flex-col justify-between py-1">
                <div className="font-display font-semibold uppercase leading-[0.98] tracking-tight">
                  <div className="text-2xl sm:text-3xl text-white">Hey</div>
                  <div className="text-2xl sm:text-3xl text-white">This</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl text-white">Is</span>
                    <span className="text-3xl sm:text-4xl text-outline-hero">Jashed</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 pt-3 border-t border-white/10">
                  <div className="text-[11px] font-medium uppercase tracking-[0.06em] leading-tight text-white/80">
                    <div>Full-Stack</div>
                    <div>Android &amp; AI</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF] block">
                      Role
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-[#38BDF8]">
                      Creative Developer
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onTriggerSit}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#070912] text-xs sm:text-sm font-semibold transition-colors min-h-[40px] whitespace-nowrap shrink-0"
                >
                  <Armchair className="w-4 h-4" aria-hidden="true" />
                  <span>Sit at desk</span>
                </button>
                <button
                  type="button"
                  onClick={onTriggerLieOnBed}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-[#E5E7EB] transition-colors min-h-[40px] whitespace-nowrap shrink-0"
                >
                  <BedDouble className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Bed</span>
                </button>
                <button
                  type="button"
                  onClick={onTriggerPhoneView}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-[#E5E7EB] transition-colors min-h-[40px] whitespace-nowrap shrink-0"
                >
                  <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Phone</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={enterRoom}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-xs font-medium text-[#E5E7EB] transition-colors min-h-[40px] whitespace-nowrap shrink-0"
                >
                  <span>Explore</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => skipToDesktop()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#F8F9FA] text-[#0b0e14] hover:bg-white/90 text-xs font-semibold transition-colors min-h-[40px] whitespace-nowrap shrink-0"
                >
                  <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Launch OS</span>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#9CA3AF]">
              <span>© 2026 Md. Ahsanul Haque Jashed</span>
              <span>Click bed, phone dock, desk or racing rig</span>
            </div>
          </div>
        </div>
      )}

      {/* EXPLORING ROOM HUD */}
      {experienceState === 'EXPLORING' && !isFocusedOverlayView && !isGamingView && (
        <div className="fixed inset-x-0 bottom-5 z-20 px-4 sm:px-6 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 pointer-events-none">
          <div className="pointer-events-auto rounded-xl border border-white/15 bg-[#12151c]/95 px-4 py-2.5 flex flex-wrap items-center gap-3 max-w-full">
            <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-[#CBD5E1]">
              <kbd className="px-1.5 py-0.5 rounded border border-white/20 bg-white/10 text-[10px]">
                W
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-white/20 bg-white/10 text-[10px]">
                A
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-white/20 bg-white/10 text-[10px]">
                S
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded border border-white/20 bg-white/10 text-[10px]">
                D
              </kbd>
              <span className="ml-1">Drag to look · Click objects</span>
            </div>

            <button
              type="button"
              onClick={onTriggerSit}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#38BDF8] text-[#070912] text-xs font-semibold transition-colors min-h-[36px] whitespace-nowrap shrink-0"
            >
              <Armchair className="w-4 h-4" aria-hidden="true" />
              <span>Sit at desk</span>
            </button>
          </div>

          {/* Mobile / Touch D-Pad */}
          <div className="pointer-events-auto md:hidden grid grid-cols-3 gap-1.5 p-2 rounded-xl border border-white/15 bg-[#12151c]/95">
            <div />
            <button
              type="button"
              onPointerDown={() => onDpadMove(0, -1)}
              onPointerUp={() => onDpadMove(0, 0)}
              onPointerLeave={() => onDpadMove(0, 0)}
              className="w-11 h-11 rounded-lg bg-white/[0.07] active:bg-[#38BDF8]/30 flex items-center justify-center"
              aria-label="Move forward"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <div />
            <button
              type="button"
              onPointerDown={() => onDpadMove(-1, 0)}
              onPointerUp={() => onDpadMove(0, 0)}
              onPointerLeave={() => onDpadMove(0, 0)}
              className="w-11 h-11 rounded-lg bg-white/[0.07] active:bg-[#38BDF8]/30 flex items-center justify-center"
              aria-label="Strafe left"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onPointerDown={() => onDpadMove(0, 1)}
              onPointerUp={() => onDpadMove(0, 0)}
              onPointerLeave={() => onDpadMove(0, 0)}
              className="w-11 h-11 rounded-lg bg-white/[0.07] active:bg-[#38BDF8]/30 flex items-center justify-center"
              aria-label="Move backward"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onPointerDown={() => onDpadMove(1, 0)}
              onPointerUp={() => onDpadMove(0, 0)}
              onPointerLeave={() => onDpadMove(0, 0)}
              className="w-11 h-11 rounded-lg bg-white/[0.07] active:bg-[#38BDF8]/30 flex items-center justify-center"
              aria-label="Strafe right"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* SEATED AT WORKSTATION OVERLAY */}
      {(experienceState === 'APPROACHING_DESK' || experienceState === 'SEATED') &&
        !isFocusedOverlayView && (
        <div className="fixed inset-x-0 bottom-6 z-20 px-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto rounded-2xl border border-white/15 bg-[#12151c]/95 px-5 py-3.5 shadow-2xl flex flex-wrap items-center justify-center gap-4 max-w-xl">
            <span className="text-xs sm:text-sm font-mono text-[#38BDF8]">
              {experienceState === 'APPROACHING_DESK'
                ? 'Moving to workstation chair...'
                : 'Seated at workstation'}
            </span>

            {experienceState === 'SEATED' && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setCameraPose('OVERVIEW');
                    setExperienceState('EXPLORING');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-white/15 text-xs font-medium text-[#D1D5DB] hover:bg-white/[0.08] min-h-[40px] whitespace-nowrap shrink-0"
                >
                  Stand up
                </button>
                <button
                  type="button"
                  onClick={powerOnPC}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#38BDF8] hover:bg-[#7DD3FC] text-[#070912] text-xs sm:text-sm font-semibold transition-colors min-h-[40px] whitespace-nowrap shrink-0"
                >
                  <Power className="w-4 h-4" aria-hidden="true" />
                  <span>Power on PC</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
