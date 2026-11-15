"use client";

import React, { useState, useEffect } from "react";
import { useTimerStore } from "@/store/timerStore";
import { useThemeStore } from "@/store/themeStore";

interface TimerDisplayProps {
  seconds: number;
}

export default function TimerDisplay({ seconds }: TimerDisplayProps) {
  const { theme } = useThemeStore();
  const { mode, pomodoroPhase, cycleCount } = useTimerStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  const showHours = h > 0;
  const showSeconds = theme.showSeconds;

  // Fluid responsive font size that respects the user's custom timer text size
  const rawSize = theme.timerFontSize || "7.5rem";
  const baseSize = parseFloat(rawSize) || 7.5;
  const unit = rawSize.includes("px") ? "px" : "rem";
  const maxFactor = showHours ? 0.85 : 1;
  const maxSize = `${(baseSize * maxFactor).toFixed(1)}${unit}`;
  // Mobile-safe font clamp ensures it smoothly shrinks to fit any phone width without overflow
  const dynamicFontSize = showHours
    ? `clamp(1.75rem, 11vw, ${maxSize})`
    : `clamp(2.25rem, 15vw, ${maxSize})`;

  return (
    <div className="flex flex-col items-center justify-center select-none py-1.5 sm:py-4 md:py-6 w-full max-w-full overflow-hidden shrink-0" suppressHydrationWarning>
      {/* Pomodoro Phase & Cycle Badge */}
      {mode === "pomodoro" && (
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-neutral-900/80 border border-neutral-800 text-[10px] sm:text-xs shrink-0" suppressHydrationWarning>
          <span
            className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 ${
              pomodoroPhase === "focus"
                ? "bg-rose-500 animate-pulse"
                : pomodoroPhase === "shortBreak"
                ? "bg-sky-400"
                : "bg-emerald-400"
            }`}
          />
          <span className="font-medium capitalize text-neutral-300">
            {pomodoroPhase === "focus"
              ? "Focus Session"
              : pomodoroPhase === "shortBreak"
              ? "Short Break"
              : "Long Break"}
          </span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-400" suppressHydrationWarning>
            Cycle #{cycleCount + 1}
          </span>
        </div>
      )}

      {/* Main Large Digits */}
      <div
        className="font-mono font-bold tracking-tight text-white flex items-center justify-center transition-all max-w-full text-center"
        style={{ fontSize: dynamicFontSize, lineHeight: "1" }}
        suppressHydrationWarning
      >
        {theme.digitStyle === "flip" ? (
          <div className="flex items-center gap-1 sm:gap-2 md:gap-3 justify-center max-w-full" suppressHydrationWarning>
            {showHours && (
              <>
                <div className="flip-digit px-2 py-0.5 sm:px-3 sm:py-1 md:px-5 md:py-2">{pad(h)}</div>
                <span className="text-neutral-600 -mt-1 sm:-mt-2">:</span>
              </>
            )}
            <div className="flip-digit px-2 py-0.5 sm:px-3 sm:py-1 md:px-5 md:py-2">{pad(m)}</div>
            {showSeconds && (
              <>
                <span className="text-neutral-600 -mt-1 sm:-mt-2">:</span>
                <div className="flip-digit px-2 py-0.5 sm:px-3 sm:py-1 md:px-5 md:py-2">{pad(s)}</div>
              </>
            )}
          </div>
        ) : (
          <div className="tabular-nums flex items-baseline justify-center tracking-tight" suppressHydrationWarning>
            {showHours && <span>{pad(h)}:</span>}
            <span>{pad(m)}</span>
            {showSeconds && (
              <>
                <span className="text-neutral-600 text-[0.85em]">:</span>
                <span className="text-[0.95em]">{pad(s)}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
