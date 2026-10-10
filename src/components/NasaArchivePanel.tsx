import React, { useState } from 'react';
import { NASA_ENDPOINTS, nasaService } from '../services/nasaApi';
import { NASADataServiceStatus } from '../types/simulation';
import { Database, RefreshCw, ShieldAlert, CheckCircle, ExternalLink, Lock } from 'lucide-react';

interface NasaArchivePanelProps {
  onClose: () => void;
}

export const NasaArchivePanel: React.FC<NasaArchivePanelProps> = ({ onClose }) => {
  const [status, setStatus] = useState<NASADataServiceStatus>(nasaService.getStatus());
  const [probing, setProbing] = useState(false);

  const handleTestConnection = async () => {
    setProbing(true);
    const result = await nasaService.probeConnection();
    setStatus(result);
    setProbing(false);
  };

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="w-full max-w-2xl glass-panel rounded-xl shadow-2xl p-6 border border-sky-500/25 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-sky-500/20 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-sm bg-amber-500/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-tech text-lg font-bold text-slate-100 tracking-wider">
                OFFICIAL NASA DATA INTEGRATION ARCHITECTURE
              </h2>
              <span className="text-xs font-mono-tech text-amber-400">
                Phase 1 Service Audit & Endpoint Registry
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

        {/* Current Truthful Status Banner */}
        <div className="p-4 rounded bg-slate-900/80 border border-amber-500/30 mb-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-tech text-sm font-bold text-amber-300">
                    STATUS: NASA DATA NOT CONFIGURED
                  </span>
                  <span className="text-[10px] font-mono-tech uppercase px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 border border-amber-500/30">
                    Phase 1 Baseline
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  {status.message}
                </p>
                {status.lastChecked && (
                  <span className="text-[10px] font-mono-tech text-slate-500 block mt-1">
                    Last Verified: {new Date(status.lastChecked).toLocaleTimeString()}
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={handleTestConnection}
              disabled={probing}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-tech text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${probing ? 'animate-spin text-sky-400' : ''}`} />
              <span>{probing ? 'Probing...' : 'Audit Connection'}</span>
            </button>
          </div>
        </div>

        {/* Official Endpoints Target Map */}
        <div className="space-y-3 mb-5">
          <h3 className="font-tech text-xs font-bold uppercase tracking-wider text-slate-300">
            Target Public NASA Endpoints (Staged for Phase 2)
          </h3>

          <div className="space-y-2">
            {NASA_ENDPOINTS.map((ep) => (
              <div
                key={ep.id}
                className="p-3 rounded bg-slate-900/50 border border-slate-800 text-xs font-mono-tech"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sky-300 font-semibold">{ep.name}</span>
                  <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
                    {ep.phaseTarget}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 break-all mb-1 font-mono">
                  {ep.baseUrl}
                </div>
                <p className="text-[11px] text-slate-400 font-sans">
                  {ep.purpose}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Developer Key Protocol */}
        <div className="p-3.5 rounded bg-sky-950/20 border border-sky-500/20 text-xs text-slate-300 space-y-1.5">
          <div className="flex items-center gap-1.5 text-sky-400 font-tech font-bold text-xs uppercase tracking-wide">
            <Lock className="w-3.5 h-3.5" />
            <span>Developer Key Security Policy</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-300">
            Visitors are never required to supply their own API keys. In Phase 2, backend proxy endpoints will inject server-configured NASA developer keys, ensuring credentials remain secure without exposing secret tokens to the client.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-tech font-semibold uppercase text-slate-900 bg-sky-400 hover:bg-sky-300 rounded transition-colors cursor-pointer"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
};
