import React, { useEffect, useState } from 'react';
import { MissionPhase, LaunchTarget } from '../types/simulation';
import { Database } from 'lucide-react';

interface TelemetryRibbonProps {
  missionPhase: MissionPhase;
  target: LaunchTarget;
  nasaConnected: boolean;
  onOpenNasaArchive: () => void;
}

export const TelemetryRibbon: React.FC<TelemetryRibbonProps> = ({
  missionPhase,
  target,
  nasaConnected,
  onOpenNasaArchive,
}) => {
  const [metSeconds, setMetSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMetSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatMET = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `T+${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getTargetLabel = () => {
    switch (target) {
      case 'lunar_transit':
        return 'LUNAR TRANSIT';
      case 'mars_transfer':
        return 'MARS TRANSFER';
      default:
        return 'PENDING SELECTION';
    }
  };

  const getSpacecraftStatus = () => {
    switch (missionPhase) {
      case 'STANDBY':
        return 'READY FOR PRE-LAUNCH';
      case 'PRE_LAUNCH_CHECKLIST':
        return 'SYSTEMS VERIFICATION';
      case 'COUNTDOWN':
        return 'TERMINAL COUNTDOWN';
      case 'IGNITION':
        return 'MAIN ENGINE IGNITION';
      case 'LIFTOFF':
        return 'LIFTOFF CONFIRMED';
      case 'ASCENT':
        return 'POWERED ATMOSPHERIC FLIGHT';
      case 'MAX_Q':
        return 'MAX DYNAMIC PRESSURE';
      case 'STAGE_SEPARATION':
        return 'BOOSTER SEPARATION';
      case 'ORBIT_INSERTION':
        return 'ORBIT INSERTION';
      case 'TRANSIT_FLIGHT':
        return 'DEEP SPACE INTERPLANETARY TRANSIT';
      case 'DESTINATION_ARRIVED':
        return 'DESTINATION REACHED — PARKED';
      case 'ABORTED':
        return 'HOLD / MISSION ABORTED';
      default:
        return 'READY FOR PRE-LAUNCH';
    }
  };

  return (
    <div className="relative z-10 w-full px-6 py-2 bg-[#080d1a]/95 border-b border-sky-500/10 text-xs font-mono-tech flex flex-wrap items-center justify-between gap-y-2 gap-x-6">
      {/* Telemetry Metrics Strip */}
      <div className="flex items-center flex-wrap gap-x-6 gap-y-1 text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase tracking-wider text-[11px]">Mission:</span>
          <span className="font-semibold text-sky-400 tracking-wide uppercase">
            {missionPhase}
          </span>
        </div>

        <span className="hidden sm:inline text-slate-700" aria-hidden="true">|</span>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase tracking-wider text-[11px]">Spacecraft:</span>
          <span className="text-slate-200">
            {getSpacecraftStatus()}
          </span>
        </div>

        <span className="hidden md:inline text-slate-700" aria-hidden="true">|</span>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase tracking-wider text-[11px]">Target:</span>
          <span className="text-slate-200 font-medium">
            {getTargetLabel()}
          </span>
        </div>

        <span className="hidden lg:inline text-slate-700" aria-hidden="true">|</span>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase tracking-wider text-[11px]">Simulation:</span>
          <span className="text-emerald-400 font-medium">
            INITIALIZED
          </span>
          <span className="text-slate-500 tabular-nums">
            ({formatMET(metSeconds)})
          </span>
        </div>
      </div>

      {/* Honest Data Connection Status */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-slate-500 uppercase tracking-wider text-[11px]">Data Connection:</span>
        <button
          onClick={onOpenNasaArchive}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
            nasaConnected
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
              : 'bg-sky-500/15 text-sky-400 border-sky-500/30 hover:bg-sky-500/25'
          }`}
          title="Click to view NASA Open Data integration panel"
        >
          <Database className="w-3 h-3" />
          <span>{nasaConnected ? 'NASA CONNECTED' : 'NASA DATA (CONFIGURED)'}</span>
        </button>
      </div>
    </div>
  );
};
