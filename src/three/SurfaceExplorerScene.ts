import * as THREE from 'three';
import { SurfaceWaypoint, RoverTelemetry, RoverCameraMode, GraphicsQuality } from '../types/simulation';
import {
  createSpacecraftTileTexture,
  createSolarPanelTexture,
  createMissionMarkingsTexture,
  createMarsParachuteTexture,
} from './textures';
import {
  createAstronautModel,
  AstronautActor,
  updateAstronautAnimation,
  setAstronautPose,
} from './astronautModel';
import {
  createRealisticRoverModel,
  RoverActor,
} from './roverModel';

export interface SurfaceSceneCallbacks {
  onTelemetryUpdate?: (telemetry: RoverTelemetry) => void;
  onAnomalyProximity?: (waypoint: SurfaceWaypoint | null, distanceMeters: number) => void;
  onWaypointsUpdate?: (waypoints: SurfaceWaypoint[]) => void;
  onPauseChange?: (isPaused: boolean) => void;
  onRoverInteractionStateChange?: (canEnter: boolean, inRover: boolean) => void;
}

export class SurfaceExplorerScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private animationFrameId: number | null = null;
  private callbacks: SurfaceSceneCallbacks;

  // Environment mode
  private environment: 'moon' | 'mars' = 'moon';
  private waypoints: SurfaceWaypoint[] = [];
  private activeTargetWaypointId: string | null = null;

  // Scene Objects
  private terrainMesh: THREE.Mesh | null = null;
  private skyGroup: THREE.Group = new THREE.Group();
  private rocksGroup: THREE.Group = new THREE.Group();
  private beaconsGroup: THREE.Group = new THREE.Group();
  private wheelTracksGroup: THREE.Group = new THREE.Group();
  private earthMesh: THREE.Mesh | null = null;
  private historicalTraverseGroup: THREE.Group = new THREE.Group();

  // Exploration Character & Mode: 'walking' (astronaut on foot) vs 'driving' (seated inside rover)
  public explorationMode: 'walking' | 'driving' = 'walking';
  private astronautActor: AstronautActor | null = null;
  private astronautPosition = new THREE.Vector3(2.2, 0, 6);
  private astronautHeading: number = 0; // In radians
  private astronautSpeed: number = 0; // In meters per second
  private canEnterRover: boolean = true;
  private isAstronautInRover: boolean = false;

  // Live Surface Landing Sequence
  private isLandingSequenceActive: boolean = false;
  private landingStartTime: number = 0;
  private landingOnCompleteCallback: (() => void) | null = null;
  private landedSpacecraftGroup: THREE.Group | null = null;
  private landingParachuteGroup: THREE.Group | null = null;
  private thrusterFlames: THREE.Mesh[] = [];
  private flameMaterial: THREE.MeshBasicMaterial | null = null;

  // Rover Model & Parts
  private roverGroup: THREE.Group = new THREE.Group();
  private roverActor: RoverActor | null = null;
  private roverChassis: THREE.Group | null = null;
  private wheelMeshes: THREE.Mesh[] = [];
  private wheelPivots: THREE.Group[] = [];
  private mastMesh: THREE.Group | null = null;
  private headlightLeft: THREE.SpotLight | null = null;
  private headlightRight: THREE.SpotLight | null = null;

  // Dust Particle System
  private dustParticles: THREE.Points | null = null;
  private dustGeometry: THREE.BufferGeometry | null = null;

  // Visible Dynamic Wheel Tracks
  private maxTrackSegments = 320;
  private trackSegmentCount = 0;
  private trackHead = 0;
  private leftTrackMesh: THREE.Mesh | null = null;
  private rightTrackMesh: THREE.Mesh | null = null;
  private leftTrackGeometry: THREE.BufferGeometry | null = null;
  private rightTrackGeometry: THREE.BufferGeometry | null = null;
  private lastLeftTrackPos: THREE.Vector3 = new THREE.Vector3();
  private lastRightTrackPos: THREE.Vector3 = new THREE.Vector3();
  private lastTrackCenterPos: THREE.Vector3 = new THREE.Vector3(0, 0, 0);
  private hasPreviousTrackPoint = false;

  // Holographic 3D Route Line
  private routeLine: THREE.Line | null = null;
  private showRouteLine: boolean = true;

  // Driving Physics & Kinematics
  private roverPosition = new THREE.Vector3(0, 0, 0);
  private roverHeading: number = 0; // In radians (0 = facing -Z)
  private currentSpeed: number = 0; // In meters per second
  private topSpeedMps: number = 24.0; // Fast ~86 km/h high-performance exploration
  private reverseSpeedMps: number = -12.0; // ~43 km/h reverse
  private batteryPercent: number = 98.5;
  private distanceTraveledMeters: number = 0;
  private signalDelaySec: number = 1.28; // Moon ~1.3s, Mars ~250s
  private isPaused: boolean = false;

  // Input states
  private inputForward: number = 0; // -1, 0, 1
  private inputTurn: number = 0; // -1 (left), 1 (right)
  private inputBrake: boolean = false;
  private joystickActive: boolean = false;
  private joystickX: number = 0;
  private joystickY: number = 0;

  // Camera Settings
  private cameraMode: RoverCameraMode = 'follow';
  private cameraOrbit = { radius: 11, theta: 0, phi: Math.PI / 3.2 };
  private isPointerDown: boolean = false;
  private previousPointerPos = { x: 0, y: 0 };

  // Proximity tracking
  private nearestWaypoint: SurfaceWaypoint | null = null;
  private nearestDistance: number = 999;

  // Terrain seed parameters
  private terrainSize: number = 360;
  private terrainSegments: number = 120;

  // Listeners bound for cleanup
  private boundKeyDown: (e: KeyboardEvent) => void;
  private boundKeyUp: (e: KeyboardEvent) => void;
  private boundPointerDown: (e: PointerEvent) => void;
  private boundPointerMove: (e: PointerEvent) => void;
  private boundPointerUp: () => void;
  private boundWheel: (e: WheelEvent) => void;

  constructor(
    container: HTMLElement,
    environment: 'moon' | 'mars',
    waypoints: SurfaceWaypoint[],
    callbacks: SurfaceSceneCallbacks = {}
  ) {
    this.container = container;
    this.environment = environment;
    this.waypoints = JSON.parse(JSON.stringify(waypoints));
    this.callbacks = callbacks;
    this.signalDelaySec = environment === 'moon' ? 1.28 : 252.0;

    // Pick first waypoint as default target if available
    const envWaypoints = this.waypoints.filter((w) => w.environment === environment);
    if (envWaypoints.length > 0) {
      this.activeTargetWaypointId = envWaypoints[0].id;
    }

    // 1. Scene & Camera Setup
    this.scene = new THREE.Scene();
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(50, aspect, 0.2, 1200);

    // 2. WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = environment === 'moon' ? 1.2 : 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    // Groups
    this.scene.add(this.skyGroup);
    this.scene.add(this.rocksGroup);
    this.scene.add(this.wheelTracksGroup);
    this.scene.add(this.beaconsGroup);
    this.scene.add(this.historicalTraverseGroup);
    this.scene.add(this.roverGroup);

    // 3. Build Environment, Tracks, Landed Spacecraft, Rover & Astronaut
    this.buildLightingAndAtmosphere();
    this.buildProceduralTerrain();
    this.buildLandedSpacecraft();
    this.buildScatteredRocks();
    this.initWheelTracks();
    this.initRouteLine();
    this.buildRoverModel();
    this.buildAstronautModel();
    this.buildHistoricalTraversePathway();
    this.buildDustParticles();
    this.updateWaypointBeacons();

    // 4. Input & Interaction Listeners
    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundPointerDown = this.handlePointerDown.bind(this);
    this.boundPointerMove = this.handlePointerMove.bind(this);
    this.boundPointerUp = this.handlePointerUp.bind(this);
    this.boundWheel = this.handleWheel.bind(this);
    this.setupControlListeners();

    // Spawn rover and astronaut safely on terrain
    const startH = this.getTerrainHeight(0, 6);
    this.roverPosition.set(0, startH + 0.55, 6);
    this.roverGroup.position.copy(this.roverPosition);
    this.lastTrackCenterPos.copy(this.roverPosition);

    const astroH = this.getTerrainHeight(2.2, 6);
    this.astronautPosition.set(2.2, astroH, 6);
    if (this.astronautActor) {
      this.astronautActor.group.position.copy(this.astronautPosition);
      this.astronautActor.group.rotation.set(0, Math.PI, 0);
    }
    this.explorationMode = 'walking';
    this.canEnterRover = true;
    this.callbacks.onRoverInteractionStateChange?.(true, false);

    // Start Animation Loop
    this.startLoop();
  }

  /**
   * Procedural terrain height function h(x, z)
   */
  public getTerrainHeight(x: number, z: number): number {
    if (this.environment === 'moon') {
      // Moon: undulating rolling hills + crater depressions
      const rolling = Math.sin(x * 0.02) * 2.8 + Math.cos(z * 0.022) * 2.6;
      const micro = Math.sin(x * 0.08 + z * 0.06) * 0.5;

      // Craters (depressions with raised lips)
      const crater1Dist = Math.hypot(x - 30, z + 25);
      const crater1 = crater1Dist < 35 ? -Math.cos((crater1Dist / 35) * Math.PI) * 3.8 + 0.8 : 0;

      const crater2Dist = Math.hypot(x + 50, z - 40);
      const crater2 = crater2Dist < 25 ? -Math.cos((crater2Dist / 25) * Math.PI) * 2.6 + 0.6 : 0;

      return rolling + micro + crater1 + crater2;
    } else {
      // Mars: wind-swept sand dunes, basalt ridges, broad valleys
      const dunes = Math.sin(x * 0.035 + z * 0.015) * 3.5 + Math.cos(z * 0.025) * 2.0;
      const ridges = Math.cos(x * 0.07 - z * 0.05) * 0.9;
      const basinDist = Math.hypot(x + 20, z + 20);
      const basin = basinDist < 45 ? -Math.cos((basinDist / 45) * Math.PI) * 3.0 : 0;

      return dunes + ridges + basin;
    }
  }

  /**
   * Computes terrain surface normal at (x, z)
   */
  private getTerrainNormal(x: number, z: number): THREE.Vector3 {
    const delta = 0.5;
    const hL = this.getTerrainHeight(x - delta, z);
    const hR = this.getTerrainHeight(x + delta, z);
    const hD = this.getTerrainHeight(x, z - delta);
    const hU = this.getTerrainHeight(x, z + delta);

    const normal = new THREE.Vector3(hL - hR, 2 * delta, hD - hU);
    normal.normalize();
    return normal;
  }

  private buildLightingAndAtmosphere(): void {
    if (this.environment === 'moon') {
      // Deep space black sky
      this.scene.background = new THREE.Color(0x020307);
      this.scene.fog = new THREE.FogExp2(0x020307, 0.0018);

      // Harsh lunar sunlight (no atmosphere diffusion)
      const sunLight = new THREE.DirectionalLight(0xfffdf5, 2.4);
      sunLight.position.set(120, 85, -90);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 400;
      sunLight.shadow.camera.left = -90;
      sunLight.shadow.camera.right = 90;
      sunLight.shadow.camera.top = 90;
      sunLight.shadow.camera.bottom = -90;
      this.scene.add(sunLight);

      // Faint Earth-shine ambient illumination
      const ambientLight = new THREE.AmbientLight(0x1a2638, 0.45);
      this.scene.add(ambientLight);

      // High-density lunar starfield
      this.buildStarfield();

      // Glowing Earth in lunar sky
      this.buildLunarEarthInSky();
    } else {
      // Mars: Atmospheric reddish-tan sky
      this.scene.background = new THREE.Color(0xb45309);
      this.scene.fog = new THREE.FogExp2(0x8a3809, 0.0045);

      // Warm Martian sunlight
      const sunLight = new THREE.DirectionalLight(0xffedd5, 2.0);
      sunLight.position.set(90, 75, -80);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 10;
      sunLight.shadow.camera.far = 380;
      sunLight.shadow.camera.left = -90;
      sunLight.shadow.camera.right = 90;
      sunLight.shadow.camera.top = 90;
      sunLight.shadow.camera.bottom = -90;
      this.scene.add(sunLight);

      const ambientLight = new THREE.AmbientLight(0x7c2d12, 0.6);
      this.scene.add(ambientLight);

      // Distant Martian mountain horizons
      this.buildMarsDistantMountains();
    }
  }

  private buildStarfield(): void {
    const starCount = 1800;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);
    const colors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 500 + Math.random() * 200;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi)) + 15;
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      colors[i * 3] = 0.85 + Math.random() * 0.15;
      colors[i * 3 + 1] = 0.85 + Math.random() * 0.15;
      colors[i * 3 + 2] = 0.95 + Math.random() * 0.05;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 1.6,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
    });

    const stars = new THREE.Points(geometry, material);
    this.skyGroup.add(stars);
  }

  private buildLunarEarthInSky(): void {
    const earthGeo = new THREE.SphereGeometry(16, 32, 32);
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0f3a6e';
    ctx.fillRect(0, 0, 512, 256);

    ctx.fillStyle = '#1e7845';
    ctx.beginPath();
    ctx.ellipse(140, 110, 60, 45, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(320, 100, 75, 40, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(360, 160, 40, 35, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.beginPath();
    ctx.arc(150, 90, 50, 0, Math.PI * 2);
    ctx.arc(310, 120, 70, 0, Math.PI * 2);
    ctx.arc(220, 160, 45, 0, Math.PI * 2);
    ctx.fill();

    const earthTex = new THREE.CanvasTexture(canvas);
    const earthMat = new THREE.MeshBasicMaterial({ map: earthTex });
    this.earthMesh = new THREE.Mesh(earthGeo, earthMat);
    this.earthMesh.position.set(-110, 85, -240);
    this.skyGroup.add(this.earthMesh);

    const glowGeo = new THREE.SphereGeometry(17.2, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.BackSide,
    });
    const glowMesh = new THREE.Mesh(glowGeo, glowMat);
    glowMesh.position.copy(this.earthMesh.position);
    this.skyGroup.add(glowMesh);
  }

  private buildMarsDistantMountains(): void {
    const mountainCount = 18;
    for (let i = 0; i < mountainCount; i++) {
      const angle = (i / mountainCount) * Math.PI * 2;
      const dist = 220 + Math.random() * 40;
      const x = Math.cos(angle) * dist;
      const z = Math.sin(angle) * dist;
      const radius = 25 + Math.random() * 35;
      const height = 20 + Math.random() * 35;

      const coneGeo = new THREE.ConeGeometry(radius, height, 7);
      const coneMat = new THREE.MeshStandardMaterial({
        color: 0x7c2d12,
        roughness: 0.95,
        metalness: 0.05,
        flatShading: true,
      });
      const mountain = new THREE.Mesh(coneGeo, coneMat);
      mountain.position.set(x, height / 2 - 4, z);
      this.skyGroup.add(mountain);
    }
  }

  private buildProceduralTerrain(): void {
    const geo = new THREE.PlaneGeometry(
      this.terrainSize,
      this.terrainSize,
      this.terrainSegments,
      this.terrainSegments
    );
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = this.getTerrainHeight(x, z);
      pos.setY(i, y);
    }
    geo.computeVertexNormals();

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    if (this.environment === 'moon') {
      ctx.fillStyle = '#64748b';
      ctx.fillRect(0, 0, 1024, 1024);
      for (let i = 0; i < 7000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const rad = Math.random() * 3 + 1;
        const shade = Math.floor(Math.random() * 60 + 60);
        ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 40; i++) {
        const cx = Math.random() * 1024;
        const cy = Math.random() * 1024;
        const cr = Math.random() * 28 + 12;
        ctx.fillStyle = 'rgba(20, 25, 35, 0.4)';
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(200, 215, 230, 0.25)';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#c2410c';
      ctx.fillRect(0, 0, 1024, 1024);
      for (let i = 0; i < 7000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const rad = Math.random() * 3 + 1;
        const rVal = Math.floor(Math.random() * 60 + 160);
        const gVal = Math.floor(Math.random() * 40 + 50);
        const bVal = Math.floor(Math.random() * 20 + 10);
        ctx.fillStyle = `rgb(${rVal}, ${gVal}, ${bVal})`;
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      for (let i = 0; i < 25; i++) {
        const cx = Math.random() * 1024;
        const cy = Math.random() * 1024;
        const cr = Math.random() * 35 + 15;
        ctx.fillStyle = 'rgba(70, 20, 5, 0.45)';
        ctx.beginPath();
        ctx.arc(cx, cy, cr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 8);

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.94,
      metalness: 0.06,
    });

    this.terrainMesh = new THREE.Mesh(geo, mat);
    this.terrainMesh.receiveShadow = true;
    this.scene.add(this.terrainMesh);
  }

  /**
   * Builds detailed physical 3D Landed Spacecraft / Rocket on the Moon/Mars surface
   * at the exact touchdown landing site right behind the rover.
   */
  private buildLandedSpacecraft(): void {
    const isMoon = this.environment === 'moon';
    const landerGroup = new THREE.Group();

    const landerX = 0;
    const landerZ = 14;
    const landerY = this.getTerrainHeight(landerX, landerZ);

    landerGroup.position.set(landerX, landerY, landerZ);

    const tileTex = createSpacecraftTileTexture();
    const solarTex = createSolarPanelTexture();
    const markingsTex = createMissionMarkingsTexture();

    const thermalMat = new THREE.MeshStandardMaterial({
      map: tileTex,
      color: 0xf8fafc,
      roughness: 0.35,
      metalness: 0.2,
    });
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.8,
    });
    const goldFoilMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      roughness: 0.25,
      metalness: 0.85,
    });
    const markingsMat = new THREE.MeshStandardMaterial({ map: markingsTex, roughness: 0.3 });

    // 1. Core White Cylindrical Body (ECHOES OF SPACE Rocket Stage)
    const bodyGeo = new THREE.CylinderGeometry(2.2, 2.6, 7.5, 24);
    const bodyMesh = new THREE.Mesh(bodyGeo, thermalMat);
    bodyMesh.position.y = 4.8;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    landerGroup.add(bodyMesh);

    // 2. Conical Nose Fairing with "ECHOES OF SPACE" insignia
    const fairingGeo = new THREE.CylinderGeometry(2.25, 2.25, 2.5, 24);
    const fairingMesh = new THREE.Mesh(fairingGeo, markingsMat);
    fairingMesh.position.y = 9.8;
    fairingMesh.castShadow = true;
    landerGroup.add(fairingMesh);

    // 3. Extended Solar Panel Wings
    const solarMat = new THREE.MeshStandardMaterial({ map: solarTex, roughness: 0.2, metalness: 0.7 });
    const panelGeo = new THREE.BoxGeometry(0.12, 4.2, 1.8);

    const leftPanel = new THREE.Mesh(panelGeo, solarMat);
    leftPanel.position.set(-3.2, 6.2, 0);
    leftPanel.rotation.z = -0.15;
    leftPanel.castShadow = true;
    landerGroup.add(leftPanel);

    const rightPanel = new THREE.Mesh(panelGeo, solarMat);
    rightPanel.position.set(3.2, 6.2, 0);
    rightPanel.rotation.z = 0.15;
    rightPanel.castShadow = true;
    landerGroup.add(rightPanel);

    // 4. Gold Foil Base Descent Stage
    const baseStageGeo = new THREE.CylinderGeometry(2.8, 3.4, 2.2, 8);
    const baseStageMesh = new THREE.Mesh(baseStageGeo, goldFoilMat);
    baseStageMesh.position.y = 1.1;
    baseStageMesh.castShadow = true;
    baseStageMesh.receiveShadow = true;
    landerGroup.add(baseStageMesh);

    // 5. Heavy-Duty Landing Struts & Footpads
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const strutLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.8, 12), titaniumMat);
      strutLeg.position.set(Math.cos(angle) * 3.2, 0.8, Math.sin(angle) * 3.2);
      strutLeg.rotation.z = Math.cos(angle) * 0.45;
      strutLeg.rotation.x = Math.sin(angle) * 0.45;
      strutLeg.castShadow = true;
      landerGroup.add(strutLeg);

      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.12, 16), goldFoilMat);
      pad.position.set(Math.cos(angle) * 4.2, 0.06, Math.sin(angle) * 4.2);
      pad.receiveShadow = true;
      landerGroup.add(pad);
    }

    // 6. Retro-Thruster Nozzles & Glowing Flame Plumes for live descent
    this.thrusterFlames = [];
    this.flameMaterial = new THREE.MeshBasicMaterial({
      color: isMoon ? 0x38bdf8 : 0xf97316,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const flameConeGeo = new THREE.ConeGeometry(0.6, 3.5, 12);
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const flame = new THREE.Mesh(flameConeGeo, this.flameMaterial);
      flame.position.set(Math.cos(angle) * 2.2, -1.8, Math.sin(angle) * 2.2);
      flame.rotation.x = Math.PI;
      landerGroup.add(flame);
      this.thrusterFlames.push(flame);
    }

    // 7. Scorch Mark Ground Impact Ring underneath spacecraft
    const scorchGeo = new THREE.RingGeometry(0.5, 6.2, 32);
    scorchGeo.rotateX(-Math.PI / 2);
    const scorchMat = new THREE.MeshBasicMaterial({
      color: isMoon ? 0x0f172a : 0x451a03,
      transparent: true,
      opacity: 0.75,
      side: THREE.DoubleSide,
    });
    const scorchRing = new THREE.Mesh(scorchGeo, scorchMat);
    scorchRing.position.y = 0.02;
    landerGroup.add(scorchRing);

    // 8. Navigation Light Beacon at top
    const beaconLight = new THREE.PointLight(isMoon ? 0x38bdf8 : 0xf59e0b, 3.5, 25);
    beaconLight.position.set(0, 11.5, 0);
    landerGroup.add(beaconLight);

    this.landedSpacecraftGroup = landerGroup;
    this.scene.add(landerGroup);

    // Build Parachute Canopy Group
    this.buildLandingParachute();

    // Physical collision obstacle for landed spacecraft
    this.rockObstacles.push({
      x: landerX,
      z: landerZ,
      radius: 4.8,
    });
  }

  /**
   * Builds parachute canopy for atmospheric descent on the target surface map
   */
  private buildLandingParachute(): void {
    const isMoon = this.environment === 'moon';
    const parachuteGroup = new THREE.Group();

    const chuteTex = createMarsParachuteTexture();
    const chuteGeo = new THREE.SphereGeometry(7.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const chuteMat = new THREE.MeshStandardMaterial({
      map: chuteTex,
      side: THREE.DoubleSide,
      roughness: 0.5,
      color: isMoon ? 0x38bdf8 : 0xffffff,
    });
    const chuteCanopy = new THREE.Mesh(chuteGeo, chuteMat);
    chuteCanopy.rotation.x = Math.PI;
    parachuteGroup.add(chuteCanopy);

    const lineMat = new THREE.LineBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.85 });
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      const pts = [
        new THREE.Vector3(Math.cos(a) * 7.2, 0, Math.sin(a) * 7.2),
        new THREE.Vector3(0, -14, 0),
      ];
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      parachuteGroup.add(new THREE.Line(lineGeo, lineMat));
    }

    parachuteGroup.visible = false;
    this.landingParachuteGroup = parachuteGroup;
    this.scene.add(parachuteGroup);
  }

  /**
   * Triggers live landing sequence directly on top of the surface terrain map
   */
  public triggerLandingSequence(onComplete?: () => void): void {
    this.isLandingSequenceActive = true;
    this.landingStartTime = performance.now();
    this.landingOnCompleteCallback = onComplete || null;

    const landerBaseY = this.getTerrainHeight(0, 14);

    if (this.landedSpacecraftGroup) {
      this.landedSpacecraftGroup.position.set(0, landerBaseY + 65, 14);
      this.landedSpacecraftGroup.visible = true;
    }

    if (this.landingParachuteGroup) {
      this.landingParachuteGroup.position.set(0, landerBaseY + 81, 14);
      this.landingParachuteGroup.visible = true;
    }

    // Position rover under lander initially
    this.roverPosition.set(0, landerBaseY + 65.5, 14);
    this.roverHeading = 0;
    this.currentSpeed = 0;
    this.roverGroup.position.copy(this.roverPosition);

    // Initial high descent tracking camera
    this.camera.position.set(0, landerBaseY + 72, 45);
    this.camera.lookAt(0, landerBaseY + 58, 14);
  }

  /**
   * Skips landing sequence and places spacecraft & rover immediately on driving map
   */
  public skipLandingSequence(): void {
    if (!this.isLandingSequenceActive) return;
    this.isLandingSequenceActive = false;
    const landerBaseY = this.getTerrainHeight(0, 14);

    if (this.landedSpacecraftGroup) {
      this.landedSpacecraftGroup.position.set(0, landerBaseY, 14);
    }
    if (this.landingParachuteGroup) {
      this.landingParachuteGroup.visible = false;
    }
    if (this.flameMaterial) {
      this.flameMaterial.opacity = 0;
    }

    const startZ = 6;
    const startY = this.getTerrainHeight(0, startZ);
    this.roverPosition.set(0, startY + 0.55, startZ);
    this.roverGroup.position.copy(this.roverPosition);

    const astroY = this.getTerrainHeight(2.2, startZ);
    this.astronautPosition.set(2.2, astroY, startZ);
    if (this.astronautActor) {
      if (this.roverChassis) this.roverChassis.remove(this.astronautActor.group);
      this.scene.add(this.astronautActor.group);
      this.astronautActor.group.position.copy(this.astronautPosition);
      this.astronautActor.group.rotation.set(0, Math.PI, 0);
      this.astronautActor.leftLegGroup.rotation.x = 0;
      this.astronautActor.rightLegGroup.rotation.x = 0;
      this.astronautActor.leftArmGroup.rotation.x = 0;
      this.astronautActor.rightArmGroup.rotation.x = 0;
      this.astronautActor.torsoGroup.position.y = 0.95;
    }
    this.explorationMode = 'walking';
    this.canEnterRover = true;
    this.callbacks.onRoverInteractionStateChange?.(true, false);
    this.cameraMode = 'follow';

    const callback = this.landingOnCompleteCallback;
    this.landingOnCompleteCallback = null;
    callback?.();
  }

  /**
   * Updates live touchdown descent animation frame-by-frame on surface map
   */
  private updateLandingSequence(): void {
    if (!this.isLandingSequenceActive) return;

    const elapsed = (performance.now() - this.landingStartTime) / 1000;
    const landerBaseY = this.getTerrainHeight(0, 14);

    if (elapsed < 3.0) {
      // Stage 1: Descent from high sky over surface map with parachute
      const progress = elapsed / 3.0;
      const currentY = landerBaseY + 65 - progress * 40; // 65 -> 25

      if (this.landedSpacecraftGroup) {
        this.landedSpacecraftGroup.position.set(0, currentY, 14);
      }
      if (this.landingParachuteGroup) {
        this.landingParachuteGroup.position.set(0, currentY + 16, 14);
      }
      this.roverPosition.set(0, currentY + 0.5, 14);
      this.roverGroup.position.copy(this.roverPosition);

      if (this.flameMaterial) {
        this.flameMaterial.opacity = 0.35 + Math.sin(elapsed * 12) * 0.2;
      }

      this.camera.position.set(0, currentY + 14, 42);
      this.camera.lookAt(0, currentY, 14);
    } else if (elapsed < 6.5) {
      // Stage 2: Powered Retro-Burn to Touchdown
      const progress = (elapsed - 3.0) / 3.5;
      const currentY = landerBaseY + 25 - progress * 25; // 25 -> 0 (ground)

      if (this.landedSpacecraftGroup) {
        this.landedSpacecraftGroup.position.set(0, currentY, 14);
      }
      if (this.landingParachuteGroup) {
        this.landingParachuteGroup.position.set(0, currentY + 16, 14);
      }
      this.roverPosition.set(0, currentY + 0.5, 14);
      this.roverGroup.position.copy(this.roverPosition);

      if (this.flameMaterial) {
        this.flameMaterial.opacity = progress > 0.95 ? 0 : 0.85 + Math.sin(elapsed * 20) * 0.15;
      }

      if (this.dustParticles && progress > 0.6) {
        (this.dustParticles.material as THREE.PointsMaterial).opacity = (progress - 0.6) * 2.2;
        this.dustParticles.position.set(0, landerBaseY, 14);
      }

      this.camera.position.set(12, Math.max(landerBaseY + 4, currentY + 6), 32);
      this.camera.lookAt(0, currentY + 2, 14);
    } else if (elapsed < 9.0) {
      // Stage 3: Touchdown Confirmed, Parachute Jettisons, Rover Rollout to (0, 0, 0)
      if (this.landedSpacecraftGroup) {
        this.landedSpacecraftGroup.position.set(0, landerBaseY, 14);
      }
      if (this.flameMaterial) {
        this.flameMaterial.opacity = 0;
      }
      if (this.landingParachuteGroup) {
        const pProgress = (elapsed - 6.5) / 2.5;
        this.landingParachuteGroup.position.set(pProgress * 15, landerBaseY + 16 - pProgress * 10, 14 - pProgress * 8);
      }

      const rolloutProgress = (elapsed - 6.5) / 2.5;
      const rolloutZ = 14 - rolloutProgress * 14; // 14 -> 0
      const terrainY = this.getTerrainHeight(0, rolloutZ);

      this.roverPosition.set(0, terrainY + 0.55, rolloutZ);
      this.roverGroup.position.copy(this.roverPosition);

      const wheelRot = rolloutProgress * Math.PI * 6;
      this.wheelMeshes.forEach((w) => {
        w.rotation.x = wheelRot;
      });

      this.camera.position.set(8, terrainY + 4, rolloutZ + 12);
      this.camera.lookAt(0, terrainY + 1, rolloutZ);
    } else {
      // Stage 4: Touchdown Complete & Exploration Control Unlocked!
      if (this.landedSpacecraftGroup) {
        this.landedSpacecraftGroup.position.set(0, landerBaseY, 14);
      }
      if (this.landingParachuteGroup) {
        this.landingParachuteGroup.visible = false;
      }
      const startZ = 6;
      const startY = this.getTerrainHeight(0, startZ);
      this.roverPosition.set(0, startY + 0.55, startZ);
      this.roverGroup.position.copy(this.roverPosition);

      const astroY = this.getTerrainHeight(2.2, startZ);
      this.astronautPosition.set(2.2, astroY, startZ);
      if (this.astronautActor) {
        if (this.roverChassis) this.roverChassis.remove(this.astronautActor.group);
        this.scene.add(this.astronautActor.group);
        this.astronautActor.group.position.copy(this.astronautPosition);
        this.astronautActor.group.rotation.set(0, Math.PI, 0);
        this.astronautActor.leftLegGroup.rotation.x = 0;
        this.astronautActor.rightLegGroup.rotation.x = 0;
        this.astronautActor.leftArmGroup.rotation.x = 0;
        this.astronautActor.rightArmGroup.rotation.x = 0;
        this.astronautActor.torsoGroup.position.y = 0.95;
      }
      this.explorationMode = 'walking';
      this.canEnterRover = true;
      this.callbacks.onRoverInteractionStateChange?.(true, false);

      this.isLandingSequenceActive = false;
      this.cameraMode = 'follow';

      const callback = this.landingOnCompleteCallback;
      this.landingOnCompleteCallback = null;
      callback?.();
    }
  }

  private rockObstacles: { x: number; z: number; radius: number }[] = [];

  private buildScatteredRocks(): void {
    this.rockObstacles = [];
    const rockCount = 140;
    const rockMat = new THREE.MeshStandardMaterial({
      color: this.environment === 'moon' ? 0x475569 : 0x9a3412,
      roughness: 0.92,
      metalness: 0.1,
      flatShading: true,
    });

    for (let i = 0; i < rockCount; i++) {
      const radius = 0.35 + Math.random() * 0.9;
      const rockGeo = new THREE.DodecahedronGeometry(radius, 0);

      const x = (Math.random() - 0.5) * (this.terrainSize * 0.85);
      const z = (Math.random() - 0.5) * (this.terrainSize * 0.85);

      if (Math.hypot(x, z) < 8) continue; // Keep spawn area clear

      const y = this.getTerrainHeight(x, z) + radius * 0.55;

      const rock = new THREE.Mesh(rockGeo, rockMat);
      rock.position.set(x, y, z);
      rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
      rock.castShadow = true;
      rock.receiveShadow = true;
      this.rocksGroup.add(rock);

      if (radius > 0.4) {
        this.rockObstacles.push({ x, z, radius: radius * 1.15 });
      }
    }
  }

  /**
   * Initializes visible wheel tread tracks buffer
   */
  private initWheelTracks(): void {
    while (this.wheelTracksGroup.children.length > 0) {
      const child = this.wheelTracksGroup.children[0];
      this.wheelTracksGroup.remove(child);
    }

    const maxSegments = this.maxTrackSegments;
    const vertexCount = maxSegments * 6; // 2 triangles per quad segment

    const leftGeo = new THREE.BufferGeometry();
    const rightGeo = new THREE.BufferGeometry();

    const leftPos = new Float32Array(vertexCount * 3);
    const rightPos = new Float32Array(vertexCount * 3);

    leftGeo.setAttribute('position', new THREE.BufferAttribute(leftPos, 3));
    rightGeo.setAttribute('position', new THREE.BufferAttribute(rightPos, 3));

    leftGeo.setDrawRange(0, 0);
    rightGeo.setDrawRange(0, 0);

    const trackColor = this.environment === 'moon' ? 0x1e293b : 0x541c09;
    const trackMat = new THREE.MeshStandardMaterial({
      color: trackColor,
      roughness: 0.98,
      metalness: 0.05,
      side: THREE.DoubleSide,
      polygonOffset: true,
      polygonOffsetFactor: -2.0,
      polygonOffsetUnits: -2.0,
      depthWrite: false,
      transparent: true,
      opacity: this.environment === 'moon' ? 0.82 : 0.92,
    });

    this.leftTrackGeometry = leftGeo;
    this.rightTrackGeometry = rightGeo;

    this.leftTrackMesh = new THREE.Mesh(leftGeo, trackMat);
    this.rightTrackMesh = new THREE.Mesh(rightGeo, trackMat);

    this.wheelTracksGroup.add(this.leftTrackMesh);
    this.wheelTracksGroup.add(this.rightTrackMesh);

    this.trackSegmentCount = 0;
    this.trackHead = 0;
    this.hasPreviousTrackPoint = false;
  }

  /**
   * Clears accumulated wheel tracks
   */
  public clearWheelTracks(): void {
    this.trackSegmentCount = 0;
    this.trackHead = 0;
    this.hasPreviousTrackPoint = false;
    if (this.leftTrackGeometry) this.leftTrackGeometry.setDrawRange(0, 0);
    if (this.rightTrackGeometry) this.rightTrackGeometry.setDrawRange(0, 0);
  }

  /**
   * Drops new visible tire tracks behind rover
   */
  private updateWheelTracks(): void {
    if (!this.leftTrackGeometry || !this.rightTrackGeometry) return;

    const dist = this.roverPosition.distanceTo(this.lastTrackCenterPos);
    if (dist < 0.32) return; // Only drop every 32cm of travel

    const sinH = Math.sin(this.roverHeading);
    const cosH = Math.cos(this.roverHeading);

    // Right vector on horizontal plane
    const rx = cosH;
    const rz = -sinH;

    // Track width and offset
    const wheelTrackOffset = 1.12; // meters from center
    const treadHalfWidth = 0.16; // 32cm tire tread width

    // Current Left & Right wheel contact points
    const currL = new THREE.Vector3(
      this.roverPosition.x - rx * wheelTrackOffset,
      0,
      this.roverPosition.z - rz * wheelTrackOffset
    );
    currL.y = this.getTerrainHeight(currL.x, currL.z) + 0.035;

    const currR = new THREE.Vector3(
      this.roverPosition.x + rx * wheelTrackOffset,
      0,
      this.roverPosition.z + rz * wheelTrackOffset
    );
    currR.y = this.getTerrainHeight(currR.x, currR.z) + 0.035;

    if (!this.hasPreviousTrackPoint) {
      this.lastLeftTrackPos.copy(currL);
      this.lastRightTrackPos.copy(currR);
      this.lastTrackCenterPos.copy(this.roverPosition);
      this.hasPreviousTrackPoint = true;
      return;
    }

    const prevL = this.lastLeftTrackPos;
    const prevR = this.lastRightTrackPos;

    // Build left quad vertices
    const pL0x = prevL.x - rx * treadHalfWidth;
    const pL0z = prevL.z - rz * treadHalfWidth;
    const pL0y = this.getTerrainHeight(pL0x, pL0z) + 0.035;

    const pL1x = prevL.x + rx * treadHalfWidth;
    const pL1z = prevL.z + rz * treadHalfWidth;
    const pL1y = this.getTerrainHeight(pL1x, pL1z) + 0.035;

    const pL2x = currL.x - rx * treadHalfWidth;
    const pL2z = currL.z - rz * treadHalfWidth;
    const pL2y = this.getTerrainHeight(pL2x, pL2z) + 0.035;

    const pL3x = currL.x + rx * treadHalfWidth;
    const pL3z = currL.z + rz * treadHalfWidth;
    const pL3y = this.getTerrainHeight(pL3x, pL3z) + 0.035;

    // Build right quad vertices
    const pR0x = prevR.x - rx * treadHalfWidth;
    const pR0z = prevR.z - rz * treadHalfWidth;
    const pR0y = this.getTerrainHeight(pR0x, pR0z) + 0.035;

    const pR1x = prevR.x + rx * treadHalfWidth;
    const pR1z = prevR.z + rz * treadHalfWidth;
    const pR1y = this.getTerrainHeight(pR1x, pR1z) + 0.035;

    const pR2x = currR.x - rx * treadHalfWidth;
    const pR2z = currR.z - rz * treadHalfWidth;
    const pR2y = this.getTerrainHeight(pR2x, pR2z) + 0.035;

    const pR3x = currR.x + rx * treadHalfWidth;
    const pR3z = currR.z + rz * treadHalfWidth;
    const pR3y = this.getTerrainHeight(pR3x, pR3z) + 0.035;

    const leftPosAttr = this.leftTrackGeometry.attributes.position as THREE.BufferAttribute;
    const rightPosAttr = this.rightTrackGeometry.attributes.position as THREE.BufferAttribute;

    const baseIdx = this.trackHead * 18; // 6 vertices * 3 coords = 18 floats

    // Left Triangles (v0, v1, v2) and (v2, v1, v3)
    leftPosAttr.setXYZ(this.trackHead * 6 + 0, pL0x, pL0y, pL0z);
    leftPosAttr.setXYZ(this.trackHead * 6 + 1, pL1x, pL1y, pL1z);
    leftPosAttr.setXYZ(this.trackHead * 6 + 2, pL2x, pL2y, pL2z);
    leftPosAttr.setXYZ(this.trackHead * 6 + 3, pL2x, pL2y, pL2z);
    leftPosAttr.setXYZ(this.trackHead * 6 + 4, pL1x, pL1y, pL1z);
    leftPosAttr.setXYZ(this.trackHead * 6 + 5, pL3x, pL3y, pL3z);

    // Right Triangles
    rightPosAttr.setXYZ(this.trackHead * 6 + 0, pR0x, pR0y, pR0z);
    rightPosAttr.setXYZ(this.trackHead * 6 + 1, pR1x, pR1y, pR1z);
    rightPosAttr.setXYZ(this.trackHead * 6 + 2, pR2x, pR2y, pR2z);
    rightPosAttr.setXYZ(this.trackHead * 6 + 3, pR2x, pR2y, pR2z);
    rightPosAttr.setXYZ(this.trackHead * 6 + 4, pR1x, pR1y, pR1z);
    rightPosAttr.setXYZ(this.trackHead * 6 + 5, pR3x, pR3y, pR3z);

    this.trackHead = (this.trackHead + 1) % this.maxTrackSegments;
    this.trackSegmentCount = Math.min(this.maxTrackSegments, this.trackSegmentCount + 1);

    this.leftTrackGeometry.setDrawRange(0, this.trackSegmentCount * 6);
    this.rightTrackGeometry.setDrawRange(0, this.trackSegmentCount * 6);

    leftPosAttr.needsUpdate = true;
    rightPosAttr.needsUpdate = true;

    this.lastLeftTrackPos.copy(currL);
    this.lastRightTrackPos.copy(currR);
    this.lastTrackCenterPos.copy(this.roverPosition);
  }

  /**
   * Initializes Holographic 3D Route Line
   */
  private initRouteLine(): void {
    if (this.routeLine) {
      this.scene.remove(this.routeLine);
      this.routeLine.geometry.dispose();
      (this.routeLine.material as THREE.Material).dispose();
      this.routeLine = null;
    }

    const count = 30;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const lineMat = new THREE.LineBasicMaterial({
      color: this.environment === 'moon' ? 0x38bdf8 : 0xf59e0b,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
    });

    this.routeLine = new THREE.Line(geo, lineMat);
    this.routeLine.visible = false;
    this.scene.add(this.routeLine);
  }

  /**
   * Updates 3D Holographic Route line from rover to selected target waypoint
   */
  private updateRouteLine(): void {
    if (!this.routeLine || !this.showRouteLine) {
      if (this.routeLine) this.routeLine.visible = false;
      return;
    }

    const envWaypoints = this.waypoints.filter((w) => w.environment === this.environment);
    const target = envWaypoints.find((w) => w.id === this.activeTargetWaypointId) || envWaypoints[0];

    if (!target) {
      this.routeLine.visible = false;
      return;
    }

    const posAttr = this.routeLine.geometry.attributes.position as THREE.BufferAttribute;
    const count = 30;

    const startX = this.explorationMode === 'walking' ? this.astronautPosition.x : this.roverPosition.x;
    const startZ = this.explorationMode === 'walking' ? this.astronautPosition.z : this.roverPosition.z;

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const x = THREE.MathUtils.lerp(startX, target.worldPos.x, t);
      const z = THREE.MathUtils.lerp(startZ, target.worldPos.z, t);
      // Keep holographic route tightly hugging terrain so it does not float or clip
      const y = this.getTerrainHeight(x, z) + 0.12;
      posAttr.setXYZ(i, x, y, z);
    }

    posAttr.needsUpdate = true;
    this.routeLine.visible = true;
  }

  /**
   * Toggle Route Line visibility
   */
  public setRouteLineVisible(visible: boolean): void {
    this.showRouteLine = visible;
    if (this.routeLine) this.routeLine.visible = visible;
  }

  /**
   * Set active selected target waypoint
   */
  public setSelectedTargetWaypoint(waypointId: string | null): void {
    this.activeTargetWaypointId = waypointId;
    this.updateWaypointBeacons();
  }

  private buildRoverModel(): void {
    while (this.roverGroup.children.length > 0) {
      const c = this.roverGroup.children[0];
      this.roverGroup.remove(c);
    }

    this.roverActor = createRealisticRoverModel(this.environment);
    this.roverChassis = this.roverActor.chassis;
    this.wheelMeshes = this.roverActor.wheelMeshes;
    this.wheelPivots = this.roverActor.wheelPivots;
    this.mastMesh = this.roverActor.mastMesh;
    this.headlightLeft = this.roverActor.headlightLeft;
    this.headlightRight = this.roverActor.headlightRight;

    this.roverGroup.add(this.roverActor.group);
  }

  private buildAstronautModel(): void {
    if (this.astronautActor) {
      if (this.roverChassis) this.roverChassis.remove(this.astronautActor.group);
      this.scene.remove(this.astronautActor.group);
      this.astronautActor = null;
    }

    this.astronautActor = createAstronautModel(this.environment);

    if (this.explorationMode === 'driving' && this.roverChassis) {
      this.roverChassis.add(this.astronautActor.group);
      this.astronautActor.group.position.set(0, 0.36, 0.05);
      this.astronautActor.group.rotation.set(0, 0, 0);
      setAstronautPose(this.astronautActor, 'driving');
    } else {
      this.scene.add(this.astronautActor.group);
      const y = this.getTerrainHeight(this.astronautPosition.x, this.astronautPosition.z);
      this.astronautPosition.y = y;
      this.astronautActor.group.position.copy(this.astronautPosition);
      this.astronautActor.group.rotation.set(0, this.astronautHeading, 0);
      setAstronautPose(this.astronautActor, 'standing');
    }
  }

  private buildHistoricalTraversePathway(): void {
    while (this.historicalTraverseGroup.children.length > 0) {
      const child = this.historicalTraverseGroup.children[0];
      this.historicalTraverseGroup.remove(child);
      if (child instanceof THREE.Line || child instanceof THREE.Mesh) {
        child.geometry.dispose();
      }
    }

    if (this.environment === 'moon') {
      // Historical Apollo 12 to Surveyor 3 EVA-2 Traverse across Surveyor Crater Rim
      // Apollo 12 LM Intrepid: (-45, -65), Surveyor 3: (-60, -40)
      const points = [
        new THREE.Vector3(-45, 0, -65),
        new THREE.Vector3(-48, 0, -60),
        new THREE.Vector3(-51, 0, -54),
        new THREE.Vector3(-55, 0, -47),
        new THREE.Vector3(-60, 0, -40),
      ];

      const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
      const sampleCount = 60;
      const pathPoints: THREE.Vector3[] = [];

      for (let i = 0; i <= sampleCount; i++) {
        const pt = curve.getPoint(i / sampleCount);
        pt.y = this.getTerrainHeight(pt.x, pt.z) + 0.06;
        pathPoints.push(pt);
      }

      const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
      const pathMat = new THREE.LineDashedMaterial({
        color: 0x38bdf8,
        dashSize: 1.2,
        gapSize: 0.8,
        linewidth: 2,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const pathLine = new THREE.Line(pathGeo, pathMat);
      pathLine.computeLineDistances();
      this.historicalTraverseGroup.add(pathLine);

      // Milestone stakes along the route
      [0, 0.25, 0.5, 0.75, 1.0].forEach((t) => {
        const pt = curve.getPoint(t);
        const y = this.getTerrainHeight(pt.x, pt.z);
        const stake = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.2 })
        );
        stake.position.set(pt.x, y + 0.4, pt.z);
        stake.castShadow = true;
        this.historicalTraverseGroup.add(stake);

        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        cap.position.set(pt.x, y + 0.85, pt.z);
        this.historicalTraverseGroup.add(cap);
      });
    } else {
      // Mars: Perseverance to Ingenuity Airfield Traverse (Jezero Crater 2021)
      // Perseverance: (80, -15), Ingenuity Airfield: (92, -8)
      const points = [
        new THREE.Vector3(80, 0, -15),
        new THREE.Vector3(83, 0, -13.5),
        new THREE.Vector3(87, 0, -11.0),
        new THREE.Vector3(90, 0, -9.2),
        new THREE.Vector3(92, 0, -8.0),
      ];

      const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
      const sampleCount = 50;
      const pathPoints: THREE.Vector3[] = [];

      for (let i = 0; i <= sampleCount; i++) {
        const pt = curve.getPoint(i / sampleCount);
        pt.y = this.getTerrainHeight(pt.x, pt.z) + 0.06;
        pathPoints.push(pt);
      }

      const pathGeo = new THREE.BufferGeometry().setFromPoints(pathPoints);
      const pathMat = new THREE.LineDashedMaterial({
        color: 0xf97316,
        dashSize: 1.4,
        gapSize: 0.9,
        linewidth: 2,
        transparent: true,
        opacity: 0.85,
        depthWrite: false,
      });
      const pathLine = new THREE.Line(pathGeo, pathMat);
      pathLine.computeLineDistances();
      this.historicalTraverseGroup.add(pathLine);

      // Milestone stakes along the Mars aerial reconnaissance route
      [0, 0.25, 0.5, 0.75, 1.0].forEach((t) => {
        const pt = curve.getPoint(t);
        const y = this.getTerrainHeight(pt.x, pt.z);
        const stake = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.8, 8),
          new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.8, roughness: 0.2 })
        );
        stake.position.set(pt.x, y + 0.4, pt.z);
        stake.castShadow = true;
        this.historicalTraverseGroup.add(stake);

        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(0.09, 8, 8),
          new THREE.MeshBasicMaterial({ color: 0xfde047 })
        );
        cap.position.set(pt.x, y + 0.85, pt.z);
        this.historicalTraverseGroup.add(cap);
      });
    }
  }

  public enterRover(): void {
    if (this.explorationMode === 'driving' || !this.astronautActor || !this.roverChassis) return;

    this.explorationMode = 'driving';
    this.isAstronautInRover = true;
    this.canEnterRover = false;

    this.scene.remove(this.astronautActor.group);
    this.roverChassis.add(this.astronautActor.group);
    this.astronautActor.group.position.set(0, 0.36, 0.05);
    this.astronautActor.group.rotation.set(0, 0, 0);

    setAstronautPose(this.astronautActor, 'driving');

    this.inputForward = 0;
    this.inputTurn = 0;
    this.inputBrake = false;

    this.callbacks.onRoverInteractionStateChange?.(false, true);
  }

  public exitRover(): void {
    if (this.explorationMode === 'walking' || !this.astronautActor || !this.roverChassis) return;

    this.currentSpeed = 0;
    this.inputForward = 0;
    this.inputTurn = 0;
    this.inputBrake = false;

    this.explorationMode = 'walking';
    this.isAstronautInRover = false;

    this.roverChassis.remove(this.astronautActor.group);
    this.scene.add(this.astronautActor.group);

    const sinH = Math.sin(this.roverHeading);
    const cosH = Math.cos(this.roverHeading);
    const exitX = this.roverPosition.x - cosH * 2.0;
    const exitZ = this.roverPosition.z + sinH * 2.0;
    const exitY = this.getTerrainHeight(exitX, exitZ);

    this.astronautPosition.set(exitX, exitY, exitZ);
    this.astronautHeading = this.roverHeading;
    this.astronautSpeed = 0;

    this.astronautActor.group.position.copy(this.astronautPosition);
    this.astronautActor.group.rotation.set(0, this.astronautHeading, 0);

    setAstronautPose(this.astronautActor, 'standing');

    this.canEnterRover = true;
    this.callbacks.onRoverInteractionStateChange?.(true, false);
  }

  public toggleRoverEnterExit(): void {
    if (this.explorationMode === 'walking') {
      if (this.canEnterRover) {
        this.enterRover();
      }
    } else {
      this.exitRover();
    }
  }

  private buildDustParticles(): void {
    const count = 160;
    this.dustGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const opacities = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 1.5;
      positions[i * 3 + 1] = Math.random() * 0.4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      opacities[i] = Math.random();
    }

    this.dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const dustMat = new THREE.PointsMaterial({
      size: 0.45,
      color: this.environment === 'moon' ? 0x94a3b8 : 0xd97736,
      transparent: true,
      opacity: 0,
      blending: THREE.NormalBlending,
    });

    this.dustParticles = new THREE.Points(this.dustGeometry, dustMat);
    this.scene.add(this.dustParticles);
  }

  /**
   * Builds/Updates 3D Holographic Waypoint Beacons on the Terrain
   */
  public updateWaypointBeacons(): void {
    while (this.beaconsGroup.children.length > 0) {
      const child = this.beaconsGroup.children[0];
      this.beaconsGroup.remove(child);
    }

    const envWaypoints = this.waypoints.filter((w) => w.environment === this.environment);

    envWaypoints.forEach((wp) => {
      const isTarget = wp.id === this.activeTargetWaypointId;
      const beaconGroup = new THREE.Group();
      const h = this.getTerrainHeight(wp.worldPos.x, wp.worldPos.z);
      beaconGroup.position.set(wp.worldPos.x, h, wp.worldPos.z);

      let colorHex = wp.discovered ? 0x10b981 : 0x38bdf8;
      if (isTarget && !wp.discovered) {
        colorHex = 0xf59e0b; // Gold for active target
      }

      // Subtle Light Pillar
      const pillarGeo = new THREE.CylinderGeometry(0.1, isTarget ? 0.3 : 0.2, isTarget ? 14 : 10, 12);
      const pillarMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: isTarget ? 0.35 : 0.2,
        depthWrite: false,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(0, isTarget ? 7.0 : 5.0, 0);
      beaconGroup.add(pillar);

      // Hovering Diamond / Marker Crystal - low height right over artifact
      const crystalGeo = new THREE.OctahedronGeometry(isTarget ? 0.9 : 0.7, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: isTarget ? 0.95 : 0.7,
        metalness: 0.8,
        roughness: 0.2,
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(0, isTarget ? 2.0 : 1.7, 0);
      crystal.userData = { isCrystal: true, isTarget };
      beaconGroup.add(crystal);

      // Physical 3D Spacecraft Hardware Model on the Surface
      const hwModel = this.create3DHardwareModel(wp);
      beaconGroup.add(hwModel);

      // Add physical collision obstacle for this hardware location
      this.rockObstacles.push({
        x: wp.worldPos.x,
        z: wp.worldPos.z,
        radius: 2.2,
      });

      // Ground Pulsing Ring
      const ringGeo = new THREE.RingGeometry(isTarget ? 2.5 : 1.8, isTarget ? 3.2 : 2.2, 24);
      ringGeo.rotateX(-Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: isTarget ? 0.85 : 0.65,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 0.1, 0);
      beaconGroup.add(ring);

      // 3D Rectangular Floating Name Banner (Eye-level directly over artifact)
      const nameBanner = this.create3DNameBanner(wp.name, colorHex, wp.landingYear);
      beaconGroup.add(nameBanner);

      this.beaconsGroup.add(beaconGroup);
    });
  }

  /**
   * Creates a 3D Rectangular Name Banner using procedural HTML canvas texture with Mission Name and Landing Year
   */
  private create3DNameBanner(name: string, colorHex: number, landingYear?: number): THREE.Mesh {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 140;
    const ctx = canvas.getContext('2d')!;

    const hexStr = '#' + colorHex.toString(16).padStart(6, '0');

    // Rounded rectangle background
    ctx.fillStyle = 'rgba(6, 10, 22, 0.94)';
    ctx.strokeStyle = hexStr;
    ctx.lineWidth = 6;

    const x = 8, y = 8, w = 496, h = 124, r = 16;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Mission Title - crisp and legible
    ctx.font = 'bold 27px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    let displayTitle = name;
    if (displayTitle.length > 25) {
      displayTitle = displayTitle.substring(0, 23) + '...';
    }
    ctx.fillText(displayTitle, 256, 48);

    // Mission Landing Year Subtitle
    ctx.font = 'bold 19px monospace';
    ctx.fillStyle = hexStr;
    const yearLabel = landingYear ? `HISTORIC YEAR • ${landingYear}` : 'EXPLORATION SITE';
    ctx.fillText(yearLabel, 256, 92);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;

    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    // Proportional banner (3.8m wide by 1.2m tall) positioned directly over artifact at natural eye level (2.4m)
    const planeGeo = new THREE.PlaneGeometry(3.8, 1.2);
    const mesh = new THREE.Mesh(planeGeo, mat);
    mesh.position.set(0, 2.4, 0);
    mesh.userData = { isNameBanner: true };
    return mesh;
  }

  /**
   * Generates procedural 3D physical hardware model for Moon & Mars missions
   */
  private create3DHardwareModel(wp: SurfaceWaypoint): THREE.Group {
    const hw = new THREE.Group();
    const isMoon = wp.environment === 'moon';
    const id = wp.id.toLowerCase();

    if (id.includes('apollo') || id.includes('tranquility') || id.includes('intrepid') || id.includes('antares')) {
      // Apollo LM Descent Stage
      const goldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
      const darkMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 });

      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 2.4), goldMat);
      body.position.y = 0.9;
      hw.add(body);

      const bell = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.8, 12, 1, true), darkMat);
      bell.position.y = 0.2;
      bell.rotation.x = Math.PI;
      hw.add(bell);

      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8), darkMat);
        leg.position.set(Math.cos(angle) * 1.5, 0.45, Math.sin(angle) * 1.5);
        leg.rotation.z = Math.cos(angle) * 0.4;
        leg.rotation.x = Math.sin(angle) * 0.4;
        hw.add(leg);

        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.06, 12), goldMat);
        pad.position.set(Math.cos(angle) * 1.9, 0.03, Math.sin(angle) * 1.9);
        hw.add(pad);
      }
    } else if (id.includes('lrv') || id.includes('roving')) {
      // Lunar Roving Vehicle
      const frameMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.3 });
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x334155, wireframe: true });

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.2, 1.8), frameMat);
      chassis.position.y = 0.35;
      hw.add(chassis);

      [[-0.65, 0.65], [0.65, 0.65], [-0.65, -0.65], [0.65, -0.65]].forEach(([wx, wz]) => {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12), wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(wx, 0.3, wz);
        hw.add(w);
      });

      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3), frameMat);
      dish.position.set(0, 0.9, 0.5);
      dish.rotation.x = -Math.PI / 4;
      hw.add(dish);
    } else if (id.includes('viking')) {
      // Viking Lander
      const metalMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.7, roughness: 0.3 });

      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.6, 6), metalMat);
      body.position.y = 0.5;
      hw.add(body);

      for (let i = 0; i < 3; i++) {
        const angle = (i * Math.PI * 2) / 3;
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 10), metalMat);
        pad.position.set(Math.cos(angle) * 1.6, 0.03, Math.sin(angle) * 1.6);
        hw.add(pad);
      }

      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8, 0, Math.PI * 2, 0, Math.PI / 3), metalMat);
      dish.position.set(0.3, 1.0, 0);
      dish.rotation.x = -0.6;
      hw.add(dish);
    } else if (id.includes('ingenuity')) {
      // Ingenuity Mars Helicopter
      const metalMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, roughness: 0.3 });
      const carbonMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 });

      const box = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.25, 0.3), metalMat);
      box.position.y = 0.35;
      hw.add(box);

      for (let i = 0; i < 4; i++) {
        const angle = (i * Math.PI) / 2 + Math.PI / 4;
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.45), carbonMat);
        leg.position.set(Math.cos(angle) * 0.25, 0.18, Math.sin(angle) * 0.25);
        leg.rotation.z = Math.cos(angle) * 0.5;
        leg.rotation.x = Math.sin(angle) * 0.5;
        hw.add(leg);
      }

      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.5), carbonMat);
      shaft.position.y = 0.6;
      hw.add(shaft);

      const blade1 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.01, 0.08), carbonMat);
      blade1.position.y = 0.7;
      hw.add(blade1);

      const blade2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.01, 0.08), carbonMat);
      blade2.position.y = 0.8;
      blade2.rotation.y = Math.PI / 2;
      hw.add(blade2);
    } else if (id.includes('insight')) {
      // InSight Lander
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xcbd5e1, metalness: 0.7 });
      const solarMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, metalness: 0.5, roughness: 0.6 });

      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.4, 12), bodyMat);
      body.position.y = 0.4;
      hw.add(body);

      [-1.3, 1.3].forEach((offset) => {
        const wing = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.02, 16), solarMat);
        wing.position.set(offset, 0.45, 0);
        hw.add(wing);
      });

      const dome = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), bodyMat);
      dome.position.set(0.9, 0, 0.9);
      hw.add(dome);
    } else {
      // Generic Rover / Lander Hardware
      const bodyMat = new THREE.MeshStandardMaterial({
        color: isMoon ? 0xe2e8f0 : 0xd97706,
        metalness: 0.75,
        roughness: 0.3,
      });

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.8), bodyMat);
      chassis.position.y = 0.5;
      hw.add(chassis);

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.1), bodyMat);
      mast.position.set(0, 1.0, 0.6);
      hw.add(mast);

      const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.2), bodyMat);
      head.position.set(0, 1.5, 0.6);
      hw.add(head);
    }

    return hw;
  }

  /**
   * Sets control input (for virtual mobile joystick and touch buttons)
   */
  public setControlInput(forward: number, turn: number, brake: boolean): void {
    if (this.isPaused && (forward !== 0 || turn !== 0)) {
      this.isPaused = false;
      this.callbacks.onPauseChange?.(false);
    }
    this.inputForward = THREE.MathUtils.clamp(forward, -1, 1);
    this.inputTurn = THREE.MathUtils.clamp(turn, -1, 1);
    this.inputBrake = brake;
  }

  /**
   * Sets continuous mobile analog joystick vector
   * @param x Left/right [-1.0 to 1.0]
   * @param y Forward/backward [-1.0 to 1.0]
   */
  public setJoystickInput(x: number, y: number): void {
    if (this.isPaused && (x !== 0 || y !== 0)) {
      this.isPaused = false;
      this.callbacks.onPauseChange?.(false);
    }
    const mag = Math.hypot(x, y);
    if (mag > 0.05) {
      this.joystickActive = true;
      // Strictly normalize so diagonal movement is never faster than straight movement
      const norm = Math.min(1.0, mag);
      this.joystickX = (x / mag) * norm;
      this.joystickY = (y / mag) * norm;
    } else {
      this.joystickActive = false;
      this.joystickX = 0;
      this.joystickY = 0;
    }
  }

  /**
   * Recenters camera behind the current active character / vehicle
   */
  public recenterCamera(): void {
    this.cameraOrbit.theta = 0;
    this.cameraOrbit.phi = Math.PI / 3.2;
    this.cameraMode = 'follow';
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (['ArrowUp', 'KeyW'].includes(e.code)) this.inputForward = 1;
    if (['ArrowDown', 'KeyS'].includes(e.code)) this.inputForward = -1;
    if (['ArrowLeft', 'KeyA'].includes(e.code)) this.inputTurn = -1;
    if (['ArrowRight', 'KeyD'].includes(e.code)) this.inputTurn = 1;
    if (['Space'].includes(e.code)) this.inputBrake = true;

    // Enter / Exit Rover via keyboard [E] or [R]
    if (['KeyE', 'KeyR'].includes(e.code)) {
      this.toggleRoverEnterExit();
    }

    if (e.code === 'KeyP') {
      this.togglePaused();
    }

    if (e.code === 'KeyC') {
      const modes: RoverCameraMode[] = ['follow', 'cockpit', 'free'];
      const nextIdx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
      this.cameraMode = modes[nextIdx];
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    if (['ArrowUp', 'KeyW'].includes(e.code) && this.inputForward === 1) this.inputForward = 0;
    if (['ArrowDown', 'KeyS'].includes(e.code) && this.inputForward === -1) this.inputForward = 0;
    if (['ArrowLeft', 'KeyA'].includes(e.code) && this.inputTurn === -1) this.inputTurn = 0;
    if (['ArrowRight', 'KeyD'].includes(e.code) && this.inputTurn === 1) this.inputTurn = 0;
    if (['Space'].includes(e.code)) this.inputBrake = false;
  }

  private handlePointerDown(e: PointerEvent): void {
    this.isPointerDown = true;
    this.previousPointerPos = { x: e.clientX, y: e.clientY };
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.isPointerDown) return;
    const dx = e.clientX - this.previousPointerPos.x;
    const dy = e.clientY - this.previousPointerPos.y;

    this.cameraOrbit.theta -= dx * 0.008;
    this.cameraOrbit.phi = THREE.MathUtils.clamp(
      this.cameraOrbit.phi - dy * 0.008,
      0.15,
      Math.PI / 2 - 0.05
    );

    this.previousPointerPos = { x: e.clientX, y: e.clientY };
  }

  private handlePointerUp(): void {
    this.isPointerDown = false;
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    this.cameraOrbit.radius = THREE.MathUtils.clamp(
      this.cameraOrbit.radius + e.deltaY * 0.015,
      4,
      28
    );
  }

  private setupControlListeners(): void {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', this.boundPointerDown);
    window.addEventListener('pointermove', this.boundPointerMove);
    window.addEventListener('pointerup', this.boundPointerUp);
    dom.addEventListener('wheel', this.boundWheel, { passive: false });
    window.addEventListener('resize', this.handleResize);
  }

  private handleResize = () => {
    if (!this.container) return;
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  public setEnvironment(env: 'moon' | 'mars'): void {
    if (this.environment === env) return;
    this.environment = env;
    this.signalDelaySec = env === 'moon' ? 1.28 : 252.0;

    // Clear old sky, lights, rocks, tracks
    while (this.skyGroup.children.length > 0) {
      this.skyGroup.remove(this.skyGroup.children[0]);
    }
    while (this.rocksGroup.children.length > 0) {
      this.rocksGroup.remove(this.rocksGroup.children[0]);
    }
    if (this.terrainMesh) {
      this.scene.remove(this.terrainMesh);
      this.terrainMesh.geometry.dispose();
      (this.terrainMesh.material as THREE.Material).dispose();
      this.terrainMesh = null;
    }

    this.renderer.toneMappingExposure = env === 'moon' ? 1.2 : 1.05;

    this.buildLightingAndAtmosphere();
    this.buildProceduralTerrain();
    this.buildLandedSpacecraft();
    this.buildScatteredRocks();
    this.initWheelTracks();
    this.initRouteLine();
    this.buildRoverModel();
    this.buildAstronautModel();
    this.buildHistoricalTraversePathway();
    this.updateWaypointBeacons();
    this.resetRoverPosition();
  }

  public setCameraMode(mode: RoverCameraMode): void {
    this.cameraMode = mode;
  }

  public setPaused(paused: boolean): void {
    this.isPaused = paused;
    this.callbacks.onPauseChange?.(paused);
  }

  public togglePaused(): boolean {
    this.isPaused = !this.isPaused;
    this.callbacks.onPauseChange?.(this.isPaused);
    return this.isPaused;
  }

  public resetRoverPosition(): void {
    this.roverPosition.set(0, 0, 6);
    const h = this.getTerrainHeight(0, 6);
    this.roverPosition.y = h + 0.55;
    this.roverHeading = 0;
    this.currentSpeed = 0;
    this.roverGroup.position.copy(this.roverPosition);
    this.roverGroup.rotation.set(0, 0, 0);

    const astroY = this.getTerrainHeight(2.2, 6);
    this.astronautPosition.set(2.2, astroY, 6);
    this.astronautHeading = 0;
    this.astronautSpeed = 0;
    if (this.astronautActor) {
      if (this.roverChassis) this.roverChassis.remove(this.astronautActor.group);
      this.scene.add(this.astronautActor.group);
      this.astronautActor.group.position.copy(this.astronautPosition);
      this.astronautActor.group.rotation.set(0, Math.PI, 0);
      setAstronautPose(this.astronautActor, 'standing');
    }
    this.explorationMode = 'walking';
    this.canEnterRover = true;
    this.callbacks.onRoverInteractionStateChange?.(true, false);

    this.cameraOrbit.theta = 0;
    this.clearWheelTracks();
  }

  public markWaypointDiscovered(waypointId: string): void {
    const wp = this.waypoints.find((w) => w.id === waypointId);
    if (wp) {
      wp.discovered = true;
      this.updateWaypointBeacons();
      this.callbacks.onWaypointsUpdate?.(this.waypoints);
    }
  }

  public getWaypoints(): SurfaceWaypoint[] {
    return this.waypoints;
  }

  public setQuality(quality: GraphicsQuality): void {
    if (this.renderer) {
      this.renderer.setPixelRatio(quality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1);
    }
  }

  private startLoop(): void {
    const clock = new THREE.Clock();

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);
      const delta = Math.min(0.1, clock.getDelta());

      if (this.isLandingSequenceActive) {
        this.updateLandingSequence();
      } else {
        if (!this.isPaused) {
          if (this.explorationMode === 'driving') {
            // 1. Rover Driving Physics
            this.updateRoverPhysics(delta);

            // 2. Visible Wheel Tracks
            this.updateWheelTracks();
          } else {
            // 1. Astronaut Walking Physics
            this.updateAstronautPhysics(delta);
          }
        }

        // 3. Camera Tracking
        this.updateCamera(delta);
      }

      // 4. Waypoint Proximity Check & Beacons Animation
      this.updateProximityAndBeacons(clock.getElapsedTime());

      // 5. Holographic 3D Route Line
      this.updateRouteLine();

      // 6. Render
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  private updateRoverPhysics(delta: number): void {
    const accelRate = 18.0;
    const decelRate = 8.0;
    const brakeRate = 22.0;
    const steerSpeed = 3.2;

    // Acceleration / Deceleration
    if (this.inputBrake) {
      if (this.currentSpeed > 0) {
        this.currentSpeed = Math.max(0, this.currentSpeed - brakeRate * delta);
      } else if (this.currentSpeed < 0) {
        this.currentSpeed = Math.min(0, this.currentSpeed + brakeRate * delta);
      }
    } else if (this.inputForward > 0) {
      this.currentSpeed = Math.min(this.topSpeedMps, this.currentSpeed + accelRate * delta);
    } else if (this.inputForward < 0) {
      this.currentSpeed = Math.max(this.reverseSpeedMps, this.currentSpeed - accelRate * delta);
    } else {
      if (this.currentSpeed > 0) {
        this.currentSpeed = Math.max(0, this.currentSpeed - decelRate * delta);
      } else if (this.currentSpeed < 0) {
        this.currentSpeed = Math.min(0, this.currentSpeed + decelRate * delta);
      }
    }

    const isMoving = Math.abs(this.currentSpeed) > 0.1;
    const effectiveSteerSpeed = isMoving ? steerSpeed : steerSpeed * 0.85;

    if (this.inputTurn !== 0) {
      this.roverHeading -= this.inputTurn * effectiveSteerSpeed * delta;
    }

    // Move Rover with Collision Detection
    const moveDist = this.currentSpeed * delta;
    let nextX = this.roverPosition.x - Math.sin(this.roverHeading) * moveDist;
    let nextZ = this.roverPosition.z - Math.cos(this.roverHeading) * moveDist;

    // Rock & Spacecraft Physical Collision Physics
    const roverRadius = 1.2;
    for (const obs of this.rockObstacles) {
      const dx = nextX - obs.x;
      const dz = nextZ - obs.z;
      const dist = Math.hypot(dx, dz);
      const minDist = obs.radius + roverRadius;

      if (dist < minDist && dist > 0.001) {
        const overlap = minDist - dist;
        const nx = dx / dist;
        const nz = dz / dist;

        // Push rover outward to prevent driving inside rocks
        nextX += nx * overlap;
        nextZ += nz * overlap;

        // Dampen velocity on impact
        this.currentSpeed *= 0.25;
      }
    }

    // Keep within terrain boundaries
    const bound = this.terrainSize * 0.46;
    this.roverPosition.x = THREE.MathUtils.clamp(nextX, -bound, bound);
    this.roverPosition.z = THREE.MathUtils.clamp(nextZ, -bound, bound);

    // Terrain Clamping & Tilt Alignment
    const currentH = this.getTerrainHeight(this.roverPosition.x, this.roverPosition.z);
    this.roverPosition.y = currentH + 0.55;
    this.roverGroup.position.copy(this.roverPosition);

    // Compute Pitch & Roll from terrain surface slope
    const normal = this.getTerrainNormal(this.roverPosition.x, this.roverPosition.z);
    const forwardVec = new THREE.Vector3(-Math.sin(this.roverHeading), 0, -Math.cos(this.roverHeading));
    const rightVec = new THREE.Vector3(forwardVec.z, 0, -forwardVec.x);

    const pitch = forwardVec.dot(normal) * 0.75;
    const roll = -rightVec.dot(normal) * 0.75;

    this.roverGroup.rotation.set(pitch, this.roverHeading, roll, 'YXZ');

    // Wheels rotation & steering
    const wheelRotDelta = moveDist / 0.35;
    this.wheelMeshes.forEach((w) => {
      w.rotation.x += wheelRotDelta;
    });

    const targetSteerAngle = this.inputTurn * 0.35;
    this.wheelPivots.forEach((p, idx) => {
      const mesh = this.wheelMeshes[idx];
      if (mesh.userData.steerable) {
        const factor = mesh.userData.isRear ? -1 : 1;
        p.rotation.y = THREE.MathUtils.lerp(p.rotation.y, targetSteerAngle * factor, 0.15);
      }
    });

    if (this.mastMesh) {
      this.mastMesh.rotation.y = THREE.MathUtils.lerp(this.mastMesh.rotation.y, -this.inputTurn * 0.3, 0.08);
    }

    // Accumulate odometry & battery
    if (Math.abs(moveDist) > 0.001) {
      this.distanceTraveledMeters += Math.abs(moveDist);
      this.batteryPercent = Math.max(5.0, this.batteryPercent - (delta * 0.012));
    } else {
      this.batteryPercent = Math.min(100.0, this.batteryPercent + (delta * 0.004));
    }

    // Dust particles during movement
    if (this.dustParticles && Math.abs(this.currentSpeed) > 0.8) {
      (this.dustParticles.material as THREE.PointsMaterial).opacity = 0.65;
      this.dustParticles.position.set(
        this.roverPosition.x + (Math.random() - 0.5) * 0.6,
        this.roverPosition.y - 0.3,
        this.roverPosition.z + (Math.random() - 0.5) * 0.6
      );
    } else if (this.dustParticles) {
      (this.dustParticles.material as THREE.PointsMaterial).opacity = 0;
    }

    const speedKmh = Math.round(Math.abs(this.currentSpeed) * 3.6 * 10) / 10;
    const headingDeg = Math.round(((this.roverHeading * (180 / Math.PI)) % 360 + 360) % 360);
    const inclineDeg = Math.round(Math.abs(pitch) * (180 / Math.PI));

    const driveMode: 'DRIVE' | 'REVERSE' | 'PARKED' =
      this.currentSpeed > 0.1 ? 'DRIVE' : this.currentSpeed < -0.1 ? 'REVERSE' : 'PARKED';

    this.callbacks.onTelemetryUpdate?.({
      speedKmh,
      batteryPercent: Math.round(this.batteryPercent * 10) / 10,
      distanceTraveledMeters: Math.round(this.distanceTraveledMeters),
      headingDeg,
      inclineDeg,
      signalDelaySec: this.signalDelaySec,
      coordinates: {
        x: Math.round(this.roverPosition.x * 10) / 10,
        z: Math.round(this.roverPosition.z * 10) / 10,
      },
      isBraking: this.inputBrake,
      driveMode,
    });
  }

  private updateAstronautPhysics(delta: number): void {
    const walkSpeedMax = 2.8; // m/s (~10 km/h)
    const accelRate = 12.0;
    const decelRate = 9.0;
    const steerSpeed = 3.4;

    if (this.inputBrake) {
      this.astronautSpeed = THREE.MathUtils.lerp(this.astronautSpeed, 0, delta * 14);
    } else if (this.joystickActive) {
      // Continuous mobile analog joystick
      const mag = Math.hypot(this.joystickX, this.joystickY);
      const targetSpeed = walkSpeedMax * mag;
      this.astronautSpeed = THREE.MathUtils.lerp(this.astronautSpeed, targetSpeed, delta * accelRate);

      // Desired heading relative to camera horizontal view
      const camAngle = Math.atan2(
        this.astronautPosition.x - this.camera.position.x,
        this.astronautPosition.z - this.camera.position.z
      );
      const joyAngle = Math.atan2(-this.joystickX, -this.joystickY);
      const desiredHeading = camAngle + joyAngle;

      let angleDiff = desiredHeading - this.astronautHeading;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.astronautHeading += angleDiff * Math.min(1.0, delta * 11);
    } else if (this.inputForward > 0) {
      this.astronautSpeed = Math.min(walkSpeedMax, this.astronautSpeed + accelRate * delta);
    } else if (this.inputForward < 0) {
      this.astronautSpeed = Math.max(-1.4, this.astronautSpeed - accelRate * delta);
    } else {
      this.astronautSpeed = THREE.MathUtils.lerp(this.astronautSpeed, 0, delta * decelRate);
    }

    if (!this.joystickActive && this.inputTurn !== 0) {
      this.astronautHeading -= this.inputTurn * steerSpeed * delta;
    }

    const moveDist = this.astronautSpeed * delta;
    let nextX = this.astronautPosition.x - Math.sin(this.astronautHeading) * moveDist;
    let nextZ = this.astronautPosition.z - Math.cos(this.astronautHeading) * moveDist;

    // 1. Rock obstacle collision
    const astronautRadius = 0.55;
    for (const obs of this.rockObstacles) {
      const dx = nextX - obs.x;
      const dz = nextZ - obs.z;
      const dist = Math.hypot(dx, dz);
      const minDist = obs.radius + astronautRadius;
      if (dist < minDist && dist > 0.001) {
        const overlap = minDist - dist;
        nextX += (dx / dist) * overlap;
        nextZ += (dz / dist) * overlap;
        this.astronautSpeed *= 0.3;
      }
    }

    // 2. Rover physical collision (cannot walk through rover body)
    const roverCollisionRadius = 1.7;
    const dxR = nextX - this.roverPosition.x;
    const dzR = nextZ - this.roverPosition.z;
    const distRover = Math.hypot(dxR, dzR);
    if (distRover < roverCollisionRadius && distRover > 0.001) {
      const overlap = roverCollisionRadius - distRover;
      nextX += (dxR / distRover) * overlap;
      nextZ += (dzR / distRover) * overlap;
      this.astronautSpeed *= 0.25;
    }

    // 3. Terrain boundaries
    const bound = this.terrainSize * 0.46;
    this.astronautPosition.x = THREE.MathUtils.clamp(nextX, -bound, bound);
    this.astronautPosition.z = THREE.MathUtils.clamp(nextZ, -bound, bound);
    this.astronautPosition.y = this.getTerrainHeight(this.astronautPosition.x, this.astronautPosition.z);

    if (this.astronautActor) {
      this.astronautActor.group.position.copy(this.astronautPosition);
      this.astronautActor.group.rotation.set(0, this.astronautHeading, 0);

      const isMoving = Math.abs(this.astronautSpeed) > 0.08;
      updateAstronautAnimation(this.astronautActor, isMoving, this.astronautSpeed, delta);
    }

    if (Math.abs(moveDist) > 0.001) {
      this.distanceTraveledMeters += Math.abs(moveDist);
      this.batteryPercent = Math.max(10.0, this.batteryPercent - (delta * 0.005));
    }

    const speedKmh = Math.round(Math.abs(this.astronautSpeed) * 3.6 * 10) / 10;
    const headingDeg = Math.round(((this.astronautHeading * (180 / Math.PI)) % 360 + 360) % 360);

    const driveMode: 'DRIVE' | 'REVERSE' | 'PARKED' =
      this.astronautSpeed > 0.1 ? 'DRIVE' : this.astronautSpeed < -0.1 ? 'REVERSE' : 'PARKED';

    this.callbacks.onTelemetryUpdate?.({
      speedKmh,
      batteryPercent: Math.round(this.batteryPercent * 10) / 10,
      distanceTraveledMeters: Math.round(this.distanceTraveledMeters),
      headingDeg,
      inclineDeg: 0,
      signalDelaySec: this.signalDelaySec,
      coordinates: {
        x: Math.round(this.astronautPosition.x * 10) / 10,
        z: Math.round(this.astronautPosition.z * 10) / 10,
      },
      isBraking: this.inputBrake,
      driveMode,
    });
  }

  private updateCamera(delta: number): void {
    const focalPos = this.explorationMode === 'walking' ? this.astronautPosition : this.roverPosition;
    const focalHeading = this.explorationMode === 'walking' ? this.astronautHeading : this.roverHeading;

    if (this.cameraMode === 'follow') {
      const distBehind = this.explorationMode === 'walking' ? 5.2 : 7.5;
      const heightAbove = this.explorationMode === 'walking' ? 2.4 : 3.6;

      const totalHeading = focalHeading + this.cameraOrbit.theta;
      const targetX = focalPos.x + Math.sin(totalHeading) * distBehind;
      const targetZ = focalPos.z + Math.cos(totalHeading) * distBehind;

      // Collision-aware camera: ensure targetY is safely above terrain height at (targetX, targetZ)
      const terrainAtCam = this.getTerrainHeight(targetX, targetZ);
      const targetY = Math.max(focalPos.y + heightAbove, terrainAtCam + 1.2);

      this.camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.12);
      this.camera.lookAt(
        focalPos.x,
        focalPos.y + (this.explorationMode === 'walking' ? 1.0 : 1.2),
        focalPos.z
      );
    } else if (this.cameraMode === 'cockpit') {
      const eyeX = focalPos.x - Math.sin(focalHeading) * 0.2;
      const eyeZ = focalPos.z - Math.cos(focalHeading) * 0.2;
      const eyeY = focalPos.y + (this.explorationMode === 'walking' ? 1.65 : 1.8);

      this.camera.position.set(eyeX, eyeY, eyeZ);

      const lookTargetX = focalPos.x - Math.sin(focalHeading) * 20;
      const lookTargetZ = focalPos.z - Math.cos(focalHeading) * 20;
      this.camera.lookAt(lookTargetX, eyeY - 0.2, lookTargetZ);
    } else if (this.cameraMode === 'free') {
      const r = this.cameraOrbit.radius;
      const t = this.cameraOrbit.theta;
      const p = this.cameraOrbit.phi;

      const camX = focalPos.x + r * Math.sin(p) * Math.sin(t);
      const camY = focalPos.y + r * Math.cos(p);
      const camZ = focalPos.z + r * Math.sin(p) * Math.cos(t);

      this.camera.position.set(camX, Math.max(focalPos.y + 1, camY), camZ);
      this.camera.lookAt(
        focalPos.x,
        focalPos.y + 0.8,
        focalPos.z
      );
    }
  }

  private updateProximityAndBeacons(elapsedTime: number): void {
    this.beaconsGroup.children.forEach((beacon) => {
      const crystal = beacon.children.find((c) => c.userData.isCrystal);
      if (crystal) {
        crystal.rotation.y = elapsedTime * (crystal.userData.isTarget ? 2.5 : 1.5);
        crystal.position.y = (crystal.userData.isTarget ? 2.0 : 1.7) + Math.sin(elapsedTime * 2.0) * 0.12;
      }
      const nameBanner = beacon.children.find((c) => c.userData.isNameBanner);
      if (nameBanner) {
        nameBanner.position.set(0, crystal?.userData.isTarget ? 2.6 : 2.3, 0);
        nameBanner.quaternion.copy(this.camera.quaternion);
      }
    });

    if (this.earthMesh) {
      this.earthMesh.rotation.y = elapsedTime * 0.04;
    }

    const envWaypoints = this.waypoints.filter((w) => w.environment === this.environment);
    let closestWp: SurfaceWaypoint | null = null;
    let minD = 9999;

    const activeExplorerPos = this.explorationMode === 'walking' ? this.astronautPosition : this.roverPosition;

    envWaypoints.forEach((wp) => {
      const d = Math.hypot(
        activeExplorerPos.x - wp.worldPos.x,
        activeExplorerPos.z - wp.worldPos.z
      );
      if (d < minD) {
        minD = d;
        closestWp = wp;
      }
    });

    this.nearestDistance = Math.round(minD * 10) / 10;
    this.nearestWaypoint = closestWp;

    if (minD <= 15 && closestWp) {
      this.callbacks.onAnomalyProximity?.(closestWp, this.nearestDistance);
    } else {
      this.callbacks.onAnomalyProximity?.(null, this.nearestDistance);
    }

    // Distance to rover check when walking (within 3.8m can enter vehicle)
    if (this.explorationMode === 'walking') {
      const distToRover = Math.hypot(
        this.astronautPosition.x - this.roverPosition.x,
        this.astronautPosition.z - this.roverPosition.z
      );
      const canEnter = distToRover <= 3.8;
      if (canEnter !== this.canEnterRover) {
        this.canEnterRover = canEnter;
        this.callbacks.onRoverInteractionStateChange?.(canEnter, false);
      }
    } else {
      this.callbacks.onRoverInteractionStateChange?.(false, true);
    }
  }

  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('pointermove', this.boundPointerMove);
    window.removeEventListener('pointerup', this.boundPointerUp);
    window.removeEventListener('resize', this.handleResize);

    const dom = this.renderer.domElement;
    if (dom) {
      dom.removeEventListener('pointerdown', this.boundPointerDown);
      dom.removeEventListener('wheel', this.boundWheel);
    }

    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line || obj instanceof THREE.Points) {
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
