import React, { useState, useEffect, useRef } from 'react';
import {
  RoverTelemetry,
  SurfaceWaypoint,
  RoverCameraMode,
} from '../types/simulation';
import { speechNarrationService } from '../services/speechNarrationService';
import { SpokenNarrationBanner } from './SpokenNarrationBanner';
import {
  Compass,
  Battery,
  Gauge,
  Navigation,
  RotateCcw,
  LayoutDashboard,
  Eye,
  EyeOff,
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
  Hand,
  Pause,
  Play,
  Route,
  Info,
  CheckCircle2,
  Volume2,
} from 'lucide-react';

interface RoverHUDProps {
  environment: 'moon' | 'mars';
  telemetry: RoverTelemetry;
  waypoints: SurfaceWaypoint[];
  activeCameraMode: RoverCameraMode;
  nearestAnomaly: SurfaceWaypoint | null;
  nearestDistance: number;
  selectedWaypointId: string | null;
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
  onInspectAnomaly: (waypoint: SurfaceWaypoint) => void;
  onOpenDiscoveriesCatalog: () => void;
  onVirtualControl: (forward: number, turn: number, brake: boolean) => void;
}

export const RoverHUD: React.FC<RoverHUDProps> = ({
  environment,
  telemetry,
  waypoints,
  activeCameraMode,
  nearestAnomaly,
  nearestDistance,
  selectedWaypointId,
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
  onInspectAnomaly,
  onOpenDiscoveriesCatalog,
  onVirtualControl,
}) => {
  const [isWaypointsOpen, setIsWaypointsOpen] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const lastNarratedWpRef = useRef<string | null>(null);

  // Automatically start voice narration when rover enters trigger radius (<12m)
  useEffect(() => {
    if (nearestAnomaly && nearestDistance <= 12) {
      if (lastNarratedWpRef.current !== nearestAnomaly.id) {
        lastNarratedWpRef.current = nearestAnomaly.id;
        speechNarrationService.narrateWaypoint(nearestAnomaly);
      }
    } else if (nearestDistance > 18) {
      // Reset trigger lock when moving away
      lastNarratedWpRef.current = null;
    }
  }, [nearestAnomaly, nearestDistance]);

  const envWaypoints = waypoints.filter((w) => w.environment === environment);
  const discoveredCount = envWaypoints.filter((w) => w.discovered).length;

  const activeTarget = envWaypoints.find((w) => w.id === selectedWaypointId) || envWaypoints[0];

  // Radar math: compute relative position of target to rover
  const dx = activeTarget ? activeTarget.worldPos.x - telemetry.coordinates.x : 0;
  const dz = activeTarget ? activeTarget.worldPos.z - telemetry.coordinates.z : 0;
  const targetDist = Math.round(Math.hypot(dx, dz));

  // Target relative angle compared to rover heading
  const targetWorldAngle = Math.atan2(dx, dz);
  const targetRelativeAngle = targetWorldAngle - (telemetry.headingDeg * (Math.PI / 180));

  // Radar scaling factor: 1 meter = 0.52 radar units (88px radius represents ~170 meters)
  const radarScale = 0.52;
  const radarTargetX = Math.max(-76, Math.min(76, dx * radarScale));
  const radarTargetZ = Math.max(-76, Math.min(76, dz * radarScale));

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-2.5 sm:p-4 select-none">
      {/* 1. TOP TELEMETRY RIBBON & MISSION CONTROL DOCK */}
      <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Environment Badge & Mode Switcher */}
        <div className="pointer-events-auto flex flex-wrap items-center gap-2 glass-panel rounded-xl px-3 py-1.5 sm:py-2 border border-sky-500/25 shadow-xl">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isPaused ? 'bg-amber-400' : 'animate-ping ' + (environment === 'moon' ? 'bg-sky-400' : 'bg-amber-500')
              }`}
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-mono-tech uppercase text-slate-400 block -mb-0.5">
                  Surface Operations &bull; Simulated Environment
                </span>
                <button
                  onClick={() => setShowDisclaimer(!showDisclaimer)}
                  className="text-slate-500 hover:text-sky-300 transition-colors cursor-pointer"
                  title="View Simulation Fidelity Notice"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <h1 className="font-tech text-xs sm:text-sm font-bold text-slate-100 tracking-wider">
                {environment === 'moon' ? 'LUNAR SURFACE • MARE TRANQUILLITATIS' : 'MARTIAN SURFACE • JEZERO CRATER'}
              </h1>
            </div>
          </div>

          <div className="h-6 w-px bg-slate-800 mx-1 hidden sm:block" />

          {/* Quick Environment Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSwitchEnvironment('moon')}
              className={`px-2.5 py-1 rounded text-[11px] font-tech font-semibold uppercase transition-all cursor-pointer ${
                environment === 'moon'
                  ? 'bg-sky-500/25 border border-sky-400/60 text-sky-200'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
              }`}
            >
              Moon
            </button>
            <button
              onClick={() => onSwitchEnvironment('mars')}
              className={`px-2.5 py-1 rounded text-[11px] font-tech font-semibold uppercase transition-all cursor-pointer ${
                environment === 'mars'
                  ? 'bg-amber-500/25 border border-amber-400/60 text-amber-200'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-900/60'
              }`}
            >
              Mars
            </button>
          </div>
        </div>

        {/* Telemetry Readouts Explicitly Labeled as Simulated Values */}
        <div className="pointer-events-auto flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 text-xs font-mono-tech">
          {/* Speed */}
          <div className="glass-panel px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800/80 flex items-center gap-1.5 sm:gap-2">
            <Gauge className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <div>
              <span className="text-[8px] sm:text-[9px] text-slate-400 block uppercase leading-none">
                Sim Speed
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-100 tabular-nums">
                {telemetry.speedKmh} <span className="text-[10px] font-normal text-slate-400">km/h</span>
              </span>
            </div>
          </div>

          {/* Battery */}
          <div className="glass-panel px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800/80 flex items-center gap-1.5 sm:gap-2">
            <Battery
              className={`w-3.5 h-3.5 shrink-0 ${
                telemetry.batteryPercent > 20 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            />
            <div>
              <span className="text-[8px] sm:text-[9px] text-slate-400 block uppercase leading-none">
                Sim Battery
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-100 tabular-nums">
                {telemetry.batteryPercent}%
              </span>
            </div>
          </div>

          {/* Odometry Distance */}
          <div className="glass-panel px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800/80 flex items-center gap-1.5 sm:gap-2">
            <Navigation className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <div>
              <span className="text-[8px] sm:text-[9px] text-slate-400 block uppercase leading-none">
                Sim Odometry
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-100 tabular-nums">
                {telemetry.distanceTraveledMeters} <span className="text-[10px] font-normal text-slate-400">m</span>
              </span>
            </div>
          </div>

          {/* Heading */}
          <div className="glass-panel px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800/80 hidden md:flex items-center gap-2">
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-[8px] sm:text-[9px] text-slate-400 block uppercase leading-none">
                Sim Heading
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-100 tabular-nums">
                {telemetry.headingDeg}&deg;
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Fidelity Notice Popup (if toggled) */}
      {showDisclaimer && (
        <div className="pointer-events-auto self-start mt-2 max-w-md glass-panel p-3 rounded-xl border border-sky-500/40 text-xs text-slate-300 space-y-1.5 shadow-2xl">
          <div className="flex items-center justify-between text-sky-400 font-tech font-bold text-[11px] uppercase">
            <span>Simulation Fidelity Notice</span>
            <button onClick={() => setShowDisclaimer(false)} className="hover:text-white cursor-pointer">&times;</button>
          </div>
          <p className="text-[11px] text-slate-300 leading-normal font-sans">
            Terrain elevation and surface rocks are an artistic 3D simulation for interactive exploration and do not constitute a 1:1 metric orbital elevation model. Waypoint locations in the 3D world are gameplay simulation waypoints corresponding to documented historical NASA landing sites.
          </p>
        </div>
      )}

      {/* Landing Complete & Drive Mode Active Notification Banner */}
      {justLanded && (
        <div className="pointer-events-auto self-center mt-2 px-4 py-2 rounded-xl bg-emerald-500/25 border border-emerald-400 text-emerald-300 font-tech font-bold text-xs sm:text-sm uppercase tracking-widest shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>LANDING COMPLETE — DRIVE MODE ACTIVE</span>
        </div>
      )}

      {/* Paused Overlay Banner */}
      {isPaused && (
        <div className="pointer-events-auto self-center glass-panel px-5 py-2.5 rounded-2xl border border-amber-400/80 bg-slate-950/90 shadow-2xl flex items-center gap-3 animate-pulse">
          <Pause className="w-5 h-5 text-amber-400" />
          <div>
            <span className="font-tech text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-widest block">
              ROVER SIMULATION PAUSED
            </span>
            <span className="font-mono-tech text-[10px] text-slate-400 block">
              Press [P] or click Resume to continue driving
            </span>
          </div>
          <button
            onClick={onTogglePause}
            className="ml-2 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-tech font-bold text-xs uppercase rounded cursor-pointer transition-colors"
          >
            Resume
          </button>
        </div>
      )}

      {/* 2. PROXIMITY ANOMALY DETECTION BANNER */}
      {nearestAnomaly && nearestDistance <= 12 && (
        <div className="pointer-events-auto self-center max-w-xl w-full my-auto animate-bounce">
          <div className="glass-panel rounded-xl p-4 border border-emerald-400/80 bg-slate-950/95 shadow-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-tech text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  HISTORICAL EQUIPMENT DETECTED ({nearestDistance}m)
                </span>
              </div>
              <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-200">
                Landed {nearestAnomaly.landingYear}
              </span>
            </div>

            <h3 className="font-tech text-base sm:text-lg font-bold text-white tracking-wide">
              {nearestAnomaly.name}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {nearestAnomaly.description}
            </p>

            <div className="pt-1 text-[10px] font-mono-tech text-slate-400 border-t border-slate-800">
              Authentic NASA Coordinates: <span className="text-emerald-300">{nearestAnomaly.realCoordinatesText}</span>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => onInspectAnomaly(nearestAnomaly)}
                className="w-full sm:flex-1 py-2 px-3 rounded-lg text-xs font-tech font-bold uppercase tracking-wider bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <Search className="w-4 h-4" />
                <span>Inspect NASA Archive &amp; Photos [Press E]</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location-Triggered Spoken Mission Narration Banner with Subtitles */}
      <SpokenNarrationBanner onInspectWaypoint={onInspectAnomaly} />

      {/* 3. BOTTOM CONTROL & NAVIGATION DECK */}
      <div className="w-full flex flex-col sm:flex-row items-end justify-between gap-3 pt-2">
        {/* Left: Waypoint Drawer & Discoveries Button */}
        <div className="pointer-events-auto flex flex-col gap-2 w-full sm:w-80">
          <div className="glass-panel rounded-xl p-2.5 border border-sky-500/20 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                <span className="font-tech text-xs font-bold uppercase tracking-wide text-slate-200">
                  Simulation Waypoints ({discoveredCount}/{envWaypoints.length})
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsWaypointsOpen(!isWaypointsOpen)}
                  className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Toggle Waypoint List"
                >
                  {isWaypointsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Waypoints List */}
            {isWaypointsOpen && (
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar pr-1 pt-1">
                {envWaypoints.map((wp) => {
                  const isSelected = wp.id === activeTarget?.id;
                  const d = Math.round(Math.hypot(
                    wp.worldPos.x - telemetry.coordinates.x,
                    wp.worldPos.z - telemetry.coordinates.z
                  ));

                  return (
                    <button
                      key={wp.id}
                      onClick={() => onSelectWaypoint(wp.id)}
                      className={`w-full text-left p-2 rounded-lg transition-all cursor-pointer border flex items-center justify-between text-xs ${
                        isSelected
                          ? 'bg-sky-500/20 border-sky-400/60 text-white'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className="font-tech font-semibold block truncate text-[11px]">
                          {wp.name}
                        </span>
                        <span className="text-[9px] font-mono-tech text-slate-400 block truncate">
                          {wp.equipmentType}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectWaypoint(wp.id);
                            speechNarrationService.narrateWaypoint(wp);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 border border-slate-700 hover:border-emerald-500/40 transition-colors"
                          title="Listen to Spoken Story"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                        <div className="text-right">
                          <span className="text-[10px] font-mono-tech text-sky-300 font-bold block tabular-nums">
                            {d}m
                          </span>
                          <span className={`text-[8px] font-mono-tech uppercase ${wp.discovered ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
                            {wp.discovered ? 'Discovered' : 'Unexplored'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Currently Tracked Waypoint Banner */}
            {activeTarget && (
              <div className="p-2 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
                <div className="truncate pr-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[8px] font-mono-tech uppercase text-sky-400 block">
                      Tracking Target [Sim Waypoint]:
                    </span>
                  </div>
                  <span className="font-tech font-bold text-sky-300 truncate block text-[11px]">
                    {activeTarget.name}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono-tech font-bold text-xs text-slate-100 tabular-nums">
                    {targetDist}m
                  </span>
                </div>
              </div>
            )}

            {/* Discoveries Log Button */}
            <button
              onClick={onOpenDiscoveriesCatalog}
              className="w-full py-1.5 px-2.5 rounded bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-tech font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Artifact Discoveries Catalog</span>
            </button>
          </div>
        </div>

        {/* Center: Drive Instructions & Virtual Touch D-Pad */}
        <div className="pointer-events-auto flex flex-col items-center gap-2">
          {/* Desktop Keyboard Controls HUD */}
          <div className="hidden sm:flex items-center gap-2 text-[10px] font-mono-tech text-slate-400 glass-panel px-3 py-1.5 rounded-full border border-slate-800/70">
            <span>Drive: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">W</kbd><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">A</kbd><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">S</kbd><kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">D</kbd></span>
            <span>&bull;</span>
            <span>Brake: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">Space</kbd></span>
            <span>&bull;</span>
            <span>Camera: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">C</kbd></span>
            <span>&bull;</span>
            <span>Pause: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 font-bold">P</kbd></span>
          </div>

          {/* Toggle Mobile / Virtual Controls */}
          <button
            onClick={() => setShowTouchControls(!showTouchControls)}
            className="sm:hidden py-1 px-3 rounded-full glass-panel border border-sky-400/40 text-xs font-tech text-sky-300 flex items-center gap-1.5 shadow-md"
          >
            <Hand className="w-3.5 h-3.5" />
            <span>{showTouchControls ? 'Hide Touch Controls' : 'Show Touch D-Pad'}</span>
          </button>

          {/* Virtual Touch D-Pad for Mobile Driving */}
          {showTouchControls && (
            <div className="flex flex-col items-center gap-1.5 p-3 rounded-2xl glass-panel border border-sky-500/30 bg-slate-950/90 shadow-2xl touch-none">
              <button
                onPointerDown={() => onVirtualControl(1, 0, false)}
                onPointerUp={() => onVirtualControl(0, 0, false)}
                onPointerLeave={() => onVirtualControl(0, 0, false)}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-sky-600 active:bg-sky-500 text-white flex items-center justify-center font-bold text-lg shadow-md active:scale-95"
              >
                <ArrowUp className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onPointerDown={() => onVirtualControl(0, -1, false)}
                  onPointerUp={() => onVirtualControl(0, 0, false)}
                  onPointerLeave={() => onVirtualControl(0, 0, false)}
                  className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-sky-600 active:bg-sky-500 text-white flex items-center justify-center font-bold text-lg shadow-md active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onPointerDown={() => onVirtualControl(0, 0, true)}
                  onPointerUp={() => onVirtualControl(0, 0, false)}
                  onPointerLeave={() => onVirtualControl(0, 0, false)}
                  className="w-12 h-12 rounded-xl bg-rose-700 hover:bg-rose-600 active:bg-rose-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-md active:scale-95"
                >
                  Brake
                </button>
                <button
                  onPointerDown={() => onVirtualControl(0, 1, false)}
                  onPointerUp={() => onVirtualControl(0, 0, false)}
                  onPointerLeave={() => onVirtualControl(0, 0, false)}
                  className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-sky-600 active:bg-sky-500 text-white flex items-center justify-center font-bold text-lg shadow-md active:scale-95"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>

              <button
                onPointerDown={() => onVirtualControl(-1, 0, false)}
                onPointerUp={() => onVirtualControl(0, 0, false)}
                onPointerLeave={() => onVirtualControl(0, 0, false)}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-sky-600 active:bg-sky-500 text-white flex items-center justify-center font-bold text-lg shadow-md active:scale-95"
              >
                <ArrowDown className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Right: Circular Radar HUD & Quick Actions */}
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          {/* Circular Radar / Minimap */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full glass-panel border border-sky-400/40 p-1 flex items-center justify-center shadow-2xl overflow-hidden bg-slate-950/95">
            {/* Concentric radar rings */}
            <div className="absolute inset-4 rounded-full border border-sky-500/20" />
            <div className="absolute inset-8 rounded-full border border-sky-500/25" />
            <div className="absolute inset-12 rounded-full border border-sky-500/30" />

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

            {/* Radar Holographic Route Line SVG (Connecting Rover to Selected Target) */}
            {showRouteLine && activeTarget && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="-88 -88 176 176">
                <line
                  x1="0"
                  y1="0"
                  x2={radarTargetX}
                  y2={radarTargetZ}
                  stroke={environment === 'moon' ? '#38bdf8' : '#f59e0b'}
                  strokeDasharray="4 3"
                  strokeWidth="1.5"
                  strokeOpacity="0.8"
                />
              </svg>
            )}

            {/* Waypoints plotted on Radar */}
            {envWaypoints.map((wp) => {
              const relX = wp.worldPos.x - telemetry.coordinates.x;
              const relZ = wp.worldPos.z - telemetry.coordinates.z;
              const px = Math.max(-76, Math.min(76, relX * radarScale));
              const pz = Math.max(-76, Math.min(76, relZ * radarScale));

              const isTarget = wp.id === activeTarget?.id;

              return (
                <div
                  key={wp.id}
                  className={`absolute w-2.5 h-2.5 -ml-1.25 -mt-1.25 rounded-full transition-transform z-20 ${
                    wp.discovered
                      ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                      : isTarget
                      ? 'bg-amber-400 animate-ping shadow-[0_0_10px_#f59e0b]'
                      : 'bg-sky-400 shadow-[0_0_6px_#38bdf8]'
                  }`}
                  style={{
                    transform: `translate(${px}px, ${pz}px)`,
                  }}
                  title={`${wp.name} [Simulation Waypoint]`}
                />
              );
            })}

            {/* Rover Center Icon with Heading Needle */}
            <div className="relative z-30 w-3.5 h-3.5 rounded-full bg-slate-100 border-2 border-sky-500 flex items-center justify-center shadow-md">
              <div
                className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[8px] border-b-sky-400 -mt-2.5"
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
                <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[8px] border-b-amber-400" />
              </div>
            )}

            {/* Radar Coordinates & Distance Tag */}
            <div className="absolute bottom-1.5 text-[8px] sm:text-[9px] font-mono-tech text-sky-400 font-bold bg-slate-900/90 px-2 py-0.5 rounded-full border border-sky-500/30 z-30">
              {targetDist}m TO TARGET
            </div>
          </div>

          {/* Camera View Switcher & Actions Toolbar */}
          <div className="flex flex-wrap items-center justify-end gap-1.5">
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
                <Route className="w-4 h-4" />
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
                title={isPaused ? 'Resume Driving (P)' : 'Pause Driving (P)'}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>
            )}

            {/* Camera View Switcher */}
            <div className="flex items-center glass-panel rounded-lg p-0.5 border border-slate-800 text-[11px] font-tech font-semibold">
              <button
                onClick={() => onSetCameraMode('follow')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  activeCameraMode === 'follow' ? 'bg-sky-500/25 text-sky-300' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Third-Person Chase Camera"
              >
                Chase
              </button>
              <button
                onClick={() => onSetCameraMode('cockpit')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  activeCameraMode === 'cockpit' ? 'bg-sky-500/25 text-sky-300' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="First-Person Mast Camera"
              >
                Mast-Cam
              </button>
              <button
                onClick={() => onSetCameraMode('free')}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  activeCameraMode === 'free' ? 'bg-sky-500/25 text-sky-300' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Free Orbit Camera (Drag to look)"
              >
                Free
              </button>
            </div>

            {/* Reset Rover Position */}
            <button
              onClick={onResetRover}
              className="p-1.5 rounded-lg glass-panel text-slate-400 hover:text-sky-300 border border-slate-800 transition-colors cursor-pointer"
              title="Reset Rover to Start Coordinates"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Return to Mission Control */}
            <button
              onClick={onReturnToMissionControl}
              className="p-1.5 rounded-lg glass-panel text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors cursor-pointer"
              title="Return to Space Mission Control"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
