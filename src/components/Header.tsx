import React from 'react';
import { ViewMode } from '../types/simulation';
import { Rocket, Compass, Info, Database, Volume2, VolumeX, Search, Bookmark } from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenHelp: () => void;
  discoveriesCount: number;
  onOpenSpacecraftInspector?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  onOpenHelp,
  discoveriesCount,
  onOpenSpacecraftInspector,
}) => {
  return (
    <header className="relative z-20 flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-2.5 sm:py-3 border-b border-sky-500/15 bg-[#050811]/90 backdrop-blur-md">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenSpacecraftInspector || (() => onSelectView('mission-control'))}
          className="flex items-center gap-2.5 text-left group transition-opacity hover:opacity-90 cursor-pointer"
          title="Click to Inspect 3D Spacecraft in 360°"
        >
          <div className="w-8 h-8 rounded-sm bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:border-sky-400 transition-colors">
            <Compass className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <span className="font-tech text-sm sm:text-base md:text-lg font-bold tracking-widest text-slate-100 whitespace-nowrap block group-hover:text-sky-300 transition-colors">
              ECHOES OF SPACE
            </span>
            <span className="text-[9px] font-mono-tech text-sky-400 tracking-wider block -mt-1 hidden sm:block">
              INSPECT 3D SPACECRAFT (360°)
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Primary Single-Line Navigation Links */}
      <nav className="flex items-center gap-4 sm:gap-6 text-xs font-tech tracking-wider uppercase">
        <button
          onClick={() => onSelectView('launch-simulator')}
          className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 flex items-center gap-1.5 ${
            currentView === 'launch-simulator'
              ? 'text-sky-400 border-sky-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Rocket className="w-3.5 h-3.5 text-sky-400" />
          <span>Space Launch</span>
        </button>

        <button
          onClick={() => onSelectView('solar-system')}
          className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 flex items-center gap-1.5 ${
            currentView === 'solar-system'
              ? 'text-sky-400 border-sky-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <span>Solar System</span>
        </button>

        <button
          onClick={() => onSelectView('archive')}
          className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 flex items-center gap-1.5 ${
            currentView === 'archive'
              ? 'text-sky-400 border-sky-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>NASA Archive Search</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onOpenSpacecraftInspector && (
          <button
            onClick={onOpenSpacecraftInspector}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-tech font-semibold tracking-wider uppercase text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 border border-sky-400/40 rounded shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
            title="Inspect 3D Spacecraft in 360°"
          >
            <Compass className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden md:inline">3D Spacecraft</span>
          </button>
        )}
        <button
          onClick={() => onSelectView('launch-simulator')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-tech font-bold tracking-wider uppercase text-slate-950 bg-sky-400 hover:bg-sky-300 rounded shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>Launch Mission</span>
        </button>
      </div>
    </header>
  );
};
