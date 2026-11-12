"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  User as UserIcon,
  Flame,
  Award,
  Clock,
  Sparkles,
  Play,
  Share2,
  Calendar,
  GraduationCap,
  Target,
  ArrowRight,
  Loader2,
  BookOpen,
  CheckCircle2,
} from "lucide-react";
import AchievementsGrid from "@/components/achievements/AchievementsGrid";
import NextMilestoneCard from "@/components/achievements/NextMilestoneCard";
import ShareProfileModal from "@/components/profile/ShareProfileModal";

export default function PublicProfileView({ username }: { username: string }) {
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["publicProfile", username],
    queryFn: async () => {
      const res = await fetch(`/api/users/${username}`);
      if (!res.ok) {
        if (res.status === 404) throw new Error("Scholar not found");
        throw new Error("Failed to load profile");
      }
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-4 px-4">
        <Loader2 className="w-8 h-8 text-neutral-400 animate-spin" />
        <p className="text-xs text-neutral-400 font-medium">Loading scholar profile...</p>
      </div>
    );
  }

  if (error || !data?.user) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center space-y-4 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500">
          <UserIcon className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold">Scholar Not Found</h2>
        <p className="text-xs text-neutral-400 max-w-sm">
          No FocusDesk scholar exists with the username <span className="font-mono text-white">@{username}</span>.
        </p>
        <Link
          href="/"
          className="mt-2 px-5 py-2.5 rounded-xl bg-white text-black font-bold text-xs hover:bg-neutral-200 transition-colors"
        >
          Return to FocusDesk
        </Link>
      </div>
    );
  }

  const { user, stats, achievements, topSubjects = [] } = data;
  const joinDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        month: "short",
        year: "numeric",
      })
    : "";

  const milestoneStats = {
    totalHours: stats.totalHours,
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    totalSessions: stats.totalSessions,
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-neutral-800 selection:text-white">
      {/* Top Navbar */}
      <header className="h-16 border-b border-neutral-800 bg-neutral-950/70 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center text-black font-black text-xs transition-transform group-hover:scale-105">
            FD
          </div>
          <span className="font-bold text-sm tracking-tight text-white">FocusDesk</span>
        </Link>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShareModalOpen(true)}
            className="px-3.5 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-xs font-semibold text-neutral-200 flex items-center gap-1.5 transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <Link
            href="/"
            className="px-4 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Play className="w-3 h-3 fill-black" />
            <span>Launch Timer</span>
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 animate-fade-in">
        {/* Scholar Profile Header */}
        <div className="p-5 sm:p-8 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              {/* Avatar */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-neutral-700 bg-neutral-900 flex items-center justify-center shrink-0 overflow-hidden shadow-xl">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl font-black text-white">
                    {(user.name || "U")[0].toUpperCase()}
                  </span>
                )}
              </div>

              {/* Bio & Details */}
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {user.name}
                  </h1>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 font-mono">
                    @{user.username}
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-neutral-400 mt-1.5 max-w-lg leading-relaxed">
                  {user.bio || "Dedicated focus desk scholar."}
                </p>

                {/* Badges / Chips */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-3.5">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-semibold">
                    <Award className={`w-3.5 h-3.5 ${stats.rank.color}`} />
                    <span className={stats.rank.color}>
                      Rank {stats.rank.level}: {stats.rank.title}
                    </span>
                  </div>

                  {user.targetExam && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
                      <Target className="w-3.5 h-3.5 text-rose-400" />
                      <span>{user.targetExam}</span>
                    </div>
                  )}

                  {user.educationLevel && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 text-xs">
                      <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{user.educationLevel}</span>
                    </div>
                  )}

                  {joinDate && (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-neutral-900/50 border border-neutral-800/80 text-neutral-500 text-[11px]">
                      <Calendar className="w-3 h-3" />
                      <span>Scholar since {joinDate}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Share Button on Header */}
            <div className="flex items-center justify-center md:justify-end shrink-0 pt-4 md:pt-0 border-t md:border-t-0 border-neutral-800">
              <button
                onClick={() => setShareModalOpen(true)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 active:scale-95 shadow-md"
              >
                <Share2 className="w-4 h-4 text-neutral-300" />
                <span>Share Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Total Focus */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-sm">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-1">
              <span>Lifetime Focus</span>
              <Clock className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {stats.totalHours}
              <span className="text-sm font-sans font-medium text-neutral-400 ml-1">hrs</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">Deep work recorded</span>
          </div>

          {/* Current Streak */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-sm">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-1">
              <span>Current Streak</span>
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">
              {stats.currentStreak}
              <span className="text-sm font-sans font-medium text-neutral-400 ml-1">days</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">Daily study rhythm</span>
          </div>

          {/* Best Streak */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-sm">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-1">
              <span>Best Streak</span>
              <Sparkles className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {stats.longestStreak}
              <span className="text-sm font-sans font-medium text-neutral-400 ml-1">days</span>
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">Personal record</span>
          </div>

          {/* Sessions Count */}
          <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-sm">
            <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-1">
              <span>Total Sessions</span>
              <Play className="w-4 h-4 text-neutral-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">
              {stats.totalSessions}
            </div>
            <span className="text-[10px] text-neutral-500 mt-1 block">Completed focus blocks</span>
          </div>
        </div>

        {/* Next Milestone Spotlight */}
        <NextMilestoneCard stats={milestoneStats} />

        {/* Top Subjects Studied if any */}
        {topSubjects.length > 0 && (
          <div className="p-5 sm:p-6 rounded-3xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-md">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-neutral-400" />
              <span>Top Subjects Studied</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {topSubjects.map((sub: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: sub.color }}
                    />
                    <span className="font-semibold text-white truncate">{sub.name}</span>
                  </div>
                  <span className="font-mono font-bold text-neutral-300 shrink-0">
                    {sub.hours}h
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step-by-Step Milestones & Badges Grid */}
        <div className="space-y-4">
          <AchievementsGrid stats={milestoneStats} />
        </div>

        {/* Call to Action for Visitors */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-neutral-950 to-neutral-900 border border-neutral-800 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-white">
            <Sparkles className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              Track Your Own Study Hours on FocusDesk
            </h3>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto mt-1">
              Join scholars worldwide. Distraction-free dark mode, ambient soundscapes, daily streaks, and step-by-step hour badges.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/"
              className="px-6 py-3 rounded-2xl bg-white text-black font-bold text-xs sm:text-sm hover:bg-neutral-200 transition-all flex items-center gap-2 shadow-lg active:scale-95"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Start Studying Free</span>
            </Link>
            <Link
              href="/register"
              className="px-5 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-semibold text-xs sm:text-sm transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </main>

      {/* Share Modal */}
      <ShareProfileModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        user={{
          name: user.name,
          username: user.username,
          avatar: user.avatar,
        }}
        stats={{
          totalHours: stats.totalHours,
          currentStreak: stats.currentStreak,
          rankTitle: stats.rank?.title,
        }}
      />
    </div>
  );
}

