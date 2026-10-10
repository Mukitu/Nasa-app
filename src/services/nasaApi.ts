import { NASADataServiceStatus, NasaImageItem, ApodData } from '../types/simulation';

/**
 * NASA Open Data Service
 * 
 * Direct integration with official NASA Image and Video Library:
 * - Search endpoint: https://images-api.nasa.gov/search
 * - Asset endpoint: https://images-api.nasa.gov/asset/{nasa_id}
 * 
 * Open, verified, keyless public endpoint that powers authentic Apollo,
 * Surveyor, and Mars exploration media with truthful latency reporting.
 */

// Secure developer key from environment if configured
const DEFAULT_KEY = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_NASA_API_KEY
  ? import.meta.env.VITE_NASA_API_KEY
  : 'DEMO_KEY';

export const NASA_ENDPOINTS = [
  {
    id: 'images',
    name: 'NASA Image and Video Library',
    phaseTarget: 'OPERATIONAL',
    baseUrl: 'https://images-api.nasa.gov',
    purpose: 'Public query search and asset manifest resolution for Apollo, Mars rovers, and spacecraft heritage.',
  },
  {
    id: 'apod',
    name: 'Astronomy Picture of the Day (APOD)',
    phaseTarget: 'ACTIVE',
    baseUrl: 'https://api.nasa.gov/planetary/apod',
    purpose: 'Daily high-resolution deep sky features and official astrophysics metadata.',
  },
  {
    id: 'mars-rover-photos',
    name: 'Mars Surface Exploration Imagery',
    phaseTarget: 'ACTIVE',
    baseUrl: 'https://api.nasa.gov/mars-photos/api/v1/rovers',
    purpose: 'Curiosity, Opportunity, and Spirit rover raw Mastcam and Navcam telemetry.',
  },
];

class NASAService {
  private customApiKey: string = DEFAULT_KEY;
  private status: NASADataServiceStatus = {
    connected: false,
    endpointState: 'unconfigured',
    lastChecked: null,
    message: 'NASA Image and Video Library initializing...',
    apiKeySupplied: true,
  };

  public getApiKey(): string {
    return this.customApiKey;
  }

  public setApiKey(key: string): void {
    this.customApiKey = key.trim() || DEFAULT_KEY;
    this.status.apiKeySupplied = !!key.trim();
  }

  public clearApiKey(): void {
    this.customApiKey = DEFAULT_KEY;
    this.status.apiKeySupplied = false;
  }

  public getStatus(): NASADataServiceStatus {
    return { ...this.status };
  }

  public async probeConnection(): Promise<NASADataServiceStatus> {
    return this.testConnection();
  }

  public async fetchApod(): Promise<ApodData> {
    const key = this.customApiKey || 'DEMO_KEY';
    const url = `https://api.nasa.gov/planetary/apod?api_key=${encodeURIComponent(key)}`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        throw new Error(`NASA APOD API error: HTTP ${res.status}`);
      }
      return await res.json();
    } catch {
      return {
        date: new Date().toISOString().split('T')[0],
        title: 'Apollo 11 Tranquility Base & Lunar Horizon',
        explanation: 'Historical NASA archival photography captured by astronauts Neil Armstrong and Buzz Aldrin at Tranquility Base on July 20, 1969.',
        media_type: 'image',
        service_version: 'v1',
        url: 'https://images-assets.nasa.gov/image/as11-40-5922/as11-40-5922~medium.jpg',
        hdurl: 'https://images-assets.nasa.gov/image/as11-40-5922/as11-40-5922~orig.jpg',
        copyright: 'NASA / Apollo 11 Mission',
      };
    }
  }

  /**
   * Tests real connectivity against NASA's Image and Video Library.
   */
  public async testConnection(): Promise<NASADataServiceStatus> {
    const timestamp = new Date().toISOString();
    const startTime = performance.now();

    try {
      // Test actual operational endpoint with lightweight probe
      const url = 'https://images-api.nasa.gov/search?q=Apollo&media_type=image';
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const latencyMs = Math.round(performance.now() - startTime);

      if (response.ok) {
        this.status = {
          connected: true,
          endpointState: 'connected',
          lastChecked: timestamp,
          message: `Official NASA Image & Video Library verified. Latency: ${latencyMs}ms.`,
          apiKeySupplied: true,
          latencyMs,
        };
      } else {
        this.status = {
          connected: false,
          endpointState: 'error',
          lastChecked: timestamp,
          message: `NASA API responded with HTTP status ${response.status}.`,
          apiKeySupplied: true,
          latencyMs,
        };
      }
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - startTime);
      this.status = {
        connected: false,
        endpointState: 'error',
        lastChecked: timestamp,
        message: err instanceof Error ? `Network error: ${err.message}` : 'NASA connection timed out.',
        apiKeySupplied: true,
        latencyMs,
      };
    }

    return this.getStatus();
  }

  /**
   * Searches the NASA Image and Video Library for public archives.
   */
  public async searchNasaImages(
    query: string,
    mediaType: 'image' | 'video' | 'all' = 'image'
  ): Promise<NasaImageItem[]> {
    const typeParam = mediaType === 'all' ? 'image,video' : mediaType;
    const url = `https://images-api.nasa.gov/search?q=${encodeURIComponent(query.trim())}&media_type=${typeParam}`;

    const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!response.ok) {
      throw new Error(`NASA Images API error: HTTP ${response.status}`);
    }

    const data = await response.json();
    const items = data.collection?.items || [];
    const mapped: NasaImageItem[] = [];

    for (const item of items.slice(0, 48)) {
      const itemData = item.data?.[0];
      const link = item.links?.[0];

      if (itemData) {
        const id = itemData.nasa_id || `nasa-${Math.random()}`;
        const rawHref = link?.href || '';
        mapped.push({
          nasa_id: id,
          title: itemData.title || 'NASA Mission Record',
          description: itemData.description || itemData.title || 'Historical NASA space exploration record.',
          date_created: itemData.date_created || '',
          center: itemData.center || 'NASA',
          keywords: itemData.keywords || [],
          thumbUrl: rawHref,
          fullUrl: rawHref ? rawHref.replace(/~thumb\.jpg$/, '~orig.jpg').replace(/~small\.jpg$/, '~orig.jpg') : '',
          media_type: (itemData.media_type as 'image' | 'video') || 'image',
          nasaWebUrl: `https://images.nasa.gov/details/${encodeURIComponent(id)}`,
        });
      }
    }

    return mapped;
  }

  /**
   * Fetches asset manifest variants (orig, large, medium, small, mp4) for a specific NASA ID.
   * Endpoint: https://images-api.nasa.gov/asset/{nasa_id}
   */
  public async fetchAssetManifest(nasaId: string): Promise<string[]> {
    if (!nasaId) return [];
    const url = `https://images-api.nasa.gov/asset/${encodeURIComponent(nasaId)}`;
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!response.ok) return [];

      const data = await response.json();
      const items = data.collection?.items || [];
      const urls: string[] = items.map((i: { href: string }) => i.href).filter(Boolean);

      // Prioritize web-compatible large/medium images and mp4 videos ahead of massive ~orig.tif files
      return urls.sort((a, b) => {
        const score = (u: string) => {
          const lower = u.toLowerCase();
          if (lower.endsWith('.mp4')) return 100;
          if (lower.includes('~large.jpg')) return 90;
          if (lower.includes('~medium.jpg')) return 80;
          if (lower.includes('~orig.jpg')) return 70;
          if (lower.includes('~small.jpg')) return 60;
          if (lower.endsWith('.jpg') || lower.endsWith('.png')) return 50;
          return 10;
        };
        return score(b) - score(a);
      });
    } catch {
      return [];
    }
  }
}

export const nasaService = new NASAService();
