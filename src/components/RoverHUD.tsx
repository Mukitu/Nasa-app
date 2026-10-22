import React, { useState, useEffect, useRef } from 'react';
import {
  RoverTelemetry,
  SurfaceWaypoint,
  RoverCameraMode,
} from '../types/simulation';
import { speechNarrationService } from '../services/speechNarrationService';
import { SpokenNarrationBanner } from './SpokenNarrationBanner';
import { VirtualJoystick } from './VirtualJoystick';
import {
  Compass,
  Battery,
  Gauge,
  Navigation,
  RotateCcw,
  LayoutDashboard,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  Search,
  Crosshair,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Pause,
  Play,
  Route,
  Info,
  CheckCircle2,
  Volume2,
  Rocket,
  User,
  Car,
  LogOut,
  Focus,
  Sliders,
} from 'lucide-react';

interface RoverHUDProps {
  environment: 'moon' | 'mars';
  telemetry: RoverTelemetry;
  waypoints: SurfaceWaypoint[];
  activeCameraMode: RoverCameraMode;
  nearestAnomaly: SurfaceWaypoint | null;
  nearestDistance: number;
  selectedWaypointId: string | null;
  explorationMode?: 'walking' | 'driving';
  canEnterRover?: boolean;
  onEnterRover?: () => void;
  onExitRover?: () => void;
  isPaused?: boolean;
  showRouteLine?: boolean;
  justLanded?: boolean;
  onToggleRouteLine?: () => void;
  onTogglePause?: () => void;
  onSelectWaypoint: (id: string) => void;
  onSetCameraMode: (mode: RoverCameraMode) => void;
  onSwitchEnvironment: (env: 'moon' | 'mars') => void;
  onResetRover: () => void;
  onReturnToMissionControl: () => void;
  onLaunchNewMission?: () => void;
  onInspectAnomaly: (waypoint: SurfaceWaypoint) => void;
  onOpenDiscoveriesCatalog: () => void;
  onVirtualControl: (forward: number, turn: number, brake: boolean) => void;
  onJoystickMove?: (x: number, y: number, magnitude: number) => void;
  onJoystickStop?: () => void;
  onRecenterCamera?: () => void;
}

export const RoverHUD: React.FC<RoverHUDProps> = ({
  environment,
  telemetry,
  waypoints,
  activeCameraMode,
  nearestAnomaly,
  nearestDistance,
  selectedWaypointId,
  explorationMode = 'walking',
  canEnterRover = false,
  onEnterRover,
  onExitRover,
  isPaused = false,
  showRouteLine = true,
  justLanded = false,
  onToggleRouteLine,
  onTogglePause,
  onSelectWaypoint,
  onSetCameraMode,
  onSwitchEnvironment,
  onResetRover,
  onReturnToMissionControl,
  onLaunchNewMission,
  onInspectAnomaly,
  onOpenDiscoveriesCatalog,
  onVirtualControl,
  onJoystickMove,
  onJoystickStop,
  onRecenterCamera,
}) => {
  const [isWaypointsOpen, setIsWaypointsOpen] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [steerState, setSteerState] = useState<number>(0);
  const [throttleState, setThrottleState] = useState<number>(0);
  const lastNarratedWpRef = useRef<string | null>(null);

  // Automatically start voice narration when rover/astronaut enters trigger radius (<15m)
  useEffect(() => {
    if (nearestAnomaly && nearestDistance <= 15) {
      if (lastNarratedWpRef.current !== nearestAnomaly.id) {
        lastNarratedWpRef.current = nearestAnomaly.id;
        speechNarrationService.narrateWaypoint(nearestAnomaly);
      }
    } else if (nearestDistance > 15) {
      lastNarratedWpRef.current = null;
    }
  }, [nearestAnomaly, nearestDistance]);

  const envWaypoints = waypoints.filter((w) => w.environment === environment);
  const discoveredCount = envWaypoints.filter((w) => w.discovered).length;
  const activeTarget = envWaypoints.find((w) => w.id === selectedWaypointId) || envWaypoints[0];

  // Radar math: compute relative position of target to player
  const dx = activeTarget ? activeTarget.worldPos.x - telemetry.coordinates.x : 0;
  const dz = activeTarget ? activeTarget.worldPos.z - telemetry.coordinates.z : 0;
  const targetDist = Math.round(Math.hypot(dx, dz));

  // Target relative angle compared to player heading
  const targetWorldAngle = Math.atan2(dx, dz);
  const targetRelativeAngle = targetWorldAngle - (telemetry.headingDeg * (Math.PI / 180));

  // Radar scaling factor: 1 meter = 0.52 radar units (88px radius represents ~170 meters)
  const radarScale = 0.52;
  const radarTargetX = Math.max(-56, Math.min(56, dx * radarScale * 0.75));
  const radarTargetZ = Math.max(-56, Math.min(56, dz * radarScale * 0.75));

  // Mobile Rover Driving controls helper
  const handleSteer = (turn: number) => {
    setSteerState(turn);
    onVirtualControl(throttleState, turn, false);
  };

  const handleThrottle = (forward: number) => {
    setThrottleState(forward);
    onVirtualControl(forward, steerState, false);
  };

  const handleBrake = (brake: boolean) => {
    if (brake) {
      setThrottleState(0);
      onVirtualControl(0, steerState, true);
    } else {
      onVirtualControl(throttleState, steerState, false);
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-2 sm:p-4 select-none overflow-hidden">
      {/* 1. TOP TELEMETRY RIBBON & MISSION CONTROL DOCK */}
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 sm:gap-2">
        {/* Environment Badge & Mode Switcher */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-between sm:justify-start gap-1.5 sm:gap-2 glass-panel rounded-xl px-2.5 sm:px-3 py-1.5 border border-sky-500/25 shadow-xl">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0 ${
                isPaused ? 'bg-amber-400' : 'animate-ping ' + (environment === 'moon' ? 'bg-sky-400' : 'bg-amber-500')
              }`}
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="text-[8px] sm:text-[9px] font-mono-tech uppercase text-slate-400 block -mb-0.5">
                  Surface Operations
                </span>
                <button
                  onClick={() => setShowDisclaimer(!showDisclaimer)}
                  className="text-slate-500 hover:text-sky-300 transition-colors cursor-pointer"
                  title="View Simulation Fidelity Notice"
                >
                  <Info className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                </button>
              </div>
              <h1 className="font-tech text-[11px] sm:text-xs md:text-sm font-bold text-slate-100 tracking-wider">
                {environment === 'moon' ? 'MOON • OCEAN OF STORMS' : 'MARS • JEZERO CRATER'}
              </h1>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 mx-0.5 hidden sm:block" />

          {/* Quick Environment Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSwitchEnvironment('moon')}
              className={`px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-tech font-semibold uppercase transition-all cursor-pointer ${
                environment === 'moon'
                  ? 'bg-sky-500/25 border border-sky-400/60 text-sky-200'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
              }`}
            >
              Moon
            </button>
            <button
              onClick={() => onSwitchEnvironment('mars')}
              className={`px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-tech font-semibold uppercase transition-all cursor-pointer ${
                environment === 'mars'
                  ? 'bg-amber-500/25 border border-amber-400/60 text-amber-200'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
              }`}
            >
              Mars
            </button>

            {onLaunchNewMission && (
              <button
                onClick={onLaunchNewMission}
                className="px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-[11px] font-tech font-bold uppercase transition-all cursor-pointer bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center gap-1 shadow-md active:scale-95"
                title="Launch a New Mission from Launch Pad"
              >
                <Rocket className="w-3 h-3 text-slate-950 shrink-0" />
                <span className="hidden xs:inline">Launch</span>
              </button>
            )}
          </div>

          <div className="h-5 w-px bg-slate-800 mx-0.5 hidden sm:block" />

          {/* Active Exploration Mode Badge (Astronaut EVA vs Rover Driver) */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 sm:py-1 rounded-lg bg-slate-900/90 border border-slate-700/80 text-[10px] sm:text-[11px] font-tech font-bold shadow-md">
            {explorationMode === 'walking' ? (
              <>
                <User className="w-3 h-3 text-sky-400 animate-pulse shrink-0" />
                <span className="text-sky-300">ASTRONAUT EVA</span>
              </>
            ) : (
              <>
                <Car className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-amber-300">ROVER DRIVER</span>
              </>
            )}
          </div>
        </div>

        {/* Telemetry Readouts (Speed, Battery, Distance) */}
        <div className="pointer-events-auto flex items-center justify-between sm:justify-end gap-1 sm:gap-2 text-xs font-mono-tech">
          {/* Speed */}
          <div className="glass-panel px-2 sm:px-2.5 py-1 rounded-lg border border-slate-800/80 flex items-center gap-1.5">
            <Gauge className="w-3 h-3 text-sky-400 shrink-0" />
            <div>
              <span className="text-[7px] sm:text-[8px] text-slate-400 block uppercase leading-none">
                {explorationMode === 'walking' ? 'Walk Speed' : 'Rover Speed'}
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-slate-100 tabular-nums">
                {telemetry.speedKmh} <span className="text-[9px] font-normal text-slate-400">km/h</span>
              </span>
            </div>
          </div>

          {/* Battery */}
          <div className="glass-panel px-2 sm:px-2.5 py-1 rounded-lg border border-slate-800/80 flex items-center gap-1.5">
            <Battery
              className={`w-3 h-3 shrink-0 ${
                telemetry.batteryPercent > 20 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            />
            <div>
              <span className="text-[7px] sm:text-[8px] text-slate-400 block uppercase leading-none">
                Battery
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-slate-100 tabular-nums">
                {telemetry.batteryPercent}%
              </span>
            </div>
          </div>

          {/* Distance */}
          <div className="glass-panel px-2 sm:px-2.5 py-1 rounded-lg border border-slate-800/80 flex items-center gap-1.5">
            <Navigation className="w-3 h-3 text-amber-400 shrink-0" />
            <div>
              <span className="text-[7px] sm:text-[8px] text-slate-400 block uppercase leading-none">
                Distance
              </span>
              <span className="text-[11px] sm:text-xs font-bold text-slate-100 tabular-nums">
                {telemetry.distanceTraveledMeters} <span className="text-[9px] font-normal text-slate-400">m</span>
              </span>
            </div>
          </div>

          {/* Recenter Camera Button in Header Toolbar */}
          {onRecenterCamera && (
            <button
              onClick={onRecenterCamera}
              className="p-1.5 rounded-lg glass-panel text-sky-300 hover:text-white border border-sky-500/40 hover:bg-sky-500/20 transition-all cursor-pointer active:scale-95 shrink-0"
              title="Recenter Camera behind Astronaut/Rover"
            >
              <Focus className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Return to Mission Control */}
          <button
            onClick={onReturnToMissionControl}
            className="p-1.5 rounded-lg glass-panel text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer shrink-0"
            title="Return to Space Mission Control"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Fidelity Notice Popup */}
      {showDisclaimer && (
        <div className="pointer-events-auto self-start mt-1 max-w-sm glass-panel p-2.5 rounded-xl border border-sky-500/40 text-xs text-slate-300 space-y-1 shadow-2xl">
          <div className="flex items-center justify-between text-sky-400 font-tech font-bold text-[10px] uppercase">
            <span>Simulation Fidelity Notice</span>
            <button onClick={() => setShowDisclaimer(false)} className="hover:text-white cursor-pointer">&times;</button>
          </div>
          <p className="text-[10px] text-slate-300 leading-normal font-sans">
            Terrain elevation and surface rocks are an artistic 3D simulation for interactive exploration. Waypoint locations in the 3D world correspond to documented historical NASA landing sites.
          </p>
        </div>
      )}

      {/* Landing Complete & Drive Mode Active Banner */}
      {justLanded && (
        <div className="pointer-events-auto self-center mt-1 px-3 py-1.5 rounded-xl bg-emerald-500/25 border border-emerald-400 text-emerald-300 font-tech font-bold text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>TOUCHDOWN CONFIRMED • EXPLORATION READY</span>
        </div>
      )}

      {/* Paused Overlay Banner */}
      {isPaused && (
        <div className="pointer-events-auto self-center glass-panel px-4 py-2 rounded-2xl border border-amber-400/80 bg-slate-950/90 shadow-2xl flex items-center gap-2.5 animate-pulse">
          <Pause className="w-4 h-4 text-amber-400" />
          <div>
            <span className="font-tech text-xs font-bold text-amber-300 uppercase tracking-widest block">
              SIMULATION PAUSED
            </span>
            <span className="font-mono-tech text-[9px] text-slate-400 block">
              Press [P] or click Resume to continue
            </span>
          </div>
          <button
            onClick={onTogglePause}
            className="ml-2 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-tech font-bold text-xs uppercase rounded cursor-pointer transition-colors"
          >
            Resume
          </button>
        </div>
      )}

      {/* Spoken Voice Narration & Proximity Banner */}
      <SpokenNarrationBanner
        onInspectWaypoint={onInspectAnomaly}
        nearestAnomaly={nearestAnomaly}
        nearestDistance={nearestDistance}
      />

      {/* 2. BOTTOM CONTROL & NAVIGATION DOCK */}
      <div className="w-full flex items-end justify-between gap-2 pt-1 pb-safe pointer-events-none">
        {/* LEFT CORNER: ASTRONAUT JOYSTICK (WALKING) OR ROVER STEERING (DRIVING) */}
        <div className="pointer-events-auto flex flex-col items-start gap-1.5">
          {/* Astronaut Walking Mode: Continuous Analog Touch Joystick */}
          {explorationMode === 'walking' && onJoystickMove && onJoystickStop && (
            <div className="touch-none select-none animate-in fade-in zoom-in-95 duration-200">
              <VirtualJoystick
                onMove={onJoystickMove}
                onStop={onJoystickStop}
                label="WALK JOYSTICK"
                size={116}
              />
            </div>
          )}

          {/* Rover Driving Mode: Mobile Steering Pad */}
          {explorationMode === 'driving' && (
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-2xl glass-panel border border-amber-500/30 bg-slate-950/90 shadow-2xl touch-none select-none animate-in fade-in zoom-in-95 duration-200">
              <span className="text-[8px] font-mono-tech text-amber-400 font-bold uppercase tracking-wider">
                STEERING CONTROL
              </span>
              <div className="flex items-center gap-2">
                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleSteer(-1);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    handleSteer(0);
                  }}
                  onPointerLeave={() => handleSteer(0)}
                  className={`w-14 h-12 rounded-xl flex items-center justify-center font-bold text-base shadow-md active:scale-95 transition-all cursor-pointer ${
                    steerState === -1
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.7)]'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                  aria-label="Steer Rover Left"
                >
                  <ArrowLeft className="w-6 h-6" />
                </button>

                <button
                  onPointerDown={(e) => {
                    e.preventDefault();
                    handleSteer(1);
                  }}
                  onPointerUp={(e) => {
                    e.preventDefault();
                    handleSteer(0);
                  }}
                  onPointerLeave={() => handleSteer(0)}
                  className={`w-14 h-12 rounded-xl flex items-center justify-center font-bold text-base shadow-md active:scale-95 transition-all cursor-pointer ${
                    steerState === 1
                      ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.7)]'
                      : 'bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                  aria-label="Steer Rover Right"
                >
                  <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            </div>
          )}

          {/* Waypoints Drawer Button (Compact on Mobile) */}
          <div className="relative">
            <button
              onClick={() => setIsWaypointsOpen(!isWaypointsOpen)}
              className="px-2.5 py-1.5 rounded-xl glass-panel border border-sky-500/30 bg-slate-950/80 text-[10px] font-tech text-sky-300 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:bg-slate-900 transition-colors cursor-pointer"
            >
              <Crosshair className="w-3 h-3 text-sky-400" />
              <span>Waypoints ({discoveredCount}/{envWaypoints.length})</span>
              {isWaypointsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
            </button>

            {/* Waypoints Popover List */}
            {isWaypointsOpen && (
              <div className="absolute bottom-10 left-0 w-72 sm:w-80 max-h-56 overflow-y-auto custom-scrollbar glass-panel rounded-xl p-2.5 border border-sky-500/40 bg-slate-950/95 shadow-2xl space-y-1.5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-[10px] font-tech font-bold uppercase text-slate-300">
                    Mission Sites ({environment.toUpperCase()})
                  </span>
                  <button
                    onClick={() => setIsWaypointsOpen(false)}
                    className="text-slate-400 hover:text-white text-xs px-1"
                  >
                    &times;
                  </button>
                </div>

                {envWaypoints.map((wp) => {
                  const isSelected = wp.id === activeTarget?.id;
                  const d = Math.round(
                    Math.hypot(
                      wp.worldPos.x - telemetry.coordinates.x,
                      wp.worldPos.z - telemetry.coordinates.z
                    )
                  );

                  return (
                    <button
                      key={wp.id}
                      onClick={() => {
                        onSelectWaypoint(wp.id);
                        setIsWaypointsOpen(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg transition-all cursor-pointer border flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-sky-500/25 border-sky-400 text-white font-semibold'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-tech block truncate text-[11px]">
                          {wp.name}
                        </span>
                        <span className="text-[8px] font-mono-tech text-slate-400 block truncate">
                          Landed {wp.landingYear} &bull; {wp.equipmentType}
                        </span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-mono-tech text-sky-300 font-bold block tabular-nums">
                          {d}m
                        </span>
                        <span
                          className={`text-[7px] font-mono-tech uppercase ${
                            wp.discovered ? 'text-emerald-400 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {wp.discovered ? 'Found' : 'Unexplored'}
                        </span>
                      </div>
                    </button>
                  );
                })}

                <button
                  onClick={() => {
                    setIsWaypointsOpen(false);
                    onOpenDiscoveriesCatalog();
                  }}
                  className="w-full mt-1 py-1.5 px-2 rounded bg-slate-800/80 hover:bg-slate-700 text-amber-300 text-[10px] font-tech uppercase font-semibold flex items-center justify-center gap-1 border border-amber-500/30 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Open Discoveries Catalog</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* CENTER: INTERACTIVE ACTION PROMPT (DRIVE ROVER OR EXIT ROVER) */}
        <div className="pointer-events-auto flex flex-col items-center gap-2 mb-1">
          {/* Contextual DRIVE / ENTER ROVER interaction button */}
          {explorationMode === 'walking' && canEnterRover && onEnterRover && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={onEnterRover}
                className="flex items-center gap-2.5 sm:gap-3.5 px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-2xl bg-gradient-to-r from-sky-500 via-sky-400 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-tech font-extrabold text-xs sm:text-base tracking-wider shadow-[0_0_24px_rgba(56,189,248,0.7)] border-2 border-white/60 transition-all transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <Car className="w-5 h-5 sm:w-6 sm:h-6 text-slate-950 animate-bounce shrink-0" />
                <div className="text-left">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span>DRIVE / ENTER ROVER</span>
                    <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-white font-mono-tech">
                      [E] / [R]
                    </span>
                  </div>
                  <p className="text-[9px] sm:text-[11px] text-slate-950/80 font-normal font-sans hidden xs:block">
                    Climb into cockpit to drive across terrain
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Persistent EXIT ROVER button while driving */}
          {explorationMode === 'driving' && onExitRover && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
              <button
                onClick={onExitRover}
                className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-tech font-bold text-xs sm:text-sm tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.6)] border-2 border-amber-200 transition-all transform hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 shrink-0" />
                <div className="text-left">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span>EXIT ROVER</span>
                    <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-black/30 text-white font-mono-tech">
                      [E] / [R]
                    </span>
                  </div>
                  <p className="text-[9px] text-slate-950/80 font-normal font-sans hidden sm:block">
                    Step outside to walk on foot
                  </p>
                </div>
              </button>
            </div>
          )}

          {/* Desktop Keyboard Controls HUD Hint */}
          <div className="hidden md:flex items-center gap-2 text-[9px] font-mono-tech text-slate-400 glass-panel px-3 py-1 rounded-full border border-slate-800/70">
            <span>Move: <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-200 font-bold">WASD</kbd></span>
            <span>&bull;</span>
            <span>Rover: <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-200 font-bold">E</kbd></span>
            <span>&bull;</span>
            <span>Camera: <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-200 font-bold">C</kbd></span>
            <span>&bull;</span>
            <span>Pause: <kbd className="px-1 py-0.2 rounded bg-slate-800 text-slate-200 font-bold">P</kbd></span>
          </div>
        </div>

        {/* RIGHT CORNER: RADAR MINIMAP & DRIVING PEDALS (WHEN DRIVING) */}
        <div className="pointer-events-auto flex flex-col items-end gap-1.5">
          {/* Rover Driving Mode: Mobile Driving Pedals (Drive, Reverse, Brake) */}
          {explorationMode === 'driving' && (
            <div className="flex items-center gap-1.5 p-2 rounded-2xl glass-panel border border-amber-500/30 bg-slate-950/90 shadow-2xl touch-none select-none animate-in fade-in zoom-in-95 duration-200">
              {/* Brake Pedal */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleBrake(true);
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  handleBrake(false);
                }}
                onPointerLeave={() => handleBrake(false)}
                className="w-12 h-12 rounded-xl bg-rose-700 hover:bg-rose-600 active:bg-rose-500 text-white flex flex-col items-center justify-center font-bold text-[9px] uppercase shadow-md active:scale-95 transition-all cursor-pointer"
                aria-label="Rover Brake"
              >
                <Pause className="w-4 h-4" />
                <span>BRAKE</span>
              </button>

              {/* Reverse Pedal */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleThrottle(-1);
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  handleThrottle(0);
                }}
                onPointerLeave={() => handleThrottle(0)}
                className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-[9px] uppercase shadow-md active:scale-95 transition-all cursor-pointer ${
                  throttleState === -1
                    ? 'bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.7)]'
                    : 'bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700'
                }`}
                aria-label="Rover Reverse"
              >
                <ArrowDown className="w-4 h-4" />
                <span>REV</span>
              </button>

              {/* Forward Drive / Accelerator Pedal */}
              <button
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleThrottle(1);
                }}
                onPointerUp={(e) => {
                  e.preventDefault();
                  handleThrottle(0);
                }}
                onPointerLeave={() => handleThrottle(0)}
                className={`w-14 h-12 rounded-xl flex flex-col items-center justify-center font-bold text-[10px] uppercase shadow-lg active:scale-95 transition-all cursor-pointer ${
                  throttleState === 1
                    ? 'bg-emerald-400 text-slate-950 shadow-[0_0_18px_rgba(52,211,153,0.8)]'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                }`}
                aria-label="Rover Accelerate Forward"
              >
                <ArrowUp className="w-5 h-5" />
                <span>DRIVE</span>
              </button>
            </div>
          )}

          {/* Circular Radar / Minimap & Camera Toolbar */}
          <div className="flex items-end gap-1.5">
            {/* Toolbar icons (Camera Recenter, View Switcher, Pause) */}
            <div className="flex flex-col items-center gap-1">
              {/* Recenter Camera */}
              {onRecenterCamera && (
                <button
                  onClick={onRecenterCamera}
                  className="p-1.5 rounded-lg glass-panel text-sky-400 hover:text-white border border-sky-500/40 hover:bg-sky-500/20 transition-all cursor-pointer active:scale-95 shadow-md"
                  title="Recenter Camera Behind Character"
                >
                  <Focus className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Route Line Toggle */}
              {onToggleRouteLine && (
                <button
                  onClick={onToggleRouteLine}
                  className={`p-1.5 rounded-lg glass-panel border transition-colors cursor-pointer ${
                    showRouteLine
                      ? 'border-sky-400/60 text-sky-300 bg-sky-500/20'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={showRouteLine ? 'Hide 3D Route Line' : 'Show 3D Route Line'}
                >
                  <Route className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Pause Simulation Button */}
              {onTogglePause && (
                <button
                  onClick={onTogglePause}
                  className={`p-1.5 rounded-lg glass-panel border transition-colors cursor-pointer ${
                    isPaused
                      ? 'border-amber-400/80 text-amber-300 bg-amber-500/25'
                      : 'border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                  title={isPaused ? 'Resume Simulation' : 'Pause Simulation'}
                >
                  {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                </button>
              )}

              {/* Camera Mode Toggle */}
              <button
                onClick={() => {
                  const modes: RoverCameraMode[] = ['follow', 'cockpit', 'free'];
                  const next = modes[(modes.indexOf(activeCameraMode) + 1) % modes.length];
                  onSetCameraMode(next);
                }}
                className="px-1.5 py-1 rounded-lg glass-panel border border-slate-700 text-[9px] font-tech text-sky-300 font-semibold uppercase transition-colors cursor-pointer"
                title={`Camera Mode: ${activeCameraMode.toUpperCase()}`}
              >
                {activeCameraMode === 'follow' ? 'CHASE' : activeCameraMode === 'cockpit' ? 'MAST' : 'FREE'}
              </button>
            </div>

            {/* Circular Radar / Minimap */}
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 rounded-full glass-panel border border-sky-400/40 p-1 flex items-center justify-center shadow-2xl overflow-hidden bg-slate-950/95 shrink-0">
              {/* Concentric radar rings */}
              <div className="absolute inset-2 sm:inset-3 rounded-full border border-sky-500/20" />
              <div className="absolute inset-5 sm:inset-7 rounded-full border border-sky-500/25" />
              <div className="absolute inset-8 sm:inset-11 rounded-full border border-sky-500/30" />

              {/* Radar Crosshair axes */}
              <div className="absolute w-full h-px bg-sky-500/20" />
              <div className="absolute h-full w-px bg-sky-500/20" />

              {/* Radar Sweep Effect */}
              <div
                className="absolute w-full h-full rounded-full pointer-events-none"
                style={{
                  background: 'conic-gradient(from 0deg, transparent 0deg, rgba(56, 189, 248, 0.15) 60deg, transparent 65deg)',
                  animation: isPaused ? 'none' : 'spin 4s linear infinite',
                }}
              />

              {/* Radar Route Line SVG */}
              {showRouteLine && activeTarget && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="-64 -64 128 128">
                  <line
                    x1="0"
                    y1="0"
                    x2={radarTargetX}
                    y2={radarTargetZ}
                    stroke={environment === 'moon' ? '#38bdf8' : '#f59e0b'}
                    strokeDasharray="3 2"
                    strokeWidth="1.5"
                    strokeOpacity="0.8"
                  />
                </svg>
              )}

              {/* Waypoints plotted on Radar */}
              {envWaypoints.map((wp) => {
                const relX = wp.worldPos.x - telemetry.coordinates.x;
                const relZ = wp.worldPos.z - telemetry.coordinates.z;
                const px = Math.max(-44, Math.min(44, relX * radarScale * 0.75));
                const pz = Math.max(-44, Math.min(44, relZ * radarScale * 0.75));
                const isTarget = wp.id === activeTarget?.id;

                return (
                  <div
                    key={wp.id}
                    className={`absolute w-2 h-2 -ml-1 -mt-1 rounded-full transition-transform z-20 ${
                      wp.discovered
                        ? 'bg-emerald-400 shadow-[0_0_6px_#10b981]'
                        : isTarget
                        ? 'bg-amber-400 animate-ping shadow-[0_0_8px_#f59e0b]'
                        : 'bg-sky-400 shadow-[0_0_5px_#38bdf8]'
                    }`}
                    style={{
                      transform: `translate(${px}px, ${pz}px)`,
                    }}
                    title={`${wp.name}`}
                  />
                );
              })}

              {/* Player Center Icon with Heading Needle */}
              <div className="relative z-30 w-3 h-3 rounded-full bg-slate-100 border-2 border-sky-500 flex items-center justify-center shadow-md">
                <div
                  className="w-0 h-0 border-l-[2.5px] border-l-transparent border-r-[2.5px] border-r-transparent border-b-[6px] border-b-sky-400 -mt-2"
                  style={{
                    transform: `rotate(${-telemetry.headingDeg}deg)`,
                    transformOrigin: '50% 100%',
                  }}
                />
              </div>

              {/* Target Direction Pointer on Radar Rim */}
              {activeTarget && (
                <div
                  className="absolute inset-1 flex items-start justify-center pointer-events-none z-20"
                  style={{
                    transform: `rotate(${targetRelativeAngle}rad)`,
                  }}
                >
                  <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[7px] border-b-amber-400" />
                </div>
              )}

              {/* Radar Distance Tag */}
              <div className="absolute bottom-1 text-[7px] sm:text-[8px] font-mono-tech text-sky-400 font-bold bg-slate-900/90 px-1.5 py-0.2 rounded-full border border-sky-500/30 z-30">
                {targetDist}m TARGET
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
