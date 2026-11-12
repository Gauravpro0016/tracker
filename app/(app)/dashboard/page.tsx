"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Flame,
  Clock,
  Calendar,
  CheckCircle2,
  TrendingUp,
  Play,
  ArrowRight,
  Sparkles,
  BookOpen,
  Target,
  ListTodo,
  Trophy,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { formatTime, formatDurationHuman } from "@/lib/utils";
import { getStorageItem } from "@/lib/storage";
import { calculateStreaks } from "@/lib/streak";
import NextMilestoneCard from "@/components/achievements/NextMilestoneCard";

const STUDY_QUOTES = [
  { quote: "Focus is a muscle. The more you practice, the easier it gets.", author: "Cal Newport" },
  { quote: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { quote: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { quote: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { quote: "Deep work is the ability to focus without distraction on a cognitively demanding task.", author: "Cal Newport" },
];

export default function DashboardPage() {
  const { data: session, status: authStatus } = useSession();

  // Quote of the day (based on day of year)
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24)
  );
  const todayQuote = STUDY_QUOTES[dayOfYear % STUDY_QUOTES.length];

  // Fetch Analytics & Streaks
  const { data: analytics } = useQuery({
    queryKey: ["analytics", "week", session?.user?.email || (authStatus === "loading" ? "loading" : "guest")],
    enabled: authStatus !== "loading",
    queryFn: async () => {
      if (!session?.user) {
        // Fallback for guest mode from localStorage using real streak calculator
        const localSessions = getStorageItem<any[]>("focusdesk-guest-sessions", []);
        const streakInfo = calculateStreaks(localSessions);
        const todayStr = new Date().toISOString().split("T")[0];
        const totalSeconds = localSessions.reduce((sum: number, s: any) => sum + (s.durationSeconds || 0), 0);
        const todayHours = Number(((streakInfo.todayStudiedSeconds || 0) / 3600).toFixed(1));
        const totalHours = Number((totalSeconds / 3600).toFixed(1));
        return {
          streak: streakInfo,
          stats: {
            totalHours,
            lifetimeHours: totalHours,
            lifetimeSessions: localSessions.length,
            thisWeekHours: totalHours,
            totalSessions: localSessions.length,
          },
          dailyData: [
            { date: "Mon", hours: 0 },
            { date: "Tue", hours: 0 },
            { date: "Wed", hours: todayHours },
            { date: "Thu", hours: 0 },
            { date: "Fri", hours: 0 },
            { date: "Sat", hours: 0 },
            { date: "Sun", hours: 0 },
          ],
        };
      }
      const res = await fetch("/api/analytics?range=week");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      return res.json();
    },
  });

  // Fetch Recent Sessions
  const { data: recentSessions = [] } = useQuery({
    queryKey: ["sessions", "recent"],
    queryFn: async () => {
      if (!session?.user) {
        return getStorageItem<any[]>("focusdesk-guest-sessions", []).slice(0, 5);
      }
      const res = await fetch("/api/sessions?limit=5");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!session?.user) {
        return getStorageItem<any[]>("focusdesk-guest-tasks", []).slice(0, 5);
      }
      const res = await fetch("/api/tasks");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Planner & Exams
  const { data: plannerData } = useQuery({
    queryKey: ["planner"],
    queryFn: async () => {
      if (!session?.user) return getStorageItem("focusdesk-guest-planner", { items: [], exams: [] });
      const res = await fetch("/api/planner");
      if (!res.ok) return { items: [], exams: [] };
      return res.json();
    },
  });

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  })();

  const currentStreak = analytics?.streak?.currentStreak || 0;
  const longestStreak = analytics?.streak?.longestStreak || currentStreak;
  const todaySecs = analytics?.streak?.todayStudiedSeconds || 0;
  const thisWeekHours = analytics?.stats?.thisWeekHours || 0;
  const lifetimeHours = analytics?.stats?.lifetimeHours ?? analytics?.stats?.totalHours ?? 0;
  const lifetimeSessions = analytics?.stats?.lifetimeSessions ?? analytics?.stats?.totalSessions ?? 0;

  const milestoneStats = {
    totalHours: lifetimeHours,
    currentStreak,
    longestStreak,
    totalSessions: lifetimeSessions,
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Header Greeting & Daily Quote */}
      <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-neutral-950/70 backdrop-blur-md border border-neutral-800 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Daily Overview</span>
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-white">
            {greeting}, {session?.user?.name ? session.user.name.split(" ")[0] : "Scholar"}
          </h1>
          <p className="text-xs md:text-sm text-neutral-400 italic mt-2 max-w-xl">
            "{todayQuote.quote}" — <span className="not-italic text-neutral-500">{todayQuote.author}</span>
          </p>
        </div>

        <Link
          href="/"
          className="self-start md:self-center px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black font-bold text-xs sm:text-sm transition-all flex items-center gap-2 active:scale-95 shadow-lg shrink-0"
        >
          <Play className="w-4 h-4 fill-black" />
          <span>Launch Timer</span>
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Today's Study Time */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-1.5 sm:mb-2">
            <span>Today's Focus</span>
            <Clock className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-white truncate">
            {formatTime(todaySecs, false)}
          </div>
          <span className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 block">
            Target: 15m minimum
          </span>
        </div>

        {/* Current Streak */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-1.5 sm:mb-2">
            <span>Current Streak</span>
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-amber-400 flex items-baseline gap-1.5">
            <span>{currentStreak}</span>
            <span className="text-xs text-neutral-400 font-sans font-medium">days</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 block">
            Best: {analytics?.streak?.longestStreak || currentStreak} days
          </span>
        </div>

        {/* This Week's Hours */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-1.5 sm:mb-2">
            <span>This Week</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-white flex items-baseline gap-1">
            <span>{thisWeekHours}</span>
            <span className="text-xs text-neutral-400 font-sans font-medium">hrs</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-neutral-500 mt-1 block">
            {analytics?.stats?.weekPercentChange ? `${analytics.stats.weekPercentChange}% vs last week` : "Active pacing"}
          </span>
        </div>

        {/* Goal Progress */}
        <div className="p-3.5 sm:p-5 rounded-2xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-sm">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium mb-1.5 sm:mb-2">
            <span>Weekly Target</span>
            <Target className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl font-bold font-mono text-white">
            {Math.min(100, Math.round((thisWeekHours / 15) * 100))}%
          </div>
          <div className="w-full bg-neutral-900 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.round((thisWeekHours / 15) * 100))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Next Hour Milestone Card */}
      <NextMilestoneCard stats={milestoneStats} />

      {/* Middle Grid: Mini Weekly Chart + Today's Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Bar Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-3xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Weekly Study Distribution</h3>
              <p className="text-xs text-neutral-400">Hours invested over the last 7 days</p>
            </div>
            <Link
              href="/analytics"
              className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 font-medium"
            >
              Full Analytics <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics?.dailyData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#737373", fontSize: 11 }}
                  tickFormatter={(val) => {
                    if (val.includes("-")) {
                      const parts = val.split("-");
                      return `${parts[1]}/${parts[2]}`;
                    }
                    return val;
                  }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl text-xs text-white shadow-xl">
                          <p className="font-semibold">{payload[0].payload.date}</p>
                          <p className="text-neutral-400 font-mono mt-0.5">{payload[0].value} hours studied</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                  {(analytics?.dailyData || []).map((entry: any, index: number) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.hours > 0 ? "#ffffff" : "#262626"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Today's Tasks checklist */}
        <div className="p-5 sm:p-6 rounded-3xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ListTodo className="w-4 h-4 text-neutral-400" />
                <span>Today's Tasks</span>
              </h3>
              <Link href="/" className="text-xs text-neutral-400 hover:text-white">
                View all
              </Link>
            </div>

            <div className="space-y-2 mt-3">
              {tasks.length === 0 ? (
                <p className="text-xs text-neutral-500 py-6 text-center">
                  No active tasks. Add one from the Timer page!
                </p>
              ) : (
                tasks.slice(0, 5).map((task: any) => (
                  <div
                    key={task._id || task.id}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-neutral-900/50 border border-neutral-800/80 text-xs"
                  >
                    <CheckCircle2
                      className={`w-4 h-4 shrink-0 ${
                        task.completed ? "text-emerald-400" : "text-neutral-600"
                      }`}
                    />
                    <span
                      className={`truncate ${
                        task.completed ? "line-through text-neutral-500" : "text-neutral-300"
                      }`}
                    >
                      {task.text}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <Link
            href="/"
            className="w-full mt-4 py-2 rounded-xl border border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900 text-neutral-300 text-xs font-semibold text-center block transition-colors"
          >
            Manage Focus Tasks
          </Link>
        </div>
      </div>

      {/* Global Rankings Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-neutral-950/70 border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Scholar Rankings & Leaderboard</span>
            </h4>
            <p className="text-xs text-neutral-400">
              See where you stand among top scholars worldwide this week.
            </p>
          </div>
        </div>
        <Link
          href="/leaderboard"
          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white transition-all flex items-center justify-center gap-1.5 shrink-0"
        >
          <span>View Rankings</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Bottom Grid: Recent Sessions & Upcoming Planner Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Study Sessions */}
        <div className="p-5 sm:p-6 rounded-3xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-neutral-400" />
              <span>Recent Sessions</span>
            </h3>
            <Link href="/analytics" className="text-xs text-neutral-400 hover:text-white">
              History
            </Link>
          </div>

          <div className="space-y-2.5">
            {recentSessions.length === 0 ? (
              <p className="text-xs text-neutral-500 py-6 text-center">
                No study sessions recorded yet. Start the timer to log your first session!
              </p>
            ) : (
              recentSessions.map((sessionItem: any) => (
                <div
                  key={sessionItem._id || sessionItem.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: sessionItem.subjectId?.color || "#ffffff",
                      }}
                    />
                    <div>
                      <p className="font-semibold text-white">
                        {sessionItem.task || "Study Session"}
                      </p>
                      <p className="text-[11px] text-neutral-400">
                        {sessionItem.subjectId?.name || "General"} •{" "}
                        {new Date(sessionItem.startedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-neutral-200">
                    {formatDurationHuman(sessionItem.durationSeconds)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Planner Items & Exams */}
        <div className="p-5 sm:p-6 rounded-3xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neutral-400" />
              <span>Upcoming Plans & Exams</span>
            </h3>
            <Link href="/planner" className="text-xs text-neutral-400 hover:text-white">
              Open Planner
            </Link>
          </div>

          <div className="space-y-2.5">
            {/* Show Exams Countdown first if any */}
            {(plannerData?.exams || []).slice(0, 2).map((exam: any) => {
              const daysLeft = Math.ceil(
                (new Date(exam.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
              );
              return (
                <div
                  key={exam._id}
                  className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-700/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider">
                      Exam Countdown
                    </span>
                    <p className="font-bold text-white text-sm">{exam.title}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-white font-mono">
                      {daysLeft > 0 ? `${daysLeft}d` : "Today"}
                    </span>
                    <p className="text-[10px] text-neutral-400">remaining</p>
                  </div>
                </div>
              );
            })}

            {/* Planner items */}
            {(plannerData?.items || []).slice(0, 3).map((item: any) => (
              <div
                key={item._id}
                className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/40 border border-neutral-800 text-xs"
              >
                <div>
                  <p className="font-medium text-white">{item.title}</p>
                  <p className="text-[11px] text-neutral-400">
                    {item.date} • {item.startTime} - {item.endTime}
                  </p>
                </div>
                <Link
                  href="/"
                  className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-white hover:text-black font-semibold text-[11px] transition-colors"
                >
                  Start
                </Link>
              </div>
            ))}

            {(plannerData?.items?.length || 0) === 0 && (plannerData?.exams?.length || 0) === 0 && (
              <p className="text-xs text-neutral-500 py-6 text-center">
                No scheduled study blocks. Schedule exams or sessions in Study Planner!
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

