import React, { useState } from 'react';
import { SurfaceWaypoint } from '../types/simulation';
import {
  X,
  Sparkles,
  Search,
  CheckCircle2,
  Circle,
  MapPin,
  Calendar,
  Layers,
  ExternalLink,
  Flame,
  Moon,
} from 'lucide-react';

interface DiscoveriesCatalogModalProps {
  waypoints: SurfaceWaypoint[];
  onInspectWaypoint: (waypoint: SurfaceWaypoint) => void;
  onClose: () => void;
}

export const DiscoveriesCatalogModal: React.FC<DiscoveriesCatalogModalProps> = ({
  waypoints,
  onInspectWaypoint,
  onClose,
}) => {
  const [filter, setFilter] = useState<'all' | 'moon' | 'mars'>('all');

  const filteredWaypoints = waypoints.filter((w) => {
    if (filter === 'all') return true;
    return w.environment === filter;
  });

  const totalDiscovered = waypoints.filter((w) => w.discovered).length;
  const moonDiscovered = waypoints.filter((w) => w.environment === 'moon' && w.discovered).length;
  const marsDiscovered = waypoints.filter((w) => w.environment === 'mars' && w.discovered).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col glass-panel rounded-2xl border border-sky-400/40 shadow-2xl overflow-hidden bg-[#070b16]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-sky-500/20 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-tech text-base sm:text-lg font-bold text-white tracking-wide">
                ARTIFACT DISCOVERIES CATALOG
              </h2>
              <span className="text-[10px] font-mono-tech text-slate-400 block -mt-0.5">
                NASA Space Apps Challenge &bull; Abandoned but not Forgotten
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Catalog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter & Summary Stats */}
        <div className="shrink-0 p-4 border-b border-slate-800/80 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-tech text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer border ${
                filter === 'all'
                  ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Anomalies ({waypoints.length})
            </button>
            <button
              onClick={() => setFilter('moon')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer border flex items-center gap-1.5 ${
                filter === 'moon'
                  ? 'bg-sky-500/25 border-sky-400 text-sky-200 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-sky-400" />
              <span>Moon ({moonDiscovered}/5)</span>
            </button>
            <button
              onClick={() => setFilter('mars')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer border flex items-center gap-1.5 ${
                filter === 'mars'
                  ? 'bg-amber-500/25 border-amber-400 text-amber-200 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Mars ({marsDiscovered}/5)</span>
            </button>
          </div>

          <div className="text-xs font-mono-tech text-slate-300">
            Total Surveyed:{' '}
            <span className="font-bold text-emerald-400 text-sm">
              {totalDiscovered} / {waypoints.length}
            </span>{' '}
            ({Math.round((totalDiscovered / waypoints.length) * 100)}%)
          </div>
        </div>

        {/* Waypoints Grid */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredWaypoints.map((wp) => (
              <div
                key={wp.id}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  wp.discovered
                    ? 'bg-slate-900/80 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-950/70 border-slate-800/80 opacity-85'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[9px] font-mono-tech px-2 py-0.5 rounded-full uppercase tracking-wider font-semibold ${
                        wp.environment === 'moon'
                          ? 'bg-sky-950/80 text-sky-300 border border-sky-500/30'
                          : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {wp.environment === 'moon' ? 'Moon' : 'Mars'} &bull; {wp.landingYear}
                    </span>

                    <span
                      className={`text-[10px] font-mono-tech flex items-center gap-1 font-semibold uppercase ${
                        wp.discovered ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {wp.discovered ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Discovered</span>
                        </>
                      ) : (
                        <>
                          <Circle className="w-3.5 h-3.5 text-slate-600" />
                          <span>Unexplored</span>
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="font-tech text-sm sm:text-base font-bold text-slate-100">
                    {wp.name}
                  </h3>
                  <p className="text-[11px] font-mono-tech text-slate-400">
                    {wp.equipmentType}
                  </p>
                  <p className="text-xs text-slate-300 font-sans line-clamp-2 leading-relaxed">
                    {wp.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] font-mono-tech text-slate-400 truncate max-w-[170px]">
                    {wp.realCoordinatesText}
                  </span>

                  <button
                    onClick={() => onInspectWaypoint(wp)}
                    className="px-2.5 py-1.5 rounded bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 text-[11px] font-tech font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Search className="w-3 h-3" />
                    <span>NASA Archive</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3 border-t border-sky-500/20 bg-slate-900/90 flex items-center justify-between text-[11px] font-mono-tech text-slate-400">
          <span>Drive the Rover to waypoints to unlock live telemetry anomalies.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-tech font-semibold uppercase tracking-wider cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
