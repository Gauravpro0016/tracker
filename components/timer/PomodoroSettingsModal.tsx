"use client";

import React, { useState } from "react";
import { Settings, X, Volume2 } from "lucide-react";
import { useTimerStore } from "@/store/timerStore";
import { playSound } from "@/lib/sound";

export default function PomodoroSettingsModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { pomodoroConfig, setPomodoroConfig, soundConfig, setSoundConfig } = useTimerStore();

  const [focus, setFocus] = useState(pomodoroConfig.focusMinutes);
  const [shortBreak, setShortBreak] = useState(pomodoroConfig.shortBreakMinutes);
  const [longBreak, setLongBreak] = useState(pomodoroConfig.longBreakMinutes);
  const [interval, setInterval] = useState(pomodoroConfig.sessionsBeforeLongBreak);
  const [autoBreaks, setAutoBreaks] = useState(pomodoroConfig.autoStartBreaks);
  const [autoFocus, setAutoFocus] = useState(pomodoroConfig.autoStartFocus);

  const [soundType, setSoundType] = useState(soundConfig.soundType);
  const [volume, setVolume] = useState(soundConfig.volume);
  const [soundEnabled, setSoundEnabled] = useState(soundConfig.enabled);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setPomodoroConfig({
      focusMinutes: Number(focus),
      shortBreakMinutes: Number(shortBreak),
      longBreakMinutes: Number(longBreak),
      sessionsBeforeLongBreak: Number(interval),
      autoStartBreaks: autoBreaks,
      autoStartFocus: autoFocus,
    });
    setSoundConfig({
      soundType,
      volume,
      enabled: soundEnabled,
    });
    setIsOpen(false);
  };

  const testAudio = () => {
    playSound(soundType, volume);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors"
        title="Pomodoro Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="text-base font-bold tracking-tight">Pomodoro & Sound Settings</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {/* Duration inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1">
                    Focus Duration (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={focus}
                    onChange={(e) => setFocus(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1">
                    Short Break (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={shortBreak}
                    onChange={(e) => setShortBreak(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1">
                    Long Break (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={longBreak}
                    onChange={(e) => setLongBreak(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-white"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 font-medium block mb-1">
                    Sessions Before Long Break
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={interval}
                    onChange={(e) => setInterval(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-sm font-semibold text-white focus:outline-none focus:border-white"
                  />
                </div>
              </div>

              {/* Automation Toggles */}
              <div className="pt-2 border-t border-neutral-800/80 space-y-2">
                <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                  <span className="text-neutral-300">Auto-start Breaks</span>
                  <input
                    type="checkbox"
                    checked={autoBreaks}
                    onChange={(e) => setAutoBreaks(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 accent-white cursor-pointer"
                  />
                </label>
                <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                  <span className="text-neutral-300">Auto-start Next Focus Session</span>
                  <input
                    type="checkbox"
                    checked={autoFocus}
                    onChange={(e) => setAutoFocus(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 accent-white cursor-pointer"
                  />
                </label>
              </div>

              {/* Alarm Sound Section */}
              <div className="pt-3 border-t border-neutral-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5" /> Alarm Sound
                  </span>
                  <button
                    type="button"
                    onClick={testAudio}
                    className="text-xs text-neutral-400 hover:text-white underline underline-offset-4"
                  >
                    Test Sound
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {(["bell", "digital", "chime", "marimba"] as const).map((sound) => (
                    <button
                      key={sound}
                      type="button"
                      onClick={() => {
                        setSoundType(sound);
                        playSound(sound, volume);
                      }}
                      className={`py-1.5 rounded-lg text-xs font-medium capitalize border transition-all ${
                        soundType === sound
                          ? "bg-white text-black border-white"
                          : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {sound}
                    </button>
                  ))}
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                    <span>Alarm Volume</span>
                    <span>{Math.round(volume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200"
                >
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

