import React from 'react';
import { Compass, Move, MousePointer, ShieldAlert, ArrowRight, Eye } from 'lucide-react';

interface SurfaceControlGuideModalProps {
  environment: 'moon' | 'mars';
  onContinue: () => void;
}

export const SurfaceControlGuideModal: React.FC<SurfaceControlGuideModalProps> = ({
  environment,
  onContinue,
}) => {
  const isMoon = environment === 'moon';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl glass-panel rounded-2xl border border-sky-400/40 shadow-2xl overflow-hidden bg-[#060a14] p-5 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-sky-500/20 pb-4">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-mono-tech uppercase text-sky-400 font-bold tracking-widest block">
              SURFACE LANDING CONFIRMED &bull; USER GUIDE
            </span>
            <h2 className="font-tech text-base sm:text-lg font-bold text-white tracking-wide">
              {isMoon ? 'LUNAR SURFACE EXPLORER GUIDE' : 'MARTIAN SURFACE EXPLORER GUIDE'}
            </h2>
          </div>
        </div>

        {/* Short Mission Intro */}
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          Touchdown sequence completed successfully. Use the keyboard and mouse navigation controls below to explore historic 3D hardware artifacts and data waypoints.
        </p>

        {/* Keyboard & Mouse Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono-tech">
          {/* Drive */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <Move className="w-4 h-4" />
              <span>Drive &amp; Steer Rover</span>
            </div>
            <div className="text-[11px] text-slate-300">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300 font-bold">W A S D</span> or <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300 font-bold">&uarr; &larr; &darr; &rarr;</span>
            </div>
            <p className="text-[10px] text-slate-400">Drive the rover across terrain in any direction.</p>
          </div>

          {/* Camera Look */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-sky-400 font-bold">
              <MousePointer className="w-4 h-4" />
              <span>360° Camera View</span>
            </div>
            <div className="text-[11px] text-slate-300">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300 font-bold">Mouse Drag</span>
            </div>
            <p className="text-[10px] text-slate-400">Pan camera around the horizon and sky.</p>
          </div>

          {/* Brakes */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Emergency Brakes</span>
            </div>
            <div className="text-[11px] text-slate-300">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-300 font-bold">SPACEBAR</span>
            </div>
            <p className="text-[10px] text-slate-400">Stop the rover immediately.</p>
          </div>

          {/* Auto-Discovery Proximity */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Auto-Discovery Proximity</span>
            </div>
            <div className="text-[11px] text-slate-300">
              <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-300 font-bold">Approach Landmark</span>
            </div>
            <p className="text-[10px] text-slate-400">Drive near any landmark to automatically view photos and details beside your screen.</p>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-end">
          <button
            onClick={onContinue}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-sky-400 hover:bg-sky-300 text-slate-950 font-tech font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95"
          >
            <span>CONTINUE EXPLORATION</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
