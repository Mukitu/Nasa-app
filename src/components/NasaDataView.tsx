import React, { useState, useEffect } from 'react';
import { nasaService } from '../services/nasaApi';
import { ApodData, NasaImageItem, NASADataServiceStatus } from '../types/simulation';
import {
  Database,
  Search,
  Sparkles,
  ExternalLink,
  RefreshCw,
  Key,
  ShieldCheck,
  AlertCircle,
  Calendar,
  Image as ImageIcon,
  CheckCircle2,
  X,
  Info,
} from 'lucide-react';

interface NasaDataViewProps {
  onClose: () => void;
}

export const NasaDataView: React.FC<NasaDataViewProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'apod' | 'library' | 'config'>('apod');

  // Connection & Key state
  const [status, setStatus] = useState<NASADataServiceStatus>(nasaService.getStatus());
  const [apiKeyInput, setApiKeyInput] = useState(nasaService.getApiKey());
  const [isTestingKey, setIsTestingKey] = useState(false);
  const [keySaveMessage, setKeySaveMessage] = useState<string | null>(null);

  // APOD state
  const [apod, setApod] = useState<ApodData | null>(null);
  const [apodLoading, setApodLoading] = useState(false);
  const [apodError, setApodError] = useState<string | null>(null);

  // Images Search state
  const [searchQuery, setSearchQuery] = useState('Apollo lunar equipment');
  const [images, setImages] = useState<NasaImageItem[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imagesError, setImagesError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<NasaImageItem | null>(null);

  // Initial load
  useEffect(() => {
    loadApod();
    loadImages('Apollo lunar equipment');
  }, []);

  const handleTestKey = async () => {
    setIsTestingKey(true);
    const res = await nasaService.testConnection();
    setStatus(res);
    setIsTestingKey(false);
    if (res.connected) {
      loadApod();
    }
  };

  const handleSaveKey = () => {
    nasaService.setApiKey(apiKeyInput);
    setStatus(nasaService.getStatus());
    setKeySaveMessage('API key updated. Testing connection...');
    handleTestKey();
    setTimeout(() => setKeySaveMessage(null), 3000);
  };

  const handleClearKey = () => {
    nasaService.clearApiKey();
    setApiKeyInput('');
    setStatus(nasaService.getStatus());
  };

  const loadApod = async () => {
    setApodLoading(true);
    setApodError(null);
    try {
      const data = await nasaService.fetchApod();
      setApod(data);
      setStatus(nasaService.getStatus());
    } catch (err: unknown) {
      setApodError(err instanceof Error ? err.message : 'Failed to retrieve NASA APOD record.');
    } finally {
      setApodLoading(false);
    }
  };

  const loadImages = async (query: string) => {
    setImagesLoading(true);
    setImagesError(null);
    try {
      const items = await nasaService.searchNasaImages(query);
      setImages(items);
    } catch (err: unknown) {
      setImagesError(err instanceof Error ? err.message : 'NASA Images search failed.');
    } finally {
      setImagesLoading(false);
    }
  };

  const presets = [
    'Apollo lunar equipment',
    'Mars rover',
    'Mars lander',
    'Surveyor lunar',
    'Perseverance rover',
    'Lunar surface',
  ];

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md pointer-events-auto">
      <div className="w-full max-w-5xl h-[90vh] glass-panel rounded-xl shadow-2xl flex flex-col border border-sky-500/25 overflow-hidden">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-sky-500/20 bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-tech text-base font-bold text-slate-100 tracking-wider">
                  OFFICIAL NASA OPEN DATA
                </h2>
                <span
                  className={`text-[10px] font-mono-tech px-2 py-0.5 rounded border uppercase ${
                    status.connected
                      ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                      : 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                  }`}
                >
                  {status.connected ? 'API VALIDATED' : 'API UNVERIFIED'}
                </span>
              </div>
              <span className="text-[11px] font-mono-tech text-slate-400">
                api.nasa.gov &bull; images-api.nasa.gov
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestKey}
              disabled={isTestingKey}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-tech text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTestingKey ? 'animate-spin text-sky-400' : ''}`} />
              <span>{isTestingKey ? 'Testing...' : 'Test Connection'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-800 bg-[#070b16]/70 text-xs font-tech">
          <button
            onClick={() => setActiveTab('apod')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'apod'
                ? 'bg-sky-500/25 text-sky-300 border border-sky-400/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Astronomy Picture of the Day (APOD)
          </button>

          <button
            onClick={() => setActiveTab('library')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'bg-sky-500/25 text-sky-300 border border-sky-400/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            NASA Image Library Search
          </button>

          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded transition-all cursor-pointer ${
              activeTab === 'config'
                ? 'bg-sky-500/25 text-sky-300 border border-sky-400/40 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            API Key &amp; Diagnostics
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: APOD */}
          {activeTab === 'apod' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-tech text-base font-bold text-slate-100">
                    NASA Astronomy Picture of the Day
                  </h3>
                  <p className="text-xs text-slate-400 font-sans">
                    Official daily record from NASA's astrophysics and planetary observation network.
                  </p>
                </div>

                <button
                  onClick={loadApod}
                  disabled={apodLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-tech text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${apodLoading ? 'animate-spin' : ''}`} />
                  <span>Refresh APOD</span>
                </button>
              </div>

              {apodLoading ? (
                <div className="py-24 text-center">
                  <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-2" />
                  <span className="font-mono-tech text-xs text-slate-400">
                    Querying https://api.nasa.gov/planetary/apod...
                  </span>
                </div>
              ) : apodError ? (
                <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
                  <div className="flex items-center gap-2 font-tech font-bold text-sm text-rose-400 mb-1">
                    <AlertCircle className="w-4 h-4" />
                    <span>NASA API Error</span>
                  </div>
                  <p>{apodError}</p>
                  <button
                    onClick={() => setActiveTab('config')}
                    className="mt-3 px-3 py-1.5 text-xs font-tech text-slate-900 bg-sky-400 rounded hover:bg-sky-300 font-semibold cursor-pointer"
                  >
                    Check NASA API Key Configuration
                  </button>
                </div>
              ) : apod ? (
                <div className="space-y-4">
                  {/* Media Frame */}
                  <div className="relative w-full max-h-[460px] rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                    {apod.media_type === 'video' ? (
                      <iframe
                        src={apod.url}
                        title={apod.title}
                        className="w-full h-96 border-0"
                        allowFullScreen
                      />
                    ) : (
                      <img
                        src={apod.hdurl || apod.url}
                        alt={apod.title}
                        className="w-full h-full object-contain max-h-[460px]"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>

                  {/* Metadata & Narrative */}
                  <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                      <h4 className="font-tech text-base font-bold text-slate-100">
                        {apod.title}
                      </h4>
                      <div className="flex items-center gap-3 text-xs font-mono-tech text-slate-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-sky-400" />
                          <span>{apod.date}</span>
                        </span>
                        {apod.copyright && <span>&copy; {apod.copyright}</span>}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans pt-1">
                      {apod.explanation}
                    </p>

                    <div className="pt-2 flex justify-end">
                      <a
                        href={apod.hdurl || apod.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs font-mono-tech text-sky-400 hover:text-sky-300 hover:underline"
                      >
                        <span>View Full Source Asset on NASA</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 2: NASA Image Library Search */}
          {activeTab === 'library' && (
            <div className="space-y-4">
              {/* Search Bar & Presets */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && loadImages(searchQuery)}
                      placeholder="Search NASA Image Library (e.g. Apollo lunar equipment, Mars rover)..."
                      className="w-full bg-slate-900/90 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-xs font-mono-tech text-slate-100 focus:outline-none focus:border-sky-400"
                    />
                  </div>

                  <button
                    onClick={() => loadImages(searchQuery)}
                    disabled={imagesLoading}
                    className="px-4 py-2 text-xs font-tech font-bold uppercase tracking-wider text-slate-900 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    {imagesLoading ? 'Searching...' : 'Search NASA'}
                  </button>
                </div>

                {/* Filter tags */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] font-mono-tech text-slate-500 mr-1">Recommended:</span>
                  {presets.map((p) => (
                    <button
                      key={p}
                      onClick={() => {
                        setSearchQuery(p);
                        loadImages(p);
                      }}
                      className={`px-2.5 py-1 text-[11px] font-mono-tech rounded border transition-colors cursor-pointer ${
                        searchQuery === p
                          ? 'bg-sky-500/20 border-sky-400 text-sky-300 font-semibold'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results Grid */}
              {imagesLoading ? (
                <div className="py-24 text-center">
                  <RefreshCw className="w-8 h-8 text-sky-400 animate-spin mx-auto mb-2" />
                  <span className="font-mono-tech text-xs text-slate-400">
                    Querying https://images-api.nasa.gov...
                  </span>
                </div>
              ) : imagesError ? (
                <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-500/40 text-xs text-rose-200">
                  <AlertCircle className="w-4 h-4 inline mr-2" />
                  {imagesError}
                </div>
              ) : images.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between text-xs font-mono-tech text-slate-400 mb-3">
                    <span>{images.length} verified NASA archival records returned</span>
                    <span className="text-slate-500">Click asset to inspect metadata</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {images.map((img) => (
                      <div
                        key={img.nasa_id}
                        onClick={() => setSelectedImage(img)}
                        className="group relative rounded-lg overflow-hidden bg-slate-900 border border-slate-800 hover:border-sky-400/60 transition-all cursor-pointer flex flex-col"
                      >
                        <div className="aspect-video w-full overflow-hidden bg-slate-950">
                          <img
                            src={img.thumbUrl}
                            alt={img.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="p-2.5 flex-1 flex flex-col justify-between">
                          <h5 className="font-tech text-xs font-semibold text-slate-200 line-clamp-2 leading-snug">
                            {img.title}
                          </h5>
                          <div className="mt-2 flex items-center justify-between text-[10px] font-mono-tech text-slate-400">
                            <span>{img.center}</span>
                            <span>{img.date_created.slice(0, 10)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-16 text-center text-xs font-mono-tech text-slate-400">
                  No images returned for "{searchQuery}". Try selecting one of the suggested search tags above.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: API Key & Configuration */}
          {activeTab === 'config' && (
            <div className="max-w-2xl mx-auto space-y-5 text-xs font-mono-tech">
              <div className="p-4 rounded-lg bg-slate-900/80 border border-sky-500/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-sky-400" />
                  <h3 className="font-tech text-sm font-bold text-slate-100">
                    NASA API Credentials Configuration
                  </h3>
                </div>

                <p className="text-slate-300 font-sans leading-relaxed">
                  The application is configured to authenticate with official NASA public endpoints (api.nasa.gov). You can test or update the developer key below.
                </p>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] text-slate-400 uppercase tracking-wider block">
                    NASA API Key (api.nasa.gov)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder="Enter NASA API key..."
                      className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-sky-400"
                    />
                    <button
                      onClick={handleSaveKey}
                      className="px-4 py-2 text-xs font-tech font-bold uppercase text-slate-900 bg-sky-400 hover:bg-sky-300 rounded transition-colors cursor-pointer"
                    >
                      Save Key
                    </button>
                    <button
                      onClick={handleClearKey}
                      className="px-3 py-2 text-xs font-tech text-slate-400 hover:text-rose-400 rounded border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>

                  {keySaveMessage && (
                    <span className="text-[11px] text-emerald-400 block pt-1">
                      {keySaveMessage}
                    </span>
                  )}
                </div>

                <div className="pt-2 text-[11px] text-slate-400 space-y-1">
                  <div>Active Key Masked: <span className="text-sky-300">{status.activeKeyMasked}</span></div>
                  <div>Status: <span className={status.connected ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>{status.message}</span></div>
                  {status.lastChecked && (
                    <div>Last Connection Verified: <span>{new Date(status.lastChecked).toLocaleString()}</span></div>
                  )}
                </div>
              </div>

              {/* Endpoint Catalog */}
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 space-y-2">
                <span className="font-tech text-xs font-bold text-slate-300 block uppercase tracking-wider">
                  Configured NASA Public Endpoints
                </span>
                <div className="space-y-2 text-[11px]">
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-sky-400 font-semibold">GET https://api.nasa.gov/planetary/apod</span>
                    <p className="text-slate-400">Authenticated APOD feed for daily astrophysics.</p>
                  </div>
                  <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                    <span className="text-sky-400 font-semibold">GET https://images-api.nasa.gov/search</span>
                    <p className="text-slate-400">Open archival photo queries for Apollo &amp; Mars equipment.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Image Detail Modal */}
        {selectedImage && (
          <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-2xl glass-panel rounded-xl shadow-2xl p-5 border border-sky-500/30 max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <h4 className="font-tech text-sm font-bold text-slate-100 line-clamp-1">
                  {selectedImage.title}
                </h4>
                <button
                  onClick={() => setSelectedImage(null)}
                  className="p-1 text-slate-400 hover:text-slate-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="aspect-video w-full rounded bg-slate-950 overflow-hidden mb-3">
                <img
                  src={selectedImage.thumbUrl}
                  alt={selectedImage.title}
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-2 text-xs font-mono-tech">
                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-900/60 p-2.5 rounded border border-slate-800">
                  <div>NASA ID: <span className="text-sky-400">{selectedImage.nasa_id}</span></div>
                  <div>Center: <span className="text-slate-200">{selectedImage.center}</span></div>
                  <div>Date: <span className="text-slate-200">{selectedImage.date_created.slice(0, 10)}</span></div>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed pt-1">
                  {selectedImage.description}
                </p>

                <div className="pt-2 flex justify-end">
                  <a
                    href={selectedImage.thumbUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-sky-400 hover:underline"
                  >
                    <span>View Archival Frame</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
