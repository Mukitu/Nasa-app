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
  createVenusTexture,
  createSpacecraftTileTexture,
  createSolarPanelTexture,
  createMissionMarkingsTexture,
  createGrassFieldTexture,
  createDaytimeSkyTexture,
  createUltraRealFlameTexture,
  createMachDiskTexture,
  createSteelPlateTexture,
  createHazardStripeTexture,
} from './textures';
import { PlanetId, GraphicsQuality, ViewMode, MissionPhase, LaunchTarget, PlanetData } from '../types/simulation';
import { CELESTIAL_BODIES } from '../data/planets';
import { aerospaceAudio } from '../utils/audio';

export interface SceneCallbacks {
  onPlanetSelect?: (planetId: PlanetId) => void;
  onCameraMoveStart?: () => void;
  onCameraMoveEnd?: () => void;
  onLaunchProgressUpdate?: (progress: number, altitudeKm: number, velocityKmh: number, phase: MissionPhase) => void;
  onAutoLaunchStateChange?: (active: boolean) => void;
  onHoverBody?: (bodyData: PlanetData | null, screenPos: { x: number; y: number } | null) => void;
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
  private rocketCoreLight: THREE.PointLight | null = null;
  private rocketFlameGroup: THREE.Group | null = null;
  private innerFlameMesh: THREE.Mesh | null = null;
  private mainFlameMesh: THREE.Mesh | null = null;
  private outerFlameMesh: THREE.Mesh | null = null;
  private srbFlameLeft: THREE.Mesh | null = null;
  private srbFlameRight: THREE.Mesh | null = null;
  private shockDiamonds: THREE.Mesh[] = [];
  private billowingFireGroup: THREE.Group | null = null;
  private stationPlatformGroup: THREE.Group | null = null;
  private lunarTrajectoryCurve!: THREE.CatmullRomCurve3;
  private marsTrajectoryCurve!: THREE.CatmullRomCurve3;

  // State
  private currentViewMode: ViewMode = 'mission-control';
  private targetPlanetId: PlanetId = 'earth';
  private quality: GraphicsQuality = 'high';
  private orbitSpeedMultiplier: number = 1.0;
  private isPaused: boolean = false;
  private missionPhase: MissionPhase = 'STANDBY';
  private launchTarget: LaunchTarget = null;

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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
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
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 1.8);
    this.scene.add(ambientLight);

    const sunLight = new THREE.PointLight(0xfffbeb, 6.5, 3000, 0.4);
    sunLight.position.set(0, 0, 0);
    this.solarSystemGroup.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.85);
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
    const sunGeo = new THREE.SphereGeometry(7.2, 64, 64);
    const sunTex = createSunTexture();
    const sunMat = new THREE.MeshBasicMaterial({ map: sunTex, color: 0xffffff });
    const sunMesh = new THREE.Mesh(sunGeo, sunMat);
    sunMesh.userData = { id: 'sun', name: 'The Sun (Sol)' };
    this.solarSystemGroup.add(sunMesh);
    this.planetMeshes.set('sun', sunMesh);

    // Sun corona & glowing outer flare
    const coronaGeo = new THREE.SphereGeometry(8.6, 48, 48);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.45,
      side: THREE.BackSide,
    });
    sunMesh.add(new THREE.Mesh(coronaGeo, coronaMat));

    const flareGeo = new THREE.SphereGeometry(10.2, 32, 32);
    const flareMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
    });
    sunMesh.add(new THREE.Mesh(flareGeo, flareMat));

    // Planetary configurations with super vibrant colors
    const planetConfigs = [
      { id: 'mercury' as PlanetId, radius: 0.95, dist: 16, textureFn: createMercuryTexture, tilt: 0.03, emissive: 0x64748b, emissiveIntensity: 0.25 },
      { id: 'venus' as PlanetId, radius: 1.65, dist: 24, textureFn: createVenusTexture, tilt: 3.1, emissive: 0xeab308, emissiveIntensity: 0.35, haloColor: 0xfde047 },
      { id: 'earth' as PlanetId, radius: 2.3, dist: 35, textureFn: createEarthTexture, tilt: 0.41, emissive: 0x0284c7, emissiveIntensity: 0.38, haloColor: 0x38bdf8 },
      { id: 'mars' as PlanetId, radius: 1.35, dist: 48, textureFn: createMarsTexture, tilt: 0.44, emissive: 0xea580c, emissiveIntensity: 0.42, haloColor: 0xf97316 },
      { id: 'jupiter' as PlanetId, radius: 4.9, dist: 68, textureFn: createJupiterTexture, tilt: 0.05, emissive: 0xd97706, emissiveIntensity: 0.35, haloColor: 0xfed7aa },
      { id: 'saturn' as PlanetId, radius: 4.0, dist: 92, textureFn: createSaturnTexture, tilt: 0.47, hasRings: true, emissive: 0xca8a04, emissiveIntensity: 0.35, haloColor: 0xfef08a },
      { id: 'uranus' as PlanetId, radius: 2.7, dist: 118, textureFn: createUranusTexture, tilt: 1.7, emissive: 0x06b6d4, emissiveIntensity: 0.42, haloColor: 0x67e8f9 },
      { id: 'neptune' as PlanetId, radius: 2.6, dist: 142, textureFn: createNeptuneTexture, tilt: 0.49, emissive: 0x2563eb, emissiveIntensity: 0.42, haloColor: 0x60a5fa },
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
        opacity: 0.35,
      });
      this.orbitsGroup.add(new THREE.Line(orbitGeo, orbitMat));

      // Planet Mesh with vibrant emissive luminance
      const geo = new THREE.SphereGeometry(cfg.radius, 64, 64);
      const tex = cfg.textureFn();
      const mat = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 0.5,
        metalness: 0.1,
        emissive: cfg.emissive,
        emissiveIntensity: cfg.emissiveIntensity,
      });
      const planetMesh = new THREE.Mesh(geo, mat);
      planetMesh.rotation.z = cfg.tilt;
      planetMesh.position.set(cfg.dist, 0, 0);
      planetMesh.userData = { id: cfg.id, dist: cfg.dist, speed: 0.015 / Math.sqrt(cfg.dist) };

      // Atmospheric halo
      if (cfg.haloColor) {
        const haloGeo = new THREE.SphereGeometry(cfg.radius * 1.09, 32, 32);
        const haloMat = new THREE.MeshBasicMaterial({
          color: cfg.haloColor,
          transparent: true,
          opacity: 0.3,
          side: THREE.BackSide,
        });
        planetMesh.add(new THREE.Mesh(haloGeo, haloMat));
      }

      this.solarSystemGroup.add(planetMesh);
      this.planetMeshes.set(cfg.id, planetMesh);

      // Earth specifics: Atmosphere Glow, Dynamic Clouds, Moon & Artificial Satellites
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

        // The Moon (Luna)
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

        // Moon orbit line
        this.createOrbitLine(this.moonGroup, 6.2, 0x94a3b8);

        // International Space Station (ISS)
        const issGroup = this.createSpacecraftMesh('iss', 'International Space Station (ISS)', 0x38bdf8, 'station');
        issGroup.position.set(3.8, 0.2, 1.2);
        planetMesh.add(issGroup);
        this.planetMeshes.set('iss', issGroup as unknown as THREE.Mesh);

        // Hubble Space Telescope
        const hubbleGroup = this.createSpacecraftMesh('hubble', 'Hubble Space Telescope', 0x60a5fa, 'telescope');
        hubbleGroup.position.set(-4.5, 0.3, -2.1);
        planetMesh.add(hubbleGroup);
        this.planetMeshes.set('hubble', hubbleGroup as unknown as THREE.Mesh);

        // James Webb Space Telescope (Sun-Earth L2)
        const jwstGroup = this.createSpacecraftMesh('jwst', 'James Webb Space Telescope', 0xf59e0b, 'jwst');
        jwstGroup.position.set(9.5, 0.8, -1.5);
        planetMesh.add(jwstGroup);
        this.planetMeshes.set('jwst', jwstGroup as unknown as THREE.Mesh);
      }

      // Mars specifics (Moons: Phobos & Deimos, Satellite: MRO)
      if (cfg.id === 'mars') {
        const marsAtmoGeo = new THREE.SphereGeometry(cfg.radius * 1.04, 24, 24);
        const marsAtmoMat = new THREE.MeshBasicMaterial({
          color: 0xf97316,
          transparent: true,
          opacity: 0.14,
          side: THREE.BackSide,
        });
        planetMesh.add(new THREE.Mesh(marsAtmoGeo, marsAtmoMat));

        // Phobos
        const phobosMesh = this.createMoonMesh('phobos', 'Phobos', 0xa1a1aa, 0.25);
        phobosMesh.position.set(2.8, 0.2, 0.8);
        planetMesh.add(phobosMesh);
        this.planetMeshes.set('phobos', phobosMesh);

        // Deimos
        const deimosMesh = this.createMoonMesh('deimos', 'Deimos', 0x71717a, 0.18);
        deimosMesh.position.set(-4.2, 0.3, -1.8);
        planetMesh.add(deimosMesh);
        this.planetMeshes.set('deimos', deimosMesh);

        // Mars Reconnaissance Orbiter (MRO)
        const mroGroup = this.createSpacecraftMesh('mro', 'Mars Reconnaissance Orbiter', 0xf97316, 'satellite');
        mroGroup.position.set(3.3, -0.2, -2.2);
        planetMesh.add(mroGroup);
        this.planetMeshes.set('mro', mroGroup as unknown as THREE.Mesh);
      }

      // Jupiter specifics (Galilean Moons & Juno Probe)
      if (cfg.id === 'jupiter') {
        // Io
        const ioMesh = this.createMoonMesh('io', 'Io (Galilean Moon)', 0xfacc15, 0.55);
        ioMesh.position.set(8.2, 0.5, 2.0);
        planetMesh.add(ioMesh);
        this.planetMeshes.set('io', ioMesh);

        // Europa
        const europaMesh = this.createMoonMesh('europa', 'Europa (Icy Moon)', 0xe0f2fe, 0.5);
        europaMesh.position.set(-10.8, -0.3, 4.5);
        planetMesh.add(europaMesh);
        this.planetMeshes.set('europa', europaMesh);

        // Ganymede
        const ganymedeMesh = this.createMoonMesh('ganymede', 'Ganymede (Largest Moon)', 0x94a3b8, 0.72);
        ganymedeMesh.position.set(14.0, 0.8, -6.2);
        planetMesh.add(ganymedeMesh);
        this.planetMeshes.set('ganymede', ganymedeMesh);

        // Callisto
        const callistoMesh = this.createMoonMesh('callisto', 'Callisto (Cratered Moon)', 0x64748b, 0.68);
        callistoMesh.position.set(-17.5, -0.6, -9.0);
        planetMesh.add(callistoMesh);
        this.planetMeshes.set('callisto', callistoMesh);

        // Juno Spacecraft
        const junoGroup = this.createSpacecraftMesh('juno', 'Juno Spacecraft', 0xfbbf24, 'juno');
        junoGroup.position.set(9.8, 2.2, -3.5);
        planetMesh.add(junoGroup);
        this.planetMeshes.set('juno', junoGroup as unknown as THREE.Mesh);
      }

      // Saturn specifics (Rings, Titan, Enceladus, Cassini)
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

        // Titan
        const titanMesh = this.createMoonMesh('titan', 'Titan (Atmospheric Moon)', 0xf59e0b, 0.75);
        titanMesh.position.set(11.8, 0.6, 5.2);
        planetMesh.add(titanMesh);
        this.planetMeshes.set('titan', titanMesh);

        // Enceladus
        const enceladusMesh = this.createMoonMesh('enceladus', 'Enceladus (Geyser Moon)', 0xf8fafc, 0.35);
        enceladusMesh.position.set(-7.2, -0.4, 3.8);
        planetMesh.add(enceladusMesh);
        this.planetMeshes.set('enceladus', enceladusMesh);

        // Cassini
        const cassiniGroup = this.createSpacecraftMesh('cassini', 'Cassini Orbiter', 0xfef08a, 'satellite');
        cassiniGroup.position.set(9.2, 1.2, -4.5);
        planetMesh.add(cassiniGroup);
        this.planetMeshes.set('cassini', cassiniGroup as unknown as THREE.Mesh);
      }

      // Uranus specifics (Titania)
      if (cfg.id === 'uranus') {
        const titaniaMesh = this.createMoonMesh('titania', 'Titania', 0x67e8f9, 0.45);
        titaniaMesh.position.set(6.8, 0.5, 2.5);
        planetMesh.add(titaniaMesh);
        this.planetMeshes.set('titania', titaniaMesh);
      }

      // Neptune specifics (Triton)
      if (cfg.id === 'neptune') {
        const tritonMesh = this.createMoonMesh('triton', 'Triton (Retrograde Moon)', 0xc084fc, 0.52);
        tritonMesh.position.set(-6.5, -0.4, -3.2);
        planetMesh.add(tritonMesh);
        this.planetMeshes.set('triton', tritonMesh);
      }
    });

    // Deep Space Voyager 1 Probe
    const voyagerGroup = this.createSpacecraftMesh('voyager1', 'Voyager 1 Interstellar Probe', 0x38bdf8, 'voyager');
    voyagerGroup.position.set(190, 35, -100);
    this.solarSystemGroup.add(voyagerGroup);
    this.planetMeshes.set('voyager1', voyagerGroup as unknown as THREE.Mesh);
  }

  /** Helper to build 3D Moon meshes */
  private createMoonMesh(id: string, name: string, colorHex: number, radius: number): THREE.Mesh {
    const geo = new THREE.SphereGeometry(radius, 24, 24);
    const mat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.8,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData = { id, name };
    return mesh;
  }

  /** Helper to build 3D Orbit line */
  private createOrbitLine(group: THREE.Group, radius: number, colorHex: number): void {
    const geo = new THREE.BufferGeometry();
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 64; i++) {
      const a = (i / 64) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    geo.setFromPoints(pts);
    group.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: colorHex, transparent: true, opacity: 0.25 })));
  }

  /** Helper to build 3D Spacecraft / Satellite procedural models */
  private createSpacecraftMesh(
    id: string,
    name: string,
    colorHex: number,
    type: 'station' | 'telescope' | 'jwst' | 'satellite' | 'juno' | 'voyager'
  ): THREE.Group {
    const group = new THREE.Group();
    group.userData = { id, name };

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const solarMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, metalness: 0.6, roughness: 0.3 });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });

    if (type === 'station') {
      // ISS central truss & solar panels
      const truss = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8), bodyMat);
      truss.rotateZ(Math.PI / 2);
      group.add(truss);

      const panel1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.4), solarMat);
      panel1.position.set(-0.8, 0, 0);
      group.add(panel1);

      const panel2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.02, 0.4), solarMat);
      panel2.position.set(0.8, 0, 0);
      group.add(panel2);
    } else if (type === 'jwst') {
      // JWST gold hexagon shield
      const shield = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.05, 6), goldMat);
      shield.rotateX(Math.PI / 3);
      group.add(shield);
    } else if (type === 'telescope') {
      // Hubble cylinder
      const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16), bodyMat);
      group.add(bus);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.02, 0.25), solarMat);
      group.add(wing);
    } else {
      // Probe with radio dish antenna
      const bus = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.35), bodyMat);
      group.add(bus);
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.05, 0.1, 16), goldMat);
      dish.position.set(0, 0.25, 0);
      group.add(dish);
      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.02, 0.2), solarMat);
      group.add(wing);
    }

    return group;
  }

  /** Helper to build photorealistic organic 3D trees & shrubs for Earth spaceport landscape */
  private create3DTreeMesh(type: 'deciduous' | 'conifer' | 'shrub' = 'deciduous'): THREE.Group {
    const treeGroup = new THREE.Group();

    if (type === 'shrub') {
      // Low Coastal Bush / Shrub Cluster
      const bushMat = new THREE.MeshStandardMaterial({
        color: 0x385328,
        roughness: 0.85,
        metalness: 0.05,
      });
      const clusterCount = 3 + Math.floor(Math.random() * 3);
      for (let i = 0; i < clusterCount; i++) {
        const r = 1.0 + Math.random() * 1.2;
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 1), bushMat);
        bush.position.set(
          (Math.random() - 0.5) * 1.8,
          r * 0.6,
          (Math.random() - 0.5) * 1.8
        );
        treeGroup.add(bush);
      }
      return treeGroup;
    }

    // Wood Trunk for Trees
    const trunkGeo = new THREE.CylinderGeometry(0.35, 0.65, 4.2, 8);
    const trunkMat = new THREE.MeshStandardMaterial({
      color: 0x2b1d14,
      roughness: 0.95,
      metalness: 0.05,
    });
    const trunkMesh = new THREE.Mesh(trunkGeo, trunkMat);
    trunkMesh.position.y = 2.1;
    treeGroup.add(trunkMesh);

    if (type === 'conifer') {
      // Photorealistic Layered Pine / Fir Tree
      const pineColors = [0x1e381b, 0x294827, 0x1b3218];
      const layers = 4;
      for (let l = 0; l < layers; l++) {
        const mat = new THREE.MeshStandardMaterial({
          color: pineColors[l % pineColors.length],
          roughness: 0.8,
        });
        const radius = 2.6 - l * 0.5;
        const height = 3.6 - l * 0.4;
        const cone = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 8), mat);
        cone.position.y = 3.8 + l * 1.6;
        treeGroup.add(cone);
      }
    } else {
      // Photorealistic Spreading Deciduous Oak Tree
      const leafMat1 = new THREE.MeshStandardMaterial({ color: 0x2d4822, roughness: 0.8 });
      const leafMat2 = new THREE.MeshStandardMaterial({ color: 0x3d5f30, roughness: 0.82 });
      const leafMat3 = new THREE.MeshStandardMaterial({ color: 0x233a1a, roughness: 0.88 });

      const clusters = [
        { size: 2.5, pos: [0, 4.8, 0], mat: leafMat1 },
        { size: 1.9, pos: [1.2, 5.4, 0.9], mat: leafMat2 },
        { size: 1.8, pos: [-1.1, 5.2, -0.8], mat: leafMat3 },
        { size: 1.7, pos: [0.2, 6.4, -0.3], mat: leafMat2 },
        { size: 1.5, pos: [-0.8, 5.8, 1.1], mat: leafMat1 },
      ];

      clusters.forEach((c) => {
        const mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(c.size, 1), c.mat);
        mesh.position.set(c.pos[0], c.pos[1], c.pos[2]);
        treeGroup.add(mesh);
      });
    }

    return treeGroup;
  }

  private createStationPlatformAndRailings(): THREE.Group {
    const stationGroup = new THREE.Group();
    // Positioned alongside launch pad apron and service road
    stationGroup.position.set(18, 0, 16);

    const steelTex = createSteelPlateTexture();
    const hazardTex = createHazardStripeTexture();

    // 1. Concrete Base Platform Foundation
    const platformWidth = 14;
    const platformDepth = 7;
    const platformHeight = 1.8;

    const baseGeo = new THREE.BoxGeometry(platformWidth, platformHeight, platformDepth);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.7,
      metalness: 0.3,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = platformHeight / 2;
    stationGroup.add(baseMesh);

    // Hazard stripe safety border on platform edge
    const borderGeo = new THREE.BoxGeometry(platformWidth + 0.2, 0.3, platformDepth + 0.2);
    const borderMat = new THREE.MeshStandardMaterial({
      map: hazardTex,
      roughness: 0.5,
      metalness: 0.2,
    });
    const borderMesh = new THREE.Mesh(borderGeo, borderMat);
    borderMesh.position.y = platformHeight + 0.15;
    stationGroup.add(borderMesh);

    // 2. Diamond Steel Treadplate Deck Surface
    const deckGeo = new THREE.BoxGeometry(platformWidth - 0.2, 0.1, platformDepth - 0.2);
    const deckMat = new THREE.MeshStandardMaterial({
      map: steelTex,
      roughness: 0.35,
      metalness: 0.8,
    });
    const deckMesh = new THREE.Mesh(deckGeo, deckMat);
    deckMesh.position.y = platformHeight + 0.35;
    stationGroup.add(deckMesh);

    // 3. Metallic Safety Railings & Handrails ("সাইডে দাঁড়ায় থাকার জন্য যে সাইডে দেয়")
    const railingGroup = new THREE.Group();
    const railMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      roughness: 0.2,
      metalness: 0.9,
    });

    const postHeight = 1.25;
    const postRadius = 0.05;
    const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16);

    // Guardrail posts around platform perimeter
    const postPositions: { x: number; z: number }[] = [];
    const halfW = platformWidth / 2 - 0.3;
    const halfD = platformDepth / 2 - 0.3;

    // Front & Back edges
    for (let x = -halfW; x <= halfW; x += 2.2) {
      postPositions.push({ x, z: halfD });
      postPositions.push({ x, z: -halfD });
    }
    // Left edge
    for (let z = -halfD + 1.8; z < halfD; z += 2.0) {
      postPositions.push({ x: -halfW, z });
    }

    postPositions.forEach((pos) => {
      const post = new THREE.Mesh(postGeo, railMat);
      post.position.set(pos.x, platformHeight + 0.4 + postHeight / 2, pos.z);
      railingGroup.add(post);
    });

    // Horizontal double steel pipe rails (Top Rail & Mid Rail)
    const pipeMat = railMat;
    const pipeRadius = 0.035;

    const frontRailGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, platformWidth - 0.6, 16);
    frontRailGeo.rotateZ(Math.PI / 2);

    const frontRailTop = new THREE.Mesh(frontRailGeo, pipeMat);
    frontRailTop.position.set(0, platformHeight + 0.4 + postHeight * 0.95, halfD);
    railingGroup.add(frontRailTop);

    const frontRailMid = new THREE.Mesh(frontRailGeo, pipeMat);
    frontRailMid.position.set(0, platformHeight + 0.4 + postHeight * 0.5, halfD);
    railingGroup.add(frontRailMid);

    const backRailTop = new THREE.Mesh(frontRailGeo, pipeMat);
    backRailTop.position.set(0, platformHeight + 0.4 + postHeight * 0.95, -halfD);
    railingGroup.add(backRailTop);

    const backRailMid = new THREE.Mesh(frontRailGeo, pipeMat);
    backRailMid.position.set(0, platformHeight + 0.4 + postHeight * 0.5, -halfD);
    railingGroup.add(backRailMid);

    const sideRailGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, platformDepth - 0.6, 16);
    sideRailGeo.rotateX(Math.PI / 2);

    const leftRailTop = new THREE.Mesh(sideRailGeo, pipeMat);
    leftRailTop.position.set(-halfW, platformHeight + 0.4 + postHeight * 0.95, 0);
    railingGroup.add(leftRailTop);

    const leftRailMid = new THREE.Mesh(sideRailGeo, pipeMat);
    leftRailMid.position.set(-halfW, platformHeight + 0.4 + postHeight * 0.5, 0);
    railingGroup.add(leftRailMid);

    stationGroup.add(railingGroup);

    // 4. Steel Access Staircase ("লোকজন ওঠার জন্য একটা লোহার সিঁড়ি")
    const stairsGroup = new THREE.Group();
    stairsGroup.position.set(halfW + 0.2, 0, 0);

    const stepCount = 9;
    const stairHeight = platformHeight + 0.4;
    const stairLength = 4.2;
    const stepWidth = 2.2;
    const stepDepth = stairLength / stepCount;
    const stepRise = stairHeight / stepCount;

    const stepGeo = new THREE.BoxGeometry(stepDepth, 0.08, stepWidth);
    const stepMat = new THREE.MeshStandardMaterial({ map: steelTex, roughness: 0.3, metalness: 0.85 });

    for (let i = 0; i < stepCount; i++) {
      const stepMesh = new THREE.Mesh(stepGeo, stepMat);
      stepMesh.position.set(i * stepDepth, (i + 1) * stepRise, 0);
      stairsGroup.add(stepMesh);
    }

    // Inclined Steel Stair Handrails
    const stairAngle = Math.atan2(stairHeight, stairLength);
    const stairDiagonal = Math.sqrt(stairHeight * stairHeight + stairLength * stairLength);
    const handrailGeo = new THREE.CylinderGeometry(pipeRadius, pipeRadius, stairDiagonal, 16);
    handrailGeo.rotateZ(-stairAngle + Math.PI / 2);

    const stairRailLeft = new THREE.Mesh(handrailGeo, railMat);
    stairRailLeft.position.set(stairLength / 2, stairHeight / 2 + 1.1, stepWidth / 2);
    stairsGroup.add(stairRailLeft);

    const stairRailRight = new THREE.Mesh(handrailGeo, railMat);
    stairRailRight.position.set(stairLength / 2, stairHeight / 2 + 1.1, -stepWidth / 2);
    stairsGroup.add(stairRailRight);

    stationGroup.add(stairsGroup);

    // 5. Industrial Vehicle / Rail Stop Bumper & Side Buffer Barriers ("ট্রেন থামার জন্য সাইডে লোহার একটা ইয়া / স্টপ ব্যারিয়ার")
    const bumperGroup = new THREE.Group();
    bumperGroup.position.set(-halfW - 1.2, 0, 0);

    // Twin Heavy Steel Pillar Columns
    const pillarGeo = new THREE.BoxGeometry(0.8, 2.2, 0.8);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });

    const pillarLeft = new THREE.Mesh(pillarGeo, pillarMat);
    pillarLeft.position.set(0, 1.1, 1.8);
    bumperGroup.add(pillarLeft);

    const pillarRight = new THREE.Mesh(pillarGeo, pillarMat);
    pillarRight.position.set(0, 1.1, -1.8);
    bumperGroup.add(pillarRight);

    // Cross-braced Heavy Stop Beam with Hazard Warning Stripes
    const crossBeamGeo = new THREE.BoxGeometry(0.9, 0.8, 4.2);
    const crossBeamMat = new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.4, metalness: 0.5 });
    const crossBeam = new THREE.Mesh(crossBeamGeo, crossBeamMat);
    crossBeam.position.set(0, 1.2, 0);
    bumperGroup.add(crossBeam);

    // Heavy Hydraulic Bumper Buffer Cylinders
    const cylinderGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.4, 24);
    cylinderGeo.rotateZ(Math.PI / 2);
    const cylinderMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 });

    const bufferLeft = new THREE.Mesh(cylinderGeo, cylinderMat);
    bufferLeft.position.set(-0.7, 1.2, 1.2);
    bumperGroup.add(bufferLeft);

    const bufferRight = new THREE.Mesh(cylinderGeo, cylinderMat);
    bufferRight.position.set(-0.7, 1.2, -1.2);
    bumperGroup.add(bufferRight);

    stationGroup.add(bumperGroup);

    // Overhead Platform Lamp Post
    const floodlightGeo = new THREE.CylinderGeometry(0.06, 0.08, 4.5, 12);
    const floodMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.3 });
    const floodPole = new THREE.Mesh(floodlightGeo, floodMat);
    floodPole.position.set(0, platformHeight + 0.4 + 2.25, 0);
    stationGroup.add(floodPole);

    const lampGeo = new THREE.BoxGeometry(0.8, 0.3, 0.6);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9 });
    const lampMesh = new THREE.Mesh(lampGeo, lampMat);
    lampMesh.position.set(0, platformHeight + 0.4 + 4.5, 0);
    stationGroup.add(lampMesh);

    return stationGroup;
  }

  /**
   * Constructs realistic NASA Steel Umbilical Launch Tower & Crew Boarding Walkway Bridge
   * ("রকেটের সাথে কানেক্টেড স্টিল টাওয়ার ও প্যাসেঞ্জার বোর্ডিং গ্যাংওয়ে বা ক্রু ব্রিজ")
   */
  private createLaunchUmbilicalTowerAndBridge(): THREE.Group {
    const towerGroup = new THREE.Group();
    // Tower stands adjacent to rocket at x = 7.5, z = 0
    towerGroup.position.set(7.5, 0, 0);

    const redSteelMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.35, metalness: 0.75 });
    const whiteSteelMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.8 });
    const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.85 });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45, roughness: 0.1 });

    const towerHeight = 44.0;
    const towerWidth = 3.6;
    const towerDepth = 3.6;

    // 1. Four Heavy Vertical Lattice Steel Legs
    const legRadius = 0.22;
    const legOffsets = [
      { x: -towerWidth / 2, z: -towerDepth / 2 },
      { x: towerWidth / 2, z: -towerDepth / 2 },
      { x: -towerWidth / 2, z: towerDepth / 2 },
      { x: towerWidth / 2, z: towerDepth / 2 },
    ];

    legOffsets.forEach((off) => {
      // Alternating Red and White Aviation Safety Bands
      const sectionCount = 8;
      const sectionH = towerHeight / sectionCount;
      for (let s = 0; s < sectionCount; s++) {
        const mat = s % 2 === 0 ? redSteelMat : whiteSteelMat;
        const legSeg = new THREE.Mesh(new THREE.CylinderGeometry(legRadius, legRadius, sectionH, 12), mat);
        legSeg.position.set(off.x, s * sectionH + sectionH / 2, off.z);
        legSeg.castShadow = true;
        towerGroup.add(legSeg);
      }
    });

    // 2. Horizontal & Diagonal Lattice Truss Cross-Bracing
    const trussRadius = 0.08;
    const levelCount = 11;
    for (let l = 1; l < levelCount; l++) {
      const h = (l / levelCount) * towerHeight;
      const ringMat = l % 2 === 0 ? redSteelMat : whiteSteelMat;

      // Outer Perimeter Horizontal Beams
      const beamGeoX = new THREE.CylinderGeometry(trussRadius, trussRadius, towerWidth, 8);
      beamGeoX.rotateZ(Math.PI / 2);

      const b1 = new THREE.Mesh(beamGeoX, ringMat);
      b1.position.set(0, h, -towerDepth / 2);
      towerGroup.add(b1);

      const b2 = new THREE.Mesh(beamGeoX, ringMat);
      b2.position.set(0, h, towerDepth / 2);
      towerGroup.add(b2);

      const beamGeoZ = new THREE.CylinderGeometry(trussRadius, trussRadius, towerDepth, 8);
      beamGeoZ.rotateX(Math.PI / 2);

      const b3 = new THREE.Mesh(beamGeoZ, ringMat);
      b3.position.set(-towerWidth / 2, h, 0);
      towerGroup.add(b3);

      const b4 = new THREE.Mesh(beamGeoZ, ringMat);
      b4.position.set(towerWidth / 2, h, 0);
      towerGroup.add(b4);
    }

    // 3. Crew Access Arm & Enclosed Boarding Walkway Bridge (Extends from Tower to Rocket Crew Module at y = 28m)
    const bridgeY = 28.0; // Lines up with upper crew hatch level
    const bridgeGroup = new THREE.Group();
    bridgeGroup.position.set(0, bridgeY, 0);

    const bridgeLength = 7.5; // Distance from tower (x=7.5) to rocket (x=0)
    const bridgeGeo = new THREE.BoxGeometry(bridgeLength, 2.2, 1.8);
    const bridgeMesh = new THREE.Mesh(bridgeGeo, whiteSteelMat);
    bridgeMesh.position.set(-bridgeLength / 2, 0, 0);
    bridgeMesh.castShadow = true;
    bridgeGroup.add(bridgeMesh);

    // Enclosed Glass Observation Windows on Crew Walkway Bridge
    const windowGeo = new THREE.BoxGeometry(bridgeLength - 0.4, 0.9, 1.82);
    const windowMesh = new THREE.Mesh(windowGeo, glassMat);
    windowMesh.position.set(-bridgeLength / 2, 0.2, 0);
    bridgeGroup.add(windowMesh);

    // White Room Capsule Chamber at Rocket Hatch Terminal
    const whiteRoomGeo = new THREE.BoxGeometry(2.2, 2.8, 2.4);
    const whiteRoomMesh = new THREE.Mesh(whiteRoomGeo, whiteSteelMat);
    whiteRoomMesh.position.set(-bridgeLength + 0.5, 0, 0);
    whiteRoomMesh.castShadow = true;
    bridgeGroup.add(whiteRoomMesh);

    // Steel Support Strut under Crew Access Arm
    const strutGeo = new THREE.CylinderGeometry(0.12, 0.12, 6.5, 12);
    const strutMesh = new THREE.Mesh(strutGeo, darkSteelMat);
    strutMesh.position.set(-3.2, -2.2, 0);
    strutMesh.rotation.z = -0.55;
    bridgeGroup.add(strutMesh);

    towerGroup.add(bridgeGroup);

    // 4. Lower Stage Umbilical Fuel Swing Arms
    const fuelArm1 = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.4, 0.4), darkSteelMat);
    fuelArm1.position.set(-3.1, 10.0, 0);
    towerGroup.add(fuelArm1);

    const fuelArm2 = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.35, 0.35), darkSteelMat);
    fuelArm2.position.set(-2.9, 18.0, 0);
    towerGroup.add(fuelArm2);

    // 5. Red LED Aviation Beacon Light at top of Launch Tower
    const towerBeaconLight = new THREE.PointLight(0xef4444, 4.0, 45);
    towerBeaconLight.position.set(0, towerHeight + 1.2, 0);
    towerGroup.add(towerBeaconLight);

    const beaconGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 12);
    const beaconMesh = new THREE.Mesh(beaconGeo, new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    beaconMesh.position.set(0, towerHeight + 0.2, 0);
    towerGroup.add(beaconMesh);

    return towerGroup;
  }

  private buildLaunchPadAndRocket(): void {
    this.launchPadGroup.position.set(1000, 0, 0);
    this.launchPadGroup.visible = false;

    // 1. Natural Golden Sun Illumination & Atmospheric Sky Lighting for Earth Spaceport
    const padSunLight = new THREE.DirectionalLight(0xfffbeb, 3.2);
    padSunLight.position.set(180, 220, 140);
    this.launchPadGroup.add(padSunLight);

    const padHemiLight = new THREE.HemisphereLight(0x93c5fd, 0x34522a, 1.4);
    this.launchPadGroup.add(padHemiLight);

    // 2. Photorealistic Undulating Terrain Grid (Rolling Green Hills & Mounds)
    const terrainGeo = new THREE.PlaneGeometry(700, 700, 96, 96);
    terrainGeo.rotateX(-Math.PI / 2);
    const posAttr = terrainGeo.attributes.position as THREE.BufferAttribute;

    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const dist = Math.sqrt(x * x + z * z);

      // Natural rolling hills & coastal wetland mounds
      const hill = Math.sin(x * 0.012) * Math.cos(z * 0.012) * 5.2 + Math.sin(x * 0.028 + z * 0.02) * 2.4;
      // Smooth flattening around the pad center (radius < 45m)
      const flatFactor = Math.min(1.0, Math.max(0.0, (dist - 18) / 32));
      posAttr.setY(i, hill * flatFactor);
    }
    terrainGeo.computeVertexNormals();

    const grassTex = createGrassFieldTexture();
    const terrainMat = new THREE.MeshStandardMaterial({
      map: grassTex,
      roughness: 0.85,
      metalness: 0.05,
    });
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.position.y = -0.5;
    this.launchPadGroup.add(terrainMesh);

    // Deep Earth Soil Sub-layer
    const soilGeo = new THREE.CylinderGeometry(350, 360, 6, 64);
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x2b1e14, roughness: 0.95 });
    const soilMesh = new THREE.Mesh(soilGeo, soilMat);
    soilMesh.position.y = -3.5;
    this.launchPadGroup.add(soilMesh);

    // Concrete Launch Pad Apron (Weathered Octagonal Concrete Pad 39B)
    const apronGeo = new THREE.CylinderGeometry(26, 28, 1.2, 8);
    const apronMat = new THREE.MeshStandardMaterial({ color: 0x576574, roughness: 0.75, metalness: 0.2 });
    const apronMesh = new THREE.Mesh(apronGeo, apronMat);
    apronMesh.position.y = 0.6;
    this.launchPadGroup.add(apronMesh);

    // Flame Deflector Trench with scorched dark carbon textures
    const flameTrenchGeo = new THREE.BoxGeometry(18, 4, 18);
    const trenchMat = new THREE.MeshStandardMaterial({ color: 0x1e272e, roughness: 0.85 });
    const trenchMesh = new THREE.Mesh(flameTrenchGeo, trenchMat);
    trenchMesh.position.y = 1.2;
    this.launchPadGroup.add(trenchMesh);

    // Asphalt Access Road leading across rolling green hills to launch pad
    const roadGeo = new THREE.BoxGeometry(11, 0.2, 320);
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x2f3542, roughness: 0.85 });
    const roadMesh = new THREE.Mesh(roadGeo, roadMat);
    roadMesh.position.set(0, 0.2, 140);
    this.launchPadGroup.add(roadMesh);

    // White paint lane lines on road
    const lineGeo = new THREE.BoxGeometry(0.4, 0.22, 320);
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf1f2f6 });
    const lineMesh = new THREE.Mesh(lineGeo, lineMat);
    lineMesh.position.set(0, 0.22, 140);
    this.launchPadGroup.add(lineMesh);

    // 3. Dense Photorealistic Forest, Nature Groves & Coastal Vegetation Scatter
    const forestGroup = new THREE.Group();
    const treeCount = 170;
    for (let i = 0; i < treeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 36 + Math.random() * 260;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;

      // Sample approximate terrain elevation at (x, z)
      const hillY = (Math.sin(x * 0.012) * Math.cos(z * 0.012) * 5.2 + Math.sin(x * 0.028 + z * 0.02) * 2.4) *
        Math.min(1.0, Math.max(0.0, (dist - 18) / 32));

      const rand = Math.random();
      const type = rand > 0.55 ? 'deciduous' : rand > 0.25 ? 'conifer' : 'shrub';
      const tree = this.create3DTreeMesh(type);
      tree.position.set(x, hillY - 0.5, z);

      const scale = type === 'shrub' ? (0.9 + Math.random() * 0.8) : (0.8 + Math.random() * 1.0);
      tree.scale.set(scale, scale * (0.9 + Math.random() * 0.35), scale);
      tree.rotation.y = Math.random() * Math.PI * 2;
      tree.rotation.x = (Math.random() - 0.5) * 0.06;
      tree.rotation.z = (Math.random() - 0.5) * 0.06;

      forestGroup.add(tree);
    }
    this.launchPadGroup.add(forestGroup);

    // 4. Spaceport Operations & Launch Support Facility
    const opsGroup = new THREE.Group();
    opsGroup.position.set(-90, 0, 70);

    const bldgGeo = new THREE.BoxGeometry(22, 7, 14);
    const bldgMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.4, metalness: 0.3 });
    const bldgMesh = new THREE.Mesh(bldgGeo, bldgMat);
    bldgMesh.position.y = 3.5;
    opsGroup.add(bldgMesh);

    // Radar Dish
    const radarDish = new THREE.Mesh(
      new THREE.SphereGeometry(3.0, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.3, side: THREE.DoubleSide })
    );
    radarDish.rotation.x = -Math.PI / 3;
    radarDish.position.set(0, 8.5, 0);
    opsGroup.add(radarDish);

    this.launchPadGroup.add(opsGroup);

    // 5. Industrial Station Boarding Platform & Viewing Observation Deck with Handrails, Stairs & Wheel-Stop Bumpers
    this.stationPlatformGroup = this.createStationPlatformAndRailings();
    this.launchPadGroup.add(this.stationPlatformGroup);

    // 5b. Steel Umbilical Launch Tower & Crew Access Walkway Bridge
    this.launchPadGroup.add(this.createLaunchUmbilicalTowerAndBridge());

    // 6. Photorealistic Atmospheric Sky Dome
    const skyGeo = new THREE.SphereGeometry(350, 32, 32);
    const skyTex = createDaytimeSkyTexture();
    this.padSkyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      transparent: true,
      opacity: 1.0,
    });
    this.padSkyMesh = new THREE.Mesh(skyGeo, this.padSkyMat);
    this.launchPadGroup.add(this.padSkyMesh);

    // 7. Volumetric 3D Cumulus Clouds floating softly above landscape
    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.75,
      roughness: 0.9,
    });
    for (let c = 0; c < 16; c++) {
      const cloudGroup = new THREE.Group();
      const cloudAngle = (c / 16) * Math.PI * 2 + Math.random() * 0.4;
      const cloudDist = 80 + Math.random() * 140;
      const cloudHeight = 50 + Math.random() * 40;

      const puffCount = 6 + Math.floor(Math.random() * 4);
      for (let p = 0; p < puffCount; p++) {
        const puff = new THREE.Mesh(new THREE.DodecahedronGeometry(9 + Math.random() * 8, 1), cloudMat);
        puff.position.set((p - puffCount / 2) * 9, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5);
        cloudGroup.add(puff);
      }
      cloudGroup.position.set(Math.cos(cloudAngle) * cloudDist, cloudHeight, Math.sin(cloudAngle) * cloudDist);
      this.launchPadGroup.add(cloudGroup);
    }

    // Curved Earth horizon mesh below launch trajectory (reveals as altitude increases into orbit)
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

    // Photorealistic Aerospace Spacecraft Stack (ECHOES OF SPACE Exploration Assembly)
    this.rocketMesh = new THREE.Group();
    this.rocketMesh.position.set(0, 3, 0);

    const tileTex = createSpacecraftTileTexture();
    const solarTex = createSolarPanelTexture();
    const markingsTex = createMissionMarkingsTexture();

    // Pure pristine white ceramic thermal protection material
    const thermalMat = new THREE.MeshStandardMaterial({
      map: tileTex,
      color: 0xffffff,
      roughness: 0.25,
      metalness: 0.2,
    });

    // Dark titanium structural joints
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.8,
    });

    // Gold Multi-Layer Insulation (MLI) foil patches
    const goldFoilMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.2,
      metalness: 0.9,
    });

    // Mission Branding Material ("ECHOES OF SPACE")
    const markingsMat = new THREE.MeshStandardMaterial({
      map: markingsTex,
      roughness: 0.25,
      metalness: 0.25,
    });

    // Stage 1 Core Booster Assembly
    const stage1Geo = new THREE.CylinderGeometry(1.4, 1.4, 12, 32);
    const stage1Mesh = new THREE.Mesh(stage1Geo, thermalMat);
    stage1Mesh.position.y = 6;
    this.rocketMesh.add(stage1Mesh);

    // Prominent "ECHOES OF SPACE" decal band on Stage 1 core
    const coreDecalGeo = new THREE.CylinderGeometry(1.41, 1.41, 3.5, 32);
    const coreDecalMesh = new THREE.Mesh(coreDecalGeo, markingsMat);
    coreDecalMesh.position.y = 6.5;
    this.rocketMesh.add(coreDecalMesh);

    // Interstage Ring with dark titanium mechanical clamps
    const interstageGeo = new THREE.CylinderGeometry(1.42, 1.42, 0.8, 32);
    const interstageMesh = new THREE.Mesh(interstageGeo, titaniumMat);
    interstageMesh.position.y = 11.5;
    this.rocketMesh.add(interstageMesh);

    // Stage 2 Upper Service Module
    const stage2Geo = new THREE.CylinderGeometry(1.28, 1.28, 4.8, 32);
    const stage2Mesh = new THREE.Mesh(stage2Geo, thermalMat);
    stage2Mesh.position.y = 14.3;
    this.rocketMesh.add(stage2Mesh);

    // Gold Foil MLI Service Ring
    const mliRingGeo = new THREE.CylinderGeometry(1.3, 1.3, 1.2, 32);
    const mliRingMesh = new THREE.Mesh(mliRingGeo, goldFoilMat);
    mliRingMesh.position.y = 13.8;
    this.rocketMesh.add(mliRingMesh);

    // Payload Fairing / Descent Capsule Carrier with "ECHOES OF SPACE" Mission Badge
    const fairingGeo = new THREE.CylinderGeometry(1.35, 1.35, 3.2, 32);
    const fairingMesh = new THREE.Mesh(fairingGeo, markingsMat);
    fairingMesh.position.y = 17.0;
    this.rocketMesh.add(fairingMesh);

    // Conical Aerodynamic Heat Shield Nose Cap
    const noseGeo = new THREE.ConeGeometry(1.35, 2.5, 32);
    const noseMesh = new THREE.Mesh(noseGeo, thermalMat);
    noseMesh.position.y = 19.85;
    this.rocketMesh.add(noseMesh);

    // Deployable Photovoltaic Solar Array Panels (Left & Right)
    const solarWingGeo = new THREE.BoxGeometry(0.08, 3.8, 1.2);
    const solarWingMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      roughness: 0.2,
      metalness: 0.7,
    });

    const leftSolarWing = new THREE.Mesh(solarWingGeo, solarWingMat);
    leftSolarWing.position.set(-1.8, 14.3, 0);
    this.rocketMesh.add(leftSolarWing);

    const rightSolarWing = new THREE.Mesh(solarWingGeo, solarWingMat);
    rightSolarWing.position.set(1.8, 14.3, 0);
    this.rocketMesh.add(rightSolarWing);

    // High Gain Parabolic Communication Dish Antenna
    const dishGeo = new THREE.SphereGeometry(0.6, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2.2);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.3, metalness: 0.5, side: THREE.DoubleSide });
    const dishMesh = new THREE.Mesh(dishGeo, dishMat);
    dishMesh.rotation.x = Math.PI / 2;
    dishMesh.position.set(0, 16.5, 1.45);
    this.rocketMesh.add(dishMesh);

    // Reaction Control System (RCS) Quad Thruster Blocks
    const rcsGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
      const rcsMesh = new THREE.Mesh(rcsGeo, titaniumMat);
      rcsMesh.position.set(Math.cos(angle) * 1.35, 15.2, Math.sin(angle) * 1.35);
      this.rocketMesh.add(rcsMesh);
    }

    // Solid Rocket Boosters (SRBs) on flanks for heavy liftoff thrust
    const srbGeo = new THREE.CylinderGeometry(0.58, 0.58, 11, 24);
    const srbNoseGeo = new THREE.ConeGeometry(0.58, 1.6, 24);

    // Left SRB
    this.srbLeftMesh = new THREE.Mesh(srbGeo, thermalMat);
    this.srbLeftMesh.position.set(-2.1, 5.5, 0);
    const leftNose = new THREE.Mesh(srbNoseGeo, thermalMat);
    leftNose.position.set(0, 6.3, 0);
    this.srbLeftMesh.add(leftNose);
    this.rocketMesh.add(this.srbLeftMesh);

    // Right SRB
    this.srbRightMesh = new THREE.Mesh(srbGeo, thermalMat);
    this.srbRightMesh.position.set(2.1, 5.5, 0);
    const rightNose = new THREE.Mesh(srbNoseGeo, thermalMat);
    rightNose.position.set(0, 6.3, 0);
    this.srbRightMesh.add(rightNose);
    this.rocketMesh.add(this.srbRightMesh);

    // Main Engine Nozzle Bells (Titanium thrust chamber)
    const nozzleGeo = new THREE.CylinderGeometry(0.45, 0.8, 1.4, 24);
    const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.85, roughness: 0.2 });
    const nozzleMesh = new THREE.Mesh(nozzleGeo, nozzleMat);
    nozzleMesh.position.y = -0.7;
    this.rocketMesh.add(nozzleMesh);

    // Primary Engine Ignition Light (Casts warm radiant fire glow onto pad, station platform, railings, and ground)
    this.rocketIgnitionLight = new THREE.PointLight(0xff7700, 0, 180, 1.2);
    this.rocketIgnitionLight.position.set(0, -2.0, 0);
    this.rocketMesh.add(this.rocketIgnitionLight);

    // Secondary Throat Core Light (Intense white-cyan plasma glare at nozzle base)
    this.rocketCoreLight = new THREE.PointLight(0xbae6fd, 0, 45, 1.0);
    this.rocketCoreLight.position.set(0, -1.0, 0);
    this.rocketMesh.add(this.rocketCoreLight);

    // 8. Streamlined Real Rocket Engine Flame Assembly
    this.rocketFlameGroup = new THREE.Group();
    this.rocketFlameGroup.position.set(0, -0.7, 0);

    const flameTex = createUltraRealFlameTexture();
    const machTex = createMachDiskTexture();

    // Inner White-Hot Concentrated Nozzle Core Stream
    const innerFlameGeo = new THREE.CylinderGeometry(0.22, 0.45, 4.5, 24, 1, true);
    innerFlameGeo.translate(0, -2.25, 0);
    const innerFlameMat = new THREE.MeshBasicMaterial({
      map: flameTex,
      transparent: true,
      opacity: 0.98,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.innerFlameMesh = new THREE.Mesh(innerFlameGeo, innerFlameMat);
    this.rocketFlameGroup.add(this.innerFlameMesh);

    // Main Orange Plume Cone coming straight from engine base
    const mainFlameGeo = new THREE.ConeGeometry(0.72, 6.2, 24, 1, true);
    mainFlameGeo.rotateX(Math.PI);
    mainFlameGeo.translate(0, -3.1, 0);
    const mainFlameMat = new THREE.MeshBasicMaterial({
      map: flameTex,
      transparent: true,
      opacity: 0.88,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.mainFlameMesh = new THREE.Mesh(mainFlameGeo, mainFlameMat);
    this.rocketFlameGroup.add(this.mainFlameMesh);

    // Outer Crimson Plume Boundary
    const outerFlameGeo = new THREE.ConeGeometry(1.05, 8.2, 24, 1, true);
    outerFlameGeo.rotateX(Math.PI);
    outerFlameGeo.translate(0, -4.1, 0);
    const outerFlameMat = new THREE.MeshBasicMaterial({
      map: flameTex,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.outerFlameMesh = new THREE.Mesh(outerFlameGeo, outerFlameMat);
    this.rocketFlameGroup.add(this.outerFlameMesh);

    // Supersonic Shock Diamonds / Mach Disks
    this.shockDiamonds = [];
    const machGeo = new THREE.PlaneGeometry(0.65, 0.65);
    const machMat = new THREE.MeshBasicMaterial({
      map: machTex,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    for (let m = 0; m < 3; m++) {
      const disk = new THREE.Mesh(machGeo, machMat);
      disk.rotation.x = Math.PI / 2;
      disk.position.y = -0.8 - m * 1.2;
      this.shockDiamonds.push(disk);
      this.rocketFlameGroup.add(disk);
    }

    // SRB Left Booster Flame
    const srbFlameGeo = new THREE.CylinderGeometry(0.12, 0.35, 4.8, 16, 1, true);
    srbFlameGeo.translate(0, -2.4, 0);
    const srbFlameMat = new THREE.MeshBasicMaterial({
      map: flameTex,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.srbFlameLeft = new THREE.Mesh(srbFlameGeo, srbFlameMat);
    this.srbFlameLeft.position.set(-2.1, 0, 0);
    this.rocketFlameGroup.add(this.srbFlameLeft);

    // SRB Right Booster Flame
    this.srbFlameRight = new THREE.Mesh(srbFlameGeo, srbFlameMat);
    this.srbFlameRight.position.set(2.1, 0, 0);
    this.rocketFlameGroup.add(this.srbFlameRight);

    this.rocketFlameGroup.visible = false;
    this.rocketMesh.add(this.rocketFlameGroup);

    // Exhaust particle system
    const exhaustCount = 600;
    this.exhaustGeometry = new THREE.BufferGeometry();
    const exhaustPositions = new Float32Array(exhaustCount * 3);
    const exhaustColors = new Float32Array(exhaustCount * 3);

    for (let i = 0; i < exhaustCount; i++) {
      exhaustPositions[i * 3] = (Math.random() - 0.5) * 2.2;
      exhaustPositions[i * 3 + 1] = -Math.random() * 14;
      exhaustPositions[i * 3 + 2] = (Math.random() - 0.5) * 2.2;

      exhaustColors[i * 3] = 1.0;
      exhaustColors[i * 3 + 1] = 0.4 + Math.random() * 0.5;
      exhaustColors[i * 3 + 2] = 0.1;
    }

    this.exhaustGeometry.setAttribute('position', new THREE.BufferAttribute(exhaustPositions, 3));
    this.exhaustGeometry.setAttribute('color', new THREE.BufferAttribute(exhaustColors, 3));

    const exhaustMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    this.exhaustParticles = new THREE.Points(this.exhaustGeometry, exhaustMat);
    this.rocketMesh.add(this.exhaustParticles);

    this.launchPadGroup.add(this.rocketMesh);

    // Initialize mathematically verified aerospace trajectory curves (Centripetal Catmull-Rom splines)
    // 1. Lunar Trajectory Corridor: Pad 39B -> Pitch-over gravity turn -> Trans-Lunar Injection -> Lunar Orbit
    const lunarPoints = [
      new THREE.Vector3(0, 3, 0),        // Pad 39B Surface
      new THREE.Vector3(0, 18, 0),       // Pure vertical climb clearing umbilical tower
      new THREE.Vector3(-2.2, 36, -2.6), // Initial aerodynamic gravity turn pitch-over
      new THREE.Vector3(-10.5, 62, -12.5),// Max-Q supersonic climb through stratosphere
      new THREE.Vector3(-24.0, 88, -27.5),// Upper stage ignition & orbital climb
      new THREE.Vector3(-46.0, 102, -52.0),// Trans-Lunar Injection (TLI burn into deep space)
      new THREE.Vector3(-74.0, 96, -82.0), // Deep cislunar transfer coast
      new THREE.Vector3(-96.0, 86, -104.0),// Lunar gravitational capture approach
      new THREE.Vector3(-108.0, 81, -118.0),// Final approach corridor facing Moon (-110, 80, -120)
    ];
    this.lunarTrajectoryCurve = new THREE.CatmullRomCurve3(lunarPoints, false, 'centripetal');

    // 2. Mars Transfer Corridor: Pad 39B -> Gravity turn -> Trans-Mars Injection -> Mars Orbit
    const marsPoints = [
      new THREE.Vector3(0, 3, 0),        // Pad 39B Surface
      new THREE.Vector3(0, 18, 0),       // Pure vertical climb clearing umbilical tower
      new THREE.Vector3(2.6, 36, -3.2),  // Initial aerodynamic gravity turn pitch-over
      new THREE.Vector3(14.0, 62, -16.5),// Max-Q supersonic climb through stratosphere
      new THREE.Vector3(32.0, 88, -38.0),// Upper stage ignition & orbital climb
      new THREE.Vector3(62.0, 100, -74.0),// Trans-Mars Injection (TMI burn into deep space)
      new THREE.Vector3(94.0, 82, -114.0),// Interplanetary transfer coast
      new THREE.Vector3(118.0, 62, -142.0),// Mars gravitational capture approach
      new THREE.Vector3(128.0, 52, -157.0),// Final approach corridor facing Mars (130, 50, -160)
    ];
    this.marsTrajectoryCurve = new THREE.CatmullRomCurve3(marsPoints, false, 'centripetal');
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
      if (this.isDragging) {
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
        return;
      }

      // Hover Raycasting for Celestial Bodies, Moons, & Probes
      if (this.currentViewMode === 'launch-simulator') return;

      const rect = dom.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const meshesToTest = Array.from(this.planetMeshes.values());
      const intersects = this.raycaster.intersectObjects(meshesToTest, true);

      if (intersects.length > 0) {
        dom.style.cursor = 'pointer';
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && !hitObj.userData?.id && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        const id = hitObj?.userData?.id as string;
        if (id && CELESTIAL_BODIES[id]) {
          this.callbacks.onHoverBody?.(CELESTIAL_BODIES[id], { x: e.clientX, y: e.clientY });
          return;
        }
      }

      dom.style.cursor = 'grab';
      this.callbacks.onHoverBody?.(null, null);
    });

    window.addEventListener('pointerup', () => {
      this.isDragging = false;
    });

    dom.addEventListener(
      'wheel',
      (e) => {
        e.preventDefault();
        const zoomDelta = e.deltaY * 0.02;
        const minRadius = this.currentViewMode === 'launch-simulator' ? 6 : 2;
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
      const intersects = this.raycaster.intersectObjects(meshesToTest, true);

      if (intersects.length > 0) {
        let hitObj: THREE.Object3D | null = intersects[0].object;
        while (hitObj && !hitObj.userData?.id && hitObj.parent) {
          hitObj = hitObj.parent;
        }
        const id = hitObj?.userData?.id as string;
        if (id) {
          this.focusOnPlanet(id as PlanetId);
          this.callbacks.onPlanetSelect?.(id as PlanetId);
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

  public focusOnPlanet(planetId: string): void {
    this.targetPlanetId = planetId;
    const mesh = this.planetMeshes.get(planetId);
    if (!mesh) return;

    this.callbacks.onCameraMoveStart?.();
    this.isTransitioningCamera = true;

    const worldPos = new THREE.Vector3();
    mesh.getWorldPosition(worldPos);
    this.cameraLookAtTarget.copy(worldPos);

    let offsetDistance = 12;
    if (planetId === 'sun') offsetDistance = 32;
    else if (planetId === 'jupiter' || planetId === 'saturn') offsetDistance = 18;
    else if (planetId === 'uranus' || planetId === 'neptune') offsetDistance = 14;
    else if (planetId === 'earth') offsetDistance = 14.5;
    else if (planetId === 'mars' || planetId === 'venus') offsetDistance = 6.8;
    else if (planetId === 'mercury') offsetDistance = 4.8;
    else offsetDistance = 3.2; // Moons & artificial satellites close-up view

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
      this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.0012);

      // Anchor camera strictly to Pad 39B at wide majestic view distance
      if (this.launchProgress <= 0.05) {
        this.launchCameraAngle = 'pad';
        this.camera.position.set(1042, 14, 42);
        this.camera.lookAt(1000, 8, 0);
      }
      this.setLaunchProgress(this.launchProgress, this.launchTarget);
      this.updateLaunchCamera(this.launchProgress);
    } else {
      this.scene.fog = null;
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
    this.sphericalCoords.radius = 55;
    this.sphericalCoords.theta = 0.8;
    this.sphericalCoords.phi = Math.PI / 2.4;
    this.solarSystemGroup.visible = false;
    this.launchPadGroup.visible = true;
    this.setLaunchProgress(0, this.launchTarget);
    this.updateLaunchCamera(0);
    this.camera.position.set(1042, 14, 42);
    this.camera.lookAt(1000, 8, 0);
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
      phase = 'TRANSIT_FLIGHT';
      altitudeKm = target === 'mars_transfer'
        ? Math.round(400 + (p - 0.75) * 225000000)
        : Math.round(400 + (p - 0.75) * 1530000);
      velocityKmh = target === 'mars_transfer' ? 58000 : 39000;
    } else {
      phase = 'DESTINATION_ARRIVED';
      if (target === 'mars_transfer') {
        altitudeKm = 250;
        velocityKmh = 14500;
      } else {
        altitudeKm = 100;
        velocityKmh = 5800;
      }
    }

    this.simulatedAltitudeKm = altitudeKm;
    this.simulatedVelocityKmh = velocityKmh;
    this.missionPhase = phase;

    // 2. Physical Rocket Kinematics & Transformation (Single Authoritative Controller)
    if (this.rocketMesh) {
      const activeCurve = target === 'mars_transfer' ? this.marsTrajectoryCurve : this.lunarTrajectoryCurve;
      const pos = activeCurve.getPointAt(p);
      const tangent = activeCurve.getTangentAt(p);

      this.rocketMesh.position.copy(pos);

      // Authoritative Rocket Orientation Controller:
      // In local coordinates: nose is at +Y, engine nozzles are at -Y.
      // During ascent and space travel: longitudinal axis (+Y) aligns with velocity tangent.
      // During destination approach (p >= 0.60): nose continuously points forward toward the destination (Moon or Mars),
      // with rear engine nozzles strictly trailing behind.
      const destPos = target === 'mars_transfer' 
        ? new THREE.Vector3(130, 50, -160) 
        : new THREE.Vector3(-110, 80, -120);

      const toDest = destPos.clone().sub(pos).normalize();
      const tangentNorm = tangent.clone().normalize();
      
      let forward: THREE.Vector3;
      if (p < 0.60) {
        forward = tangentNorm;
      } else {
        // Smoothly blend from tangent to destination vector so nose faces Moon/Mars directly
        const blendFactor = Math.min(1.0, (p - 0.60) / 0.28);
        forward = tangentNorm.clone().lerp(toDest, blendFactor).normalize();
      }

      // Stable continuous reference vector (smoothly transitions from +Z during vertical climb to world +Y)
      let upRef: THREE.Vector3;
      if (Math.abs(forward.y) > 0.92) {
        upRef = new THREE.Vector3(0, 0, 1);
      } else {
        upRef = new THREE.Vector3(0, 1, 0);
      }

      let right = new THREE.Vector3().crossVectors(forward, upRef).normalize();
      if (right.lengthSq() < 0.001) {
        right = new THREE.Vector3(1, 0, 0);
      }
      const correctedUp = new THREE.Vector3().crossVectors(right, forward).normalize();
      const rotMatrix = new THREE.Matrix4().makeBasis(right, forward, correctedUp);
      this.rocketMesh.quaternion.setFromRotationMatrix(rotMatrix);

      // SRB Boosters Separation
      if (this.srbLeftMesh && this.srbRightMesh) {
        if (p > 0.42 && p <= 0.65) {
          this.srbLeftMesh.visible = true;
          this.srbRightMesh.visible = true;
          const sepT = (p - 0.42) / 0.23;
          const sepDist = sepT * 26;
          this.srbLeftMesh.position.set(-2 - sepDist, 5.5 - sepDist * 0.35, 0);
          this.srbRightMesh.position.set(2 + sepDist, 5.5 - sepDist * 0.35, 0);
          this.srbLeftMesh.rotation.z = -sepT * 0.35;
          this.srbRightMesh.rotation.z = sepT * 0.35;
        } else if (p > 0.65) {
          this.srbLeftMesh.visible = false;
          this.srbRightMesh.visible = false;
        } else {
          this.srbLeftMesh.visible = true;
          this.srbRightMesh.visible = true;
          this.srbLeftMesh.position.set(-2, 5.5, 0);
          this.srbRightMesh.position.set(2, 5.5, 0);
          this.srbLeftMesh.rotation.set(0, 0, 0);
          this.srbRightMesh.rotation.set(0, 0, 0);
        }
      }
    }

    // 3. Environmental Atmosphere & Destination Mesh visibility
    if (p < 0.15) {
      if (this.currentViewMode === 'launch-simulator') {
        this.scene.fog = new THREE.FogExp2(0x93c5fd, 0.0012);
      }
    } else {
      this.scene.fog = null;
    }

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

    // Engine ignition & streamlined real rocket flame effects
    const isEngineBurning = p > 0.01 && p < 0.95;
    if (this.rocketFlameGroup) {
      this.rocketFlameGroup.visible = isEngineBurning;
    }

    if (this.rocketIgnitionLight) {
      this.rocketIgnitionLight.intensity = isEngineBurning ? (p < 0.25 ? 35 : 18) : 0;
      this.rocketIgnitionLight.distance = isEngineBurning ? 90 : 0;
    }

    if (this.rocketCoreLight) {
      this.rocketCoreLight.intensity = isEngineBurning ? 22 : 0;
    }

    if (this.exhaustParticles) {
      (this.exhaustParticles.material as THREE.PointsMaterial).opacity = isEngineBurning ? 0.7 : 0;
    }

    // 4. Camera Tracking (Always locked to the rocket)
    this.updateLaunchCamera(p);

    // 5. Notify React component callbacks
    this.callbacks.onLaunchProgressUpdate?.(p, altitudeKm, velocityKmh, phase);
  }

  private updateLaunchCamera(p: number): void {
    if (this.currentViewMode !== 'launch-simulator' || this.launchCameraAngle === 'free') return;

    const basePadX = 1000;
    const rPos = this.rocketMesh ? this.rocketMesh.position : new THREE.Vector3(0, 3, 0);
    const worldRocket = new THREE.Vector3(basePadX + rPos.x, rPos.y, rPos.z);

    // Dynamic focal point: centered smoothly on the rocket body
    this.cameraLookAtTarget.set(worldRocket.x, worldRocket.y + 4, worldRocket.z);

    if (this.launchCameraAngle === 'pad') {
      if (p < 0.60) {
        // Ground pad tracking camera: smoothly zooms out and pulls back as rocket ascends into space
        const pull = Math.min(85, p * 125);
        this.camera.position.set(
          basePadX + 38 + pull * 0.35,
          14 + pull * 0.22,
          38 + pull * 0.35
        );
      } else {
        // Deep space interplanetary transit view smoothly tracking alongside the rocket & destination
        const tBlend = Math.min(1.0, (p - 0.60) / 0.35);
        const padCamX = basePadX + 38 + 85 * 0.35;
        const padCamY = 14 + 85 * 0.22;
        const padCamZ = 38 + 85 * 0.35;

        const spaceCamX = worldRocket.x + 24;
        const spaceCamY = worldRocket.y + 10;
        const spaceCamZ = worldRocket.z + 28;

        this.camera.position.set(
          THREE.MathUtils.lerp(padCamX, spaceCamX, tBlend),
          THREE.MathUtils.lerp(padCamY, spaceCamY, tBlend),
          THREE.MathUtils.lerp(padCamZ, spaceCamZ, tBlend)
        );
      }
      this.camera.lookAt(this.cameraLookAtTarget);
    } else if (this.launchCameraAngle === 'tower') {
      // Umbilical tower view: tracks upward smoothly
      const lift = Math.min(35, p * 50);
      this.camera.position.set(basePadX - 8, 22 + lift, 5);
      this.camera.lookAt(this.cameraLookAtTarget);
    } else if (this.launchCameraAngle === 'ascent') {
      // Aerodynamic ascent chase: smoothly follows behind and beneath the fire plume
      this.camera.position.set(
        worldRocket.x + 8,
        Math.max(4, worldRocket.y - 12),
        worldRocket.z + 16
      );
      this.camera.lookAt(this.cameraLookAtTarget);
    } else if (this.launchCameraAngle === 'orbital') {
      // Wide interplanetary perspective
      this.camera.position.set(
        worldRocket.x + 36,
        worldRocket.y + 20,
        worldRocket.z + 46
      );
      this.camera.lookAt(this.cameraLookAtTarget);
    } else if (this.launchCameraAngle === 'spacecraft') {
      // Close cinematic spacecraft inspection chase
      this.camera.position.set(
        worldRocket.x + 8,
        worldRocket.y + 3,
        worldRocket.z + 9
      );
      this.camera.lookAt(this.cameraLookAtTarget);
    }
  }

  public setAutoLaunch(active: boolean, durationSec = 6.8): void {
    this.autoLaunchActive = active;
    this.autoLaunchDurationSec = durationSec;
    if (active) {
      aerospaceAudio.playRealRocketLaunchSound();
    }
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

      // 3. Clean Engine Flame Stream Animation (Subtle natural wave, no chaotic vibration)
      const isBurning = this.launchProgress > 0.01 && this.launchProgress < 0.95;
      if (this.rocketFlameGroup && isBurning) {
        const time = Date.now() * 0.008;
        const subtleY = 1.0 + Math.sin(time * 3) * 0.03;
        this.rocketFlameGroup.scale.set(1.0, subtleY, 1.0);

        // Subtle shock diamond pulse
        this.shockDiamonds.forEach((disk, idx) => {
          const shockScale = 1.0 + Math.sin(time * 4 + idx) * 0.06;
          disk.scale.set(shockScale, shockScale, 1.0);
        });
      }

      if (this.exhaustGeometry && isBurning) {
        const posAttr = this.exhaustGeometry.getAttribute('position') as THREE.BufferAttribute;
        const posArr = posAttr.array as Float32Array;
        for (let i = 0; i < posArr.length; i += 3) {
          posArr[i + 1] -= delta * 36;
          if (posArr[i + 1] < -16) {
            posArr[i + 1] = 0;
            posArr[i] = (Math.random() - 0.5) * 2.2;
            posArr[i + 2] = (Math.random() - 0.5) * 2.2;
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
