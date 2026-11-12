"use client";

import React, { useState } from "react";
import {
  Clock,
  Zap,
  Award,
  Trophy,
  Flame,
  Crown,
  Sparkles,
  Diamond,
  Play,
  CheckCircle2,
  Lock,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import {
  UserAchievementStatus,
  calculateAchievementsProgress,
} from "@/lib/achievements";

interface AchievementsGridProps {
  stats: {
    totalHours: number;
    currentStreak?: number;
    longestStreak?: number;
    totalSessions?: number;
  };
}

function AchievementIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  switch (name) {
    case "Clock":
      return <Clock className={className} />;
    case "Zap":
      return <Zap className={className} />;
    case "Award":
      return <Award className={className} />;
    case "Trophy":
      return <Trophy className={className} />;
    case "Flame":
      return <Flame className={className} />;
    case "Crown":
      return <Crown className={className} />;
    case "Sparkles":
      return <Sparkles className={className} />;
    case "Diamond":
      return <Diamond className={className} />;
    case "Play":
      return <Play className={className} />;
    case "CheckCircle2":
      return <CheckCircle2 className={className} />;
    default:
      return <Award className={className} />;
  }
}

export default function AchievementsGrid({ stats }: AchievementsGridProps) {
  const [activeCategory, setActiveCategory] = useState<
    "all" | "hours" | "streak" | "sessions"
  >("all");

  const progressData = calculateAchievementsProgress(stats);
  const {
    achievements,
    totalUnlocked,
    totalAvailable,
    hoursUnlocked,
    totalHoursMilestones,
    nextMilestone,
  } = progressData;

  const filteredAchievements =
    activeCategory === "all"
      ? achievements
      : achievements.filter((a) => a.category === activeCategory);

  const overallPercent = Math.round((totalUnlocked / totalAvailable) * 100);

  return (
    <div className="space-y-6">
      {/* 1. Header Overview & Progress Stats */}
      <div className="p-5 sm:p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Milestone & Badges Tracker</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white">
              Study Achievements
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-xl">
              Unlock step-by-step milestones as you invest hours into deep work.
              Every study minute counts toward your next badge.
            </p>
          </div>

          {/* Quick Counter Chips */}
          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            <div className="px-4 py-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center min-w-[100px]">
              <span className="text-xl sm:text-2xl font-bold font-mono text-white block">
                {totalUnlocked} / {totalAvailable}
              </span>
              <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">
                Total Badges
              </span>
            </div>
            <div className="px-4 py-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center min-w-[100px]">
              <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 block">
                {hoursUnlocked} / {totalHoursMilestones}
              </span>
              <span className="text-[10px] uppercase font-semibold text-neutral-500 tracking-wider">
                Hour Badges
              </span>
            </div>
          </div>
        </div>

        {/* Overall Completion Bar */}
        <div className="mt-5 pt-5 border-t border-neutral-800/80">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-neutral-400 font-medium">Overall Milestones Unlocked</span>
            <span className="text-white font-mono font-bold">{overallPercent}%</span>
          </div>
          <div className="w-full bg-neutral-900 h-2.5 rounded-full overflow-hidden p-0.5 border border-neutral-800">
            <div
              className="bg-gradient-to-r from-amber-500 via-sky-400 to-purple-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(3, overallPercent)}%` }}
            />
          </div>
        </div>

        {/* Next Milestone Spotlight if one is locked */}
        {nextMilestone && (
          <div className="mt-4 p-3.5 sm:p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${nextMilestone.badgeBg} ${nextMilestone.badgeBorder} ${nextMilestone.badgeColor}`}
              >
                <AchievementIcon name={nextMilestone.iconName} className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                    Next Goal
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {nextMilestone.title} ({nextMilestone.target} {nextMilestone.unit})
                  </h4>
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {nextMilestone.remaining} {nextMilestone.unit} remaining • {nextMilestone.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:self-center shrink-0">
              <span className="text-xs font-mono font-bold text-neutral-300">
                {nextMilestone.percent}%
              </span>
              <div className="w-24 sm:w-32 bg-neutral-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-white h-full rounded-full transition-all duration-500"
                  style={{ width: `${nextMilestone.percent}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            activeCategory === "all"
              ? "bg-white text-black shadow-md"
              : "bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:text-white"
          }`}
        >
          All Badges ({achievements.length})
        </button>
        <button
          onClick={() => setActiveCategory("hours")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
            activeCategory === "hours"
              ? "bg-white text-black shadow-md"
              : "bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:text-white"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Hours Step-by-Step (1h to 1000h)</span>
        </button>
        <button
          onClick={() => setActiveCategory("streak")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
            activeCategory === "streak"
              ? "bg-white text-black shadow-md"
              : "bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:text-white"
          }`}
        >
          <Flame className="w-3.5 h-3.5" />
          <span>Streaks</span>
        </button>
        <button
          onClick={() => setActiveCategory("sessions")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
            activeCategory === "sessions"
              ? "bg-white text-black shadow-md"
              : "bg-neutral-900/60 border border-neutral-800 text-neutral-400 hover:text-white"
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Sessions</span>
        </button>
      </div>

      {/* 3. Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
        {filteredAchievements.map((item) => {
          const isUnlocked = item.unlocked;

          return (
            <div
              key={item.id}
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                isUnlocked
                  ? "bg-neutral-950/80 border-neutral-700/80 shadow-lg hover:border-neutral-500"
                  : "bg-neutral-950/40 border-neutral-800/60 opacity-80 hover:opacity-100"
              }`}
            >
              {/* Top Tier & Status Bar */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                        item.tier === "diamond"
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                          : item.tier === "platinum"
                          ? "bg-purple-500/10 text-purple-400 border-purple-500/30"
                          : item.tier === "gold"
                          ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                          : item.tier === "silver"
                          ? "bg-slate-400/10 text-slate-300 border-slate-500/30"
                          : "bg-amber-900/20 text-amber-500 border-amber-800/40"
                      }`}
                    >
                      {item.tier}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500 capitalize">
                      {item.category}
                    </span>
                  </div>

                  {isUnlocked ? (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Unlocked</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-neutral-500 bg-neutral-900/60 border border-neutral-800 px-2 py-0.5 rounded-full">
                      <Lock className="w-3 h-3 text-neutral-600" />
                      <span>{item.remaining} {item.unit} left</span>
                    </span>
                  )}
                </div>

                {/* Badge Icon & Content */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform ${
                      isUnlocked
                        ? `${item.badgeBg} ${item.badgeBorder} ${item.badgeColor} shadow-md`
                        : "bg-neutral-900 border-neutral-800 text-neutral-600"
                    }`}
                  >
                    <AchievementIcon
                      name={item.iconName}
                      className={`w-6 h-6 ${
                        isUnlocked ? item.badgeColor : "text-neutral-600"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      className={`text-sm font-bold truncate ${
                        isUnlocked ? "text-white" : "text-neutral-300"
                      }`}
                    >
                      {item.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bottom Progress Bar & Numbers */}
              <div className="mt-4 pt-3 border-t border-neutral-800/60">
                <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
                  <span className="text-neutral-400 text-[11px]">
                    {item.currentValue} / {item.target} {item.unit}
                  </span>
                  <span
                    className={`text-[11px] font-bold ${
                      isUnlocked ? "text-emerald-400" : "text-neutral-400"
                    }`}
                  >
                    {item.percent}%
                  </span>
                </div>

                <div className="w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isUnlocked
                        ? "bg-white"
                        : item.percent > 0
                        ? "bg-neutral-400"
                        : "bg-transparent"
                    }`}
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

