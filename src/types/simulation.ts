export type ViewMode =
  | 'mission-control'
  | 'solar-system'
  | 'launch-simulator'
  | 'moon'
  | 'mars'
  | 'archive'
  | 'discoveries'
  | 'artifacts'
  | 'nasa-archive'
  | 'nasa-data'
  | 'settings';

export type PlanetId =
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'moon'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune';

export interface PlanetData {
  id: PlanetId;
  name: string;
  type: 'Star' | 'Terrestrial Planet' | 'Gas Giant' | 'Ice Giant' | 'Natural Satellite';
  diameterKm: number;
  distanceFromSunAU: number;
  orbitPeriodDays: number;
  rotationPeriodHours: number;
  surfaceTempCelsius: string;
  atmosphere: string;
  colorHex: string;
  description: string;
  historicalSignificance: string;
  targetAvailable: boolean;
  artifactsCountEstimate?: string;
}

export type LaunchTarget = 'earth_orbit' | 'lunar_transit' | 'mars_transfer';

export interface SpacecraftOption {
  id: string;
  name: string;
  agencyRole: string;
  destination: string;
  totalMassKg: number;
  payloadCapacityKg: number;
  stages: number;
  description: string;
}

export type MissionPhase =
  | 'STANDBY'
  | 'PRE_LAUNCH_CHECKLIST'
  | 'COUNTDOWN'
  | 'IGNITION'
  | 'LIFTOFF'
  | 'ASCENT'
  | 'MAX_Q'
  | 'STAGE_SEPARATION'
  | 'ORBIT_INSERTION'
  | 'TRANSIT_FLIGHT'
  | 'DESTINATION_ARRIVED'
  | 'ABORTED';

export interface LaunchChecklistState {
  propellantPressurization: boolean;
  guidanceNavigationAvionics: boolean;
  thermalProtectionSystems: boolean;
  telemetryGroundStationComm: boolean;
  rangeClearanceWeather: boolean;
}

export type GraphicsQuality = 'low' | 'medium' | 'high';

export interface SimulationSettings {
  graphicsQuality: GraphicsQuality;
  orbitSpeedMultiplier: number;
  showOrbits: boolean;
  showLabels: boolean;
  cameraSmoothing: boolean;
  reducedMotion: boolean;
  soundEffects: boolean;
}

export interface NASADataServiceStatus {
  connected: boolean;
  endpointState: 'unconfigured' | 'pending' | 'connected' | 'error';
  lastChecked: string | null;
  message: string;
  apiKeySupplied: boolean;
  activeKeyMasked?: string;
  latencyMs?: number;
}

export interface ApodData {
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: 'image' | 'video';
  service_version: string;
  title: string;
  url: string;
  copyright?: string;
}

export interface NasaImageItem {
  nasa_id: string;
  title: string;
  description: string;
  date_created: string;
  center: string;
  keywords?: string[];
  thumbUrl: string;
  fullUrl?: string;
  media_type?: 'image' | 'video';
  nasaWebUrl?: string;
}

export type RoverCameraMode = 'follow' | 'cockpit' | 'free';

export interface RoverTelemetry {
  speedKmh: number;
  batteryPercent: number;
  distanceTraveledMeters: number;
  headingDeg: number;
  inclineDeg: number;
  signalDelaySec: number;
  coordinates: { x: number; z: number };
  isBraking: boolean;
  driveMode: 'DRIVE' | 'REVERSE' | 'PARKED';
}

export type MissionFlowState =
  | 'MISSION_PREPARATION'
  | 'LAUNCH'
  | 'SPACE_TRAVEL'
  | 'DESTINATION_APPROACH'
  | 'LANDING'
  | 'ROVER_INITIALIZATION'
  | 'DRIVE_MODE_ACTIVE';

export interface SurfaceWaypoint {
  id: string;
  nasa_id: string;
  imageUrl: string;
  name: string;
  sublabel: string;
  environment: 'moon' | 'mars';
  worldPos: { x: number; z: number };
  searchQuery: string;
  description: string;
  historicalContext: string;
  realCoordinatesText: string;
  equipmentType: string;
  agency: string;
  landingYear: number;
  discovered: boolean;
  sourceUrl?: string;
  spokenNarration?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  sourceUrl?: string;
  verified: boolean;
  category?: 'launch' | 'landing' | 'operation' | 'anomaly' | 'final_contact';
}

export interface MachineStory {
  title: string;
  perspectiveSpeaker: string;
  narrative: string;
  verifiedFacts: string[];
  hasStory: boolean;
  unavailabilityReason?: string;
  disclaimer: string;
}

export interface CollectedDiscovery {
  id: string;
  nasa_id: string;
  title: string;
  description: string;
  date_created: string;
  center: string;
  thumbUrl: string;
  fullUrl?: string;
  media_type: 'image' | 'video';
  nasaWebUrl: string;
  equipmentType?: string;
  collectedAt: string;
  userNotes?: string;
  isSimulatedPoi?: boolean;
  simulatedEnvironment?: 'moon' | 'mars';
}


