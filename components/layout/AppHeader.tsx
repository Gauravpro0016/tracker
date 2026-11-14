"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Menu, Maximize, Flame, Play, Pause, Headphones, Youtube } from "lucide-react";
import { useTimerStore } from "@/store/timerStore";
import { useMusicStore } from "@/store/musicStore";
import { formatTime } from "@/lib/utils";
import { getStorageItem } from "@/lib/storage";
import { calculateStreaks } from "@/lib/streak";
import AmbientAudioControl from "./AmbientAudioControl";

function SpotifyIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.306c-.215.353-.674.464-1.026.25-2.812-1.718-6.352-2.107-10.523-1.155-.403.092-.806-.16-.898-.563-.092-.403.16-.806.563-.898 4.568-1.044 8.484-.598 11.634 1.34.352.215.464.674.25 1.026zm1.467-3.26c-.27.441-.849.58-1.29.31-3.218-1.977-8.125-2.55-11.932-1.393-.497.151-1.025-.132-1.176-.629-.151-.497.132-1.025.629-1.176 4.353-1.321 9.774-.683 13.459 1.58.441.27.58.849.31 1.29zm.126-3.41c-3.858-2.291-10.223-2.502-13.889-1.389-.59.18-1.22-.16-1.4-.75-.18-.59.16-1.22.75-1.4 4.218-1.28 11.248-1.037 15.688 1.6c.53.315.704 1.006.39 1.536-.314.53-1.005.704-1.535.39z" />
    </svg>
  );
}

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
  toggleFullscreen: () => void;
}

export default function AppHeader({ setMobileOpen, toggleFullscreen }: HeaderProps) {
  const { data: session, status: authStatus } = useSession();
  const { isRunning, mode, secondsLeft, accumulatedSeconds, startTime, pause, resume } = useTimerStore();

  const currentTrack = useMusicStore((state) => state.currentTrack);
  const isMinimized = useMusicStore((state) => state.isMinimized);
  const setWidgetOpen = useMusicStore((state) => state.setWidgetOpen);
  const setMinimized = useMusicStore((state) => state.setMinimized);

  const handleMusicClick = () => {
    if (currentTrack) {
      setMinimized(!isMinimized);
    } else {
      setWidgetOpen(true);
    }
  };

  // Live streak query (updates immediately upon session save, authenticated or guest)
  const { data: analytics } = useQuery({
    queryKey: ["streak", session?.user?.email || (authStatus === "loading" ? "loading" : "guest")],
    queryFn: async () => {
      if (authStatus === "loading") {
        return { streak: { currentStreak: 0 } };
      }
      if (!session?.user) {
        const local = getStorageItem<any[]>("focusdesk-guest-sessions", []);
        const streakInfo = calculateStreaks(local);
        return { streak: streakInfo };
      }
      const res = await fetch("/api/analytics?range=week");
      if (!res.ok) return { streak: { currentStreak: 0 } };
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const currentStreak = analytics?.streak?.currentStreak || 0;

  // Calculate live preview seconds for header pill
  let displaySeconds = 0;
  if (mode === "stopwatch") {
    const delta = isRunning && startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    displaySeconds = accumulatedSeconds + delta;
  } else {
    const delta = isRunning && startTime ? Math.floor((Date.now() - startTime) / 1000) : 0;
    displaySeconds = Math.max(0, secondsLeft - delta);
  }

  return (
    <header className="h-16 border-b border-neutral-800 bg-black/40 backdrop-blur-md px-3 sm:px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & Active Timer Status */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 shrink-0"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Running status pill */}
        {isRunning && (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs shrink-0 max-w-[160px] sm:max-w-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="text-neutral-400 font-medium capitalize hidden md:inline">{mode}:</span>
            <span className="font-mono font-semibold text-white truncate">
              {formatTime(displaySeconds, true)}
            </span>
            <button
              onClick={isRunning ? pause : resume}
              className="p-1 hover:text-white text-neutral-400 ml-0.5 sm:ml-1 shrink-0"
              title={isRunning ? "Pause" : "Resume"}
            >
              {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Music Player Button (Spotify & YouTube) */}
        <button
          onClick={handleMusicClick}
          className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0 ${
            currentTrack
              ? "border-neutral-600 bg-neutral-900 text-white shadow-sm"
              : "border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white hover:border-neutral-700"
          }`}
          title={currentTrack ? `Now Playing: ${currentTrack.title}` : "Spotify & YouTube Music"}
        >
          {currentTrack ? (
            currentTrack.type === "spotify" ? (
              <SpotifyIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <Youtube className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            )
          ) : (
            <Headphones className="w-3.5 h-3.5 shrink-0" />
          )}

          <span className="hidden sm:inline truncate max-w-[110px]">
            {currentTrack ? currentTrack.title : "Music"}
          </span>

          {currentTrack && (
            <span className="flex items-end gap-0.5 h-2.5 ml-0.5">
              <span className="w-0.5 h-2 bg-emerald-400 animate-pulse" />
              <span className="w-0.5 h-2.5 bg-emerald-400 animate-pulse delay-75" />
              <span className="w-0.5 h-1.5 bg-emerald-400 animate-pulse delay-150" />
            </span>
          )}
        </button>

        {/* Ambient sound widget */}
        <AmbientAudioControl />

        {/* Streak icon & count */}
        <Link
          href="/analytics"
          className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 text-neutral-300 text-xs font-semibold transition-all group shadow-sm shrink-0"
          title={`Current Streak: ${currentStreak} days`}
        >
          <Flame
            className={`w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover:scale-110 ${
              currentStreak > 0
                ? "text-amber-500 fill-amber-500 animate-pulse"
                : "text-neutral-600"
            }`}
          />
          <span className="font-mono font-bold text-white text-xs">{currentStreak}d</span>
        </Link>

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl border border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors shrink-0"
          title="Fullscreen Mode (F)"
        >
          <Maximize className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </button>
      </div>
    </header>
  );
}
