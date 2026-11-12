"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Trophy,
  Flame,
  Award,
  Crown,
  Medal,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  User as UserIcon,
} from "lucide-react";
import { getStorageItem } from "@/lib/storage";

export default function LeaderboardPage() {
  const { data: session, status: authStatus } = useSession();
  const [range, setRange] = useState<"today" | "week" | "month" | "all">("week");

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard", range, session?.user?.email || "guest"],
    enabled: authStatus !== "loading",
    queryFn: async () => {
      const res = await fetch(`/api/leaderboard?range=${range}`);
      if (!res.ok) throw new Error("Failed to load rankings");
      return res.json();
    },
    staleTime: 30 * 1000,
  });

  const leaderboard: any[] = data?.leaderboard || [];
  const currentUserRank = data?.currentUserRank;

  const top1 = leaderboard[0];
  const top2 = leaderboard[1];
  const top3 = leaderboard[2];

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />;
    if (rank === 2) return <Medal className="w-4 h-4 text-neutral-300 fill-neutral-300" />;
    if (rank === 3) return <Medal className="w-4 h-4 text-amber-700 fill-amber-700" />;
    return <span className="font-mono text-neutral-500 font-bold text-xs">#{rank}</span>;
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 animate-fade-in text-white">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Scholar Rankings & Leaderboard</span>
          </h1>
          <p className="text-xs text-neutral-400">
            Compare study dedication, streaks, and ranks with deep workers worldwide
          </p>
        </div>

        {/* Timeframe Switcher */}
        <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-2xl select-none self-start sm:self-center">
          {(["today", "week", "month", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                range === r
                  ? "bg-white text-black shadow-md font-bold"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {r === "all" ? "All Time" : r === "today" ? "Today" : r === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {/* Current User Standings Card */}
      {session?.user && currentUserRank && (
        <div className="p-4 sm:p-6 rounded-3xl bg-neutral-950/80 border border-neutral-800 backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 relative z-10">
            <div className="flex items-center gap-3.5 sm:gap-4">
              <div className="relative shrink-0">
                {currentUserRank.avatar ? (
                  <img
                    src={currentUserRank.avatar}
                    alt={currentUserRank.name}
                    className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl object-cover border-2 border-neutral-700 shadow-md"
                  />
                ) : (
                  <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center font-bold text-lg sm:text-xl text-white">
                    {currentUserRank.name ? currentUserRank.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <div className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-white text-black font-mono font-black text-[10px] shadow-sm">
                  #{currentUserRank.rank}
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate max-w-[180px] sm:max-w-none">{currentUserRank.name}</h3>
                  <span className="text-xs text-neutral-400 font-mono">@{currentUserRank.username}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 mt-1 flex-wrap">
                  <span className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 font-medium flex items-center gap-1">
                    <span>{currentUserRank.tierBadge}</span>
                    <span>{currentUserRank.tier}</span>
                  </span>
                  <span className="text-[11px] sm:text-xs px-2 sm:px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold flex items-center gap-1">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{currentUserRank.streak}d streak</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 sm:gap-6 divide-x divide-neutral-800/80 pt-3 md:pt-0 border-t border-neutral-800/60 md:border-t-0">
              <div className="pr-4 sm:pr-6">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-0.5">
                  Focus Time ({range})
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-white">
                  {currentUserRank.totalHours}h
                </span>
              </div>

              <div className="pl-4 sm:pl-6">
                <span className="text-[10px] uppercase font-bold text-neutral-500 block mb-0.5">
                  Leaderboard Standing
                </span>
                <div className="text-xs text-neutral-300">
                  {currentUserRank.rank === 1 ? (
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Crown className="w-3.5 h-3.5 fill-amber-400" /> Rank #1 Champion!
                    </span>
                  ) : (
                    <span>
                      Only <strong className="text-white font-mono">{currentUserRank.hoursToNextRank}h</strong> to rank up!
                    </span>
                  )}
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-neutral-400 hover:text-white mt-1 underline underline-offset-4"
                >
                  Start Focus Timer <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest Mode Banner */}
      {!session?.user && (
        <div className="p-6 rounded-3xl bg-neutral-950 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-sm text-white">Viewing Public Rankings as Guest</h4>
              <p className="text-xs text-neutral-400">
                Sign in or create an account to claim your rank and compete on the global leaderboard.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs font-bold border border-neutral-800 hover:border-neutral-600 text-white transition-all"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-black hover:bg-neutral-200 transition-all"
            >
              Create Account
            </Link>
          </div>
        </div>
      )}

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="p-4 sm:p-8 rounded-3xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-md">
          <div className="text-center mb-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800">
              Top Scholars Podium
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 items-end max-w-2xl mx-auto pt-4 sm:pt-6">
            {/* 2nd Place */}
            {top2 && (
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden border-2 border-neutral-400 shadow-lg bg-neutral-800 flex items-center justify-center">
                    {top2.avatar ? (
                      <img src={top2.avatar} alt={top2.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-base sm:text-lg">{top2.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-neutral-300 text-black flex items-center justify-center font-black text-[10px] sm:text-xs shadow-md">
                    2
                  </div>
                </div>
                <span className="font-bold text-[11px] sm:text-xs md:text-sm text-white truncate max-w-[85px] sm:max-w-[120px] block">
                  {top2.name}
                </span>
                <span className="font-mono text-[10px] sm:text-xs text-neutral-400 block mb-2 sm:mb-3">
                  {top2.totalHours} hrs
                </span>
                {/* Podium Pedestal */}
                <div className="w-full h-20 sm:h-24 md:h-28 rounded-t-2xl bg-neutral-900/90 border border-neutral-800 flex flex-col items-center justify-center">
                  <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-300 fill-neutral-300 mb-0.5 sm:mb-1" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 font-mono">2nd</span>
                </div>
              </div>
            )}

            {/* 1st Place (Tallest Center) */}
            {top1 && (
              <div className="flex flex-col items-center text-center -mt-4 sm:-mt-6">
                <Crown className="w-6 h-6 sm:w-7 sm:h-7 text-amber-400 fill-amber-400 mb-1 animate-bounce" />
                <div className="relative mb-2">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden border-2 border-amber-400 shadow-xl shadow-amber-500/10 bg-neutral-800 flex items-center justify-center">
                    {top1.avatar ? (
                      <img src={top1.avatar} alt={top1.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-lg sm:text-xl">{top1.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-black text-xs shadow-md">
                    1
                  </div>
                </div>
                <span className="font-bold text-xs sm:text-sm md:text-base text-white truncate max-w-[95px] sm:max-w-[140px] block">
                  {top1.name}
                </span>
                <span className="font-mono text-[11px] sm:text-xs md:text-sm text-amber-400 font-bold block mb-2 sm:mb-3">
                  {top1.totalHours} hrs
                </span>
                {/* Podium Pedestal */}
                <div className="w-full h-28 sm:h-32 md:h-36 rounded-t-2xl bg-gradient-to-t from-neutral-900 to-neutral-800 border border-neutral-700 flex flex-col items-center justify-center shadow-lg">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 fill-amber-400 mb-0.5 sm:mb-1" />
                  <span className="text-[11px] sm:text-xs font-black text-amber-300 font-mono">1st Place</span>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {top3 && (
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-2">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden border-2 border-amber-800 shadow-lg bg-neutral-800 flex items-center justify-center">
                    {top3.avatar ? (
                      <img src={top3.avatar} alt={top3.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-bold text-base sm:text-lg">{top3.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-amber-700 text-white flex items-center justify-center font-black text-[10px] sm:text-xs shadow-md">
                    3
                  </div>
                </div>
                <span className="font-bold text-[11px] sm:text-xs md:text-sm text-white truncate max-w-[85px] sm:max-w-[120px] block">
                  {top3.name}
                </span>
                <span className="font-mono text-[10px] sm:text-xs text-neutral-400 block mb-2 sm:mb-3">
                  {top3.totalHours} hrs
                </span>
                {/* Podium Pedestal */}
                <div className="w-full h-18 sm:h-20 md:h-24 rounded-t-2xl bg-neutral-900/70 border border-neutral-800 flex flex-col items-center justify-center">
                  <Medal className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700 fill-amber-700 mb-0.5 sm:mb-1" />
                  <span className="text-[10px] sm:text-[11px] font-bold text-neutral-400 font-mono">3rd</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Rankings Table */}
      <div className="p-4 sm:p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-neutral-400" />
            <span>Leaderboard Standings</span>
          </h3>
          <span className="text-xs text-neutral-500 font-mono">
            {leaderboard.length} scholars competing
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                <th className="py-3 px-3 w-14 text-center">Rank</th>
                <th className="py-3 px-3">Scholar</th>
                <th className="py-3 px-3">Scholar Tier</th>
                <th className="py-3 px-3 text-center">Streak</th>
                <th className="py-3 px-3 text-center">Sessions</th>
                <th className="py-3 px-4 text-right">Study Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {leaderboard.map((item: any) => {
                const isCurrent =
                  session?.user &&
                  (item.userId === (session.user as any)?.id || item.username === (session.user as any)?.username);

                return (
                  <tr
                    key={item.userId}
                    className={`transition-colors ${
                      isCurrent
                        ? "bg-neutral-900/80 border-l-2 border-l-white font-medium"
                        : "hover:bg-neutral-900/40"
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center">
                        {getRankBadge(item.rank)}
                      </div>
                    </td>

                    {/* Scholar info */}
                    <td className="py-3.5 px-3">
                      <div className="flex items-center gap-3">
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className="w-8 h-8 rounded-xl object-cover border border-neutral-800 shrink-0"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-xs text-white shrink-0">
                            {item.name ? item.name.charAt(0).toUpperCase() : "U"}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-white text-xs">{item.name}</span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded-md bg-white text-black text-[9px] font-bold uppercase tracking-wider">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-neutral-500 font-mono">
                            @{item.username}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Tier */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-300 text-[11px]">
                        <span>{item.tierBadge}</span>
                        <span>{item.tier}</span>
                      </span>
                    </td>

                    {/* Streak */}
                    <td className="py-3.5 px-3 text-center">
                      {item.streak > 0 ? (
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-amber-400 text-xs">
                          <Flame className="w-3.5 h-3.5 fill-amber-500" />
                          <span>{item.streak}d</span>
                        </span>
                      ) : (
                        <span className="text-neutral-600 font-mono text-xs">-</span>
                      )}
                    </td>

                    {/* Sessions */}
                    <td className="py-3.5 px-3 text-center font-mono text-neutral-400">
                      {item.sessionsCount || 0}
                    </td>

                    {/* Total Hours */}
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-mono font-bold text-white text-sm">
                        {item.totalHours} hrs
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

