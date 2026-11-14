"use client";

import React, { useState } from "react";
import {
  Youtube,
  X,
  Minimize2,
  Maximize2,
  Music,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Volume2,
  Headphones,
  Minus,
} from "lucide-react";
import { useMusicStore } from "@/store/musicStore";
import MusicSelectorModal from "./MusicSelectorModal";

function SpotifyIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.215.353-.674.464-1.026.25-2.812-1.718-6.352-2.107-10.523-1.155-.403.092-.806-.16-.898-.563-.092-.403.16-.806.563-.898 4.568-1.044 8.484-.598 11.634 1.34.352.215.464.674.25 1.026zm1.467-3.26c-.27.441-.849.58-1.29.31-3.218-1.977-8.125-2.55-11.932-1.393-.497.151-1.025-.132-1.176-.629-.151-.497.132-1.025.629-1.176 4.353-1.321 9.774-.683 13.459 1.58.441.27.58.849.31 1.29zm.126-3.41c-3.858-2.291-10.223-2.502-13.889-1.389-.59.18-1.22-.16-1.4-.75-.18-.59.16-1.22.75-1.4 4.218-1.28 11.248-1.037 15.688 1.6c.53.315.704 1.006.39 1.536-.314.53-1.005.704-1.535.39z" />
    </svg>
  );
}

export default function MusicPlayerDock() {
  const {
    currentTrack,
    isMinimized,
    setMinimized,
    stopMusic,
    isWidgetOpen,
    setWidgetOpen,
  } = useMusicStore();

  const [modalOpen, setModalOpen] = useState(false);

  if (!currentTrack) {
    return (
      <MusicSelectorModal
        isOpen={modalOpen || isWidgetOpen}
        onClose={() => {
          setModalOpen(false);
          setWidgetOpen(false);
        }}
      />
    );
  }

  const isSpotify = currentTrack.type === "spotify";

  return (
    <>
      <div className="fixed bottom-4 right-4 z-40 max-w-[calc(100vw-2rem)] animate-fade-in">
        {/* 1. Minimized Floating Pill View */}
        {isMinimized && (
          <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-neutral-950/95 border border-neutral-800 shadow-2xl backdrop-blur-xl text-white text-xs hover:border-neutral-700 transition-all">
            <div
              className="flex items-center gap-2 min-w-0 cursor-pointer"
              onClick={() => setMinimized(false)}
              title="Click to expand player"
            >
              {isSpotify ? (
                <SpotifyIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Youtube className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <div className="min-w-0">
                <span className="font-bold truncate block max-w-[130px] sm:max-w-[190px]">
                  {currentTrack.title}
                </span>
                <span className="text-[10px] text-neutral-400 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Playing in background
                </span>
              </div>
            </div>

            {/* Equalizer animation */}
            <div className="flex items-end gap-0.5 h-3 px-1">
              <span className="w-0.5 h-2 bg-emerald-400 animate-pulse" />
              <span className="w-0.5 h-3 bg-emerald-400 animate-pulse delay-75" />
              <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse delay-150" />
            </div>

            <div className="flex items-center gap-1 border-l border-neutral-800 pl-2 shrink-0">
              <button
                onClick={() => setMinimized(false)}
                className="px-2 py-1 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[11px] font-semibold text-neutral-200 hover:text-white flex items-center gap-1 transition-colors"
                title="Expand Music Player"
              >
                <Maximize2 className="w-3 h-3" />
                <span className="hidden sm:inline">Expand</span>
              </button>
              <button
                onClick={() => setModalOpen(true)}
                className="p-1.5 hover:text-white text-neutral-400 rounded-lg hover:bg-neutral-900 transition-colors"
                title="Change Music / Presets"
              >
                <Music className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={stopMusic}
                className="p-1.5 hover:text-rose-400 text-neutral-400 rounded-lg hover:bg-neutral-900 transition-colors"
                title="Stop Music"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 2. Expanded Player Card View (Always stays in DOM to keep playing audio) */}
        <div
          className={`w-[340px] sm:w-[380px] rounded-3xl bg-neutral-950/95 border border-neutral-800 shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col transition-all duration-200 ${
            isMinimized
              ? "w-0 h-0 opacity-0 overflow-hidden pointer-events-none absolute -z-50"
              : "block"
          }`}
        >
          {/* Header */}
          <div className="p-3 px-4 bg-neutral-900/60 border-b border-neutral-800/80 flex items-center justify-between text-xs">
            <div
              className="flex items-center gap-2 min-w-0 cursor-pointer"
              onClick={() => setMinimized(true)}
              title="Click to minimize"
            >
              {isSpotify ? (
                <SpotifyIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <Youtube className="w-4 h-4 text-rose-500 shrink-0" />
              )}
              <span className="font-bold text-white truncate max-w-[140px] sm:max-w-[170px]">
                {currentTrack.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => setModalOpen(true)}
                className="px-2 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-[11px] font-medium text-neutral-300 hover:text-white transition-colors"
                title="Choose different song or playlist"
              >
                Change
              </button>

              {/* Explicit Minimize Button */}
              <button
                onClick={() => setMinimized(true)}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-[11px] font-semibold text-white flex items-center gap-1 transition-all shadow-sm active:scale-95"
                title="Minimize player (Audio keeps playing in background)"
              >
                <Minus className="w-3.5 h-3.5" />
                <span>Minimize</span>
              </button>

              <button
                onClick={stopMusic}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 hover:bg-neutral-800 transition-colors"
                title="Stop & Close Player"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Embedded High-Performance Player */}
          <div className="bg-black flex items-center justify-center relative min-h-[152px]">
            {isSpotify ? (
              <iframe
                key={currentTrack.embedUrl}
                src={currentTrack.embedUrl}
                width="100%"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
                className="rounded-b-3xl bg-neutral-950"
                title="Spotify Player"
              />
            ) : (
              <iframe
                key={currentTrack.embedUrl}
                src={currentTrack.embedUrl}
                width="100%"
                height="190"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                loading="lazy"
                className="rounded-b-3xl"
                title="YouTube Player"
              />
            )}
          </div>
        </div>
      </div>

      {/* Music Selector Modal */}
      <MusicSelectorModal
        isOpen={modalOpen || isWidgetOpen}
        onClose={() => {
          setModalOpen(false);
          setWidgetOpen(false);
        }}
      />
    </>
  );
}
