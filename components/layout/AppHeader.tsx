"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { Menu, Maximize, Flame, Play, Pause } from "lucide-react";
import { useTimerStore } from "@/store/timerStore";
import { formatTime } from "@/lib/utils";
import { getStorageItem } from "@/lib/storage";
import AmbientAudioControl from "./AmbientAudioControl";

interface HeaderProps {
  setMobileOpen: (open: boolean) => void;
  toggleFullscreen: () => void;
}

export default function AppHeader({ setMobileOpen, toggleFullscreen }: HeaderProps) {
  const { data: session } = useSession();
  const { isRunning, mode, secondsLeft, accumulatedSeconds, startTime, pause, resume } = useTimerStore();

  // Live streak query
  const { data: analytics } = useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      if (!session?.user) {
        const local = getStorageItem<any[]>("focusdesk-guest-sessions", []);
        return { streak: { currentStreak: local.length > 0 ? 1 : 0 } };
      }
      const res = await fetch("/api/analytics?range=week");
      if (!res.ok) return { streak: { currentStreak: 0 } };
      return res.json();
    },
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
    <header className="h-16 border-b border-neutral-800 bg-black/40 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Mobile hamburger & Active Timer Status */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Running status pill */}
        {isRunning && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-neutral-400 font-medium capitalize hidden sm:inline">{mode}:</span>
            <span className="font-mono font-semibold text-white">
              {formatTime(displaySeconds, true)}
            </span>
            <button
              onClick={isRunning ? pause : resume}
              className="p-1 hover:text-white text-neutral-400 ml-1"
              title={isRunning ? "Pause" : "Resume"}
            >
              {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </button>
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2.5">
        {/* Ambient sound widget */}
        <AmbientAudioControl />

        {/* Streak icon & count */}
        <Link
          href="/analytics"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-950/60 hover:border-neutral-700 text-neutral-300 text-xs font-semibold transition-all group shadow-sm"
          title={`Current Streak: ${currentStreak} days`}
        >
          <Flame
            className={`w-4 h-4 transition-transform group-hover:scale-110 ${
              currentStreak > 0
                ? "text-amber-500 fill-amber-500 animate-pulse"
                : "text-neutral-600"
            }`}
          />
          <span className="font-mono font-bold text-white">{currentStreak}d</span>
        </Link>

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-xl border border-neutral-800 bg-neutral-950/60 text-neutral-400 hover:text-white hover:border-neutral-700 transition-colors"
          title="Fullscreen Mode (F)"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
