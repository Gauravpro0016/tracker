"use client";

import React, { useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Minimize, Save, Flame, Clock, Timer } from "lucide-react";
import { useTimerStore } from "@/store/timerStore";
import TimerDisplay from "./TimerDisplay";

interface FullScreenTimerOverlayProps {
  seconds: number;
  subjectName?: string;
  subjectColor?: string;
  onSaveSession?: () => void;
}

export default function FullScreenTimerOverlay({
  seconds,
  subjectName,
  subjectColor,
  onSaveSession,
}: FullScreenTimerOverlayProps) {
  const {
    setIsFullscreen,
    isRunning,
    start,
    pause,
    resume,
    reset,
    accumulatedSeconds,
    startTime,
    currentTask,
    mode,
    pomodoroPhase,
  } = useTimerStore();

  const [controlsVisible, setControlsVisible] = useState(true);

  const isPaused = !isRunning && (accumulatedSeconds > 0 || startTime !== null);

  // Auto-hide controls after 3 seconds of inactivity
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimer = () => {
      setControlsVisible(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    };

    window.addEventListener("mousemove", resetTimer);
    window.addEventListener("mousedown", resetTimer);
    window.addEventListener("touchstart", resetTimer);

    timeoutId = setTimeout(() => {
      setControlsVisible(false);
    }, 3000);

    return () => {
      window.removeEventListener("mousemove", resetTimer);
      window.removeEventListener("mousedown", resetTimer);
      window.removeEventListener("touchstart", resetTimer);
      clearTimeout(timeoutId);
    };
  }, []);

  const exitFullscreen = () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
    setIsFullscreen(false);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between items-center p-6 md:p-12 transition-all ${
        controlsVisible ? "cursor-default" : "cursor-none"
      }`}
    >
      {/* Top minimal status bar (fades out after 3s) */}
      <div
        className={`w-full max-w-4xl flex items-center justify-between transition-opacity duration-500 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2.5">
          {subjectName ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-neutral-800 text-xs font-semibold text-white shadow-lg">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: subjectColor || "#ffffff" }}
              />
              <span>{subjectName}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-neutral-800 text-xs font-medium text-neutral-300 shadow-lg capitalize">
              {mode === "pomodoro" ? (
                <>
                  <Flame className="w-3.5 h-3.5 text-rose-500" />
                  <span>{pomodoroPhase === "focus" ? "Focus" : "Break"}</span>
                </>
              ) : mode === "countdown" ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Countdown</span>
                </>
              ) : (
                <>
                  <Timer className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Stopwatch</span>
                </>
              )}
            </div>
          )}

          {currentTask && (
            <div className="px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-neutral-800 text-xs text-neutral-300 max-w-xs truncate shadow-lg">
              {currentTask}
            </div>
          )}
        </div>

        <button
          onClick={exitFullscreen}
          className="p-2.5 rounded-xl bg-black/60 backdrop-blur-xl border border-neutral-800 text-neutral-400 hover:text-white transition-colors shadow-lg"
          title="Exit Fullscreen (Esc or F)"
        >
          <Minimize className="w-5 h-5" />
        </button>
      </div>

      {/* Center Giant Timer Display - exactly ONE timer */}
      <div className="flex-1 flex items-center justify-center select-none">
        <TimerDisplay seconds={seconds} />
      </div>

      {/* Bottom Floating Minimal Control Bar (fades out after 3s) */}
      <div
        className={`flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-3xl bg-black/75 backdrop-blur-2xl border border-neutral-800 shadow-2xl transition-opacity duration-500 ${
          controlsVisible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <button
          onClick={() => reset()}
          className="p-3 sm:px-4 sm:py-3 rounded-2xl text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors flex items-center gap-2 text-xs font-medium"
          title="Reset timer (R)"
        >
          <RotateCcw className="w-4 h-4" />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <button
          onClick={isRunning ? pause : isPaused ? resume : start}
          className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-sm sm:text-base transition-all active:scale-95 shadow-lg flex items-center gap-2.5"
          title="Space to start/pause"
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-black" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-black" />
              <span>{isPaused ? "Resume" : "Start"}</span>
            </>
          )}
        </button>

        {mode === "stopwatch" && (accumulatedSeconds > 5 || isRunning) && onSaveSession && (
          <button
            onClick={onSaveSession}
            className="p-3 sm:px-4 sm:py-3 rounded-2xl bg-neutral-900 text-neutral-300 hover:text-white hover:bg-neutral-800 border border-neutral-800 transition-colors flex items-center gap-2 text-xs font-medium"
            title="Save Session"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>
        )}

        <button
          onClick={exitFullscreen}
          className="p-3 sm:px-4 sm:py-3 rounded-2xl text-neutral-400 hover:text-white hover:bg-neutral-800/60 transition-colors flex items-center gap-2 text-xs font-medium"
          title="Exit Fullscreen (Esc or F)"
        >
          <Minimize className="w-4 h-4" />
          <span className="hidden sm:inline">Exit</span>
        </button>
      </div>
    </div>
  );
}
