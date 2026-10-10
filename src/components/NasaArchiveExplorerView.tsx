import React, { useState, useEffect } from 'react';
import { NasaImageItem } from '../types/simulation';
import { nasaService } from '../services/nasaApi';
import {
  Search,
  Database,
  Filter,
  Image as ImageIcon,
  Video,
  ExternalLink,
  Loader2,
  Calendar,
  Layers,
  Sparkles,
  AlertCircle,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
} from 'lucide-react';

interface NasaArchiveExplorerViewProps {
  onSelectRecord: (record: NasaImageItem) => void;
  collectedIds: Set<string>;
  onToggleCollect: (record: NasaImageItem) => void;
}

export const NasaArchiveExplorerView: React.FC<NasaArchiveExplorerViewProps> = ({
  onSelectRecord,
  collectedIds,
  onToggleCollect,
}) => {
  const [query, setQuery] = useState('Apollo lunar equipment');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'all'>('image');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<NasaImageItem[]>([]);

  // Curated quick search topics strictly for NASA exploration history
  const presetQueries = [
    { label: 'Apollo Lunar Hardware', q: 'Apollo lunar module descent stage' },
    { label: 'Lunar Roving Vehicle', q: 'Apollo 15 Lunar Roving Vehicle' },
    { label: 'Surveyor Moon Landers', q: 'Surveyor spacecraft moon lander' },
    { label: 'Viking Martian Landers', q: 'Viking 1 lander Mars surface' },
    { label: 'Opportunity & Spirit Rovers', q: 'Opportunity rover Mars surface' },
    { label: 'Curiosity Mars Laboratory', q: 'Curiosity rover Gale crater Mount Sharp' },
    { label: 'Perseverance & Ingenuity', q: 'Perseverance rover Jezero crater' },
    { label: 'Historic Spacecraft Discarded', q: 'Apollo lunar scientific experiments' },
  ];

  const handleSearch = async (targetQuery = query) => {
    if (!targetQuery.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const items = await nasaService.searchNasaImages(targetQuery, mediaType);
      setResults(items);
      if (items.length === 0) {
        setError(`No archival records matching "${targetQuery}" were found in the NASA repository.`);
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to retrieve records from the NASA Image and Video Library.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch('Apollo lunar equipment');
  }, [mediaType]);

  return (
    <div className="absolute inset-0 z-10 flex flex-col p-3 sm:p-6 bg-[#04060c]/95 overflow-hidden">
      {/* 1. Header & Search Command Deck */}
      <div className="shrink-0 glass-panel rounded-2xl p-4 sm:p-5 border border-sky-500/25 shadow-2xl space-y-3.5 mb-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-tech text-base sm:text-lg font-bold text-white tracking-wider">
                NASA IMAGE &amp; VIDEO ARCHIVE EXPLORER
              </h1>
              <span className="text-[10px] font-mono-tech text-slate-400 block -mt-0.5">
                Direct queries to images-api.nasa.gov &bull; Verified Mission Artifacts
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono-tech px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
              {results.length} Records Retrieved
            </span>
          </div>
        </div>

        {/* Search Input & Media Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search NASA Image and Video Library (e.g. Apollo descent stage, Surveyor, Curiosity)..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 focus:border-sky-400 text-xs sm:text-sm font-sans text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Media Type Filter */}
            <div className="flex items-center glass-panel rounded-xl p-1 border border-slate-800 text-xs font-tech">
              <button
                onClick={() => setMediaType('image')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  mediaType === 'image' ? 'bg-sky-500/25 text-sky-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Images</span>
              </button>
              <button
                onClick={() => setMediaType('video')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  mediaType === 'video' ? 'bg-sky-500/25 text-sky-300 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Videos</span>
              </button>
            </div>

            <button
              onClick={() => handleSearch()}
              disabled={loading}
              className="py-2.5 px-4 rounded-xl bg-sky-400 hover:bg-sky-300 disabled:opacity-50 text-slate-950 font-tech font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>Query Archive</span>
            </button>
          </div>
        </div>

        {/* Curated Historical Subjects Query Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs font-tech">
          <span className="text-[10px] font-mono-tech text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Suggested Subjects:
          </span>
          {presetQueries.map((preset) => (
            <button
              key={preset.q}
              onClick={() => {
                setQuery(preset.q);
                handleSearch(preset.q);
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-sky-200 whitespace-nowrap text-[11px] transition-all cursor-pointer shrink-0"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Search Results Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
            <span className="text-xs font-mono-tech tracking-wider">
              Searching official NASA Image and Video Library archives...
            </span>
          </div>
        ) : error && results.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2.5 text-center p-6 glass-panel rounded-2xl border border-slate-800">
            <AlertCircle className="w-7 h-7 text-amber-400" />
            <h3 className="font-tech text-sm font-bold text-slate-200">
              No Matching Records
            </h3>
            <p className="text-xs font-mono-tech text-slate-400 max-w-md">
              {error}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pb-6">
            {results.map((item) => {
              const isCollected = collectedIds.has(item.nasa_id);
              const dateYear = item.date_created ? new Date(item.date_created).getFullYear() : '';

              return (
                <div
                  key={item.nasa_id}
                  onClick={() => onSelectRecord(item)}
                  className="group relative glass-panel rounded-xl overflow-hidden border border-slate-800 hover:border-sky-400/50 transition-all cursor-pointer flex flex-col justify-between hover:shadow-xl hover:-translate-y-0.5 bg-slate-950/60"
                >
                  {/* Thumbnail Banner */}
                  <div className="relative aspect-video bg-black/60 overflow-hidden flex items-center justify-center">
                    <img
                      src={item.thumbUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="60" viewBox="0 0 100 60"><rect width="100" height="60" fill="%231e293b"/><text x="50" y="32" font-family="sans-serif" font-size="10" fill="%2394a3b8" text-anchor="middle">NASA Media</text></svg>';
                      }}
                    />

                    {/* Media Type & Collect Badge */}
                    <div className="absolute top-2 left-2 flex items-center gap-1">
                      <span className="text-[9px] font-mono-tech px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-sky-300 border border-white/10 uppercase">
                        {item.media_type === 'video' ? 'Video' : 'Image'}
                      </span>
                      {dateYear && (
                        <span className="text-[9px] font-mono-tech px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-slate-300 border border-white/10">
                          {dateYear}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleCollect(item);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/75 backdrop-blur-xs text-slate-300 hover:text-emerald-300 border border-white/10 transition-colors"
                      title={isCollected ? 'Remove from Discoveries' : 'Save to Discoveries'}
                    >
                      {isCollected ? (
                        <BookmarkCheck className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>

                  {/* Metadata Content */}
                  <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-tech text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 group-hover:text-sky-300 transition-colors">
                        {item.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-sans line-clamp-2 mt-1 leading-snug">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono-tech text-slate-400">
                      <span className="truncate max-w-[120px]">{item.center}</span>
                      <span className="text-sky-400 group-hover:underline flex items-center gap-1">
                        Inspect
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
