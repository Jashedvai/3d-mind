import * as THREE from 'three';
import { createRacingGameCanvas } from './roomTextures';
import {
  createRacingGameEngine,
  getTelemetrySnapshot,
  resetRacingGameEngine,
  stepRacingGameEngine,
} from './racingGameEngine';
import { HitboxRegisterFn, RacingTelemetry } from './roomTypes';

export interface GamingSetupHandles {
  gamingBayGroup: THREE.Group;
  xCrossLedMat: THREE.MeshStandardMaterial;
  consoleLedMat: THREE.MeshStandardMaterial;
  gamingScreenMat: THREE.MeshPhysicalMaterial;
  gamingMonitorLight: THREE.PointLight;
  steeringRimGroup: THREE.Group;
  restartRace: () => void;
  updateGamingVisuals: (
    gamingMode: boolean,
    targetSteerDeg: number,
    throttleActive: boolean,
    brakeActive: boolean,
    steerDir: number,
    nitroActive: boolean,
    lightsOn: boolean,
    dt: number,
    onTelemetry?: (t: RacingTelemetry) => void
  ) => void;
}

export interface GamingSetupConfig {
  scene: THREE.Scene;
  roomHalfW: number;
  roomHalfL: number;
  isSoftwareGl: boolean;
  darkDeskWoodMat: THREE.Material;
  matteBlackMat: THREE.Material;
  brushedAlumMat: THREE.Material;
  registerHitbox: HitboxRegisterFn;
}

/**
 * Builds the East X-Cross LED Wall Light fixture and the L-Extension Gaming Corner:
 * Next-Gen Gaming Console, Wireless Controller, Dedicated Racing Monitor,
 * and Sim-Racing Steering Wheel + Floor Pedal assembly with live Car Racing simulation.
 */
export function buildGamingSetup(cfg: GamingSetupConfig): GamingSetupHandles {
  const {
    scene,
    roomHalfW,
    isSoftwareGl,
    darkDeskWoodMat,
    matteBlackMat,
    brushedAlumMat,
    registerHitbox,
  } = cfg;

  // 1) Geometric #f8f9fa X-Cross LED Wall Light Panel (East Wall)
  const xCrossGroup = new THREE.Group();
  xCrossGroup.position.set(roomHalfW - 0.022, 2.46, -0.58);
  xCrossGroup.rotation.y = -Math.PI / 2;
  scene.add(xCrossGroup);

  const xCrossLedMat = new THREE.MeshStandardMaterial({
    color: 0xf8f9fa,
    emissive: 0xf8f9fa,
    emissiveIntensity: 1.7,
    roughness: 0.18,
  });

  const barAngles = [0.64, -0.64];
  barAngles.forEach((ang) => {
    for (let seg = -2; seg <= 2; seg++) {
      const tile = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.024), xCrossLedMat);
      const dist = seg * 0.195;
      tile.position.set(Math.cos(ang) * dist, Math.sin(ang) * dist, 0.012);
      tile.rotation.z = ang;
      xCrossGroup.add(tile);
    }
  });
  const centerNode = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.028), xCrossLedMat);
  centerNode.position.z = 0.014;
  centerNode.rotation.z = Math.PI / 4;
  xCrossGroup.add(centerNode);
  registerHitbox(xCrossGroup, [1.05, 0.88, 0.12], [0, 0, 0.02], 'light_rgb');

  // 2) South-West Sim-Racing Studio Bay (14'x16' Studio Corner Zone)
  const gamingBayGroup = new THREE.Group();
  gamingBayGroup.position.set(-1.55, 0, 2.12);
  scene.add(gamingBayGroup);

  // Anti-static textured rubber sim-racing floor mat (Y = 0.008 to prevent Z-fighting)
  const rubberMatGeo = new THREE.BoxGeometry(1.94, 0.014, 1.56);
  const rubberMat = new THREE.Mesh(
    rubberMatGeo,
    new THREE.MeshStandardMaterial({
      color: 0x171a20,
      roughness: 0.88,
      metalness: 0.06,
    })
  );
  rubberMat.position.set(-0.04, 0.008, -0.22);
  rubberMat.receiveShadow = true;
  gamingBayGroup.add(rubberMat);

  // Mat perimeter bevel trim
  const matTrim = new THREE.Mesh(
    new THREE.BoxGeometry(1.96, 0.006, 1.58),
    new THREE.MeshStandardMaterial({ color: 0x2a313d, roughness: 0.55, metalness: 0.3 })
  );
  matTrim.position.set(-0.04, 0.004, -0.22);
  gamingBayGroup.add(matTrim);

  // 80/20 Anodized Aluminum Extrusion Cockpit Chassis & Console Side Table
  const wingTop = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.055, 0.72), darkDeskWoodMat);
  wingTop.position.set(0, 0.75, 0.08);
  wingTop.castShadow = !isSoftwareGl;
  wingTop.receiveShadow = true;
  gamingBayGroup.add(wingTop);

  const wingPedestal = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.72, 0.66), matteBlackMat);
  wingPedestal.position.set(0.68, 0.36, 0.08);
  const wingLeftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.66), matteBlackMat);
  wingLeftLeg.position.set(-0.84, 0.36, 0.08);
  gamingBayGroup.add(wingPedestal, wingLeftLeg);

  // Aluminum cockpit rails along floor connecting pedals to haptic bucket seat
  [-0.24, 0.04].forEach((rx) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.065, 1.18), brushedAlumMat);
    rail.position.set(rx, 0.048, -0.34);
    rail.castShadow = !isSoftwareGl;
    gamingBayGroup.add(rail);
  });

  // Concealed cable management conduit channel along outer chassis rail
  const cableConduit = new THREE.Mesh(
    new THREE.CylinderGeometry(0.016, 0.016, 0.96, 10),
    matteBlackMat
  );
  cableConduit.rotation.x = Math.PI / 2;
  cableConduit.position.set(-0.29, 0.032, -0.22);
  gamingBayGroup.add(cableConduit);

  // --- TRIPLE-MONITOR PANORAMIC RACING ARRAY (Center + ±42° Wing Displays) ---
  const gamingMonGroup = new THREE.Group();
  gamingMonGroup.position.set(-0.1, 0.78, 0.28);
  gamingMonGroup.rotation.y = Math.PI;
  gamingBayGroup.add(gamingMonGroup);

  const gStandBase = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.018, 0.2), brushedAlumMat);
  gStandBase.position.set(0, 0.009, 0.02);
  const gStandNeck = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.034, 0.36, 14), matteBlackMat);
  gStandNeck.position.set(0, 0.19, -0.05);
  const gCrossBar = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.036, 0.036), brushedAlumMat);
  gCrossBar.position.set(0, 0.36, -0.04);
  gamingMonGroup.add(gStandBase, gStandNeck, gCrossBar);

  const gBezel = new THREE.Mesh(new THREE.BoxGeometry(0.84, 0.48, 0.034), matteBlackMat);
  gBezel.position.set(0, 0.39, 0);
  gBezel.castShadow = !isSoftwareGl;
  gamingMonGroup.add(gBezel);

  const gameEngine = createRacingGameEngine();
  const racingCanvas = createRacingGameCanvas();
  racingCanvas.drawFrame(gameEngine);

  const gamingScreenMat = new THREE.MeshPhysicalMaterial({
    color: 0x0b0e14,
    map: racingCanvas.texture,
    emissive: 0xffffff,
    emissiveMap: racingCanvas.texture,
    emissiveIntensity: 0.28,
    roughness: 0.14,
    clearcoat: 0.35,
  });
  const gScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.79, 0.44), gamingScreenMat);
  gScreen.position.set(0, 0.39, 0.02);
  gamingMonGroup.add(gScreen);

  // Left & Right 42-degree Angled Peripheral Monitors
  const wingTiltRad = THREE.MathUtils.degToRad(42);
  [-1, 1].forEach((side) => {
    const wingHolder = new THREE.Group();
    wingHolder.position.set(side * 0.42, 0.39, 0);
    wingHolder.rotation.y = -side * wingTiltRad;
    gamingMonGroup.add(wingHolder);

    const wBezel = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.48, 0.032), matteBlackMat);
    wBezel.position.set(side * 0.28, 0, 0);
    wBezel.castShadow = !isSoftwareGl;
    const wScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 0.44), gamingScreenMat);
    wScreen.position.set(side * 0.28, 0, 0.019);
    wingHolder.add(wBezel, wScreen);
  });

  registerHitbox(gamingMonGroup, [1.65, 0.56, 0.44], [0, 0.38, 0.14], 'gaming_monitor');

  const gamingMonitorLight = new THREE.PointLight(0x38bdf8, 0.2, 3.0, 1.6);
  gamingMonitorLight.position.set(-0.1, 1.2, -0.05);
  gamingBayGroup.add(gamingMonitorLight);

  // --- NEXT-GEN GAMING CONSOLE + WIRELESS CONTROLLER ---
  const consoleGroup = new THREE.Group();
  consoleGroup.position.set(0.64, 0.78, 0.14);
  consoleGroup.rotation.y = -2.75;
  gamingBayGroup.add(consoleGroup);

  const consoleShellMat = new THREE.MeshPhysicalMaterial({
    color: 0xf1f3f5,
    roughness: 0.28,
    metalness: 0.08,
    clearcoat: 0.3,
  });
  const consoleCoreMat = new THREE.MeshStandardMaterial({
    color: 0x161920,
    roughness: 0.45,
    metalness: 0.35,
  });

  const consoleBase = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.018, 18), matteBlackMat);
  consoleBase.position.y = 0.009;
  const consoleCore = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.39, 0.24), consoleCoreMat);
  consoleCore.position.y = 0.21;
  consoleCore.castShadow = !isSoftwareGl;

  const leftWing = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.41, 0.26), consoleShellMat);
  leftWing.position.set(-0.058, 0.215, 0);
  const rightWing = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.41, 0.26), consoleShellMat);
  rightWing.position.set(0.058, 0.215, 0);

  const consoleLedMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.35,
  });
  const consoleLedLeft = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.34, 0.01), consoleLedMat);
  consoleLedLeft.position.set(-0.046, 0.215, 0.12);
  const consoleLedRight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.34, 0.01), consoleLedMat);
  consoleLedRight.position.set(0.046, 0.215, 0.12);

  const padBody = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.032, 0.09), consoleShellMat);
  padBody.position.set(-0.2, 0.028, 0.06);
  padBody.rotation.y = 0.28;
  const padGripL = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.05, 4, 8), matteBlackMat);
  padGripL.rotation.x = Math.PI / 2;
  padGripL.position.set(-0.255, 0.022, 0.078);
  const padGripR = new THREE.Mesh(new THREE.CapsuleGeometry(0.018, 0.05, 4, 8), matteBlackMat);
  padGripR.rotation.x = Math.PI / 2;
  padGripR.position.set(-0.145, 0.022, 0.042);

  consoleGroup.add(
    consoleBase,
    consoleCore,
    leftWing,
    rightWing,
    consoleLedLeft,
    consoleLedRight,
    padBody,
    padGripL,
    padGripR
  );
  registerHitbox(consoleGroup, [0.42, 0.46, 0.36], [-0.08, 0.22, 0.02], 'console');

  // --- DIRECT-DRIVE WHEELBASE + GT CARBON WHEEL + PADDLE SHIFTERS ---
  const wheelMountGroup = new THREE.Group();
  wheelMountGroup.position.set(-0.1, 0.78, -0.18);
  wheelMountGroup.rotation.y = Math.PI;
  gamingBayGroup.add(wheelMountGroup);

  const servoHousing = new THREE.Mesh(
    new THREE.BoxGeometry(0.2, 0.14, 0.24),
    new THREE.MeshStandardMaterial({ color: 0x1d222b, metalness: 0.72, roughness: 0.28 })
  );
  servoHousing.position.set(0, 0.08, 0);
  servoHousing.castShadow = !isSoftwareGl;
  const deskClamp = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 0.12), brushedAlumMat);
  deskClamp.position.set(0, -0.02, 0.02);
  const wheelShaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.034, 0.036, 0.09, 16),
    brushedAlumMat
  );
  wheelShaft.rotation.x = Math.PI / 2;
  wheelShaft.position.set(0, 0.11, 0.14);
  wheelMountGroup.add(servoHousing, deskClamp, wheelShaft);

  const steeringRimGroup = new THREE.Group();
  steeringRimGroup.position.set(0, 0.11, 0.19);
  wheelMountGroup.add(steeringRimGroup);

  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.145, 0.019, 10, 28), matteBlackMat);
  const wheelHub = new THREE.Mesh(
    new THREE.CylinderGeometry(0.048, 0.048, 0.028, 16),
    new THREE.MeshStandardMaterial({ color: 0x383b40, metalness: 0.65, roughness: 0.35 })
  );
  wheelHub.rotation.x = Math.PI / 2;
  const spokeHoriz = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.032, 0.014), brushedAlumMat);
  const spokeVert = new THREE.Mesh(new THREE.BoxGeometry(0.032, 0.14, 0.014), brushedAlumMat);
  spokeVert.position.y = -0.065;
  // Dual aluminum magnetic paddle shifters behind the wheel
  [-0.088, 0.088].forEach((px) => {
    const paddle = new THREE.Mesh(new THREE.BoxGeometry(0.036, 0.068, 0.008), brushedAlumMat);
    paddle.position.set(px, 0.01, -0.024);
    steeringRimGroup.add(paddle);
  });
  const topMarker = new THREE.Mesh(
    new THREE.BoxGeometry(0.016, 0.032, 0.044),
    new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 0.85 })
  );
  topMarker.position.set(0, 0.145, 0);
  steeringRimGroup.add(wheelRim, wheelHub, spokeHoriz, spokeVert, topMarker);

  registerHitbox(wheelMountGroup, [0.4, 0.36, 0.36], [0, 0.12, 0.08], 'wheel');

  // --- HYDRAULIC 3-PEDAL SET (Load-Cell Brake Cylinder + Billet Pedals) ---
  const pedalBoard = new THREE.Group();
  pedalBoard.position.set(-0.1, 0.025, 0.08);
  gamingBayGroup.add(pedalBoard);

  const pedalBase = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.032, 0.34), matteBlackMat);
  pedalBoard.add(pedalBase);
  [-0.11, 0, 0.11].forEach((px, idx) => {
    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.145, 0.022), brushedAlumMat);
    pedal.position.set(px, 0.082, 0.06);
    pedal.rotation.x = -0.35;
    pedalBoard.add(pedal);
    if (idx === 1) {
      // Hydraulic damper reservoir cylinder behind center brake pedal
      const hydroCyl = new THREE.Mesh(
        new THREE.CylinderGeometry(0.016, 0.016, 0.11, 10),
        new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.25 })
      );
      hydroCyl.rotation.x = Math.PI / 2.6;
      hydroCyl.position.set(px, 0.065, 0.13);
      pedalBoard.add(hydroCyl);
    }
  });

  // --- HAPTIC BUCKET MOTORSPORT SEAT + TACTILE BASS-SHAKER TRANSDUCER ---
  const bucketSeatGroup = new THREE.Group();
  bucketSeatGroup.position.set(-0.1, 0.06, -0.68);
  gamingBayGroup.add(bucketSeatGroup);

  const seatShellMat = new THREE.MeshStandardMaterial({
    color: 0x1c2028,
    roughness: 0.72,
    metalness: 0.12,
  });
  const seatTrimMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.45,
    metalness: 0.25,
  });

  const seatBase = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.09, 0.5), seatShellMat);
  seatBase.position.set(0, 0.14, 0);
  seatBase.castShadow = !isSoftwareGl;
  const seatBack = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.76, 0.09), seatShellMat);
  seatBack.position.set(0, 0.53, -0.22);
  seatBack.rotation.x = -0.18;
  seatBack.castShadow = !isSoftwareGl;
  const seatHead = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.09), seatShellMat);
  seatHead.position.set(0, 0.94, -0.29);
  seatHead.rotation.x = -0.14;
  // Side bolsters & haptic rear bass-shaker actuator
  [-0.23, 0.23].forEach((bx) => {
    const bolster = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.56, 0.15), seatShellMat);
    bolster.position.set(bx, 0.46, -0.16);
    bolster.rotation.x = -0.18;
    bucketSeatGroup.add(bolster);
  });
  const harnessPass = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.036, 0.024), seatTrimMat);
  harnessPass.position.set(0, 0.74, -0.23);
  const hapticShaker = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.09, 16),
    brushedAlumMat
  );
  hapticShaker.rotation.x = Math.PI / 2;
  hapticShaker.position.set(0, 0.2, -0.28);

  bucketSeatGroup.add(seatBase, seatBack, seatHead, harnessPass, hapticShaker);
  registerHitbox(bucketSeatGroup, [0.58, 1.05, 0.68], [0, 0.52, -0.12], 'wheel');

  let drawAccum = 0;
  let telemetryAccum = 0;
  let wasGamingActive = false;

  const restartRace = () => {
    resetRacingGameEngine(gameEngine, true);
    racingCanvas.drawFrame(gameEngine);
  };

  const updateGamingVisuals = (
    gamingMode: boolean,
    targetSteerDeg: number,
    throttleActive: boolean,
    brakeActive: boolean,
    steerDir: number,
    nitroActive: boolean,
    lightsOn: boolean,
    dt: number,
    onTelemetry?: (t: RacingTelemetry) => void
  ) => {
    stepRacingGameEngine(gameEngine, {
      gamingMode,
      throttle: throttleActive,
      brake: brakeActive,
      steerDir,
      manualSteerDeg: targetSteerDeg,
      nitro: nitroActive,
      dt,
    });

    const targetRad = THREE.MathUtils.degToRad(gameEngine.steerDeg);
    steeringRimGroup.rotation.z = THREE.MathUtils.damp(
      steeringRimGroup.rotation.z,
      targetRad,
      14,
      dt
    );

    if (gamingMode) {
      drawAccum += dt;
      const minDrawInterval = isSoftwareGl ? 0.14 : 0.04;
      if (!wasGamingActive || drawAccum >= minDrawInterval) {
        wasGamingActive = true;
        drawAccum = 0;
        racingCanvas.drawFrame(gameEngine);
      }

      telemetryAccum += dt;
      if (telemetryAccum >= 0.045) {
        telemetryAccum = 0;
        onTelemetry?.(getTelemetrySnapshot(gameEngine));
      }
    } else if (wasGamingActive) {
      wasGamingActive = false;
      racingCanvas.drawFrame(gameEngine);
      onTelemetry?.(getTelemetrySnapshot(gameEngine));
    }

    gamingScreenMat.emissiveIntensity = THREE.MathUtils.damp(
      gamingScreenMat.emissiveIntensity,
      gamingMode ? 0.96 : 0.14,
      8,
      dt
    );
    gamingMonitorLight.intensity = THREE.MathUtils.damp(
      gamingMonitorLight.intensity,
      gamingMode ? 1.45 : 0.1,
      8,
      dt
    );
    consoleLedMat.emissiveIntensity = THREE.MathUtils.damp(
      consoleLedMat.emissiveIntensity,
      gamingMode ? 2.1 : 0.25,
      8,
      dt
    );
    xCrossLedMat.emissiveIntensity = THREE.MathUtils.damp(
      xCrossLedMat.emissiveIntensity,
      lightsOn ? 1.65 : 0.04,
      8,
      dt
    );
  };

  return {
    gamingBayGroup,
    xCrossLedMat,
    consoleLedMat,
    gamingScreenMat,
    gamingMonitorLight,
    steeringRimGroup,
    restartRace,
    updateGamingVisuals,
  };
}
