import React from 'react';
import { ViewMode } from '../types/simulation';
import { Rocket, Compass, Info, Database, Volume2, VolumeX, Search, Bookmark } from 'lucide-react';

interface HeaderProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  onOpenHelp: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  discoveriesCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  onOpenHelp,
  soundEnabled,
  onToggleSound,
  discoveriesCount,
}) => {
  return (
    <header className="relative z-20 flex items-center justify-between gap-4 sm:gap-8 px-4 sm:px-6 py-2.5 sm:py-3 border-b border-sky-500/15 bg-[#050811]/90 backdrop-blur-md">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => onSelectView('mission-control')}
          className="flex items-center gap-2.5 text-left group transition-opacity hover:opacity-90 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-sm bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400 group-hover:border-sky-400 transition-colors">
            <Compass className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <span className="font-tech text-sm sm:text-base md:text-lg font-bold tracking-widest text-slate-100 whitespace-nowrap block">
              ECHOES OF SPACE
            </span>
            <span className="text-[9px] font-mono-tech text-sky-400 tracking-wider block -mt-1 hidden sm:block">
              NASA SPACE APPS CHALLENGE
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Primary Single-Line Navigation Links */}
      <nav className="hidden xl:flex items-center gap-5 text-xs font-tech tracking-wider uppercase">
        <button
          onClick={() => onSelectView('mission-control')}
          className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
            currentView === 'mission-control'
              ? 'text-sky-400 border-sky-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Mission Control
        </button>

        <button
          onClick={() => onSelectView('launch-simulator')}
          className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
            currentView === 'launch-simulator'
              ? 'text-sky-400 border-sky-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Space Launch
        </button>

        <button
          onClick={() => onSelectView('moon')}
          className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 ${
            currentView === 'moon' || currentView === 'mars'
              ? 'text-sky-400 border-sky-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Rover Drive
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
          <span>NASA Archive</span>
        </button>

        <button
          onClick={() => onSelectView('discoveries')}
          className={`whitespace-nowrap shrink-0 transition-colors cursor-pointer py-1 border-b-2 flex items-center gap-1.5 ${
            currentView === 'discoveries'
              ? 'text-sky-400 border-sky-400 font-semibold'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>My Discoveries ({discoveriesCount})</span>
        </button>
      </nav>

      {/* Zone 3: Primary Action & Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Sound Toggle (Muted by default) */}
        <button
          onClick={onToggleSound}
          className={`p-1.5 rounded-lg border text-xs font-tech transition-colors cursor-pointer flex items-center gap-1.5 ${
            soundEnabled
              ? 'bg-sky-500/20 border-sky-400 text-sky-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title={soundEnabled ? 'Telemetry Audio Active (Click to Mute)' : 'Audio Muted (Click to Unmute)'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-sky-400" /> : <VolumeX className="w-4 h-4" />}
          <span className="hidden md:inline text-[11px] font-mono-tech">
            {soundEnabled ? 'AUDIO ON' : 'MUTED'}
          </span>
        </button>

        <button
          onClick={onOpenHelp}
          title="Mission Operations Briefing Guide"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-tech text-slate-300 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded transition-colors cursor-pointer whitespace-nowrap"
        >
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>Briefing</span>
        </button>

        <button
          onClick={() => onSelectView(currentView === 'launch-simulator' ? 'mission-control' : 'launch-simulator')}
          className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 text-xs font-tech font-semibold tracking-wider uppercase text-slate-950 bg-sky-400 hover:bg-sky-300 rounded shadow-sm transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>{currentView === 'launch-simulator' ? 'Standby Mode' : 'Space Launch'}</span>
        </button>
      </div>
    </header>
  );
};
