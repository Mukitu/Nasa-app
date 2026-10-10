import React from 'react';
import { ViewMode } from '../types/simulation';
import {
  LayoutDashboard,
  Orbit,
  Rocket,
  Moon,
  Flame,
  Search,
  Database,
  Bookmark,
  Sliders,
} from 'lucide-react';

interface NavigationTabsProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  discoveriesCount?: number;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  currentView,
  onSelectView,
  discoveriesCount = 0,
}) => {
  const tabs: { id: ViewMode; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'mission-control', label: 'Mission Control', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    { id: 'launch-simulator', label: 'Space Launch', icon: <Rocket className="w-3.5 h-3.5" /> },
    { id: 'solar-system', label: 'Solar System', icon: <Orbit className="w-3.5 h-3.5" /> },
    { id: 'moon', label: 'Moon Rover Drive', icon: <Moon className="w-3.5 h-3.5" /> },
    { id: 'mars', label: 'Mars Rover Drive', icon: <Flame className="w-3.5 h-3.5" /> },
    { id: 'archive', label: 'NASA Archive Search', icon: <Search className="w-3.5 h-3.5" /> },
    { id: 'discoveries', label: 'My Discoveries', icon: <Bookmark className="w-3.5 h-3.5" />, badge: discoveriesCount },
    { id: 'settings', label: 'Settings', icon: <Sliders className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="relative z-10 w-full overflow-x-auto no-scrollbar bg-[#060a14]/90 border-b border-sky-500/10 px-4 py-1.5 flex items-center gap-1.5 text-xs font-tech">
      {tabs.map((tab) => {
        const isActive =
          currentView === tab.id ||
          (tab.id === 'nasa-data' && currentView === 'nasa-archive') ||
          (tab.id === 'discoveries' && currentView === 'artifacts');

        return (
          <button
            key={tab.id}
            onClick={() => onSelectView(tab.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg whitespace-nowrap transition-all cursor-pointer ${
              isActive
                ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
            }`}
          >
            <span className={isActive ? 'text-sky-400' : 'text-slate-500'}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono-tech bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
