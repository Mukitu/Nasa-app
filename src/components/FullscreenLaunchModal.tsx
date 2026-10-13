import React, { useState } from 'react';
import { LaunchTarget, SpacecraftOption } from '../types/simulation';
import { SPACECRAFT_FLEET } from '../data/planets';
import { Rocket, Check, ArrowRight, X, ZoomOut, Sparkles, AlertTriangle } from 'lucide-react';

interface FullscreenLaunchModalProps {
  currentTarget: LaunchTarget;
  selectedSpacecraft: SpacecraftOption;
  onSelectTarget: (target: LaunchTarget) => void;
  onSelectSpacecraft: (craft: SpacecraftOption) => void;
  onStartLaunch: () => void;
  onZoomOutView?: () => void;
  onClose: () => void;
}

export const FullscreenLaunchModal: React.FC<FullscreenLaunchModalProps> = ({
  currentTarget,
  selectedSpacecraft,
  onSelectTarget,
  onSelectSpacecraft,
  onStartLaunch,
  onZoomOutView,
  onClose,
}) => {
  const [selectedTarget, setSelectedTarget] = useState<LaunchTarget>(currentTarget);
  const [showWarning, setShowWarning] = useState(false);

  const handleChooseTarget = (target: LaunchTarget) => {
    setSelectedTarget(target);
    setShowWarning(false);
    onSelectTarget(target);
  };

  const handleLaunch = () => {
    if (!selectedTarget) {
      setShowWarning(true);
      return;
    }
    onStartLaunch();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl border border-sky-400/50 shadow-2xl overflow-hidden bg-[#060a14] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-sky-500/20 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-400">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono-tech uppercase text-sky-400 font-bold tracking-widest block">
                MISSION LAUNCH CENTER
              </span>
              <h2 className="font-tech text-base sm:text-xl font-bold text-white tracking-wide">
                LAUNCH MISSION
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6">
          {/* Warning Banner if launch clicked without target */}
          {showWarning && (
            <div className="p-3.5 rounded-xl bg-rose-950/90 border border-rose-500/60 flex items-center gap-3 text-xs font-mono-tech text-rose-200 animate-bounce">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>
                Please select a target destination (Moon Landing or Mars Landing) first before launching!
              </span>
            </div>
          )}

          {/* Step 1: Select Target Destination */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-tech uppercase text-slate-300 font-bold tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                1. Select Target Destination:
              </span>
              <button
                onClick={onZoomOutView}
                className="text-[11px] font-mono-tech text-sky-400 hover:text-sky-300 flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded border border-sky-400/30 transition-all cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
                <span>Zoom Out 3D View</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-tech text-xs">
              {/* Moon */}
              <button
                onClick={() => handleChooseTarget('lunar_transit')}
                className={`p-4 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between space-y-2 ${
                  selectedTarget === 'lunar_transit'
                    ? 'bg-sky-500/25 border-sky-400 text-white shadow-lg ring-2 ring-sky-400/60'
                    : showWarning
                    ? 'bg-rose-950/40 border-rose-500/80 text-slate-300 hover:text-white animate-pulse'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-sky-300">MOON TRANSIT &amp; LANDING</span>
                  {selectedTarget === 'lunar_transit' && <Check className="w-4 h-4 text-sky-400" />}
                </div>
                <span className="text-[11px] font-mono-tech text-slate-300 block">
                  Lunar Surface Exploration
                </span>
                <p className="text-[10px] text-slate-400 font-sans leading-tight">
                  Explore Apollo 11, 12, 14, 15, 17, and historic lunar lander hardware on the Moon.
                </p>
              </button>

              {/* Mars */}
              <button
                onClick={() => handleChooseTarget('mars_transfer')}
                className={`p-4 rounded-xl text-left transition-all cursor-pointer border flex flex-col justify-between space-y-2 ${
                  selectedTarget === 'mars_transfer'
                    ? 'bg-amber-500/25 border-amber-400 text-white shadow-lg ring-2 ring-amber-400/60'
                    : showWarning
                    ? 'bg-rose-950/40 border-rose-500/80 text-slate-300 hover:text-white animate-pulse'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-amber-300">MARS TRANSFER &amp; LANDING</span>
                  {selectedTarget === 'mars_transfer' && <Check className="w-4 h-4 text-amber-400" />}
                </div>
                <span className="text-[11px] font-mono-tech text-slate-300 block">
                  Martian Surface Exploration
                </span>
                <p className="text-[10px] text-slate-400 font-sans leading-tight">
                  Explore Perseverance, Curiosity, Opportunity, and Viking lander hardware on Mars.
                </p>
              </button>
            </div>
          </div>

          {/* Step 2: Select Spacecraft */}
          <div className="space-y-3">
            <span className="text-xs font-mono-tech uppercase text-slate-300 font-bold tracking-wider block">
              2. Select Launch Spacecraft:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-tech text-xs">
              {SPACECRAFT_FLEET.map((craft) => (
                <button
                  key={craft.id}
                  onClick={() => onSelectSpacecraft(craft)}
                  className={`p-3 rounded-lg text-left transition-all cursor-pointer border ${
                    selectedSpacecraft.id === craft.id
                      ? 'bg-sky-500/20 border-sky-400 text-sky-200 font-semibold'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold text-slate-100">{craft.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{craft.agencyRole}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Trigger Button */}
        <div className="shrink-0 p-5 border-t border-sky-500/20 bg-slate-900/95 flex items-center justify-between gap-4">
          <div className="text-xs font-mono-tech text-slate-400">
            <span className="text-sky-400 font-semibold block">
              {selectedTarget ? 'Destination Selected' : 'No Destination Selected'}
            </span>
            <span>
              {selectedTarget
                ? 'Click Start Mission below to launch spacecraft'
                : 'Select Moon or Mars above before launching'}
            </span>
          </div>

          <button
            onClick={handleLaunch}
            className={`px-8 py-3.5 rounded-xl font-tech font-bold text-sm tracking-wider uppercase flex items-center gap-2 shadow-xl transition-all cursor-pointer active:scale-95 shrink-0 ${
              selectedTarget
                ? 'bg-sky-400 hover:bg-sky-300 text-slate-950 hover:shadow-sky-400/25'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
            }`}
          >
            <Rocket className="w-5 h-5 text-current" />
            <span>START MISSION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
