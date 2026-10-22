import React, { useEffect, useState } from 'react';
import {
  speechNarrationService,
  SpeechNarrationState,
} from '../services/speechNarrationService';
import { SurfaceWaypoint } from '../types/simulation';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  X,
  Bot,
  MapPin,
  ExternalLink,
} from 'lucide-react';

interface SpokenNarrationBannerProps {
  onInspectWaypoint?: (waypoint: SurfaceWaypoint) => void;
  nearestAnomaly?: SurfaceWaypoint | null;
  nearestDistance?: number;
}

export const SpokenNarrationBanner: React.FC<SpokenNarrationBannerProps> = ({
  onInspectWaypoint,
  nearestAnomaly,
  nearestDistance,
}) => {
  const [narrationState, setNarrationState] = useState<SpeechNarrationState>(
    speechNarrationService.getState()
  );
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  useEffect(() => {
    return speechNarrationService.subscribe((s) => setNarrationState(s));
  }, []);

  const { isSpeaking, isPaused, isMuted, currentSubtitle, progressPercent } =
    narrationState;

  // Auto-clear dismissal lock and stop speech when moving away (>15m)
  useEffect(() => {
    if (nearestDistance !== undefined && nearestDistance > 15) {
      speechNarrationService.stop();
      if (dismissedId) {
        setDismissedId(null);
      }
    }
  }, [nearestDistance, dismissedId]);

  // Determine active waypoint: ONLY display when rover is nearby (within 15m)
  const isNearby = Boolean(nearestAnomaly && nearestDistance !== undefined && nearestDistance <= 15);
  const activeWaypoint = isNearby ? nearestAnomaly : null;

  if (!activeWaypoint || activeWaypoint.id === dismissedId) {
    return null;
  }

  // Check if speech narration is currently playing for this waypoint
  const isNarratingThis = isSpeaking || isPaused || Boolean(currentSubtitle);

  return (
    <div className="pointer-events-auto fixed top-16 sm:top-auto sm:bottom-20 left-1/2 -translate-x-1/2 z-30 w-[calc(100vw-1rem)] sm:w-full max-w-3xl px-2 sm:px-3 animate-in fade-in slide-in-from-top-3 sm:slide-in-from-bottom-4 duration-300">
      <div className="glass-panel rounded-2xl p-3 sm:p-5 border border-sky-400/80 bg-slate-950/95 shadow-2xl backdrop-blur-xl flex flex-col md:flex-row gap-3 sm:gap-5 items-stretch md:items-center max-h-[48vh] sm:max-h-none overflow-y-auto custom-scrollbar">
        {/* LEFT SIDE: AUTHENTIC NASA PHOTO (Clear & Prominent) */}
        <div className="w-full md:w-5/12 shrink-0">
          <div className="relative rounded-xl overflow-hidden bg-black border border-sky-500/30 shadow-lg aspect-[16/9] sm:aspect-[4/3] max-h-36 sm:max-h-none flex items-center justify-center">
            <img
              src={activeWaypoint.imageUrl}
              alt={activeWaypoint.name}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.includes('as11-40-5927')) {
                  target.src = 'https://images-assets.nasa.gov/image/as11-40-5927/as11-40-5927~medium.jpg';
                }
              }}
            />
            <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 px-1.5 sm:px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[8px] sm:text-[9px] font-mono-tech text-sky-300 border border-sky-400/30 font-bold">
              NASA ARCHIVE
            </div>
            <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 px-1.5 sm:px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[8px] sm:text-[9px] font-mono-tech text-emerald-300 border border-emerald-500/30">
              Landed {activeWaypoint.landingYear}
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: DETAILED STORY & SYNCHRONIZED NARRATION */}
        <div className="w-full md:w-7/12 flex flex-col justify-between space-y-2.5">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-sky-500/20 pb-2">
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono-tech uppercase font-bold tracking-wider text-sky-400 flex items-center gap-1">
                  <Bot className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                  PROXIMITY DETECTED ({nearestDistance}M)
                </span>
                <span className="text-[9px] font-mono-tech text-slate-400">
                  &bull; {activeWaypoint.agency}
                </span>
              </div>
              <h3 className="font-tech text-sm sm:text-base font-bold text-white tracking-wide">
                {activeWaypoint.name}
              </h3>
              <p className="text-[10px] font-mono-tech text-slate-400">
                {activeWaypoint.sublabel}
              </p>
            </div>

            {/* Audio & Dismiss Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  if (isPaused) speechNarrationService.resume();
                  else speechNarrationService.pause();
                }}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                title={isPaused ? 'Resume Spoken Narration' : 'Pause Spoken Narration'}
              >
                {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={() => speechNarrationService.replay()}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Replay Audio"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => speechNarrationService.toggleMute()}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isMuted
                    ? 'bg-rose-950/80 border-rose-500/50 text-rose-300'
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-sky-400" />}
              </button>

              <button
                onClick={() => {
                  speechNarrationService.stop();
                  if (activeWaypoint) setDismissedId(activeWaypoint.id);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Dismiss Card"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Description & Live Speech Subtitles */}
          <div className="bg-slate-900/80 rounded-xl p-2.5 border border-slate-800 space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
            <p className="text-xs text-slate-100 font-sans leading-relaxed tracking-wide">
              {currentSubtitle || activeWaypoint.description}
            </p>
            {activeWaypoint.historicalContext && (
              <p className="text-[11px] text-amber-200/90 font-sans italic border-l-2 border-amber-400/50 pl-2 mt-1">
                &ldquo;{activeWaypoint.historicalContext}&rdquo;
              </p>
            )}
          </div>

          {/* Audio Progress Bar */}
          {isNarratingThis && (
            <div className="bg-slate-800 h-1 rounded-full overflow-hidden w-full">
              <div
                className="bg-sky-400 h-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Footer Info */}
          <div className="flex items-center justify-between text-[10px] font-mono-tech text-slate-400 pt-0.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-sky-400" />
              <span className="text-sky-300 truncate max-w-[200px]">{activeWaypoint.realCoordinatesText}</span>
            </span>
            <span className="text-emerald-400 flex items-center gap-1 font-semibold">
              &bull; Proximity Inspection Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
