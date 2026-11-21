import * as THREE from 'three';
import { createPhoneScreenTexture } from './roomTextures';
import { HitboxRegisterFn } from './roomTypes';

export interface PhoneStationHandles {
  phoneDockGroup: THREE.Group;
  outletGroup: THREE.Group;
  updateChargingVisuals: (charging: boolean, dt: number) => void;
}

export interface PhoneStationConfig {
  scene: THREE.Scene;
  roomHalfW: number;
  isSoftwareGl: boolean;
  matteBlackMat: THREE.Material;
  brushedAlumMat: THREE.Material;
  registerHitbox: HitboxRegisterFn;
}

/**
 * Builds the physically separate Smartphone Charging Dock & Virtual Wall Outlet
 * mounted on the East Sideboard Credenza (across the room from the bed, zero overlap).
 */
export function buildPhoneStation(cfg: PhoneStationConfig): PhoneStationHandles {
  const {
    scene,
    roomHalfW,
    isSoftwareGl,
    matteBlackMat,
    brushedAlumMat,
    registerHitbox,
  } = cfg;

  // Positioned cleanly atop the East Sideboard (top surface Y = 0.56, Z = -0.18)
  const phoneDockGroup = new THREE.Group();
  phoneDockGroup.position.set(roomHalfW - 0.3, 0.56, -0.18);
  phoneDockGroup.rotation.y = -Math.PI / 2;
  scene.add(phoneDockGroup);

  // Machined aluminum upright charging stand
  const standBase = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.018, 0.12), brushedAlumMat);
  standBase.position.set(0, 0.009, 0);
  standBase.castShadow = !isSoftwareGl;
  const standBack = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.11, 0.014), brushedAlumMat);
  standBack.position.set(0, 0.062, -0.032);
  standBack.rotation.x = -0.24;
  phoneDockGroup.add(standBase, standBack);

  // Angled 3D Smartphone resting cleanly on dock lip (zero clipping)
  const phoneMount = new THREE.Group();
  phoneMount.position.set(0, 0.105, 0.006);
  phoneMount.rotation.x = -0.24;
  phoneDockGroup.add(phoneMount);

  const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(0.092, 0.182, 0.012), matteBlackMat);
  phoneBody.castShadow = !isSoftwareGl;
  phoneMount.add(phoneBody);

  const idlePhoneTex = createPhoneScreenTexture(false, 64);
  const chargingPhoneTex = createPhoneScreenTexture(true, 78);

  const phoneScreenMat = new THREE.MeshStandardMaterial({
    map: idlePhoneTex,
    emissive: 0xffffff,
    emissiveMap: idlePhoneTex,
    emissiveIntensity: 0.62,
    roughness: 0.16,
  });
  const phoneScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.082, 0.168), phoneScreenMat);
  phoneScreen.position.z = 0.007;
  phoneMount.add(phoneScreen);

  const phoneLedMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.45,
  });
  const dockStatusLed = new THREE.Mesh(new THREE.BoxGeometry(0.056, 0.006, 0.008), phoneLedMat);
  dockStatusLed.position.set(0, 0.02, 0.052);
  phoneDockGroup.add(dockStatusLed);

  registerHitbox(phoneDockGroup, [0.22, 0.26, 0.22], [0, 0.11, 0], 'phone');

  // Virtual Wall Outlet & USB-C Plug Adapter on the East Wall behind the Phone Dock
  const outletGroup = new THREE.Group();
  outletGroup.position.set(roomHalfW - 0.016, 0.88, -0.18);
  outletGroup.rotation.y = -Math.PI / 2;
  scene.add(outletGroup);

  const outletPlate = new THREE.Mesh(
    new THREE.BoxGeometry(0.18, 0.14, 0.018),
    new THREE.MeshStandardMaterial({ color: 0xd1d5db, roughness: 0.38, metalness: 0.12 })
  );
  outletGroup.add(outletPlate);

  [-0.042, 0.042].forEach((sx) => {
    const socket = new THREE.Mesh(
      new THREE.BoxGeometry(0.056, 0.068, 0.01),
      new THREE.MeshStandardMaterial({ color: 0x1e222b, roughness: 0.55 })
    );
    socket.position.set(sx, 0, 0.01);
    outletGroup.add(socket);
  });

  const plugAdapterGroup = new THREE.Group();
  plugAdapterGroup.position.set(0.042, 0, 0.036);
  outletGroup.add(plugAdapterGroup);

  const adapterBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.052, 0.058, 0.048),
    new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.28 })
  );
  plugAdapterGroup.add(adapterBody);

  const outletLedMat = new THREE.MeshStandardMaterial({
    color: 0x22c55e,
    emissive: 0x22c55e,
    emissiveIntensity: 0.08,
  });
  const outletLed = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.008, 0.008), outletLedMat);
  outletLed.position.set(0, 0.018, 0.025);
  plugAdapterGroup.add(outletLed);

  // Charging cable running neatly down the East wall onto the sideboard rear
  const cableMat = new THREE.MeshStandardMaterial({
    color: 0x1e2430,
    emissive: 0x22c55e,
    emissiveIntensity: 0.0,
    roughness: 0.5,
  });
  const cableVertical = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.32, 8),
    cableMat
  );
  cableVertical.position.set(0.042, -0.15, 0.048);
  const cableHorizontal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.005, 0.005, 0.24, 8),
    cableMat
  );
  cableHorizontal.rotation.x = Math.PI / 2;
  cableHorizontal.position.set(0.02, -0.31, 0.16);
  outletGroup.add(cableVertical, cableHorizontal);

  registerHitbox(outletGroup, [0.28, 0.26, 0.18], [0, -0.02, 0.03], 'outlet');

  let wasCharging = false;

  const updateChargingVisuals = (charging: boolean, dt: number) => {
    if (charging !== wasCharging) {
      wasCharging = charging;
      const nextTex = charging ? chargingPhoneTex : idlePhoneTex;
      phoneScreenMat.map = nextTex;
      phoneScreenMat.emissiveMap = nextTex;
      phoneScreenMat.needsUpdate = true;
    }

    const targetZ = charging ? 0.024 : 0.046;
    plugAdapterGroup.position.z = THREE.MathUtils.damp(
      plugAdapterGroup.position.z,
      targetZ,
      14,
      dt
    );
    outletLedMat.emissiveIntensity = THREE.MathUtils.damp(
      outletLedMat.emissiveIntensity,
      charging ? 2.2 : 0.08,
      10,
      dt
    );
    cableMat.emissiveIntensity = THREE.MathUtils.damp(
      cableMat.emissiveIntensity,
      charging ? 0.45 : 0.0,
      8,
      dt
    );
    phoneLedMat.color.setHex(charging ? 0x22c55e : 0x38bdf8);
    phoneLedMat.emissive.setHex(charging ? 0x22c55e : 0x38bdf8);
    phoneLedMat.emissiveIntensity = THREE.MathUtils.damp(
      phoneLedMat.emissiveIntensity,
      charging ? 1.8 : 0.45,
      10,
      dt
    );
  };

  return {
    phoneDockGroup,
    outletGroup,
    updateChargingVisuals,
  };
}
