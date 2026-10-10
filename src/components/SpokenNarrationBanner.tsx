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
  Search,
  Radio,
  Compass,
} from 'lucide-react';

interface SpokenNarrationBannerProps {
  onInspectWaypoint: (waypoint: SurfaceWaypoint) => void;
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

  const { isSpeaking, isPaused, isMuted, currentWaypoint, currentSubtitle, progressPercent } =
    narrationState;

  // Auto-clear dismissal lock and stop speech when moving away (>12m)
  useEffect(() => {
    if (nearestDistance !== undefined && nearestDistance > 12) {
      speechNarrationService.stop();
    }
    if (nearestDistance !== undefined && nearestDistance > 18) {
      if (dismissedId) {
        setDismissedId(null);
      }
    }
  }, [nearestDistance, dismissedId]);

  // Determine active waypoint: ONLY display when rover is nearby (within 12m)
  const isNearby = Boolean(nearestAnomaly && nearestDistance !== undefined && nearestDistance <= 12);
  const activeWaypoint = isNearby ? nearestAnomaly : null;

  if (!activeWaypoint || activeWaypoint.id === dismissedId) {
    return null;
  }

  // Check if speech narration is currently playing for this waypoint
  const isNarratingThis = isSpeaking || isPaused || currentSubtitle;

  return (
    <div className="pointer-events-auto fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 w-full max-w-xl px-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="glass-panel rounded-2xl p-3.5 sm:p-4 border border-emerald-400/80 bg-slate-950/95 shadow-2xl backdrop-blur-xl space-y-2.5">
        {/* Top Header Strip */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shrink-0">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono-tech uppercase font-bold tracking-wider text-emerald-300">
                  {isNearby ? `HISTORICAL EQUIPMENT DETECTED (${nearestDistance}M)` : 'MISSION NARRATOR • SPOKEN ARCHIVE'}
                </span>
                <span className="text-[9px] font-mono-tech px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  Landed {activeWaypoint.landingYear}
                </span>
              </div>
              <h4 className="font-tech text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-xs sm:max-w-md">
                {activeWaypoint.name}
              </h4>
            </div>
          </div>

          {/* Narration & Sound Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {isNarratingThis && (
              <>
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
                  title="Replay Spoken Story"
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
                  title={isMuted ? 'Unmute Voice Narration' : 'Mute Voice Narration'}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              </>
            )}

            <button
              onClick={() => {
                speechNarrationService.stop();
                if (activeWaypoint) {
                  setDismissedId(activeWaypoint.id);
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Dismiss Panel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Synchronized Subtitles & Description Display */}
        <div className="relative min-h-[2.8rem] flex items-center justify-between gap-3 bg-slate-900/70 rounded-xl p-2.5 border border-slate-800">
          <div className="flex-1">
            <p className="text-xs text-slate-100 font-sans leading-relaxed tracking-wide animate-in fade-in duration-200">
              "{currentSubtitle || activeWaypoint.description}"
            </p>
          </div>

          {/* Animated Waveform Equalizer when speaking */}
          {isSpeaking && !isPaused && !isMuted && (
            <div className="shrink-0 flex items-end gap-0.5 h-4 px-1" title="Voice audio playing aloud">
              <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_ease-in-out_infinite] h-3" />
              <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.8s_ease-in-out_infinite] h-4" />
              <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.5s_ease-in-out_infinite] h-2" />
              <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.9s_ease-in-out_infinite] h-3.5" />
            </div>
          )}
        </div>

        {/* Audio Progress Bar (When Narrating) */}
        {isNarratingThis && (
          <div className="bg-slate-800 h-1 rounded-full overflow-hidden w-full">
            <div
              className="bg-emerald-400 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Coordinates & Primary Inspection Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-0.5">
          <div className="text-[10px] font-mono-tech text-slate-400">
            Authentic NASA Coordinates:{' '}
            <span className="text-emerald-300 font-semibold">{activeWaypoint.realCoordinatesText}</span>
          </div>

          <button
            onClick={() => onInspectWaypoint(activeWaypoint)}
            className="px-3.5 py-1.5 rounded-lg text-xs font-tech font-bold uppercase tracking-wider bg-emerald-400 hover:bg-emerald-300 text-slate-950 transition-all cursor-pointer shadow-lg active:scale-95 flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Inspect NASA Photo &amp; Archive [Press E]</span>
          </button>
        </div>
      </div>
    </div>
  );
};
