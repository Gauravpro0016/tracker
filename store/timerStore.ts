import { create } from "zustand";
import { persist } from "zustand/middleware";
import { playSound, sendBrowserNotification } from "@/lib/sound";
import confetti from "canvas-confetti";

export type TimerMode = "stopwatch" | "countdown" | "pomodoro";
export type PomodoroPhase = "focus" | "shortBreak" | "longBreak";

export interface PomodoroConfig {
  focusMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
}

export interface SoundConfig {
  enabled: boolean;
  soundType: "bell" | "digital" | "chime" | "marimba";
  volume: number;
}

interface TimerState {
  mode: TimerMode;
  isRunning: boolean;
  startTime: number | null; // Date.now() when timer was started/resumed
  accumulatedSeconds: number; // Seconds counted in prior pauses
  secondsLeft: number; // For countdown and pomodoro
  targetSeconds: number; // Initial countdown seconds

  // Pomodoro
  pomodoroPhase: PomodoroPhase;
  cycleCount: number;
  pomodoroConfig: PomodoroConfig;

  // Metadata
  currentSubjectId: string | null;
  currentTask: string;
  sessionStartedAt: string | null;

  // Settings & Fullscreen
  soundConfig: SoundConfig;
  isFullscreen: boolean;
  sidebarCollapsed: boolean;

  // Session save callback hook
  onSessionSave?: (sessionData: any) => void;
  setOnSessionSave: (callback?: (sessionData: any) => void) => void;

  // Actions
  setMode: (mode: TimerMode) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (options?: { skipSave?: boolean } | unknown) => { sessionData?: any };
  setTargetSeconds: (seconds: number) => void;
  setSubjectId: (id: string | null) => void;
  setTask: (task: string) => void;
  setIsFullscreen: (full: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setPomodoroConfig: (config: Partial<PomodoroConfig>) => void;
  setSoundConfig: (config: Partial<SoundConfig>) => void;
  tick: () => { finished: boolean; sessionData?: any };
  manualReset: () => void;
  resetUserContext: () => void;
}

const DEFAULT_POMODORO: PomodoroConfig = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
};

const DEFAULT_SOUND: SoundConfig = {
  enabled: true,
  soundType: "bell",
  volume: 0.7,
};

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      mode: "pomodoro",
      isRunning: false,
      startTime: null,
      accumulatedSeconds: 0,
      secondsLeft: 25 * 60,
      targetSeconds: 25 * 60,

      pomodoroPhase: "focus",
      cycleCount: 0,
      pomodoroConfig: DEFAULT_POMODORO,

      currentSubjectId: null,
      currentTask: "",
      sessionStartedAt: null,

      soundConfig: DEFAULT_SOUND,
      isFullscreen: false,
      sidebarCollapsed: false,
      onSessionSave: undefined,
      setOnSessionSave: (callback?: (sessionData: any) => void) => set({ onSessionSave: callback }),

      setMode: (mode: TimerMode) => {
        const state = get();
        // If there was study time elapsed, reset will save it to studied
        state.reset();

        let secondsLeft = 0;
        let target = 0;

        if (mode === "stopwatch") {
          secondsLeft = 0;
          target = 0;
        } else if (mode === "countdown") {
          secondsLeft = state.targetSeconds > 0 ? state.targetSeconds : 25 * 60;
          target = secondsLeft;
        } else if (mode === "pomodoro") {
          secondsLeft = state.pomodoroConfig.focusMinutes * 60;
          target = secondsLeft;
        }

        set({
          mode,
          isRunning: false,
          startTime: null,
          accumulatedSeconds: 0,
          secondsLeft,
          targetSeconds: target,
          pomodoroPhase: "focus",
          sessionStartedAt: null,
        });
      },

      start: () => {
        const now = Date.now();
        const state = get();

        set({
          isRunning: true,
          startTime: now,
          sessionStartedAt: state.sessionStartedAt || new Date().toISOString(),
        });
      },

      pause: () => {
        const { startTime, accumulatedSeconds, isRunning, mode, secondsLeft } = get();
        if (!isRunning || !startTime) return;

        const delta = Math.floor((Date.now() - startTime) / 1000);

        if (mode === "stopwatch") {
          set({
            isRunning: false,
            startTime: null,
            accumulatedSeconds: accumulatedSeconds + delta,
          });
        } else {
          const newLeft = Math.max(0, secondsLeft - delta);
          set({
            isRunning: false,
            startTime: null,
            secondsLeft: newLeft,
            accumulatedSeconds: accumulatedSeconds + delta,
          });
        }
      },

      resume: () => {
        set({
          isRunning: true,
          startTime: Date.now(),
        });
      },

      reset: (options?: { skipSave?: boolean } | unknown) => {
        const {
          mode,
          pomodoroConfig,
          targetSeconds,
          pomodoroPhase,
          isRunning,
          startTime,
          accumulatedSeconds,
          currentSubjectId,
          currentTask,
          sessionStartedAt,
        } = get();

        const skipSave =
          typeof options === "object" && options !== null && "skipSave" in options
            ? Boolean((options as { skipSave?: boolean }).skipSave)
            : false;

        // Calculate actual study time passed
        const now = Date.now();
        const delta = isRunning && startTime ? Math.floor((now - startTime) / 1000) : 0;
        const totalElapsed = accumulatedSeconds + delta;

        let sessionData: any = null;
        // Save if >= 5 seconds studied and not in break
        if (!skipSave && totalElapsed >= 5 && (mode !== "pomodoro" || pomodoroPhase === "focus")) {
          sessionData = {
            subjectId: currentSubjectId || null,
            task: currentTask || (mode === "pomodoro" ? "Pomodoro Focus" : mode === "countdown" ? "Countdown Session" : "Stopwatch Focus"),
            mode,
            durationSeconds: totalElapsed,
            startedAt: sessionStartedAt || new Date(now - totalElapsed * 1000).toISOString(),
            endedAt: new Date(now).toISOString(),
          };
        }

        let initialSeconds = 0;
        if (mode === "countdown") {
          initialSeconds = targetSeconds > 0 ? targetSeconds : 25 * 60;
        } else if (mode === "pomodoro") {
          if (pomodoroPhase === "focus") {
            initialSeconds = pomodoroConfig.focusMinutes * 60;
          } else if (pomodoroPhase === "shortBreak") {
            initialSeconds = pomodoroConfig.shortBreakMinutes * 60;
          } else {
            initialSeconds = pomodoroConfig.longBreakMinutes * 60;
          }
        }

        set({
          isRunning: false,
          startTime: null,
          accumulatedSeconds: 0,
          secondsLeft: initialSeconds,
          sessionStartedAt: null,
        });

        if (sessionData) {
          const onSave = get().onSessionSave;
          if (onSave) {
            try {
              onSave(sessionData);
            } catch (err) {
              console.error("Error saving session on reset:", err);
            }
          }
        }

        return { sessionData };
      },

      manualReset: () => {
        get().reset();
      },

      setTargetSeconds: (seconds: number) => {
        set({
          targetSeconds: seconds,
          secondsLeft: seconds,
          accumulatedSeconds: 0,
          startTime: null,
          isRunning: false,
        });
      },

      setSubjectId: (id: string | null) => set({ currentSubjectId: id }),
      setTask: (task: string) => set({ currentTask: task }),
      setIsFullscreen: (full: boolean) => set({ isFullscreen: full }),
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
      resetUserContext: () => {
        set({
          currentSubjectId: null,
          currentTask: "",
          accumulatedSeconds: 0,
          startTime: null,
          isRunning: false,
          sessionStartedAt: null,
        });
      },

      setPomodoroConfig: (config: Partial<PomodoroConfig>) => {
        set((state) => {
          const updated = { ...state.pomodoroConfig, ...config };
          let newSecondsLeft = state.secondsLeft;
          if (state.mode === "pomodoro" && !state.isRunning) {
            if (state.pomodoroPhase === "focus") {
              newSecondsLeft = updated.focusMinutes * 60;
            } else if (state.pomodoroPhase === "shortBreak") {
              newSecondsLeft = updated.shortBreakMinutes * 60;
            } else {
              newSecondsLeft = updated.longBreakMinutes * 60;
            }
          }
          return {
            pomodoroConfig: updated,
            secondsLeft: newSecondsLeft,
          };
        });
      },

      setSoundConfig: (config: Partial<SoundConfig>) => {
        set((state) => ({ soundConfig: { ...state.soundConfig, ...config } }));
      },

      tick: () => {
        const state = get();
        if (!state.isRunning || !state.startTime) {
          return { finished: false };
        }

        const now = Date.now();
        const delta = Math.floor((now - state.startTime) / 1000);

        if (state.mode === "stopwatch") {
          // Stopwatch counts up continuously
          return { finished: false };
        }

        // Countdown / Pomodoro counts down
        const effectiveLeft = Math.max(0, state.secondsLeft - delta);

        if (effectiveLeft <= 0) {
          // Timer finished!
          const { soundConfig, mode, pomodoroPhase, cycleCount, pomodoroConfig, currentSubjectId, currentTask, sessionStartedAt, accumulatedSeconds } = state;

          if (soundConfig.enabled) {
            playSound(soundConfig.soundType, soundConfig.volume);
          }

          try {
            confetti({
              particleCount: 50,
              spread: 60,
              origin: { y: 0.8 },
            });
          } catch (e) {}

          const totalDuration = accumulatedSeconds + delta;

          let sessionDataToSave = null;
          if (mode === "countdown" || (mode === "pomodoro" && pomodoroPhase === "focus")) {
            sessionDataToSave = {
              subjectId: currentSubjectId,
              task: currentTask || (mode === "pomodoro" ? "Pomodoro Focus" : "Countdown Session"),
              mode,
              durationSeconds: totalDuration > 0 ? totalDuration : (mode === "pomodoro" ? pomodoroConfig.focusMinutes * 60 : state.targetSeconds),
              startedAt: sessionStartedAt || new Date(now - (totalDuration * 1000)).toISOString(),
              endedAt: new Date().toISOString(),
            };
          }

          if (sessionDataToSave) {
            const onSave = get().onSessionSave;
            if (onSave) {
              try {
                onSave(sessionDataToSave);
              } catch (err) {
                console.error("Error saving session on timer complete:", err);
              }
            }
          }

          if (mode === "pomodoro") {
            if (pomodoroPhase === "focus") {
              const nextCycle = cycleCount + 1;
              const isLongBreak = nextCycle % pomodoroConfig.sessionsBeforeLongBreak === 0;
              const nextPhase: PomodoroPhase = isLongBreak ? "longBreak" : "shortBreak";
              const nextDuration = (isLongBreak ? pomodoroConfig.longBreakMinutes : pomodoroConfig.shortBreakMinutes) * 60;

              sendBrowserNotification(
                "Focus Session Complete!",
                `Great job! Time for a ${isLongBreak ? "long" : "short"} break (${Math.round(nextDuration / 60)} min).`
              );

              set({
                pomodoroPhase: nextPhase,
                cycleCount: nextCycle,
                secondsLeft: nextDuration,
                targetSeconds: nextDuration,
                accumulatedSeconds: 0,
                startTime: pomodoroConfig.autoStartBreaks ? Date.now() : null,
                isRunning: Boolean(pomodoroConfig.autoStartBreaks),
                sessionStartedAt: null,
              });
            } else {
              // Break finished -> back to focus
              const nextDuration = pomodoroConfig.focusMinutes * 60;

              sendBrowserNotification(
                "Break Over!",
                "Ready to dive back into deep focus?"
              );

              set({
                pomodoroPhase: "focus",
                secondsLeft: nextDuration,
                targetSeconds: nextDuration,
                accumulatedSeconds: 0,
                startTime: pomodoroConfig.autoStartFocus ? Date.now() : null,
                isRunning: Boolean(pomodoroConfig.autoStartFocus),
                sessionStartedAt: pomodoroConfig.autoStartFocus ? new Date().toISOString() : null,
              });
            }
          } else {
            // Countdown ended
            sendBrowserNotification("Countdown Complete!", "Your focus timer has ended.");
            set({
              isRunning: false,
              startTime: null,
              secondsLeft: 0,
              accumulatedSeconds: 0,
              sessionStartedAt: null,
            });
          }

          return { finished: true, sessionData: sessionDataToSave };
        }

        return { finished: false };
      },
    }),
    {
      name: "focusdesk-timer-storage",
      partialize: (state) => ({
        mode: state.mode,
        isRunning: state.isRunning,
        startTime: state.startTime,
        accumulatedSeconds: state.accumulatedSeconds,
        secondsLeft: state.secondsLeft,
        targetSeconds: state.targetSeconds,
        pomodoroPhase: state.pomodoroPhase,
        cycleCount: state.cycleCount,
        pomodoroConfig: state.pomodoroConfig,
        soundConfig: state.soundConfig,
        currentSubjectId: state.currentSubjectId,
        currentTask: state.currentTask,
        sessionStartedAt: state.sessionStartedAt,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

