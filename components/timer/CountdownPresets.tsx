"use client";

import React, { useState } from "react";
import { useTimerStore } from "@/store/timerStore";

export default function CountdownPresets() {
  const { setTargetSeconds, targetSeconds, isRunning } = useTimerStore();
  const [showCustom, setShowCustom] = useState(false);
  const [customHours, setCustomHours] = useState(0);
  const [customMinutes, setCustomMinutes] = useState(30);
  const [customSeconds, setCustomSeconds] = useState(0);

  const presets = [
    { label: "15m", seconds: 15 * 60 },
    { label: "25m", seconds: 25 * 60 },
    { label: "45m", seconds: 45 * 60 },
    { label: "1h", seconds: 60 * 60 },
    { label: "2h", seconds: 120 * 60 },
  ];

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const total = customHours * 3600 + customMinutes * 60 + customSeconds;
    if (total > 0) {
      setTargetSeconds(total);
      setShowCustom(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      {/* Preset Pills */}
      <div className="flex items-center gap-1.5 flex-wrap justify-center">
        {presets.map((preset) => {
          const isSelected = targetSeconds === preset.seconds;
          return (
            <button
              key={preset.label}
              disabled={isRunning}
              onClick={() => setTargetSeconds(preset.seconds)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all ${
                isSelected
                  ? "bg-white text-black border-white"
                  : "bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
              } ${isRunning ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              {preset.label}
            </button>
          );
        })}

        <button
          disabled={isRunning}
          onClick={() => setShowCustom(!showCustom)}
          className={`px-3 py-1 rounded-xl text-xs font-medium border border-neutral-800 bg-neutral-900/40 text-neutral-400 hover:text-white hover:border-neutral-700 ${
            isRunning ? "opacity-40 cursor-not-allowed" : ""
          }`}
        >
          {showCustom ? "Close Custom" : "Custom..."}
        </button>
      </div>

      {/* Custom Duration Form */}
      {showCustom && !isRunning && (
        <form
          onSubmit={handleApplyCustom}
          className="flex items-center gap-2 mt-2 p-3 rounded-2xl bg-neutral-950/90 border border-neutral-800 shadow-xl animate-fade-in"
        >
          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="23"
              value={customHours}
              onChange={(e) => setCustomHours(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-12 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-center text-xs font-mono text-white focus:outline-none focus:border-white"
            />
            <span className="text-[10px] text-neutral-400">h</span>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="59"
              value={customMinutes}
              onChange={(e) => setCustomMinutes(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-12 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-center text-xs font-mono text-white focus:outline-none focus:border-white"
            />
            <span className="text-[10px] text-neutral-400">m</span>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="number"
              min="0"
              max="59"
              value={customSeconds}
              onChange={(e) => setCustomSeconds(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-12 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded-lg text-center text-xs font-mono text-white focus:outline-none focus:border-white"
            />
            <span className="text-[10px] text-neutral-400">s</span>
          </div>

          <button
            type="submit"
            className="px-3 py-1 bg-white text-black text-xs font-bold rounded-lg hover:bg-neutral-200"
          >
            Set
          </button>
        </form>
      )}
    </div>
  );
}

