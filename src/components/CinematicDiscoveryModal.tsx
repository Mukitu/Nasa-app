import React, { useEffect, useState } from 'react';
import {
  NasaImageItem,
  CollectedDiscovery,
  TimelineEvent,
  MachineStory,
} from '../types/simulation';
import { nasaService } from '../services/nasaApi';
import { generateMachineStory } from '../utils/machineStoryteller';
import { getMissionTimelineForRecord } from '../utils/missionTimelines';
import {
  X,
  Sparkles,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Calendar,
  Layers,
  Database,
  Volume2,
  VolumeX,
  ChevronLeft,
  ChevronRight,
  Info,
  Clock,
  Code,
  ShieldCheck,
  AlertTriangle,
  Play,
  FileText,
} from 'lucide-react';
import { aerospaceAudio } from '../utils/audio';

interface CinematicDiscoveryModalProps {
  record: NasaImageItem;
  isCollected: boolean;
  isSimulatedPoi?: boolean;
  onToggleCollect: (record: NasaImageItem) => void;
  onClose: () => void;
}

export const CinematicDiscoveryModal: React.FC<CinematicDiscoveryModalProps> = ({
  record,
  isCollected,
  isSimulatedPoi,
  onToggleCollect,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'story' | 'timeline' | 'technical'>('overview');
  const [soundEnabled, setSoundEnabled] = useState(false); // Audio muted by default as required!
  const [assetUrls, setAssetUrls] = useState<string[]>([]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Generate machine story & timeline
  const story: MachineStory = generateMachineStory(record);
  const timeline: TimelineEvent[] = getMissionTimelineForRecord(record);

  // Fetch asset manifest variants via NASA asset endpoint
  useEffect(() => {
    let cancelled = false;
    if (record.nasa_id) {
      setLoadingAssets(true);
      nasaService.fetchAssetManifest(record.nasa_id).then((urls) => {
        if (!cancelled && urls.length > 0) {
          // Filter to image and mp4 video files
          const validMedia = urls.filter((u) =>
            u.match(/\.(jpg|jpeg|png|mp4)$/i)
          );
          setAssetUrls(validMedia.length > 0 ? validMedia : [record.fullUrl || record.thumbUrl]);
          setLoadingAssets(false);
        }
      });
    }
    return () => {
      cancelled = true;
    };
  }, [record.nasa_id, record.fullUrl, record.thumbUrl]);

  const activeMediaUrl = assetUrls[activeMediaIndex] || record.fullUrl || record.thumbUrl;
  const isVideo = activeMediaUrl.toLowerCase().endsWith('.mp4');

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) aerospaceAudio.playBeep(1200, 0.05);
  };

  const handleCollect = () => {
    onToggleCollect(record);
    if (soundEnabled) aerospaceAudio.playBeep(1600, 0.08);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-4xl max-h-[94vh] flex flex-col glass-panel rounded-2xl border border-sky-400/40 shadow-2xl overflow-hidden bg-[#060a14]">
        {/* 1. CINEMATIC TOP HEADER */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-sky-500/20 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-tech uppercase text-sky-400 font-bold tracking-wider">
                  NASA Archive Discovery
                </span>
                <span className="text-[9px] font-mono-tech px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {record.media_type === 'video' ? 'VIDEO ARCHIVE' : 'STILL IMAGERY'}
                </span>
                {isSimulatedPoi && (
                  <span className="text-[9px] font-mono-tech px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">
                    SIMULATED POI BEACON
                  </span>
                )}
              </div>
              <h2 className="font-tech text-sm sm:text-base font-bold text-white tracking-wide truncate max-w-md sm:max-w-xl">
                {record.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle (Muted by default) */}
            <button
              onClick={handleToggleSound}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                soundEnabled
                  ? 'bg-sky-500/20 border-sky-400 text-sky-300'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title={soundEnabled ? 'Telemetry Audio Active' : 'Audio Muted (Click to enable)'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Bookmark / Collect Button */}
            <button
              onClick={handleCollect}
              className={`px-3 py-1.5 rounded-lg border text-xs font-tech font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                isCollected
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {isCollected ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isCollected ? 'Saved' : 'Save to Collection'}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer ml-1"
              title="Close discovery view"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. TAB NAVIGATION */}
        <div className="shrink-0 flex items-center gap-2 px-4 sm:px-6 py-2 border-b border-slate-800/90 bg-slate-950/70 text-xs font-tech">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-sky-500/25 border border-sky-400/50 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Media &amp; Facts</span>
          </button>

          <button
            onClick={() => setActiveTab('story')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'story'
                ? 'bg-amber-500/25 border border-amber-400/50 text-amber-200 font-semibold'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Echoes of the Machine</span>
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'bg-sky-500/25 border border-sky-400/50 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Mission Timeline ({timeline.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('technical')}
            className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'technical'
                ? 'bg-sky-500/25 border border-sky-400/50 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Technical Data</span>
          </button>
        </div>

        {/* 3. SCROLLABLE TAB CONTENT */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
          {/* TAB 1: OVERVIEW & MEDIA */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Large Media Preview Deck */}
              <div className="relative rounded-xl overflow-hidden bg-black/80 border border-slate-800 flex items-center justify-center min-h-[260px] max-h-[440px]">
                {isVideo ? (
                  <video
                    src={activeMediaUrl}
                    controls
                    className="w-full max-h-[440px] object-contain"
                  />
                ) : (
                  <img
                    src={activeMediaUrl}
                    alt={record.title}
                    className="w-full max-h-[440px] object-contain"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (target.src !== record.thumbUrl && record.thumbUrl) {
                        target.src = record.thumbUrl;
                      } else {
                        target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="%230b0f19"/><text x="300" y="200" font-family="sans-serif" font-size="14" fill="%2338bdf8" text-anchor="middle">NASA Official Media Archive</text></svg>';
                      }
                    }}
                  />
                )}

                {/* Media Variant Selector if multiple are found */}
                {assetUrls.length > 1 && (
                  <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-black/75 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 text-[10px] font-mono-tech text-slate-300">
                    <button
                      onClick={() => setActiveMediaIndex((prev) => Math.max(0, prev - 1))}
                      disabled={activeMediaIndex === 0}
                      className="p-0.5 rounded hover:bg-white/20 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span>
                      Asset {activeMediaIndex + 1} of {assetUrls.length}
                    </span>
                    <button
                      onClick={() => setActiveMediaIndex((prev) => Math.min(assetUrls.length - 1, prev + 1))}
                      disabled={activeMediaIndex === assetUrls.length - 1}
                      className="p-0.5 rounded hover:bg-white/20 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono-tech text-slate-300 border border-white/10">
                  NASA ID: {record.nasa_id}
                </div>
              </div>

              {/* Verified Metadata Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-tech">
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Archive Date</span>
                  <span className="text-slate-100 font-semibold block truncate">
                    {record.date_created ? new Date(record.date_created).toLocaleDateString() : 'Historical Archive'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">NASA Center</span>
                  <span className="text-slate-100 font-semibold block truncate">
                    {record.center || 'NASA Headquarters'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Catalog Source</span>
                  <span className="text-slate-100 font-semibold block truncate">
                    images-api.nasa.gov
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-900/70 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block uppercase">Verification Status</span>
                  <span className="text-emerald-400 font-semibold block truncate flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Authentic Record
                  </span>
                </div>
              </div>

              {/* Documented Historical Caption */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono-tech uppercase text-slate-400 font-semibold tracking-wider">
                    Official Historical Description
                  </span>
                  {record.nasaWebUrl && (
                    <a
                      href={record.nasaWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-mono-tech text-sky-400 hover:text-sky-300 hover:underline inline-flex items-center gap-1"
                    >
                      <span>View on images.nasa.gov</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-line">
                  {record.description}
                </p>
              </div>

              {/* Fact vs Simulation Notice */}
              <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center gap-2 text-[11px] font-mono-tech text-slate-400">
                <Info className="w-4 h-4 text-sky-400 shrink-0" />
                <span>
                  Scientific Note: This record represents genuine NASA archival documentation. Simulated rover coordinates are illustrative gameplay waypoints.
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: ECHOES OF THE FORGOTTEN MACHINE (Creative Monologue) */}
          {activeTab === 'story' && (
            <div className="space-y-4">
              {/* Prominent Mandatory Disclaimer Banner */}
              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-500/40 flex items-center gap-2.5 text-xs font-mono-tech text-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-semibold">
                  {story.disclaimer}
                </span>
              </div>

              {story.hasStory ? (
                <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-amber-500/30 space-y-4 shadow-xl">
                  <div className="border-b border-amber-500/20 pb-3">
                    <span className="text-[10px] font-mono-tech text-amber-400 uppercase tracking-widest block font-bold">
                      IMAGINED PERSPECTIVE
                    </span>
                    <h3 className="font-tech text-lg sm:text-xl font-bold text-white tracking-wide mt-0.5">
                      {story.perspectiveSpeaker}
                    </h3>
                  </div>

                  <div className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans space-y-3.5 italic border-l-2 border-amber-400/60 pl-4 sm:pl-5">
                    {story.narrative.split('\n\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>

                  {/* Grounded Historical Facts Section */}
                  <div className="pt-4 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] font-mono-tech uppercase text-slate-400 font-bold tracking-wider block">
                      GROUNDED SOURCE METADATA (VERIFIED FACTS)
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono-tech">
                      {story.verifiedFacts.map((fact, idx) => (
                        <div key={idx} className="p-2 rounded bg-slate-950/80 border border-slate-800 text-slate-300">
                          {fact}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 px-6 rounded-xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                  <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto" />
                  <h4 className="font-tech font-bold text-base text-slate-200">
                    Story Generation Unavailable
                  </h4>
                  <p className="text-xs font-mono-tech text-slate-400 max-w-md mx-auto">
                    {story.unavailabilityReason}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VERIFIED MISSION TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-tech font-bold uppercase tracking-wider text-slate-300">
                  Chronological Mission Milestones
                </span>
                <span className="text-[11px] font-mono-tech text-slate-500">
                  *Only dates verified by NASA records are presented
                </span>
              </div>

              {timeline.length > 0 ? (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-sky-500/30">
                  {timeline.map((event) => (
                    <div key={event.id} className="relative group">
                      <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-sky-400 group-hover:scale-125 transition-transform" />
                      <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 group-hover:border-sky-500/40 transition-colors space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="text-[11px] font-mono-tech text-sky-400 font-bold">
                            {event.date}
                          </span>
                          <span className="text-[9px] font-mono-tech uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {event.category || 'Milestone'}
                          </span>
                        </div>

                        <h4 className="font-tech font-bold text-sm text-slate-100">
                          {event.title}
                        </h4>

                        <p className="text-xs text-slate-300 leading-relaxed font-sans">
                          {event.description}
                        </p>

                        {event.sourceUrl && (
                          <div className="pt-1">
                            <a
                              href={event.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-mono-tech text-sky-400 hover:underline inline-flex items-center gap-1"
                            >
                              <span>Official NASA Source Record</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs font-mono-tech">
                  No chronological timeline events established for this specific single-frame record.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: TECHNICAL DATA */}
          {activeTab === 'technical' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono-tech text-slate-400">
                <span>Asset Technical Manifest</span>
                <span className="text-sky-400">NASA API Endpoint: /asset/{record.nasa_id}</span>
              </div>

              {/* Raw JSON viewer */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono-tech text-[11px] text-slate-300 overflow-x-auto custom-scrollbar max-h-80 space-y-1">
                <div><span className="text-sky-400">"nasa_id"</span>: <span className="text-amber-300">"{record.nasa_id}"</span>,</div>
                <div><span className="text-sky-400">"title"</span>: <span className="text-amber-300">"{record.title}"</span>,</div>
                <div><span className="text-sky-400">"center"</span>: <span className="text-amber-300">"{record.center}"</span>,</div>
                <div><span className="text-sky-400">"date_created"</span>: <span className="text-amber-300">"{record.date_created}"</span>,</div>
                <div><span className="text-sky-400">"media_type"</span>: <span className="text-amber-300">"{record.media_type}"</span>,</div>
                <div><span className="text-sky-400">"keywords"</span>: {JSON.stringify(record.keywords || [], null, 2)},</div>
                <div><span className="text-sky-400">"asset_urls_manifest"</span>: {JSON.stringify(assetUrls, null, 2)}</div>
              </div>
            </div>
          )}
        </div>

        {/* 4. FOOTER */}
        <div className="shrink-0 px-4 sm:px-6 py-3 border-t border-sky-500/20 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono-tech text-slate-400">
          <span>NASA Space Apps Challenge &bull; Echoes of Space</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCollect}
              className={`px-3 py-1.5 rounded-lg border text-xs font-tech font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer ${
                isCollected
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {isCollected ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span>{isCollected ? 'Saved to Collection' : 'Save to Collection'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/40 font-tech font-bold uppercase tracking-wider cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
