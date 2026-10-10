import React, { useEffect, useState } from 'react';
import { SurfaceWaypoint, NasaImageItem } from '../types/simulation';
import { nasaService } from '../services/nasaApi';
import {
  X,
  Search,
  ExternalLink,
  Calendar,
  Layers,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Database,
  Loader2,
} from 'lucide-react';

interface ArtifactDiscoveryModalProps {
  waypoint: SurfaceWaypoint;
  onConfirmDiscovery: (waypointId: string) => void;
  onClose: () => void;
}

export const ArtifactDiscoveryModal: React.FC<ArtifactDiscoveryModalProps> = ({
  waypoint,
  onConfirmDiscovery,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [records, setRecords] = useState<NasaImageItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);

    nasaService
      .searchNasaImages(waypoint.searchQuery)
      .then((items) => {
        if (!isCancelled) {
          setRecords(items);
          setLoading(false);
          if (items.length === 0) {
            setError(`No media records matching "${waypoint.searchQuery}" were returned by the NASA archive.`);
          }
        }
      })
      .catch((err: unknown) => {
        if (!isCancelled) {
          setLoading(false);
          setError(
            err instanceof Error
              ? err.message
              : 'Network error communicating with the official NASA Image and Video Library.'
          );
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [waypoint.searchQuery]);

  const activeRecord = records[activeIndex];

  const handleConfirmAndClose = () => {
    onConfirmDiscovery(waypoint.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col glass-panel rounded-2xl border border-sky-400/40 shadow-2xl overflow-hidden bg-[#070b16]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-sky-500/20 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono-tech uppercase text-sky-400 font-semibold tracking-wider block">
                NASA Historical Archive &bull; Simulated Exploration
              </span>
              <h2 className="font-tech text-sm sm:text-base font-bold text-white tracking-wide">
                {waypoint.name}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {/* Historical Storytelling Banner */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tech">
              <span className="text-sky-300 font-semibold uppercase">{waypoint.equipmentType}</span>
              <span className="text-emerald-400 font-semibold">Touchdown: {waypoint.landingYear}</span>
            </div>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {waypoint.description}
            </p>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1.5 text-xs font-mono-tech">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Documented NASA Coordinates:</span>
                <span className="text-sky-300 font-semibold">{waypoint.realCoordinatesText}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Program / Agency:</span>
                <span className="text-slate-200">{waypoint.agency}</span>
              </div>
            </div>

            <div className="text-xs text-slate-400 italic font-sans border-l-2 border-amber-400/80 pl-3 py-0.5">
              &ldquo;{waypoint.historicalContext}&rdquo;
            </div>
          </div>

          {/* NASA Image & Video Library Live Archive Results */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-sky-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-slate-200">
                  NASA Image &amp; Video Library Records ({records.length})
                </span>
              </div>

              {records.length > 1 && (
                <div className="flex items-center gap-1.5 text-xs font-mono-tech">
                  <button
                    onClick={() => setActiveIndex((prev) => Math.max(0, prev - 1))}
                    disabled={activeIndex === 0}
                    className="p-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-slate-400 text-[11px]">
                    {activeIndex + 1} of {records.length}
                  </span>
                  <button
                    onClick={() => setActiveIndex((prev) => Math.min(records.length - 1, prev + 1))}
                    disabled={activeIndex === records.length - 1}
                    className="p-1 rounded bg-slate-800 disabled:opacity-40 hover:bg-slate-700 text-slate-200 cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 className="w-7 h-7 text-sky-400 animate-spin" />
                <span className="text-xs font-mono-tech">Querying official NASA public repository...</span>
              </div>
            ) : error && records.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 text-center space-y-1.5">
                <AlertCircle className="w-5 h-5 text-amber-400 mx-auto" />
                <p className="text-xs text-slate-300 font-mono-tech">{error}</p>
                <p className="text-[11px] text-slate-400">
                  Documented historical specifications and landing coordinates remain preserved above.
                </p>
              </div>
            ) : activeRecord ? (
              <div className="space-y-3">
                {/* Media Preview */}
                <div className="relative rounded-xl overflow-hidden bg-black/60 border border-slate-800 aspect-video flex items-center justify-center max-h-72">
                  <img
                    src={activeRecord.fullUrl || activeRecord.thumbUrl}
                    alt={activeRecord.title}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to thumbnail if high-res fails
                      (e.currentTarget as HTMLImageElement).src = activeRecord.thumbUrl;
                    }}
                  />
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 backdrop-blur-xs text-[10px] font-mono-tech text-slate-300 border border-white/10">
                    NASA ID: {activeRecord.nasa_id}
                  </div>
                </div>

                {/* Metadata & Description */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono-tech">
                    <h4 className="font-tech font-bold text-sm text-slate-100">
                      {activeRecord.title}
                    </h4>
                    {activeRecord.date_created && (
                      <span className="text-[11px] text-slate-400">
                        {new Date(activeRecord.date_created).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-4">
                    {activeRecord.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-[10px] font-mono-tech text-slate-400">
                      Center: {activeRecord.center}
                    </span>

                    {activeRecord.nasaWebUrl && (
                      <a
                        href={activeRecord.nasaWebUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-mono-tech text-sky-400 hover:text-sky-300 hover:underline"
                      >
                        <span>View on images.nasa.gov</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 px-5 py-3.5 border-t border-sky-500/20 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[10px] font-mono-tech text-slate-400">
            NASA Space Apps Challenge &bull; Abandoned but not Forgotten
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-tech font-semibold uppercase tracking-wider transition-colors cursor-pointer"
            >
              Resume Driving
            </button>
            <button
              onClick={handleConfirmAndClose}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-lg bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-tech font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify &amp; Add Discovery</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
