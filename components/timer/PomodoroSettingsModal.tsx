"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Settings,
  X,
  Volume2,
  VolumeX,
  Type,
  Music,
  Upload,
  Play,
  Square,
  Sparkles,
  Check,
  Trash2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTimerStore } from "@/store/timerStore";
import { useThemeStore } from "@/store/themeStore";
import { playSound, stopAllSounds, SOUND_PRESETS, SoundType } from "@/lib/sound";

const TIMER_FONT_PRESETS = [
  { label: "Compact", value: "5rem", px: "80px" },
  { label: "Normal", value: "6.5rem", px: "104px" },
  { label: "Large", value: "8rem", px: "128px" },
  { label: "X-Large", value: "10rem", px: "160px" },
  { label: "Massive", value: "12.5rem", px: "200px" },
];

function PomodoroSettingsModal() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const { pomodoroConfig, setPomodoroConfig, soundConfig, setSoundConfig } = useTimerStore();
  const { theme, setTheme } = useThemeStore();

  // Durations
  const [focus, setFocus] = useState(pomodoroConfig.focusMinutes);
  const [shortBreak, setShortBreak] = useState(pomodoroConfig.shortBreakMinutes);
  const [longBreak, setLongBreak] = useState(pomodoroConfig.longBreakMinutes);
  const [interval, setInterval] = useState(pomodoroConfig.sessionsBeforeLongBreak);
  const [autoBreaks, setAutoBreaks] = useState(pomodoroConfig.autoStartBreaks);
  const [autoFocus, setAutoFocus] = useState(pomodoroConfig.autoStartFocus);

  // Sound & Alarm
  const [soundType, setSoundType] = useState<SoundType>(soundConfig.soundType || "bell");
  const [volume, setVolume] = useState(soundConfig.volume);
  const [soundEnabled, setSoundEnabled] = useState(soundConfig.enabled);
  const [customSoundUrl, setCustomSoundUrl] = useState(soundConfig.customSoundUrl || "");
  const [customSoundName, setCustomSoundName] = useState(soundConfig.customSoundName || "");
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  // Timer Text Size
  const [timerFontSize, setTimerFontSize] = useState<string>(theme.timerFontSize || "7.5rem");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Synchronize modal state with store whenever opened
  useEffect(() => {
    if (isOpen) {
      setFocus(pomodoroConfig.focusMinutes);
      setShortBreak(pomodoroConfig.shortBreakMinutes);
      setLongBreak(pomodoroConfig.longBreakMinutes);
      setInterval(pomodoroConfig.sessionsBeforeLongBreak);
      setAutoBreaks(Boolean(pomodoroConfig.autoStartBreaks));
      setAutoFocus(Boolean(pomodoroConfig.autoStartFocus));
      setSoundType(soundConfig.soundType || "bell");
      setVolume(soundConfig.volume);
      setSoundEnabled(Boolean(soundConfig.enabled));
      setCustomSoundUrl(soundConfig.customSoundUrl || "");
      setCustomSoundName(soundConfig.customSoundName || "");
      setTimerFontSize(theme.timerFontSize || "7.5rem");
      setIsPlayingPreview(false);
    } else {
      stopAllSounds();
      setIsPlayingPreview(false);
    }
  }, [isOpen, pomodoroConfig, soundConfig, theme.timerFontSize]);

  // Clean up sounds on unmount
  useEffect(() => {
    return () => {
      stopAllSounds();
    };
  }, []);

  const handleCustomAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Audio file exceeds 8MB limit. Please choose a smaller ringtone.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCustomSoundUrl(result);
      setCustomSoundName(file.name);
      setSoundType("custom");
      toast.success(`Custom ringtone attached: ${file.name}`);
      // Preview immediately
      playSound("custom", volume, result);
      setIsPlayingPreview(true);
      setTimeout(() => setIsPlayingPreview(false), 3000);
    };
    reader.onerror = () => {
      toast.error("Failed to read audio file");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomSound = () => {
    setCustomSoundUrl("");
    setCustomSoundName("");
    if (soundType === "custom") {
      setSoundType("bell");
    }
    stopAllSounds();
    setIsPlayingPreview(false);
  };

  const toggleSoundPreview = () => {
    if (isPlayingPreview) {
      stopAllSounds();
      setIsPlayingPreview(false);
      return;
    }

    setIsPlayingPreview(true);
    playSound(soundType, volume, customSoundUrl);

    // Auto-reset preview indicator after sound ends
    const previewDuration = soundType === "zenGong" ? 3000 : soundType === "classicAlarm" ? 2000 : 1800;
    setTimeout(() => {
      setIsPlayingPreview(false);
    }, previewDuration);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    stopAllSounds();

    const newPomodoro = {
      focusMinutes: Number(focus),
      shortBreakMinutes: Number(shortBreak),
      longBreakMinutes: Number(longBreak),
      sessionsBeforeLongBreak: Number(interval),
      autoStartBreaks: Boolean(autoBreaks),
      autoStartFocus: Boolean(autoFocus),
    };

    const newSound = {
      soundType,
      volume: Number(volume),
      enabled: Boolean(soundEnabled),
      customSoundUrl: soundType === "custom" ? customSoundUrl : undefined,
      customSoundName: soundType === "custom" ? customSoundName : undefined,
    };

    setPomodoroConfig(newPomodoro);
    setSoundConfig(newSound);
    setTheme({ timerFontSize });

    // Save to user account in MongoDB if logged in
    if (session?.user) {
      try {
        const res = await fetch("/api/user", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            settings: {
              pomodoro: newPomodoro,
              sound: newSound,
            },
            theme: {
              ...theme,
              timerFontSize,
            },
          }),
        });
        if (res.ok) {
          queryClient.invalidateQueries({ queryKey: ["userProfile"] });
        }
      } catch (err) {
        console.error("Failed to sync settings:", err);
      }
    }

    toast.success("Timer settings saved!");
    setIsOpen(false);
  };

  // Convert raw string (e.g. "7.5rem" or "8rem") to float for the slider
  const numericRem = parseFloat(timerFontSize) || 7.5;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors"
        title="Timer, Sound & Size Settings"
      >
        <Settings className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-violet-400" />
                <h3 className="text-base font-bold tracking-tight">Timer & Alarm Settings</h3>
              </div>
              <button
                onClick={() => {
                  stopAllSounds();
                  setIsOpen(false);
                }}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
              {/* SECTION 1: CUSTOM SIZE OF TEXT OF TIMER */}
              <div className="space-y-3 pb-5 border-b border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Timer Text Size
                    </span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-neutral-900 border border-neutral-800 text-violet-300 font-semibold">
                    {numericRem.toFixed(1)} rem
                  </span>
                </div>

                {/* Size Presets */}
                <div className="grid grid-cols-5 gap-1.5">
                  {TIMER_FONT_PRESETS.map((preset) => {
                    const isSelected = Math.abs(numericRem - parseFloat(preset.value)) < 0.3;
                    return (
                      <button
                        key={preset.value}
                        type="button"
                        onClick={() => {
                          setTimerFontSize(preset.value);
                          setTheme({ timerFontSize: preset.value });
                        }}
                        className={`py-2 px-1 rounded-xl text-center border transition-all ${
                          isSelected
                            ? "bg-white text-black border-white font-bold shadow"
                            : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white hover:bg-neutral-800"
                        }`}
                      >
                        <span className="block text-[11px] truncate">{preset.label}</span>
                        <span className="block text-[9px] opacity-60 font-mono">{preset.value}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Fine-tuning Slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] text-neutral-400">
                    <span>Smaller (3.5rem)</span>
                    <span className="text-neutral-500">Drag to customize fluid size</span>
                    <span>Larger (14.0rem)</span>
                  </div>
                  <input
                    type="range"
                    min="3.5"
                    max="14.0"
                    step="0.25"
                    value={numericRem}
                    onChange={(e) => {
                      const newSize = `${e.target.value}rem`;
                      setTimerFontSize(newSize);
                      setTheme({ timerFontSize: newSize });
                    }}
                    className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>

                {/* Mini Live Preview */}
                <div className="p-3 rounded-2xl bg-black border border-neutral-800/80 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">Live Digits Preview</span>
                  <div
                    className="font-mono font-bold tracking-tight text-white tabular-nums select-none"
                    style={{
                      fontSize: `clamp(1.4rem, 4vw, ${Math.min(2.8, numericRem * 0.28).toFixed(2)}rem)`,
                      lineHeight: 1,
                    }}
                  >
                    25:00
                  </div>
                </div>
              </div>

              {/* SECTION 2: CUSTOM ALARM OR RING */}
              <div className="space-y-4 pb-5 border-b border-neutral-800/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                      Alarm & Ringtone
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 text-xs text-neutral-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-neutral-800 bg-neutral-900 accent-white cursor-pointer"
                      />
                      <span>Sound On</span>
                    </label>

                    {/* Test Audio Button */}
                    <button
                      type="button"
                      onClick={toggleSoundPreview}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                        isPlayingPreview
                          ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
                          : "bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800"
                      }`}
                    >
                      {isPlayingPreview ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>Test Alarm</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sound Preset Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SOUND_PRESETS.map((preset) => {
                    const isSelected = soundType === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setSoundType(preset.id);
                          playSound(preset.id, volume, customSoundUrl);
                          setIsPlayingPreview(true);
                          setTimeout(() => setIsPlayingPreview(false), 2000);
                        }}
                        className={`p-2.5 rounded-xl text-left border transition-all relative ${
                          isSelected
                            ? "bg-white text-black border-white shadow-md font-semibold"
                            : "bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-medium truncate">{preset.name}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                        <p
                          className={`text-[10px] leading-snug truncate ${
                            isSelected ? "text-neutral-700" : "text-neutral-500"
                          }`}
                        >
                          {preset.description}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Ringtone Uploader */}
                <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Upload Your Own Ringtone
                      </span>
                      <span className="text-[11px] text-neutral-400">
                        Supports MP3, WAV, OGG, AAC or M4A audio files
                      </span>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
                      onChange={handleCustomAudioUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-all shrink-0"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose File</span>
                    </button>
                  </div>

                  {customSoundName ? (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
                      <div className="flex items-center gap-2 truncate text-violet-300">
                        <Music className="w-3.5 h-3.5 shrink-0 text-violet-400" />
                        <span className="truncate font-medium">{customSoundName}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSoundType("custom");
                            playSound("custom", volume, customSoundUrl);
                            setIsPlayingPreview(true);
                            setTimeout(() => setIsPlayingPreview(false), 3000);
                          }}
                          className="text-[11px] text-neutral-300 hover:text-white underline"
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveCustomSound}
                          className="p-1 text-neutral-500 hover:text-rose-400"
                          title="Remove custom audio"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Alarm Volume Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      {volume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5" />
                      )}
                      <span>Alarm Volume</span>
                    </span>
                    <span className="font-mono text-white">{Math.round(volume * 100)}%</span>
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

              {/* SECTION 3: POMODORO DURATIONS & AUTOMATION */}
              <div className="space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-200 block">
                  Pomodoro Durations
                </span>

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
                      Cycles Before Long Break
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
                  <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1">
                    <div>
                      <span className="text-neutral-200 font-medium block">Auto-start Breaks</span>
                      <span className="text-[11px] text-neutral-500">
                        Automatically start break timer when focus completes
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoBreaks}
                      onChange={(e) => setAutoBreaks(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 accent-white cursor-pointer ml-3"
                    />
                  </label>
                  <label className="flex items-center justify-between text-xs cursor-pointer select-none py-1">
                    <div>
                      <span className="text-neutral-200 font-medium block">
                        Auto-start Next Focus Session
                      </span>
                      <span className="text-[11px] text-neutral-500">
                        Automatically begin next study session when break finishes
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={autoFocus}
                      onChange={(e) => setAutoFocus(e.target.checked)}
                      className="w-4 h-4 rounded border-neutral-800 bg-neutral-900 accent-white cursor-pointer ml-3"
                    />
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    stopAllSounds();
                    setIsOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 shadow-md transition-all"
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

export default React.memo(PomodoroSettingsModal);
