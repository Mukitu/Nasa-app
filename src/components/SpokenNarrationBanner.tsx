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
  ExternalLink,
} from 'lucide-react';

interface SpokenNarrationBannerProps {
  onInspectWaypoint: (waypoint: SurfaceWaypoint) => void;
}

export const SpokenNarrationBanner: React.FC<SpokenNarrationBannerProps> = ({
  onInspectWaypoint,
}) => {
  const [narrationState, setNarrationState] = useState<SpeechNarrationState>(
    speechNarrationService.getState()
  );

  useEffect(() => {
    return speechNarrationService.subscribe((s) => setNarrationState(s));
  }, []);

  const { isSpeaking, isPaused, isMuted, currentWaypoint, currentSubtitle, progressPercent } =
    narrationState;

  if (!currentWaypoint || (!isSpeaking && !isPaused && !currentSubtitle)) {
    return null;
  }

  return (
    <div className="pointer-events-auto fixed bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 w-full max-w-2xl px-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="glass-panel rounded-2xl p-3 sm:p-4 border border-emerald-400/80 bg-slate-950/95 shadow-2xl backdrop-blur-xl space-y-2.5">
        {/* Top Header Strip */}
        <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono-tech uppercase font-bold tracking-wider text-emerald-300">
                  MISSION NARRATOR &bull; SPOKEN ARCHIVE
                </span>
                <span className="text-[9px] font-mono-tech px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  Landed {currentWaypoint.landingYear}
                </span>
              </div>
              <h4 className="font-tech text-xs sm:text-sm font-bold text-white tracking-wide truncate max-w-xs sm:max-w-md">
                {currentWaypoint.name}
              </h4>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-1">
            {/* Play/Pause Speech */}
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

            {/* Replay */}
            <button
              onClick={() => speechNarrationService.replay()}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Replay Spoken Story"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Mute Voice */}
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

            {/* Close Banner */}
            <button
              onClick={() => speechNarrationService.stop()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-700 hover:bg-slate-800 transition-colors cursor-pointer"
              title="Dismiss Narration"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Live Synchronized Subtitles Display */}
        <div className="relative min-h-[2.8rem] flex items-center justify-between gap-3 bg-slate-900/60 rounded-xl p-2.5 border border-slate-800">
          <div className="flex-1">
            <p className="text-xs sm:text-sm text-slate-100 font-sans leading-relaxed tracking-wide animate-in fade-in duration-200">
              "{currentSubtitle || currentWaypoint.description}"
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

        {/* Timeline Progress Bar & Inspect CTA */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          {/* Subtle Progress Bar */}
          <div className="flex-1 bg-slate-800 h-1 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onInspectWaypoint(currentWaypoint)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-tech font-bold uppercase tracking-wider bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
            >
              <Search className="w-3 h-3" />
              <span>Inspect NASA Photo &amp; Archive</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
