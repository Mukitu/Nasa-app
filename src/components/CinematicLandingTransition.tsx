import React, { useEffect, useState } from 'react';
import { LaunchTarget, MissionFlowState } from '../types/simulation';
import {
  Rocket,
  ShieldCheck,
  CheckCircle2,
  Gauge,
  Navigation,
  Compass,
  ArrowRight,
  Flame,
  Radio,
  RotateCcw,
} from 'lucide-react';
import { aerospaceAudio } from '../utils/audio';

interface CinematicLandingTransitionProps {
  target: LaunchTarget;
  onComplete: () => void;
  onSkip?: () => void;
  onRetry?: () => void;
}

export const CinematicLandingTransition: React.FC<CinematicLandingTransitionProps> = ({
  target,
  onComplete,
  onSkip,
  onRetry,
}) => {
  const [stage, setStage] = useState<'approach' | 'descent' | 'init' | 'complete'>('approach');
  const [altitudeMeters, setAltitudeMeters] = useState(3800);
  const [velocityKmh, setVelocityKmh] = useState(1280);
  const [systemsVerified, setSystemsVerified] = useState<string[]>([]);

  const isMoon = target === 'lunar_transit';
  const destinationName = isMoon ? 'MOON • MARE TRANQUILLITATIS' : 'MARS • JEZERO CRATER';

  useEffect(() => {
    // 1. Stage: Approach (0 to 2.8s)
    const tApproach = setTimeout(() => {
      setStage('descent');
      aerospaceAudio.playBeep(980, 0.08);
    }, 2800);

    // 2. Stage: Descent (2.8s to 6.2s)
    const tDescent = setTimeout(() => {
      setStage('init');
      aerospaceAudio.playBeep(1200, 0.1);
    }, 6200);

    // 3. Stage: Rover Initialization (6.2s to 8.4s)
    const tInit1 = setTimeout(() => {
      setSystemsVerified((prev) => [...prev, 'Umbilical Decoupled']);
    }, 6700);

    const tInit2 = setTimeout(() => {
      setSystemsVerified((prev) => [...prev, 'Rocker-Bogie Mobility Unpinned']);
    }, 7200);

    const tInit3 = setTimeout(() => {
      setSystemsVerified((prev) => [...prev, 'Mast-Cam Telemetry Online']);
      aerospaceAudio.playWaypointDiscovered();
    }, 7800);

    // 4. Complete -> Activate Drive Mode Automatically!
    const tComplete = setTimeout(() => {
      setStage('complete');
      onComplete();
    }, 8500);

    return () => {
      clearTimeout(tApproach);
      clearTimeout(tDescent);
      clearTimeout(tInit1);
      clearTimeout(tInit2);
      clearTimeout(tInit3);
      clearTimeout(tComplete);
    };
  }, [onComplete]);

  // Space / Enter keyboard shortcut to Drive Rover Now
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onSkip?.();
        onComplete();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onSkip, onComplete]);

  // Altimeter tick-down during descent
  useEffect(() => {
    if (stage === 'descent') {
      const interval = setInterval(() => {
        setAltitudeMeters((prev) => {
          if (prev <= 20) return 0;
          return Math.max(0, prev - 180);
        });
        setVelocityKmh((prev) => {
          if (prev <= 10) return 0;
          return Math.max(0, prev - 65);
        });
      }, 150);
      return () => clearInterval(interval);
    } else if (stage === 'init' || stage === 'complete') {
      setAltitudeMeters(0);
      setVelocityKmh(0);
    }
  }, [stage]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-2xl select-none animate-in fade-in duration-500">
      {/* Background Starfield and Atmospheric Horizon Gradient */}
      <div
        className={`absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-1000 ${
          isMoon
            ? 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800/40 via-[#030712] to-black'
            : 'bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/40 via-[#180805] to-black'
        }`}
      />

      <div className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 border border-sky-400/50 shadow-[0_0_60px_rgba(56,189,248,0.2)] bg-[#050914]/90 space-y-6">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between border-b border-sky-500/20 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isMoon ? 'bg-sky-500/20 text-sky-400 border border-sky-400/40' : 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
              }`}
            >
              <Rocket className="w-5 h-5 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] font-mono-tech uppercase tracking-widest text-slate-400 block">
                Continuous Mission Sequence &bull; Phase Transition
              </span>
              <h2 className="font-tech text-base sm:text-xl font-bold text-white tracking-wider">
                {stage === 'approach' && 'ORBITAL RETRO-BURN &amp; DESTINATION APPROACH'}
                {stage === 'descent' && 'TERMINAL DESCENT PROTOCOL ENGAGED'}
                {(stage === 'init' || stage === 'complete') && 'TOUCHDOWN CONFIRMED &bull; ROVER INITIALIZATION'}
              </h2>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono-tech text-sky-400 font-bold block uppercase">
              TARGET SITE
            </span>
            <span className="font-tech text-xs sm:text-sm font-semibold text-slate-200">
              {destinationName}
            </span>
          </div>
        </div>

        {/* Real-Time Descent Telemetry Deck */}
        <div className="grid grid-cols-3 gap-3 font-mono-tech text-center">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Radar Altitude</span>
            <span className="text-lg sm:text-2xl font-bold text-sky-300 tabular-nums">
              {altitudeMeters.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">m</span>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Descent Velocity</span>
            <span className="text-lg sm:text-2xl font-bold text-amber-300 tabular-nums">
              {velocityKmh}{' '}
              <span className="text-xs font-normal text-slate-400">km/h</span>
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] text-slate-400 block uppercase">Guidance Lock</span>
            <span className="text-lg sm:text-2xl font-bold text-emerald-400">
              {altitudeMeters === 0 ? 'TOUCHDOWN' : 'NOMINAL'}
            </span>
          </div>
        </div>

        {/* Cinematic Visual Stage Display */}
        <div className="relative h-32 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex flex-col items-center justify-center p-4">
          {stage === 'approach' && (
            <div className="flex flex-col items-center gap-2 text-center animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-sky-400 font-tech font-bold text-sm tracking-widest uppercase">
                <Radio className="w-4 h-4 animate-ping" />
                <span>Interplanetary Transit Complete &bull; Orbital Deceleration</span>
              </div>
              <p className="text-xs text-slate-400 font-sans max-w-md">
                Spacecraft orienting heat shield and retro-thrusters for entry trajectory toward {destinationName}.
              </p>
            </div>
          )}

          {stage === 'descent' && (
            <div className="flex flex-col items-center gap-2 text-center animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-amber-400 font-tech font-bold text-sm tracking-widest uppercase">
                <Flame className="w-4 h-4 animate-bounce" />
                <span>Descent Thrusters Firing &bull; Terrain Hazard Radar Active</span>
              </div>
              <p className="text-xs text-slate-400 font-sans max-w-md">
                Terminal guidance system scanning surface slope and boulder density for safe landing contact.
              </p>
            </div>
          )}

          {(stage === 'init' || stage === 'complete') && (
            <div className="flex flex-col items-center gap-2 text-center animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-emerald-400 font-tech font-bold text-sm tracking-widest uppercase">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Surface Landing Confirmed &bull; Drive Mode Activating</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono-tech text-slate-300 pt-1">
                {systemsVerified.map((sys) => (
                  <span
                    key={sys}
                    className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300"
                  >
                    &bull; {sys}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions & Skip/Recovery Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-mono-tech text-xs text-slate-400">
              Automatic transition to surface drive mode in progress...
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 text-xs font-tech text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1.5"
                title="Retry landing sequence"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}

            <button
              onClick={() => {
                onSkip?.();
                onComplete();
              }}
              className="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 shadow-md active:scale-95"
            >
              <span>Drive Rover Now [Space]</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
