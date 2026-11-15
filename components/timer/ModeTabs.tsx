"use client";

import React from "react";
import { Timer, Clock, Flame } from "lucide-react";
import { useTimerStore, TimerMode } from "@/store/timerStore";

function ModeTabs() {
  const { mode, setMode } = useTimerStore();

  const tabs: { key: TimerMode; label: string; mobileLabel: string; icon: any }[] = [
    { key: "pomodoro", label: "Pomodoro", mobileLabel: "Pomodoro", icon: Flame },
    { key: "countdown", label: "Countdown", mobileLabel: "Timer", icon: Clock },
    { key: "stopwatch", label: "Stopwatch", mobileLabel: "Stopwatch", icon: Timer },
  ];

  return (
    <div className="flex items-center justify-center p-0.5 sm:p-1 bg-neutral-900/60 backdrop-blur-md rounded-2xl border border-neutral-800/80 w-fit mx-auto">
      {tabs.map((tab) => {
        const isActive = mode === tab.key;
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            onClick={() => setMode(tab.key)}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 rounded-xl text-[11px] sm:text-sm font-semibold transition-all shrink-0 ${
              isActive
                ? "bg-white text-black shadow-md"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${isActive ? "text-black" : "text-neutral-400"}`} />
            <span className="sm:hidden">{tab.mobileLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default React.memo(ModeTabs);

