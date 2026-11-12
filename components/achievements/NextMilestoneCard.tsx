"use client";

import React from "react";
import Link from "next/link";
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
  ArrowRight,
} from "lucide-react";
import { calculateAchievementsProgress } from "@/lib/achievements";

interface NextMilestoneCardProps {
  stats: {
    totalHours: number;
    currentStreak?: number;
    longestStreak?: number;
    totalSessions?: number;
  };
}

function MilestoneIcon({
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

export default function NextMilestoneCard({ stats }: NextMilestoneCardProps) {
  const { totalUnlocked, totalAvailable, nextMilestone, hoursUnlocked, totalHoursMilestones } =
    calculateAchievementsProgress(stats);

  if (!nextMilestone) {
    // All milestones unlocked!
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>All Milestones Conquered!</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                100%
              </span>
            </h4>
            <p className="text-xs text-neutral-400">
              You have unlocked all {totalAvailable} achievements. True study mastery achieved!
            </p>
          </div>
        </div>
        <Link
          href="/profile?tab=achievements"
          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>View Badges</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3.5 flex-1 min-w-0">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border ${nextMilestone.badgeBg} ${nextMilestone.badgeBorder} ${nextMilestone.badgeColor}`}
        >
          <MilestoneIcon name={nextMilestone.iconName} className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
              Next Hour Milestone
            </span>
            <span className="text-xs font-bold text-white truncate">
              {nextMilestone.title} ({nextMilestone.target} {nextMilestone.unit})
            </span>
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            <div className="w-32 sm:w-48 bg-neutral-900 h-2 rounded-full overflow-hidden border border-neutral-800 shrink-0">
              <div
                className="bg-white h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.max(4, nextMilestone.percent)}%` }}
              />
            </div>
            <span className="text-xs font-mono font-bold text-neutral-300">
              {nextMilestone.currentValue} / {nextMilestone.target} {nextMilestone.unit} ({nextMilestone.percent}%)
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-900">
        <span className="text-xs text-neutral-400 hidden md:inline">
          {hoursUnlocked} of {totalHoursMilestones} hours badges
        </span>
        <Link
          href="/profile?tab=achievements"
          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white transition-all flex items-center gap-1.5 shrink-0"
        >
          <span>All Badges ({totalUnlocked}/{totalAvailable})</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

