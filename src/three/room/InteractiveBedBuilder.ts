import * as THREE from 'three';
import { HitboxRegisterFn } from './roomTypes';

export interface InteractiveBedHandles {
  bedGroup: THREE.Group;
  bedsideLampGroup: THREE.Group;
  bedsideShadeMat: THREE.MeshStandardMaterial;
}

export interface InteractiveBedConfig {
  scene: THREE.Scene;
  roomHalfL: number;
  isSoftwareGl: boolean;
  walnutMat: THREE.Material;
  matteBlackMat: THREE.Material;
  brushedAlumMat: THREE.Material;
  fabricBump: THREE.Texture;
  fabricRough: THREE.Texture;
  registerHitbox: HitboxRegisterFn;
}

/**
 * Builds the standalone North-wall platform bed, upholstered headboard, floating shelves,
 * and North-West nightstand with warm 2700K lamp.
 * Physically decoupled from the smartphone charging station (built separately on the East sideboard).
 */
export function buildInteractiveBed(cfg: InteractiveBedConfig): InteractiveBedHandles {
  const {
    scene,
    roomHalfL,
    isSoftwareGl,
    walnutMat,
    matteBlackMat,
    brushedAlumMat,
    fabricBump,
    fabricRough,
    registerHitbox,
  } = cfg;

  const bedGroup = new THREE.Group();
  bedGroup.position.set(0.32, 0, -roomHalfL + 1.52);
  scene.add(bedGroup);

  const fabricBedMat = new THREE.MeshStandardMaterial({
    color: 0x383b40,
    bumpMap: fabricBump,
    bumpScale: 0.009,
    roughnessMap: fabricRough,
    roughness: 0.9,
  });

  const blanketMat = new THREE.MeshStandardMaterial({
    color: 0x4b5058,
    bumpMap: fabricBump,
    bumpScale: 0.011,
    roughnessMap: fabricRough,
    roughness: 0.88,
  });

  const bedFrame = new THREE.Mesh(new THREE.BoxGeometry(2.26, 0.26, 2.88), walnutMat);
  bedFrame.position.y = 0.13;
  bedFrame.castShadow = !isSoftwareGl;
  bedFrame.receiveShadow = true;
  bedGroup.add(bedFrame);

  const headboard = new THREE.Mesh(new THREE.BoxGeometry(2.34, 1.02, 0.14), fabricBedMat);
  headboard.position.set(0, 0.62, -1.37);
  headboard.castShadow = !isSoftwareGl;
  headboard.receiveShadow = true;
  bedGroup.add(headboard);

  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(2.12, 0.22, 2.7),
    new THREE.MeshStandardMaterial({ color: 0xe6e8ec, roughness: 0.86 })
  );
  mattress.position.y = 0.35;
  mattress.receiveShadow = true;
  bedGroup.add(mattress);

  const blanket = new THREE.Mesh(new THREE.BoxGeometry(2.16, 0.23, 1.86), blanketMat);
  blanket.position.set(0, 0.36, 0.42);
  blanket.receiveShadow = true;
  bedGroup.add(blanket);

  const throwRunner = new THREE.Mesh(
    new THREE.BoxGeometry(2.18, 0.02, 0.46),
    new THREE.MeshStandardMaterial({ color: 0x262930, roughness: 0.9 })
  );
  throwRunner.position.set(0, 0.48, 0.86);
  bedGroup.add(throwRunner);

  [-0.5, 0.5].forEach((px) => {
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(0.76, 0.15, 0.46),
      new THREE.MeshStandardMaterial({ color: 0xf8f9fa, roughness: 0.82 })
    );
    pillow.position.set(px, 0.51, -0.96);
    pillow.rotation.x = 0.18;
    pillow.castShadow = !isSoftwareGl;
    bedGroup.add(pillow);
  });

  // Dedicated clickable bed hitbox (opens Bed Rest view, physically independent of phone)
  registerHitbox(bedGroup, [2.36, 0.72, 2.86], [0, 0.38, 0], 'bed');

  // Floating North-Wall Shelves above Headboard
  const shelfLedMat = new THREE.MeshStandardMaterial({
    color: 0xf8f9fa,
    emissive: 0xf8f9fa,
    emissiveIntensity: 0.95,
    roughness: 0.25,
  });

  [2.18, 2.78].forEach((sy, sIdx) => {
    const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.62, 0.045, 0.28), walnutMat);
    shelf.position.set(0.32, sy, -roomHalfL + 0.16);
    shelf.castShadow = !isSoftwareGl;
    scene.add(shelf);

    const shelfLed = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.014, 0.018), shelfLedMat);
    shelfLed.position.set(0.32, sy - 0.025, -roomHalfL + 0.05);
    scene.add(shelfLed);

    const colors = [0x38bdf8, 0x94a3b8, 0x383b40, 0xf8f9fa, 0x64748b];
    for (let k = 0; k < 5; k++) {
      const h = 0.22 + ((k + sIdx) % 3) * 0.04;
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, h, 0.19),
        new THREE.MeshStandardMaterial({
          color: colors[(k + sIdx) % colors.length],
          roughness: 0.65,
        })
      );
      book.position.set(-0.22 + k * 0.075, sy + 0.022 + h / 2, -roomHalfL + 0.17);
      scene.add(book);
    }
  });

  // North-West Nightstand beside Bed (Lamp + Alarm/Book only — no phone)
  const nsX = -1.32;
  const nsZ = -roomHalfL + 0.36;
  const nightstand = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.56, 0.52), walnutMat);
  nightstand.position.set(nsX, 0.28, nsZ);
  nightstand.castShadow = !isSoftwareGl;
  nightstand.receiveShadow = true;
  scene.add(nightstand);

  const nsHandle = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.018, 0.024), brushedAlumMat);
  nsHandle.position.set(nsX, 0.38, nsZ + 0.27);
  scene.add(nsHandle);

  // Warm 2700K Bedside Lamp centered cleanly on Nightstand
  const bedsideBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 0.04, 14),
    matteBlackMat
  );
  bedsideBase.position.set(nsX, 0.58, nsZ - 0.04);
  scene.add(bedsideBase);

  const bedsideShadeMat = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xf59e0b,
    emissiveIntensity: 1.0,
  });
  const bedsideLampGroup = new THREE.Group();
  bedsideLampGroup.position.set(nsX, 0.76, nsZ - 0.04);
  const bedsideShade = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.15, 0.18, 16),
    bedsideShadeMat
  );
  bedsideLampGroup.add(bedsideShade);
  registerHitbox(bedsideLampGroup, [0.34, 0.38, 0.34], [0, -0.04, 0], 'light_bed');
  scene.add(bedsideLampGroup);

  return {
    bedGroup,
    bedsideLampGroup,
    bedsideShadeMat,
  };
}
