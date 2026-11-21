import * as THREE from 'three';
import gsap from 'gsap';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { ExperienceState, RoomDevicesState } from '../context/WorkspaceContext';
import {
  afterSoftwareDraw,
  createContactShadowTexture,
  detectSoftwareWebGL,
  disposeObject3D,
} from './webglUtils';
import {
  createDeskMatTexture,
  createFabricWeaveTextures,
  createMonitorDesktopTexture,
  createNightSkyTexture,
  createSideMonitorTexture,
  createWallSwitchPlateTexture,
  createWalnutGrainTextures,
  createWoodFloorTexture,
  createWovenRugTexture,
} from './room/roomTextures';
import { buildInteractiveBed } from './room/InteractiveBedBuilder';
import { buildPhoneStation } from './room/PhoneStationBuilder';
import { buildGamingSetup } from './room/GamingSetupBuilder';
import {
  LightingMode,
  RoomInteractivePart,
  RoomSceneController,
  RoomSceneOptions,
} from './room/roomTypes';

export type {
  LightingMode,
  RoomInteractivePart,
  RoomSceneController,
  RoomSceneOptions,
  RoomDevicesState,
};

// Reusable math temporaries (zero per-frame GC)
const _rayMouse = new THREE.Vector2();
const _targetPos = new THREE.Vector3();
const _targetLook = new THREE.Vector3();
const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();
const _upAxis = new THREE.Vector3(0, 1, 0);
const _lookHelper = new THREE.Object3D();

export function mountRoomScene(options: RoomSceneOptions): RoomSceneController {
  const {
    container,
    initialState,
    accentHex = '#38BDF8',
    onPartClick,
    onPartHover,
    onRacingTelemetry,
    onContextLost,
  } = options;

  const isSoftwareGl = detectSoftwareWebGL();
  const isNarrow = window.innerWidth < 768;

  const width = Math.max(container.clientWidth, 300);
  const height = Math.max(container.clientHeight, 300);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x090b0f);
  scene.fog = new THREE.FogExp2(0x090b0f, 0.018);

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
  renderer.toneMappingExposure = 1.1;
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
  // EXPANDED SPACIOUS BEDROOM DIMENSIONS
  // East-West (X): [-2.65, +2.65] (5.30 units)
  // North-South (Z): [-3.05, +3.05] (6.10 units)
  // Floor-Ceiling (Y): [0, 4.15]
  // ==========================================
  const roomHalfW = 2.65;
  const roomHalfL = 3.05;
  const roomHeight = 4.15;

  // ==========================================
  // DYNAMIC PBR LIGHTING RIG (Global Master Toggle + Individual Circuits)
  // ==========================================
  const accentColor = new THREE.Color(accentHex);

  const hemiLight = new THREE.HemisphereLight(0xf8f9fa, 0x262930, 0.56);
  scene.add(hemiLight);

  // 4000K Neutral Architectural Ceiling Light
  const ceilingLightRig = new THREE.PointLight(0xfff7ed, 2.2, 14, 1.35);
  ceilingLightRig.position.set(0, 3.72, 0);
  ceilingLightRig.castShadow = !isSoftwareGl;
  ceilingLightRig.shadow.mapSize.set(1024, 1024);
  ceilingLightRig.shadow.bias = -0.0004;
  ceilingLightRig.shadow.normalBias = 0.02;
  scene.add(ceilingLightRig);

  // Crisp #f8f9fa LED Wash along West Acoustic Wall & East X-Cross Panel
  const wallLedWashWest = new THREE.PointLight(0xf8f9fa, 1.45, 7.5, 1.5);
  wallLedWashWest.position.set(-1.95, 1.65, 0.42);
  scene.add(wallLedWashWest);

  const wallLedWashEast = new THREE.PointLight(0xf8f9fa, 1.55, 7.2, 1.5);
  wallLedWashEast.position.set(1.95, 2.35, -0.58);
  scene.add(wallLedWashEast);

  // Focused 4200K Monitor Lightbar Task SpotLight (crisp desk/keyboard shadows)
  const deskTaskLight = new THREE.SpotLight(0xfff8ec, 3.2, 5.0, Math.PI / 2.7, 0.72, 1.35);
  deskTaskLight.position.set(-1.95, 1.6, 0.42);
  deskTaskLight.target.position.set(-1.75, 0.78, 0.42);
  deskTaskLight.castShadow = !isSoftwareGl;
  deskTaskLight.shadow.mapSize.set(1024, 1024);
  deskTaskLight.shadow.bias = -0.0004;
  deskTaskLight.shadow.normalBias = 0.015;
  scene.add(deskTaskLight, deskTaskLight.target);

  // PC Interior Showcase Lighting
  const pcInternalLight = new THREE.PointLight(accentColor, 1.25, 2.6, 1.6);
  pcInternalLight.position.set(-1.95, 1.12, -0.46);
  scene.add(pcInternalLight);

  // 2700K Warm Bedside Lamp
  const bedsideWarmLight = new THREE.PointLight(0xffb347, 1.9, 5.2, 1.55);
  bedsideWarmLight.position.set(-1.44, 0.94, -2.72);
  scene.add(bedsideWarmLight);

  // Moonlight Rim through West Window Blinds (stays subtle even when room lights are OFF)
  const windowMoonLight = new THREE.SpotLight(0x7dd3fc, 1.2, 8.8, Math.PI / 3.0, 0.75, 1.4);
  windowMoonLight.position.set(-2.55, 2.38, 0.42);
  windowMoonLight.target.position.set(0.35, 0.45, 0.42);
  scene.add(windowMoonLight, windowMoonLight.target);

  // Dual Monitor Screen Emission Bounce
  const deskMonitorGlow = new THREE.PointLight(0x38bdf8, 0.32, 3.8, 1.7);
  deskMonitorGlow.position.set(-1.76, 1.28, 0.42);
  scene.add(deskMonitorGlow);

  let ceilingArea: THREE.RectAreaLight | null = null;
  let deskBiasArea: THREE.RectAreaLight | null = null;

  if (!isSoftwareGl) {
    RectAreaLightUniformsLib.init();
    ceilingArea = new THREE.RectAreaLight(0xf8f9fa, 0.95, 2.6, 2.6);
    ceilingArea.position.set(0, 4.0, 0);
    ceilingArea.lookAt(0, 0, 0);
    scene.add(ceilingArea);

    deskBiasArea = new THREE.RectAreaLight(0xf8f9fa, 1.25, 0.28, 2.1);
    deskBiasArea.position.set(-2.54, 1.5, 0.36);
    deskBiasArea.lookAt(-1.6, 1.3, 0.36);
    scene.add(deskBiasArea);
  }

  // ==========================================
  // SHARED PBR MATERIALS (Uniform Matte #6e7378 Cool Gray Walls, #6b442e Floor)
  // ==========================================
  const { map: walnutMap, bumpMap: walnutBump, roughnessMap: walnutRough } =
    createWalnutGrainTextures();
  walnutMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const { bumpMap: fabricBump, roughnessMap: fabricRough } = createFabricWeaveTextures();

  // Perfectly matte, solid, featureless Cool Gray (#6e7378) applied uniformly to ALL walls
  const coolGrayWallMat = new THREE.MeshStandardMaterial({
    color: 0x6e7378,
    roughness: 0.94,
    metalness: 0.0,
  });

  const ceilingWhiteMat = new THREE.MeshStandardMaterial({
    color: 0xd8dce2,
    roughness: 0.92,
    metalness: 0.02,
  });

  // #6b442e Warm Wood Plank Floor
  const { map: woodMap, bumpMap: woodBump } = createWoodFloorTexture();
  woodMap.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const woodFloorMat = new THREE.MeshStandardMaterial({
    map: woodMap,
    bumpMap: woodBump,
    bumpScale: 0.015,
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
    color: 0x383b40,
    roughness: 0.44,
    metalness: 0.1,
  });

  const matteBlackMat = new THREE.MeshStandardMaterial({
    color: 0x161920,
    roughness: 0.54,
    metalness: 0.34,
  });

  const brushedAlumMat = new THREE.MeshPhysicalMaterial({
    color: 0xc2cbd6,
    metalness: 0.92,
    roughness: 0.22,
    clearcoat: 0.45,
  });

  const ledPanelMat = new THREE.MeshStandardMaterial({
    color: 0xf8f9fa,
    emissive: 0xf8f9fa,
    emissiveIntensity: 1.45,
    roughness: 0.2,
    metalness: 0.1,
  });

  const ceilingFixtureMat = new THREE.MeshStandardMaterial({
    color: 0xf8f9fa,
    emissive: 0xf8f9fa,
    emissiveIntensity: 1.45,
    roughness: 0.2,
  });

  const leatherChairMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e222a,
    bumpMap: fabricBump,
    bumpScale: 0.005,
    roughness: 0.48,
    metalness: 0.08,
    clearcoat: 0.12,
    clearcoatRoughness: 0.65,
  });

  const foliageMat = new THREE.MeshStandardMaterial({
    color: 0x22663f,
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
  // 1. ARCHITECTURAL ROOM SHELL & FLOOR
  // ==========================================
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(roomHalfW * 2, roomHalfL * 2),
    woodFloorMat
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const exteriorFloor = new THREE.Mesh(
    new THREE.PlaneGeometry(36, 36),
    new THREE.MeshStandardMaterial({ color: 0x07090d, roughness: 0.94 })
  );
  exteriorFloor.rotation.x = -Math.PI / 2;
  exteriorFloor.position.y = -0.02;
  scene.add(exteriorFloor);

  // North Wall (Z = -3.05) — Uniform Matte Cool Gray
  const northWall = new THREE.Mesh(
    new THREE.BoxGeometry(roomHalfW * 2 + 0.16, roomHeight, 0.16),
    coolGrayWallMat
  );
  northWall.position.set(0, roomHeight / 2, -roomHalfL - 0.08);
  northWall.receiveShadow = true;
  scene.add(northWall);

  // West Wall (X = -2.65) — Uniform Matte Cool Gray
  const westWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, roomHeight, roomHalfL * 2 + 0.16),
    coolGrayWallMat
  );
  westWall.position.set(-roomHalfW - 0.08, roomHeight / 2, 0);
  westWall.receiveShadow = true;
  scene.add(westWall);

  // East Wall (X = +2.65) — Uniform Matte Cool Gray
  const eastWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, roomHeight, roomHalfL * 2 + 0.16),
    coolGrayWallMat
  );
  eastWall.position.set(roomHalfW + 0.08, roomHeight / 2, 0);
  eastWall.receiveShadow = true;
  scene.add(eastWall);

  // South Wall (Z = +3.05) — Uniform Matte Cool Gray
  const southWall = new THREE.Mesh(
    new THREE.BoxGeometry(roomHalfW * 2 + 0.16, roomHeight, 0.16),
    coolGrayWallMat
  );
  southWall.position.set(0, roomHeight / 2, roomHalfL + 0.08);
  scene.add(southWall);

  // Ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(roomHalfW * 2 + 0.1, roomHalfL * 2 + 0.1),
    ceilingWhiteMat
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, roomHeight, 0);
  scene.add(ceiling);

  // Architectural #383b40 Baseboards
  const baseboardMat = new THREE.MeshStandardMaterial({ color: 0x383b40, roughness: 0.6 });
  const northBase = new THREE.Mesh(new THREE.BoxGeometry(roomHalfW * 2, 0.12, 0.04), baseboardMat);
  northBase.position.set(0, 0.06, -roomHalfL + 0.02);
  const westBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, roomHalfL * 2), baseboardMat);
  westBase.position.set(-roomHalfW + 0.02, 0.06, 0);
  const eastBase = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.12, roomHalfL * 2), baseboardMat);
  eastBase.position.set(roomHalfW - 0.02, 0.06, 0);
  scene.add(northBase, westBase, eastBase);

  // Woven Center Rug on Wood Plank Floor
  const rugTex = createWovenRugTexture();
  const centerRug = new THREE.Mesh(
    new THREE.BoxGeometry(1.95, 0.018, 2.75),
    new THREE.MeshStandardMaterial({ map: rugTex, roughness: 0.95 })
  );
  centerRug.position.set(0.42, 0.009, 0.72);
  centerRug.receiveShadow = true;
  scene.add(centerRug);

  // ==========================================
  // 2. CEILING FAN (48" BLDC) + 4x CEILING LIGHTS
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

  for (let b = 0; b < 3; b++) {
    const angle = (b / 3) * Math.PI * 2;
    const bladeHolder = new THREE.Group();
    bladeHolder.rotation.y = angle;
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.018, 0.88), matteBlackMat);
    blade.position.set(0, 0, 0.49);
    blade.rotation.z = 0.1;
    bladeHolder.add(blade);
    fanRotor.add(bladeHolder);
  }
  registerHitbox(fanGroup, [1.85, 0.5, 1.85], [0, -0.3, 0], 'fan');

  [
    [-1.35, -1.45],
    [1.35, -1.45],
    [-1.35, 1.65],
    [1.35, 1.65],
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
  // 3. SOUTH WALL: ENTRANCE DOOR + INVERTER SPLIT AC
  // ==========================================
  const doorGroup = new THREE.Group();
  doorGroup.position.set(-0.35, 0, roomHalfL - 0.02);
  scene.add(doorGroup);

  const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(1.18, 3.0, 0.06), walnutMat);
  doorPanel.position.y = 1.5;
  doorGroup.add(doorPanel);

  const doorFrame = new THREE.Mesh(new THREE.BoxGeometry(1.28, 3.06, 0.04), matteBlackMat);
  doorFrame.position.set(0, 1.53, -0.02);
  doorGroup.add(doorFrame);

  const doorHandle = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.035, 0.07), brushedAlumMat);
  doorHandle.position.set(0.42, 1.34, -0.05);
  doorGroup.add(doorHandle);

  const acGroup = new THREE.Group();
  acGroup.position.set(1.32, 3.42, roomHalfL - 0.14);
  scene.add(acGroup);

  const acBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.36, 0.34, 0.24),
    new THREE.MeshStandardMaterial({ color: 0xf1f3f5, roughness: 0.25, metalness: 0.1 })
  );
  acGroup.add(acBody);

  const acVent = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.03), matteBlackMat);
  acVent.position.set(0, -0.13, -0.11);
  acGroup.add(acVent);

  const acLedMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.5,
  });
  const acDisplay = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.035, 0.015), acLedMat);
  acDisplay.position.set(0.42, 0.02, -0.125);
  acGroup.add(acDisplay);

  registerHitbox(acGroup, [1.45, 0.45, 0.4], [0, 0, 0], 'ac');

  // ==========================================
  // 4. STANDALONE BED + SEPARATE PHONE CHARGING STATION (EAST SIDEBOARD)
  // ==========================================
  const bedHandles = buildInteractiveBed({
    scene,
    roomHalfL,
    isSoftwareGl,
    walnutMat,
    matteBlackMat,
    brushedAlumMat,
    fabricBump,
    fabricRough,
    registerHitbox,
  });

  const phoneHandles = buildPhoneStation({
    scene,
    roomHalfW,
    isSoftwareGl,
    matteBlackMat,
    brushedAlumMat,
    registerHitbox,
  });

  // ==========================================
  // 5. WEST WALL: WINDOW + WORKSTATION DESK + DUAL MONITORS + PC TOWER + CHAIR
  // ==========================================
  const windowGroup = new THREE.Group();
  windowGroup.position.set(-roomHalfW + 0.02, 2.68, 0.42);
  windowGroup.rotation.y = Math.PI / 2;
  scene.add(windowGroup);

  const winFrame = new THREE.Mesh(new THREE.BoxGeometry(2.05, 1.38, 0.06), matteBlackMat);
  windowGroup.add(winFrame);

  const nightSkyTex = createNightSkyTexture();
  const windowGlass = new THREE.Mesh(
    new THREE.PlaneGeometry(1.88, 1.22),
    new THREE.MeshStandardMaterial({
      map: nightSkyTex,
      emissive: 0xffffff,
      emissiveMap: nightSkyTex,
      emissiveIntensity: 0.55,
      roughness: 0.15,
    })
  );
  windowGlass.position.z = 0.036;
  windowGroup.add(windowGlass);

  for (let b = 0; b < 8; b++) {
    const slat = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.028, 0.018), matteBlackMat);
    slat.position.set(0, -0.44 + b * 0.13, 0.055);
    slat.rotation.x = 0.34;
    windowGroup.add(slat);
  }

  const deskCenterX = -2.14;
  const deskCenterZ = 0.42;

  const contactTex = createContactShadowTexture();
  const deskShadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.75, 3.1),
    new THREE.MeshBasicMaterial({
      map: contactTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.58,
    })
  );
  deskShadow.rotation.x = -Math.PI / 2;
  deskShadow.position.set(deskCenterX, 0.014, deskCenterZ);
  scene.add(deskShadow);

  const deskGroup = new THREE.Group();
  deskGroup.position.set(deskCenterX, 0, deskCenterZ);
  deskGroup.rotation.y = Math.PI / 2;
  scene.add(deskGroup);

  const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.48, 0.06, 0.94), darkDeskWoodMat);
  deskTop.position.set(0, 0.75, 0);
  deskTop.castShadow = !isSoftwareGl;
  deskTop.receiveShadow = true;
  deskGroup.add(deskTop);

  // Rear Desk LED Strip (#f8f9fa architectural strip)
  const deskLed = new THREE.Mesh(new THREE.BoxGeometry(2.38, 0.022, 0.022), ledPanelMat);
  deskLed.position.set(0, 0.745, -0.47);
  deskGroup.add(deskLed);
  registerHitbox(deskGroup, [2.38, 0.14, 0.14], [0, 0.75, -0.47], 'light_rgb');

  // Sleek White Drawer Pedestal (matching reference image_e396ab04 & image_fa60901b)
  const drawerUnitMat = new THREE.MeshStandardMaterial({ color: 0xe2e5ea, roughness: 0.42 });
  const drawerUnit = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.72, 0.82), drawerUnitMat);
  drawerUnit.position.set(-0.92, 0.36, 0);
  deskGroup.add(drawerUnit);

  const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.82), matteBlackMat);
  rightLeg.position.set(1.12, 0.36, 0);
  deskGroup.add(rightLeg);

  // Desk Mat
  const deskMatTex = createDeskMatTexture(accentHex);
  const deskMat = new THREE.Mesh(
    new THREE.BoxGeometry(1.22, 0.012, 0.48),
    new THREE.MeshStandardMaterial({
      map: deskMatTex,
      roughness: 0.9,
      bumpMap: fabricBump,
      bumpScale: 0.004,
    })
  );
  deskMat.position.set(-0.02, 0.786, 0.16);
  deskMat.receiveShadow = true;
  deskGroup.add(deskMat);

  registerHitbox(deskGroup, [2.48, 0.9, 1.05], [0, 0.48, 0.04], 'desk');

  // --- MAIN WIDESCREEN MONITOR + ARTICULATED STAND + LIGHTBAR ---
  const monitorGroup = new THREE.Group();
  monitorGroup.position.set(-0.04, 0.78, -0.22);
  deskGroup.add(monitorGroup);

  const monStand = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.014, 0.2), brushedAlumMat);
  monStand.position.set(0, 0.008, 0.03);
  const monNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.032, 0.36, 14), matteBlackMat);
  monNeck.position.set(0, 0.19, -0.05);
  const monBezel = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.62, 0.038), matteBlackMat);
  monBezel.position.set(0, 0.42, 0);
  monBezel.castShadow = !isSoftwareGl;
  monitorGroup.add(monStand, monNeck, monBezel);

  const desktopTex = createMonitorDesktopTexture(accentHex);
  desktopTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const mainScreenMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b0e14,
    map: desktopTex,
    emissive: 0xffffff,
    emissiveMap: desktopTex,
    emissiveIntensity: 0.06,
    roughness: 0.14,
    metalness: 0.06,
    clearcoat: 0.35,
  });
  const mainScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.06, 0.56), mainScreenMat);
  mainScreen.position.set(0, 0.42, 0.022);
  monitorGroup.add(mainScreen);

  const lightbar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.015, 0.64, 12),
    brushedAlumMat
  );
  lightbar.rotation.z = Math.PI / 2;
  lightbar.position.set(0, 0.745, 0.042);
  monitorGroup.add(lightbar);

  const lightbarDiffuserMat = new THREE.MeshStandardMaterial({
    color: 0xf8f9fa,
    emissive: 0xf8f9fa,
    emissiveIntensity: 1.65,
    roughness: 0.2,
  });
  const lightbarDiffuser = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.01, 0.016),
    lightbarDiffuserMat
  );
  lightbarDiffuser.position.set(0, 0.732, 0.042);
  monitorGroup.add(lightbarDiffuser);
  registerHitbox(monitorGroup, [0.68, 0.12, 0.14], [0, 0.745, 0.042], 'light_desk');
  registerHitbox(monitorGroup, [1.18, 0.66, 0.2], [0, 0.39, 0.04], 'monitor');

  // --- PORTRAIT SIDE MONITOR ---
  const sideMonGroup = new THREE.Group();
  sideMonGroup.position.set(0.7, 0.78, -0.14);
  sideMonGroup.rotation.y = -0.34;
  deskGroup.add(sideMonGroup);

  const sideNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.028, 0.36, 12), matteBlackMat);
  sideNeck.position.set(0, 0.18, -0.03);
  const sideBezel = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.62, 0.035), matteBlackMat);
  sideBezel.position.set(0, 0.42, 0);
  sideBezel.castShadow = !isSoftwareGl;
  sideMonGroup.add(sideNeck, sideBezel);

  const sideTex = createSideMonitorTexture(accentHex);
  const sideScreenMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b0e14,
    map: sideTex,
    emissive: 0xffffff,
    emissiveMap: sideTex,
    emissiveIntensity: 0.05,
    roughness: 0.16,
    clearcoat: 0.3,
  });
  const sideScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.56), sideScreenMat);
  sideScreen.position.set(0, 0.42, 0.02);
  sideMonGroup.add(sideScreen);

  // --- WHITE SHOWCASE PC TOWER (Inspired by reference image_e396ab04.png) ---
  const pcGroup = new THREE.Group();
  pcGroup.position.set(-0.92, 0.78, -0.06);
  pcGroup.rotation.y = 0.22;
  deskGroup.add(pcGroup);

  const pcWhiteShell = new THREE.MeshStandardMaterial({
    color: 0xe6e8ec,
    roughness: 0.32,
    metalness: 0.1,
  });
  const pcBody = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.64, 0.58), pcWhiteShell);
  pcBody.position.set(0, 0.32, 0);
  pcBody.castShadow = !isSoftwareGl;
  pcGroup.add(pcBody);

  const gpuShroud = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.055, 0.29),
    new THREE.MeshStandardMaterial({ color: 0x262a33, roughness: 0.35, metalness: 0.65 })
  );
  gpuShroud.position.set(0.145, 0.25, 0.02);
  const gpuLedBar = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.012, 0.22), ledPanelMat);
  gpuLedBar.position.set(0.181, 0.258, 0.02);
  pcGroup.add(gpuShroud, gpuLedBar);

  const glassSide = new THREE.Mesh(
    new THREE.BoxGeometry(0.014, 0.56, 0.5),
    new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.14,
      roughness: 0.04,
      transparent: true,
      opacity: 0.3,
      clearcoat: 1.0,
    })
  );
  glassSide.position.set(0.186, 0.32, 0);
  pcGroup.add(glassSide);

  const pcFans: THREE.Group[] = [];
  for (let f = 0; f < 3; f++) {
    const fan = new THREE.Group();
    fan.position.set(0, 0.14 + f * 0.18, 0.295);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.009, 8, 20), ledPanelMat);
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.015, 0.006), matteBlackMat);
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.1, 0.006), matteBlackMat);
    fan.add(ring, b1, b2);
    pcGroup.add(fan);
    pcFans.push(fan);
  }

  const powerBtnMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 2.0,
    roughness: 0.15,
  });
  const powerBtnRing = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.03, 0.02, 18),
    powerBtnMat
  );
  powerBtnRing.rotation.x = Math.PI / 2;
  powerBtnRing.position.set(0.1, 0.57, 0.295);
  pcGroup.add(powerBtnRing);
  registerHitbox(pcGroup, [0.48, 0.72, 0.68], [0, 0.35, 0.05], 'power');

  // --- MECHANICAL KEYBOARD, MOUSE & HEADPHONES ---
  const kbGroup = new THREE.Group();
  kbGroup.position.set(-0.08, 0.795, 0.16);
  kbGroup.rotation.x = 0.08;
  deskGroup.add(kbGroup);

  const kbChassis = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.026, 0.21), brushedAlumMat);
  kbChassis.castShadow = !isSoftwareGl;
  kbGroup.add(kbChassis);
  const keyGeo = new THREE.BoxGeometry(0.03, 0.016, 0.03);
  const keyMat = new THREE.MeshStandardMaterial({ color: 0x22262e, roughness: 0.42 });
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
  registerHitbox(kbGroup, [0.64, 0.1, 0.26], [0, 0.02, 0], 'keyboard');

  const mouseMesh = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.06, 6, 12), matteBlackMat);
  mouseMesh.rotation.x = Math.PI / 2;
  mouseMesh.scale.set(0.95, 1, 0.62);
  mouseMesh.position.set(0.38, 0.8, 0.16);
  mouseMesh.castShadow = !isSoftwareGl;
  deskGroup.add(mouseMesh);

  // Wireless Headphones on Stand
  const hpGroup = new THREE.Group();
  hpGroup.position.set(0.96, 0.78, 0.16);
  hpGroup.rotation.y = -0.45;
  deskGroup.add(hpGroup);

  const hpBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 0.018, 16), brushedAlumMat);
  hpBase.position.y = 0.01;
  const hpStem = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.26, 10), brushedAlumMat);
  hpStem.position.y = 0.14;
  const hpBand = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.012, 8, 20, Math.PI), matteBlackMat);
  hpBand.position.y = 0.2;
  hpGroup.add(hpBase, hpStem, hpBand);

  [-0.082, 0.082].forEach((ex) => {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.034, 14), matteBlackMat);
    cup.rotation.z = Math.PI / 2;
    cup.position.set(ex, 0.14, 0);
    hpGroup.add(cup);
  });
  registerHitbox(hpGroup, [0.3, 0.36, 0.28], [0, 0.18, 0], 'headphones');

  // --- ERGONOMIC DESK CHAIR ---
  const chairGroup = new THREE.Group();
  chairGroup.position.set(-1.14, 0, 0.44);
  chairGroup.rotation.y = Math.PI / 2 - 0.22;
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
  chairGroup.add(piston, seatCushion, backrest, headrest);
  registerHitbox(chairGroup, [0.85, 1.45, 0.85], [0, 0.72, 0], 'chair');

  // ==========================================
  // 6. MODULAR GAMING SETUP + ACOUSTIC WALL + X-CROSS LED PANEL
  // ==========================================
  const gamingHandles = buildGamingSetup({
    scene,
    roomHalfW,
    roomHalfL,
    isSoftwareGl,
    darkDeskWoodMat,
    matteBlackMat,
    brushedAlumMat,
    registerHitbox,
  });

  // ==========================================
  // 7. EAST WALL: SMART 6-GANG SWITCHBOARD + CREDENZA + PLANT + LOUNGE SEAT
  // ==========================================
  const switchPanelGroup = new THREE.Group();
  switchPanelGroup.position.set(roomHalfW - 0.018, 1.52, -1.62);
  switchPanelGroup.rotation.y = -Math.PI / 2;
  scene.add(switchPanelGroup);

  const switchFrame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.46, 0.022), matteBlackMat);
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
  }

  const switchSpecs: {
    key: keyof RoomDevicesState;
    part: RoomInteractivePart;
    onColor: number;
  }[] = [
    { key: 'ceilingLight', part: 'switch_ceiling', onColor: 0xfef08a },
    { key: 'deskLight', part: 'switch_desk', onColor: 0xf8f9fa },
    { key: 'rgbLight', part: 'switch_rgb', onColor: 0xf8f9fa },
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
    return { key: spec.key, part: spec.part, rocker, ledMat };
  });

  // Low Sideboard Credenza below East X-Cross LED Panel (matching reference image_fa60901b.png)
  const sideboard = new THREE.Mesh(
    new THREE.BoxGeometry(0.46, 0.56, 1.72),
    new THREE.MeshStandardMaterial({ color: 0x383b40, roughness: 0.52 })
  );
  sideboard.position.set(roomHalfW - 0.26, 0.28, -0.62);
  sideboard.castShadow = !isSoftwareGl;
  sideboard.receiveShadow = true;
  scene.add(sideboard);

  // Potted Plant near East Sideboard
  const plantGroup = new THREE.Group();
  plantGroup.position.set(roomHalfW - 0.38, 0, 0.65);
  scene.add(plantGroup);

  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.13, 0.32, 16),
    new THREE.MeshStandardMaterial({ color: 0x383b40, roughness: 0.7 })
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

  // Lounge Accent Pouf in Southeast Corner
  const poufGroup = new THREE.Group();
  poufGroup.position.set(1.75, 0, 2.05);
  scene.add(poufGroup);

  const poufBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.44, 0.46, 0.36, 20),
    new THREE.MeshStandardMaterial({ color: 0x383b40, roughness: 0.85 })
  );
  poufBase.position.y = 0.18;
  poufBase.castShadow = !isSoftwareGl;
  poufGroup.add(poufBase);

  // ==========================================
  // 8. PERSONAL WALL PORTRAITS (Authentic Photos)
  // ==========================================
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

    const outerFrame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.036), matteBlackMat);
    outerFrame.position.z = 0.016;
    outerFrame.castShadow = !isSoftwareGl;
    frameGroup.add(outerFrame);

    const photoTex = textureLoader.load(imageUrl);
    photoTex.colorSpace = THREE.SRGBColorSpace;
    photoTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const photoPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(w - 0.04, h - 0.04),
      new THREE.MeshStandardMaterial({
        map: photoTex,
        emissive: 0xffffff,
        emissiveMap: photoTex,
        emissiveIntensity: 0.22,
        roughness: 0.38,
      })
    );
    photoPlane.position.z = 0.038;
    frameGroup.add(photoPlane);

    registerHitbox(frameGroup, [w + 0.1, h + 0.1, 0.12], [0, 0, 0.04], 'wallart');
  };

  mountWallPortrait(
    '/assets/aistudio/WhatsApp_Image_2026-11-18_at_7.07.59_PM_8999fb4b.jpeg',
    [-1.42, 2.08, -roomHalfL + 0.02],
    0,
    0.86,
    1.1
  );

  mountWallPortrait(
    '/assets/aistudio/WhatsApp_Image_2026-11-18_at_7.07._PM_cba373a6.jpeg',
    [roomHalfW - 0.02, 1.98, 1.45],
    -Math.PI / 2,
    0.92,
    1.18
  );

  mountWallPortrait(
    '/assets/aistudio/WhatsApp_Image_2026-11-18_at_7.07.59_PM_8999fb4b.jpeg',
    [-roomHalfW + 0.02, 2.05, -1.45],
    Math.PI / 2,
    0.82,
    1.04
  );

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  // ==========================================
  // CAMERA POSES & STATE MANAGEMENT
  // ==========================================
  let currentState: ExperienceState = initialState;
  let reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let devicesState: RoomDevicesState = {
    ceilingLight: true,
    deskLight: true,
    rgbLight: true,
    bedLight: true,
    fan: true,
    ac: true,
  };
  let isPhoneCharging = false;
  let isGamingMode = false;
  let targetSteerDeg = 0;
  let racingThrottle = false;
  let racingBrake = false;
  let currentFanSpeed = 4.8;
  let pcBootLevel = initialState === 'BOOTING' || initialState === 'DESKTOP' ? 1 : 0;

  const modeIntensityTargets = {
    ceilingLight: 2.1,
    ceilingFixture: 1.4,
    ceilingArea: 0.95,
    ledWest: 1.45,
    ledEast: 1.55,
    deskArea: 1.25,
    ledEmissive: 1.45,
    pcInternal: 1.25,
    deskTask: 3.2,
    bedLight: 1.4,
  };

  const applyLightingPreset = (mode: LightingMode) => {
    if (mode === 'study') {
      modeIntensityTargets.ceilingLight = 2.8;
      modeIntensityTargets.ceilingFixture = 1.9;
      modeIntensityTargets.ceilingArea = 1.3;
      modeIntensityTargets.ledWest = 1.35;
      modeIntensityTargets.ledEast = 1.4;
      modeIntensityTargets.deskArea = 1.1;
      modeIntensityTargets.ledEmissive = 1.2;
      modeIntensityTargets.pcInternal = 0.85;
      modeIntensityTargets.deskTask = 3.5;
      modeIntensityTargets.bedLight = 1.1;
    } else if (mode === 'coding') {
      modeIntensityTargets.ceilingLight = 2.1;
      modeIntensityTargets.ceilingFixture = 1.4;
      modeIntensityTargets.ceilingArea = 0.95;
      modeIntensityTargets.ledWest = 1.45;
      modeIntensityTargets.ledEast = 1.55;
      modeIntensityTargets.deskArea = 1.25;
      modeIntensityTargets.ledEmissive = 1.45;
      modeIntensityTargets.pcInternal = 1.25;
      modeIntensityTargets.deskTask = 3.2;
      modeIntensityTargets.bedLight = 1.4;
    } else if (mode === 'relax') {
      modeIntensityTargets.ceilingLight = 0.6;
      modeIntensityTargets.ceilingFixture = 0.4;
      modeIntensityTargets.ceilingArea = 0.35;
      modeIntensityTargets.ledWest = 0.9;
      modeIntensityTargets.ledEast = 0.95;
      modeIntensityTargets.deskArea = 0.75;
      modeIntensityTargets.ledEmissive = 0.95;
      modeIntensityTargets.pcInternal = 0.85;
      modeIntensityTargets.deskTask = 2.1;
      modeIntensityTargets.bedLight = 2.5;
    } else {
      modeIntensityTargets.ceilingLight = 0.35;
      modeIntensityTargets.ceilingFixture = 0.25;
      modeIntensityTargets.ceilingArea = 0.2;
      modeIntensityTargets.ledWest = 2.1;
      modeIntensityTargets.ledEast = 2.2;
      modeIntensityTargets.deskArea = 1.6;
      modeIntensityTargets.ledEmissive = 1.85;
      modeIntensityTargets.pcInternal = 1.75;
      modeIntensityTargets.deskTask = 2.7;
      modeIntensityTargets.bedLight = 1.35;
    }
  };

  // Architectural Camera Targets
  const entranceCamPos = new THREE.Vector3(0.42, 1.95, 2.58);
  const entranceLookAt = new THREE.Vector3(-0.68, 1.24, -0.35);

  const seatedCamPos = new THREE.Vector3(-1.22, 1.42, 0.42);
  const seatedLookAt = new THREE.Vector3(-2.45, 1.24, 0.4);

  // Bed Lying-Down Perspective (head on pillow looking across room)
  const bedLyingCamPos = new THREE.Vector3(0.32, 0.74, -2.42);
  const bedLyingLookAt = new THREE.Vector3(0.18, 1.48, 1.15);

  // Separate East Sideboard Smartphone & Wall Outlet Camera
  const phoneCamPos = new THREE.Vector3(1.18, 1.04, -0.18);
  const phoneLookAt = new THREE.Vector3(2.42, 0.72, -0.18);

  // Sim-Racing Cockpit Perspective (inside haptic bucket seat facing triple monitors + wheel)
  const gamingCamPos = new THREE.Vector3(-1.65, 1.32, 1.56);
  const gamingLookAt = new THREE.Vector3(-1.65, 1.12, 2.38);

  // East Wall Switchboard Camera
  const wallSwitchCamPos = new THREE.Vector3(1.12, 1.56, -1.62);
  const wallSwitchLookAt = new THREE.Vector3(roomHalfW - 0.02, 1.52, -1.62);

  _lookHelper.rotation.order = 'YXZ';
  _lookHelper.position.copy(seatedCamPos);
  _lookHelper.lookAt(seatedLookAt);
  const seatedEuler = _lookHelper.rotation.clone();

  _lookHelper.position.copy(bedLyingCamPos);
  _lookHelper.lookAt(bedLyingLookAt);
  const bedLyingEuler = _lookHelper.rotation.clone();

  _lookHelper.position.copy(phoneCamPos);
  _lookHelper.lookAt(phoneLookAt);
  const phoneEuler = _lookHelper.rotation.clone();

  _lookHelper.position.copy(gamingCamPos);
  _lookHelper.lookAt(gamingLookAt);
  const gamingEuler = _lookHelper.rotation.clone();

  _lookHelper.position.copy(wallSwitchCamPos);
  _lookHelper.lookAt(wallSwitchLookAt);
  const wallSwitchEuler = _lookHelper.rotation.clone();

  camera.position.copy(entranceCamPos);
  camera.lookAt(entranceLookAt);

  let activeTimeline: gsap.core.Timeline | null = null;
  let isGsapAnimating = false;
  let pinnedPose: 'NONE' | 'BED' | 'PHONE' | 'GAMING' = 'NONE';

  const explorerPos = new THREE.Vector3(0.45, 1.68, 2.05);
  let explorerYaw = 0.42;
  let explorerPitch = -0.06;

  const glideCameraTo = (
    destPos: THREE.Vector3,
    destEuler: THREE.Euler,
    durationSec: number,
    onComplete?: () => void
  ) => {
    if (activeTimeline) {
      activeTimeline.kill();
      activeTimeline = null;
    }
    isGsapAnimating = true;
    const duration = reducedMotion ? 0.2 : durationSec;
    const deltaY = Math.atan2(
      Math.sin(destEuler.y - camera.rotation.y),
      Math.cos(destEuler.y - camera.rotation.y)
    );
    const targetRotY = camera.rotation.y + deltaY;

    explorerPos.copy(destPos);
    explorerYaw = destEuler.y;
    explorerPitch = destEuler.x;

    activeTimeline = gsap.timeline({
      onComplete: () => {
        isGsapAnimating = false;
        activeTimeline = null;
        onComplete?.();
      },
    });

    activeTimeline.to(
      camera.position,
      { x: destPos.x, y: destPos.y, z: destPos.z, duration, ease: 'power3.inOut' },
      0
    );
    activeTimeline.to(
      camera.rotation,
      { x: destEuler.x, y: targetRotY, z: 0, duration, ease: 'power3.inOut' },
      0
    );
    return activeTimeline;
  };

  const animateCameraToDesk = (onComplete?: () => void) => {
    pinnedPose = 'NONE';
    const tl = glideCameraTo(seatedCamPos, seatedEuler, 1.65, onComplete);
    tl.to(
      chairGroup.position,
      { x: -1.36, z: 0.44, duration: reducedMotion ? 0.2 : 1.35, ease: 'power2.out' },
      0
    );
    tl.to(
      chairGroup.rotation,
      { y: Math.PI / 2, duration: reducedMotion ? 0.2 : 1.35, ease: 'power2.out' },
      0
    );
  };

  const animateCameraToBed = (onComplete?: () => void) => {
    pinnedPose = 'BED';
    glideCameraTo(bedLyingCamPos, bedLyingEuler, 1.45, onComplete);
  };

  const animateCameraToPhone = (onComplete?: () => void) => {
    pinnedPose = 'PHONE';
    glideCameraTo(phoneCamPos, phoneEuler, 1.25, onComplete);
  };

  const animateCameraToGaming = (onComplete?: () => void) => {
    pinnedPose = 'GAMING';
    glideCameraTo(gamingCamPos, gamingEuler, 1.3, onComplete);
  };

  const animateCameraToWallSwitch = (onComplete?: () => void) => {
    pinnedPose = 'NONE';
    glideCameraTo(wallSwitchCamPos, wallSwitchEuler, 1.15, onComplete);
  };

  const animateCameraToOverview = (onComplete?: () => void) => {
    pinnedPose = 'NONE';
    _lookHelper.position.copy(entranceCamPos);
    _lookHelper.lookAt(entranceLookAt);
    const overviewEuler = _lookHelper.rotation.clone();
    glideCameraTo(entranceCamPos, overviewEuler, 1.05, () => {
      explorerPos.set(0.45, 1.68, 2.05);
      explorerYaw = 0.42;
      explorerPitch = -0.06;
      onComplete?.();
    });
  };

  // Input & Raycaster Rig
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
    if (currentState !== 'EXPLORING' || pinnedPose !== 'NONE') return;
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

    if (isDraggingLook && currentState === 'EXPLORING' && pinnedPose === 'NONE') {
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
    mainScreenMat.emissiveIntensity = 0.06 + pcBootLevel * 0.82;
    sideScreenMat.emissiveIntensity = 0.05 + pcBootLevel * 0.72;
    deskMonitorGlow.intensity = 0.16 + pcBootLevel * 1.9;

    powerBtnMat.emissiveIntensity =
      currentState === 'SEATED' ? 1.85 : 1.0 + pcBootLevel * 0.9;

    // 2. Dynamic PBR Lighting & Dark-Room AO Contrast
    const dampLambda = reducedMotion ? 24 : 9;
    const anyRoomLightOn =
      devicesState.ceilingLight ||
      devicesState.deskLight ||
      devicesState.rgbLight ||
      devicesState.bedLight;

    hemiLight.intensity = THREE.MathUtils.damp(
      hemiLight.intensity,
      anyRoomLightOn ? 0.56 : 0.06,
      dampLambda,
      dt
    );
    windowMoonLight.intensity = THREE.MathUtils.damp(
      windowMoonLight.intensity,
      anyRoomLightOn ? 0.95 : 1.45,
      dampLambda,
      dt
    );

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
      devicesState.deskLight ? 1.65 : 0.04,
      dampLambda,
      dt
    );

    wallLedWashWest.intensity = THREE.MathUtils.damp(
      wallLedWashWest.intensity,
      devicesState.rgbLight ? modeIntensityTargets.ledWest : 0,
      dampLambda,
      dt
    );
    wallLedWashEast.intensity = THREE.MathUtils.damp(
      wallLedWashEast.intensity,
      devicesState.rgbLight ? modeIntensityTargets.ledEast : 0,
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
    ledPanelMat.emissiveIntensity = THREE.MathUtils.damp(
      ledPanelMat.emissiveIntensity,
      devicesState.rgbLight ? modeIntensityTargets.ledEmissive : 0.04,
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
    bedHandles.bedsideShadeMat.emissiveIntensity = THREE.MathUtils.damp(
      bedHandles.bedsideShadeMat.emissiveIntensity,
      devicesState.bedLight ? 1.15 : 0.03,
      dampLambda,
      dt
    );

    // Modular sub-builders updates
    phoneHandles.updateChargingVisuals(isPhoneCharging, dt);
    gamingHandles.updateGamingVisuals(
      isGamingMode,
      targetSteerDeg,
      racingThrottle,
      racingBrake,
      devicesState.rgbLight,
      dt,
      onRacingTelemetry
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
      devicesState.ac ? 1.5 : 0.06,
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
        isOn ? 1.8 : 0.06,
        14,
        dt
      );
    });

    // Spin PC fans & Ceiling Fan
    if (!reducedMotion) {
      const pcFanSpeed = 1.4 + pcBootLevel * 5.2;
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

    // 3. Camera Choreography & Exploration Bounds
    if (!isGsapAnimating) {
      const camLambda = reducedMotion ? 24 : isSoftwareGl ? 14 : 5.5;

      if (pinnedPose === 'BED') {
        const subtleX = reducedMotion ? 0 : pointerHoverX * 0.05;
        const subtleY = reducedMotion ? 0 : pointerHoverY * 0.04;
        _targetPos.copy(bedLyingCamPos);
        _targetLook.set(
          bedLyingLookAt.x + subtleX * 0.4,
          bedLyingLookAt.y + subtleY * 0.3,
          bedLyingLookAt.z
        );
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetPos.x, camLambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetPos.y, camLambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetPos.z, camLambda, dt);
        camera.lookAt(_targetLook);
      } else if (pinnedPose === 'PHONE') {
        const subtleX = reducedMotion ? 0 : pointerHoverX * 0.03;
        const subtleY = reducedMotion ? 0 : pointerHoverY * 0.03;
        _targetPos.copy(phoneCamPos);
        _targetLook.set(
          phoneLookAt.x,
          phoneLookAt.y + subtleY * 0.18,
          phoneLookAt.z + subtleX * 0.2
        );
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetPos.x, camLambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetPos.y, camLambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetPos.z, camLambda, dt);
        camera.lookAt(_targetLook);
      } else if (pinnedPose === 'GAMING') {
        const subtleX = reducedMotion ? 0 : pointerHoverX * 0.04;
        const subtleY = reducedMotion ? 0 : pointerHoverY * 0.03;
        _targetPos.copy(gamingCamPos);
        _targetLook.set(
          gamingLookAt.x + subtleX * 0.28,
          gamingLookAt.y + subtleY * 0.22,
          gamingLookAt.z
        );
        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetPos.x, camLambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetPos.y, camLambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetPos.z, camLambda, dt);
        camera.lookAt(_targetLook);
      } else if (currentState === 'ENTRANCE') {
        const sway = reducedMotion ? 0 : Math.sin(elapsed * 0.4) * 0.06;
        _targetPos.set(
          entranceCamPos.x + sway + pointerHoverX * 0.1,
          entranceCamPos.y,
          entranceCamPos.z
        );
        _targetLook.copy(entranceLookAt);

        camera.position.x = THREE.MathUtils.damp(camera.position.x, _targetPos.x, camLambda, dt);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, _targetPos.y, camLambda, dt);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, _targetPos.z, camLambda, dt);
        camera.lookAt(_targetLook);

        chairGroup.position.x = THREE.MathUtils.damp(chairGroup.position.x, -1.14, 5, dt);
        chairGroup.rotation.y = THREE.MathUtils.damp(
          chairGroup.rotation.y,
          Math.PI / 2 - 0.22,
          5,
          dt
        );
      } else if (currentState === 'EXPLORING') {
        chairGroup.position.x = THREE.MathUtils.damp(chairGroup.position.x, -1.14, 5, dt);
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

        const speed = 2.5 * dt;
        if (Math.abs(moveForward) > 0.01 || Math.abs(moveStrafe) > 0.01) {
          const nextX = explorerPos.x + (_forward.x * moveForward + _right.x * moveStrafe) * speed;
          const nextZ = explorerPos.z + (_forward.z * moveForward + _right.z * moveStrafe) * speed;

          const clampedX = THREE.MathUtils.clamp(nextX, -1.45, 2.02);
          const clampedZ = THREE.MathUtils.clamp(nextZ, -2.35, 2.45);
          const hitsBed = clampedX > -0.95 && clampedX < 1.55 && clampedZ < 0.05;
          const hitsSideboard = clampedX > 1.88 && clampedZ > -1.62 && clampedZ < 0.42;
          const hitsGamingBay = clampedX < -0.45 && clampedZ > 1.15;
          if (!hitsBed && !hitsSideboard && !hitsGamingBay) {
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
        const subtleX = reducedMotion ? 0 : pointerHoverX * 0.05;
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
        if (explorerPos.x < -1.1) {
          explorerPos.set(0.45, 1.68, 2.05);
          explorerYaw = 0.42;
          explorerPitch = -0.06;
        }
      }
    },
    animateCameraToDesk,
    animateCameraToBed,
    animateCameraToPhone,
    animateCameraToGaming,
    animateCameraToWallSwitch,
    animateCameraToOverview,
    setMoveInput(dx: number, dz: number) {
      joyMoveX = dx;
      joyMoveZ = dz;
    },
    setAccentColor(hex: string) {
      const c = new THREE.Color(hex);
      pcInternalLight.color.copy(c);
      powerBtnMat.color.copy(c);
      powerBtnMat.emissive.copy(c);
    },
    setLightingMode(mode: LightingMode) {
      applyLightingPreset(mode);
    },
    setDevicesState(nextDevices: RoomDevicesState) {
      devicesState = { ...nextDevices };
    },
    setChargingState(charging: boolean) {
      isPhoneCharging = charging;
    },
    setGamingMode(enabled: boolean) {
      isGamingMode = enabled;
    },
    setSteeringWheelAngle(deg: number) {
      targetSteerDeg = deg;
    },
    setRacingInput(throttle: boolean, brake: boolean) {
      racingThrottle = throttle;
      racingBrake = brake;
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
