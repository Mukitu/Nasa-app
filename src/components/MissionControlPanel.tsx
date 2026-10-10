import React, { useState } from 'react';
import { PlanetData, MissionPhase, LaunchTarget } from '../types/simulation';
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Compass,
  Rocket,
  Moon,
  Flame,
  CheckCircle2,
} from 'lucide-react';

interface MissionControlPanelProps {
  selectedBody: PlanetData;
  missionPhase: MissionPhase;
  target: LaunchTarget;
  nasaConnected: boolean;
  onSelectTarget: (target: LaunchTarget) => void;
  onPrepareLaunch: (target?: LaunchTarget) => void;
  onExploreSolarSystem: () => void;
  onOpenHeritageSites: () => void;
}

export const MissionControlPanel: React.FC<MissionControlPanelProps> = ({
  selectedBody,
  missionPhase,
  target,
  nasaConnected,
  onSelectTarget,
  onPrepareLaunch,
  onExploreSolarSystem,
  onOpenHeritageSites,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className={`absolute bottom-4 left-4 z-10 transition-all duration-300 max-w-sm w-[calc(100vw-2rem)] sm:w-88 ${
        collapsed ? 'translate-y-[calc(100%-2.75rem)]' : 'translate-y-0'
      }`}
    >
      <div className="glass-panel rounded-lg shadow-xl overflow-hidden border border-sky-500/20">
        {/* Panel Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-sky-500/15">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-sky-400" />
            <span className="font-tech text-xs font-bold tracking-wider text-slate-200 uppercase">
              Mission Control Operations
            </span>
          </div>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            title={collapsed ? 'Expand Operations Panel' : 'Collapse Operations Panel'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4 rotate-90" /> : <ChevronLeft className="w-4 h-4 rotate-90" />}
          </button>
        </div>

        {/* Panel Body */}
        <div className="p-4 space-y-4 max-h-[68vh] overflow-y-auto custom-scrollbar">
          {/* Target Focus Card */}
          <div className="p-3 rounded bg-slate-900/60 border border-slate-700/50">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-mono-tech uppercase text-slate-400 tracking-wider">
                Current Survey Focus
              </span>
              <span className="text-[11px] font-mono-tech text-sky-400 font-semibold">
                {selectedBody.type}
              </span>
            </div>
            <h3 className="font-tech text-base font-bold text-slate-100 tracking-wide">
              {selectedBody.name}
            </h3>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              {selectedBody.description}
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] font-mono-tech">
              <div className="bg-slate-800/40 p-2 rounded border border-slate-700/30">
                <span className="text-slate-400 block text-[10px]">DIAMETER</span>
                <span className="text-slate-100 font-semibold tabular-nums">
                  {selectedBody.diameterKm.toLocaleString()} km
                </span>
              </div>
              <div className="bg-slate-800/40 p-2 rounded border border-slate-700/30">
                <span className="text-slate-400 block text-[10px]">ROTATION</span>
                <span className="text-slate-100 font-semibold tabular-nums">
                  {selectedBody.rotationPeriodHours} hrs
                </span>
              </div>
            </div>
          </div>

          {/* Select Expedition Destination */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono-tech uppercase text-slate-400 tracking-wider">
                Expedition Destination
              </span>
              <span className="text-[10px] font-mono-tech text-sky-400 font-semibold">
                {target === 'lunar_transit' ? 'LUNAR RECONNAISSANCE' : target === 'mars_transfer' ? 'MARTIAN EXPLORATION' : 'EARTH ORBIT'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-tech">
              <button
                onClick={() => onSelectTarget('lunar_transit')}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  target === 'lunar_transit'
                    ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-semibold shadow-xs'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Moon className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <span className="block font-bold text-xs">Moon Expedition</span>
                  <span className="block text-[9px] font-mono-tech text-slate-400">Apollo &amp; Surveyor</span>
                </div>
              </button>

              <button
                onClick={() => onSelectTarget('mars_transfer')}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center gap-2 ${
                  target === 'mars_transfer'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 font-semibold shadow-xs'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="block font-bold text-xs">Mars Expedition</span>
                  <span className="block text-[9px] font-mono-tech text-slate-400">Viking, Oppy, Rovers</span>
                </div>
              </button>
            </div>
          </div>

          {/* Subsystem Readiness Matrix */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono-tech uppercase text-slate-400 tracking-wider">
                Telemetry Subsystems
              </span>
              <span className="text-[11px] font-mono-tech text-emerald-400 font-semibold">
                ALL NOMINAL
              </span>
            </div>

            <div className="space-y-1.5 text-xs font-mono-tech">
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-slate-800">
                <span className="text-slate-300">Continuous Space Flight</span>
                <span className="text-emerald-400 font-semibold">AUTONOMOUS</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-slate-800">
                <span className="text-slate-300">Rover Surface Telemetry</span>
                <span className="text-emerald-400 font-semibold">SYNCED</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-slate-800">
                <span className="text-slate-300">NASA Image Library API</span>
                <span className="text-emerald-400 font-semibold">
                  {nasaConnected ? 'CONNECTED' : 'VERIFIED'}
                </span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-1 space-y-2">
            <button
              onClick={() => onPrepareLaunch()}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-tech font-bold tracking-wider uppercase text-slate-950 bg-sky-400 hover:bg-sky-300 rounded transition-colors cursor-pointer shadow-md active:scale-95"
            >
              <Rocket className="w-4 h-4" />
              <span>Launch {target === 'lunar_transit' ? 'Moon Mission' : target === 'mars_transfer' ? 'Mars Mission' : 'Spacecraft'}</span>
            </button>

            <button
              onClick={onExploreSolarSystem}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-tech font-medium tracking-wider uppercase text-slate-200 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 rounded transition-colors cursor-pointer"
            >
              <span>Inspect Solar System</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
