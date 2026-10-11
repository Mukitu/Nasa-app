import React, { useState } from 'react';
import { PlanetId, PlanetData } from '../types/simulation';
import { CELESTIAL_BODIES } from '../data/planets';
import { speechNarrationService } from '../services/speechNarrationService';
import { Eye, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Volume2, Sparkles, Compass } from 'lucide-react';

interface SolarSystemViewerProps {
  selectedPlanetId: PlanetId;
  onSelectPlanet: (id: PlanetId) => void;
  onFocusCamera: (id: PlanetId) => void;
  hoveredBody?: PlanetData | null;
  hoverPos?: { x: number; y: number } | null;
}

export const SolarSystemViewer: React.FC<SolarSystemViewerProps> = ({
  selectedPlanetId,
  onSelectPlanet,
  onFocusCamera,
  hoveredBody,
  hoverPos,
}) => {
  const [detailsCollapsed, setDetailsCollapsed] = useState(false);
  const currentBody = CELESTIAL_BODIES[selectedPlanetId] || CELESTIAL_BODIES.earth;

  const [activeCategory, setActiveCategory] = useState<'all' | 'planets' | 'moons' | 'satellites'>('all');

  const allBodiesList = Object.values(CELESTIAL_BODIES);

  const filteredBodies = allBodiesList.filter((b) => {
    if (activeCategory === 'planets') {
      return b.type.includes('Star') || b.type.includes('Planet');
    }
    if (activeCategory === 'moons') {
      return b.type.includes('Moon');
    }
    if (activeCategory === 'satellites') {
      return b.type.includes('Station') || b.type.includes('Telescope') || b.type.includes('Satellite') || b.type.includes('Probe');
    }
    return true;
  });

  const currentIndex = filteredBodies.findIndex((p) => p.id === selectedPlanetId);

  const handlePrevPlanet = () => {
    const list = filteredBodies.length > 0 ? filteredBodies : allBodiesList;
    const prevIdx = (currentIndex - 1 + list.length) % list.length;
    const target = list[prevIdx].id as PlanetId;
    onSelectPlanet(target);
    onFocusCamera(target);
  };

  const handleNextPlanet = () => {
    const list = filteredBodies.length > 0 ? filteredBodies : allBodiesList;
    const nextIdx = (currentIndex + 1) % list.length;
    const target = list[nextIdx].id as PlanetId;
    onSelectPlanet(target);
    onFocusCamera(target);
  };

  return (
    <>
      {/* Floating 3D Hover Cursor Tooltip Card */}
      {hoveredBody && hoverPos && (
        <div
          className="fixed z-50 pointer-events-none transition-all duration-75 animate-in fade-in zoom-in-95"
          style={{
            left: Math.min(window.innerWidth - 290, Math.max(16, hoverPos.x + 16)),
            top: Math.min(window.innerHeight - 180, Math.max(16, hoverPos.y - 40)),
          }}
        >
          <div className="glass-panel rounded-xl p-3 border border-sky-400/80 bg-slate-950/95 shadow-2xl backdrop-blur-xl w-68 space-y-1.5">
            <div className="flex items-center justify-between gap-1 border-b border-sky-500/20 pb-1.5">
              <div className="flex items-center gap-2 truncate pr-1">
                <div
                  className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                  style={{ backgroundColor: hoveredBody.colorHex }}
                />
                <h4 className="font-tech text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                  {hoveredBody.name}
                </h4>
              </div>
              <span className="text-[9px] font-mono-tech px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/30 shrink-0">
                {hoveredBody.type}
              </span>
            </div>

            <p className="text-[10px] text-slate-300 leading-snug line-clamp-2">
              {hoveredBody.description}
            </p>

            <div className="flex items-center justify-between text-[9px] font-mono-tech text-slate-400 pt-1 border-t border-slate-800">
              <span className="truncate">
                {hoveredBody.parentBody ? `Host: ${hoveredBody.parentBody}` : `Diameter: ${hoveredBody.diameterKm.toLocaleString()} km`}
              </span>
              <span className="text-sky-300 font-bold shrink-0 ml-1">Click to Focus Camera</span>
            </div>
          </div>
        </div>
      )}

      <div
        onWheel={(e) => e.stopPropagation()}
        className="absolute bottom-3 left-3 right-3 sm:left-6 sm:right-6 z-10 flex flex-col items-center pointer-events-none select-none"
      >
        {/* 1. Detail Card for selected body (Collapsible so it never blocks the scene) */}
        <div className="pointer-events-auto w-full max-w-4xl glass-panel rounded-xl shadow-2xl p-3 sm:p-4 mb-2 border border-sky-500/25 transition-all">
          <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
            <div className="flex items-center gap-2.5">
              <div
                className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                style={{ backgroundColor: currentBody.colorHex }}
              />
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-tech text-base sm:text-lg font-bold text-slate-100 tracking-wide">
                    {currentBody.name}
                  </h2>
                  <span className="text-[10px] font-mono-tech text-sky-400 px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/30">
                    {currentBody.type}
                  </span>
                  {currentBody.parentBody && (
                    <span className="text-[10px] font-mono-tech text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-500/30">
                      Host: {currentBody.parentBody}
                    </span>
                  )}
                </div>
                {!detailsCollapsed && (
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 line-clamp-2 max-w-2xl">
                    {currentBody.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Spoken Voice Briefing Button */}
              <button
                onClick={() => speechNarrationService.narrateCelestialBody(currentBody)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-tech font-bold uppercase text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 rounded transition-colors cursor-pointer shadow-xs active:scale-95"
                title="Listen to spoken audio briefing"
              >
                <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Listen Briefing</span>
              </button>

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
                  <span className="block text-[9px] text-slate-400 uppercase">Distance From Sun / Host</span>
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
                  *Orbital scale adjusted for interactive 3D inspection
                </span>
              </div>
            </>
          )}
        </div>

        {/* 2. Celestial Category Filter Tabs + Celestial List Bar */}
        <div className="pointer-events-auto w-full max-w-4xl glass-panel rounded-xl p-1.5 flex flex-col gap-1.5 border border-sky-500/25 shadow-2xl">
          {/* Category Pills */}
          <div className="flex items-center justify-between px-1 text-[10px] font-mono-tech border-b border-slate-800/80 pb-1">
            <div className="flex items-center gap-1">
              {(
                [
                  { key: 'all', label: 'All Objects' },
                  { key: 'planets', label: 'Planets & Sun' },
                  { key: 'moons', label: 'Moons' },
                  { key: 'satellites', label: 'Satellites & Probes' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-2 py-0.5 rounded transition-all cursor-pointer font-bold ${
                    activeCategory === cat.key
                      ? 'bg-sky-500 text-slate-950 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <span className="text-slate-400 hidden sm:inline">
              Showing {filteredBodies.length} celestial targets
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Previous Button */}
            <button
              onClick={handlePrevPlanet}
              className="p-2 text-slate-400 hover:text-sky-300 hover:bg-slate-800/60 rounded transition-colors cursor-pointer shrink-0"
              title="Previous celestial target"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Scrollable List */}
            <div className="flex-1 overflow-x-auto custom-scrollbar flex items-center gap-1 py-0.5">
              {filteredBodies.map((body) => {
                const isSelected = selectedPlanetId === body.id;
                return (
                  <button
                    key={body.id}
                    onClick={() => {
                      onSelectPlanet(body.id as PlanetId);
                      onFocusCamera(body.id as PlanetId);
                    }}
                    className={`flex-1 min-w-[80px] sm:min-w-[92px] flex flex-col items-center py-1.5 px-1.5 rounded-lg transition-all cursor-pointer border shrink-0 ${
                      isSelected
                        ? 'bg-sky-500/25 border-sky-400 text-white font-semibold shadow-xs'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border-transparent'
                    }`}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full mb-1 transition-transform"
                      style={{
                        backgroundColor: body.colorHex,
                        boxShadow: isSelected ? `0 0 8px ${body.colorHex}` : 'none',
                      }}
                    />
                    <span className="font-tech text-[10px] sm:text-[11px] uppercase tracking-wider truncate w-full text-center">
                      {body.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Next Button */}
            <button
              onClick={handleNextPlanet}
              className="p-2 text-slate-400 hover:text-sky-300 hover:bg-slate-800/60 rounded transition-colors cursor-pointer shrink-0"
              title="Next celestial target"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
