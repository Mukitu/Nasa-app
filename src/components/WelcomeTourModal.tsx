import React, { useState } from 'react';
import { Compass, Rocket, Orbit, Eye, Info, Check, ArrowRight } from 'lucide-react';

interface WelcomeTourModalProps {
  onStartMission: () => void;
  onExploreSolarSystem: () => void;
  onClose: () => void;
}

export const WelcomeTourModal: React.FC<WelcomeTourModalProps> = ({
  onStartMission,
  onExploreSolarSystem,
  onClose,
}) => {
  const [step, setStep] = useState<number>(0);

  const steps = [
    {
      title: 'Welcome to Echoes of Space',
      subtitle: 'NASA Space Apps Challenge: Abandoned but not Forgotten',
      content:
        'Step into a futuristic mission operations center and 3D cosmic simulator dedicated to uncovering the artifacts, landers, and rovers resting on the Moon and Mars.',
      icon: <Compass className="w-8 h-8 text-sky-400" />,
    },
    {
      title: 'Interactive 3D Solar System',
      subtitle: 'Navigable Orrery & Celestial Inspector',
      content:
        'Explore the Sun and all 8 major planets with smooth camera choreography, accurate rotational dynamics, and physical telemetry facts.',
      icon: <Orbit className="w-8 h-8 text-sky-400" />,
    },
    {
      title: 'Spacecraft Launch Preparation',
      subtitle: 'Pad 39B Simulated Ascent Corridor',
      content:
        'Select exploration vehicles, complete multi-stage system checklists, and trigger terminal countdown simulations toward lunar and Martian trajectories.',
      icon: <Rocket className="w-8 h-8 text-sky-400" />,
    },
  ];

  const currentStepData = steps[step];

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md pointer-events-auto">
      <div className="w-full max-w-lg glass-panel rounded-xl shadow-2xl p-6 border border-sky-500/30">
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-sky-500/15">
          <span className="text-[11px] font-mono-tech text-sky-400 uppercase tracking-wider">
            OPERATIONS BRIEFING • STEP {step + 1} OF {steps.length}
          </span>
          <button
            onClick={onClose}
            className="text-xs font-mono-tech text-slate-400 hover:text-slate-100 cursor-pointer"
          >
            Skip Briefing ✕
          </button>
        </div>

        {/* Step Visual & Content */}
        <div className="flex items-start gap-4 mb-6">
          <div className="w-14 h-14 rounded-lg bg-sky-500/10 border border-sky-400/30 flex items-center justify-center shrink-0">
            {currentStepData.icon}
          </div>
          <div>
            <h2 className="font-tech text-lg font-bold text-slate-100 tracking-wide">
              {currentStepData.title}
            </h2>
            <p className="text-xs font-mono-tech text-sky-400 mb-2">
              {currentStepData.subtitle}
            </p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {currentStepData.content}
            </p>
          </div>
        </div>

        {/* Quick Keyboard shortcuts cheatsheet */}
        <div className="p-3 rounded bg-slate-900/60 border border-slate-800 text-[11px] font-mono-tech text-slate-400 mb-6">
          <span className="text-slate-300 font-semibold block mb-1">NAVIGATION SHORTCUTS:</span>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <span>• Left Mouse / Touch: Rotate camera</span>
            <span>• Scroll Wheel / Pinch: Zoom</span>
            <span>• Spacebar: Pause orbit physics</span>
            <span>• R Key: Reset camera center</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
          {step < steps.length - 1 ? (
            <>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-tech text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                Skip to Mission
              </button>

              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-tech font-bold uppercase tracking-wider text-slate-950 bg-sky-400 hover:bg-sky-300 rounded transition-colors cursor-pointer"
              >
                <span>Next Section</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="w-full flex flex-col sm:flex-row items-center gap-2">
              <button
                onClick={() => {
                  onExploreSolarSystem();
                  onClose();
                }}
                className="w-full sm:w-1/2 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-tech font-semibold tracking-wider uppercase text-slate-200 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 transition-colors cursor-pointer"
              >
                <Orbit className="w-3.5 h-3.5 text-sky-400" />
                <span>Explore Solar System</span>
              </button>

              <button
                onClick={() => {
                  onStartMission();
                  onClose();
                }}
                className="w-full sm:w-1/2 flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-tech font-bold tracking-wider uppercase text-slate-950 bg-sky-400 hover:bg-sky-300 rounded transition-colors cursor-pointer"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Start Mission</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
