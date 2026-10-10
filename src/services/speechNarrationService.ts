import { SurfaceWaypoint } from '../types/simulation';

export interface SpeechNarrationState {
  isSpeaking: boolean;
  isPaused: boolean;
  isMuted: boolean;
  currentWaypoint: SurfaceWaypoint | null;
  currentSubtitle: string;
  transcript: string;
  progressPercent: number;
  hasSpeechSupport: boolean;
  voiceName: string;
}

export type NarrationStateListener = (state: SpeechNarrationState) => void;

class SpeechNarrationService {
  private synth: SpeechSynthesis | null = null;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  private state: SpeechNarrationState = {
    isSpeaking: false,
    isPaused: false,
    isMuted: false,
    currentWaypoint: null,
    currentSubtitle: '',
    transcript: '',
    progressPercent: 0,
    hasSpeechSupport: false,
    voiceName: 'Standard Telemetry Voice',
  };

  private listeners: Set<NarrationStateListener> = new Set();
  private audioUnlocked: boolean = false;
  private currentSentences: string[] = [];
  private sentenceIndex: number = 0;
  private subtitleTimer: number | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.state.hasSpeechSupport = true;
      this.initVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices(): void {
    if (!this.synth) return;
    try {
      const voices = this.synth.getVoices();
      if (voices.length === 0) return;

      // Prefer natural English voices (Google US English, Samantha, Daniel, Natural, or en-US)
      const englishVoices = voices.filter((v) => v.lang.startsWith('en'));
      const naturalVoice = englishVoices.find((v) =>
        /natural|google|samantha|daniel|karen|aaron|premium/i.test(v.name)
      );

      this.selectedVoice = naturalVoice || englishVoices[0] || voices[0];
      if (this.selectedVoice) {
        this.state.voiceName = this.selectedVoice.name;
        this.notifyListeners();
      }
    } catch {
      // safe fallback
    }
  }

  public subscribe(listener: NarrationStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): SpeechNarrationState {
    return { ...this.state };
  }

  private notifyListeners(): void {
    const s = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(s);
      } catch (err) {
        console.error('Narration listener error:', err);
      }
    });
  }

  /**
   * Unlock browser audio permission on first interaction (e.g. launch or click)
   */
  public unlockAudio(): void {
    if (this.audioUnlocked) return;
    this.audioUnlocked = true;

    if (this.synth) {
      try {
        if (this.synth.paused) {
          this.synth.resume();
        }
        // Silent micro-utterance to ensure audio context is active
        const dummy = new SpeechSynthesisUtterance(' ');
        dummy.volume = 0.01;
        this.synth.speak(dummy);
      } catch {
        // ignore
      }
    }
  }

  /**
   * Speak narration for a specific waypoint
   */
  public narrateWaypoint(waypoint: SurfaceWaypoint): void {
    // If already narrating this exact waypoint and actively speaking, don't interrupt
    if (this.state.currentWaypoint?.id === waypoint.id && this.state.isSpeaking && !this.state.isPaused) {
      return;
    }

    this.stop();

    const script =
      waypoint.spokenNarration ||
      `${waypoint.name}. Historical landing year ${waypoint.landingYear} by ${waypoint.agency}. ${waypoint.description}. Mission context: ${waypoint.historicalContext}. Documented planetary coordinates: ${waypoint.realCoordinatesText}.`;

    this.state.currentWaypoint = waypoint;
    this.state.transcript = script;
    this.state.isSpeaking = true;
    this.state.isPaused = false;
    this.state.progressPercent = 0;

    // Break text into sentences for synchronized subtitles
    this.currentSentences = script
      .match(/[^.!?]+[.!?]+(\s|$)/g)
      ?.map((s) => s.trim())
      .filter(Boolean) || [script];

    this.sentenceIndex = 0;
    this.state.currentSubtitle = this.currentSentences[0] || script;
    this.notifyListeners();

    if (!this.state.hasSpeechSupport || !this.synth || this.state.isMuted) {
      // Visual subtitle progression fallback if speech is muted or unsupported
      this.runVisualSubtitleSequence();
      return;
    }

    try {
      this.synth.cancel(); // Clear any queued speech

      const utterance = new SpeechSynthesisUtterance(script);
      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }
      utterance.rate = 0.94; // Clear, dignified pacing
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Word/Sentence boundary sync
      utterance.onboundary = (event) => {
        if (event.charIndex !== undefined) {
          const charIdx = event.charIndex;
          this.state.progressPercent = Math.min(100, Math.round((charIdx / script.length) * 100));

          // Find which sentence we are in
          let accumulated = 0;
          for (let i = 0; i < this.currentSentences.length; i++) {
            accumulated += this.currentSentences[i].length;
            if (charIdx <= accumulated) {
              if (this.state.currentSubtitle !== this.currentSentences[i]) {
                this.state.currentSubtitle = this.currentSentences[i];
                this.notifyListeners();
              }
              break;
            }
          }
        }
      };

      utterance.onstart = () => {
        this.state.isSpeaking = true;
        this.state.isPaused = false;
        this.notifyListeners();
      };

      utterance.onend = () => {
        this.state.isSpeaking = false;
        this.state.isPaused = false;
        this.state.progressPercent = 100;
        this.notifyListeners();
      };

      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis event notice:', e.error);
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          // If browser speech fails, fall back to visual subtitle display
          this.runVisualSubtitleSequence();
        } else {
          this.state.isSpeaking = false;
          this.notifyListeners();
        }
      };

      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    } catch (err) {
      console.warn('Failed to start speech synthesis, using visual subtitles:', err);
      this.runVisualSubtitleSequence();
    }
  }

  private runVisualSubtitleSequence(): void {
    if (this.subtitleTimer) {
      window.clearInterval(this.subtitleTimer);
    }

    const sentences = this.currentSentences;
    let idx = 0;

    this.subtitleTimer = window.setInterval(() => {
      idx++;
      if (idx >= sentences.length) {
        if (this.subtitleTimer) window.clearInterval(this.subtitleTimer);
        this.subtitleTimer = null;
        this.state.isSpeaking = false;
        this.state.progressPercent = 100;
        this.notifyListeners();
      } else {
        this.state.currentSubtitle = sentences[idx];
        this.state.progressPercent = Math.round((idx / sentences.length) * 100);
        this.notifyListeners();
      }
    }, 4500);
  }

  public pause(): void {
    if (this.synth && this.state.isSpeaking && !this.state.isPaused) {
      try {
        this.synth.pause();
      } catch {}
    }
    this.state.isPaused = true;
    this.notifyListeners();
  }

  public resume(): void {
    if (this.synth && this.state.isSpeaking && this.state.isPaused) {
      try {
        this.synth.resume();
      } catch {}
    }
    this.state.isPaused = false;
    this.notifyListeners();
  }

  public stop(): void {
    if (this.subtitleTimer) {
      window.clearInterval(this.subtitleTimer);
      this.subtitleTimer = null;
    }
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {}
    }
    this.currentUtterance = null;
    this.state.currentWaypoint = null;
    this.state.isSpeaking = false;
    this.state.isPaused = false;
    this.state.currentSubtitle = '';
    this.state.progressPercent = 0;
    this.notifyListeners();
  }

  public replay(): void {
    if (this.state.currentWaypoint) {
      this.narrateWaypoint(this.state.currentWaypoint);
    }
  }

  public narrateCelestialBody(body: {
    id: string;
    name: string;
    type: string;
    diameterKm: number;
    description: string;
    historicalSignificance: string;
    surfaceTempCelsius: string;
    atmosphere: string;
    parentBody?: string;
  }): void {
    const script = `${body.name}. ${body.type}. Diameter ${body.diameterKm.toLocaleString()} kilometers. ${body.description} Historical note: ${body.historicalSignificance}. Surface temperature: ${body.surfaceTempCelsius}. Atmosphere composition: ${body.atmosphere}.`;

    this.narrateWaypoint({
      id: `body-${body.id}`,
      nasa_id: body.id,
      imageUrl: '',
      name: body.name,
      sublabel: body.type,
      environment: 'moon',
      worldPos: { x: 0, z: 0 },
      searchQuery: body.name,
      equipmentType: body.type,
      agency: body.parentBody ? `Orbital Host: ${body.parentBody}` : 'Deep Space Exploration',
      landingYear: 2026,
      description: body.description,
      historicalContext: body.historicalSignificance,
      realCoordinatesText: `Diameter ${body.diameterKm.toLocaleString()} km • Temp ${body.surfaceTempCelsius}`,
      spokenNarration: script,
      discovered: true,
    });
  }

  public toggleMute(): boolean {
    const next = !this.state.isMuted;
    this.state.isMuted = next;
    if (next && this.synth) {
      this.synth.cancel();
    } else if (!next && this.state.currentWaypoint) {
      this.replay();
    }
    this.notifyListeners();
    return next;
  }
}

export const speechNarrationService = new SpeechNarrationService();
