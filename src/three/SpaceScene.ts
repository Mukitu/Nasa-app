import * as THREE from 'three';
import {
  createSunTexture,
  createEarthTexture,
  createEarthCloudTexture,
  createMoonTexture,
  createMarsTexture,
  createJupiterTexture,
  createSaturnTexture,
  createSaturnRingTexture,
  createUranusTexture,
  createNeptuneTexture,
  createMercuryTexture,
  createVenusTexture
} from './textures';
import { PlanetId, GraphicsQuality, ViewMode, MissionPhase, LaunchTarget } from '../types/simulation';

export interface SceneCallbacks {
  onPlanetSelect?: (planetId: PlanetId) => void;
  onCameraMoveStart?: () => void;
  onCameraMoveEnd?: () => void;
  onLaunchProgressUpdate?: (progress: number, altitudeKm: number, velocityKmh: number, phase: MissionPhase) => void;
  onAutoLaunchStateChange?: (active: boolean) => void;
}

export class SpaceScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private callbacks: SceneCallbacks;

  // Visual Groups
  private solarSystemGroup: THREE.Group;
  private orbitsGroup: THREE.Group;
  private launchPadGroup: THREE.Group;
  private starsParticles: THREE.Points | null = null;
  private exhaustParticles: THREE.Points | null = null;
  private exhaustGeometry: THREE.BufferGeometry | null = null;

  // Launch pad environmental elements
  private padSkyMat: THREE.MeshBasicMaterial | null = null;
  private padSkyMesh: THREE.Mesh | null = null;
  private curvedEarthMesh: THREE.Mesh | null = null;
  private lunarArrivalMesh: THREE.Mesh | null = null;
  private marsArrivalMesh: THREE.Mesh | null = null;

  // Planet meshes map
  private planetMeshes: Map<PlanetId, THREE.Mesh> = new Map();
  private earthCloudsMesh: THREE.Mesh | null = null;
  private moonGroup: THREE.Group | null = null;

  // Spacecraft & Launch Mechanics
  private rocketMesh: THREE.Group | null = null;
  private srbLeftMesh: THREE.Mesh | null = null;
  private srbRightMesh: THREE.Mesh | null = null;
  private rocketIgnitionLight: THREE.PointLight | null = null;

  // State
  private currentViewMode: ViewMode = 'mission-control';
  private targetPlanetId: PlanetId = 'earth';
  private quality: GraphicsQuality = 'high';
  private orbitSpeedMultiplier: number = 1.0;
  private isPaused: boolean = false;
  private missionPhase: MissionPhase = 'STANDBY';
  private launchTarget: LaunchTarget = 'earth_orbit';

  // Continuous Launch Progress (0.0 to 1.0)
  private launchProgress: number = 0.0;
  private autoLaunchActive: boolean = false;
  private autoLaunchDurationSec: number = 6.8;
  private launchCameraAngle: 'pad' | 'tower' | 'ascent' | 'orbital' | 'spacecraft' | 'free' = 'pad';

  private simulatedAltitudeKm: number = 0;
  private simulatedVelocityKmh: number = 0;

  // Camera lerp targets
  private cameraTargetPosition = new THREE.Vector3(0, 5, 20);
  private cameraLookAtTarget = new THREE.Vector3(0, 0, 0);
  private currentCameraLookAt = new THREE.Vector3(0, 0, 0);
  private isTransitioningCamera: boolean = false;

  // User Orbit / Pan interactions
  private isDragging: boolean = false;
  private previousMousePosition = { x: 0, y: 0 };
  private sphericalCoords = { radius: 28, theta: 0.8, phi: Math.PI / 2.4 };

  // Raycasting
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  constructor(container: HTMLElement, callbacks: SceneCallbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;

    // 1. Scene & Camera
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04060c);
    this.scene.fog = new THREE.FogExp2(0x04060c, 0.0012);

    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 4000);
    this.camera.position.set(0, 6, 22);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    container.appendChild(this.renderer.domElement);

    // Groups
    this.solarSystemGroup = new THREE.Group();
    this.orbitsGroup = new THREE.Group();
    this.launchPadGroup = new THREE.Group();
    this.scene.add(this.solarSystemGroup);
    this.solarSystemGroup.add(this.orbitsGroup);
    this.scene.add(this.launchPadGroup);

    // 3. Build scene
    this.setupLighting();
    this.setupStarfield();
    this.buildSolarSystem();
    this.buildLaunchPadAndRocket();
    this.setupInteractionListeners();

    // Default view: Earth orbit
    this.focusOnPlanet('earth');

    // Start render loop
    this.startLoop();
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(0x1a2638, 0.7);
    this.scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xfff7ed, 3.2, 1800, 0.8);
    sunLight.position.set(0, 0, 0);
    this.solarSystemGroup.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.25);
    this.scene.add(hemiLight);
  }

  private setupStarfield(): void {
    if (this.starsParticles) {
      this.scene.remove(this.starsParticles);
      this.starsParticles.geometry.dispose();
    }

    const starCount = this.quality === 'high' ? 3400 : this.quality === 'medium' ? 1800 : 700;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    const colorTints = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x93c5fd),
      new THREE.Color(0xfef08a),
      new THREE.Color(0xfca5a5),
    ];

    for (let i = 0; i < starCount; i++) {
      const radius = 900 + Math.random() * 900;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = radius * Math.cos(phi);

      const tint = colorTints[Math.floor(Math.random() * colorTints.length)];
      colors[i * 3] = tint.r;
      colors[i * 3 + 1] = tint.g;
      colors[i * 3 + 2] = tint.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: this.quality === 'high' ? 2.2 : 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    this.starsParticles = new THREE.Points(geometry, material);
    this.scene.add(this.starsParticles);
  }

  private buildSolarSystem(): void {
    // 1. Sun
    const sunGeo = new THREE.SphereGeometry(7, 32, 32);
    const sunTex = createSunTexture();
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex, color: 0xffffff });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.userData = { id: 'sun', name: 'The Sun (Sol)' };
    this.solarSystemGroup.add(sunMesh);
    this.planetMeshes.set('sun', sunMesh);

    // Sun corona
    const coronaGeo = new THREE.SphereGeometry(7.6, 24, 24);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.22,
      side: THREE.BackSide,
    });
    sunMesh.add(new THREE.Mesh(coronaGeo, coronaMat));

    // Planetary configurations
    const planetConfigs = [
      { id: 'mercury' as PlanetId, radius: 0.9, dist: 16, textureFn: createMercuryTexture, tilt: 0.03 },
      { id: 'venus' as PlanetId, radius: 1.6, dist: 24, textureFn: createVenusTexture, tilt: 3.1 },
      { id: 'earth' as PlanetId, radius: 2.2, dist: 35, textureFn: createEarthTexture, tilt: 0.41 },
      { id: 'mars' as PlanetId, radius: 1.3, dist: 48, textureFn: createMarsTexture, tilt: 0.44 },
      { id: 'jupiter' as PlanetId, radius: 4.8, dist: 68, textureFn: createJupiterTexture, tilt: 0.05 },
      { id: 'saturn' as PlanetId, radius: 3.9, dist: 92, textureFn: createSaturnTexture, tilt: 0.47, hasRings: true },
      { id: 'uranus' as PlanetId, radius: 2.6, dist: 118, textureFn: createUranusTexture, tilt: 1.7 },
      { id: 'neptune' as PlanetId, radius: 2.5, dist: 142, textureFn: createNeptuneTexture, tilt: 0.49 },
    ];

    planetConfigs.forEach((cfg) => {
      // Planet orbit ring
      const orbitGeo = new THREE.BufferGeometry();
      const pointsCount = 128;
      const points: THREE.Vector3[] = [];
      for (let i = 0; i <= pointsCount; i++) {
        const angle = (i / pointsCount) * Math.PI * 2;
        points.push(new THREE.Vector3(Math.cos(angle) * cfg.dist, 0, Math.sin(angle) * cfg.dist));
      }
      orbitGeo.setFromPoints(points);
      const orbitMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.16,
      });
      this.orbitsGroup.add(new THREE.Line(orbitGeo, orbitMat));

      // Planet Mesh
      const geo = new THREE.SphereGeometry(cfg.radius, 32, 32);
      const tex = cfg.textureFn();
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.8,
        metalness: 0.1,
      });
      const planetMesh = new THREE.Mesh(geo, mat);
      planetMesh.rotation.z = cfg.tilt;
      planetMesh.position.set(cfg.dist, 0, 0);
      planetMesh.userData = { id: cfg.id, dist: cfg.dist, speed: 0.015 / Math.sqrt(cfg.dist) };

      this.solarSystemGroup.add(planetMesh);
      this.planetMeshes.set(cfg.id, planetMesh);

      // Earth specifics: Atmosphere Glow & Dynamic Clouds
      if (cfg.id === 'earth') {
        const cloudGeo = new THREE.SphereGeometry(cfg.radius * 1.025, 32, 32);
        const cloudTex = createEarthCloudTexture();
        const cloudMat = new THREE.MeshStandardMaterial({
          map: cloudTex,
          transparent: true,
          opacity: 0.85,
          blending: THREE.NormalBlending,
        });
        this.earthCloudsMesh = new THREE.Mesh(cloudGeo, cloudMat);
        planetMesh.add(this.earthCloudsMesh);

        // Atmosphere rim glow
        const atmoGeo = new THREE.SphereGeometry(cfg.radius * 1.07, 24, 24);
        const atmoMat = new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.18,
          side: THREE.BackSide,
        });
        planetMesh.add(new THREE.Mesh(atmoGeo, atmoMat));

        // The Moon (Luna) orbiting Earth
        this.moonGroup = new THREE.Group();
        planetMesh.add(this.moonGroup);

        const moonGeo = new THREE.SphereGeometry(0.65, 24, 24);
        const moonTex = createMoonTexture();
        const moonMat = new THREE.MeshStandardMaterial({
          map: moonTex,
          roughness: 0.9,
          metalness: 0.05,
        });
        const moonMesh = new THREE.Mesh(moonGeo, moonMat);
        moonMesh.position.set(6.2, 0.4, 0);
        moonMesh.userData = { id: 'moon', name: 'The Moon (Luna)' };
        this.moonGroup.add(moonMesh);
        this.planetMeshes.set('moon', moonMesh);

        // Moon orbit ring
        const moonOrbitGeo = new THREE.BufferGeometry();
        const moonPoints: THREE.Vector3[] = [];
        for (let i = 0; i <= 64; i++) {
          const a = (i / 64) * Math.PI * 2;
          moonPoints.push(new THREE.Vector3(Math.cos(a) * 6.2, 0.4, Math.sin(a) * 6.2));
        }
        moonOrbitGeo.setFromPoints(moonPoints);
        this.moonGroup.add(
          new THREE.Line(
            moonOrbitGeo,
            new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.2 })
          )
        );
      }

      // Mars specifics
      if (cfg.id === 'mars') {
        const marsAtmoGeo = new THREE.SphereGeometry(cfg.radius * 1.04, 24, 24);
        const marsAtmoMat = new THREE.MeshBasicMaterial({
          color: 0xf97316,
          transparent: true,
          opacity: 0.14,
          side: THREE.BackSide,
        });
        planetMesh.add(new THREE.Mesh(marsAtmoGeo, marsAtmoMat));
      }

      // Saturn specifics
      if (cfg.hasRings) {
        const ringGeo = new THREE.RingGeometry(cfg.radius * 1.35, cfg.radius * 2.5, 64);
        ringGeo.rotateX(Math.PI / 2);
        const ringTex = createSaturnRingTexture();
        const ringMat = new THREE.MeshStandardMaterial({
          map: ringTex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9,
          roughness: 0.7,
        });
        planetMesh.add(new THREE.Mesh(ringGeo, ringMat));
      }
    });
  }

  private buildLaunchPadAndRocket(): void {
    this.launchPadGroup.position.set(1000, 0, 0);
    this.launchPadGroup.visible = false;

    // Launch ground base / terrain
    const groundGeo = new THREE.CylinderGeometry(40, 45, 2, 48);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = -1;
    this.launchPadGroup.add(groundMesh);

    // Launch table & trench flame deflector
    const flameTrenchGeo = new THREE.BoxGeometry(16, 4, 16);
    const trenchMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8 });
    const trenchMesh = new THREE.Mesh(flameTrenchGeo, trenchMat);
    trenchMesh.position.y = 1;
    this.launchPadGroup.add(trenchMesh);

    // Launch Tower / Gantry Truss
    const towerGroup = new THREE.Group();
    towerGroup.position.set(-6, 12, 0);
    const towerPillarGeo = new THREE.BoxGeometry(1.5, 24, 1.5);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.6, roughness: 0.4 });
    const towerMesh = new THREE.Mesh(towerPillarGeo, towerMat);
    towerGroup.add(towerMesh);

    // Tower swing arms
    const arm1 = new THREE.Mesh(new THREE.BoxGeometry(5, 0.4, 0.4), towerMat);
    arm1.position.set(2.5, 6, 0);
    towerGroup.add(arm1);
    const arm2 = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.4, 0.4), towerMat);
    arm2.position.set(2.25, 2, 0);
    towerGroup.add(arm2);
    this.launchPadGroup.add(towerGroup);

    // Atmospheric skybox for launch pad: starts as dusk atmosphere and fades into black space
    const skyGeo = new THREE.SphereGeometry(180, 32, 32);
    this.padSkyMat = new THREE.MeshBasicMaterial({
      color: 0x0b2545,
      side: THREE.BackSide,
      transparent: true,
      opacity: 1.0,
    });
    this.padSkyMesh = new THREE.Mesh(skyGeo, this.padSkyMat);
    this.launchPadGroup.add(this.padSkyMesh);

    // Curved Earth horizon mesh below launch trajectory (reveals as altitude increases)
    const earthDiscGeo = new THREE.SphereGeometry(120, 48, 48);
    const earthDiscMat = new THREE.MeshStandardMaterial({
      map: createEarthTexture(),
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      opacity: 0,
    });
    this.curvedEarthMesh = new THREE.Mesh(earthDiscGeo, earthDiscMat);
    this.curvedEarthMesh.position.set(0, -118, 0);
    this.launchPadGroup.add(this.curvedEarthMesh);

    // Dedicated Lunar Destination Arrival Mesh (visible during Moon transit in Space Launch mode)
    const moonArrivalGeo = new THREE.SphereGeometry(22, 32, 32);
    const moonArrivalMat = new THREE.MeshStandardMaterial({
      map: createMoonTexture(),
      roughness: 0.9,
      metalness: 0.05,
    });
    this.lunarArrivalMesh = new THREE.Mesh(moonArrivalGeo, moonArrivalMat);
    this.lunarArrivalMesh.position.set(-110, 80, -120);
    this.lunarArrivalMesh.visible = false;
    this.launchPadGroup.add(this.lunarArrivalMesh);

    // Dedicated Mars Destination Arrival Mesh (visible during Mars transfer in Space Launch mode)
    const marsArrivalGeo = new THREE.SphereGeometry(26, 32, 32);
    const marsArrivalMat = new THREE.MeshStandardMaterial({
      map: createMarsTexture(),
      roughness: 0.85,
      metalness: 0.1,
    });
    this.marsArrivalMesh = new THREE.Mesh(marsArrivalGeo, marsArrivalMat);
    this.marsArrivalMesh.position.set(130, 50, -160);
    this.marsArrivalMesh.visible = false;
    this.launchPadGroup.add(this.marsArrivalMesh);

    // Pad floodlights
    const padLight1 = new THREE.SpotLight(0xffffff, 4, 60, Math.PI / 4, 0.4);
    padLight1.position.set(15, 18, 15);
    padLight1.target.position.set(0, 8, 0);
    this.launchPadGroup.add(padLight1);
    this.launchPadGroup.add(padLight1.target);

    // Rocket Stack
    this.rocketMesh = new THREE.Group();
    this.rocketMesh.position.set(0, 3, 0);

    // First stage booster
    const stage1Geo = new THREE.CylinderGeometry(1.4, 1.4, 12, 32);
    const rocketBodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.3,
      metalness: 0.2,
    });
    const stage1Mesh = new THREE.Mesh(stage1Geo, rocketBodyMat);
    stage1Mesh.position.y = 6;
    this.rocketMesh.add(stage1Mesh);

    // Core interstage stripe
    const stripeGeo = new THREE.CylinderGeometry(1.42, 1.42, 0.8, 32);
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
    const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
    stripeMesh.position.y = 11.5;
    this.rocketMesh.add(stripeMesh);

    // Second stage
    const stage2Geo = new THREE.CylinderGeometry(1.25, 1.25, 5, 32);
    const stage2Mesh = new THREE.Mesh(stage2Geo, rocketBodyMat);
    stage2Mesh.position.y = 14.5;
    this.rocketMesh.add(stage2Mesh);

    // Orion / Crew Capsule conical nose cone
    const capsuleGeo = new THREE.ConeGeometry(1.3, 3, 32);
    const capsuleMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.5,
      roughness: 0.3,
    });
    const capsuleMesh = new THREE.Mesh(capsuleGeo, capsuleMat);
    capsuleMesh.position.y = 18.5;
    this.rocketMesh.add(capsuleMesh);

    // Launch Abort System (LAS) tower spike
    const lasGeo = new THREE.CylinderGeometry(0.08, 0.15, 3.5, 16);
    const lasMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const lasMesh = new THREE.Mesh(lasGeo, lasMat);
    lasMesh.position.y = 21.5;
    this.rocketMesh.add(lasMesh);

    // Solid Rocket Boosters (SRBs) on flanks
    const srbGeo = new THREE.CylinderGeometry(0.55, 0.55, 11, 24);
    const srbNoseGeo = new THREE.ConeGeometry(0.55, 1.5, 24);

    // Left SRB
    this.srbLeftMesh = new THREE.Mesh(srbGeo, rocketBodyMat);
    this.srbLeftMesh.position.set(-2, 5.5, 0);
    const leftNose = new THREE.Mesh(srbNoseGeo, rocketBodyMat);
    leftNose.position.set(0, 6.25, 0);
    this.srbLeftMesh.add(leftNose);
    this.rocketMesh.add(this.srbLeftMesh);

    // Right SRB
    this.srbRightMesh = new THREE.Mesh(srbGeo, rocketBodyMat);
    this.srbRightMesh.position.set(2, 5.5, 0);
    const rightNose = new THREE.Mesh(srbNoseGeo, rocketBodyMat);
    rightNose.position.set(0, 6.25, 0);
    this.srbRightMesh.add(rightNose);
    this.rocketMesh.add(this.srbRightMesh);

    // Engine nozzles
    const nozzleGeo = new THREE.CylinderGeometry(0.4, 0.7, 1.2, 16);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const nozzleMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzleMesh.position.y = -0.6;
    this.rocketMesh.add(nozzleMesh);

    // Engine ignition point light
    this.rocketIgnitionLight = new THREE.PointLight(0xf97316, 0, 50, 1.5);
    this.rocketIgnitionLight.position.set(0, -1, 0);
    this.rocketMesh.add(this.rocketIgnitionLight);

    // Exhaust particle system
    const exhaustCount = 450;
    this.exhaustGeometry = new THREE.BufferGeometry();
    const exhaustPositions = new Float32Array(exhaustCount * 3);
    const exhaustColors = new Float32Array(exhaustCount * 3);

    for (let i = 0; i < exhaustCount; i++) {
      exhaustPositions[i * 3] = (Math.random() - 0.5) * 1.5;
      exhaustPositions[i * 3 + 1] = -Math.random() * 8;
      exhaustPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;

      exhaustColors[i * 3] = 1.0;
      exhaustColors[i * 3 + 1] = 0.5 + Math.random() * 0.4;
      exhaustColors[i * 3 + 2] = 0.1;
    }

    this.exhaustGeometry.setAttribute('position', new THREE.BufferAttribute(exhaustPositions, 3));
    this.exhaustGeometry.setAttribute('color', new THREE.BufferAttribute(exhaustColors, 3));

    const exhaustMat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.exhaustParticles = new THREE.Points(this.exhaustGeometry, exhaustMat);
    this.rocketMesh.add(this.exhaustParticles);

    this.launchPadGroup.add(this.rocketMesh);
  }

  private setupInteractionListeners(): void {
    const dom = this.renderer.domElement;
    let pointerDownPos = { x: 0, y: 0 };
    let isDragMove = false;

    dom.addEventListener('pointerdown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      pointerDownPos = { x: e.clientX, y: e.clientY };
      isDragMove = false;
    });

    window.addEventListener('pointermove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      if (Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y) > 5) {
        isDragMove = true;
      }

      this.sphericalCoords.theta -= deltaX * 0.006;
      this.sphericalCoords.phi = Math.max(
        0.1,
        Math.min(Math.PI - 0.1, this.sphericalCoords.phi - deltaY * 0.006)
      );

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      this.updateCameraFromSpherical();
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    dom.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY * 0.02;
        const minRadius = this.currentViewMode === 'launch-simulator' ? 6 : 4;
        const maxRadius = this.currentViewMode === 'launch-simulator' ? 120 : 350;
        this.sphericalCoords.radius = Math.max(minRadius, Math.min(maxRadius, this.sphericalCoords.radius + zoomDelta));
        this.updateCameraFromSpherical();
      },
      { passive: false }
    );

    dom.addEventListener('click', (e) => {
      // If user was dragging/orbiting the camera, do not trigger raycast click!
      if (isDragMove) return;
      if (this.currentViewMode === 'launch-simulator') return;

      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const meshesToTest = Array.from(this.planetMeshes.values());
      const intersects = this.raycaster.intersectObjects(meshesToTest, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;
        const id = hit.userData.id as PlanetId;
        if (id) {
          this.focusOnPlanet(id);
          this.callbacks.onPlanetSelect?.(id);
        }
      }
    });

    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private updateCameraFromSpherical(): void {
    if (this.isTransitioningCamera) return;

    // In launch-simulator mode, always anchor camera look-at strictly to the rocket
    if (this.currentViewMode === 'launch-simulator') {
      const basePadX = 1000;
      const rocketPos = this.rocketMesh ? this.rocketMesh.position : new THREE.Vector3(0, 3, 0);
      this.cameraLookAtTarget.set(basePadX + rocketPos.x, rocketPos.y + 4, rocketPos.z);
    }

    const r = this.sphericalCoords.radius;
    const theta = this.sphericalCoords.theta;
    const phi = this.sphericalCoords.phi;

    const x = r * Math.sin(phi) * Math.sin(theta);
    const y = r * Math.cos(phi);
    const z = r * Math.sin(phi) * Math.cos(theta);

    this.camera.position.set(
      this.cameraLookAtTarget.x + x,
      this.cameraLookAtTarget.y + y,
      this.cameraLookAtTarget.z + z
    );
    this.camera.lookAt(this.cameraLookAtTarget);
  }

  public focusOnPlanet(planetId: PlanetId): void {
    this.targetPlanetId = planetId;
    const mesh = this.planetMeshes.get(planetId);
    if (!mesh) return;

    this.callbacks.onCameraMoveStart?.();
    this.isTransitioningCamera = true;

    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    this.cameraLookAtTarget.copy(worldPos);

    let offsetDistance = 14;
    if (planetId === 'sun') offsetDistance = 32;
    else if (planetId === 'earth') offsetDistance = 8.5;
    else if (planetId === 'moon') offsetDistance = 4.2;
    else if (planetId === 'mars') offsetDistance = 6.5;
    else if (planetId === 'jupiter') offsetDistance = 18;
    else if (planetId === 'saturn') offsetDistance = 17;
    else if (planetId === 'mercury') offsetDistance = 4.8;
    else if (planetId === 'venus') offsetDistance = 6.8;

    this.sphericalCoords.radius = offsetDistance;
    this.sphericalCoords.theta = 0.4;
    this.sphericalCoords.phi = Math.PI / 2.3;

    this.cameraTargetPosition.set(
      worldPos.x + offsetDistance * 0.7,
      worldPos.y + offsetDistance * 0.35,
      worldPos.z + offsetDistance * 0.8
    );
  }

  public setViewMode(mode: ViewMode): void {
    this.currentViewMode = mode;

    if (mode === 'launch-simulator') {
      // In Space Launch mode, keep solar system hidden while on pad so the Sun doesn't float next to Pad 39B
      this.isTransitioningCamera = false;
      this.solarSystemGroup.visible = false;
      this.launchPadGroup.visible = true;

      // Anchor camera strictly to Pad 39B
      if (this.launchProgress <= 0.05) {
        this.launchCameraAngle = 'pad';
        this.camera.position.set(1018, 4, 18);
        this.camera.lookAt(1000, 7, 0);
      }
      this.setLaunchProgress(this.launchProgress, this.launchTarget);
      this.updateLaunchCamera(this.launchProgress);
    } else {
      this.autoLaunchActive = false;
      this.callbacks.onAutoLaunchStateChange?.(false);
      this.launchPadGroup.visible = false;
      this.solarSystemGroup.visible = true;

      if (mode === 'moon') {
        this.focusOnPlanet('moon');
      } else if (mode === 'mars') {
        this.focusOnPlanet('mars');
      } else if (mode === 'mission-control') {
        this.focusOnPlanet('earth');
      } else if (mode === 'solar-system') {
        this.cameraLookAtTarget.set(0, 0, 0);
        this.cameraTargetPosition.set(0, 75, 120);
        this.sphericalCoords.radius = 130;
        this.sphericalCoords.theta = 0.2;
        this.sphericalCoords.phi = Math.PI / 3;
        this.isTransitioningCamera = true;
      }
    }
  }

  public setLaunchTarget(target: LaunchTarget): void {
    this.launchTarget = target;
    this.setLaunchProgress(this.launchProgress, target);
  }

  /**
   * Resets flight completely back to Pad 39B Standby posture.
   */
  public resetFlightToPad(): void {
    this.autoLaunchActive = false;
    this.callbacks.onAutoLaunchStateChange?.(false);
    this.launchCameraAngle = 'pad';
    this.sphericalCoords.radius = 28;
    this.sphericalCoords.theta = 0.8;
    this.sphericalCoords.phi = Math.PI / 2.4;
    this.solarSystemGroup.visible = false;
    this.launchPadGroup.visible = true;
    this.setLaunchProgress(0, this.launchTarget);
    this.updateLaunchCamera(0);
    this.camera.position.set(1018, 4, 18);
    this.camera.lookAt(1000, 7, 0);
  }

  /**
   * Set and scrub launch progression (0.0 to 1.0)
   */
  public setLaunchProgress(progress: number, target: LaunchTarget = this.launchTarget): void {
    this.launchProgress = Math.max(0, Math.min(1, progress));
    this.launchTarget = target;

    const p = this.launchProgress;

    // 1. Stage calculation & Telemetry metrics
    let phase: MissionPhase = 'STANDBY';
    let altitudeKm = 0;
    let velocityKmh = 0;

    if (p <= 0.02) {
      phase = 'STANDBY';
      altitudeKm = 0;
      velocityKmh = 0;
    } else if (p <= 0.08) {
      phase = 'IGNITION';
      altitudeKm = 0.1;
      velocityKmh = 25;
    } else if (p <= 0.25) {
      phase = 'LIFTOFF';
      altitudeKm = Math.round(p * 60);
      velocityKmh = Math.round(p * 2200);
    } else if (p <= 0.50) {
      phase = 'ASCENT';
      altitudeKm = Math.round(15 + (p - 0.25) * 280);
      velocityKmh = Math.round(550 + (p - 0.25) * 22000);
    } else if (p <= 0.65) {
      phase = 'MAX_Q';
      altitudeKm = Math.round(85 + (p - 0.50) * 350);
      velocityKmh = Math.round(6000 + (p - 0.50) * 38000);
    } else if (p <= 0.75) {
      phase = 'STAGE_SEPARATION';
      altitudeKm = Math.round(140 + (p - 0.65) * 500);
      velocityKmh = Math.round(12000 + (p - 0.65) * 22000);
    } else if (p < 0.98) {
      if (target === 'earth_orbit') {
        phase = 'ORBIT_INSERTION';
        altitudeKm = Math.round(220 + (p - 0.75) * 180);
        velocityKmh = 27600;
      } else {
        phase = 'TRANSIT_FLIGHT';
        altitudeKm = target === 'lunar_transit'
          ? Math.round(400 + (p - 0.75) * 1530000)
          : Math.round(400 + (p - 0.75) * 225000000);
        velocityKmh = target === 'lunar_transit' ? 39000 : 58000;
      }
    } else {
      phase = 'DESTINATION_ARRIVED';
      if (target === 'earth_orbit') {
        altitudeKm = 408;
        velocityKmh = 27600;
      } else if (target === 'lunar_transit') {
        altitudeKm = 100;
        velocityKmh = 5800;
      } else {
        altitudeKm = 250;
        velocityKmh = 14500;
      }
    }

    this.simulatedAltitudeKm = altitudeKm;
    this.simulatedVelocityKmh = velocityKmh;
    this.missionPhase = phase;

    // 2. Physical Rocket Kinematics & Transformation
    if (this.rocketMesh) {
      if (p <= 0.65) {
        // Climbing from launch pad
        const climbY = 3 + Math.pow(p / 0.65, 1.8) * 110;
        this.rocketMesh.position.set(0, climbY, 0);

        // Aerodynamic Gravity Turn
        const pitchAngle = Math.min(Math.PI / 2.2, Math.pow(p / 0.65, 2) * (Math.PI / 2.3));
        this.rocketMesh.rotation.set(pitchAngle, 0, 0);

        // SRB Boosters
        if (this.srbLeftMesh && this.srbRightMesh) {
          if (p > 0.55) {
            const sepDist = (p - 0.55) * 35;
            this.srbLeftMesh.position.set(-2 - sepDist, 5.5 - sepDist * 0.4, 0);
            this.srbRightMesh.position.set(2 + sepDist, 5.5 - sepDist * 0.4, 0);
            this.srbLeftMesh.rotation.z = -sepDist * 0.1;
            this.srbRightMesh.rotation.z = sepDist * 0.1;
          } else {
            this.srbLeftMesh.position.set(-2, 5.5, 0);
            this.srbRightMesh.position.set(2, 5.5, 0);
            this.srbLeftMesh.rotation.set(0, 0, 0);
            this.srbRightMesh.rotation.set(0, 0, 0);
          }
        }
      } else {
        // Orbit and Deep Space Transit: smooth trajectory with safe destination stopping
        const transitT = (p - 0.65) / 0.35; // 0 to 1

        if (target === 'earth_orbit') {
          const orbitAngle = transitT * Math.PI * 1.5;
          const radius = 60;
          this.rocketMesh.position.set(
            Math.cos(orbitAngle) * radius,
            120 + Math.sin(orbitAngle) * 15,
            Math.sin(orbitAngle) * radius
          );
          this.rocketMesh.rotation.set(Math.PI / 2, 0, -orbitAngle);
        } else if (target === 'lunar_transit') {
          const startPos = new THREE.Vector3(0, 120, 0);
          const endPos = new THREE.Vector3(-85, 80, -95); // Settles directly at lunar arrival mesh
          const currentPos = new THREE.Vector3().lerpVectors(startPos, endPos, Math.min(1, transitT));
          this.rocketMesh.position.copy(currentPos);
          this.rocketMesh.rotation.set(0.6, 0.4, 0);
        } else if (target === 'mars_transfer') {
          const startPos = new THREE.Vector3(0, 120, 0);
          const endPos = new THREE.Vector3(105, 45, -135); // Settles directly at Mars arrival mesh
          const currentPos = new THREE.Vector3().lerpVectors(startPos, endPos, Math.min(1, transitT));
          this.rocketMesh.position.copy(currentPos);
          this.rocketMesh.rotation.set(0.4, -0.6, 0.2);
        }
      }
    }

    // 3. Environmental Atmosphere & Destination Mesh visibility
    if (this.padSkyMat) {
      if (p < 0.15) {
        this.padSkyMat.opacity = 1.0;
      } else if (p <= 0.55) {
        this.padSkyMat.opacity = 1.0 - (p - 0.15) / 0.40;
      } else {
        this.padSkyMat.opacity = 0;
      }
    }

    if (this.curvedEarthMesh) {
      const mat = this.curvedEarthMesh.material as THREE.MeshStandardMaterial;
      if (p < 0.2) {
        mat.opacity = 0;
      } else if (p <= 0.6) {
        mat.opacity = (p - 0.2) / 0.4;
      } else {
        mat.opacity = 1;
      }
    }

    if (this.lunarArrivalMesh) {
      this.lunarArrivalMesh.visible = (target === 'lunar_transit' && p >= 0.55);
    }
    if (this.marsArrivalMesh) {
      this.marsArrivalMesh.visible = (target === 'mars_transfer' && p >= 0.55);
    }

    // Engine ignition & exhaust effects
    const isEngineBurning = p > 0.03 && p < 0.95;
    if (this.rocketIgnitionLight) {
      this.rocketIgnitionLight.intensity = isEngineBurning ? (p < 0.65 ? 16 : 8) : 0;
    }
    if (this.exhaustParticles) {
      (this.exhaustParticles.material as THREE.PointsMaterial).opacity = isEngineBurning ? (p < 0.65 ? 1.0 : 0.6) : 0;
    }

    // 4. Camera Tracking (Always locked to the rocket)
    this.updateLaunchCamera(p);

    // 5. Notify React component callbacks
    this.callbacks.onLaunchProgressUpdate?.(p, altitudeKm, velocityKmh, phase);
  }

  private updateLaunchCamera(p: number): void {
    if (this.currentViewMode !== 'launch-simulator' || this.launchCameraAngle === 'free') return;

    const basePadX = 1000;
    const rocketPos = this.rocketMesh ? this.rocketMesh.position : new THREE.Vector3(0, 3, 0);
    const targetLookAt = new THREE.Vector3(basePadX + rocketPos.x, rocketPos.y + 4, rocketPos.z);
    this.cameraLookAtTarget.copy(targetLookAt);

    if (this.launchCameraAngle === 'pad') {
      if (p <= 0.25) {
        this.camera.position.set(basePadX + 18, 4, 18);
      } else if (p <= 0.65) {
        this.camera.position.set(basePadX + 35, rocketPos.y * 0.4 + 6, 35);
      } else {
        this.camera.position.set(basePadX + rocketPos.x + 25, rocketPos.y + 12, rocketPos.z + 35);
      }
      this.camera.lookAt(targetLookAt);
    } else if (this.launchCameraAngle === 'tower') {
      if (p <= 0.25) {
        this.camera.position.set(basePadX - 8, 22, 5);
      } else {
        this.camera.position.set(basePadX - 12, rocketPos.y * 0.6 + 18, 12);
      }
      this.camera.lookAt(targetLookAt);
    } else if (this.launchCameraAngle === 'ascent') {
      this.camera.position.set(
        basePadX + rocketPos.x - 8,
        Math.max(2, rocketPos.y - 12),
        rocketPos.z - 14
      );
      this.camera.lookAt(targetLookAt);
    } else if (this.launchCameraAngle === 'orbital') {
      if (p < 0.5) {
        this.camera.position.set(basePadX + 50, 45, 60);
      } else {
        this.camera.position.set(
          basePadX + rocketPos.x + 40,
          rocketPos.y + 30,
          rocketPos.z + 55
        );
      }
      this.camera.lookAt(targetLookAt);
    } else if (this.launchCameraAngle === 'spacecraft') {
      this.camera.position.set(
        basePadX + rocketPos.x + 9,
        rocketPos.y + 5,
        rocketPos.z + 9
      );
      this.camera.lookAt(targetLookAt);
    }
  }

  public setAutoLaunch(active: boolean, durationSec = 6.8): void {
    this.autoLaunchActive = active;
    this.autoLaunchDurationSec = durationSec;
    this.callbacks.onAutoLaunchStateChange?.(active);
  }

  public setLaunchCameraMode(mode: 'pad' | 'tower' | 'ascent' | 'orbital' | 'spacecraft' | 'free'): void {
    this.launchCameraAngle = mode;
    this.updateLaunchCamera(this.launchProgress);
  }

  public setQuality(quality: GraphicsQuality): void {
    this.quality = quality;
    this.setupStarfield();
    if (this.renderer) {
      this.renderer.setPixelRatio(quality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
    }
  }

  public setOrbitSpeed(speedMultiplier: number): void {
    this.orbitSpeedMultiplier = speedMultiplier;
  }

  public togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  public resetCamera(): void {
    if (this.currentViewMode === 'launch-simulator') {
      this.launchCameraAngle = 'pad';
      this.updateLaunchCamera(this.launchProgress);
    } else {
      this.focusOnPlanet(this.targetPlanetId);
    }
  }

  public zoomIn(): void {
    this.sphericalCoords.radius = Math.max(3, this.sphericalCoords.radius * 0.8);
    this.updateCameraFromSpherical();
  }

  public zoomOut(): void {
    this.sphericalCoords.radius = Math.min(300, this.sphericalCoords.radius * 1.25);
    this.updateCameraFromSpherical();
  }

  private startLoop(): void {
    const clock = new THREE.Clock();

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // 1. Orbital dynamics & planetary rotations
      if (!this.isPaused) {
        const speed = delta * this.orbitSpeedMultiplier;

        if (this.earthCloudsMesh) {
          this.earthCloudsMesh.rotation.y += speed * 0.08;
        }

        this.planetMeshes.forEach((mesh, id) => {
          mesh.rotation.y += speed * 0.15;

          if (id !== 'sun' && id !== 'moon' && mesh.userData.dist) {
            const currentDist = mesh.userData.dist;
            const orbitVelocity = mesh.userData.speed * this.orbitSpeedMultiplier;
            const currentAngle = Math.atan2(mesh.position.z, mesh.position.x) + orbitVelocity * delta * 4;

            mesh.position.x = Math.cos(currentAngle) * currentDist;
            mesh.position.z = Math.sin(currentAngle) * currentDist;
          }
        });

        if (this.moonGroup) {
          this.moonGroup.rotation.y += speed * 0.35;
        }

        if (this.lunarArrivalMesh) {
          this.lunarArrivalMesh.rotation.y += speed * 0.1;
        }
        if (this.marsArrivalMesh) {
          this.marsArrivalMesh.rotation.y += speed * 0.12;
        }
      }

      // 2. Auto Launch Progression (~6.8 seconds)
      if (this.autoLaunchActive && this.currentViewMode === 'launch-simulator') {
        const nextProgress = this.launchProgress + delta / this.autoLaunchDurationSec;
        if (nextProgress >= 1.0) {
          this.autoLaunchActive = false;
          this.callbacks.onAutoLaunchStateChange?.(false);
          this.setLaunchProgress(1.0, this.launchTarget);
        } else {
          this.setLaunchProgress(nextProgress, this.launchTarget);
        }
      }

      // 3. Exhaust Particle Animation during active burns
      if (this.exhaustGeometry && (this.launchProgress > 0.03 && this.launchProgress < 0.95)) {
        const posAttr = this.exhaustGeometry.getAttribute('position') as THREE.BufferAttribute;
        const posArr = posAttr.array as Float32Array;
        for (let i = 0; i < posArr.length; i += 3) {
          posArr[i + 1] -= delta * 32;
          if (posArr[i + 1] < -12) {
            posArr[i + 1] = 0;
            posArr[i] = (Math.random() - 0.5) * 1.5;
            posArr[i + 2] = (Math.random() - 0.5) * 1.5;
          }
        }
        posAttr.needsUpdate = true;
      }

      // 4. Smooth Camera Lerp for Celestial Focus Transitions
      if (this.isTransitioningCamera) {
        this.camera.position.lerp(this.cameraTargetPosition, 0.05);
        this.currentCameraLookAt.lerp(this.cameraLookAtTarget, 0.05);
        this.camera.lookAt(this.currentCameraLookAt);

        if (this.camera.position.distanceTo(this.cameraTargetPosition) < 0.25) {
          this.isTransitioningCamera = false;
          this.callbacks.onCameraMoveEnd?.();
        }
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  public getRocketAltitude(): number {
    return this.simulatedAltitudeKm;
  }

  public getRocketVelocity(): number {
    return this.simulatedVelocityKmh;
  }

  public getLaunchProgress(): number {
    return this.launchProgress;
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.handleResize);

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });

    this.renderer.dispose();
    if (this.container && this.renderer.domElement) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
