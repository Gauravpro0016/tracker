"use client";

import React from "react";
import { Timer, Clock, Flame } from "lucide-react";
import { useTimerStore, TimerMode } from "@/store/timerStore";

export default function ModeTabs() {
  const { mode, setMode } = useTimerStore();

  const tabs: { key: TimerMode; label: string; icon: any }[] = [
    { key: "pomodoro", label: "Pomodoro", icon: Flame },
    { key: "countdown", label: "Countdown", icon: Clock },
    { key: "stopwatch", label: "Stopwatch", icon: Timer },
  ];

  return (
    <div className="flex items-center justify-center p-1 bg-neutral-900/60 backdrop-blur-md rounded-2xl border border-neutral-800/80 w-fit mx-auto">
      {tabs.map((tab) => {
        const isActive = mode === tab.key;
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              isActive
                ? "bg-white text-black shadow-md"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? "text-black" : "text-neutral-400"}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

