import React, { useEffect, useState } from 'react';
import {
  NasaImageItem,
  MachineStory,
} from '../types/simulation';
import { speechNarrationService } from '../services/speechNarrationService';
import {
  X,
  Sparkles,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Volume2,
  VolumeX,
  ShieldCheck,
  Info,
  Calendar,
  Compass,
} from 'lucide-react';

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
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const mediaUrl = record.fullUrl || record.thumbUrl || '';

  // Spoken narration string
  const narrationText = (record as any).spokenNarration || record.description || record.title;

  useEffect(() => {
    speechNarrationService.narrateWaypoint({
      id: record.nasa_id || (record as any).id || 'artifact',
      nasa_id: record.nasa_id || '',
      imageUrl: mediaUrl,
      name: record.title,
      sublabel: 'Verified NASA Artifact',
      environment: 'moon',
      worldPos: { x: 0, z: 0 },
      searchQuery: record.title,
      equipmentType: 'Artifact',
      agency: 'NASA / Space Exploration',
      landingYear: 1969,
      description: record.description,
      historicalContext: record.description,
      realCoordinatesText: 'Archival Data Record',
      spokenNarration: narrationText,
      discovered: true,
    });
    setIsPlayingAudio(true);

    return () => {
      speechNarrationService.stop();
    };
  }, [narrationText, mediaUrl, record]);

  const handleToggleAudio = () => {
    if (isPlayingAudio) {
      speechNarrationService.stop();
      setIsPlayingAudio(false);
    } else {
      speechNarrationService.narrateWaypoint({
        id: record.nasa_id || (record as any).id || 'artifact',
        nasa_id: record.nasa_id || '',
        imageUrl: mediaUrl,
        name: record.title,
        sublabel: 'Verified NASA Artifact',
        environment: 'moon',
        worldPos: { x: 0, z: 0 },
        searchQuery: record.title,
        equipmentType: 'Artifact',
        agency: 'NASA / Space Exploration',
        landingYear: 1969,
        description: record.description,
        historicalContext: record.description,
        realCoordinatesText: 'Archival Data Record',
        spokenNarration: narrationText,
        discovered: true,
      });
      setIsPlayingAudio(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col glass-panel rounded-2xl border border-sky-400/40 shadow-2xl overflow-hidden bg-[#060a14]">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-sky-500/20 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/15 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-tech uppercase text-sky-400 font-bold tracking-wider">
                  ARTIFACT INSPECTION &bull; HISTORIC RECORD
                </span>
                {isSimulatedPoi && (
                  <span className="text-[9px] font-mono-tech px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-500/30">
                    HISTORICAL BEACON
                  </span>
                )}
              </div>
              <h2 className="font-tech text-sm sm:text-base font-bold text-white tracking-wide truncate max-w-md sm:max-w-xl">
                {record.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Voice Toggle */}
            <button
              onClick={handleToggleAudio}
              className={`p-2 rounded-lg border text-xs font-tech flex items-center gap-1.5 transition-all cursor-pointer ${
                isPlayingAudio
                  ? 'bg-amber-500/25 border-amber-400 text-amber-300 animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
              title="Toggle Bengali / English Voice Narration"
            >
              {isPlayingAudio ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline text-[11px] font-mono-tech">
                {isPlayingAudio ? 'Speaking Voice...' : 'Read Aloud'}
              </span>
            </button>

            {/* Bookmark / Collect Button */}
            <button
              onClick={() => onToggleCollect(record)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-tech font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                isCollected
                  ? 'bg-emerald-500/25 border-emerald-400 text-emerald-300 shadow-xs'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
            >
              {isCollected ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isCollected ? 'Saved' : 'Save'}</span>
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

        {/* Split 2-Column Layout: IMAGE ON LEFT (50%), CONCISE FACTS ON RIGHT (50%) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* LEFT SIDE: LARGE CLEAR IMAGE PREVIEW */}
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden bg-black border border-sky-500/30 shadow-2xl flex items-center justify-center min-h-[280px] max-h-[460px]">
              <img
                src={mediaUrl}
                alt={record.title}
                className="w-full max-h-[460px] object-contain rounded-2xl"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  if (target.src !== record.thumbUrl && record.thumbUrl) {
                    target.src = record.thumbUrl;
                  }
                }}
              />
              <div className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-black/75 backdrop-blur-md text-[10px] font-mono-tech text-sky-300 border border-sky-400/30">
                HIGH RESOLUTION ARCHIVE
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono-tech text-slate-400 px-1">
              <span>NASA ID: {record.nasa_id || 'AS11-40-5927'}</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Verified NASA Artifact
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: SHORT CONCISE POINTS & DETAILS */}
          <div className="space-y-4">
            {/* Short Key Summary Bullets */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-sky-500/20 space-y-3">
              <span className="text-[11px] font-mono-tech uppercase text-sky-400 font-bold tracking-wider block">
                BRIEF SUMMARY &amp; TELEMETRY
              </span>

              <ul className="space-y-2.5 text-xs text-slate-200 font-sans leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-sky-300 font-tech">Designation &amp; Name:</strong> {record.title}
                  </div>
                </li>

                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-amber-300 font-tech">Mission History:</strong> {record.description ? record.description.slice(0, 160) + '...' : 'Delivered by NASA astronaut missions and autonomous robotic landers.'}
                  </div>
                </li>

                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                  <div>
                    <strong className="text-emerald-300 font-tech">Preservation State:</strong> Well preserved and intact in the extraterrestrial vacuum environment.
                  </div>
                </li>
              </ul>
            </div>

            {/* Official Narrative text */}
            <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono-tech uppercase text-slate-400 font-bold tracking-wider block">
                FULL HISTORICAL CONTEXT
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {record.description}
              </p>
            </div>

            {/* Source link */}
            {record.nasaWebUrl && (
              <div className="pt-1 text-right">
                <a
                  href={record.nasaWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-mono-tech text-sky-400 hover:text-sky-300 hover:underline inline-flex items-center gap-1"
                >
                  <span>Official NASA Record</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 py-3.5 border-t border-sky-500/20 bg-slate-900/90 flex items-center justify-between text-xs font-mono-tech text-slate-400">
          <span>ECHOES OF SPACE &bull; HISTORICAL ARCHIVE</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-tech font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
