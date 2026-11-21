import { useCallback, useEffect, useRef, useState } from 'react';
import { ACCENT_COLORS, RoomDevicesState, useWorkspace } from '../context/WorkspaceContext';
import { soundEngine } from '../audio/soundEngine';
import { isWebGLAvailable } from '../three/webglUtils';
import {
  LightingMode,
  mountRoomScene,
  RoomInteractivePart,
  RoomSceneController,
} from '../three/roomScene';
import { RacingTelemetry } from '../three/room/roomTypes';
import { Room } from './room/Room';
import { InteractiveBed } from './room/InteractiveBed';
import { InteractivePhone } from './room/InteractivePhone';
import { GamingSetup } from './room/GamingSetup';

/**
 * Orchestrates the interactive 3D bedroom WebGL scene alongside separated modular
 * UI components (Room, InteractiveBed, InteractivePhone, GamingSetup HUD).
 */
export function RoomExperience() {
  const {
    experienceState,
    enterRoom,
    sitAtDesk,
    completeApproachingDesk,
    powerOnPC,
    setExperienceState,
    cameraPose,
    setCameraPose,
    roomLightsOn,
    setRoomLightsOn,
    devices,
    setDevices,
    phoneCharging,
    togglePhoneCharging,
    gamingMode,
    toggleGamingMode,
    steeringAngle,
    setSteeringAngle,
    reducedMotion,
    accent,
  } = useWorkspace();

  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<RoomSceneController | null>(null);

  const [webglFailed, setWebglFailed] = useState<boolean>(() => !isWebGLAvailable());
  const [hoveredPart, setHoveredPart] = useState<RoomInteractivePart | null>(null);
  const [roomNotice, setRoomNotice] = useState<string | null>(null);
  const [lightingMode, setLightingMode] = useState<LightingMode>('coding');
  const [switchPanelOpen, setSwitchPanelOpen] = useState(false);
  const [inspectingSwitches, setInspectingSwitches] = useState(false);
  const [racingTelemetry, setRacingTelemetry] = useState<RacingTelemetry>({
    speedKmh: 0,
    gear: 1,
    rpm: 1100,
    lapTimeSec: 0,
  });

  const stateRef = useRef(experienceState);
  stateRef.current = experienceState;

  const devicesRef = useRef(devices);
  devicesRef.current = devices;

  const cameraPoseRef = useRef(cameraPose);
  cameraPoseRef.current = cameraPose;

  const steeringAngleRef = useRef(steeringAngle);
  steeringAngleRef.current = steeringAngle;

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
    showTempNotice(`${viaWallSwitch ? 'Wall switch · ' : ''}${label}: ${nextVal ? 'On' : 'Off'}`);
  };

  const handleSetAllDevices = (enabled: boolean) => {
    const allState: RoomDevicesState = {
      ceilingLight: enabled,
      deskLight: enabled,
      rgbLight: enabled,
      bedLight: enabled,
      fan: enabled,
      ac: enabled,
    };
    devicesRef.current = allState;
    setDevices(allState);
    controllerRef.current?.setDevicesState(allState);
    soundEngine.playKeyClick(false);
    showTempNotice(`All room systems: ${enabled ? 'On' : 'Off'}`);
  };

  const handleToggleMasterLights = () => {
    const next = !roomLightsOn;
    setRoomLightsOn(next);
    showTempNotice(next ? 'Room lights: On' : 'Room lights: Off (ambient shadow mode)');
  };

  const applyModePreset = (mode: LightingMode) => {
    setLightingMode(mode);
    const nextLights: Partial<RoomDevicesState> =
      mode === 'study' || mode === 'coding'
        ? { ceilingLight: true, deskLight: true, rgbLight: true, bedLight: true }
        : { ceilingLight: false, deskLight: false, rgbLight: true, bedLight: true };
    const merged: RoomDevicesState = { ...devicesRef.current, ...nextLights };
    devicesRef.current = merged;
    setDevices(merged);
    controllerRef.current?.setLightingMode(mode);
    controllerRef.current?.setDevicesState(merged);
  };

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
      }, 600);
    }
  };

  const triggerLieOnBed = () => {
    setSwitchPanelOpen(false);
    setInspectingSwitches(false);
    if (stateRef.current === 'ENTRANCE') {
      enterRoom();
    }
    setCameraPose('BED_LYING');
    controllerRef.current?.animateCameraToBed();
    soundEngine.playTransitionSwoosh();
  };

  const exitBedToOverview = () => {
    setCameraPose('OVERVIEW');
    controllerRef.current?.animateCameraToOverview();
    soundEngine.playTransitionSwoosh();
  };

  const triggerPhoneView = () => {
    setSwitchPanelOpen(false);
    setInspectingSwitches(false);
    if (stateRef.current === 'ENTRANCE') {
      enterRoom();
    }
    setCameraPose('PHONE');
    controllerRef.current?.animateCameraToPhone();
    soundEngine.playTransitionSwoosh();
  };

  const exitPhoneToOverview = () => {
    setCameraPose('OVERVIEW');
    controllerRef.current?.animateCameraToOverview();
    soundEngine.playTransitionSwoosh();
  };

  const triggerGamingView = () => {
    setSwitchPanelOpen(false);
    setInspectingSwitches(false);
    if (stateRef.current === 'ENTRANCE') {
      enterRoom();
    }
    setCameraPose('GAMING');
    controllerRef.current?.animateCameraToGaming();
    soundEngine.playTransitionSwoosh();
  };

  const exitGamingToOverview = () => {
    setCameraPose('OVERVIEW');
    controllerRef.current?.animateCameraToOverview();
    soundEngine.playTransitionSwoosh();
  };

  const handleToggleOutlet = () => {
    const next = togglePhoneCharging();
    showTempNotice(next ? 'Phone charging via wall outlet' : 'Charger unplugged from wall outlet');
  };

  const handleToggleGamingMode = () => {
    const next = toggleGamingMode();
    showTempNotice(next ? 'Gaming console active' : 'Gaming console standby');
  };

  const handleSteerWheel = useCallback(
    (deltaDeg: number, reset = false) => {
      soundEngine.playKeyClick(false);
      setSteeringAngle((prev) => {
        const next = reset ? 0 : Math.max(-90, Math.min(90, prev + deltaDeg));
        return next;
      });
    },
    [setSteeringAngle]
  );

  const handleRacingInput = useCallback((throttle: boolean, brake: boolean) => {
    controllerRef.current?.setRacingInput(throttle, brake);
  }, []);

  const handleToggleInspectSwitches = () => {
    if (!controllerRef.current || webglFailed) return;
    soundEngine.playMouseClick();
    if (inspectingSwitches) {
      setInspectingSwitches(false);
      setCameraPose('OVERVIEW');
      controllerRef.current.animateCameraToOverview();
    } else {
      setInspectingSwitches(true);
      setCameraPose('WALL_SWITCH');
      if (stateRef.current === 'ENTRANCE') {
        enterRoom();
      }
      controllerRef.current.animateCameraToWallSwitch();
      showTempNotice('Facing East wall switchboard');
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
        onRacingTelemetry: (telemetry) => setRacingTelemetry(telemetry),
        onPartClick: (part) => {
          const st = stateRef.current;
          if (part === 'bed') {
            triggerLieOnBed();
            return;
          }
          if (part === 'phone') {
            triggerPhoneView();
            return;
          }
          if (part === 'outlet') {
            handleToggleOutlet();
            return;
          }
          if (part === 'console' || part === 'gaming_monitor') {
            handleToggleGamingMode();
            if (cameraPoseRef.current !== 'GAMING') {
              triggerGamingView();
            }
            return;
          }
          if (part === 'wheel') {
            handleSteerWheel(steeringAngleRef.current >= 45 ? -70 : 35);
            if (cameraPoseRef.current !== 'GAMING') {
              triggerGamingView();
            }
            return;
          }
          if (part === 'headphones') {
            soundEngine.toggleMusic();
            showTempNotice(
              soundEngine.getState().musicPlaying
                ? 'Ambient soundtrack started'
                : 'Ambient soundtrack paused'
            );
            return;
          }
          if (part === 'keyboard') {
            soundEngine.playKeyClick(false);
            showTempNotice('Mechanical tactile switches ready');
            return;
          }
          if (part === 'fan' || part === 'switch_fan') {
            toggleDevice('fan', 'Ceiling fan', part === 'switch_fan');
            return;
          }
          if (part === 'ac' || part === 'switch_ac') {
            toggleDevice('ac', 'Inverter AC', part === 'switch_ac');
            return;
          }
          if (part === 'light_ceiling' || part === 'switch_ceiling') {
            toggleDevice('ceilingLight', 'Ceiling lights', part === 'switch_ceiling');
            return;
          }
          if (part === 'light_desk' || part === 'switch_desk') {
            toggleDevice('deskLight', 'Desk lightbar', part === 'switch_desk');
            return;
          }
          if (part === 'light_rgb' || part === 'switch_rgb') {
            toggleDevice('rgbLight', 'Wall LED panels', part === 'switch_rgb');
            return;
          }
          if (part === 'light_bed' || part === 'switch_bed') {
            toggleDevice('bedLight', 'Bedside lamp', part === 'switch_bed');
            return;
          }
          if (part === 'wallart') {
            soundEngine.playMouseClick();
            showTempNotice('Jashed personal portrait gallery');
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
      controller.setChargingState(phoneCharging);
      controller.setGamingMode(gamingMode);
      controller.setSteeringWheelAngle(steeringAngle);
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

  // Synchronize centralized WorkspaceContext state -> 3D WebGL scene controller
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
    controllerRef.current?.setChargingState(phoneCharging);
  }, [phoneCharging]);

  useEffect(() => {
    controllerRef.current?.setGamingMode(gamingMode);
  }, [gamingMode]);

  useEffect(() => {
    controllerRef.current?.setSteeringWheelAngle(steeringAngle);
  }, [steeringAngle]);

  useEffect(() => {
    controllerRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  return (
    <>
      <Room
        canvasHostRef={canvasHostRef}
        webglFailed={webglFailed}
        hoveredPart={hoveredPart}
        roomNotice={roomNotice}
        lightingMode={lightingMode}
        switchPanelOpen={switchPanelOpen}
        inspectingSwitches={inspectingSwitches}
        onToggleSwitchPanel={() => setSwitchPanelOpen((o) => !o)}
        onToggleMasterLights={handleToggleMasterLights}
        onApplyLightingMode={applyModePreset}
        onToggleDevice={(k, lbl) => toggleDevice(k, lbl)}
        onSetAllDevices={handleSetAllDevices}
        onToggleInspectSwitches={handleToggleInspectSwitches}
        onTriggerSit={triggerCinematicSit}
        onTriggerLieOnBed={triggerLieOnBed}
        onTriggerPhoneView={triggerPhoneView}
        onTriggerGamingView={triggerGamingView}
        onDpadMove={(dx, dz) => controllerRef.current?.setMoveInput(dx, dz)}
      />

      {cameraPose === 'BED_LYING' && (
        <InteractiveBed
          onExitBed={exitBedToOverview}
          onToggleBedLamp={() => toggleDevice('bedLight', 'Bedside lamp')}
          onToggleMasterLights={handleToggleMasterLights}
          onGoToPhone={triggerPhoneView}
        />
      )}

      {cameraPose === 'PHONE' && (
        <InteractivePhone
          onExitPhone={exitPhoneToOverview}
          onToggleOutlet={handleToggleOutlet}
          onGoToBed={triggerLieOnBed}
        />
      )}

      <GamingSetup
        telemetry={racingTelemetry}
        onToggleGamingMode={handleToggleGamingMode}
        onSteerWheel={handleSteerWheel}
        onRacingInput={handleRacingInput}
        onExitGamingView={exitGamingToOverview}
      />
    </>
  );
}
