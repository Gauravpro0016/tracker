"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTimerStore } from "@/store/timerStore";
import ModeTabs from "@/components/timer/ModeTabs";
import TimerDisplay from "@/components/timer/TimerDisplay";
import TimerControls from "@/components/timer/TimerControls";
import CountdownPresets from "@/components/timer/CountdownPresets";
import PomodoroSettingsModal from "@/components/timer/PomodoroSettingsModal";
import SubjectTaskBar from "@/components/timer/SubjectTaskBar";
import TimerTodoList from "@/components/timer/TimerTodoList";
import ManualSessionModal from "@/components/timer/ManualSessionModal";
import FullScreenTimerOverlay from "@/components/timer/FullScreenTimerOverlay";
import { requestNotificationPermission } from "@/lib/sound";
import { saveStudySession } from "@/lib/save-session";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { gsapFadeIn, gsapMagnetic, gsapResetMagnetic } from "@/lib/gsap-animations";

export default function TimerPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const {
    mode,
    isRunning,
    startTime,
    accumulatedSeconds,
    secondsLeft,
    currentSubjectId,
    currentTask,
    sessionStartedAt,
    tick,
    reset,
    isFullscreen,
  } = useTimerStore();

  const [tickCounter, setTickCounter] = useState(0);
  const timerContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (timerContainerRef.current) {
      gsapFadeIn(timerContainerRef.current, { y: 15, duration: 0.5 });
    }
  }, []);

  // Request browser notification permission on first user interaction
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  // Accurate background ticker using timestamps
  const handleSaveSession = React.useCallback(
    (sessionData: any) => {
      saveStudySession(sessionData, queryClient);
    },
    [queryClient]
  );

  const saveSessionRef = React.useRef(handleSaveSession);
  saveSessionRef.current = handleSaveSession;

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      tick();
      setTickCounter((c) => c + 1);
    }, 500);

    return () => clearInterval(intervalId);
  }, [isRunning, tick]);

  // Calculate live display seconds from timestamp delta
  const displaySeconds = useMemo(() => {
    const now = Date.now();
    const delta = isRunning && startTime ? Math.floor((now - startTime) / 1000) : 0;

    if (mode === "stopwatch") {
      return accumulatedSeconds + delta;
    } else {
      return Math.max(0, secondsLeft - delta);
    }
  }, [mode, isRunning, startTime, accumulatedSeconds, secondsLeft, tickCounter]);

  // Handle manual saving of stopwatch session (or manual finish)
  const handleSaveStopwatch = () => {
    const duration = displaySeconds;
    if (duration < 5) {
      toast.error("Session must be at least 5 seconds to save");
      return;
    }

    // Calling reset() will automatically compute the elapsed study time,
    // trigger onSessionSave, add it to studied analytics, and reset the timer!
    reset();
  };

  // Fetch subjects for manual modal
  const { data: serverSubjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      if (!session?.user) return [];
      const res = await fetch("/api/subjects");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000,
  });

  const activeSubject = serverSubjects.find((s: any) => s._id === currentSubjectId);

  // Fullscreen Mode: Render ONLY the single fullscreen timer overlay
  if (isFullscreen) {
    return (
      <FullScreenTimerOverlay
        seconds={displaySeconds}
        subjectName={activeSubject?.name}
        subjectColor={activeSubject?.color}
        onSaveSession={handleSaveStopwatch}
      />
    );
  }

  return (
    <div
      ref={timerContainerRef}
      className="flex flex-col items-center justify-between w-full h-full max-h-[calc(100dvh-4.25rem)] sm:max-h-none sm:min-h-[calc(100vh-8rem)] py-1 sm:py-2 overflow-hidden sm:overflow-visible"
    >
      {/* Top bar: Mode tabs + settings */}
      <div className="w-full flex items-center justify-between max-w-xl mx-auto px-1 sm:px-2 shrink-0">
        <ManualSessionModal subjects={serverSubjects} />
        <ModeTabs />
        <PomodoroSettingsModal />
      </div>

      {/* Main Timer Display Section */}
      <div className="w-full flex-1 flex flex-col items-center justify-center my-auto min-h-0 shrink-0">
        <TimerDisplay seconds={displaySeconds} />

        {/* Countdown Presets if in countdown mode */}
        {mode === "countdown" && <CountdownPresets />}

        {/* Primary Controls */}
        <div className="mt-2.5 sm:mt-6 shrink-0">
          <TimerControls onSaveSession={handleSaveStopwatch} />
        </div>

        {/* Subject and Task Selector */}
        <div className="mt-2 sm:mt-5 w-full shrink-0">
          <SubjectTaskBar />
        </div>
      </div>

      {/* Embedded Focus Tasks Checklist (compact bottom bar on mobile, full card on desktop) */}
      <div className="w-full shrink-0 pt-1 pb-1 sm:pt-2 sm:pb-4">
        <TimerTodoList />
      </div>

      {/* Guest encouragement banner (desktop only to prevent phone overflow) */}
      {!session?.user && (
        <div className="hidden sm:flex mt-4 px-4 py-2 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-400 items-center gap-2 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>You are using FocusDesk as a guest.</span>
          <Link href="/register" className="text-white underline underline-offset-4 font-semibold">
            Create an account
          </Link>
          <span>to sync study history and streaks!</span>
        </div>
      )}

      {/* Quick AI Study Coach Floating Button */}
      <Link
        href="/ai"
        onMouseMove={(e) => gsapMagnetic(e, 0.25)}
        onMouseLeave={gsapResetMagnetic}
        className="fixed bottom-14 sm:bottom-6 right-3 sm:right-6 z-30 flex items-center gap-1.5 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-neutral-900/95 hover:bg-neutral-850 text-white border border-neutral-700/80 shadow-2xl backdrop-blur-md text-xs font-medium hover:border-violet-500/50 hover:text-violet-200 transition-all group"
        title="Open AI Study Coach & Problem Solver"
      >
        <span className="p-1 rounded-full bg-violet-600/20 text-violet-400 border border-violet-500/30 group-hover:rotate-12 transition-transform">
          <Sparkles className="w-3.5 h-3.5" />
        </span>
        <span className="font-semibold text-xs">AI Coach</span>
      </Link>
    </div>
  );
}

