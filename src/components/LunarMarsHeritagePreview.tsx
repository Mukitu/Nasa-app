import React from 'react';
import { ViewMode } from '../types/simulation';
import { Moon, Flame, Search, Database, ArrowRight, Info } from 'lucide-react';

interface LunarMarsHeritagePreviewProps {
  currentView: ViewMode;
  onFocusPlanet: (planetId: 'moon' | 'mars') => void;
  onOpenNasaArchive: () => void;
  onClose: () => void;
}

export const LunarMarsHeritagePreview: React.FC<LunarMarsHeritagePreviewProps> = ({
  currentView,
  onFocusPlanet,
  onOpenNasaArchive,
  onClose,
}) => {
  const isMoon = currentView === 'moon';
  const isMars = currentView === 'mars';

  let title = 'Historical Equipment Discovery Architecture';
  let subtitle = 'NASA Space Apps Challenge: Abandoned but not Forgotten';

  if (isMoon) {
    title = 'Lunar Heritage Sites & Abandoned Equipment';
    subtitle = 'Surveying the silent monuments left by humanity on the lunar regolith';
  } else if (isMars) {
    title = 'Martian Surface Relics & Robotic Graveyards';
    subtitle = 'Documenting rovers, landers, and descent stages preserving human ingenuity across the Red Planet';
  }

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-2xl glass-panel rounded-xl shadow-2xl p-6 border border-sky-500/25 max-h-[90vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-sky-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              {isMoon ? <Moon className="w-5 h-5" /> : isMars ? <Flame className="w-5 h-5 text-amber-500" /> : <Search className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-tech text-lg font-bold text-slate-100 tracking-wider">
                {title}
              </h2>
              <span className="text-xs font-mono-tech text-sky-400">
                {subtitle}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-mono-tech text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close ✕
          </button>
        </div>

        {/* Narrative & Phase 1 Scope Context */}
        <div className="space-y-4 text-xs font-sans text-slate-300 leading-relaxed">
          <div className="p-3.5 rounded bg-sky-950/30 border border-sky-500/20">
            <div className="flex items-center gap-2 mb-1 text-sky-300 font-tech font-semibold">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>NASA Space Apps Challenge Research Scope</span>
            </div>
            <p>
              When Apollo astronauts and robotic probes touched down on the Moon and Mars, they left behind descent stages, lunar roving vehicles, retro-reflectors, seismometers, drills, heat shields, and defunct rovers. These machines are not merely discarded debris; they represent the archaeological milestones of human curiosity.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-tech text-sm font-bold text-slate-200 tracking-wide">
              Planned Heritage Categories for Phase 2 &amp; 3:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono-tech">
              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-sky-400 font-semibold block mb-0.5">Lunar Surface Heritage</span>
                <span className="text-slate-400 text-[11px] block">
                  Apollo 11–17 descent stages, Lunar Roving Vehicles (LRVs), Surveyor 1–7 probes, retro-reflector arrays.
                </span>
              </div>

              <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-amber-400 font-semibold block mb-0.5">Martian Exploration Relics</span>
                <span className="text-slate-400 text-[11px] block">
                  Viking 1 &amp; 2 landers, Mars Pathfinder &amp; Sojourner, Spirit, Opportunity, Phoenix, InSight lander.
                </span>
              </div>
            </div>
          </div>

          {/* Honest Status Regarding Live Data */}
          <div className="p-3.5 rounded bg-slate-900/80 border border-amber-500/30">
            <div className="flex items-center gap-2 mb-1 text-amber-400 font-tech font-semibold">
              <Database className="w-4 h-4 text-amber-400 shrink-0" />
              <span>NASA Public API Connection Status: Staged for Phase 2</span>
            </div>
            <p className="text-slate-400">
              In accordance with engineering guidelines, this application does not inject fabricated mission coordinates or mock database records. Full archival retrieval from official NASA APIs (images.nasa.gov and Mars Rover Photos API) will be connected through server-side proxies in Phase 2.
            </p>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={onOpenNasaArchive}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-tech text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
          >
            <Database className="w-3.5 h-3.5" />
            <span>Inspect NASA API Architecture</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isMoon) onFocusPlanet('moon');
                else onFocusPlanet('mars');
                onClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-tech font-bold uppercase tracking-wider text-slate-950 bg-sky-400 hover:bg-sky-300 rounded transition-colors cursor-pointer"
            >
              <span>{isMoon ? 'Fly 3D Camera to Moon' : 'Fly 3D Camera to Mars'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
