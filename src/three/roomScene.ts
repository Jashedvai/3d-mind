import * as THREE from 'three';
import gsap from 'gsap';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { ExperienceState } from '../context/WorkspaceContext';
import { soundEngine } from '../audio/soundEngine';
import {
  afterSoftwareDraw,
  createContactShadowTexture,
  detectSoftwareWebGL,
  disposeObject3D,
} from './webglUtils';

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

export interface RoomDevicesState {
  ceilingLight: boolean;
  deskLight: boolean;
  rgbLight: boolean;
  bedLight: boolean;
  fan: boolean;
  ac: boolean;
}

export interface RoomSceneController {
  setExperienceState: (state: ExperienceState) => void;
  animateCameraToDesk: (onComplete?: () => void) => void;
  animateCameraToWallSwitch: (onComplete?: () => void) => void;
  animateCameraToOverview: (onComplete?: () => void) => void;
  setMoveInput: (dx: number, dz: number) => void;
  setAccentColor: (hex: string) => void;
  setLightingMode: (mode: LightingMode) => void;
  setDevicesState: (devices: RoomDevicesState) => void;
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
  onContextLost?: () => void;
}

// Reusable math temporaries (zero per-frame GC)
const _rayMouse = new THREE.Vector2();
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _lookHelper = new THREE.Object3D();

function createWoodFloorTexture(): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512;
  const colorCanvas = document.createElement('canvas');
  colorCanvas.width = size;
  colorCanvas.height = size;
  const cCtx = colorCanvas.getContext('2d');

  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d');

  if (cCtx && bCtx) {
    cCtx.fillStyle = '#1c1615';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);

    const planks = 8;
    const plankH = size / planks;
    for (let i = 0; i < planks; i++) {
      const r = 30 + ((i * 11) % 10);
      const g = 24 + ((i * 7) % 8);
      const b = 22 + ((i * 5) % 6);
      cCtx.fillStyle = `rgb(${r}, ${g}, ${b})`;
      cCtx.fillRect(0, i * plankH, size, plankH - 2);

      const bumpBase = 135 + ((i * 19) % 25);
      bCtx.fillStyle = `rgb(${bumpBase},${bumpBase},${bumpBase})`;
      bCtx.fillRect(0, i * plankH, size, plankH - 2);

      for (let s = 0; s < 10; s++) {
        const yOff = i * plankH + 4 + s * ((plankH - 8) / 10);
        cCtx.strokeStyle = s % 2 === 0 ? 'rgba(255,245,235,0.03)' : 'rgba(0,0,0,0.16)';
        cCtx.lineWidth = 1;
        cCtx.beginPath();
        cCtx.moveTo(0, yOff);
        cCtx.bezierCurveTo(size * 0.3, yOff + 1.5, size * 0.7, yOff - 1.5, size, yOff);
        cCtx.stroke();

        bCtx.strokeStyle = 'rgba(255,255,255,0.08)';
        bCtx.beginPath();
        bCtx.moveTo(0, yOff);
        bCtx.lineTo(size, yOff);
        bCtx.stroke();
      }

      cCtx.fillStyle = '#0b0909';
      cCtx.fillRect(0, (i + 1) * plankH - 2, size, 2);
      bCtx.fillStyle = '#202020';
      bCtx.fillRect(0, (i + 1) * plankH - 2, size, 2);

      const stagger = ((i % 2) * size) / 2 + 78;
      cCtx.fillRect(stagger % size, i * plankH, 2, plankH);
      bCtx.fillRect(stagger % size, i * plankH, 2, plankH);
    }
  }

  const map = new THREE.CanvasTexture(colorCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(4, 4);

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.wrapS = THREE.RepeatWrapping;
  bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(4, 4);

  return { map, bumpMap };
}

function createPlasterWallTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#1b1d26';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 1600; i++) {
      const x = (i * 73) % size;
      const y = (i * 139) % size;
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.018)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(x, y, 2, 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(3, 2);
  return tex;
}

function createWalnutGrainTextures(): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;
  const cCanvas = document.createElement('canvas');
  cCanvas.width = size;
  cCanvas.height = size;
  const cCtx = cCanvas.getContext('2d');

  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d');

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d');

  if (cCtx && bCtx && rCtx) {
    cCtx.fillStyle = '#2c201b';
    cCtx.fillRect(0, 0, size, size);
    bCtx.fillStyle = '#808080';
    bCtx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#909090';
    rCtx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 2) {
      const wave = Math.sin(y * 0.045) * 14 + Math.cos(y * 0.017) * 9;
      const shade = ((y * 37) % 18) - 9;
      cCtx.strokeStyle = `rgb(${44 + shade}, ${31 + Math.round(shade * 0.7)}, ${25 + Math.round(shade * 0.5)})`;
      cCtx.lineWidth = 2;
      cCtx.beginPath();
      cCtx.moveTo(0, y);
      cCtx.bezierCurveTo(size * 0.33, y + wave * 0.4, size * 0.66, y - wave * 0.4, size, y);
      cCtx.stroke();

      const bVal = 128 + shade * 2;
      bCtx.strokeStyle = `rgb(${bVal},${bVal},${bVal})`;
      bCtx.beginPath();
      bCtx.moveTo(0, y);
      bCtx.lineTo(size, y);
      bCtx.stroke();

      const rVal = 120 + ((y * 19) % 45);
      rCtx.strokeStyle = `rgb(${rVal},${rVal},${rVal})`;
      rCtx.beginPath();
      rCtx.moveTo(0, y);
      rCtx.lineTo(size, y);
      rCtx.stroke();
    }
  }

  const map = new THREE.CanvasTexture(cCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;

  return { map, bumpMap, roughnessMap };
}

function createFabricWeaveTextures(): {
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 256;
  const bCanvas = document.createElement('canvas');
  bCanvas.width = size;
  bCanvas.height = size;
  const bCtx = bCanvas.getContext('2d');

  const rCanvas = document.createElement('canvas');
  rCanvas.width = size;
  rCanvas.height = size;
  const rCtx = rCanvas.getContext('2d');

  if (bCtx && rCtx) {
    bCtx.fillStyle = '#787878';
    bCtx.fillRect(0, 0, size, size);
    rCtx.fillStyle = '#c8c8c8';
    rCtx.fillRect(0, 0, size, size);

    for (let y = 0; y < size; y += 4) {
      bCtx.fillStyle = y % 8 === 0 ? '#a0a0a0' : '#585858';
      bCtx.fillRect(0, y, size, 2);
      rCtx.fillStyle = y % 8 === 0 ? '#dcdcdc' : '#b2b2b2';
      rCtx.fillRect(0, y, size, 2);
    }
    for (let x = 0; x < size; x += 4) {
      bCtx.fillStyle = x % 8 === 0 ? 'rgba(220,220,220,0.28)' : 'rgba(40,40,40,0.28)';
      bCtx.fillRect(x, 0, 2, size);
    }
  }

  const bumpMap = new THREE.CanvasTexture(bCanvas);
  bumpMap.wrapS = bumpMap.wrapT = THREE.RepeatWrapping;
  bumpMap.repeat.set(6, 6);

  const roughnessMap = new THREE.CanvasTexture(rCanvas);
  roughnessMap.wrapS = roughnessMap.wrapT = THREE.RepeatWrapping;
  roughnessMap.repeat.set(6, 6);

  return { bumpMap, roughnessMap };
}

function createDeskMatTexture(accentHex: string): THREE.CanvasTexture {
  const w = 512;
  const h = 256;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#0e1119';
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) {
      ctx.fillStyle = y % 6 === 0 ? 'rgba(255,255,255,0.015)' : 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, y, w, 1);
    }
    ctx.strokeStyle = accentHex;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.globalAlpha = 1;
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWovenRugTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#161822';
    ctx.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 4) {
      ctx.fillStyle = y % 8 === 0 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, y, size, 2);
    }
    ctx.strokeStyle = 'rgba(139,92,246,0.28)';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, size - 16, size - 16);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createNightSkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, 256);
    grad.addColorStop(0, '#070b18');
    grad.addColorStop(0.65, '#132245');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    const moon = ctx.createRadialGradient(185, 68, 4, 185, 68, 46);
    moon.addColorStop(0, 'rgba(226, 232, 240, 0.95)');
    moon.addColorStop(0.22, 'rgba(147, 197, 253, 0.35)');
    moon.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = moon;
    ctx.fillRect(120, 12, 120, 120);

    ctx.fillStyle = '#070a14';
    const heights = [36, 54, 42, 72, 48, 66, 38, 58, 44, 62];
    heights.forEach((h, idx) => {
      ctx.fillRect(idx * 26, 256 - h, 24, h);
    });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createMonitorDesktopTexture(accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 576;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const bg = ctx.createLinearGradient(0, 0, 1024, 576);
    bg.addColorStop(0, '#090b16');
    bg.addColorStop(0.45, '#161333');
    bg.addColorStop(1, '#081221');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 576);

    const rad = ctx.createRadialGradient(540, 270, 24, 540, 270, 400);
    rad.addColorStop(0, `${accentHex}44`);
    rad.addColorStop(0.55, '#38BDF822');
    rad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, 1024, 576);

    ctx.fillStyle = 'rgba(15, 17, 26, 0.8)';
    ctx.fillRect(0, 0, 1024, 30);
    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 13px sans-serif';
    ctx.fillText('JashedOS   File   Edit   View   Window', 20, 20);

    ctx.fillStyle = 'rgba(18, 20, 30, 0.88)';
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(190, 92, 644, 348, 18);
    ctx.fill();
    ctx.stroke();

    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(218 + i * 20, 114, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '700 44px sans-serif';
    ctx.fillText('Jashed', 238, 214);
    ctx.fillStyle = accentHex;
    ctx.fillText('.dev', 392, 214);

    ctx.fillStyle = '#CBD5E1';
    ctx.font = '400 18px sans-serif';
    ctx.fillText('macOS / iOS Inspired Developer Workspace', 238, 252);
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('Power on PC to explore Projects, Terminal & 3D Journey', 238, 282);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.beginPath();
    ctx.roundRect(312, 508, 400, 50, 18);
    ctx.fill();
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createSideMonitorTexture(accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 896;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#090B12';
    ctx.fillRect(0, 0, 512, 896);
    ctx.fillStyle = '#141724';
    ctx.fillRect(0, 0, 512, 46);
    ['#FF5F57', '#FEBC2E', '#28C840'].forEach((col, i) => {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(24 + i * 18, 23, 5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = '#94A3B8';
    ctx.font = '500 15px monospace';
    ctx.fillText('room_blueprint.ts', 90, 28);

    const lines = [
      'const studio = {',
      '  size: "12 x 10 x 9 ft",',
      '  area: "120 sq ft",',
      '  theme: "Dark Charcoal + Purple",',
      '  cooling: ["1-Ton Inverter AC", "48in BLDC Fan"],',
      '  lighting: ["4000K Ceiling", "3000K Bed", "RGB"],',
      '  workstation: {',
      '    desk: "West Wall (5x2 ft)",',
      '    displays: "Dual Monitor + UPS",',
      '  },',
      '};',
      '',
      '// Press PC Power Button to boot JashedOS',
      'jashed@workspace:~$ _',
    ];
    lines.forEach((line, i) => {
      const y = 96 + i * 36;
      ctx.fillStyle = '#475569';
      ctx.font = '400 14px monospace';
      ctx.fillText(String(i + 1).padStart(2, '0'), 18, y);
      ctx.fillStyle = line.includes('"')
        ? '#A5F3FC'
        : line.includes('//')
          ? '#64748B'
          : line.includes('const')
            ? accentHex
            : '#E2E8F0';
      ctx.fillText(line, 56, y);
    });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createWallSwitchPlateTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createLinearGradient(0, 0, 512, 320);
    grad.addColorStop(0, '#181c28');
    grad.addColorStop(1, '#10131c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 320);

    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, 496, 304);

    ctx.fillStyle = 'rgba(226, 232, 240, 0.72)';
    ctx.font = '600 15px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('STUDIO SMART SWITCHBOARD', 256, 36);

    const labels = ['CEILING', 'DESK', 'RGB', 'LAMP', 'FAN', 'AC'];
    const cols = 3;
    labels.forEach((lbl, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const cx = 104 + col * 152;
      const cy = row === 0 ? 150 : 284;
      ctx.fillStyle = 'rgba(241, 245, 249, 0.85)';
      ctx.font = '700 16px sans-serif';
      ctx.fillText(lbl, cx, cy);
    });
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function mountRoomScene(options: RoomSceneOptions): RoomSceneController {
  const {
    container,
    initialState,
    accentHex = '#8B5CF6',
    onPartClick,
    onPartHover,
    onContextLost,
  } = options;

  const isSoftwareGl = detectSoftwareWebGL();
  const isNarrow = window.innerWidth < 768;

  const width = Math.max(container.clientWidth, 300);
  const height = Math.max(container.clientHeight, 300);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06070c);
  scene.fog = new THREE.FogExp2(0x06070c, 0.025);

  const camera = new THREE.PerspectiveCamera(isNarrow ? 64 : 50, width / height, 0.1, 60);
  camera.rotation.order = 'YXZ';

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(
    isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, isNarrow ? 1.5 : 2)
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.touchAction = 'none';

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmrem.dispose();

  // ==========================================
  // 12 x 10 x 9 ft ROOM COORDINATES (1 ft = 0.45 units)
  // East-West (X): [-2.25, +2.25] (10 ft = 4.50 units)
  // North-South (Z): [-2.70, +2.70] (12 ft = 5.40 units)
  // Floor-Ceiling (Y): [0, 4.05] (9 ft = 4.05 units)
  // ==========================================
  const roomHalfW = 2.25;
  const roomHalfL = 2.7;
  const roomHeight = 4.05;

  // ==========================================
  // 4-MODE LIGHTING RIG (Ceiling 4000K + Desk Task + Bed 2700K + PC/Wall Bias)
  // ==========================================
  const accentColor = new THREE.Color(accentHex);

  const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x151110, 0.46);
  scene.add(hemiLight);

  // 4000K Neutral White Architectural Ceiling Bounce
  const ceilingLightRig = new THREE.PointLight(0xfff4e2, 2.0, 12, 1.35);
  ceilingLightRig.position.set(0, 3.65, 0);
  ceilingLightRig.castShadow = !isSoftwareGl;
  ceilingLightRig.shadow.mapSize.set(1024, 1024);
  ceilingLightRig.shadow.bias = -0.0004;
  ceilingLightRig.shadow.normalBias = 0.02;
  scene.add(ceilingLightRig);

  // Purple/Accent Bias Glow behind Workstation & TV Wall
  const purpleAmbientWest = new THREE.PointLight(accentColor, 2.1, 7.0, 1.5);
  purpleAmbientWest.position.set(-1.72, 1.48, 0.65);
  scene.add(purpleAmbientWest);

  const purpleAmbientEast = new THREE.PointLight(accentColor, 1.6, 6.2, 1.5);
  purpleAmbientEast.position.set(1.65, 1.85, -1.05);
  scene.add(purpleAmbientEast);

  // Focused 4200K Monitor Lightbar Task SpotLight (casts realistic keyboard/desk shadows)
  const deskTaskLight = new THREE.SpotLight(0xfff6e6, 3.4, 4.8, Math.PI / 2.8, 0.72, 1.35);
  deskTaskLight.position.set(-1.62, 1.58, 0.66);
  deskTaskLight.target.position.set(-1.42, 0.78, 0.66);
  deskTaskLight.castShadow = !isSoftwareGl;
  deskTaskLight.shadow.mapSize.set(1024, 1024);
  deskTaskLight.shadow.bias = -0.0004;
  deskTaskLight.shadow.normalBias = 0.015;
  scene.add(deskTaskLight, deskTaskLight.target);

  // PC Tower Interior Tempered-Glass RGB Glow
  const pcInternalLight = new THREE.PointLight(accentColor, 1.45, 2.6, 1.6);
  pcInternalLight.position.set(-1.62, 1.12, -0.22);
  scene.add(pcInternalLight);

  // 2700K Warm Bedside Lamp Light (North-West corner near bed)
  const bedsideWarmLight = new THREE.PointLight(0xffb347, 2.0, 4.8, 1.55);
  bedsideWarmLight.position.set(-1.42, 0.92, -2.28);
  scene.add(bedsideWarmLight);

  // Cool Nighttime Moonlight Rim through West Window Blinds
  const windowMoonLight = new THREE.SpotLight(0x60a5fa, 1.85, 8.2, Math.PI / 3.1, 0.7, 1.4);
  windowMoonLight.position.set(-2.15, 2.25, 0.68);
  windowMoonLight.target.position.set(0.35, 0.45, 0.68);
  scene.add(windowMoonLight, windowMoonLight.target);

  // Dual Monitor Screen Emission Bounce
  const deskMonitorGlow = new THREE.PointLight(0x38bdf8, 0.3, 3.6, 1.7);
  deskMonitorGlow.position.set(-1.42, 1.28, 0.66);
  scene.add(deskMonitorGlow);

  let ceilingArea: THREE.RectAreaLight | null = null;
  let deskBiasArea: THREE.RectAreaLight | null = null;

  if (!isSoftwareGl) {
    RectAreaLightUniformsLib.init();
    ceilingArea = new THREE.RectAreaLight(0xfff7ed, 0.95, 2.4, 2.4);
    ceilingArea.position.set(0, 3.92, 0);
    ceilingArea.lookAt(0, 0, 0);
    scene.add(ceilingArea);

    // Subtle Dual-Monitor Wall Bias Wash
    deskBiasArea = new THREE.RectAreaLight(accentColor, 1.35, 0.25, 1.9);
    deskBiasArea.position.set(-2.16, 1.18, 0.68);
    deskBiasArea.lookAt(-1.4, 1.18, 0.68);
    scene.add(deskBiasArea);
  }

  // ==========================================
  // SHARED PBR MATERIALS (Procedural Wood Grain, Fabric Weave & Clearcoat)
  // ==========================================
  const plasterTex = createPlasterWallTexture();
  const { map: walnutMap, bumpMap: walnutBump, roughnessMap: walnutRough } =
    createWalnutGrainTextures();
  walnutMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const { bumpMap: fabricBump, roughnessMap: fabricRough } = createFabricWeaveTextures();

  const charcoalAccentWallMat = new THREE.MeshStandardMaterial({
    map: plasterTex,
    color: 0x1a1c26,
    roughness: 0.9,
    metalness: 0.03,
  });
  const lightGreyWallMat = new THREE.MeshStandardMaterial({
    map: plasterTex,
    color: 0x242734,
    roughness: 0.88,
    metalness: 0.03,
  });
  const ceilingWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xd4d7e0,
    roughness: 0.92,
    metalness: 0.02,
  });

  const { map: woodMap, bumpMap: woodBump } = createWoodFloorTexture();
  woodMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const woodFloorMat = new THREE.MeshStandardMaterial({
    map: woodMap,
    bumpMap: woodBump,
    bumpScale: 0.014,
    roughness: 0.48,
    metalness: 0.08,
  });

  const walnutMat = new THREE.MeshStandardMaterial({
    map: walnutMap,
    bumpMap: walnutBump,
    bumpScale: 0.008,
    roughnessMap: walnutRough,
    roughness: 0.56,
    metalness: 0.06,
  });
  const darkDeskWoodMat = new THREE.MeshStandardMaterial({
    map: walnutMap,
    bumpMap: walnutBump,
    bumpScale: 0.006,
    roughnessMap: walnutRough,
    color: 0x9e8c84,
    roughness: 0.44,
    metalness: 0.1,
  });
  const matteBlackMat = new THREE.MeshStandardMaterial({
    color: 0x0e1118,
    roughness: 0.58,
    metalness: 0.34,
  });
  const brushedAlumMat = new THREE.MeshPhysicalMaterial({
    color: 0xbac4d2,
    metalness: 0.92,
    roughness: 0.22,
    clearcoat: 0.45,
  });
  const rgbEmissiveMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 1.5,
    roughness: 0.2,
    metalness: 0.2,
  });
  const ceilingFixtureMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xfff3d6,
    emissiveIntensity: 1.5,
    roughness: 0.2,
  });
  const leatherChairMat = new THREE.MeshPhysicalMaterial({
    color: 0x161922,
    bumpMap: fabricBump,
    bumpScale: 0.005,
    roughness: 0.48,
    metalness: 0.08,
    clearcoat: 0.12,
    clearcoatRoughness: 0.65,
  });
  const fabricBedMat = new THREE.MeshStandardMaterial({
    color: 0x222536,
    bumpMap: fabricBump,
    bumpScale: 0.009,
    roughnessMap: fabricRough,
    roughness: 0.92,
  });
  const blanketMat = new THREE.MeshStandardMaterial({
    color: 0x31264f,
    bumpMap: fabricBump,
    bumpScale: 0.011,
    roughnessMap: fabricRough,
    roughness: 0.9,
  });
  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x1f623b,
    roughness: 0.46,
    metalness: 0.04,
  });

  // ==========================================
  // RAYCAST HITBOX HELPER (Layer 1)
  // ==========================================
  const clickableTargets: THREE.Object3D[] = [];
  const registerHitbox = (
    parent: THREE.Object3D,
    size: [number, number, number],
    offset: [number, number, number],
    part: RoomInteractivePart
  ) => {
    const proxy = new THREE.Mesh(
      new THREE.BoxGeometry(...size),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    proxy.position.set(...offset);
    proxy.layers.set(1);
    proxy.userData.part = part;
    parent.add(proxy);
    clickableTargets.push(proxy);
  };

  // ==========================================
  // 1. ARCHITECTURAL 12 x 10 x 9 ft ROOM ENCLOSURE
  // ==========================================
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(roomHalfW * 2, roomHalfL * 2), woodFloorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const exteriorFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(34, 34),
    new THREE.MeshStandardMaterial({ color: 0x05060a, roughness: 0.94 })
  );
  exteriorFloor.rotation.x = -Math.PI / 2;
  exteriorFloor.position.y = -0.02;
  scene.add(exteriorFloor);

  // North Wall (Z = -2.70) — Charcoal accent wall for Bed Headboard
  const northWall = new THREE.Mesh(new THREE.BoxGeometry(4.66, roomHeight, 0.16), charcoalAccentWallMat);
  northWall.position.set(0, roomHeight / 2, -roomHalfL - 0.08);
  northWall.receiveShadow = true;
  scene.add(northWall);

  // West Wall (X = -2.25) — Workstation & Window Wall
  const westWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, roomHeight, 5.56), lightGreyWallMat);
  westWall.position.set(-roomHalfW - 0.08, roomHeight / 2, 0);
  westWall.receiveShadow = true;
  scene.add(westWall);

  // East Wall (X = +2.25) — Television Wall
  const eastWall = new THREE.Mesh(new THREE.BoxGeometry(0.16, roomHeight, 5.56), lightGreyWallMat);
  eastWall.position.set(roomHalfW + 0.08, roomHeight / 2, 0);
  eastWall.receiveShadow = true;
  scene.add(eastWall);

  // South Wall (Z = +2.70) — Entrance Door & AC Wall (kept slightly lower opacity or cutaway? No, full wall when inside!)
  const southWall = new THREE.Mesh(new THREE.BoxGeometry(4.66, roomHeight, 0.16), lightGreyWallMat);
  southWall.position.set(0, roomHeight / 2, roomHalfL + 0.08);
  scene.add(southWall);

  // Simple White Ceiling (Y = 4.05)
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 5.5), ceilingWhiteMat);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, roomHeight, 0);
  scene.add(ceiling);

  // Baseboards
  const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x0d0f16, roughness: 0.55 });
  const northBase = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.11, 0.04), baseboardMat);
  northBase.position.set(0, 0.055, -roomHalfL + 0.02);
  const westBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, 5.4), baseboardMat);
  westBase.position.set(-roomHalfW + 0.02, 0.055, 0);
  const eastBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.11, 5.4), baseboardMat);
  eastBase.position.set(roomHalfW - 0.02, 0.055, 0);
  scene.add(northBase, westBase, eastBase);

  // 4 × 6 ft Dark Rug (1.80 × 2.70 units) in center floor
  const rugTex = createWovenRugTexture();
  const centerRug = new THREE.Mesh(
    new THREE.BoxGeometry(1.75, 0.018, 2.55),
    new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.95 })
  );
  centerRug.position.set(0.32, 0.009, 0.55);
  centerRug.receiveShadow = true;
  scene.add(centerRug);

  // ==========================================
  // 2. CEILING FAN (48" Matte Black BLDC) + 4x 12W 4000K SURFACE CEILING LIGHTS
  // ==========================================
  const fanGroup = new THREE.Group();
  fanGroup.position.set(0, roomHeight - 0.02, 0.15);
  scene.add(fanGroup);

  const fanCanopy = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.08, 0.08, 16), matteBlackMat);
  fanCanopy.position.y = -0.04;
  const fanRod = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.28, 10), matteBlackMat);
  fanRod.position.y = -0.18;
  fanGroup.add(fanCanopy, fanRod);

  const fanRotor = new THREE.Group();
  fanRotor.position.y = -0.32;
  fanGroup.add(fanRotor);

  const fanHub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 0.09, 20), matteBlackMat);
  fanRotor.add(fanHub);

  // 3 sleek 48-inch matte black blades (radius ~0.92 units)
  for (let b = 0; b < 3; b++) {
    const angle = (b / 3) * Math.PI * 2;
    const bladeHolder = new THREE.Group();
    bladeHolder.rotation.y = angle;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.018, 0.85), matteBlackMat);
    blade.position.set(0, 0, 0.48);
    blade.rotation.z = 0.1;
    bladeHolder.add(blade);
    fanRotor.add(bladeHolder);
  }
  registerHitbox(fanGroup, [1.8, 0.5, 1.8], [0, -0.3, 0], 'fan');

  // 4 Surface-Mounted LED Ceiling Lights (12W, 4000K) — individually clickable
  [
    [-1.15, -1.3],
    [1.15, -1.3],
    [-1.15, 1.45],
    [1.15, 1.45],
  ].forEach(([lx, lz]) => {
    const fixture = new THREE.Group();
    fixture.position.set(lx, roomHeight - 0.02, lz);
    const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 20), matteBlackMat);
    const diffuser = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.14, 0.02, 20),
      ceilingFixtureMat
    );
    diffuser.position.y = -0.015;
    fixture.add(rim, diffuser);
    registerHitbox(fixture, [0.42, 0.16, 0.42], [0, -0.02, 0], 'light_ceiling');
    scene.add(fixture);
  });

  // ==========================================
  // 3. SOUTH WALL: ENTRANCE DOOR + 1-TON INVERTER SPLIT AC + SWITCH PANEL
  // ==========================================
  const doorGroup = new THREE.Group();
  doorGroup.position.set(-0.45, 0, roomHalfL - 0.02);
  scene.add(doorGroup);

  const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.15, 2.95, 0.06), walnutMat);
  doorPanel.position.y = 1.475;
  doorGroup.add(doorPanel);

  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 3.02, 0.04), matteBlackMat);
  doorFrame.position.set(0, 1.51, -0.02);
  doorGroup.add(doorFrame);

  const doorHandle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.07), brushedAlumMat);
  doorHandle.position.set(0.42, 1.32, -0.05);
  doorGroup.add(doorHandle);

  // 1-Ton Inverter Split AC Unit high on South Wall (away from direct bed/desk draft)
  const acGroup = new THREE.Group();
  acGroup.position.set(1.05, 3.35, roomHalfL - 0.14);
  scene.add(acGroup);

  const acBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.32, 0.34, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.25, metalness: 0.1 })
  );
  acGroup.add(acBody);

  const acVent = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.04, 0.03), matteBlackMat);
  acVent.position.set(0, -0.13, -0.11);
  acGroup.add(acVent);

  const acLedMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.6,
  });
  const acDisplay = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.015), acLedMat);
  acDisplay.position.set(0.42, 0.02, -0.125);
  acGroup.add(acDisplay);

  registerHitbox(acGroup, [1.4, 0.45, 0.4], [0, 0, 0], 'ac');

  // ==========================================
  // 4. NORTH WALL: BED (5 x 6.5 ft), NIGHTSTAND, BEDSIDE LAMP & PURPLE SHELVES
  // ==========================================
  const bedGroup = new THREE.Group();
  bedGroup.position.set(0.22, 0, -1.25); // 6.5 ft = 2.92 units -> headboard at -2.68
  scene.add(bedGroup);

  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.22, 0.26, 2.86), walnutMat);
  bedFrame.position.y = 0.13;
  bedFrame.castShadow = !isSoftwareGl;
  bedFrame.receiveShadow = true;
  bedGroup.add(bedFrame);

  const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.95, 0.14), fabricBedMat);
  headboard.position.set(0, 0.58, -1.36);
  headboard.castShadow = !isSoftwareGl;
  bedGroup.add(headboard);

  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(2.08, 0.22, 2.68),
    new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.88 })
  );
  mattress.position.y = 0.35;
  bedGroup.add(mattress);

  const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.23, 1.85), blanketMat);
  blanket.position.set(0, 0.36, 0.42);
  bedGroup.add(blanket);

  [-0.48, 0.48].forEach((px) => {
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.14, 0.46),
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.85 })
    );
    pillow.position.set(px, 0.51, -0.96);
    pillow.rotation.x = 0.18;
    bedGroup.add(pillow);
  });

  // Floating Purple-Lit Bookshelves on North Wall above Bed
  [2.15, 2.75].forEach((sy, sIdx) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.045, 0.28), walnutMat);
    shelf.position.set(0.22, sy, -roomHalfL + 0.16);
    scene.add(shelf);

    const shelfLed = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.015, 0.02), rgbEmissiveMat);
    shelfLed.position.set(0.22, sy - 0.025, -roomHalfL + 0.05);
    scene.add(shelfLed);

    const colors = [0x8b5cf6, 0x38bdf8, 0x334155, 0xf59e0b, 0x475569];
    for (let k = 0; k < 5; k++) {
      const h = 0.22 + ((k + sIdx) % 3) * 0.04;
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, h, 0.19),
        new THREE.MeshStandardMaterial({ color: colors[(k + sIdx) % colors.length], roughness: 0.65 })
      );
      book.position.set(-0.32 + k * 0.075, sy + 0.022 + h / 2, -roomHalfL + 0.17);
      scene.add(book);
    }
  });

  // North-West Nightstand + 3000K Warm Bedside Lamp + 2 Wall Sockets
  const nightstand = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.54, 0.5), walnutMat);
  nightstand.position.set(-1.42, 0.27, -2.35);
  nightstand.castShadow = !isSoftwareGl;
  scene.add(nightstand);

  const bedsideBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 14), matteBlackMat);
  bedsideBase.position.set(-1.42, 0.56, -2.35);
  scene.add(bedsideBase);

  const bedsideShadeMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.0,
  });
  const bedsideLampGroup = new THREE.Group();
  bedsideLampGroup.position.set(-1.42, 0.74, -2.35);
  const bedsideShade = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 0.18, 16), bedsideShadeMat);
  bedsideLampGroup.add(bedsideShade);
  registerHitbox(bedsideLampGroup, [0.34, 0.36, 0.34], [0, -0.04, 0], 'light_bed');
  scene.add(bedsideLampGroup);

  // ==========================================
  // 5. WEST WALL: WINDOW + 5x2 ft WORKSTATION DESK + DUAL MONITORS + PC TOWER + UPS + ROUTER
  // Desk sits against West wall (X = -1.78), facing East (+X)
  // ==========================================
  // Window on West Wall above desk
  const windowGroup = new THREE.Group();
  windowGroup.position.set(-roomHalfW + 0.02, 2.25, 0.68);
  windowGroup.rotation.y = Math.PI / 2;
  scene.add(windowGroup);

  const winFrame = new THREE.Mesh(new THREE.BoxGeometry(1.96, 1.54, 0.06), matteBlackMat);
  windowGroup.add(winFrame);

  const nightSkyTex = createNightSkyTexture();
  const windowGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.78, 1.36),
    new THREE.MeshStandardMaterial({
      map: nightSkyTex,
      emissive: 0xffffff,
      emissiveMap: nightSkyTex,
      emissiveIntensity: 0.6,
      roughness: 0.15,
    })
  );
  windowGlass.position.z = 0.036;
  windowGroup.add(windowGlass);

  for (let b = 0; b < 9; b++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.74, 0.03, 0.018), matteBlackMat);
    slat.position.set(0, -0.52 + b * 0.13, 0.055);
    slat.rotation.x = 0.34;
    windowGroup.add(slat);
  }

  // Workstation Group (Centered at X = -1.80, Z = +0.68, rotated -PI/2 around Y so local -Z faces West wall & local +Z faces East into room!)
  const deskCenterX = -1.8;
  const deskCenterZ = 0.68;

  const contactTex = createContactShadowTexture();
  const deskShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 2.9),
    new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    })
  );
  deskShadow.rotation.x = -Math.PI / 2;
  deskShadow.position.set(deskCenterX, 0.014, deskCenterZ);
  scene.add(deskShadow);

  const deskGroup = new THREE.Group();
  deskGroup.position.set(deskCenterX, 0, deskCenterZ);
  deskGroup.rotation.y = Math.PI / 2; // local -Z points West (-X) wall, local +Z points East (+X) into room
  scene.add(deskGroup);

  // 5 × 2 ft Desk Tabletop (2.30 × 0.90 units, Top at Y = 0.78)
  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.35, 0.06, 0.92), darkDeskWoodMat);
  deskTop.position.set(0, 0.75, 0);
  deskTop.castShadow = !isSoftwareGl;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);

  // Rear RGB Bias Strip (clickable)
  const deskLed = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.022, 0.022), rgbEmissiveMat);
  deskLed.position.set(0, 0.745, -0.46);
  deskGroup.add(deskLed);
  registerHitbox(deskGroup, [2.26, 0.14, 0.14], [0, 0.75, -0.46], 'light_rgb');

  // Desk Legs & Left Drawer Pedestal
  const drawerUnit = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.72, 0.8), matteBlackMat);
  drawerUnit.position.set(-0.88, 0.36, 0);
  deskGroup.add(drawerUnit);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.8), matteBlackMat);
  rightLeg.position.set(1.06, 0.36, 0);
  deskGroup.add(rightLeg);

  // Dedicated UPS & Wi-Fi Router under/at desk corner (per electrical plan)
  const upsBox = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.32, 0.36), matteBlackMat);
  upsBox.position.set(0.84, 0.16, -0.18);
  deskGroup.add(upsBox);

  const routerBox = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.15), matteBlackMat);
  routerBox.position.set(0.84, 0.8, -0.28);
  deskGroup.add(routerBox);

  // Desk Mat (stitched neoprene pad)
  const deskMatTex = createDeskMatTexture(accentHex);
  const deskMat = new THREE.Mesh(
    new THREE.BoxGeometry(1.18, 0.012, 0.46),
    new THREE.MeshStandardMaterial({ map: deskMatTex, roughness: 0.9, bumpMap: fabricBump, bumpScale: 0.004 })
  );
  deskMat.position.set(-0.02, 0.786, 0.16);
  deskMat.receiveShadow = true;
  deskGroup.add(deskMat);

  // Broad Desk Hitbox so clicking desk from Entrance triggers GSAP transition
  registerHitbox(deskGroup, [2.4, 0.9, 1.05], [0, 0.48, 0.04], 'desk');

  // --- MAIN WIDESCREEN MONITOR + ARTICULATED VESA ARM + LIGHTBAR ---
  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(-0.04, 0.78, -0.22);
  deskGroup.add(monitorGroup);

  const monClamp = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.04, 0.11), brushedAlumMat);
  monClamp.position.set(0, 0.02, -0.18);
  monitorGroup.add(monClamp);

  const monStand = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.014, 0.2), brushedAlumMat);
  monStand.position.set(0, 0.008, 0.03);
  monitorGroup.add(monStand);

  const monNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.36, 14), matteBlackMat);
  monNeck.position.set(0, 0.19, -0.05);
  monitorGroup.add(monNeck);

  const monBezel = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.62, 0.038), matteBlackMat);
  monBezel.position.set(0, 0.42, 0);
  monBezel.castShadow = !isSoftwareGl;
  monitorGroup.add(monBezel);

  const desktopTex = createMonitorDesktopTexture(accentHex);
  desktopTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const mainScreenMat = new THREE.MeshPhysicalMaterial({
    color: 0x090b10,
    map: desktopTex,
    emissive: 0xffffff,
    emissiveMap: desktopTex,
    emissiveIntensity: 0.04,
    roughness: 0.14,
    metalness: 0.06,
    clearcoat: 0.35,
    clearcoatRoughness: 0.15,
  });
  const mainScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.56), mainScreenMat);
  mainScreen.position.set(0, 0.42, 0.022);
  monitorGroup.add(mainScreen);

  const lightbar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.62, 12),
    brushedAlumMat
  );
  lightbar.rotation.z = Math.PI / 2;
  lightbar.position.set(0, 0.745, 0.042);
  monitorGroup.add(lightbar);

  const lightbarDiffuserMat = new THREE.MeshStandardMaterial({
    color: 0xfff6e0,
    emissive: 0xfff3d6,
    emissiveIntensity: 1.8,
    roughness: 0.2,
  });
  const lightbarDiffuser = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, 0.01, 0.016),
    lightbarDiffuserMat
  );
  lightbarDiffuser.position.set(0, 0.732, 0.042);
  monitorGroup.add(lightbarDiffuser);
  registerHitbox(monitorGroup, [0.68, 0.12, 0.14], [0, 0.745, 0.042], 'light_desk');

  registerHitbox(monitorGroup, [1.14, 0.66, 0.2], [0, 0.39, 0.04], 'monitor');

  // --- PORTRAIT SIDE MONITOR ---
  const sideMonGroup = new THREE.Group();
  sideMonGroup.position.set(0.68, 0.78, -0.14);
  sideMonGroup.rotation.y = -0.34;
  deskGroup.add(sideMonGroup);

  const sideNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.36, 12), matteBlackMat);
  sideNeck.position.set(0, 0.18, -0.03);
  sideMonGroup.add(sideNeck);

  const sideBezel = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.62, 0.035), matteBlackMat);
  sideBezel.position.set(0, 0.42, 0);
  sideBezel.castShadow = !isSoftwareGl;
  sideMonGroup.add(sideBezel);

  const sideTex = createSideMonitorTexture(accentHex);
  const sideScreenMat = new THREE.MeshPhysicalMaterial({
    color: 0x090b10,
    map: sideTex,
    emissive: 0xffffff,
    emissiveMap: sideTex,
    emissiveIntensity: 0.03,
    roughness: 0.16,
    clearcoat: 0.3,
  });
  const sideScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.56), sideScreenMat);
  sideScreen.position.set(0, 0.42, 0.02);
  sideMonGroup.add(sideScreen);

  // --- TEMPERED GLASS PC TOWER WITH VISIBLE GPU & AIO COOLER INTERNALS ---
  const pcGroup = new THREE.Group();
  pcGroup.position.set(-0.9, 0.78, -0.06);
  pcGroup.rotation.y = 0.22;
  deskGroup.add(pcGroup);

  const pcBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.64, 0.58), matteBlackMat);
  pcBody.position.set(0, 0.32, 0);
  pcBody.castShadow = !isSoftwareGl;
  pcGroup.add(pcBody);

  // Motherboard, GPU & AIO Pump Block visible on the side panel
  const moboPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.02, 0.46, 0.38),
    new THREE.MeshStandardMaterial({ color: 0x161b26, roughness: 0.45, metalness: 0.4 })
  );
  moboPlate.position.set(0.14, 0.34, -0.02);
  pcGroup.add(moboPlate);

  const gpuShroud = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.055, 0.29),
    new THREE.MeshStandardMaterial({ color: 0x1f2430, roughness: 0.35, metalness: 0.65 })
  );
  gpuShroud.position.set(0.145, 0.25, 0.02);
  pcGroup.add(gpuShroud);

  const gpuRgbBar = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.012, 0.22), rgbEmissiveMat);
  gpuRgbBar.position.set(0.181, 0.258, 0.02);
  pcGroup.add(gpuRgbBar);

  const aioPumpRing = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.008, 8, 24), rgbEmissiveMat);
  aioPumpRing.rotation.y = Math.PI / 2;
  aioPumpRing.position.set(0.16, 0.41, -0.02);
  pcGroup.add(aioPumpRing);

  const glassSide = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.56, 0.5),
    new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.14,
      roughness: 0.04,
      transparent: true,
      opacity: 0.32,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
    })
  );
  glassSide.position.set(0.186, 0.32, 0);
  pcGroup.add(glassSide);

  const pcFans: THREE.Group[] = [];
  for (let f = 0; f < 3; f++) {
    const fan = new THREE.Group();
    fan.position.set(0, 0.14 + f * 0.18, 0.295);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.009, 8, 20), rgbEmissiveMat);
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.006), matteBlackMat);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.1, 0.006), matteBlackMat);
    fan.add(ring, b1, b2);
    pcGroup.add(fan);
    pcFans.push(fan);
  }

  const powerBtnMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 2.3,
    roughness: 0.15,
  });
  const powerBtnRing = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 18), powerBtnMat);
  powerBtnRing.rotation.x = Math.PI / 2;
  powerBtnRing.position.set(0.1, 0.57, 0.295);
  pcGroup.add(powerBtnRing);

  registerHitbox(pcGroup, [0.48, 0.72, 0.68], [0, 0.35, 0.05], 'power');

  // --- MECHANICAL KEYBOARD, COILED AVIATOR CABLE, MOUSE & STUDIO DEVELOPER PROPS ---
  const kbGroup = new THREE.Group();
  kbGroup.position.set(-0.08, 0.795, 0.16);
  kbGroup.rotation.x = 0.08;
  deskGroup.add(kbGroup);

  const kbChassis = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.026, 0.21), brushedAlumMat);
  kbChassis.castShadow = !isSoftwareGl;
  kbGroup.add(kbChassis);
  const kbUnderGlow = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.008, 0.18), rgbEmissiveMat);
  kbUnderGlow.position.y = 0.015;
  kbGroup.add(kbUnderGlow);

  const keyGeo = new THREE.BoxGeometry(0.03, 0.016, 0.03);
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x1e2430, roughness: 0.42 });
  const keyInstanced = new THREE.InstancedMesh(keyGeo, keyMat, 56);
  const dummy = new THREE.Object3D();
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 14; c++) {
      dummy.position.set((c - 6.5) * 0.037, 0.022, (r - 1.5) * 0.039);
      dummy.updateMatrix();
      keyInstanced.setMatrixAt(r * 14 + c, dummy.matrix);
    }
  }
  keyInstanced.instanceMatrix.needsUpdate = true;
  kbGroup.add(keyInstanced);

  // Coiled Aviator Cable leading from Keyboard to Back Grommet
  const cableCoil = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.18, 14),
    matteBlackMat
  );
  cableCoil.rotation.z = Math.PI / 2;
  cableCoil.position.set(-0.14, 0.008, -0.15);
  kbGroup.add(cableCoil);

  const aviatorConnector = new THREE.Mesh(
    new THREE.CylinderGeometry(0.012, 0.012, 0.045, 12),
    brushedAlumMat
  );
  aviatorConnector.rotation.z = Math.PI / 2;
  aviatorConnector.position.set(0.02, 0.008, -0.15);
  kbGroup.add(aviatorConnector);

  registerHitbox(kbGroup, [0.64, 0.1, 0.26], [0, 0.02, 0], 'keyboard');

  const mouseMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.06, 6, 12), matteBlackMat);
  mouseMesh.rotation.x = Math.PI / 2;
  mouseMesh.scale.set(0.95, 1, 0.62);
  mouseMesh.position.set(0.38, 0.8, 0.16);
  mouseMesh.castShadow = !isSoftwareGl;
  deskGroup.add(mouseMesh);

  // Studio Monitor Bookshelf Speakers (Left & Right angled toward developer)
  [-0.64, 0.52].forEach((sx, sIdx) => {
    const spk = new THREE.Group();
    spk.position.set(sx, 0.78, -0.25);
    spk.rotation.y = sIdx === 0 ? 0.28 : -0.28;
    deskGroup.add(spk);

    const spkCab = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.22, 0.15), matteBlackMat);
    spkCab.position.y = 0.11;
    spkCab.castShadow = !isSoftwareGl;
    spk.add(spkCab);

    const woofer = new THREE.Mesh(
      new THREE.CylinderGeometry(0.042, 0.042, 0.012, 18),
      new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.32, metalness: 0.78 })
    );
    woofer.rotation.x = Math.PI / 2;
    woofer.position.set(0, 0.085, 0.076);
    spk.add(woofer);

    const tweeter = new THREE.Mesh(
      new THREE.CylinderGeometry(0.018, 0.018, 0.012, 14),
      brushedAlumMat
    );
    tweeter.rotation.x = Math.PI / 2;
    tweeter.position.set(0, 0.165, 0.076);
    spk.add(tweeter);
  });

  // Ceramic Coffee Mug on Desk Right
  const mugGroup = new THREE.Group();
  mugGroup.position.set(0.66, 0.78, 0.24);
  deskGroup.add(mugGroup);
  const mugBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.042, 0.038, 0.092, 18),
    new THREE.MeshPhysicalMaterial({ color: 0x1e293b, roughness: 0.22, clearcoat: 0.85 })
  );
  mugBody.position.y = 0.046;
  mugBody.castShadow = !isSoftwareGl;
  const mugCoffee = new THREE.Mesh(
    new THREE.CylinderGeometry(0.036, 0.036, 0.005, 16),
    new THREE.MeshStandardMaterial({ color: 0x26140c, roughness: 0.15 })
  );
  mugCoffee.position.y = 0.085;
  const mugHandle = new THREE.Mesh(
    new THREE.TorusGeometry(0.025, 0.006, 8, 16, Math.PI),
    new THREE.MeshPhysicalMaterial({ color: 0x1e293b, roughness: 0.22, clearcoat: 0.85 })
  );
  mugHandle.rotation.z = -Math.PI / 2;
  mugHandle.position.set(0.04, 0.048, 0);
  mugGroup.add(mugBody, mugCoffee, mugHandle);

  // Smartphone on Angled Aluminum Desk Stand
  const phoneStand = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.06), brushedAlumMat);
  phoneStand.position.set(0.46, 0.82, -0.05);
  phoneStand.rotation.x = -0.35;
  deskGroup.add(phoneStand);
  const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(0.068, 0.135, 0.009), matteBlackMat);
  phoneBody.position.set(0.46, 0.86, -0.03);
  phoneBody.rotation.x = -0.35;
  deskGroup.add(phoneBody);
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.06, 0.125),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0x38bdf8, emissiveIntensity: 0.22 })
  );
  phoneScreen.position.set(0.46, 0.86, -0.024);
  phoneScreen.rotation.x = -0.35;
  deskGroup.add(phoneScreen);

  // --- WIRELESS HEADPHONES ON STAND ---
  const hpGroup = new THREE.Group();
  hpGroup.position.set(0.95, 0.78, 0.16);
  hpGroup.rotation.y = -0.45;
  deskGroup.add(hpGroup);

  const hpBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.018, 16), brushedAlumMat);
  hpBase.position.y = 0.01;
  const hpStem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.26, 10), brushedAlumMat);
  hpStem.position.y = 0.14;
  const hpBand = new THREE.Mesh(
    new THREE.TorusGeometry(0.08, 0.012, 8, 20, Math.PI),
    matteBlackMat
  );
  hpBand.position.y = 0.2;
  hpGroup.add(hpBase, hpStem, hpBand);

  [-0.082, 0.082].forEach((ex) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.034, 14), matteBlackMat);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(ex, 0.14, 0);
    hpGroup.add(cup);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.036, 0.005, 6, 16), rgbEmissiveMat);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(ex + (ex > 0 ? 0.018 : -0.018), 0.14, 0);
    hpGroup.add(ring);
  });
  registerHitbox(hpGroup, [0.3, 0.36, 0.28], [0, 0.18, 0], 'headphones');

  // --- ERGONOMIC DESKTOP CHAIR (Facing West Desk!) ---
  const chairGroup = new THREE.Group();
  chairGroup.position.set(-0.82, 0, 0.72);
  chairGroup.rotation.y = Math.PI / 2 - 0.22; // Faces West desk (-X), angled slightly toward center
  scene.add(chairGroup);

  for (let arm = 0; arm < 5; arm++) {
    const angle = (arm / 5) * Math.PI * 2;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.028, 0.32), brushedAlumMat);
    leg.position.set(Math.sin(angle) * 0.16, 0.048, Math.cos(angle) * 0.16);
    leg.rotation.y = angle;
    chairGroup.add(leg);

    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.02, 12), matteBlackMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(Math.sin(angle) * 0.29, 0.024, Math.cos(angle) * 0.29);
    chairGroup.add(wheel);
  }
  const piston = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.4, 14), matteBlackMat);
  piston.position.y = 0.24;
  const seatCushion = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.1, 0.54), leatherChairMat);
  seatCushion.position.y = 0.46;
  seatCushion.castShadow = !isSoftwareGl;
  const backrest = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.78, 0.09), leatherChairMat);
  backrest.position.set(0, 0.88, 0.24);
  backrest.rotation.x = -0.08;
  backrest.castShadow = !isSoftwareGl;
  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.08), leatherChairMat);
  headrest.position.set(0, 1.32, 0.26);
  const chairAccent = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.018, 0.018), rgbEmissiveMat);
  chairAccent.position.set(0, 1.18, 0.29);
  chairGroup.add(piston, seatCushion, backrest, headrest, chairAccent);

  [-0.3, 0.3].forEach((ax) => {
    const armPad = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.032, 0.28), matteBlackMat);
    armPad.position.set(ax, 0.64, 0.02);
    chairGroup.add(armPad);
  });

  registerHitbox(chairGroup, [0.85, 1.45, 0.85], [0, 0.72, 0], 'chair');

  // ==========================================
  // 6. EAST WALL: SMART 6-GANG WALL SWITCH PANEL + WALNUT CREDENZA + PLANT + POUF
  // (East-wall TV removed as requested)
  // ==========================================
  // 6-Gang Illuminated Wall Switchboard mounted cleanly on East Wall (visible & clickable)
  const switchPanelGroup = new THREE.Group();
  switchPanelGroup.position.set(roomHalfW - 0.018, 1.52, -0.78);
  switchPanelGroup.rotation.y = -Math.PI / 2;
  scene.add(switchPanelGroup);

  const switchFrame = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.46, 0.022),
    matteBlackMat
  );
  switchFrame.castShadow = !isSoftwareGl;
  switchPanelGroup.add(switchFrame);

  const switchPlateTex = createWallSwitchPlateTexture();
  switchPlateTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const switchPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.68, 0.42),
    new THREE.MeshPhysicalMaterial({
      map: switchPlateTex,
      roughness: 0.24,
      metalness: 0.22,
      clearcoat: 0.6,
    })
  );
  switchPlate.position.z = 0.013;
  switchPanelGroup.add(switchPlate);

  interface WallSwitchNode {
    key: keyof RoomDevicesState;
    part: RoomInteractivePart;
    rocker: THREE.Mesh;
    ledMat: THREE.MeshStandardMaterial;
    onColor: number;
  }

  const switchSpecs: {
    key: keyof RoomDevicesState;
    part: RoomInteractivePart;
    onColor: number;
  }[] = [
    { key: 'ceilingLight', part: 'switch_ceiling', onColor: 0xfef08a },
    { key: 'deskLight', part: 'switch_desk', onColor: 0xfff3d6 },
    { key: 'rgbLight', part: 'switch_rgb', onColor: 0xa855f7 },
    { key: 'bedLight', part: 'switch_bed', onColor: 0xfbbf24 },
    { key: 'fan', part: 'switch_fan', onColor: 0x38bdf8 },
    { key: 'ac', part: 'switch_ac', onColor: 0x22d3ee },
  ];

  const wallSwitches: WallSwitchNode[] = switchSpecs.map((spec, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const sx = -0.205 + col * 0.205;
    const sy = row === 0 ? 0.07 : -0.105;

    const slot = new THREE.Group();
    slot.position.set(sx, sy, 0.014);
    switchPanelGroup.add(slot);

    const recess = new THREE.Mesh(
      new THREE.BoxGeometry(0.11, 0.095, 0.008),
      new THREE.MeshStandardMaterial({ color: 0x090b10, roughness: 0.5 })
    );
    slot.add(recess);

    const rocker = new THREE.Mesh(
      new THREE.BoxGeometry(0.088, 0.075, 0.02),
      new THREE.MeshPhysicalMaterial({
        color: 0x2a3142,
        roughness: 0.28,
        metalness: 0.35,
        clearcoat: 0.45,
      })
    );
    rocker.position.z = 0.01;
    rocker.rotation.x = 0.16;
    slot.add(rocker);

    const ledMat = new THREE.MeshStandardMaterial({
      color: spec.onColor,
      emissive: spec.onColor,
      emissiveIntensity: 1.8,
      roughness: 0.2,
    });
    const ledBar = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.009, 0.006), ledMat);
    ledBar.position.set(0, -0.024, 0.011);
    rocker.add(ledBar);

    registerHitbox(slot, [0.16, 0.14, 0.09], [0, 0, 0.02], spec.part);
    return { key: spec.key, part: spec.part, rocker, ledMat, onColor: spec.onColor };
  });

  // Low Walnut Sideboard Credenza on East Wall (clean console without TV)
  const sideboard = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.52, 1.55), walnutMat);
  sideboard.position.set(roomHalfW - 0.24, 0.26, -1.05);
  sideboard.castShadow = !isSoftwareGl;
  sideboard.receiveShadow = true;
  scene.add(sideboard);

  // Decorative Books & Minimal Desk Clock on East-Wall Credenza
  const bookStackA = new THREE.Mesh(
    new THREE.BoxGeometry(0.22, 0.045, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7 })
  );
  bookStackA.position.set(roomHalfW - 0.24, 0.542, -1.35);
  const bookStackB = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.04, 0.27),
    new THREE.MeshStandardMaterial({ color: 0x31264f, roughness: 0.7 })
  );
  bookStackB.position.set(roomHalfW - 0.24, 0.584, -1.35);
  bookStackB.rotation.y = 0.14;
  scene.add(bookStackA, bookStackB);

  // Small Floor Potted Plant near East Sideboard
  const plantGroup = new THREE.Group();
  plantGroup.position.set(roomHalfW - 0.34, 0, 0.15);
  scene.add(plantGroup);

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.13, 0.32, 16),
    new THREE.MeshStandardMaterial({ color: 0x262936, roughness: 0.7 })
  );
  pot.position.y = 0.16;
  pot.castShadow = !isSoftwareGl;
  plantGroup.add(pot);

  for (let l = 0; l < 7; l++) {
    const angle = (l / 7) * Math.PI * 2;
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.46, 6), foliageMat);
    leaf.position.set(Math.sin(angle) * 0.11, 0.44, Math.cos(angle) * 0.11);
    leaf.rotation.z = -Math.sin(angle) * 0.56;
    leaf.rotation.x = Math.cos(angle) * 0.56;
    plantGroup.add(leaf);
  }

  // Compact Lounge Pouf / Accent Seat in Southeast Corner
  const poufGroup = new THREE.Group();
  poufGroup.position.set(1.52, 0, 1.78);
  scene.add(poufGroup);

  const poufBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.44, 0.36, 20),
    new THREE.MeshStandardMaterial({ color: 0x222638, roughness: 0.85 })
  );
  poufBase.position.y = 0.18;
  poufBase.castShadow = !isSoftwareGl;
  poufGroup.add(poufBase);

  const poufCushion = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.42, 0.08, 20),
    new THREE.MeshStandardMaterial({ color: 0x31264f, roughness: 0.88 })
  );
  poufCushion.position.y = 0.38;
  poufGroup.add(poufCushion);

  // ==========================================
  // 7. ARCHITECTURAL WOOD SLATS & PERSONAL WALL PORTRAITS (Authentic Photos Only)
  // ==========================================
  // Vertical walnut acoustic wood slats flanking the North Wall headboard
  const slatGeo = new THREE.BoxGeometry(0.042, 3.6, 0.025);
  const slatInstanced = new THREE.InstancedMesh(slatGeo, walnutMat, 26);
  const slatDummy = new THREE.Object3D();
  for (let s = 0; s < 26; s++) {
    slatDummy.position.set(-0.78 + s * 0.08, 1.9, -roomHalfL + 0.015);
    slatDummy.updateMatrix();
    slatInstanced.setMatrixAt(s, slatDummy.matrix);
  }
  slatInstanced.instanceMatrix.needsUpdate = true;
  slatInstanced.receiveShadow = true;
  scene.add(slatInstanced);

  const textureLoader = new THREE.TextureLoader();
  const mountWallPortrait = (
    imageUrl: string,
    pos: [number, number, number],
    rotY: number,
    w: number,
    h: number
  ) => {
    const frameGroup = new THREE.Group();
    frameGroup.position.set(...pos);
    frameGroup.rotation.y = rotY;
    scene.add(frameGroup);

    const glowMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.28,
    });
    const backGlow = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.14, h + 0.14), glowMat);
    backGlow.position.z = -0.004;
    frameGroup.add(backGlow);

    const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.036), matteBlackMat);
    outerFrame.position.z = 0.016;
    outerFrame.castShadow = !isSoftwareGl;
    frameGroup.add(outerFrame);

    const matBorder = new THREE.Mesh(
      new THREE.PlaneGeometry(w + 0.02, h + 0.02),
      new THREE.MeshStandardMaterial({ color: 0x131620, roughness: 0.78 })
    );
    matBorder.position.z = 0.035;
    frameGroup.add(matBorder);

    const photoTex = textureLoader.load(imageUrl);
    photoTex.colorSpace = THREE.SRGBColorSpace;
    photoTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const photoPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(w - 0.04, h - 0.04),
      new THREE.MeshStandardMaterial({
        map: photoTex,
        emissive: 0xffffff,
        emissiveMap: photoTex,
        emissiveIntensity: 0.24,
        roughness: 0.38,
        metalness: 0.02,
      })
    );
    photoPlane.position.z = 0.038;
    frameGroup.add(photoPlane);

    // Subtle glass pane specular coat
    const frameGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(w - 0.02, h - 0.02),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.06,
        roughness: 0.06,
        clearcoat: 1.0,
      })
    );
    frameGlass.position.z = 0.041;
    frameGroup.add(frameGlass);

    registerHitbox(frameGroup, [w + 0.1, h + 0.1, 0.12], [0, 0, 0.04], 'wallart');
  };

  // North Wall (Genuine Golden-Hour Outdoor Portrait above nightstand, visible immediately at entrance)
  mountWallPortrait(
    '/assets/aistudio/WhatsApp_Image_2026-11-18_at_7.07.59_PM_8999fb4b.jpeg',
    [-1.42, 2.02, -roomHalfL + 0.02],
    0,
    0.86,
    1.1
  );

  // East Wall (Authentic CPI Campus Portrait centered beside the Smart Wall Switchboard)
  mountWallPortrait(
    '/assets/aistudio/WhatsApp_Image_2026-11-18_at_7.07._PM_cba373a6.jpeg',
    [roomHalfW - 0.02, 1.92, 0.72],
    -Math.PI / 2,
    0.92,
    1.18
  );

  // West Wall (Genuine Outdoor Portrait north of workstation window)
  mountWallPortrait(
    '/assets/aistudio/WhatsApp_Image_2026-11-18_at_7.07.59_PM_8999fb4b.jpeg',
    [-roomHalfW + 0.02, 2.05, -1.25],
    Math.PI / 2,
    0.82,
    1.04
  );

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  // ==========================================
  // CAMERA POSES & GSAP CINEMATIC TRANSITION
  // ==========================================
  let currentState: ExperienceState = initialState;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentMode: LightingMode = 'coding';
  let devicesState: RoomDevicesState = {
    ceilingLight: true,
    deskLight: true,
    rgbLight: true,
    bedLight: true,
    fan: true,
    ac: true,
  };
  let currentFanSpeed = 4.8;
  let pcBootLevel = initialState === 'BOOTING' || initialState === 'DESKTOP' ? 1 : 0;

  // Mode lighting presets (scaled individually by device on/off switches)
  const modeIntensityTargets = {
    ceilingLight: 1.8,
    ceilingFixture: 1.3,
    ceilingArea: 0.95,
    purpleWest: 1.85,
    purpleEast: 1.3,
    deskArea: 1.35,
    rgbEmissive: 1.4,
    pcInternal: 1.45,
    deskTask: 3.4,
    bedLight: 1.25,
  };

  const applyLightingPreset = (mode: LightingMode) => {
    currentMode = mode;
    if (mode === 'study') {
      modeIntensityTargets.ceilingLight = 2.6;
      modeIntensityTargets.ceilingFixture = 1.9;
      modeIntensityTargets.ceilingArea = 1.25;
      modeIntensityTargets.purpleWest = 0.85;
      modeIntensityTargets.purpleEast = 0.65;
      modeIntensityTargets.deskArea = 0.7;
      modeIntensityTargets.rgbEmissive = 0.7;
      modeIntensityTargets.pcInternal = 0.8;
      modeIntensityTargets.deskTask = 3.4;
      modeIntensityTargets.bedLight = 0.9;
    } else if (mode === 'coding') {
      modeIntensityTargets.ceilingLight = 1.8;
      modeIntensityTargets.ceilingFixture = 1.3;
      modeIntensityTargets.ceilingArea = 0.95;
      modeIntensityTargets.purpleWest = 1.85;
      modeIntensityTargets.purpleEast = 1.3;
      modeIntensityTargets.deskArea = 1.35;
      modeIntensityTargets.rgbEmissive = 1.4;
      modeIntensityTargets.pcInternal = 1.45;
      modeIntensityTargets.deskTask = 3.4;
      modeIntensityTargets.bedLight = 1.25;
    } else if (mode === 'relax') {
      modeIntensityTargets.ceilingLight = 0.55;
      modeIntensityTargets.ceilingFixture = 0.35;
      modeIntensityTargets.ceilingArea = 0.35;
      modeIntensityTargets.purpleWest = 1.0;
      modeIntensityTargets.purpleEast = 0.8;
      modeIntensityTargets.deskArea = 0.75;
      modeIntensityTargets.rgbEmissive = 0.85;
      modeIntensityTargets.pcInternal = 0.9;
      modeIntensityTargets.deskTask = 2.2;
      modeIntensityTargets.bedLight = 2.6;
    } else {
      modeIntensityTargets.ceilingLight = 0.35;
      modeIntensityTargets.ceilingFixture = 0.25;
      modeIntensityTargets.ceilingArea = 0.2;
      modeIntensityTargets.purpleWest = 2.9;
      modeIntensityTargets.purpleEast = 2.3;
      modeIntensityTargets.deskArea = 1.85;
      modeIntensityTargets.rgbEmissive = 2.1;
      modeIntensityTargets.pcInternal = 2.2;
      modeIntensityTargets.deskTask = 2.8;
      modeIntensityTargets.bedLight = 1.35;
    }
  };

  // Entrance camera inside South Doorway looking North-West across whole 12x10x9 room
  const entranceCamPos = new THREE.Vector3(0.15, 1.85, 2.25);
  const entranceLookAt = new THREE.Vector3(-0.5, 1.28, -0.45);

  // Seated camera in the West-Wall Desk Chair looking West at Dual Monitors & PC Tower
  const seatedCamPos = new THREE.Vector3(-0.88, 1.42, 0.66);
  const seatedLookAt = new THREE.Vector3(-2.05, 1.24, 0.64);

  // Wall Switchboard Inspection Camera facing East Wall Smart Switch Panel
  const wallSwitchCamPos = new THREE.Vector3(0.68, 1.56, -0.78);
  const wallSwitchLookAt = new THREE.Vector3(roomHalfW - 0.02, 1.52, -0.78);

  _lookHelper.rotation.order = 'YXZ';
  _lookHelper.position.copy(seatedCamPos);
  _lookHelper.lookAt(seatedLookAt);
  const seatedEuler = _lookHelper.rotation.clone();

  _lookHelper.position.copy(wallSwitchCamPos);
  _lookHelper.lookAt(wallSwitchLookAt);
  const wallSwitchEuler = _lookHelper.rotation.clone();

  camera.position.copy(entranceCamPos);
  camera.lookAt(entranceLookAt);

  let activeTimeline: gsap.core.Timeline | null = null;
  let isGsapAnimating = false;

  const animateCameraToDesk = (onComplete?: () => void) => {
    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = null;
    }

    isGsapAnimating = true;
    const duration = reducedMotion ? 0.2 : 1.7;
    const ease = 'power3.inOut';

    const deltaY = Math.atan2(
      Math.sin(seatedEuler.y - camera.rotation.y),
      Math.cos(seatedEuler.y - camera.rotation.y)
    );
    const targetRotY = camera.rotation.y + deltaY;

    activeTimeline = gsap.timeline({
      onComplete: () => {
        isGsapAnimating = false;
        activeTimeline = null;
        onComplete?.();
      },
    });

    activeTimeline.to(
      camera.position,
      {
        x: seatedCamPos.x,
        y: seatedCamPos.y,
        z: seatedCamPos.z,
        duration,
        ease,
      },
      0
    );

    activeTimeline.to(
      camera.rotation,
      {
        x: seatedEuler.x,
        y: targetRotY,
        z: 0,
        duration,
        ease,
      },
      0
    );

    // Smoothly tuck chair to West desk facing -X
    activeTimeline.to(
      chairGroup.position,
      {
        x: -1.02,
        z: 0.7,
        duration: duration * 0.85,
        ease: 'power2.out',
      },
      0
    );
    activeTimeline.to(
      chairGroup.rotation,
      {
        y: Math.PI / 2,
        duration: duration * 0.85,
        ease: 'power2.out',
      },
      0
    );
  };

  const animateCameraToWallSwitch = (onComplete?: () => void) => {
    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = null;
    }
    isGsapAnimating = true;
    const duration = reducedMotion ? 0.2 : 1.15;
    const deltaY = Math.atan2(
      Math.sin(wallSwitchEuler.y - camera.rotation.y),
      Math.cos(wallSwitchEuler.y - camera.rotation.y)
    );
    const targetRotY = camera.rotation.y + deltaY;

    explorerPos.copy(wallSwitchCamPos);
    explorerYaw = wallSwitchEuler.y;
    explorerPitch = wallSwitchEuler.x;

    activeTimeline = gsap.timeline({
      onComplete: () => {
        isGsapAnimating = false;
        activeTimeline = null;
        onComplete?.();
      },
    });

    activeTimeline.to(camera.position, {
      x: wallSwitchCamPos.x,
      y: wallSwitchCamPos.y,
      z: wallSwitchCamPos.z,
      duration,
      ease: 'power3.inOut',
    }, 0);

    activeTimeline.to(camera.rotation, {
      x: wallSwitchEuler.x,
      y: targetRotY,
      z: 0,
      duration,
      ease: 'power3.inOut',
    }, 0);
  };

  const animateCameraToOverview = (onComplete?: () => void) => {
    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = null;
    }
    isGsapAnimating = true;
    const duration = reducedMotion ? 0.2 : 1.05;

    _lookHelper.position.copy(entranceCamPos);
    _lookHelper.lookAt(entranceLookAt);
    const overviewEuler = _lookHelper.rotation.clone();
    const deltaY = Math.atan2(
      Math.sin(overviewEuler.y - camera.rotation.y),
      Math.cos(overviewEuler.y - camera.rotation.y)
    );
    const targetRotY = camera.rotation.y + deltaY;

    explorerPos.set(0.35, 1.65, 1.85);
    explorerYaw = 0.42;
    explorerPitch = -0.06;

    activeTimeline = gsap.timeline({
      onComplete: () => {
        isGsapAnimating = false;
        activeTimeline = null;
        onComplete?.();
      },
    });

    activeTimeline.to(camera.position, {
      x: entranceCamPos.x,
      y: entranceCamPos.y,
      z: entranceCamPos.z,
      duration,
      ease: 'power3.inOut',
    }, 0);

    activeTimeline.to(camera.rotation, {
      x: overviewEuler.x,
      y: targetRotY,
      z: 0,
      duration,
      ease: 'power3.inOut',
    }, 0);
  };

  // Free exploration player rig
  const explorerPos = new THREE.Vector3(0.35, 1.65, 1.85);
  let explorerYaw = 0.42;
  let explorerPitch = -0.06;

  const keysPressed = new Set<string>();
  let joyMoveX = 0;
  let joyMoveZ = 0;
  let isDraggingLook = false;
  let downX = 0;
  let downY = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let pointerHoverX = 0;
  let pointerHoverY = 0;
  let lastHoveredPart: RoomInteractivePart | null = null;

  const raycaster = new THREE.Raycaster();
  raycaster.layers.set(1);

  const onKeyDown = (e: KeyboardEvent) => {
    if (currentState !== 'EXPLORING') return;
    if (
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(
        e.key
      )
    ) {
      keysPressed.add(e.key.toLowerCase());
    }
  };
  const onKeyUp = (e: KeyboardEvent) => {
    keysPressed.delete(e.key.toLowerCase());
  };
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);

  const onPointerDown = (e: PointerEvent) => {
    isDraggingLook = true;
    downX = e.clientX;
    downY = e.clientY;
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
  };

  let lastHoverCheck = 0;
  const onPointerMove = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    pointerHoverX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerHoverY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (isDraggingLook && currentState === 'EXPLORING') {
      const dx = e.clientX - lastPointerX;
      const dy = e.clientY - lastPointerY;
      lastPointerX = e.clientX;
      lastPointerY = e.clientY;
      explorerYaw -= dx * 0.0042;
      explorerPitch = THREE.MathUtils.clamp(explorerPitch - dy * 0.0035, -0.55, 0.55);
    }

    const now = performance.now();
    if (now - lastHoverCheck < 65) return;
    lastHoverCheck = now;

    _rayMouse.set(pointerHoverX, pointerHoverY);
    raycaster.setFromCamera(_rayMouse, camera);
    const hits = raycaster.intersectObjects(clickableTargets, false);
    const hitPart = (hits[0]?.object.userData.part as RoomInteractivePart | undefined) ?? null;
    renderer.domElement.style.cursor = hitPart
      ? 'pointer'
      : currentState === 'EXPLORING'
        ? 'grab'
        : 'default';

    if (hitPart !== lastHoveredPart) {
      lastHoveredPart = hitPart;
      onPartHover?.(hitPart);
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    const wasClick = Math.hypot(e.clientX - downX, e.clientY - downY) < 9;
    isDraggingLook = false;
    if (!wasClick) return;

    const rect = renderer.domElement.getBoundingClientRect();
    _rayMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _rayMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(_rayMouse, camera);
    const hits = raycaster.intersectObjects(clickableTargets, false);
    if (hits.length > 0) {
      const part = hits[0].object.userData.part as RoomInteractivePart | undefined;
      if (part) onPartClick?.(part);
    }
  };

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove, { passive: true });
  renderer.domElement.addEventListener('pointerup', onPointerUp);

  const onResize = () => {
    if (disposed) return;
    const w = Math.max(container.clientWidth, 280);
    const h = Math.max(container.clientHeight, 260);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);

  let isVisible = true;
  let disposed = false;
  let frameId = 0;
  let timerIds: number[] = [];
  const registerTimer = (id: number) => timerIds.push(id);

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      const wasVisible = isVisible;
      isVisible = entries[0]?.isIntersecting ?? true;
      if (isVisible && !wasVisible && !disposed) {
        clock.getDelta();
        scheduleNextFrame();
      }
    },
    { threshold: 0.05 }
  );
  intersectionObserver.observe(container);

  const handleContextLost = (e: Event) => {
    e.preventDefault();
    onContextLost?.();
  };
  renderer.domElement.addEventListener('webglcontextlost', handleContextLost);

  const clock = new THREE.Clock();

  function renderFrame() {
    if (disposed || !isVisible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    // 1. Monitor boot glow
    const desiredPower =
      currentState === 'BOOTING' || currentState === 'DESKTOP' ? 1 : 0;
    pcBootLevel = THREE.MathUtils.damp(pcBootLevel, desiredPower, 4.5, dt);
    mainScreenMat.emissiveIntensity = 0.04 + pcBootLevel * 0.85;
    sideScreenMat.emissiveIntensity = 0.03 + pcBootLevel * 0.72;
    deskMonitorGlow.intensity = 0.18 + pcBootLevel * 2.1;

    powerBtnMat.emissiveIntensity =
      currentState === 'SEATED'
        ? 2.1 + Math.sin(elapsed * 4.2) * 0.9
        : 1.1 + pcBootLevel * 1.1;

    // 2. Smoothly damp all individual lights, wall switches, AC vent & ceiling fan
    const dampLambda = reducedMotion ? 24 : 9;
    ceilingLightRig.intensity = THREE.MathUtils.damp(
      ceilingLightRig.intensity,
      devicesState.ceilingLight ? modeIntensityTargets.ceilingLight : 0,
      dampLambda,
      dt
    );
    ceilingFixtureMat.emissiveIntensity = THREE.MathUtils.damp(
      ceilingFixtureMat.emissiveIntensity,
      devicesState.ceilingLight ? modeIntensityTargets.ceilingFixture : 0.03,
      dampLambda,
      dt
    );
    if (ceilingArea) {
      ceilingArea.intensity = THREE.MathUtils.damp(
        ceilingArea.intensity,
        devicesState.ceilingLight ? modeIntensityTargets.ceilingArea : 0,
        dampLambda,
        dt
      );
    }

    deskTaskLight.intensity = THREE.MathUtils.damp(
      deskTaskLight.intensity,
      devicesState.deskLight ? modeIntensityTargets.deskTask : 0,
      dampLambda,
      dt
    );
    lightbarDiffuserMat.emissiveIntensity = THREE.MathUtils.damp(
      lightbarDiffuserMat.emissiveIntensity,
      devicesState.deskLight ? 1.85 : 0.04,
      dampLambda,
      dt
    );

    purpleAmbientWest.intensity = THREE.MathUtils.damp(
      purpleAmbientWest.intensity,
      devicesState.rgbLight ? modeIntensityTargets.purpleWest : 0,
      dampLambda,
      dt
    );
    purpleAmbientEast.intensity = THREE.MathUtils.damp(
      purpleAmbientEast.intensity,
      devicesState.rgbLight ? modeIntensityTargets.purpleEast : 0,
      dampLambda,
      dt
    );
    if (deskBiasArea) {
      deskBiasArea.intensity = THREE.MathUtils.damp(
        deskBiasArea.intensity,
        devicesState.rgbLight ? modeIntensityTargets.deskArea : 0,
        dampLambda,
        dt
      );
    }
    rgbEmissiveMat.emissiveIntensity = THREE.MathUtils.damp(
      rgbEmissiveMat.emissiveIntensity,
      devicesState.rgbLight ? modeIntensityTargets.rgbEmissive : 0.04,
      dampLambda,
      dt
    );
    pcInternalLight.intensity = THREE.MathUtils.damp(
      pcInternalLight.intensity,
      devicesState.rgbLight ? modeIntensityTargets.pcInternal : 0,
      dampLambda,
      dt
    );

    bedsideWarmLight.intensity = THREE.MathUtils.damp(
      bedsideWarmLight.intensity,
      devicesState.bedLight ? modeIntensityTargets.bedLight : 0,
      dampLambda,
      dt
    );
    bedsideShadeMat.emissiveIntensity = THREE.MathUtils.damp(
      bedsideShadeMat.emissiveIntensity,
      devicesState.bedLight ? 1.15 : 0.03,
      dampLambda,
      dt
    );

    // AC vent louver & display LED
    acVent.rotation.x = THREE.MathUtils.damp(
      acVent.rotation.x,
      devicesState.ac ? 0.44 : 0,
      7,
      dt
    );
    acLedMat.emissiveIntensity = THREE.MathUtils.damp(
      acLedMat.emissiveIntensity,
      devicesState.ac ? 1.6 : 0.06,
      dampLambda,
      dt
    );

    // Wall switch physical rocker paddles & LED indicators
    wallSwitches.forEach((sw) => {
      const isOn = devicesState[sw.key];
      sw.rocker.rotation.x = THREE.MathUtils.damp(
        sw.rocker.rotation.x,
        isOn ? 0.19 : -0.19,
        16,
        dt
      );
      sw.ledMat.emissiveIntensity = THREE.MathUtils.damp(
        sw.ledMat.emissiveIntensity,
        isOn ? 1.9 : 0.06,
        14,
        dt
      );
    });

    // Spin PC fans & smoothly ramp 48" BLDC Ceiling Fan
    if (!reducedMotion) {
      const pcFanSpeed = 1.4 + pcBootLevel * 5.4;
      pcFans.forEach((fan, idx) => {
        fan.rotation.z += dt * (pcFanSpeed + idx * 0.35);
      });
      currentFanSpeed = THREE.MathUtils.damp(
        currentFanSpeed,
        devicesState.fan ? 5.2 : 0,
        2.6,
        dt
      );
      if (currentFanSpeed > 0.01) {
        fanRotor.rotation.y += dt * currentFanSpeed;
      }
    }

    // 3. Camera Choreography
    if (!isGsapAnimating) {
      const camLambda = reducedMotion ? 24 : isSoftwareGl ? 14 : 5.5;

      if (currentState === 'ENTRANCE') {
        const sway = reducedMotion ? 0 : Math.sin(elapsed * 0.45) * 0.08;
        _targetPos.set(
          entranceCamPos.x + sway + pointerHoverX * 0.12,
          entranceCamPos.y,
          entranceCamPos.z
        );
        _targetLook.copy(entranceLookAt);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetPos.x, camLambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetPos.y, camLambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetPos.z, camLambda, dt);
        camera.lookAt(_targetLook);

        chairGroup.position.x = THREE.MathUtils.damp(chairGroup.position.x, -0.82, 5, dt);
        chairGroup.rotation.y = THREE.MathUtils.damp(
          chairGroup.rotation.y,
          Math.PI / 2 - 0.22,
          5,
          dt
        );
      } else if (currentState === 'EXPLORING') {
        chairGroup.position.x = THREE.MathUtils.damp(chairGroup.position.x, -0.82, 5, dt);
        chairGroup.rotation.y = THREE.MathUtils.damp(
          chairGroup.rotation.y,
          Math.PI / 2 - 0.22,
          5,
          dt
        );

        let moveForward = 0;
        let moveStrafe = 0;
        if (keysPressed.has('w') || keysPressed.has('arrowup')) moveForward += 1;
        if (keysPressed.has('s') || keysPressed.has('arrowdown')) moveForward -= 1;
        if (keysPressed.has('a') || keysPressed.has('arrowleft')) moveStrafe -= 1;
        if (keysPressed.has('d') || keysPressed.has('arrowright')) moveStrafe += 1;

        moveForward += -joyMoveZ;
        moveStrafe += joyMoveX;

        _forward.set(-Math.sin(explorerYaw), 0, -Math.cos(explorerYaw)).normalize();
        _right.crossVectors(_forward, _upAxis).normalize();

        const speed = 2.4 * dt;
        if (Math.abs(moveForward) > 0.01 || Math.abs(moveStrafe) > 0.01) {
          const nextX = explorerPos.x + (_forward.x * moveForward + _right.x * moveStrafe) * speed;
          const nextZ = explorerPos.z + (_forward.z * moveForward + _right.z * moveStrafe) * speed;

          // Clamp strictly inside 12 x 10 ft room bounds with desk/bed safety
          const clampedX = THREE.MathUtils.clamp(nextX, -1.15, 1.85);
          const clampedZ = THREE.MathUtils.clamp(nextZ, -2.15, 2.28);
          const hitsBed = clampedX > -0.95 && clampedX < 1.45 && clampedZ < 0.25;
          if (!hitsBed) {
            explorerPos.x = clampedX;
            explorerPos.z = clampedZ;
          }
        }

        camera.position.x = THREE.MathUtils.damp(camera.position.x, explorerPos.x, 12, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, explorerPos.y, 12, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, explorerPos.z, 12, dt);

        _targetLook.set(
          camera.position.x - Math.sin(explorerYaw) * Math.cos(explorerPitch) * 3,
          camera.position.y + Math.sin(explorerPitch) * 3,
          camera.position.z - Math.cos(explorerYaw) * Math.cos(explorerPitch) * 3
        );
        camera.lookAt(_targetLook);
      } else if (
        currentState === 'SEATED' ||
        currentState === 'BOOTING' ||
        currentState === 'DESKTOP'
      ) {
        const subtleX = reducedMotion ? 0 : pointerHoverX * 0.06;
        const subtleY = reducedMotion ? 0 : pointerHoverY * 0.04;
        _targetPos.set(
          seatedCamPos.x,
          seatedCamPos.y + subtleY * 0.2,
          seatedCamPos.z + subtleX * 0.25
        );
        _targetLook.set(
          seatedLookAt.x,
          seatedLookAt.y + subtleY * 0.25,
          seatedLookAt.z - subtleX * 0.35
        );

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetPos.x, camLambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetPos.y, camLambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetPos.z, camLambda, dt);
        camera.lookAt(_targetLook);
      }
    }

    renderer.render(scene, camera);
    scheduleNextFrame();
  }

  function scheduleNextFrame() {
    if (disposed || !isVisible) return;
    if (isSoftwareGl) {
      afterSoftwareDraw(renderer, renderFrame, registerTimer);
    } else {
      frameId = requestAnimationFrame(renderFrame);
    }
  }

  scheduleNextFrame();

  return {
    setExperienceState(state: ExperienceState) {
      currentState = state;
      if (state === 'EXPLORING') {
        if (activeTimeline) {
          activeTimeline.kill();
          activeTimeline = null;
          isGsapAnimating = false;
        }
        if (explorerPos.x < -0.5) {
          explorerPos.set(0.35, 1.65, 1.85);
          explorerYaw = 0.42;
          explorerPitch = -0.06;
        }
      }
    },
    animateCameraToDesk,
    animateCameraToWallSwitch,
    animateCameraToOverview,
    setMoveInput(dx: number, dz: number) {
      joyMoveX = dx;
      joyMoveZ = dz;
    },
    setAccentColor(hex: string) {
      const c = new THREE.Color(hex);
      rgbEmissiveMat.color.copy(c);
      rgbEmissiveMat.emissive.copy(c);
      purpleAmbientWest.color.copy(c);
      purpleAmbientEast.color.copy(c);
      pcInternalLight.color.copy(c);
      if (deskBiasArea) {
        deskBiasArea.color.copy(c);
      }
    },
    setLightingMode(mode: LightingMode) {
      applyLightingPreset(mode);
    },
    setDevicesState(nextDevices: RoomDevicesState) {
      devicesState = { ...nextDevices };
    },
    setFanEnabled(enabled: boolean) {
      devicesState = { ...devicesState, fan: enabled };
    },
    setAcEnabled(enabled: boolean) {
      devicesState = { ...devicesState, ac: enabled };
    },
    setReducedMotion(reduced: boolean) {
      reducedMotion = reduced;
    },
    dispose() {
      disposed = true;
      if (activeTimeline) {
        activeTimeline.kill();
        activeTimeline = null;
      }
      cancelAnimationFrame(frameId);
      timerIds.forEach((id) => clearTimeout(id));
      timerIds = [];
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      disposeObject3D(scene);
      envTex.dispose();
      renderer.dispose();
    },
  };
}
