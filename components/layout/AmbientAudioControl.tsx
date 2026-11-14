"use client";

import React, { useState, useEffect } from "react";
import { ambientSound } from "@/lib/ambient";
import { Volume2, VolumeX, CloudRain, Wind, Music, Sparkles, Headphones } from "lucide-react";
import { useMusicStore } from "@/store/musicStore";

export default function AmbientAudioControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentType, setCurrentType] = useState<"none" | "rain" | "whitenoise" | "lofi">("none");
  const [volume, setVolume] = useState(0.5);

  const handleSelect = (type: "none" | "rain" | "whitenoise" | "lofi") => {
    setCurrentType(type);
    ambientSound.play(type);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    ambientSound.setVolume(val);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#ambient-control-container")) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" id="ambient-control-container">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg border transition-all flex items-center gap-1.5 text-xs font-medium ${
          currentType !== "none"
            ? "border-neutral-500 bg-neutral-900/80 text-white shadow-sm"
            : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white hover:border-neutral-700"
        }`}
        title="Ambient Sound"
      >
        {currentType === "rain" ? (
          <CloudRain className="w-4 h-4 text-sky-400 animate-pulse" />
        ) : currentType === "whitenoise" ? (
          <Wind className="w-4 h-4 text-emerald-400 animate-pulse" />
        ) : currentType === "lofi" ? (
          <Music className="w-4 h-4 text-purple-400 animate-pulse" />
        ) : (
          <Volume2 className="w-4 h-4" />
        )}
        <span className="hidden sm:inline capitalize">
          {currentType === "none" ? "Ambient" : currentType}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 p-3 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl z-50 text-white animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800 mb-3">
            <span className="text-xs font-semibold tracking-wider text-neutral-400 uppercase flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Ambient Audio
            </span>
            {currentType !== "none" && (
              <button
                onClick={() => handleSelect("none")}
                className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
              >
                <VolumeX className="w-3 h-3" /> Stop
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <button
              onClick={() => handleSelect("rain")}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-colors ${
                currentType === "rain"
                  ? "bg-neutral-800 border-neutral-600 text-white"
                  : "bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <CloudRain className="w-3.5 h-3.5 text-sky-400" /> Rain
            </button>
            <button
              onClick={() => handleSelect("whitenoise")}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-colors ${
                currentType === "whitenoise"
                  ? "bg-neutral-800 border-neutral-600 text-white"
                  : "bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <Wind className="w-3.5 h-3.5 text-emerald-400" /> White Noise
            </button>
            <button
              onClick={() => handleSelect("lofi")}
              className={`flex items-center gap-2 p-2 rounded-lg text-xs font-medium border transition-colors col-span-2 ${
                currentType === "lofi"
                  ? "bg-neutral-800 border-neutral-600 text-white"
                  : "bg-neutral-900/50 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <Music className="w-3.5 h-3.5 text-purple-400" /> Lofi Chords
            </button>
          </div>

          {currentType !== "none" && (
            <div className="pt-2 border-t border-neutral-800/80">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>Volume</span>
                <span>{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>
          )}

          <div className="pt-2.5 border-t border-neutral-800/80 mt-2.5">
            <button
              onClick={() => {
                setIsOpen(false);
                useMusicStore.getState().setWidgetOpen(true);
              }}
              className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 transition-colors font-medium"
            >
              <Headphones className="w-3.5 h-3.5 text-amber-400" />
              <span>Spotify & YouTube Music</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

