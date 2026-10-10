import React from 'react';
import { ViewMode, GraphicsQuality } from '../types/simulation';
import { ZoomIn, ZoomOut, RotateCcw, Play, Pause, Sparkles, HelpCircle } from 'lucide-react';

interface ViewportControlsProps {
  currentView: ViewMode;
  isPaused: boolean;
  quality: GraphicsQuality;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onTogglePause: () => void;
  onCycleQuality: () => void;
  onOpenHelp: () => void;
}

export const ViewportControls: React.FC<ViewportControlsProps> = ({
  currentView,
  isPaused,
  quality,
  onZoomIn,
  onZoomOut,
  onResetView,
  onTogglePause,
  onCycleQuality,
  onOpenHelp,
}) => {
  const getSceneBadge = () => {
    switch (currentView) {
      case 'mission-control':
        return 'PRIMARY VIEW: EARTH ORBITAL ENVIRONMENT';
      case 'solar-system':
        return 'INTERACTIVE ORRERY: HELIOCENTRIC SYSTEM';
      case 'launch-simulator':
        return 'SIMULATION: COMPLEX 39B ASCENT CORRIDOR';
      case 'moon':
        return 'TARGET SURVEY: LUNAR HERITAGE ARCHIVES';
      case 'mars':
        return 'TARGET SURVEY: MARTIAN LANDING SITES';
      case 'artifacts':
        return 'CATALOG SPEC: DISCARDED HARDWARE REGISTRY';
      case 'nasa-archive':
        return 'INTEGRATION LAYER: OFFICIAL NASA APIs';
      case 'settings':
        return 'SIMULATION PARAMETERS & PREFERENCES';
      default:
        return 'SCENE: THREE.JS 3D VIEWPORT';
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
      {/* Active Scene HUD Badge */}
      <div className="pointer-events-auto px-3 py-1 rounded bg-[#090e1c]/85 border border-sky-500/20 backdrop-blur-md shadow-sm">
        <span className="font-mono-tech text-[11px] text-sky-400 font-semibold tracking-wider">
          {getSceneBadge()}
        </span>
      </div>

      {/* Viewport Action Controls */}
      <div className="pointer-events-auto flex items-center gap-1.5 p-1 rounded bg-[#090e1c]/85 border border-sky-500/20 backdrop-blur-md shadow-sm">
        <button
          onClick={onZoomIn}
          title="Zoom In"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded transition-colors cursor-pointer"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onZoomOut}
          title="Zoom Out"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded transition-colors cursor-pointer"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onResetView}
          title="Reset Camera View"
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        <span className="w-px h-4 bg-slate-700/60 mx-0.5" aria-hidden="true" />

        <button
          onClick={onTogglePause}
          title={isPaused ? 'Resume Orbital Dynamics' : 'Pause Dynamics'}
          className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded transition-colors cursor-pointer"
        >
          {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={onCycleQuality}
          title={`Graphics Quality: ${quality.toUpperCase()} (Click to toggle)`}
          className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono-tech text-slate-300 hover:text-sky-300 hover:bg-slate-800/60 rounded transition-colors cursor-pointer"
        >
          <Sparkles className="w-3 h-3 text-sky-400" />
          <span className="uppercase">{quality}</span>
        </button>

        <button
          onClick={onOpenHelp}
          title="Controls & Shortcuts Guide"
          className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800/60 rounded transition-colors cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
