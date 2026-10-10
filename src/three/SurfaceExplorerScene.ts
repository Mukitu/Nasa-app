import * as THREE from 'three';
import { SurfaceWaypoint, RoverTelemetry, RoverCameraMode, GraphicsQuality } from '../types/simulation';

export interface SurfaceSceneCallbacks {
  onTelemetryUpdate?: (telemetry: RoverTelemetry) => void;
  onAnomalyProximity?: (waypoint: SurfaceWaypoint | null, distanceMeters: number) => void;
  onWaypointsUpdate?: (waypoints: SurfaceWaypoint[]) => void;
  onPauseChange?: (isPaused: boolean) => void;
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

  // Rover Model & Parts
  private roverGroup: THREE.Group = new THREE.Group();
  private roverChassis: THREE.Mesh | null = null;
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
  private topSpeedMps: number = 5.2; // ~18.7 km/h
  private reverseSpeedMps: number = -2.5; // ~9 km/h
  private batteryPercent: number = 98.5;
  private distanceTraveledMeters: number = 0;
  private signalDelaySec: number = 1.28; // Moon ~1.3s, Mars ~250s (modeled realistically)
  private isPaused: boolean = false;

  // Input states
  private inputForward: number = 0; // -1, 0, 1
  private inputTurn: number = 0; // -1 (left), 1 (right)
  private inputBrake: boolean = false;

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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
    this.scene.add(this.roverGroup);

    // 3. Build Environment, Tracks & Rover
    this.buildLightingAndAtmosphere();
    this.buildProceduralTerrain();
    this.buildScatteredRocks();
    this.initWheelTracks();
    this.initRouteLine();
    this.buildRoverModel();
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

    // Spawn rover safely on terrain
    const startH = this.getTerrainHeight(0, 0);
    this.roverPosition.set(0, startH + 0.55, 0);
    this.roverGroup.position.copy(this.roverPosition);
    this.lastTrackCenterPos.copy(this.roverPosition);

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

  private buildScatteredRocks(): void {
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

    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const x = THREE.MathUtils.lerp(this.roverPosition.x, target.worldPos.x, t);
      const z = THREE.MathUtils.lerp(this.roverPosition.z, target.worldPos.z, t);
      // Elevate slightly above terrain so the route line hovers like a holo projection
      const y = this.getTerrainHeight(x, z) + 0.45 + Math.sin(t * Math.PI) * 0.3;
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
    this.roverChassis = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.65, 2.3),
      new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.65,
        roughness: 0.35,
      })
    );
    this.roverChassis.castShadow = true;
    this.roverChassis.receiveShadow = true;
    this.roverGroup.add(this.roverChassis);

    // Gold solar panel deck
    const solarGeo = new THREE.BoxGeometry(1.4, 0.06, 2.0);
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      metalness: 0.85,
      roughness: 0.2,
    });
    const solarDeck = new THREE.Mesh(solarGeo, solarMat);
    solarDeck.position.set(0, 0.35, 0);
    this.roverChassis.add(solarDeck);

    // Mast-Cam Assembly
    this.mastMesh = new THREE.Group();
    this.mastMesh.position.set(0, 0.35, -0.85);

    const mastPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.2, 12),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8 })
    );
    mastPole.position.set(0, 0.6, 0);
    this.mastMesh.add(mastPole);

    const camHead = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.2, 0.25),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.9, roughness: 0.2 })
    );
    camHead.position.set(0, 1.25, 0);

    const lensL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    lensL.rotateX(Math.PI / 2);
    lensL.position.set(-0.09, 0, -0.13);
    camHead.add(lensL);

    const lensR = lensL.clone();
    lensR.position.set(0.09, 0, -0.13);
    camHead.add(lensR);

    this.mastMesh.add(camHead);
    this.roverChassis.add(this.mastMesh);

    // High-gain antenna dish
    const dishGeo = new THREE.CylinderGeometry(0.3, 0.1, 0.08, 16);
    dishGeo.rotateX(0.4);
    const dishMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, metalness: 0.7 });
    const dish = new THREE.Mesh(dishGeo, dishMat);
    dish.position.set(0.5, 0.8, 0.7);
    this.roverChassis.add(dish);

    // Headlights
    this.headlightLeft = new THREE.SpotLight(0xfff7ed, 4.0, 35, Math.PI / 5, 0.4);
    this.headlightLeft.position.set(-0.6, 0.4, -1.2);
    this.headlightLeft.target.position.set(-0.6, -0.2, -8);
    this.roverChassis.add(this.headlightLeft);
    this.roverChassis.add(this.headlightLeft.target);

    this.headlightRight = new THREE.SpotLight(0xfff7ed, 4.0, 35, Math.PI / 5, 0.4);
    this.headlightRight.position.set(0.6, 0.4, -1.2);
    this.headlightRight.target.position.set(0.6, -0.2, -8);
    this.roverChassis.add(this.headlightRight);
    this.roverChassis.add(this.headlightRight.target);

    // Six Rocker-Bogie Wheels
    const wheelPositions = [
      { x: -1.05, y: -0.15, z: -0.9, steerable: true },
      { x: 1.05, y: -0.15, z: -0.9, steerable: true },
      { x: -1.15, y: -0.15, z: 0.05, steerable: false },
      { x: 1.15, y: -0.15, z: 0.05, steerable: false },
      { x: -1.05, y: -0.15, z: 0.95, steerable: true },
      { x: 1.05, y: -0.15, z: 0.95, steerable: true },
    ];

    const wheelGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.32, 16);
    wheelGeo.rotateZ(Math.PI / 2);
    const wheelMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.7,
      roughness: 0.5,
    });

    this.wheelMeshes = [];
    this.wheelPivots = [];

    wheelPositions.forEach((wp) => {
      const pivot = new THREE.Group();
      pivot.position.set(wp.x, wp.y, wp.z);

      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.castShadow = true;
      wheel.userData = { steerable: wp.steerable, isRear: wp.z > 0.5 };

      pivot.add(wheel);
      this.roverChassis!.add(pivot);

      this.wheelPivots.push(pivot);
      this.wheelMeshes.push(wheel);
    });
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

      // Vertical Light Pillar
      const pillarGeo = new THREE.CylinderGeometry(0.2, isTarget ? 0.6 : 0.4, isTarget ? 35 : 25, 12);
      const pillarMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: isTarget ? 0.55 : 0.35,
        depthWrite: false,
      });
      const pillar = new THREE.Mesh(pillarGeo, pillarMat);
      pillar.position.set(0, isTarget ? 17.5 : 12.5, 0);
      beaconGroup.add(pillar);

      // Hovering Diamond / Marker Crystal
      const crystalGeo = new THREE.OctahedronGeometry(isTarget ? 1.6 : 1.2, 0);
      const crystalMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: isTarget ? 0.95 : 0.7,
        metalness: 0.8,
        roughness: 0.2,
      });
      const crystal = new THREE.Mesh(crystalGeo, crystalMat);
      crystal.position.set(0, isTarget ? 7.5 : 6.0, 0);
      crystal.userData = { isCrystal: true, isTarget };
      beaconGroup.add(crystal);

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

      this.beaconsGroup.add(beaconGroup);
    });
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

  private handleKeyDown(e: KeyboardEvent): void {
    if (['ArrowUp', 'KeyW'].includes(e.code)) this.inputForward = 1;
    if (['ArrowDown', 'KeyS'].includes(e.code)) this.inputForward = -1;
    if (['ArrowLeft', 'KeyA'].includes(e.code)) this.inputTurn = -1;
    if (['ArrowRight', 'KeyD'].includes(e.code)) this.inputTurn = 1;
    if (['Space'].includes(e.code)) this.inputBrake = true;

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
    this.buildScatteredRocks();
    this.initWheelTracks();
    this.initRouteLine();
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
    this.roverPosition.set(0, 0, 0);
    const h = this.getTerrainHeight(0, 0);
    this.roverPosition.y = h + 0.55;
    this.roverHeading = 0;
    this.currentSpeed = 0;
    this.roverGroup.position.copy(this.roverPosition);
    this.roverGroup.rotation.set(0, 0, 0);
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

      if (!this.isPaused) {
        // 1. Rover Driving Physics
        this.updateRoverPhysics(delta);

        // 2. Visible Wheel Tracks
        this.updateWheelTracks();
      }

      // 3. Camera Tracking
      this.updateCamera(delta);

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
    const accelRate = 2.8;
    const decelRate = 3.6;
    const brakeRate = 8.5;
    const steerSpeed = 1.4;

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

    // Move Rover
    const moveDist = this.currentSpeed * delta;
    this.roverPosition.x -= Math.sin(this.roverHeading) * moveDist;
    this.roverPosition.z -= Math.cos(this.roverHeading) * moveDist;

    // Keep within terrain boundaries
    const bound = this.terrainSize * 0.46;
    this.roverPosition.x = THREE.MathUtils.clamp(this.roverPosition.x, -bound, bound);
    this.roverPosition.z = THREE.MathUtils.clamp(this.roverPosition.z, -bound, bound);

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

  private updateCamera(delta: number): void {
    if (this.cameraMode === 'follow') {
      const distBehind = 7.5;
      const heightAbove = 3.6;

      const targetX = this.roverPosition.x + Math.sin(this.roverHeading) * distBehind;
      const targetZ = this.roverPosition.z + Math.cos(this.roverHeading) * distBehind;
      const targetY = this.roverPosition.y + heightAbove;

      this.camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.12);
      this.camera.lookAt(
        this.roverPosition.x,
        this.roverPosition.y + 1.2,
        this.roverPosition.z
      );
    } else if (this.cameraMode === 'cockpit') {
      const eyeX = this.roverPosition.x - Math.sin(this.roverHeading) * 0.2;
      const eyeZ = this.roverPosition.z - Math.cos(this.roverHeading) * 0.2;
      const eyeY = this.roverPosition.y + 1.8;

      this.camera.position.set(eyeX, eyeY, eyeZ);

      const lookTargetX = this.roverPosition.x - Math.sin(this.roverHeading) * 20;
      const lookTargetZ = this.roverPosition.z - Math.cos(this.roverHeading) * 20;
      this.camera.lookAt(lookTargetX, eyeY - 0.4, lookTargetZ);
    } else if (this.cameraMode === 'free') {
      const r = this.cameraOrbit.radius;
      const t = this.cameraOrbit.theta;
      const p = this.cameraOrbit.phi;

      const camX = this.roverPosition.x + r * Math.sin(p) * Math.sin(t);
      const camY = this.roverPosition.y + r * Math.cos(p);
      const camZ = this.roverPosition.z + r * Math.sin(p) * Math.cos(t);

      this.camera.position.set(camX, Math.max(this.roverPosition.y + 1, camY), camZ);
      this.camera.lookAt(
        this.roverPosition.x,
        this.roverPosition.y + 0.8,
        this.roverPosition.z
      );
    }
  }

  private updateProximityAndBeacons(elapsedTime: number): void {
    this.beaconsGroup.children.forEach((beacon) => {
      const crystal = beacon.children.find((c) => c.userData.isCrystal);
      if (crystal) {
        crystal.rotation.y = elapsedTime * (crystal.userData.isTarget ? 2.5 : 1.5);
        crystal.position.y = (crystal.userData.isTarget ? 7.5 : 6.0) + Math.sin(elapsedTime * 2.5) * 0.4;
      }
    });

    if (this.earthMesh) {
      this.earthMesh.rotation.y = elapsedTime * 0.04;
    }

    const envWaypoints = this.waypoints.filter((w) => w.environment === this.environment);
    let closestWp: SurfaceWaypoint | null = null;
    let minD = 9999;

    envWaypoints.forEach((wp) => {
      const d = Math.hypot(
        this.roverPosition.x - wp.worldPos.x,
        this.roverPosition.z - wp.worldPos.z
      );
      if (d < minD) {
        minD = d;
        closestWp = wp;
      }
    });

    this.nearestDistance = Math.round(minD * 10) / 10;
    this.nearestWaypoint = closestWp;

    if (minD <= 12 && closestWp) {
      this.callbacks.onAnomalyProximity?.(closestWp, this.nearestDistance);
    } else {
      this.callbacks.onAnomalyProximity?.(null, this.nearestDistance);
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
