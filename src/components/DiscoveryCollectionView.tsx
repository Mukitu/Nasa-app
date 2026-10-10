import React from 'react';
import { CollectedDiscovery, NasaImageItem } from '../types/simulation';
import {
  Bookmark,
  Trash2,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  Search,
  Eye,
  Info,
  Database,
  ArrowRight,
} from 'lucide-react';

interface DiscoveryCollectionViewProps {
  discoveries: CollectedDiscovery[];
  onOpenRecord: (discovery: CollectedDiscovery) => void;
  onRemoveDiscovery: (id: string) => void;
  onExploreArchive: () => void;
}

export const DiscoveryCollectionView: React.FC<DiscoveryCollectionViewProps> = ({
  discoveries,
  onOpenRecord,
  onRemoveDiscovery,
  onExploreArchive,
}) => {
  return (
    <div className="absolute inset-0 z-10 flex flex-col p-3 sm:p-6 bg-[#04060c]/95 overflow-hidden">
      {/* 1. Header */}
      <div className="shrink-0 glass-panel rounded-2xl p-4 sm:p-5 border border-sky-500/25 shadow-2xl space-y-3 mb-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Bookmark className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-tech text-base sm:text-lg font-bold text-white tracking-wider">
                MY MISSION DISCOVERIES COLLECTION
              </h1>
              <span className="text-[10px] font-mono-tech text-slate-400 block -mt-0.5">
                Saved Archival Records &bull; Session Progress Log
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono-tech px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-emerald-300 font-bold">
              {discoveries.length} Records Saved
            </span>
            <button
              onClick={onExploreArchive}
              className="py-1.5 px-3 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 text-xs font-tech font-semibold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search More Archives</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono-tech text-slate-400">
          <Info className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>
            Records saved during this session remain available in memory for instant inspection, machine perspective storytelling, and timeline review.
          </span>
        </div>
      </div>

      {/* 2. Discoveries Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {discoveries.length === 0 ? (
          <div className="py-24 px-6 flex flex-col items-center justify-center gap-3 text-center glass-panel rounded-2xl border border-slate-800 max-w-md mx-auto my-auto">
            <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-500 border border-slate-800">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="font-tech text-base font-bold text-slate-200">
              No Discoveries Saved Yet
            </h3>
            <p className="text-xs font-mono-tech text-slate-400 leading-relaxed">
              Explore the lunar and Martian surface with the rover, or search the NASA Image Archive, and click "Save to Collection" on any record to build your mission catalog.
            </p>
            <button
              onClick={onExploreArchive}
              className="mt-2 py-2 px-4 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-tech font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md"
            >
              Explore NASA Image Library
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pb-6">
            {discoveries.map((item) => (
              <div
                key={item.id}
                className="group relative glass-panel rounded-xl overflow-hidden border border-slate-800 hover:border-emerald-500/50 transition-all flex flex-col justify-between hover:shadow-xl bg-slate-950/60"
              >
                {/* Media Thumbnail */}
                <div
                  onClick={() => onOpenRecord(item)}
                  className="relative aspect-video bg-black/60 overflow-hidden cursor-pointer"
                >
                  <img
                    src={item.thumbUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><rect width="100" height="60" fill="%231e293b"/><text x="50" y="32" font-family="sans-serif" font-size="10" fill="%2394a3b8" text-anchor="middle">NASA Media</text></svg>';
                    }}
                  />

                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-[9px] font-mono-tech text-slate-300 border border-white/10 uppercase">
                    {item.media_type}
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveDiscovery(item.id);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 backdrop-blur-xs text-slate-400 hover:text-rose-400 border border-white/10 transition-colors cursor-pointer"
                    title="Remove from Collection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => onOpenRecord(item)}
                      className="font-tech text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 cursor-pointer group-hover:text-emerald-300 transition-colors"
                    >
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-sans line-clamp-2 mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono-tech text-slate-400">
                    <span>ID: {item.nasa_id}</span>
                    <button
                      onClick={() => onOpenRecord(item)}
                      className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <span>Review</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
