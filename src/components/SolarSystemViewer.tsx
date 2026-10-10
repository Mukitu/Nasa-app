import React, { useState } from 'react';
import { PlanetId } from '../types/simulation';
import { CELESTIAL_BODIES } from '../data/planets';
import { Eye, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Orbit } from 'lucide-react';

interface SolarSystemViewerProps {
  selectedPlanetId: PlanetId;
  onSelectPlanet: (id: PlanetId) => void;
  onFocusCamera: (id: PlanetId) => void;
}

export const SolarSystemViewer: React.FC<SolarSystemViewerProps> = ({
  selectedPlanetId,
  onSelectPlanet,
  onFocusCamera,
}) => {
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const currentBody = CELESTIAL_BODIES[selectedPlanetId] || CELESTIAL_BODIES.earth;

  const planetsList: { id: PlanetId; label: string; color: string }[] = [
    { id: 'sun', label: 'Sun', color: '#f59e0b' },
    { id: 'mercury', label: 'Mercury', color: '#9ca3af' },
    { id: 'venus', label: 'Venus', color: '#eab308' },
    { id: 'earth', label: 'Earth', color: '#3b82f6' },
    { id: 'moon', label: 'Moon', color: '#d1d5db' },
    { id: 'mars', label: 'Mars', color: '#ef4444' },
    { id: 'jupiter', label: 'Jupiter', color: '#f97316' },
    { id: 'saturn', label: 'Saturn', color: '#eab308' },
    { id: 'uranus', label: 'Uranus', color: '#38bdf8' },
    { id: 'neptune', label: 'Neptune', color: '#2563eb' },
  ];

  const currentIndex = planetsList.findIndex((p) => p.id === selectedPlanetId);

  const handlePrevPlanet = () => {
    const prevIdx = (currentIndex - 1 + planetsList.length) % planetsList.length;
    const target = planetsList[prevIdx].id;
    onSelectPlanet(target);
    onFocusCamera(target);
  };

  const handleNextPlanet = () => {
    const nextIdx = (currentIndex + 1) % planetsList.length;
    const target = planetsList[nextIdx].id;
    onSelectPlanet(target);
    onFocusCamera(target);
  };

  return (
    <div
      onWheel={(e) => e.stopPropagation()}
      className="absolute bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-10 flex flex-col items-center pointer-events-none"
    >
      {/* 1. Detail Card for selected planet (Collapsible so it never blocks the scene) */}
      <div className="pointer-events-auto w-full max-w-4xl glass-panel rounded-xl shadow-2xl p-3 sm:p-4 mb-2.5 border border-sky-500/25 transition-all">
        <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div
              className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
              style={{ backgroundColor: currentBody.colorHex }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-tech text-base sm:text-lg font-bold text-slate-100 tracking-wide">
                  {currentBody.name}
                </h2>
                <span className="text-[10px] font-mono-tech text-sky-400 px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/30">
                  {currentBody.type}
                </span>
              </div>
              {!detailsCollapsed && (
                <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 line-clamp-2 max-w-2xl">
                  {currentBody.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => onFocusCamera(selectedPlanetId)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-tech font-semibold uppercase text-slate-900 bg-sky-400 hover:bg-sky-300 rounded transition-colors cursor-pointer shadow-xs active:scale-95"
              title="Focus 3D camera onto celestial body"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Center Camera</span>
            </button>

            <button
              onClick={() => setDetailsCollapsed(!detailsCollapsed)}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors cursor-pointer"
              title={detailsCollapsed ? 'Expand body telemetry specs' : 'Collapse body telemetry specs'}
            >
              {detailsCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Physical Metrics Grid (Hidden when collapsed) */}
        {!detailsCollapsed && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 text-xs font-mono-tech">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="block text-[9px] text-slate-400 uppercase">Diameter</span>
                <span className="text-slate-100 font-semibold tabular-nums text-xs sm:text-sm">
                  {currentBody.diameterKm.toLocaleString()} km
                </span>
              </div>

              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="block text-[9px] text-slate-400 uppercase">Distance From Sun</span>
                <span className="text-slate-100 font-semibold tabular-nums text-xs sm:text-sm">
                  {currentBody.distanceFromSunAU > 0 ? `${currentBody.distanceFromSunAU} AU` : '0 AU (Center)'}
                </span>
              </div>

              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="block text-[9px] text-slate-400 uppercase">Orbital Period</span>
                <span className="text-slate-100 font-semibold tabular-nums text-xs sm:text-sm">
                  {currentBody.orbitPeriodDays > 0 ? `${currentBody.orbitPeriodDays} days` : 'N/A'}
                </span>
              </div>

              <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="block text-[9px] text-slate-400 uppercase">Surface Temperature</span>
                <span className="text-slate-100 font-semibold truncate block text-xs sm:text-sm">
                  {currentBody.surfaceTempCelsius}
                </span>
              </div>
            </div>

            {/* Historical Note */}
            <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] sm:text-[11px] font-mono-tech text-slate-400 gap-1.5">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-sky-400 font-semibold shrink-0">HISTORICAL NOTE:</span>
                <span className="text-slate-300 truncate">{currentBody.historicalSignificance}</span>
              </div>

              <span className="text-slate-500 text-[10px] shrink-0">
                *Orbital distances scaled for interactive 3D inspection
              </span>
            </div>
          </>
        )}
      </div>

      {/* 2. Planetary Selection Horizontal Bar ("Space List" / স্পেস লিস্ট - Always firmly anchored) */}
      <div className="pointer-events-auto w-full max-w-4xl glass-panel rounded-xl p-1.5 flex items-center gap-1 border border-sky-500/25 shadow-2xl">
        {/* Previous Planet Button */}
        <button
          onClick={handlePrevPlanet}
          className="p-2 text-slate-400 hover:text-sky-300 hover:bg-slate-800/60 rounded transition-colors cursor-pointer shrink-0"
          title="Previous celestial body"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Celestial Bodies List */}
        <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center gap-1 py-0.5">
          {planetsList.map((planet) => {
            const isSelected = selectedPlanetId === planet.id;
            return (
              <button
                key={planet.id}
                onClick={() => {
                  onSelectPlanet(planet.id);
                  onFocusCamera(planet.id);
                }}
                className={`flex-1 min-w-[70px] sm:min-w-[82px] flex flex-col items-center py-1.5 px-1.5 rounded-lg transition-all cursor-pointer border ${
                  isSelected
                    ? 'bg-sky-500/25 border-sky-400 text-white font-semibold shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
                }`}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full mb-1 transition-transform"
                  style={{
                    backgroundColor: planet.color,
                    boxShadow: isSelected ? `0 0 8px ${planet.color}` : 'none',
                  }}
                />
                <span className="font-tech text-[10px] sm:text-[11px] uppercase tracking-wider">
                  {planet.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Next Planet Button */}
        <button
          onClick={handleNextPlanet}
          className="p-2 text-slate-400 hover:text-sky-300 hover:bg-slate-800/60 rounded transition-colors cursor-pointer shrink-0"
          title="Next celestial body"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
