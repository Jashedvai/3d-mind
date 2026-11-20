import { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Armchair,
  Fan,
  Lamp,
  Lightbulb,
  Monitor,
  Palette,
  Power,
  Snowflake,
  Sparkles,
  Sun,
  ToggleRight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { ACCENT_COLORS, useWorkspace } from '../context/WorkspaceContext';
import { PROFILE } from '../data/portfolioData';
import { soundEngine } from '../audio/soundEngine';
import { isWebGLAvailable } from '../three/webglUtils';
import {
  LightingMode,
  mountRoomScene,
  RoomDevicesState,
  RoomInteractivePart,
  RoomSceneController,
} from '../three/roomScene';

const PART_LABELS: Record<RoomInteractivePart, string> = {
  chair: 'Workstation Chair · Click to glide & sit at desk',
  desk: 'West-Wall Desk (5×2 ft) · Click to move smoothly to workstation',
  power: 'PC Tower · Click power button to boot JashedOS',
  monitor: 'Dual Monitors · Boot PC or sit at workstation',
  headphones: 'Studio Headphones · Toggle ambient synth soundtrack',
  keyboard: 'Mechanical Keyboard · Tactile RGB switches',
  ac: '1-Ton Inverter Split AC · Click to toggle ON/OFF',
  fan: '48" BLDC Ceiling Fan · Click to toggle ON/OFF',
  wallart: 'Framed Portraits · Jashed personal wall gallery',
  light_ceiling: '4× 12W Ceiling Downlights · Click to toggle ON/OFF',
  light_desk: 'Monitor Lightbar · Click to toggle desk lamp ON/OFF',
  light_rgb: 'Ambient RGB Strips · Click to toggle wall & PC glow',
  light_bed: '2700K Bedside Lamp · Click to toggle warm lamp ON/OFF',
  switch_ceiling: 'Wall Switch 1 · Ceiling Lights ON/OFF',
  switch_desk: 'Wall Switch 2 · Desk Lightbar ON/OFF',
  switch_rgb: 'Wall Switch 3 · RGB Ambient LEDs ON/OFF',
  switch_bed: 'Wall Switch 4 · Bedside Warm Lamp ON/OFF',
  switch_fan: 'Wall Switch 5 · Ceiling Fan ON/OFF',
  switch_ac: 'Wall Switch 6 · Inverter Split AC ON/OFF',
};

const LIGHTING_MODES: { id: LightingMode; label: string }[] = [
  { id: 'coding', label: 'Coding' },
  { id: 'study', label: 'Study' },
  { id: 'relax', label: 'Relax' },
  { id: 'cinematic', label: 'Cinematic' },
];

const INITIAL_DEVICES: RoomDevicesState = {
  ceilingLight: true,
  deskLight: true,
  rgbLight: true,
  bedLight: true,
  fan: true,
  ac: true,
};

export function RoomExperience() {
  const {
    experienceState,
    enterRoom,
    sitAtDesk,
    completeApproachingDesk,
    powerOnPC,
    skipToDesktop,
    setExperienceState,
    reducedMotion,
    setReducedMotion,
    accent,
    audioState,
  } = useWorkspace();

  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<RoomSceneController | null>(null);

  const [webglFailed, setWebglFailed] = useState<boolean>(() => !isWebGLAvailable());
  const [hoveredPart, setHoveredPart] = useState<RoomInteractivePart | null>(null);
  const [roomNotice, setRoomNotice] = useState<string | null>(null);
  const [lightingMode, setLightingMode] = useState<LightingMode>('coding');
  const [devices, setDevices] = useState<RoomDevicesState>(INITIAL_DEVICES);
  const [switchPanelOpen, setSwitchPanelOpen] = useState(false);
  const [inspectingSwitches, setInspectingSwitches] = useState(false);

  const stateRef = useRef(experienceState);
  stateRef.current = experienceState;

  const devicesRef = useRef(devices);
  devicesRef.current = devices;

  const accentHex = ACCENT_COLORS[accent].hex;

  const showTempNotice = (msg: string) => {
    setRoomNotice(msg);
    window.setTimeout(() => {
      setRoomNotice((curr) => (curr === msg ? null : curr));
    }, 2600);
  };

  const toggleDevice = (
    key: keyof RoomDevicesState,
    label: string,
    viaWallSwitch = false
  ) => {
    const nextVal = !devicesRef.current[key];
    const nextState: RoomDevicesState = { ...devicesRef.current, [key]: nextVal };
    devicesRef.current = nextState;
    setDevices(nextState);
    controllerRef.current?.setDevicesState(nextState);
    soundEngine.playKeyClick(false);
    showTempNotice(`${viaWallSwitch ? 'Wall Switch · ' : ''}${label}: ${nextVal ? 'ON' : 'OFF'}`);
  };

  const applyModePreset = (mode: LightingMode) => {
    setLightingMode(mode);
    const nextLights: Partial<RoomDevicesState> =
      mode === 'study'
        ? { ceilingLight: true, deskLight: true, rgbLight: true, bedLight: true }
        : mode === 'coding'
          ? { ceilingLight: true, deskLight: true, rgbLight: true, bedLight: true }
          : mode === 'relax'
            ? { ceilingLight: false, deskLight: false, rgbLight: true, bedLight: true }
            : { ceilingLight: false, deskLight: false, rgbLight: true, bedLight: true };
    const merged: RoomDevicesState = { ...devicesRef.current, ...nextLights };
    devicesRef.current = merged;
    setDevices(merged);
    controllerRef.current?.setLightingMode(mode);
    controllerRef.current?.setDevicesState(merged);
  };

  // GSAP-powered cinematic camera transition from entrance/room directly to seated desk chair
  const triggerCinematicSit = () => {
    setSwitchPanelOpen(false);
    setInspectingSwitches(false);
    sitAtDesk();
    if (controllerRef.current && !webglFailed) {
      controllerRef.current.animateCameraToDesk(() => {
        completeApproachingDesk();
      });
    } else {
      window.setTimeout(() => {
        completeApproachingDesk();
      }, 650);
    }
  };

  const handleToggleInspectSwitches = () => {
    if (!controllerRef.current || webglFailed) return;
    soundEngine.playMouseClick();
    if (inspectingSwitches) {
      setInspectingSwitches(false);
      controllerRef.current.animateCameraToOverview();
    } else {
      setInspectingSwitches(true);
      if (stateRef.current === 'ENTRANCE') {
        enterRoom();
      }
      controllerRef.current.animateCameraToWallSwitch();
      showTempNotice('Facing East Wall Switchboard · Click switches directly on the wall');
    }
  };

  useEffect(() => {
    const host = canvasHostRef.current;
    if (!host || webglFailed) return;

    try {
      const controller = mountRoomScene({
        container: host,
        initialState: stateRef.current,
        accentHex,
        onPartHover: (part) => setHoveredPart(part),
        onPartClick: (part) => {
          const st = stateRef.current;
          if (part === 'headphones') {
            soundEngine.toggleMusic();
            showTempNotice(
              soundEngine.getState().musicPlaying
                ? 'Ambient synth soundtrack started'
                : 'Ambient synth soundtrack paused'
            );
            return;
          }
          if (part === 'keyboard') {
            soundEngine.playKeyClick(false);
            showTempNotice('Mechanical tactile switches ready inside JashedOS');
            return;
          }
          if (part === 'fan' || part === 'switch_fan') {
            toggleDevice('fan', 'Ceiling Fan', part === 'switch_fan');
            return;
          }
          if (part === 'ac' || part === 'switch_ac') {
            toggleDevice('ac', 'Inverter AC', part === 'switch_ac');
            return;
          }
          if (part === 'light_ceiling' || part === 'switch_ceiling') {
            toggleDevice('ceilingLight', 'Ceiling Lights', part === 'switch_ceiling');
            return;
          }
          if (part === 'light_desk' || part === 'switch_desk') {
            toggleDevice('deskLight', 'Desk Lightbar', part === 'switch_desk');
            return;
          }
          if (part === 'light_rgb' || part === 'switch_rgb') {
            toggleDevice('rgbLight', 'Ambient RGB LEDs', part === 'switch_rgb');
            return;
          }
          if (part === 'light_bed' || part === 'switch_bed') {
            toggleDevice('bedLight', 'Bedside Lamp', part === 'switch_bed');
            return;
          }
          if (part === 'wallart') {
            soundEngine.playMouseClick();
            showTempNotice('Jashed · Personal Wall Portrait Gallery');
            return;
          }
          if (part === 'chair' || part === 'desk') {
            if (st === 'ENTRANCE' || st === 'EXPLORING') {
              triggerCinematicSit();
            }
            return;
          }
          if (part === 'power' || part === 'monitor') {
            if (st === 'ENTRANCE' || st === 'EXPLORING') {
              triggerCinematicSit();
            } else if (st === 'SEATED') {
              powerOnPC();
            }
          }
        },
        onContextLost: () => setWebglFailed(true),
      });

      controller.setLightingMode(lightingMode);
      controller.setDevicesState(devicesRef.current);
      controllerRef.current = controller;
      return () => {
        controller.dispose();
        controllerRef.current = null;
      };
    } catch {
      setWebglFailed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [webglFailed]);

  useEffect(() => {
    controllerRef.current?.setExperienceState(experienceState);
  }, [experienceState]);

  useEffect(() => {
    controllerRef.current?.setAccentColor(accentHex);
  }, [accentHex]);

  useEffect(() => {
    controllerRef.current?.setLightingMode(lightingMode);
  }, [lightingMode]);

  useEffect(() => {
    controllerRef.current?.setDevicesState(devices);
  }, [devices]);

  useEffect(() => {
    controllerRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  const setDpadMove = (dx: number, dz: number) => {
    controllerRef.current?.setMoveInput(dx, dz);
  };

  const activeLightsCount = [
    devices.ceilingLight,
    devices.deskLight,
    devices.rgbLight,
    devices.bedLight,
  ].filter(Boolean).length;

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#07080D] text-[#F4F5F7] select-none">
      {/* 3D WebGL Room Canvas OR Graceful 2D Studio Fallback */}
      {!webglFailed ? (
        <div
          ref={canvasHostRef}
          className="absolute inset-0 w-full h-full"
          aria-label="Interactive 12x10x9 ft dark tech bedroom and workstation"
        />
      ) : (
        <div className="absolute inset-0">
          <img
            src={PROFILE.setupPhotoDark}
            alt="Jashed Developer Workstation"
            className="w-full h-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07080D] via-[#07080D]/40 to-[#07080D]/60" />
        </div>
      )}

      {/* Top Slim Controls Bar with Lighting Modes, Wall Switchboard, AC & Fan Controls */}
      <header className="relative z-30 px-4 sm:px-6 pt-4 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <span className="font-display font-bold text-base sm:text-lg tracking-tight text-white">
            {PROFILE.brand}
            <span style={{ color: accentHex }}>.dev</span>
          </span>
          <span className="hidden xl:inline text-xs font-mono text-[#9CA3AF]">
            12×10×9 ft Dark Tech Studio
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-2">
          {/* Mobile Compact Lighting Cycle Button (< md) */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playMouseClick();
              const idx = LIGHTING_MODES.findIndex((m) => m.id === lightingMode);
              const next = LIGHTING_MODES[(idx + 1) % LIGHTING_MODES.length];
              applyModePreset(next.id);
              showTempNotice(`Lighting: ${next.label} Mode`);
            }}
            className="md:hidden inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-white/15 bg-[#0D1018]/92 text-xs font-medium text-[#E5E7EB] min-h-[38px] whitespace-nowrap shrink-0"
            title="Cycle Room Lighting Mode"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#FBBF24]" aria-hidden="true" />
            <span>{LIGHTING_MODES.find((m) => m.id === lightingMode)?.label}</span>
          </button>

          {/* 4-Mode Room Lighting Switcher (Desktop) */}
          <div className="hidden md:flex items-center gap-1 p-1 rounded-xl border border-white/15 bg-[#0D1018]/90">
            <Lightbulb className="w-3.5 h-3.5 text-[#FBBF24] mx-1.5" aria-hidden="true" />
            {LIGHTING_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  soundEngine.playMouseClick();
                  applyModePreset(m.id);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                  lightingMode === m.id
                    ? 'bg-white text-[#07080B] font-semibold'
                    : 'text-[#9CA3AF] hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Wall Switchboard & Individual Device Panel Toggle */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playMouseClick();
              setSwitchPanelOpen((o) => !o);
            }}
            className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors min-h-[38px] whitespace-nowrap shrink-0 ${
              switchPanelOpen
                ? 'border-[#8B5CF6]/70 bg-[#8B5CF6]/25 text-white'
                : 'border-white/18 bg-[#0D1018]/92 text-[#E5E7EB] hover:bg-white/12'
            }`}
            title="Individual Lights, Fan & AC Wall Switches"
            aria-expanded={switchPanelOpen}
          >
            <ToggleRight className="w-3.5 h-3.5 text-[#A78BFA]" aria-hidden="true" />
            <span>Switches</span>
            <span className="text-[10px] text-white/60 tabular-nums">{activeLightsCount}/4</span>
          </button>

          <button
            type="button"
            onClick={() => toggleDevice('ac', 'Inverter AC')}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors min-h-[38px] whitespace-nowrap shrink-0 ${
              devices.ac
                ? 'border-[#38BDF8]/50 bg-[#38BDF8]/18 text-[#38BDF8]'
                : 'border-white/15 bg-[#0D1018]/90 text-[#9CA3AF]'
            }`}
            title="Toggle 1-Ton Inverter AC"
            aria-label="Toggle 1-Ton Inverter AC"
          >
            <Snowflake className="w-3.5 h-3.5" aria-hidden="true" />
            <span>AC</span>
          </button>

          <button
            type="button"
            onClick={() => toggleDevice('fan', 'Ceiling Fan')}
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-colors min-h-[38px] whitespace-nowrap shrink-0 ${
              devices.fan
                ? 'border-[#8B5CF6]/55 bg-[#8B5CF6]/20 text-white'
                : 'border-white/15 bg-[#0D1018]/90 text-[#9CA3AF]'
            }`}
            title="Toggle 48-inch BLDC Ceiling Fan"
            aria-label="Toggle 48-inch BLDC Ceiling Fan"
          >
            <Fan className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Fan</span>
          </button>

          <button
            type="button"
            onClick={() => setReducedMotion((r) => !r)}
            className={`hidden xl:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors min-h-[38px] whitespace-nowrap shrink-0 ${
              reducedMotion
                ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-white'
                : 'border-white/15 bg-[#0D1018]/90 text-[#9CA3AF] hover:text-white'
            }`}
            title="Toggle reduced camera motion"
          >
            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{reducedMotion ? 'Reduced' : 'Smooth'}</span>
          </button>

          <button
            type="button"
            onClick={() => soundEngine.setMuted(!audioState.muted)}
            className="w-9 h-9 rounded-lg border border-white/15 bg-[#0D1018]/90 inline-flex items-center justify-center text-[#D1D5DB] hover:text-white transition-colors shrink-0"
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
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg border border-white/15 bg-[#0D1018]/92 text-xs font-medium text-[#E5E7EB] hover:bg-white/12 transition-colors min-h-[38px] whitespace-nowrap shrink-0"
          >
            <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Skip to OS</span>
            <span className="sm:hidden">OS</span>
          </button>
        </div>
      </header>

      {/* Expandable Wall Switchboard & Individual Device Panel (Zero backdrop-blur over WebGL) */}
      {switchPanelOpen && (
        <aside
          aria-label="Room Wall Switchboard"
          className="fixed top-16 right-4 sm:right-6 z-40 w-[min(336px,calc(100vw-32px))] rounded-2xl border border-white/20 bg-[#0D111C]/95 p-4 shadow-[inset_1px_1px_0_rgba(255,255,255,0.18),0_24px_60px_rgba(0,0,0,0.82)] space-y-3.5"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.1]">
            <div>
              <p className="text-xs font-semibold text-white">Studio Wall Switchboard</p>
              <p className="text-[11px] text-[#9CA3AF]">
                Toggle circuits individually or click the wall panel in 3D
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const allOn = {
                    ceilingLight: true,
                    deskLight: true,
                    rgbLight: true,
                    bedLight: true,
                    fan: true,
                    ac: true,
                  };
                  devicesRef.current = allOn;
                  setDevices(allOn);
                  controllerRef.current?.setDevicesState(allOn);
                  soundEngine.playKeyClick(false);
                  showTempNotice('All room lights, fan & AC turned ON');
                }}
                className="px-2 py-1 rounded-md bg-white/[0.1] hover:bg-white/[0.18] text-[10px] font-mono text-white"
              >
                All On
              </button>
              <button
                type="button"
                onClick={() => {
                  const allOff = {
                    ceilingLight: false,
                    deskLight: false,
                    rgbLight: false,
                    bedLight: false,
                    fan: false,
                    ac: false,
                  };
                  devicesRef.current = allOff;
                  setDevices(allOff);
                  controllerRef.current?.setDevicesState(allOff);
                  soundEngine.playKeyClick(false);
                  showTempNotice('All room lights, fan & AC turned OFF');
                }}
                className="px-2 py-1 rounded-md bg-white/[0.06] hover:bg-white/[0.14] text-[10px] font-mono text-[#D1D5DB]"
              >
                All Off
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { key: 'ceilingLight', label: 'Ceiling Lights', sub: '4× 4000K', icon: Sun, activeColor: '#FDE047' },
                { key: 'deskLight', label: 'Desk Lightbar', sub: 'Task Spot', icon: Lightbulb, activeColor: '#FFF3D6' },
                { key: 'rgbLight', label: 'Ambient RGB', sub: 'Bias & PC', icon: Palette, activeColor: '#A78BFA' },
                { key: 'bedLight', label: 'Bedside Lamp', sub: '2700K Warm', icon: Lamp, activeColor: '#FBBF24' },
                { key: 'fan', label: 'Ceiling Fan', sub: '48" BLDC', icon: Fan, activeColor: '#38BDF8' },
                { key: 'ac', label: 'Inverter AC', sub: '1-Ton 24°C', icon: Snowflake, activeColor: '#22D3EE' },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const isOn = devices[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleDevice(item.key, item.label)}
                  className={`p-2.5 rounded-xl border text-left transition-colors flex items-center gap-2.5 ${
                    isOn
                      ? 'bg-white/[0.12] border-white/25 text-white'
                      : 'bg-white/[0.03] border-white/[0.09] text-[#9CA3AF] hover:bg-white/[0.07]'
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                    style={{
                      backgroundColor: isOn ? `${item.activeColor}26` : 'rgba(255,255,255,0.04)',
                      color: isOn ? item.activeColor : '#6B7280',
                    }}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold truncate">{item.label}</div>
                    <div className="text-[10px] font-mono opacity-75 truncate">
                      {isOn ? 'ON' : 'OFF'} · {item.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={handleToggleInspectSwitches}
            className="w-full py-2 px-3 rounded-xl border border-white/15 bg-[#746EF4]/25 hover:bg-[#746EF4]/38 text-xs font-semibold text-white transition-colors flex items-center justify-center gap-2"
          >
            <ToggleRight className="w-4 h-4 text-[#A78BFA]" aria-hidden="true" />
            <span>
              {inspectingSwitches ? 'Return to Room Overview' : 'Focus Camera on Wall Switch Panel'}
            </span>
          </button>
        </aside>
      )}

      {/* Hover / Interaction Toast */}
      {(hoveredPart || roomNotice) && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 px-3.5 py-1.5 rounded-lg border border-white/15 bg-[#0B0E16]/94 text-xs font-mono text-[#E5E7EB] pointer-events-none whitespace-nowrap max-w-[92vw] truncate">
          {roomNotice || (hoveredPart ? PART_LABELS[hoveredPart] : '')}
        </div>
      )}

      {/* STATE 1: ENTRANCE OVERLAY — Signature Front Style, Zero Unnecessary Text */}
      {experienceState === 'ENTRANCE' && (
        <div className="absolute inset-x-0 bottom-5 sm:bottom-9 z-20 px-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl rounded-3xl border border-white/[0.14] bg-[#101114]/92 p-4 sm:p-6 shadow-[0_28px_70px_rgba(0,0,0,0.75)] space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-stretch">
              {/* Left Periwinkle Cutout Panel with Real Portrait */}
              <div className="sm:col-span-5 relative rounded-2xl bg-[#746EF4] overflow-hidden min-h-[155px] sm:min-h-[190px] flex items-end justify-center">
                <div className="absolute top-0 left-0 bg-[#101114] px-3 py-1.5 rounded-br-2xl font-mono text-[11px] tracking-[0.22em] text-white/90">
                  01 / AHJ
                </div>
                <img
                  src={PROFILE.portraitPath}
                  alt={PROFILE.fullName}
                  className="w-full h-full max-h-[210px] object-cover object-top mix-blend-normal"
                />
                <div className="absolute bottom-0 right-0 bg-[#101114] pl-3 pt-1.5 pb-1 pr-2 rounded-tl-2xl text-[10px] font-mono tracking-wider text-white/80">
                  STUDIO 3D
                </div>
              </div>

              {/* Right Bold Display Stack (Zero Filler Prose) */}
              <div className="sm:col-span-7 flex flex-col justify-between py-1">
                <div className="font-display font-extrabold uppercase leading-[0.94] tracking-tight">
                  <div className="text-2xl sm:text-3xl text-white">HEY</div>
                  <div className="text-2xl sm:text-3xl text-white">THIS</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl text-white">IS</span>
                    <span className="text-3xl sm:text-4xl text-outline-hero">JASHED</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 pt-3 border-t border-white/[0.1]">
                  <div className="text-[11px] font-bold uppercase tracking-[0.08em] leading-tight text-white/85">
                    <div>FULL-STACK</div>
                    <div>ANDROID &amp; AI</div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#9CA3AF] block">
                      I GO BY
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-[#746EF4]">
                      Creative Developer
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Strip Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-white/[0.1]">
              <button
                type="button"
                onClick={triggerCinematicSit}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white transition-transform active:scale-[0.98] min-h-[42px] whitespace-nowrap shrink-0"
                style={{ backgroundColor: '#746EF4' }}
              >
                <Armchair className="w-4 h-4" aria-hidden="true" />
                <span>Sit at Desk</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={enterRoom}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/15 bg-white/[0.06] hover:bg-white/[0.12] text-xs sm:text-sm font-medium text-[#E5E7EB] transition-colors min-h-[42px] whitespace-nowrap shrink-0"
                >
                  <span>Explore Room</span>
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>

                <button
                  type="button"
                  onClick={() => skipToDesktop()}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-white/15 bg-white text-[#101114] hover:bg-white/90 text-xs sm:text-sm font-bold transition-colors min-h-[42px] whitespace-nowrap shrink-0"
                >
                  <Monitor className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Launch OS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE 2: EXPLORING ROOM HUD */}
      {experienceState === 'EXPLORING' && (
        <div className="fixed inset-x-0 bottom-5 z-20 px-4 sm:px-6 flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 pointer-events-none">
          <div className="pointer-events-auto rounded-xl border border-white/15 bg-[#101114]/90 px-4 py-2.5 flex flex-wrap items-center gap-3 max-w-full">
            <span className="text-xs font-mono text-white">
              <span className="hidden md:inline">WASD · Drag to look · Click Desk</span>
              <span className="md:hidden">Drag to look · Tap Desk</span>
            </span>

            <button
              type="button"
              onClick={triggerCinematicSit}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold text-white transition-colors min-h-[38px] whitespace-nowrap shrink-0"
              style={{ backgroundColor: '#746EF4' }}
            >
              <Armchair className="w-4 h-4" aria-hidden="true" />
              <span>Sit at Desk</span>
            </button>
          </div>

          {/* Mobile / Touch D-Pad */}
          <div className="pointer-events-auto md:hidden grid grid-cols-3 gap-1.5 p-2 rounded-xl border border-white/15 bg-[#101114]/90">
            <div />
            <button
              type="button"
              onPointerDown={() => setDpadMove(0, -1)}
              onPointerUp={() => setDpadMove(0, 0)}
              onPointerLeave={() => setDpadMove(0, 0)}
              className="w-11 h-11 rounded-lg bg-white/[0.07] active:bg-[#746EF4]/40 flex items-center justify-center"
              aria-label="Move forward"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
            <div />
            <button
              type="button"
              onPointerDown={() => setDpadMove(-1, 0)}
              onPointerUp={() => setDpadMove(0, 0)}
              onPointerLeave={() => setDpadMove(0, 0)}
              className="w-11 h-11 rounded-lg bg-white/[0.07] active:bg-[#746EF4]/40 flex items-center justify-center"
              aria-label="Strafe left"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onPointerDown={() => setDpadMove(0, 1)}
              onPointerUp={() => setDpadMove(0, 0)}
              onPointerLeave={() => setDpadMove(0, 0)}
              className="w-11 h-11 rounded-lg bg-white/[0.07] active:bg-[#746EF4]/40 flex items-center justify-center"
              aria-label="Move backward"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
            <button
              type="button"
              onPointerDown={() => setDpadMove(1, 0)}
              onPointerUp={() => setDpadMove(0, 0)}
              onPointerLeave={() => setDpadMove(0, 0)}
              className="w-11 h-11 rounded-lg bg-white/[0.07] active:bg-[#746EF4]/40 flex items-center justify-center"
              aria-label="Strafe right"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: APPROACHING DESK / SEATED AT CHAIR */}
      {(experienceState === 'APPROACHING_DESK' || experienceState === 'SEATED') && (
        <div className="fixed inset-x-0 bottom-6 z-20 px-4 flex justify-center pointer-events-none">
          <div className="pointer-events-auto rounded-2xl border border-white/15 bg-[#101114]/92 px-5 py-3.5 shadow-2xl flex flex-wrap items-center justify-center gap-4 max-w-xl">
            <span className="text-xs sm:text-sm font-mono text-[#38BDF8]">
              {experienceState === 'APPROACHING_DESK'
                ? 'Gliding to workstation...'
                : 'Seated · Ready to boot JashedOS'}
            </span>

            {experienceState === 'SEATED' && (
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setExperienceState('EXPLORING')}
                  className="px-3.5 py-2 rounded-xl border border-white/15 text-xs font-medium text-[#D1D5DB] hover:bg-white/[0.08] min-h-[40px] whitespace-nowrap shrink-0"
                >
                  Stand Up
                </button>
                <button
                  type="button"
                  onClick={powerOnPC}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#746EF4] hover:bg-[#847EF8] text-white text-xs sm:text-sm font-bold transition-colors min-h-[40px] whitespace-nowrap shrink-0"
                >
                  <Power className="w-4 h-4" aria-hidden="true" />
                  <span>Power On PC</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
