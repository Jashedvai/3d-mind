import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  afterSoftwareDraw,
  createHorizonGridTexture,
  detectSoftwareWebGL,
  disposeObject3D,
} from './webglUtils';

export type HeroInteractionMode = 'pointer' | 'inspect';

export interface AhjHeroController {
  setInteractionMode: (mode: HeroInteractionMode) => void;
  setAutoRotate: (enabled: boolean) => void;
  setAccentColor: (hex: string) => void;
  setReducedMotion: (reduced: boolean) => void;
  dispose: () => void;
}

export interface AhjHeroOptions {
  container: HTMLElement;
  accentHex?: string;
  backgroundHex?: string;
  reducedMotion?: boolean;
  onContextLost?: () => void;
}

function createExtrudedLetterA(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.56, -0.75);
  shape.lineTo(-0.24, -0.75);
  shape.lineTo(-0.16, -0.35);
  shape.lineTo(0.16, -0.35);
  shape.lineTo(0.24, -0.75);
  shape.lineTo(0.56, -0.75);
  shape.lineTo(0.24, 0.75);
  shape.lineTo(-0.24, 0.75);
  shape.closePath();

  const hole = new THREE.Path();
  hole.moveTo(-0.11, -0.08);
  hole.lineTo(0.11, -0.08);
  hole.lineTo(0.0, 0.42);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.038,
    bevelSegments: 4,
    curveSegments: 12,
  });
  geo.center();
  return geo;
}

function createExtrudedLetterH(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.52, -0.75);
  shape.lineTo(-0.22, -0.75);
  shape.lineTo(-0.22, -0.15);
  shape.lineTo(0.22, -0.15);
  shape.lineTo(0.22, -0.75);
  shape.lineTo(0.52, -0.75);
  shape.lineTo(0.52, 0.75);
  shape.lineTo(0.22, 0.75);
  shape.lineTo(0.22, 0.15);
  shape.lineTo(-0.22, 0.15);
  shape.lineTo(-0.22, 0.75);
  shape.lineTo(-0.52, 0.75);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.038,
    bevelSegments: 4,
    curveSegments: 8,
  });
  geo.center();
  return geo;
}

function createExtrudedLetterJ(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0.15, 0.75);
  shape.lineTo(0.47, 0.75);
  shape.lineTo(0.47, -0.2);
  shape.quadraticCurveTo(0.47, -0.78, -0.04, -0.78);
  shape.quadraticCurveTo(-0.5, -0.78, -0.52, -0.28);
  shape.lineTo(-0.21, -0.28);
  shape.quadraticCurveTo(-0.19, -0.49, -0.02, -0.49);
  shape.quadraticCurveTo(0.15, -0.49, 0.15, -0.2);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.24,
    bevelEnabled: true,
    bevelThickness: 0.045,
    bevelSize: 0.038,
    bevelSegments: 4,
    curveSegments: 16,
  });
  geo.center();
  return geo;
}

export function mountAhjHeroScene(options: AhjHeroOptions): AhjHeroController {
  const {
    container,
    accentHex = '#38BDF8',
    backgroundHex,
    reducedMotion: initialReduced = false,
    onContextLost,
  } = options;

  const isSoftwareGl = detectSoftwareWebGL();
  const isNarrow = window.innerWidth < 768;

  const width = Math.max(container.clientWidth, 280);
  const height = Math.max(container.clientHeight, 260);

  const isCutoutMode = Boolean(backgroundHex);
  const scene = new THREE.Scene();
  if (backgroundHex) {
    scene.background = new THREE.Color(backgroundHex);
  } else {
    scene.background = new THREE.Color(0x04060c);
    scene.fog = new THREE.FogExp2(0x04060c, 0.068);
  }

  const camera = new THREE.PerspectiveCamera(isNarrow ? 50 : 42, width / height, 0.1, 45);
  camera.position.set(0, 0.55, isNarrow ? 7.4 : 5.9);
  camera.lookAt(0, 0.05, 0);

  const renderer = new THREE.WebGLRenderer({
    antialias: !isSoftwareGl,
    alpha: isCutoutMode,
    powerPreference: 'high-performance',
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, isNarrow ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = isCutoutMode ? 1.38 : 1.28;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.style.touchAction = 'none';

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Mandatory Studio Environment Reflection for Obsidian Chrome PBR
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environment = envTex;
  pmrem.dispose();

  // Lighting Rig
  const accentColor = new THREE.Color(accentHex);

  const hemiLight = new THREE.HemisphereLight(isCutoutMode ? 0xe0e7ff : 0x93c5fd, 0x090b12, 0.85);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, isCutoutMode ? 3.2 : 2.5);
  keyLight.position.set(3.5, 5.2, 4.2);
  scene.add(keyLight);

  const rimLightCyan = new THREE.SpotLight(
    isCutoutMode ? 0x1d4ed8 : accentColor,
    isCutoutMode ? 5.8 : 4.5,
    16,
    Math.PI / 2.6,
    0.65,
    1.2
  );
  rimLightCyan.position.set(-4.5, 3.2, -3.5);
  scene.add(rimLightCyan);

  const rimLightViolet = new THREE.PointLight(
    isCutoutMode ? 0xbe123c : 0x8b5cf6,
    isCutoutMode ? 4.4 : 2.8,
    12,
    1.4
  );
  rimLightViolet.position.set(4.2, 1.6, -2.6);
  scene.add(rimLightViolet);

  const arcMat = new THREE.MeshBasicMaterial({
    color: accentColor,
    transparent: true,
    opacity: 0.62,
  });

  if (!isCutoutMode) {
    // Perspective Horizon Floor Grid (dark studio mode)
    const gridTex = createHorizonGridTexture(accentHex);
    gridTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

    const floorPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(36, 36),
      new THREE.MeshStandardMaterial({
        color: 0x050811,
        map: gridTex,
        emissive: 0xffffff,
        emissiveMap: gridTex,
        emissiveIntensity: 0.42,
        roughness: 0.25,
        metalness: 0.65,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    floorPlane.rotation.x = -Math.PI / 2;
    floorPlane.position.y = -1.48;
    scene.add(floorPlane);

    const horizonArc = new THREE.Mesh(
      new THREE.TorusGeometry(6.8, 0.025, 12, 96, Math.PI),
      arcMat
    );
    horizonArc.position.set(0, -1.3, -4.4);
    scene.add(horizonArc);
  }

  // Shared Obsidian-Chrome PBR Material
  const chromeMat = new THREE.MeshPhysicalMaterial({
    color: 0x262a34,
    metalness: 0.96,
    roughness: 0.13,
    clearcoat: 1.0,
    clearcoatRoughness: 0.08,
    anisotropy: 0.65,
    envMapIntensity: 1.55,
  });

  const accentChromeMat = new THREE.MeshPhysicalMaterial({
    color: 0x1e2430,
    metalness: 0.94,
    roughness: 0.18,
    clearcoat: 1.0,
    emissive: accentColor,
    emissiveIntensity: 0.08,
    envMapIntensity: 1.4,
  });

  // Master Interactive Group
  const heroGroup = new THREE.Group();
  scene.add(heroGroup);

  // 1. Animated Abstract Intertwined Chrome Sculpture (Centerpiece)
  const sculptureGroup = new THREE.Group();
  sculptureGroup.position.set(0, 0.74, -0.22);
  sculptureGroup.scale.setScalar(0.84);
  heroGroup.add(sculptureGroup);

  const knotMesh = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.86, 0.21, isSoftwareGl ? 96 : 160, 28, 2, 3),
    chromeMat
  );
  sculptureGroup.add(knotMesh);

  const orbitalRingA = new THREE.Mesh(
    new THREE.TorusGeometry(1.18, 0.048, 16, 72),
    accentChromeMat
  );
  orbitalRingA.rotation.set(0.62, 0.38, 0.15);
  sculptureGroup.add(orbitalRingA);

  const orbitalRingB = new THREE.Mesh(
    new THREE.TorusGeometry(0.98, 0.036, 16, 64),
    chromeMat
  );
  orbitalRingB.rotation.set(-0.55, -0.45, 0.72);
  sculptureGroup.add(orbitalRingB);

  const innerCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 1), accentChromeMat);
  sculptureGroup.add(innerCore);

  // 2. Custom Extruded Metallic Monogram: A  H  J
  const monogramGroup = new THREE.Group();
  monogramGroup.position.set(0, -0.78, 0.65);
  heroGroup.add(monogramGroup);

  const letterA = new THREE.Mesh(createExtrudedLetterA(), chromeMat);
  letterA.position.set(-1.58, 0, 0);
  letterA.scale.setScalar(0.76);

  const letterH = new THREE.Mesh(createExtrudedLetterH(), chromeMat);
  letterH.position.set(0, 0, 0.06);
  letterH.scale.setScalar(0.76);

  const letterJ = new THREE.Mesh(createExtrudedLetterJ(), chromeMat);
  letterJ.position.set(1.58, 0, 0);
  letterJ.scale.setScalar(0.76);

  monogramGroup.add(letterA, letterH, letterJ);

  // Subtle Metallic Plinth Rail beneath AHJ
  const plinthRail = new THREE.Mesh(
    new THREE.BoxGeometry(4.2, 0.025, 0.06),
    new THREE.MeshBasicMaterial({ color: accentColor, transparent: true, opacity: 0.45 })
  );
  plinthRail.position.set(0, -1.41, 0.65);
  heroGroup.add(plinthRail);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  // Interaction State
  let interactionMode: HeroInteractionMode = 'pointer';
  let autoRotate = true;
  let reducedMotion = initialReduced;
  let pointerX = 0;
  let pointerY = 0;
  let inspectYaw = 0;
  let inspectPitch = 0;
  let targetInspectYaw = 0;
  let targetInspectPitch = 0;
  let isDragging = false;
  let lastX = 0;
  let lastY = 0;

  const onPointerDown = (e: PointerEvent) => {
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  };

  const onPointerMove = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    pointerX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerY = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    if (isDragging && interactionMode === 'inspect') {
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      targetInspectYaw += dx * 0.008;
      targetInspectPitch = THREE.MathUtils.clamp(targetInspectPitch + dy * 0.006, -0.45, 0.45);
    }
  };

  const onPointerUp = () => {
    isDragging = false;
  };

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerup', onPointerUp);

  const onResize = () => {
    if (disposed) return;
    const w = Math.max(container.clientWidth, 260);
    const h = Math.max(container.clientHeight, 240);
    camera.aspect = w / h;
    camera.position.z = w < 640 ? 7.4 : 6.1;
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

    if (!reducedMotion) {
      if (autoRotate) {
        sculptureGroup.rotation.y += dt * 0.36;
        sculptureGroup.rotation.x = Math.sin(elapsed * 0.55) * 0.14;
        orbitalRingA.rotation.z += dt * 0.28;
        orbitalRingB.rotation.x -= dt * 0.22;
        innerCore.rotation.y -= dt * 0.7;
      }
      sculptureGroup.position.y = 0.74 + Math.sin(elapsed * 1.1) * 0.05;
    }

    if (interactionMode === 'inspect') {
      inspectYaw = THREE.MathUtils.damp(inspectYaw, targetInspectYaw, 8, dt);
      inspectPitch = THREE.MathUtils.damp(inspectPitch, targetInspectPitch, 8, dt);
      heroGroup.rotation.y = inspectYaw;
      heroGroup.rotation.x = inspectPitch;
    } else {
      const targetRotY = reducedMotion ? 0 : pointerX * 0.22;
      const targetRotX = reducedMotion ? 0 : -pointerY * 0.1;
      heroGroup.rotation.y = THREE.MathUtils.damp(heroGroup.rotation.y, targetRotY, 5, dt);
      heroGroup.rotation.x = THREE.MathUtils.damp(heroGroup.rotation.x, targetRotX, 5, dt);
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
    setInteractionMode(mode: HeroInteractionMode) {
      interactionMode = mode;
      renderer.domElement.style.cursor = mode === 'inspect' ? 'grab' : 'default';
      if (mode === 'pointer') {
        targetInspectYaw = 0;
        targetInspectPitch = 0;
      }
    },
    setAutoRotate(enabled: boolean) {
      autoRotate = enabled;
    },
    setAccentColor(hex: string) {
      const c = new THREE.Color(hex);
      rimLightCyan.color.copy(c);
      arcMat.color.copy(c);
      accentChromeMat.emissive.copy(c);
    },
    setReducedMotion(reduced: boolean) {
      reducedMotion = reduced;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      timerIds.forEach((id) => clearTimeout(id));
      timerIds = [];
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      disposeObject3D(scene);
      envTex.dispose();
      renderer.dispose();
    },
  };
}
