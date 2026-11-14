"use client";

import React, { useState, useMemo } from "react";
import {
  X,
  Play,
  Youtube,
  Radio,
  Disc3,
  Music,
  Headphones,
  Sparkles,
  CloudRain,
  Wind,
  Coffee,
  Brain,
  Gamepad2,
  Waves,
  History,
  CheckCircle2,
  ExternalLink,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";
import { useMusicStore } from "@/store/musicStore";
import {
  parseMusicUrl,
  YOUTUBE_PRESETS,
  SPOTIFY_PRESETS,
  MusicPreset,
} from "@/lib/music-parser";
import { ambientSound } from "@/lib/ambient";

interface MusicSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SpotifyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.215.353-.674.464-1.026.25-2.812-1.718-6.352-2.107-10.523-1.155-.403.092-.806-.16-.898-.563-.092-.403.16-.806.563-.898 4.568-1.044 8.484-.598 11.634 1.34.352.215.464.674.25 1.026zm1.467-3.26c-.27.441-.849.58-1.29.31-3.218-1.977-8.125-2.55-11.932-1.393-.497.151-1.025-.132-1.176-.629-.151-.497.132-1.025.629-1.176 4.353-1.321 9.774-.683 13.459 1.58.441.27.58.849.31 1.29zm.126-3.41c-3.858-2.291-10.223-2.502-13.889-1.389-.59.18-1.22-.16-1.4-.75-.18-.59.16-1.22.75-1.4 4.218-1.28 11.248-1.037 15.688 1.6c.53.315.704 1.006.39 1.536-.314.53-1.005.704-1.535.39z" />
    </svg>
  );
}

function PresetIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case "Headphones":
      return <Headphones className={className} />;
    case "Radio":
      return <Radio className={className} />;
    case "Gamepad2":
      return <Gamepad2 className={className} />;
    case "Waves":
      return <Waves className={className} />;
    case "CloudRain":
      return <CloudRain className={className} />;
    case "Disc3":
      return <Disc3 className={className} />;
    case "Brain":
      return <Brain className={className} />;
    case "Music":
      return <Music className={className} />;
    case "Coffee":
      return <Coffee className={className} />;
    default:
      return <Music className={className} />;
  }
}

export default function MusicSelectorModal({
  isOpen,
  onClose,
}: MusicSelectorModalProps) {
  const {
    currentTrack,
    playPreset,
    playFromUrl,
    playTrack,
    recentTracks,
    stopMusic,
  } = useMusicStore();

  const [urlInput, setUrlInput] = useState("");
  const [activeTab, setActiveTab] = useState<
    "youtube" | "spotify" | "ambient" | "recent"
  >("youtube");

  // Real-time URL detection (0ms)
  const detectedMedia = useMemo(() => {
    if (!urlInput.trim()) return null;
    return parseMusicUrl(urlInput);
  }, [urlInput]);

  if (!isOpen) return null;

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    const success = playFromUrl(urlInput);
    if (success) {
      toast.success("Playing your custom music!");
      setUrlInput("");
      onClose();
    } else {
      toast.error(
        "Invalid music link. Please paste a valid YouTube or Spotify URL."
      );
    }
  };

  const handleSelectPreset = (preset: MusicPreset) => {
    playPreset(preset);
    toast.success(`Playing ${preset.title}!`);
    onClose();
  };

  const handleSelectAmbient = (type: "rain" | "whitenoise" | "lofi" | "none") => {
    ambientSound.play(type);
    if (type !== "none") {
      toast.success(`Playing ambient ${type}!`);
    } else {
      toast.success("Stopped ambient sound");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl p-5 sm:p-6 rounded-3xl bg-neutral-950 border border-neutral-800 shadow-2xl text-white space-y-5 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Study Music & Audio</h3>
              <p className="text-xs text-neutral-400">
                Listen to Spotify, YouTube music, or procedural ambient sounds
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Fast Link Input Bar */}
        <form onSubmit={handleAddUrl} className="space-y-2 shrink-0">
          <label className="text-xs font-semibold text-neutral-300 block">
            Add YouTube or Spotify Link (Instant Play)
          </label>
          <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-neutral-900 border border-neutral-800 focus-within:border-white transition-colors">
            <input
              type="text"
              placeholder="Paste YouTube video/stream URL or Spotify link..."
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 bg-transparent px-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 outline-none truncate"
            />
            <button
              type="submit"
              disabled={!urlInput.trim()}
              className="px-4 py-2 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Add Music</span>
            </button>
          </div>

          {/* Instant Detection Badge */}
          {detectedMedia && (
            <div className="flex items-center gap-2 pt-1 animate-fade-in text-xs font-medium">
              {detectedMedia.type === "spotify" ? (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <SpotifyIcon className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Valid Spotify {detectedMedia.mediaType || "Music"} Detected</span>
                </span>
              ) : (
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <Youtube className="w-3.5 h-3.5 text-rose-500" />
                  <span>Valid YouTube Video / Stream Detected</span>
                </span>
              )}
            </div>
          )}
        </form>

        {/* Category Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-2.5 overflow-x-auto scrollbar-none shrink-0">
          <button
            onClick={() => setActiveTab("youtube")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "youtube"
                ? "bg-rose-600 text-white shadow-sm"
                : "bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            <Youtube className="w-3.5 h-3.5" />
            <span>YouTube Study</span>
          </button>

          <button
            onClick={() => setActiveTab("spotify")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "spotify"
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            <SpotifyIcon className="w-3.5 h-3.5" />
            <span>Spotify Playlists</span>
          </button>

          <button
            onClick={() => setActiveTab("ambient")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === "ambient"
                ? "bg-white text-black shadow-sm"
                : "bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800"
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span>Ambient Sounds</span>
          </button>

          {recentTracks.length > 0 && (
            <button
              onClick={() => setActiveTab("recent")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                activeTab === "recent"
                  ? "bg-white text-black shadow-sm"
                  : "bg-neutral-900/60 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Recent ({recentTracks.length})</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        <div className="overflow-y-auto pr-1 space-y-3 flex-1 scrollbar-thin">
          {/* 1. YouTube Presets */}
          {activeTab === "youtube" && (
            <div className="space-y-2">
              <p className="text-[11px] text-neutral-400 mb-2">
                Curated 24/7 live streams and deep focus study soundtracks:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {YOUTUBE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-3 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-left transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <PresetIcon name={preset.iconName} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">
                          {preset.title}
                        </h4>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 shrink-0">
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {preset.subtitle}
                      </p>
                    </div>
                    <Play className="w-4 h-4 text-neutral-500 group-hover:text-white shrink-0 fill-current opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. Spotify Presets */}
          {activeTab === "spotify" && (
            <div className="space-y-2">
              <p className="text-[11px] text-neutral-400 mb-2">
                Popular Spotify study playlists (plays inside distraction-free embed):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SPOTIFY_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-3 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-left transition-all flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                      <PresetIcon name={preset.iconName} className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-xs font-bold text-white truncate">
                          {preset.title}
                        </h4>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 shrink-0">
                          {preset.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                        {preset.subtitle}
                      </p>
                    </div>
                    <Play className="w-4 h-4 text-neutral-500 group-hover:text-white shrink-0 fill-current opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 3. Ambient Sounds */}
          {activeTab === "ambient" && (
            <div className="space-y-3">
              <p className="text-[11px] text-neutral-400 mb-1">
                Zero-distraction procedural noise generated directly by Web Audio:
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => handleSelectAmbient("rain")}
                  className="p-3.5 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 flex flex-col items-center justify-center gap-2 transition-all group"
                >
                  <CloudRain className="w-6 h-6 text-sky-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">Rain</span>
                </button>
                <button
                  onClick={() => handleSelectAmbient("whitenoise")}
                  className="p-3.5 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 flex flex-col items-center justify-center gap-2 transition-all group"
                >
                  <Wind className="w-6 h-6 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">White Noise</span>
                </button>
                <button
                  onClick={() => handleSelectAmbient("lofi")}
                  className="p-3.5 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 flex flex-col items-center justify-center gap-2 transition-all group"
                >
                  <Music className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold text-white">Lofi Chords</span>
                </button>
              </div>

              <div className="pt-2 flex justify-center">
                <button
                  onClick={() => handleSelectAmbient("none")}
                  className="px-4 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-400 hover:text-white transition-colors"
                >
                  Stop Ambient Sound
                </button>
              </div>
            </div>
          )}

          {/* 4. Recent Tracks */}
          {activeTab === "recent" && (
            <div className="space-y-2">
              <p className="text-[11px] text-neutral-400 mb-2">
                Click any recent link to resume listening:
              </p>
              <div className="space-y-2">
                {recentTracks.map((track, idx) => (
                  <div
                    key={`${track.id}-${idx}`}
                    className="p-2.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 flex items-center justify-between text-xs gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {track.type === "spotify" ? (
                        <SpotifyIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <Youtube className="w-4 h-4 text-rose-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-semibold text-white truncate">
                          {track.title}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate font-mono">
                          {track.originalUrl}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        playTrack(track);
                        toast.success(`Playing ${track.title}!`);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors shrink-0 flex items-center gap-1"
                    >
                      <Play className="w-3 h-3 fill-black" />
                      <span>Play</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info & active player status */}
        {currentTrack && (
          <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="text-neutral-400">Currently Loaded:</span>
              <span className="font-semibold text-white truncate max-w-[180px] sm:max-w-xs">
                {currentTrack.title}
              </span>
            </div>
            <button
              onClick={() => {
                stopMusic();
                toast.success("Stopped music");
              }}
              className="px-3 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-[11px] text-neutral-300 font-medium shrink-0"
            >
              Stop Player
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

