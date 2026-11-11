"use client";

import React from "react";
import { Play, Pause, RotateCcw, Save, Maximize } from "lucide-react";
import { useTimerStore } from "@/store/timerStore";

interface TimerControlsProps {
  onSaveSession?: () => void;
  canSave?: boolean;
}

export default function TimerControls({ onSaveSession }: TimerControlsProps) {
  const {
    isRunning,
    start,
    pause,
    resume,
    reset,
    startTime,
    accumulatedSeconds,
    mode,
    setIsFullscreen,
  } = useTimerStore();

  const isPaused = !isRunning && (accumulatedSeconds > 0 || startTime !== null);

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch(() => setIsFullscreen(true));
      } else {
        setIsFullscreen(true);
      }
    } else {
      setIsFullscreen(true);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Reset Button */}
        <button
          onClick={() => reset()}
          className="p-3.5 sm:px-5 sm:py-3.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all active:scale-95 flex items-center gap-2 font-medium text-sm"
          title="Reset timer (R)"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        {/* Start / Pause / Resume Primary Button */}
        {!isRunning ? (
          <button
            onClick={isPaused ? resume : start}
            className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-base transition-all active:scale-95 shadow-xl flex items-center gap-2.5"
            title="Start timer (Space)"
          >
            <Play className="w-5 h-5 fill-black" />
            <span>{isPaused ? "Resume" : "Start"}</span>
          </button>
        ) : (
          <button
            onClick={pause}
            className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-base transition-all active:scale-95 shadow-xl flex items-center gap-2.5"
            title="Pause timer (Space)"
          >
            <Pause className="w-5 h-5 fill-black" />
            <span>Pause</span>
          </button>
        )}

        {/* Fullscreen Quick Button */}
        <button
          onClick={handleFullscreen}
          className="p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-all active:scale-95 flex items-center gap-1.5 font-medium text-xs sm:text-sm"
          title="Enter Fullscreen (F)"
        >
          <Maximize className="w-4 h-4" />
          <span className="hidden sm:inline">Fullscreen</span>
        </button>

        {/* Save Session button (for stopwatch or manual stop) */}
        {mode === "stopwatch" && (accumulatedSeconds > 5 || isRunning) && (
          <button
            onClick={onSaveSession}
            className="p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-neutral-900/80 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all active:scale-95 flex items-center gap-2 font-medium text-sm"
            title="Save and finish session"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
        )}
      </div>

      {/* Keyboard Shortcut Hint */}
      <p className="text-[11px] text-neutral-500 flex items-center gap-2 select-none">
        <span>Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-[10px]">Space</kbd> to {isRunning ? "pause" : "start"}</span>
        <span>•</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-[10px]">F</kbd> for fullscreen</span>
        <span>•</span>
        <span><kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono text-[10px]">R</kbd> to reset</span>
      </p>
    </div>
  );
}
