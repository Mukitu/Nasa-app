/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SpaceScene } from './three/SpaceScene';
import { SurfaceExplorerScene } from './three/SurfaceExplorerScene';
import { Header } from './components/Header';
import { ViewportControls } from './components/ViewportControls';
import { MissionControlPanel } from './components/MissionControlPanel';
import { SolarSystemViewer } from './components/SolarSystemViewer';
import { LaunchPreparationModule } from './components/LaunchPreparationModule';
import { RoverHUD } from './components/RoverHUD';
import { CinematicDiscoveryModal } from './components/CinematicDiscoveryModal';
import { NasaArchiveExplorerView } from './components/NasaArchiveExplorerView';
import { DiscoveryCollectionView } from './components/DiscoveryCollectionView';
import { DiscoveriesCatalogModal } from './components/DiscoveriesCatalogModal';
import { LunarMarsHeritagePreview } from './components/LunarMarsHeritagePreview';
import { NasaArchivePanel } from './components/NasaArchivePanel';
import { NasaDataView } from './components/NasaDataView';
import { CinematicLandingTransition } from './components/CinematicLandingTransition';
import { SettingsModal } from './components/SettingsModal';
import { WelcomeTourModal } from './components/WelcomeTourModal';
import { SpacecraftInspectionModal } from './components/SpacecraftInspectionModal';
import { FullscreenLaunchModal } from './components/FullscreenLaunchModal';
import { SurfaceControlGuideModal } from './components/SurfaceControlGuideModal';
import { CELESTIAL_BODIES, SPACECRAFT_FLEET } from './data/planets';
import { INITIAL_WAYPOINTS } from './data/waypoints';
import { nasaService } from './services/nasaApi';
import { speechNarrationService } from './services/speechNarrationService';
import {
  ViewMode,
  PlanetId,
  MissionPhase,
  LaunchTarget,
  MissionFlowState,
  SpacecraftOption,
  SimulationSettings,
  GraphicsQuality,
  SurfaceWaypoint,
  RoverTelemetry,
  RoverCameraMode,
  NasaImageItem,
  CollectedDiscovery,
  PlanetData,
} from './types/simulation';
import { aerospaceAudio } from './utils/audio';

export default function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const surfaceCanvasContainerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SpaceScene | null>(null);
  const surfaceSceneRef = useRef<SurfaceExplorerScene | null>(null);

  // Core Simulation States
  const [viewMode, setViewMode] = useState<ViewMode>('launch-simulator');
  const [selectedPlanetId, setSelectedPlanetId] = useState<PlanetId>('earth');
  const [missionPhase, setMissionPhase] = useState<MissionPhase>('STANDBY');
  const [launchTarget, setLaunchTarget] = useState<LaunchTarget>(null);
  const launchTargetRef = useRef<LaunchTarget>(null);
  const [selectedSpacecraft, setSelectedSpacecraft] = useState<SpacecraftOption>(SPACECRAFT_FLEET[0]);

  // Mission Flow State Machine (Continuous journey to surface)
  const [missionFlowState, setMissionFlowState] = useState<MissionFlowState>('MISSION_PREPARATION');
  const [showLandingSequence, setShowLandingSequence] = useState(false);
  const [justLanded, setJustLanded] = useState(false);

  // Audio Control State (Muted by default as required)
  const [soundEnabled, setSoundEnabled] = useState(false);

  // Continuous Launch Progression State (0.0 to 1.0)
  const [launchProgress, setLaunchProgress] = useState(0);
  const [autoLaunchActive, setAutoLaunchActive] = useState(false);
  const [simulatedAltitudeKm, setSimulatedAltitudeKm] = useState(0);
  const [simulatedVelocityKmh, setSimulatedVelocityKmh] = useState(0);

  // Surface Rover Exploration States (Phase 3)
  const [waypoints, setWaypoints] = useState<SurfaceWaypoint[]>(INITIAL_WAYPOINTS);
  const [roverTelemetry, setRoverTelemetry] = useState<RoverTelemetry>({
    speedKmh: 0,
    batteryPercent: 98.5,
    distanceTraveledMeters: 0,
    headingDeg: 0,
    inclineDeg: 0,
    signalDelaySec: 1.28,
    coordinates: { x: 0, z: 0 },
    isBraking: false,
    driveMode: 'PARKED',
  });
  const [activeRoverCameraMode, setActiveRoverCameraMode] = useState<RoverCameraMode>('follow');
  const [nearestAnomaly, setNearestAnomaly] = useState<SurfaceWaypoint | null>(null);
  const [nearestAnomalyDistance, setNearestAnomalyDistance] = useState<number>(999);
  const [selectedWaypointId, setSelectedWaypointId] = useState<string | null>(null);
  const [showRoverRouteLine, setShowRoverRouteLine] = useState(true);
  const [isRoverPaused, setIsRoverPaused] = useState(false);

  // Phase 4: Discovery Collection State (Session-level in-memory)
  const [collectedDiscoveries, setCollectedDiscoveries] = useState<CollectedDiscovery[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('eos_collected_discoveries');
        if (stored) return JSON.parse(stored);
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('eos_collected_discoveries', JSON.stringify(collectedDiscoveries));
      } catch {}
    }
  }, [collectedDiscoveries]);

  // Phase 4: Cinematic Discovery Modal State
  const [cinematicRecord, setCinematicRecord] = useState<NasaImageItem | null>(null);
  const [cinematicIsPoi, setCinematicIsPoi] = useState(false);
  const [showDiscoveriesCatalog, setShowDiscoveriesCatalog] = useState(false);
  const [showSpacecraftInspector, setShowSpacecraftInspector] = useState(false);

  // 3D Hover Tooltip State
  const [hoveredBody, setHoveredBody] = useState<PlanetData | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  // NASA Connectivity State
  const [nasaConnected, setNasaConnected] = useState(false);

  // Runtime Simulation Settings
  const [settings, setSettings] = useState<SimulationSettings>({
    graphicsQuality: 'high',
    orbitSpeedMultiplier: 1.0,
    showOrbits: true,
    showLabels: true,
    cameraSmoothing: true,
    reducedMotion: false,
    soundEffects: false, // Synced with soundEnabled
  });

  const [isPaused, setIsPaused] = useState(false);

  // Modal Dialog Overlays
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('eos_welcome_seen');
    }
    return true;
  });
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNasaArchiveModal, setShowNasaArchiveModal] = useState(false);
  const [showNasaDataModal, setShowNasaDataModal] = useState(false);
  const [showHeritageModal, setShowHeritageModal] = useState(false);
  const [showFullscreenLaunchModal, setShowFullscreenLaunchModal] = useState(false);
  const [showSurfaceGuideModal, setShowSurfaceGuideModal] = useState(false);

  const isSurfaceMode = viewMode === 'moon' || viewMode === 'mars';
  const surfaceEnvironment: 'moon' | 'mars' = viewMode === 'mars' ? 'mars' : 'moon';

  // Toggle Sound Control
  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      setSettings((s) => ({ ...s, soundEffects: next }));
      if (next) aerospaceAudio.playBeep(1200, 0.05);
      return next;
    });
  }, []);

  // Initial NASA Connection probe with provided key
  useEffect(() => {
    nasaService.testConnection().then((res) => {
      setNasaConnected(res.connected);
    });
  }, []);

  // Initialize Three.js SpaceScene (Orbit & Launchpad)
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    const scene = new SpaceScene(canvasContainerRef.current, {
      onPlanetSelect: (planetId) => {
        setSelectedPlanetId(planetId);
        if (soundEnabled) aerospaceAudio.playBeep(1200, 0.05);
      },
      onHoverBody: (body, pos) => {
        setHoveredBody(body);
        setHoverPos(pos);
      },
      onLaunchProgressUpdate: (progress, altitudeKm, velocityKmh, phase) => {
        setLaunchProgress(progress);
        setSimulatedAltitudeKm(altitudeKm);
        setSimulatedVelocityKmh(velocityKmh);
        setMissionPhase(phase);
        if (progress >= 0.98) {
          setAutoLaunchActive(false);
          const currentTgt = launchTargetRef.current;
          if (currentTgt === 'lunar_transit' || currentTgt === 'mars_transfer') {
            // Automatic smooth transition to direct 3D landing on target surface map
            const targetEnv = currentTgt === 'mars_transfer' ? 'mars' : 'moon';
            setSelectedPlanetId(targetEnv);
            setViewMode(targetEnv);
            setMissionFlowState('LANDING');
            setShowLandingSequence(true);
          }
        }
      },
      onAutoLaunchStateChange: (active) => {
        setAutoLaunchActive(active);
        if (active) {
          setMissionFlowState('LAUNCH');
        }
      },
    });

    sceneRef.current = scene;

    return () => {
      scene.dispose();
      sceneRef.current = null;
    };
  }, [soundEnabled]);

  // Mount/Update SurfaceExplorerScene (Moon & Mars Rover Driving)
  useEffect(() => {
    if (!isSurfaceMode) {
      if (surfaceSceneRef.current) {
        surfaceSceneRef.current.dispose();
        surfaceSceneRef.current = null;
      }
      return;
    }

    if (!surfaceCanvasContainerRef.current) return;

    if (!surfaceSceneRef.current) {
      const surfaceScene = new SurfaceExplorerScene(
        surfaceCanvasContainerRef.current,
        surfaceEnvironment,
        waypoints,
        {
          onTelemetryUpdate: (telem) => {
            setRoverTelemetry(telem);
          },
          onAnomalyProximity: (wp, dist) => {
            setNearestAnomaly(wp);
            setNearestAnomalyDistance(dist);
          },
          onWaypointsUpdate: (updatedWps) => {
            setWaypoints(updatedWps);
          },
          onPauseChange: (p) => {
            setIsRoverPaused(p);
          },
        }
      );
      if (selectedWaypointId) {
        surfaceScene.setSelectedTargetWaypoint(selectedWaypointId);
      }
      surfaceScene.setRouteLineVisible(showRoverRouteLine);
      surfaceSceneRef.current = surfaceScene;
    } else {
      surfaceSceneRef.current.setEnvironment(surfaceEnvironment);
    }
  }, [isSurfaceMode, surfaceEnvironment, soundEnabled, selectedWaypointId, showRoverRouteLine]);

  // Trigger 3D Live Surface Landing on Moon / Mars map
  useEffect(() => {
    if (showLandingSequence && surfaceSceneRef.current) {
      surfaceSceneRef.current.triggerLandingSequence(() => {
        setShowLandingSequence(false);
        setMissionFlowState('DRIVE_MODE_ACTIVE');
        setShowSurfaceGuideModal(true);
      });
    }
  }, [showLandingSequence]);

  // Update SpaceScene when viewMode changes
  useEffect(() => {
    if (!sceneRef.current) return;
    if (!isSurfaceMode) {
      sceneRef.current.setViewMode(viewMode);
    }
  }, [viewMode, isSurfaceMode]);

  // Play audio cues during ignition & liftoff if sound enabled
  useEffect(() => {
    if (missionPhase === 'IGNITION' && soundEnabled) {
      aerospaceAudio.playIgnition();
    } else if (missionPhase === 'LIFTOFF' && soundEnabled) {
      aerospaceAudio.playBeep(880, 0.1);
    }
  }, [missionPhase, soundEnabled]);

  // Handle Mode Change
  const handleSelectView = useCallback((mode: ViewMode) => {
    if (soundEnabled) aerospaceAudio.playBeep(1040, 0.04);

    if (mode === 'settings') {
      setShowSettingsModal(true);
      return;
    }
    if (mode === 'nasa-data') {
      setShowNasaDataModal(true);
      return;
    }
    if (mode === 'nasa-archive') {
      setViewMode('archive');
      return;
    }
    if (mode === 'artifacts') {
      setViewMode('discoveries');
      return;
    }
    if (mode === 'moon') {
      setSelectedPlanetId('moon');
      setViewMode('moon');
      return;
    }
    if (mode === 'mars') {
      setSelectedPlanetId('mars');
      setViewMode('mars');
      return;
    }
    if (mode === 'launch-simulator') {
      setViewMode('launch-simulator');
      setShowFullscreenLaunchModal(true);
      setAutoLaunchActive(false);
      if (sceneRef.current) {
        sceneRef.current.resetFlightToPad();
      }
      setLaunchProgress(0);
      setSimulatedAltitudeKm(0);
      setSimulatedVelocityKmh(0);
      setMissionPhase('STANDBY');
      return;
    }

    setViewMode(mode);
    if (mode === 'mission-control') {
      setSelectedPlanetId('earth');
    }
  }, [soundEnabled]);

  // Continuous Launch Handlers
  const handleSetLaunchProgress = useCallback((progress: number) => {
    setAutoLaunchActive(false);
    if (sceneRef.current) {
      sceneRef.current.setAutoLaunch(false);
      sceneRef.current.setLaunchProgress(progress, launchTarget);
    }
    setLaunchProgress(progress);
  }, [launchTarget]);

  const handleResetFlight = useCallback(() => {
    setAutoLaunchActive(false);
    if (sceneRef.current) {
      sceneRef.current.resetFlightToPad();
    }
    setLaunchProgress(0);
    setSimulatedAltitudeKm(0);
    setSimulatedVelocityKmh(0);
    setMissionPhase('STANDBY');
    if (soundEnabled) aerospaceAudio.playBeep(880, 0.05);
  }, [soundEnabled]);

  const handleResetAndLaunch = useCallback(() => {
    setAutoLaunchActive(false);
    if (sceneRef.current) {
      sceneRef.current.resetFlightToPad();
    }
    setLaunchProgress(0);
    setSimulatedAltitudeKm(0);
    setSimulatedVelocityKmh(0);
    setMissionPhase('IGNITION');

    setTimeout(() => {
      if (sceneRef.current) {
        sceneRef.current.setAutoLaunch(true, 6.8);
      }
      setAutoLaunchActive(true);
      if (soundEnabled) aerospaceAudio.playIgnition();
    }, 40);
  }, [soundEnabled]);

  const handleToggleAutoLaunch = useCallback(() => {
    if (launchProgress >= 0.98) {
      handleResetAndLaunch();
      return;
    }

    const nextState = !autoLaunchActive;
    setAutoLaunchActive(nextState);
    if (sceneRef.current) {
      sceneRef.current.setAutoLaunch(nextState, 6.8);
    }
    if (nextState && soundEnabled) {
      aerospaceAudio.playIgnition();
    }
  }, [autoLaunchActive, launchProgress, handleResetAndLaunch, soundEnabled]);

  const handleSetLaunchTarget = useCallback((target: LaunchTarget) => {
    setLaunchTarget(target);
    launchTargetRef.current = target;
    if (sceneRef.current) {
      sceneRef.current.setLaunchTarget(target);
    }
  }, []);

  const handleInitiateContinuousLaunch = useCallback((targetOverride?: LaunchTarget) => {
    speechNarrationService.unlockAudio();
    aerospaceAudio.initCtx();
    const target = targetOverride || launchTarget;
    setLaunchTarget(target);
    launchTargetRef.current = target;
    if (sceneRef.current) {
      sceneRef.current.setLaunchTarget(target);
    }
    setViewMode('launch-simulator');
    setMissionFlowState('LAUNCH');
    handleResetAndLaunch();
  }, [launchTarget, handleResetAndLaunch]);

  const handleSetCameraMode = useCallback((mode: 'pad' | 'tower' | 'ascent' | 'orbital' | 'spacecraft' | 'free') => {
    if (sceneRef.current) {
      sceneRef.current.setLaunchCameraMode(mode);
    }
  }, []);

  const handleExploreDestination = useCallback(() => {
    speechNarrationService.unlockAudio();
    if (launchTarget === 'lunar_transit' || launchTarget === 'mars_transfer') {
      setShowLandingSequence(true);
      setMissionFlowState('LANDING');
    } else {
      setSelectedPlanetId('earth');
      setViewMode('mission-control');
    }
  }, [launchTarget]);

  // Focus camera on planet
  const handleFocusPlanet = useCallback((planetId: PlanetId) => {
    setSelectedPlanetId(planetId);
    if (sceneRef.current) {
      sceneRef.current.focusOnPlanet(planetId);
    }
    if (soundEnabled) aerospaceAudio.playBeep(1320, 0.06);
  }, [soundEnabled]);

  // Viewport action handlers
  const handleZoomIn = useCallback(() => {
    sceneRef.current?.zoomIn();
  }, []);

  const handleZoomOut = useCallback(() => {
    sceneRef.current?.zoomOut();
  }, []);

  const handleResetView = useCallback(() => {
    sceneRef.current?.resetCamera();
    if (soundEnabled) aerospaceAudio.playBeep(880, 0.05);
  }, [soundEnabled]);

  const handleTogglePause = useCallback(() => {
    if (sceneRef.current) {
      const paused = sceneRef.current.togglePause();
      setIsPaused(paused);
    }
  }, []);

  const handleCycleQuality = useCallback(() => {
    const cycle: Record<GraphicsQuality, GraphicsQuality> = {
      high: 'medium',
      medium: 'low',
      low: 'high',
    };
    const nextQ = cycle[settings.graphicsQuality];
    setSettings((prev) => ({ ...prev, graphicsQuality: nextQ }));
    sceneRef.current?.setQuality(nextQ);
    surfaceSceneRef.current?.setQuality(nextQ);
    if (soundEnabled) aerospaceAudio.playBeep(1100, 0.04);
  }, [settings.graphicsQuality, soundEnabled]);

  const handleCloseWelcome = useCallback(() => {
    setShowWelcomeModal(false);
    sessionStorage.setItem('eos_welcome_seen', 'true');
  }, []);

  // Phase 4 Discovery Collection Management
  const handleToggleCollect = useCallback((record: NasaImageItem, isPoi = false) => {
    setCollectedDiscoveries((prev) => {
      const exists = prev.some((c) => c.nasa_id === record.nasa_id);
      if (exists) {
        return prev.filter((c) => c.nasa_id !== record.nasa_id);
      } else {
        const item: CollectedDiscovery = {
          id: record.nasa_id || `col-${Date.now()}`,
          nasa_id: record.nasa_id,
          title: record.title,
          description: record.description,
          date_created: record.date_created,
          center: record.center,
          thumbUrl: record.thumbUrl,
          fullUrl: record.fullUrl,
          media_type: (record.media_type as 'image' | 'video') || 'image',
          nasaWebUrl: record.nasaWebUrl || `https://images.nasa.gov/details/${encodeURIComponent(record.nasa_id)}`,
          collectedAt: new Date().toISOString(),
          isSimulatedPoi: isPoi,
          simulatedEnvironment: isSurfaceMode ? surfaceEnvironment : undefined,
        };
        return [item, ...prev];
      }
    });
  }, [isSurfaceMode, surfaceEnvironment]);

  // Open Cinematic Discovery Experience for an Archive Record or POI
  const handleOpenCinematicRecord = useCallback((record: NasaImageItem, isPoi = false) => {
    setCinematicRecord(record);
    setCinematicIsPoi(isPoi);
  }, []);

  // Inspect Anomaly from 3D Rover Proximity
  const handleInspectAnomalyWaypoint = useCallback((wp: SurfaceWaypoint) => {
    const actualNasaId = wp.nasa_id || wp.id;
    const actualImageUrl = wp.imageUrl || (wp.environment === 'moon'
      ? 'https://images-assets.nasa.gov/image/as11-40-5927/as11-40-5927~medium.jpg'
      : 'https://images-assets.nasa.gov/image/PIA00563/PIA00563~medium.jpg');

    // Construct rich authentic record for the specific waypoint
    const rec: NasaImageItem = {
      nasa_id: actualNasaId,
      title: wp.name,
      description: `${wp.description}\n\nDocumented NASA Landing Coordinates: ${wp.realCoordinatesText}\nProgram/Agency: ${wp.agency}\nTouchdown Year: ${wp.landingYear}\n\nMission Legacy: "${wp.historicalContext}"`,
      date_created: `${wp.landingYear}-01-01`,
      center: wp.agency.includes('JPL') ? 'Jet Propulsion Laboratory' : 'Johnson Space Center',
      keywords: [wp.environment, wp.equipmentType, 'surface hardware', 'exploration history'],
      thumbUrl: actualImageUrl,
      fullUrl: actualImageUrl,
      media_type: 'image',
      nasaWebUrl: wp.sourceUrl || `https://images.nasa.gov/details/${encodeURIComponent(actualNasaId)}`,
    };

    // Mark waypoint as discovered in scene
    setWaypoints((prev) =>
      prev.map((w) => (w.id === wp.id ? { ...w, discovered: true } : w))
    );
    surfaceSceneRef.current?.markWaypointDiscovered(wp.id);

    // Auto-save to mission collection
    handleToggleCollect(rec, true);

    // Open cinematic discovery view
    handleOpenCinematicRecord(rec, true);
  }, [handleToggleCollect, handleOpenCinematicRecord]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowWelcomeModal(false);
        setShowSettingsModal(false);
        setShowNasaArchiveModal(false);
        setShowNasaDataModal(false);
        setShowHeritageModal(false);
        setShowDiscoveriesCatalog(false);
        setCinematicRecord(null);
      } else if (e.key === ' ' && !showWelcomeModal && !showSettingsModal && !showNasaDataModal && !isSurfaceMode && viewMode !== 'archive' && viewMode !== 'discoveries') {
        e.preventDefault();
        handleTogglePause();
      } else if ((e.key === 'r' || e.key === 'R') && !showWelcomeModal && !showNasaDataModal && !isSurfaceMode && viewMode !== 'archive' && viewMode !== 'discoveries') {
        handleResetView();
      } else if ((e.key === 'e' || e.key === 'E') && isSurfaceMode && nearestAnomaly && nearestAnomalyDistance <= 12) {
        handleInspectAnomalyWaypoint(nearestAnomaly);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePause, handleResetView, showWelcomeModal, showSettingsModal, showNasaDataModal, isSurfaceMode, viewMode, nearestAnomaly, nearestAnomalyDistance, handleInspectAnomalyWaypoint]);

  const currentPlanetData = CELESTIAL_BODIES[selectedPlanetId] || CELESTIAL_BODIES.earth;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#04060c] text-slate-100 flex flex-col">
      {/* 1. Header (Top Bar with Mission Navigation & Discoveries) */}
      <Header
        currentView={viewMode}
        onSelectView={handleSelectView}
        onOpenHelp={() => setShowWelcomeModal(true)}
        discoveriesCount={collectedDiscoveries.length}
        onOpenSpacecraftInspector={() => setShowSpacecraftInspector(true)}
      />

      {/* 4. Main Viewport Area */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        {/* Space Scene 3D Canvas Mounting Point */}
        <div
          ref={canvasContainerRef}
          className="three-canvas-container cursor-grab active:cursor-grabbing"
          style={{ width: '100%', height: '100%', display: isSurfaceMode || viewMode === 'archive' || viewMode === 'discoveries' ? 'none' : 'block' }}
        />

        {/* Surface Rover Exploration 3D Canvas Mounting Point */}
        <div
          ref={surfaceCanvasContainerRef}
          className="three-canvas-container cursor-default"
          style={{ width: '100%', height: '100%', display: isSurfaceMode ? 'block' : 'none' }}
        />

        {/* Viewport HUD Controls (Space / Orbit View) */}
        {!isSurfaceMode && viewMode !== 'archive' && viewMode !== 'discoveries' && (
          <ViewportControls
            currentView={viewMode}
            isPaused={isPaused}
            quality={settings.graphicsQuality}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            onTogglePause={handleTogglePause}
            onCycleQuality={handleCycleQuality}
            onOpenHelp={() => setShowWelcomeModal(true)}
          />
        )}

        {/* Mission Control Panel */}
        {!isSurfaceMode && viewMode === 'mission-control' && (
          <MissionControlPanel
            selectedBody={currentPlanetData}
            missionPhase={missionPhase}
            target={launchTarget}
            nasaConnected={nasaConnected}
            onSelectTarget={(target) => handleSetLaunchTarget(target)}
            onPrepareLaunch={(target) => handleInitiateContinuousLaunch(target)}
            onExploreSolarSystem={() => setViewMode('solar-system')}
            onOpenHeritageSites={() => {
              if (launchTarget === 'mars_transfer') {
                setSelectedPlanetId('mars');
                setViewMode('mars');
              } else {
                setSelectedPlanetId('moon');
                setViewMode('moon');
              }
            }}
          />
        )}

        {/* Solar System Viewer */}
        {!isSurfaceMode && viewMode === 'solar-system' && (
          <SolarSystemViewer
            selectedPlanetId={selectedPlanetId}
            onSelectPlanet={(id) => setSelectedPlanetId(id)}
            onFocusCamera={handleFocusPlanet}
            hoveredBody={hoveredBody}
            hoverPos={hoverPos}
          />
        )}

        {/* Space Launch Preparation Module */}
        {!isSurfaceMode && viewMode === 'launch-simulator' && (
          <LaunchPreparationModule
            missionPhase={missionPhase}
            target={launchTarget}
            selectedSpacecraft={selectedSpacecraft}
            altitudeKm={simulatedAltitudeKm}
            velocityKmh={simulatedVelocityKmh}
            launchProgress={launchProgress}
            autoLaunchActive={autoLaunchActive}
            onSetLaunchProgress={handleSetLaunchProgress}
            onToggleAutoLaunch={handleToggleAutoLaunch}
            onResetFlight={handleResetFlight}
            onResetAndLaunch={handleResetAndLaunch}
            onSetTarget={handleSetLaunchTarget}
            onSelectSpacecraft={setSelectedSpacecraft}
            onSetCameraMode={handleSetCameraMode}
            onReturnToStandby={() => {
              handleResetFlight();
              setViewMode('mission-control');
            }}
            onExploreDestination={handleExploreDestination}
          />
        )}

        {/* Phase 3: Surface Rover Exploration HUD */}
        {isSurfaceMode && (
          <RoverHUD
            environment={surfaceEnvironment}
            telemetry={roverTelemetry}
            waypoints={waypoints}
            activeCameraMode={activeRoverCameraMode}
            nearestAnomaly={nearestAnomaly}
            nearestDistance={nearestAnomalyDistance}
            selectedWaypointId={selectedWaypointId}
            isPaused={isRoverPaused}
            showRouteLine={showRoverRouteLine}
            onToggleRouteLine={() => {
              setShowRoverRouteLine((prev) => {
                const next = !prev;
                surfaceSceneRef.current?.setRouteLineVisible(next);
                return next;
              });
            }}
            onTogglePause={() => {
              setIsRoverPaused((prev) => {
                const next = !prev;
                surfaceSceneRef.current?.setPaused(next);
                return next;
              });
            }}
            onSelectWaypoint={(id) => {
              setSelectedWaypointId(id);
              surfaceSceneRef.current?.setSelectedTargetWaypoint(id);
              if (soundEnabled) aerospaceAudio.playBeep(1200, 0.04);
            }}
            onSetCameraMode={(mode) => {
              setActiveRoverCameraMode(mode);
              surfaceSceneRef.current?.setCameraMode(mode);
            }}
            onSwitchEnvironment={(env) => {
              setViewMode(env);
              surfaceSceneRef.current?.setEnvironment(env);
            }}
            onResetRover={() => {
              surfaceSceneRef.current?.resetRoverPosition();
            }}
            onReturnToMissionControl={() => {
              setViewMode('mission-control');
            }}
            onLaunchNewMission={() => {
              handleSelectView('launch-simulator');
            }}
            onInspectAnomaly={(wp) => {
              handleInspectAnomalyWaypoint(wp);
            }}
            onOpenDiscoveriesCatalog={() => {
              setShowDiscoveriesCatalog(true);
            }}
            onVirtualControl={(f, t, b) => {
              surfaceSceneRef.current?.setControlInput(f, t, b);
            }}
          />
        )}

        {/* Phase 4: NASA Image & Video Archive Explorer View */}
        {viewMode === 'archive' && (
          <NasaArchiveExplorerView
            onSelectRecord={(rec) => handleOpenCinematicRecord(rec, false)}
            collectedIds={new Set(collectedDiscoveries.map((c) => c.nasa_id))}
            onToggleCollect={(rec) => handleToggleCollect(rec, false)}
          />
        )}

        {/* Phase 4: Discovery Collection View */}
        {viewMode === 'discoveries' && (
          <DiscoveryCollectionView
            discoveries={collectedDiscoveries}
            onOpenRecord={(col) => handleOpenCinematicRecord(col, col.isSimulatedPoi)}
            onRemoveDiscovery={(id) =>
              setCollectedDiscoveries((prev) => prev.filter((c) => c.id !== id))
            }
            onExploreArchive={() => setViewMode('archive')}
          />
        )}
      </main>

      {/* Overlays & Modals */}
      {/* Continuous Space Flight & Landing Sequence */}
      {showLandingSequence && (
        <CinematicLandingTransition
          target={launchTarget}
          onComplete={() => {
            surfaceSceneRef.current?.skipLandingSequence();
            setShowLandingSequence(false);
            setMissionFlowState('DRIVE_MODE_ACTIVE');
            if (soundEnabled) {
              aerospaceAudio.playWaypointDiscovered();
            }
          }}
          onSkip={() => {
            surfaceSceneRef.current?.skipLandingSequence();
            setShowLandingSequence(false);
            setMissionFlowState('DRIVE_MODE_ACTIVE');
          }}
          onRetry={() => {
            surfaceSceneRef.current?.skipLandingSequence();
            setShowLandingSequence(false);
            handleResetAndLaunch();
          }}
        />
      )}

      {showWelcomeModal && (
        <WelcomeTourModal
          onStartMission={() => {
            setShowWelcomeModal(false);
            setShowFullscreenLaunchModal(true);
          }}
          onExploreSolarSystem={() => {
            setViewMode('solar-system');
          }}
          onClose={handleCloseWelcome}
        />
      )}

      {showFullscreenLaunchModal && (
        <FullscreenLaunchModal
          currentTarget={launchTarget}
          selectedSpacecraft={selectedSpacecraft}
          onSelectTarget={(tgt) => {
            setLaunchTarget(tgt);
            launchTargetRef.current = tgt;
            sceneRef.current?.setLaunchTarget(tgt);
          }}
          onSelectSpacecraft={(craft) => setSelectedSpacecraft(craft)}
          onStartLaunch={() => {
            setViewMode('launch-simulator');
            handleResetAndLaunch();
          }}
          onZoomOutView={() => {
            sceneRef.current?.focusOnPlanet('earth');
          }}
          onClose={() => setShowFullscreenLaunchModal(false)}
        />
      )}

      {showSurfaceGuideModal && isSurfaceMode && (
        <SurfaceControlGuideModal
          environment={surfaceEnvironment}
          onContinue={() => setShowSurfaceGuideModal(false)}
        />
      )}

      {showSettingsModal && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newVals) => {
            setSettings((prev) => ({ ...prev, ...newVals }));
            if (newVals.graphicsQuality) {
              sceneRef.current?.setQuality(newVals.graphicsQuality);
              surfaceSceneRef.current?.setQuality(newVals.graphicsQuality);
            }
            if (newVals.orbitSpeedMultiplier && sceneRef.current) {
              sceneRef.current.setOrbitSpeed(newVals.orbitSpeedMultiplier);
            }
            if (newVals.soundEffects !== undefined) {
              setSoundEnabled(newVals.soundEffects);
            }
          }}
          onClose={() => setShowSettingsModal(false)}
        />
      )}

      {/* Official NASA Open Data Panel */}
      {showNasaDataModal && (
        <NasaDataView
          onClose={() => {
            setShowNasaDataModal(false);
            setNasaConnected(nasaService.getStatus().connected);
          }}
        />
      )}

      {showNasaArchiveModal && (
        <NasaArchivePanel onClose={() => setShowNasaArchiveModal(false)} />
      )}

      {/* Phase 4: Cinematic Discovery Modal */}
      {cinematicRecord && (
        <CinematicDiscoveryModal
          record={cinematicRecord}
          isCollected={collectedDiscoveries.some((c) => c.nasa_id === cinematicRecord.nasa_id)}
          isSimulatedPoi={cinematicIsPoi}
          onToggleCollect={(rec) => handleToggleCollect(rec, cinematicIsPoi)}
          onClose={() => setCinematicRecord(null)}
        />
      )}

      {/* Discoveries Catalog Modal (from rover HUD or header) */}
      {showDiscoveriesCatalog && (
        <DiscoveriesCatalogModal
          waypoints={waypoints}
          onInspectWaypoint={(wp) => {
            setShowDiscoveriesCatalog(false);
            handleInspectAnomalyWaypoint(wp);
          }}
          onClose={() => setShowDiscoveriesCatalog(false)}
        />
      )}

      {showHeritageModal && (
        <LunarMarsHeritagePreview
          currentView={viewMode}
          onFocusPlanet={(id) => handleFocusPlanet(id)}
          onOpenNasaArchive={() => {
            setShowHeritageModal(false);
            setViewMode('archive');
          }}
          onClose={() => {
            setShowHeritageModal(false);
            if (viewMode === 'moon' || viewMode === 'mars' || viewMode === 'artifacts') {
              setViewMode('mission-control');
            }
          }}
        />
      )}
      {/* 3D Spacecraft Inspection Modal */}
      <SpacecraftInspectionModal
        isOpen={showSpacecraftInspector}
        onClose={() => setShowSpacecraftInspector(false)}
      />
    </div>
  );
}
