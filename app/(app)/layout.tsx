"use client";

import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import AppSidebar from "@/components/layout/AppSidebar";
import AppHeader from "@/components/layout/AppHeader";
import WallpaperBackground from "@/components/layout/WallpaperBackground";
import { useTimerStore } from "@/store/timerStore";
import { saveStudySession } from "@/lib/save-session";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isRunning, start, pause, reset, isFullscreen, setIsFullscreen, setOnSessionSave } = useTimerStore();

  // Automatically save study session when timer is reset or completed
  useEffect(() => {
    setOnSessionSave((sessionData) => {
      saveStudySession(sessionData, queryClient);
    });
    return () => {
      setOnSessionSave(undefined);
    };
  }, [setOnSessionSave, queryClient]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().then(() => {
          setIsFullscreen(true);
        }).catch((e) => {
          console.warn("Fullscreen request error:", e);
          setIsFullscreen(true);
        });
      } else {
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch((e) => {
          console.warn("Exit fullscreen error:", e);
          setIsFullscreen(false);
        });
      } else {
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [setIsFullscreen]);

  // Global keyboard shortcuts (Space = Start/Pause, F = Fullscreen, R = Reset)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (isRunning) {
          pause();
        } else {
          start();
        }
      } else if (e.code === "KeyF") {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === "KeyR") {
        e.preventDefault();
        reset();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, start, pause, reset]);

  return (
    <div className="min-h-screen flex flex-col relative text-white">
      {/* Dynamic Wallpaper & Overlay */}
      <WallpaperBackground />

      {/* Main Layout Grid */}
      <div className="flex-1 flex">
        {!isFullscreen && (
          <AppSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        )}

        {/* Content wrapper (margins adapt to sidebar width) */}
        <div
          className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
            isFullscreen ? "pl-0" : "lg:pl-64"
          }`}
        >
          {!isFullscreen && (
            <AppHeader
              setMobileOpen={setMobileOpen}
              toggleFullscreen={toggleFullscreen}
            />
          )}
          <main
            className={
              isFullscreen
                ? "flex-1 w-full h-full p-0 flex flex-col"
                : "flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto"
            }
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
