import React, { useState, useEffect } from 'react';
import {
  LaunchTarget,
  MissionPhase,
  SpacecraftOption,
  LaunchChecklistState,
} from '../types/simulation';
import { SPACECRAFT_FLEET } from '../data/planets';
import { aerospaceAudio } from '../utils/audio';
import {
  Rocket,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  RotateCcw,
  CheckCheck,
  Minimize2,
  Maximize2,
  X,
  Compass,
  ArrowRight,
  ShieldCheck,
  Video,
  ListOrdered,
  Layers,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface LaunchPreparationModuleProps {
  missionPhase: MissionPhase;
  target: LaunchTarget;
  selectedSpacecraft: SpacecraftOption;
  altitudeKm: number;
  velocityKmh: number;
  launchProgress: number;
  autoLaunchActive: boolean;
  onSetLaunchProgress: (progress: number) => void;
  onToggleAutoLaunch: () => void;
  onResetFlight: () => void;
  onResetAndLaunch: () => void;
  onSetTarget: (target: LaunchTarget) => void;
  onSelectSpacecraft: (craft: SpacecraftOption) => void;
  onSetCameraMode: (mode: 'pad' | 'tower' | 'ascent' | 'orbital' | 'spacecraft' | 'free') => void;
  onReturnToStandby: () => void;
  onExploreDestination?: () => void;
}

export const LaunchPreparationModule: React.FC<LaunchPreparationModuleProps> = ({
  missionPhase,
  target,
  selectedSpacecraft,
  altitudeKm,
  velocityKmh,
  launchProgress,
  autoLaunchActive,
  onSetLaunchProgress,
  onToggleAutoLaunch,
  onResetFlight,
  onResetAndLaunch,
  onSetTarget,
  onSelectSpacecraft,
  onSetCameraMode,
  onReturnToStandby,
  onExploreDestination,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState<'flight' | 'checklist' | 'fleet'>('flight');
  const [checklist, setChecklist] = useState<LaunchChecklistState>({
    propellantPressurization: true,
    guidanceNavigationAvionics: true,
    thermalProtectionSystems: true,
    telemetryGroundStationComm: true,
    rangeClearanceWeather: true,
  });

  const [activeCameraView, setActiveCameraView] = useState<'pad' | 'tower' | 'ascent' | 'orbital' | 'spacecraft' | 'free'>('pad');
  const [showTargetWarning, setShowTargetWarning] = useState(false);

  const allChecksPassed = Object.values(checklist).every(Boolean);

  const toggleCheck = (key: keyof LaunchChecklistState) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const verifyAll = () => {
    setChecklist({
      propellantPressurization: true,
      guidanceNavigationAvionics: true,
      thermalProtectionSystems: true,
      telemetryGroundStationComm: true,
      rangeClearanceWeather: true,
    });
  };

  const getTargetTitle = () => {
    switch (target) {
      case 'lunar_transit':
        return 'Moon Transit & Landing';
      case 'mars_transfer':
        return 'Mars Transfer & Landing';
      default:
        return 'Select Target (Moon or Mars)';
    }
  };

  const isCompleted = launchProgress >= 0.98;

  // Auto-switch to flight tab if auto-launch begins
  useEffect(() => {
    if (autoLaunchActive && activeTab !== 'flight') {
      setActiveTab('flight');
    }
  }, [autoLaunchActive]);

  // Minimized Compact Dock Pill
  if (isMinimized) {
    return (
      <div className="absolute top-3 right-3 z-20 pointer-events-auto">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg glass-panel text-xs font-tech font-semibold text-sky-300 border border-sky-400/50 hover:bg-sky-950/60 transition-all cursor-pointer shadow-xl backdrop-blur-md active:scale-95"
          title="Expand Space Launch Control Module"
        >
          <Rocket className="w-4 h-4 text-sky-400" />
          <span>Launch Controls</span>
          <span className="text-[10px] font-mono-tech px-1.5 py-0.5 rounded bg-sky-900/60 text-sky-200">
            {Math.round(launchProgress * 100)}%
          </span>
          <Maximize2 className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-2 bottom-2 right-2 sm:top-3 sm:bottom-3 sm:right-3 w-84 sm:w-[26rem] max-w-[calc(100vw-1rem)] flex flex-col z-20 pointer-events-auto h-[calc(100%-1rem)] sm:h-[calc(100%-1.5rem)]">
      <div className="flex-1 min-h-0 flex flex-col glass-panel rounded-xl shadow-2xl border border-sky-500/25 overflow-hidden">
        {/* 1. FIXED HEADER */}
        <div className="shrink-0 flex items-center justify-between px-3.5 sm:px-4 py-2.5 sm:py-3 border-b border-sky-500/20 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Rocket className="w-3.5 h-3.5" />
            </div>
            <div>
              <h2 className="font-tech text-xs sm:text-sm font-bold text-slate-100 tracking-wider">
                SPACE LAUNCH OPERATIONS
              </h2>
              <span className="text-[10px] font-mono-tech text-slate-400 block -mt-0.5">
                PAD 39B &bull; ASCENT &amp; TRANSIT
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(true)}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              title="Minimize panel"
            >
              <Minimize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onReturnToStandby}
              className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              title="Reset and return to Mission Control"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 2. FIXED COMMAND & SCRUBBER DECK (Always visible, never scrolled away) */}
        <div className="shrink-0 p-3 sm:p-3.5 border-b border-sky-500/20 bg-[#080d1a]/95 space-y-2.5">
          {/* Target Destination Selector */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono-tech uppercase text-slate-400 tracking-wider">
                Target Destination
              </span>
              <span className="text-[10px] font-mono-tech text-sky-400 font-semibold truncate max-w-[150px]">
                {getTargetTitle()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 font-tech text-xs">
              <button
                onClick={() => {
                  setShowTargetWarning(false);
                  onSetTarget('lunar_transit');
                }}
                className={`py-1.5 px-1 rounded text-center transition-all cursor-pointer border ${
                  target === 'lunar_transit'
                    ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-semibold shadow-xs ring-1 ring-sky-400'
                    : showTargetWarning
                    ? 'bg-rose-950/40 border-rose-500/70 text-slate-300 hover:text-white animate-pulse'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Moon Landing
              </button>
              <button
                onClick={() => {
                  setShowTargetWarning(false);
                  onSetTarget('mars_transfer');
                }}
                className={`py-1.5 px-1 rounded text-center transition-all cursor-pointer border ${
                  target === 'mars_transfer'
                    ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-semibold shadow-xs ring-1 ring-amber-400'
                    : showTargetWarning
                    ? 'bg-rose-950/40 border-rose-500/70 text-slate-300 hover:text-white animate-pulse'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Mars Landing
              </button>
            </div>

            {/* Target Warning Notice if Launch clicked without destination */}
            {showTargetWarning && (
              <div className="mt-2 p-2 rounded-lg bg-rose-950/90 border border-rose-500/80 text-rose-200 text-[11px] font-mono-tech flex items-center gap-2 animate-bounce">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Please select Moon Landing or Mars Landing first before launching!</span>
              </div>
            )}
          </div>

          {/* Timeline Scrubber */}
          <div className="pt-0.5">
            <div className="flex items-center justify-between text-[11px] font-mono-tech">
              <span className="text-slate-400 uppercase tracking-wider text-[10px]">
                Flight Progression Scrubber
              </span>
              <span className="text-sky-300 font-bold tabular-nums">
                {Math.round(launchProgress * 100)}% Complete
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={launchProgress}
              onChange={(e) => {
                if (!target && parseFloat(e.target.value) > 0.05) {
                  setShowTargetWarning(true);
                  return;
                }
                setShowTargetWarning(false);
                onSetLaunchProgress(parseFloat(e.target.value));
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-ew-resize accent-sky-400 my-1.5"
            />

            <div className="flex justify-between text-[9px] font-mono-tech text-slate-500">
              <span>Pad 0%</span>
              <span>Liftoff 20%</span>
              <span>Max-Q 60%</span>
              <span>Orbit 80%</span>
              <span>Arrived 100%</span>
            </div>
          </div>

          {/* Primary Action Launch / Replay Bar */}
          <div className="pt-1 flex items-center gap-2">
            {isCompleted ? (
              <button
                onClick={() => {
                  if (!target) {
                    setShowTargetWarning(true);
                    return;
                  }
                  setShowTargetWarning(false);
                  onResetAndLaunch();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-xs font-tech font-bold uppercase tracking-wider bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-all cursor-pointer shadow-md active:scale-95"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Launch Again / Replay</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  if (!target) {
                    setShowTargetWarning(true);
                    return;
                  }
                  setShowTargetWarning(false);
                  onToggleAutoLaunch();
                  if (!autoLaunchActive) aerospaceAudio.playRealRocketLaunchSound();
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-95 ${
                  autoLaunchActive
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 animate-pulse'
                    : 'bg-sky-400 text-slate-950 hover:bg-sky-300'
                }`}
              >
                {autoLaunchActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                <span>{autoLaunchActive ? 'Pause Ascent' : 'Launch'}</span>
              </button>
            )}

            <button
              onClick={onResetFlight}
              className="py-2.5 px-3 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer text-xs font-tech flex items-center gap-1 shrink-0"
              title="Reset flight to Launch Pad 39B (0%)"
            >
              <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* 3. SEGMENTED NAVIGATION TABS (Eliminates getting lost while scrolling!) */}
        <div className="shrink-0 flex items-center border-b border-sky-500/20 bg-slate-950/80 px-2 pt-1.5 pb-1 gap-1">
          <button
            onClick={() => setActiveTab('flight')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-tech font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'flight'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Flight Deck</span>
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-tech font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'checklist'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>Checklist</span>
            {allChecksPassed && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          </button>

          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-tech font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'fleet'
                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Space Fleet</span>
          </button>
        </div>

        {/* 4. SCROLLABLE CONTENT DECK (Cleanly bounded inside panel, never overflows) */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3.5 space-y-3.5 custom-scrollbar pr-2">
          {/* Destination Status Banner (When Arrived) */}
          {isCompleted && (
            <div className="p-3.5 rounded-lg bg-emerald-950/70 border border-emerald-500/50 text-center space-y-2 animate-in fade-in duration-300">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-emerald-900/60 text-emerald-300 text-[11px] font-tech font-bold uppercase tracking-wide">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {target === 'lunar_transit'
                    ? 'LUNAR ARRIVAL ACHIEVED — PARKED'
                    : 'MARS ARRIVAL ACHIEVED — PARKED'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Spacecraft has settled at destination vector. Telemetry is nominal and surface sequence is ready.
              </p>
              <div className="pt-1 flex flex-col gap-2">
                {onExploreDestination && (
                  <button
                    onClick={onExploreDestination}
                    className="w-full py-2.5 px-3 text-xs font-tech font-bold uppercase tracking-wider text-slate-950 bg-sky-400 hover:bg-sky-300 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
                  >
                    <span>
                      {target === 'lunar_transit'
                        ? 'Initiate Moon Landing & Drive Rover'
                        : target === 'mars_transfer'
                        ? 'Initiate Mars Landing & Drive Rover'
                        : 'Explore Orbital Observation'}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-950" />
                  </button>
                )}
                <button
                  onClick={onResetAndLaunch}
                  className="w-full py-2 px-3 text-xs font-tech font-bold uppercase tracking-wider text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Replay Launch from Pad 39B</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: FLIGHT DECK (Telemetry & Camera Angles) */}
          {activeTab === 'flight' && (
            <div className="space-y-3.5 animate-in fade-in duration-200">
              {/* Telemetry Stream */}
              <div className="p-3 rounded-lg bg-slate-900/70 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono-tech text-slate-400 uppercase tracking-wider">
                    [SIMULATED] Telemetry Stream
                  </span>
                  <span className="text-[10px] font-mono-tech text-emerald-400 font-semibold uppercase">
                    {missionPhase}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono-tech">
                  <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800/80">
                    <span className="text-[9px] text-slate-400 block uppercase">Simulated Altitude</span>
                    <span className="text-base font-bold text-slate-100 tabular-nums">
                      {altitudeKm.toLocaleString()} km
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800/80">
                    <span className="text-[9px] text-slate-400 block uppercase">Simulated Velocity</span>
                    <span className="text-base font-bold text-sky-400 tabular-nums">
                      {velocityKmh.toLocaleString()} km/h
                    </span>
                  </div>
                </div>
              </div>

              {/* Camera Angles Selection */}
              <div>
                <label className="block text-[10px] font-mono-tech uppercase text-slate-400 mb-1.5 tracking-wider">
                  Observation Camera Viewpoint (6 Angles)
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono-tech">
                  {(['pad', 'tower', 'ascent', 'orbital', 'spacecraft', 'free'] as const).map((cam) => (
                    <button
                      key={cam}
                      onClick={() => {
                        setActiveCameraView(cam);
                        onSetCameraMode(cam);
                      }}
                      className={`py-1.5 px-1 rounded text-center uppercase transition-all cursor-pointer border ${
                        activeCameraView === cam
                          ? 'bg-sky-500/25 border-sky-400 text-sky-300 font-semibold shadow-xs'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cam}
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Vehicle Quick View */}
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-mono-tech text-slate-400 block uppercase">Selected Vehicle</span>
                  <span className="font-tech text-xs font-bold text-white flex items-center gap-1.5">
                    <Rocket className="w-3 h-3 text-sky-400" />
                    {selectedSpacecraft.name}
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab('fleet')}
                  className="text-[10px] font-mono-tech text-sky-400 hover:underline cursor-pointer"
                >
                  Change Vehicle &rarr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: PRE-LAUNCH CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[10px] font-mono-tech uppercase text-slate-400 tracking-wider">
                    Pre-Launch Checklist ({Object.values(checklist).filter(Boolean).length}/5)
                  </span>
                  <button
                    onClick={verifyAll}
                    className="text-[10px] font-mono-tech text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Verify All</span>
                  </button>
                </div>

                <div className="space-y-1.5 text-[11px] font-mono-tech">
                  <button
                    onClick={() => toggleCheck('propellantPressurization')}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-800/60 text-left cursor-pointer border border-transparent hover:border-slate-700/50"
                  >
                    <span className="text-slate-300">LOX/LH2 Propellant Pressurization</span>
                    {checklist.propellantPressurization ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => toggleCheck('guidanceNavigationAvionics')}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-800/60 text-left cursor-pointer border border-transparent hover:border-slate-700/50"
                  >
                    <span className="text-slate-300">Avionics &amp; Trajectory Guidance</span>
                    {checklist.guidanceNavigationAvionics ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => toggleCheck('thermalProtectionSystems')}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-800/60 text-left cursor-pointer border border-transparent hover:border-slate-700/50"
                  >
                    <span className="text-slate-300">Thermal Protection &amp; Cryo Shields</span>
                    {checklist.thermalProtectionSystems ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => toggleCheck('telemetryGroundStationComm')}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-800/60 text-left cursor-pointer border border-transparent hover:border-slate-700/50"
                  >
                    <span className="text-slate-300">Deep Space Network Telemetry</span>
                    {checklist.telemetryGroundStationComm ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </button>

                  <button
                    onClick={() => toggleCheck('rangeClearanceWeather')}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-800/60 text-left cursor-pointer border border-transparent hover:border-slate-700/50"
                  >
                    <span className="text-slate-300">Range &amp; Atmospheric Clearance</span>
                    {checklist.rangeClearanceWeather ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    )}
                  </button>
                </div>

                {/* Direct Launch Button inside Checklist */}
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                  <button
                    onClick={() => {
                      verifyAll();
                      if (isCompleted) {
                        onResetAndLaunch();
                      } else {
                        onToggleAutoLaunch();
                      }
                      aerospaceAudio.playRealRocketLaunchSound();
                      setActiveTab('flight');
                    }}
                    className="w-full py-2.5 px-3 rounded text-xs font-tech font-bold uppercase tracking-wider bg-sky-400 hover:bg-sky-300 text-slate-950 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md active:scale-95"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>{isCompleted ? 'START NEW LAUNCH REPLAY' : autoLaunchActive ? 'PAUSE ASCENT' : 'INITIATE LAUNCH SEQUENCE'}</span>
                  </button>

                  <div className="flex items-center justify-between text-[10px] font-mono-tech text-slate-400">
                    <span>Flight Status:</span>
                    <span className={allChecksPassed ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                      {allChecksPassed ? 'ALL CRITERIA NOMINAL (GO)' : 'CHECKS PENDING'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPACECRAFT FLEET SELECTION ("SPACE FLEET LIST") */}
          {activeTab === 'fleet' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[10px] font-mono-tech uppercase text-slate-400 tracking-wider">
                  Available Fleet Vehicles ({SPACECRAFT_FLEET.length})
                </span>
                <span className="text-[10px] font-mono-tech text-sky-400 font-semibold">
                  SELECT VEHICLE
                </span>
              </div>

              {SPACECRAFT_FLEET.map((craft) => {
                const isSelected = selectedSpacecraft.id === craft.id;
                return (
                  <button
                    key={craft.id}
                    onClick={() => onSelectSpacecraft(craft)}
                    className={`w-full text-left p-2.5 rounded-lg transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-sky-500/15 border-sky-400 text-white shadow-xs'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-tech text-xs font-bold text-slate-100 flex items-center gap-1.5">
                        <Rocket className={`w-3.5 h-3.5 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                        {craft.name}
                      </span>
                      <span className="text-[9px] font-mono-tech px-1.5 py-0.5 rounded bg-slate-800/80 text-sky-300">
                        {craft.stages} Stages
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-400 font-sans leading-snug line-clamp-2">
                      {craft.description}
                    </p>

                    <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono-tech text-slate-400">
                      <span>Payload: {craft.payloadCapacityKg.toLocaleString()} kg</span>
                      <span className={isSelected ? 'text-sky-400 font-semibold' : 'text-slate-500'}>
                        {isSelected ? 'SELECTED' : 'SELECT'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="text-[10px] font-mono-tech text-slate-500 text-center pb-2">
            Simulated Aerodynamic Ascent &bull; Phase 2 Continuous Flight
          </div>
        </div>
      </div>
    </div>
  );
};
