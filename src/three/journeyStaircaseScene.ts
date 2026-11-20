import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { JOURNEY_MILESTONES } from '../data/portfolioData';
import {
  afterSoftwareDraw,
  createContactShadowTexture,
  createHorizonGridTexture,
  detectSoftwareWebGL,
  disposeObject3D,
} from './webglUtils';

export interface JourneyStaircaseController {
  selectMilestone: (index: number) => void;
  dispose: () => void;
}

export interface JourneyStaircaseOptions {
  container: HTMLElement;
  initialIndex?: number;
  onSelectMilestone?: (index: number) => void;
  onContextLost?: () => void;
}

// Reusable math temporaries
const _rayMouse = new THREE.Vector2();
const _camGoal = new THREE.Vector3();
const _targetGoal = new THREE.Vector3();

function createStepLabelTexture(indexText: string, title: string, accentHex: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#090D16';
    ctx.fillRect(0, 0, 256, 128);

    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 120);

    ctx.fillStyle = accentHex;
    ctx.font = '700 32px monospace';
    ctx.fillText(indexText, 18, 46);

    ctx.fillStyle = '#F8FAFC';
    ctx.font = '600 20px sans-serif';
    ctx.fillText(title.slice(0, 18), 18, 88);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function mountJourneyStaircaseScene(
  options: JourneyStaircaseOptions
): JourneyStaircaseController {
  const { container, initialIndex = 0, onSelectMilestone, onContextLost } = options;

  const isSoftwareGl = detectSoftwareWebGL();
  const isNarrow = window.innerWidth < 768;

  const width = Math.max(container.clientWidth, 280);
  const height = Math.max(container.clientHeight, 260);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06080f);
  scene.fog = new THREE.FogExp2(0x06080f, 0.028);

  const camera = new THREE.PerspectiveCamera(isNarrow ? 54 : 44, width / height, 0.1, 100);
  camera.position.set(-2.5, 4.6, 11.5);

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
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = !isSoftwareGl;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.style.display = 'block';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';

  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  pmrem.dispose();

  // Studio Lighting
  const hemi = new THREE.HemisphereLight(0xa5b4fc, 0x0b0e17, 0.85);
  scene.add(hemi);

  const keyLight = new THREE.DirectionalLight(0xf8fafc, 2.0);
  keyLight.position.set(6, 12, 8);
  keyLight.castShadow = !isSoftwareGl;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  const focusSpot = new THREE.PointLight(0x8b5cf6, 3.2, 8, 1.5);
  focusSpot.position.set(0, 3, 2);
  scene.add(focusSpot);

  // Reflective Horizon Grid Floor
  const gridTex = createHorizonGridTexture('rgba(139, 92, 246, 0.34)', 'rgba(148, 163, 184, 0.08)', '#06080f');
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({
      map: gridTex,
      roughness: 0.35,
      metalness: 0.55,
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.02;
  floor.receiveShadow = true;
  scene.add(floor);

  const contactTex = createContactShadowTexture();

  // ==========================================
  // 10 ASCENDING MONOLITH STEPS + FLOATING EMBLEMS
  // ==========================================
  const stepPositions: THREE.Vector3[] = [];
  const stepGroups: THREE.Group[] = [];
  const emblemMeshes: THREE.Object3D[] = [];
  const edgeMats: THREE.MeshStandardMaterial[] = [];
  const clickableSteps: THREE.Object3D[] = [];

  const totalSteps = JOURNEY_MILESTONES.length;

  JOURNEY_MILESTONES.forEach((m, idx) => {
    const t = idx / Math.max(1, totalSteps - 1);
    const sx = (idx - (totalSteps - 1) / 2) * 1.48;
    const sz = Math.sin(t * Math.PI * 1.15) * -1.45;
    const stepHeight = 0.55 + idx * 0.44;
    const stepColor = new THREE.Color(m.accentHex);

    const stepGrp = new THREE.Group();
    stepGrp.position.set(sx, 0, sz);
    scene.add(stepGrp);
    stepGroups.push(stepGrp);

    // Ground contact shadow
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.75, 1.75),
      new THREE.MeshBasicMaterial({
        map: contactTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.55,
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.005;
    stepGrp.add(shadow);

    // Main architectural plinth block
    const monolithMat = new THREE.MeshStandardMaterial({
      color: 0x101420,
      roughness: 0.38,
      metalness: 0.45,
    });
    const monolith = new THREE.Mesh(new THREE.BoxGeometry(1.18, stepHeight, 1.18), monolithMat);
    monolith.position.y = stepHeight / 2;
    monolith.castShadow = !isSoftwareGl;
    monolith.receiveShadow = true;
    stepGrp.add(monolith);

    // Glowing top perimeter cap
    const edgeMat = new THREE.MeshStandardMaterial({
      color: stepColor,
      emissive: stepColor,
      emissiveIntensity: idx === initialIndex ? 2.4 : 0.75,
      roughness: 0.2,
    });
    edgeMats.push(edgeMat);

    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.06, 1.22), edgeMat);
    topTrim.position.y = stepHeight - 0.02;
    stepGrp.add(topTrim);

    // Front milestone plaque texture
    const plaqueTex = createStepLabelTexture(m.index, m.title, m.accentHex);
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(0.96, 0.46),
      new THREE.MeshBasicMaterial({ map: plaqueTex })
    );
    plaque.position.set(0, Math.min(stepHeight - 0.28, Math.max(0.28, stepHeight * 0.55)), 0.595);
    stepGrp.add(plaque);

    // Floating multi-part 3D Emblem above each step
    const emblem = new THREE.Group();
    emblem.position.set(0, stepHeight + 0.72, 0);
    stepGrp.add(emblem);
    emblemMeshes.push(emblem);

    const emblemMat = new THREE.MeshPhysicalMaterial({
      color: stepColor,
      emissive: stepColor,
      emissiveIntensity: 0.55,
      metalness: 0.75,
      roughness: 0.18,
      clearcoat: 0.7,
    });

    if (idx % 4 === 0) {
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.24, 0), emblemMat);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 8, 28), edgeMat);
      ring.rotation.x = Math.PI / 3;
      emblem.add(core, ring);
    } else if (idx % 4 === 1) {
      const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(0.18, 0.05, 48, 8), emblemMat);
      emblem.add(knot);
    } else if (idx % 4 === 2) {
      const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 0), emblemMat);
      const halo = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.02, 8, 24), edgeMat);
      halo.rotation.y = Math.PI / 4;
      emblem.add(ico, halo);
    } else {
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), emblemMat);
      const orbit = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.022, 8, 24), edgeMat);
      orbit.rotation.x = Math.PI / 2.2;
      emblem.add(box, orbit);
    }

    // Raycast hitbox on Layer 1
    const hitbox = new THREE.Mesh(
      new THREE.BoxGeometry(1.32, stepHeight + 1.4, 1.32),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    hitbox.position.y = (stepHeight + 1.4) / 2;
    hitbox.layers.set(1);
    hitbox.userData.milestoneIndex = idx;
    stepGrp.add(hitbox);
    clickableSteps.push(hitbox);

    stepPositions.push(new THREE.Vector3(sx, stepHeight + 0.1, sz));
  });

  // Glowing connecting light-trail spline linking all 10 steps
  const curve = new THREE.CatmullRomCurve3(stepPositions);
  const trailGeo = new THREE.TubeGeometry(curve, 96, 0.032, 8, false);
  const trailMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.72,
  });
  const trailMesh = new THREE.Mesh(trailGeo, trailMat);
  scene.add(trailMesh);

  if (!isSoftwareGl) {
    renderer.compile(scene, camera);
  }

  // OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !isSoftwareGl;
  controls.dampingFactor = 0.07;
  controls.enablePan = true;
  controls.minDistance = 4.2;
  controls.maxDistance = 18;
  controls.maxPolarAngle = Math.PI * 0.47;

  let activeIndex = initialIndex;
  let userOrbiting = false;
  let autoFocusCam = true;

  const setFocusGoal = (index: number) => {
    activeIndex = THREE.MathUtils.clamp(index, 0, totalSteps - 1);
    const pt = stepPositions[activeIndex];
    _targetGoal.set(pt.x, pt.y + 0.45, pt.z);
    _camGoal.set(pt.x + (isNarrow ? 1.2 : 1.8), pt.y + (isNarrow ? 2.6 : 2.2), pt.z + (isNarrow ? 6.8 : 5.4));
    focusSpot.position.set(pt.x, pt.y + 1.8, pt.z + 1.2);
    focusSpot.color.set(JOURNEY_MILESTONES[activeIndex].accentHex);

    edgeMats.forEach((mat, idx) => {
      mat.emissiveIntensity = idx === activeIndex ? 2.8 : 0.65;
    });
    autoFocusCam = true;
  };
  setFocusGoal(initialIndex);
  camera.position.copy(_camGoal);
  controls.target.copy(_targetGoal);
  controls.update();

  controls.addEventListener('start', () => {
    userOrbiting = true;
    autoFocusCam = false;
  });
  controls.addEventListener('end', () => {
    userOrbiting = false;
  });

  // Click raycasting
  const raycaster = new THREE.Raycaster();
  raycaster.layers.set(1);
  let downX = 0;
  let downY = 0;

  const onPointerDown = (e: PointerEvent) => {
    downX = e.clientX;
    downY = e.clientY;
  };
  const onPointerUp = (e: PointerEvent) => {
    if (Math.hypot(e.clientX - downX, e.clientY - downY) > 8) return;
    const rect = renderer.domElement.getBoundingClientRect();
    _rayMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _rayMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(_rayMouse, camera);
    const hits = raycaster.intersectObjects(clickableSteps, false);
    if (hits.length > 0) {
      const idx = hits[0].object.userData.milestoneIndex;
      if (typeof idx === 'number') {
        setFocusGoal(idx);
        onSelectMilestone?.(idx);
      }
    }
  };
  const onPointerMove = (e: PointerEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    _rayMouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _rayMouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(_rayMouse, camera);
    const hits = raycaster.intersectObjects(clickableSteps, false);
    renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
  };

  renderer.domElement.addEventListener('pointerdown', onPointerDown);
  renderer.domElement.addEventListener('pointerup', onPointerUp);
  renderer.domElement.addEventListener('pointermove', onPointerMove, { passive: true });

  const onResize = () => {
    if (disposed) return;
    const w = Math.max(container.clientWidth, 260);
    const h = Math.max(container.clientHeight, 220);
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
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function renderFrame() {
    if (disposed || !isVisible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    // Float & rotate milestone emblems
    if (!prefersReducedMotion) {
      emblemMeshes.forEach((emb, idx) => {
        const basePt = stepPositions[idx];
        const boost = idx === activeIndex ? 0.16 : 0;
        emb.position.y = basePt.y + 0.62 + boost + Math.sin(t * 2.0 + idx * 0.7) * 0.08;
        emb.rotation.y += dt * (idx === activeIndex ? 1.45 : 0.65);
      });
    }

    // Smooth camera focus when milestone button or step is clicked
    if (autoFocusCam && !userOrbiting) {
      const lambda = isSoftwareGl ? 12 : 4.8;
      camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoal.x, lambda, dt);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoal.y, lambda, dt);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoal.z, lambda, dt);
      controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetGoal.x, lambda, dt);
      controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetGoal.y, lambda, dt);
      controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetGoal.z, lambda, dt);

      if (camera.position.distanceTo(_camGoal) < 0.04) {
        autoFocusCam = false;
      }
    }

    controls.update();
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
    selectMilestone(index: number) {
      setFocusGoal(index);
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      timerIds.forEach((id) => clearTimeout(id));
      timerIds = [];
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('pointermove', onPointerMove);
      renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      controls.dispose();
      disposeObject3D(scene);
      envTex.dispose();
      renderer.dispose();
    },
  };
}
