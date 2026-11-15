// Procedural Web Audio API sound generator + custom audio playback
export type SoundType =
  | "bell"
  | "digital"
  | "chime"
  | "marimba"
  | "classicAlarm"
  | "zenGong"
  | "radar"
  | "cosmic"
  | "harp"
  | "custom";

export interface SoundPresetOption {
  id: SoundType;
  name: string;
  category: "classic" | "gentle" | "modern" | "ambient" | "custom";
  description: string;
}

export const SOUND_PRESETS: SoundPresetOption[] = [
  { id: "bell", name: "Tibetan Bell", category: "gentle", description: "Warm, resonant bell with a lingering decay" },
  { id: "chime", name: "Uplifting Chime", category: "gentle", description: "Harmonious 3-tone ascending chord" },
  { id: "harp", name: "Harp Arpeggio", category: "gentle", description: "Delicate 5-note pentatonic harp sweep" },
  { id: "digital", name: "Digital Watch", category: "classic", description: "Crisp triple-beep electronic watch alert" },
  { id: "classicAlarm", name: "Twin-Bell Clock", category: "classic", description: "Vintage ringing twin-bell bedside alarm" },
  { id: "radar", name: "Sonar Radar", category: "modern", description: "Clean high-tech sonar pulse" },
  { id: "cosmic", name: "Cosmic Glow", category: "ambient", description: "Futuristic ambient harmonic wash" },
  { id: "zenGong", name: "Deep Zen Gong", category: "ambient", description: "Low meditative temple bronze gong" },
  { id: "marimba", name: "Acoustic Marimba", category: "gentle", description: "Soft organic wooden marimba strike" },
  { id: "custom", name: "Custom Ringtone", category: "custom", description: "Your own uploaded MP3, WAV or ringtone" },
];

let activeAudioElement: HTMLAudioElement | null = null;
let activeAudioContext: AudioContext | null = null;

export function stopAllSounds() {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
    activeAudioElement = null;
  }
  if (activeAudioContext && activeAudioContext.state !== "closed") {
    try {
      activeAudioContext.close();
    } catch {}
    activeAudioContext = null;
  }
}

export function playSound(
  type: SoundType = "bell",
  volume: number = 0.7,
  customSoundUrl?: string
) {
  if (typeof window === "undefined") return;

  stopAllSounds();

  // 1. Custom uploaded sound via HTML5 Audio element
  if (type === "custom" && customSoundUrl) {
    try {
      const audio = new Audio(customSoundUrl);
      audio.volume = Math.max(0, Math.min(1, volume));
      activeAudioElement = audio;
      audio.play().catch((err) => {
        console.warn("Could not play custom audio, falling back to bell:", err);
        playProceduralSound("bell", volume);
      });
      return;
    } catch (e) {
      console.warn("Custom audio load failed:", e);
    }
  }

  // 2. Procedural Web Audio API sound synthesis
  playProceduralSound(type === "custom" ? "bell" : type, volume);
}

function playProceduralSound(type: SoundType, volume: number) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    activeAudioContext = ctx;
    const now = ctx.currentTime;
    const safeVolume = Math.max(0, Math.min(1, volume));

    if (type === "bell") {
      // Warm resonant bell
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.exponentialRampToValueAtTime(440, now + 1.2);

      gainNode.gain.setValueAtTime(safeVolume * 0.9, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.6);
    } else if (type === "digital") {
      // 3 crisp digital beeps
      [0, 0.14, 0.28].forEach((offset) => {
        const osc = ctx.createOscillator();
        const beepGain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(1400, now + offset);

        beepGain.gain.setValueAtTime(safeVolume * 0.35, now + offset);
        beepGain.gain.setValueAtTime(0, now + offset + 0.08);

        osc.connect(beepGain);
        beepGain.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.09);
      });
    } else if (type === "chime") {
      // Uplifting 4-tone chime (C5 - E5 - G5 - C6)
      const freqs = [523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + i * 0.14);

        g.gain.setValueAtTime(safeVolume * 0.55, now + i * 0.14);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.14 + 0.85);

        osc.connect(g);
        g.connect(ctx.destination);

        osc.start(now + i * 0.14);
        osc.stop(now + i * 0.14 + 0.9);
      });
    } else if (type === "marimba") {
      // Soft woodblock/marimba double hit
      [440, 660, 880].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now + i * 0.1);

        g.gain.setValueAtTime(safeVolume * 0.6, now + i * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);

        osc.connect(g);
        g.connect(ctx.destination);

        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.45);
      });
    } else if (type === "classicAlarm") {
      // Vintage mechanical alarm clock rapid dual-bell ring
      const numRings = 16;
      for (let i = 0; i < numRings; i++) {
        const offset = i * 0.09;
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sawtooth";
        // Alternate between 820Hz and 940Hz to simulate twin bells
        osc.frequency.setValueAtTime(i % 2 === 0 ? 820 : 940, now + offset);

        g.gain.setValueAtTime(safeVolume * 0.35, now + offset);
        g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);

        osc.connect(g);
        g.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.08);
      }
    } else if (type === "zenGong") {
      // Deep resonant bronze temple gong with low sub and shimmering overtones
      const gongFreqs = [110, 222, 335, 560];
      gongFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(freq, now);

        const initialGain = (safeVolume * 0.6) / (idx + 1);
        g.gain.setValueAtTime(initialGain, now);
        g.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

        osc.connect(g);
        g.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.6);
      });
    } else if (type === "radar") {
      // High-tech sonar radar pulse
      [0, 0.4].forEach((offset) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(1600, now + offset);
        osc.frequency.exponentialRampToValueAtTime(400, now + offset + 0.35);

        g.gain.setValueAtTime(safeVolume * 0.7, now + offset);
        g.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.35);

        osc.connect(g);
        g.connect(ctx.destination);

        osc.start(now + offset);
        osc.stop(now + offset + 0.36);
      });
    } else if (type === "cosmic") {
      // Ambient space synth swell
      const chord = [220, 277.18, 329.63, 440]; // A-minor
      chord.forEach((f) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now);

        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(safeVolume * 0.3, now + 0.4);
        g.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

        osc.connect(g);
        g.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.9);
      });
    } else if (type === "harp") {
      // 5-note pentatonic harp arpeggio: C5, D5, E5, G5, A5, C6
      const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
      pentatonic.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = "sine";
        const noteTime = now + idx * 0.11;
        osc.frequency.setValueAtTime(f, noteTime);

        g.gain.setValueAtTime(safeVolume * 0.45, noteTime);
        g.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.7);

        osc.connect(g);
        g.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.75);
      });
    }
  } catch (err) {
    console.warn("Could not synthesize procedural audio:", err);
  }
}

export function requestNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }
}

export function sendBrowserNotification(title: string, body: string) {
  if (typeof window !== "undefined" && "Notification" in window) {
    if (Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: "/favicon.ico",
        });
      } catch (e) {
        console.warn("Notification error:", e);
      }
    }
  }
}
