import React from 'react';
import { GraphicsQuality, SimulationSettings } from '../types/simulation';
import { Sliders, Sparkles, Monitor, FastForward, Volume2, VolumeX, Eye, Check } from 'lucide-react';

interface SettingsModalProps {
  settings: SimulationSettings;
  onUpdateSettings: (newSettings: Partial<SimulationSettings>) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-lg glass-panel rounded-xl shadow-2xl p-6 border border-sky-500/25 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-sm bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-tech text-base font-bold text-slate-100 tracking-wider">
                SIMULATION CONFIGURATION
              </h2>
              <span className="text-xs font-mono-tech text-sky-400">
                Graphics Fidelity & Simulation Rates
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-mono-tech text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close ✕
          </button>
        </div>

        <div className="space-y-5 text-xs font-mono-tech">
          {/* Graphics Quality */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5 uppercase text-[11px] tracking-wider">
              Graphics Shading & Particle Fidelity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                <button
                  key={q}
                  onClick={() => onUpdateSettings({ graphicsQuality: q })}
                  className={`p-2.5 rounded border text-center uppercase transition-all cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-sky-500/25 border-sky-400 text-sky-300 font-bold shadow-xs'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="block font-tech text-xs">{q}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {q === 'high' ? 'Full Atmosphere' : q === 'medium' ? 'Optimized' : 'Minimal'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Orbit Dynamics Speed */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-slate-300 font-semibold uppercase text-[11px] tracking-wider">
                Orbital Time Dilation Multiplier
              </label>
              <span className="text-sky-400 font-bold tabular-nums">
                {settings.orbitSpeedMultiplier}x Real-time
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[0.5, 1.0, 2.5, 5.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onUpdateSettings({ orbitSpeedMultiplier: spd })}
                  className={`py-1.5 rounded border text-center transition-all cursor-pointer ${
                    settings.orbitSpeedMultiplier === spd
                      ? 'bg-sky-500/25 border-sky-400 text-sky-300 font-bold'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-slate-800">
              <span className="text-slate-300">Reduced Motion Mode (Comfort)</span>
              <button
                onClick={() => onUpdateSettings({ reducedMotion: !settings.reducedMotion })}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  settings.reducedMotion ? 'bg-sky-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                    settings.reducedMotion ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-slate-900/40 border border-slate-800">
              <span className="text-slate-300">Auditory Feedback Chimes</span>
              <button
                onClick={() => onUpdateSettings({ soundEffects: !settings.soundEffects })}
                className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                  settings.soundEffects ? 'bg-sky-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                    settings.soundEffects ? 'translate-x-5' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-tech font-bold uppercase tracking-wider text-slate-950 bg-sky-400 hover:bg-sky-300 rounded transition-colors cursor-pointer"
          >
            Apply & Return
          </button>
        </div>
      </div>
    </div>
  );
};
