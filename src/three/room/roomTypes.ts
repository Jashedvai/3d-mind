import * as THREE from 'three';
import { ExperienceState, RoomDevicesState } from '../../context/WorkspaceContext';

export type RoomInteractivePart =
  | 'chair'
  | 'desk'
  | 'power'
  | 'monitor'
  | 'headphones'
  | 'keyboard'
  | 'ac'
  | 'fan'
  | 'wallart'
  | 'bed'
  | 'phone'
  | 'outlet'
  | 'console'
  | 'wheel'
  | 'gaming_monitor'
  | 'light_ceiling'
  | 'light_desk'
  | 'light_rgb'
  | 'light_bed'
  | 'switch_ceiling'
  | 'switch_desk'
  | 'switch_rgb'
  | 'switch_bed'
  | 'switch_fan'
  | 'switch_ac';

export type LightingMode = 'study' | 'coding' | 'relax' | 'cinematic';

export type HitboxRegisterFn = (
  parent: THREE.Object3D,
  size: [number, number, number],
  offset: [number, number, number],
  part: RoomInteractivePart
) => void;

export interface RacingTelemetry {
  speedKmh: number;
  gear: number;
  rpm: number;
  lapTimeSec: number;
}

export interface RoomSceneController {
  setExperienceState: (state: ExperienceState) => void;
  animateCameraToDesk: (onComplete?: () => void) => void;
  animateCameraToBed: (onComplete?: () => void) => void;
  animateCameraToPhone: (onComplete?: () => void) => void;
  animateCameraToGaming: (onComplete?: () => void) => void;
  animateCameraToWallSwitch: (onComplete?: () => void) => void;
  animateCameraToOverview: (onComplete?: () => void) => void;
  setMoveInput: (dx: number, dz: number) => void;
  setAccentColor: (hex: string) => void;
  setLightingMode: (mode: LightingMode) => void;
  setDevicesState: (devices: RoomDevicesState) => void;
  setChargingState: (charging: boolean) => void;
  setGamingMode: (enabled: boolean) => void;
  setSteeringWheelAngle: (deg: number) => void;
  setRacingInput: (throttle: boolean, brake: boolean) => void;
  setFanEnabled: (enabled: boolean) => void;
  setAcEnabled: (enabled: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
}

export interface RoomSceneOptions {
  container: HTMLElement;
  initialState: ExperienceState;
  accentHex?: string;
  onPartClick?: (part: RoomInteractivePart) => void;
  onPartHover?: (part: RoomInteractivePart | null) => void;
  onRacingTelemetry?: (telemetry: RacingTelemetry) => void;
  onContextLost?: () => void;
}
