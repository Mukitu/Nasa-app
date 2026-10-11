import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { LaunchTarget } from '../types/simulation';
import {
  Rocket,
  ShieldCheck,
  CheckCircle2,
  Gauge,
  ArrowRight,
  Flame,
  Radio,
  RotateCcw,
  Compass,
} from 'lucide-react';
import { aerospaceAudio } from '../utils/audio';
import {
  createSpacecraftTileTexture,
  createSolarPanelTexture,
  createMissionMarkingsTexture,
  createMarsParachuteTexture,
  createMoonTexture,
  createMarsTexture,
} from '../three/textures';

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
  const mountRef = useRef<HTMLDivElement>(null);
  const autoDriveTriggeredRef = useRef<boolean>(false);
  const [stage, setStage] = useState<'orbit_approach' | 'decoupling' | 'descent_brake' | 'touchdown' | 'rover_deploy' | 'ready'>('orbit_approach');
  const [altitudeMeters, setAltitudeMeters] = useState(4500);
  const [velocityKmh, setVelocityKmh] = useState(1850);
  const [systemsVerified, setSystemsVerified] = useState<string[]>([]);

  const isMoon = target === 'lunar_transit';
  const destinationName = isMoon ? 'MOON • MARE TRANQUILLITATIS' : 'MARS • JEZERO CRATER';

  // HUD Telemetry Synchronizer for live SurfaceExplorerScene 3D landing
  useEffect(() => {
    const startTime = performance.now();
    let animId: number;

    const tick = () => {
      const elapsed = (performance.now() - startTime) / 1000;

      if (elapsed < 3.0) {
        setStage('orbit_approach');
        setAltitudeMeters(Math.round(4500 - elapsed * 1000));
        setVelocityKmh(Math.round(1850 - elapsed * 200));
      } else if (elapsed < 6.5) {
        setStage('descent_brake');
        const descProgress = (elapsed - 3.0) / 3.5;
        setAltitudeMeters(Math.max(0, Math.round(1500 * (1 - descProgress))));
        setVelocityKmh(Math.round(1250 * (1 - descProgress)));
      } else if (elapsed < 9.0) {
        setStage('touchdown');
        setAltitudeMeters(0);
        setVelocityKmh(0);
      } else {
        setStage('ready');
        setAltitudeMeters(0);
        setVelocityKmh(0);

        if (elapsed >= 9.2 && !autoDriveTriggeredRef.current) {
          autoDriveTriggeredRef.current = true;
          onComplete();
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [onComplete]);

  // Audio & Systems Verification Timers
  useEffect(() => {
    const t1 = setTimeout(() => {
      setSystemsVerified((prev) => [...prev, 'Umbilical Decoupled']);
      aerospaceAudio.playBeep(980, 0.06);
    }, 2800);

    const t2 = setTimeout(() => {
      setSystemsVerified((prev) => [
        ...prev,
        isMoon ? 'Quad Retro-Thruster Ignition' : 'SuperSonic Parachute Deployed',
      ]);
      aerospaceAudio.playBeep(1100, 0.08);
    }, 6200);

    const t3 = setTimeout(() => {
      setSystemsVerified((prev) => [...prev, 'Touchdown Confirmed']);
      aerospaceAudio.playWaypointDiscovered();
    }, 9200);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [isMoon]);

  // Spacebar / Enter keyboard shortcut
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-6 pointer-events-none select-none bg-gradient-to-b from-slate-950/70 via-transparent to-slate-950/80 animate-in fade-in duration-300">
      {/* Top Header & Real-Time Descent Telemetry Ribbon */}
      <div className="relative z-10 w-full max-w-5xl mx-auto glass-panel rounded-2xl p-4 border border-sky-400/40 bg-[#050914]/85 shadow-2xl space-y-3 pointer-events-auto">
        <div className="flex items-center justify-between border-b border-sky-500/20 pb-2.5">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isMoon
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-400/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-400/40'
              }`}
            >
              <Rocket className="w-5 h-5 animate-pulse" />
            </div>

            <div>
              <span className="text-[10px] font-mono-tech uppercase tracking-widest text-slate-400 block">
                Continuous Mission Sequence &bull; Real-Time WebGL Landing
              </span>
              <h2 className="font-tech text-sm sm:text-base font-bold text-white tracking-wider">
                {stage === 'orbit_approach' && 'ORBITAL DECOUPLING & ENTRY SEQUENCE'}
                {stage === 'descent_brake' &&
                  (isMoon ? 'MOON PARACHUTE & RETRO-THRUST DESCENT' : 'MARS PARACHUTE & RETRO-THRUST DESCENT')}
                {(stage === 'touchdown' || stage === 'rover_deploy' || stage === 'ready') &&
                  'SURFACE TOUCHDOWN CONFIRMED • ROVER ROLLOUT'}
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

        {/* Telemetry Grid */}
        <div className="grid grid-cols-3 gap-2 font-mono-tech text-center">
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[9px] text-slate-400 block uppercase">Radar Altitude</span>
            <span className="text-base sm:text-xl font-bold text-sky-300 tabular-nums">
              {altitudeMeters.toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">m</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[9px] text-slate-400 block uppercase">Descent Speed</span>
            <span className="text-base sm:text-xl font-bold text-amber-300 tabular-nums">
              {velocityKmh}{' '}
              <span className="text-xs font-normal text-slate-400">km/h</span>
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="text-[9px] text-slate-400 block uppercase">Landing Method</span>
            <span className="text-xs sm:text-sm font-bold text-emerald-400">
              {isMoon ? 'POWERED LUNAR RETRO' : 'PARACHUTE + SKY-CRANE'}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Action Card & Confirmation Status */}
      <div className="relative z-10 w-full max-w-5xl mx-auto glass-panel rounded-2xl p-4 border border-sky-400/40 bg-[#050914]/90 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-auto">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
            <h3 className="font-tech text-sm sm:text-base font-bold text-emerald-300 tracking-wide uppercase">
              {stage === 'ready' ? 'LANDING CONFIRMED • ROVER DEPLOYMENT COMPLETE' : 'DESCENT IN PROGRESS'}
            </h3>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 text-[10px] font-mono-tech text-slate-300">
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

        <div className="flex items-center gap-2 shrink-0">
          {onRetry && (
            <button
              onClick={onRetry}
              className="px-3 py-2 rounded-xl border border-slate-800 hover:border-slate-700 text-xs font-tech text-slate-400 hover:text-slate-200 cursor-pointer flex items-center gap-1.5"
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
            className="px-5 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-tech font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 shadow-lg active:scale-95"
          >
            <span>Drive Rover Now [Space]</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
