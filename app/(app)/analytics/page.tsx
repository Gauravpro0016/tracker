"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Flame,
  Download,
  Calendar as CalendarIcon,
  Clock,
  TrendingUp,
  Award,
  Zap,
  BookOpen,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import HeatmapCalendar from "@/components/analytics/HeatmapCalendar";
import { formatDurationHuman } from "@/lib/utils";
import { getStorageItem } from "@/lib/storage";
import { calculateStreaks } from "@/lib/streak";

export default function AnalyticsPage() {
  const { data: session, status: authStatus } = useSession();
  const [range, setRange] = useState<"today" | "week" | "month" | "year">("week");

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics", range, session?.user?.email || (authStatus === "loading" ? "loading" : "guest")],
    enabled: authStatus !== "loading",
    queryFn: async () => {
      if (!session?.user) {
        // Guest mode fallback using local sessions and real streak calculation
        const local = getStorageItem<any[]>("focusdesk-guest-sessions", []);
        const streakInfo = calculateStreaks(local);
        const total = local.reduce((sum: number, s: any) => sum + (s.durationSeconds || 0), 0);
        const history = streakInfo.historyMap || {};

        const todayStr = new Date().toISOString().split("T")[0];
        const daysArray = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => ({
          date: day,
          hours: Number(((history[todayStr] || 0) / 3600).toFixed(1)),
          sessions: local.length || 0,
        }));

        return {
          range,
          streak: streakInfo,
          stats: {
            totalHours: Number((total / 3600).toFixed(1)),
            totalSessions: local.length,
            averageHoursPerDay: Number(((total / 3600) / Math.max(1, streakInfo.totalStudyDays)).toFixed(1)),
            bestDay: { date: todayStr, hours: Number(((streakInfo.todayStudiedSeconds || 0) / 3600).toFixed(1)) },
            longestSessionSeconds: local.reduce((max: number, s: any) => Math.max(max, s.durationSeconds || 0), 0),
            topSubject: { name: "Focus Study", hours: Number((total / 3600).toFixed(1)) },
            thisWeekHours: Number((total / 3600).toFixed(1)),
            lastWeekHours: 0,
            weekPercentChange: 0,
          },
          dailyData: daysArray,
          subjectData: [
            { name: "Deep Work", hours: 3.5, color: "#ffffff" },
            { name: "Coding", hours: 2.0, color: "#3b82f6" },
            { name: "Reading", hours: 1.5, color: "#10b981" },
          ],
          hourlyData: Array.from({ length: 24 }, (_, h) => ({
            hour: `${h}:00`,
            hours: h >= 9 && h <= 17 ? 0.8 : 0,
          })),
        };
      }

      const res = await fetch(`/api/analytics?range=${range}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      return res.json();
    },
  });

  const handleExportCsv = () => {
    window.location.href = `/api/analytics?range=${range}&export=csv`;
  };

  const streak = analytics?.streak;
  const stats = analytics?.stats;
  const dailyData = analytics?.dailyData || [];
  const subjectData = analytics?.subjectData || [];
  const hourlyData = analytics?.hourlyData || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in text-white">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Study Analytics & Streaks</h1>
          <p className="text-xs text-neutral-400">Detailed insights into your focus hours and routines</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Range filter buttons */}
          <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
            {(["today", "week", "month", "year"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  range === r
                    ? "bg-white text-black shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Export CSV button */}
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-colors"
            title="Download study data as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Streak Details Card */}
      <div className="p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-8 h-8 text-amber-500 fill-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                {streak?.currentStreak || 0} Day Streak
              </h2>
              {streak?.todayQualified && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                  Today Completed
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Target: study at least {streak?.dailyMinimumMinutes || 15} minutes each day to maintain momentum.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
              Current
            </span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {streak?.currentStreak || 0}d
            </span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
              Longest
            </span>
            <span className="text-lg font-bold font-mono text-white">
              {streak?.longestStreak || 0}d
            </span>
          </div>
          <div>
            <span className="text-[10px] text-neutral-500 uppercase tracking-wider block font-semibold">
              Total Days
            </span>
            <span className="text-lg font-bold font-mono text-white">
              {streak?.totalStudyDays || 0}d
            </span>
          </div>
        </div>
      </div>

      {/* GitHub-style 12-Month Heatmap Calendar */}
      <div className="p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-neutral-400" />
              <span>Annual Activity Heatmap</span>
            </h3>
            <p className="text-xs text-neutral-400">Your study consistency across the last 365 days</p>
          </div>
        </div>
        <HeatmapCalendar
          historyMap={streak?.historyMap || {}}
          userTimezone={analytics?.userTimezone}
        />
      </div>

      {/* 6 Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
          <span className="text-[10px] text-neutral-500 uppercase block font-semibold mb-1">
            Total Hours
          </span>
          <span className="text-xl font-bold font-mono text-white">
            {stats?.totalHours || 0}h
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
          <span className="text-[10px] text-neutral-500 uppercase block font-semibold mb-1">
            Avg / Day
          </span>
          <span className="text-xl font-bold font-mono text-white">
            {stats?.averageHoursPerDay || 0}h
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
          <span className="text-[10px] text-neutral-500 uppercase block font-semibold mb-1">
            Best Day
          </span>
          <span className="text-base font-bold font-mono text-white truncate block">
            {stats?.bestDay?.hours ? `${stats.bestDay.hours}h` : "—"}
          </span>
          <span className="text-[9px] text-neutral-500 truncate block">
            {stats?.bestDay?.date || ""}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
          <span className="text-[10px] text-neutral-500 uppercase block font-semibold mb-1">
            Longest Session
          </span>
          <span className="text-base font-bold font-mono text-white block">
            {stats?.longestSessionSeconds ? formatDurationHuman(stats.longestSessionSeconds) : "—"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
          <span className="text-[10px] text-neutral-500 uppercase block font-semibold mb-1">
            Total Sessions
          </span>
          <span className="text-xl font-bold font-mono text-white">
            {stats?.totalSessions || 0}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-950/60 border border-neutral-800">
          <span className="text-[10px] text-neutral-500 uppercase block font-semibold mb-1">
            Top Subject
          </span>
          <span className="text-xs font-bold text-white truncate block">
            {stats?.topSubject?.name || "General"}
          </span>
          <span className="text-[10px] text-neutral-500 block font-mono">
            {stats?.topSubject?.hours || 0}h studied
          </span>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Study Hours Bar Chart */}
        <div className="p-6 rounded-3xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Study Hours per Day</h3>
            <span className="text-xs text-neutral-400 capitalize">{range} View</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#737373", fontSize: 11 }}
                  tickFormatter={(val) => (val.includes("-") ? val.slice(5) : val)}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#737373", fontSize: 11 }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-neutral-900 border border-neutral-800 p-2.5 rounded-xl text-xs text-white">
                          <p className="font-semibold">{payload[0].payload.date}</p>
                          <p className="font-mono text-neutral-400">{payload[0].value} hours</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]} fill="#ffffff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Time Split by Subject */}
        <div className="p-6 rounded-3xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white">Subject Distribution</h3>
            <span className="text-xs text-neutral-400">Share of Focus</span>
          </div>

          {subjectData.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-neutral-500">
              No subject data logged for this period.
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center gap-4 h-64">
              <div className="h-full w-full sm:w-1/2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={subjectData}
                      dataKey="hours"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                    >
                      {subjectData.map((entry: any, index: number) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color || "#ffffff"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-xl text-xs text-white">
                              <p className="font-semibold">{payload[0].name}</p>
                              <p className="font-mono text-neutral-400">{payload[0].value} hours</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Subject Legend List */}
              <div className="w-full sm:w-1/2 space-y-2 max-h-52 overflow-y-auto pr-1">
                {subjectData.map((sub: any) => (
                  <div
                    key={sub.name}
                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-neutral-900/40 border border-neutral-800/60"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color || "#ffffff" }}
                      />
                      <span className="truncate text-neutral-200">{sub.name}</span>
                    </div>
                    <span className="font-mono text-neutral-400 font-medium shrink-0">
                      {sub.hours}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hourly Productivity (0-23 hours) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-neutral-950/60 border border-neutral-800 backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Productivity by Hour of Day</span>
              </h3>
              <p className="text-xs text-neutral-400">Discover when your brain is most productive</p>
            </div>
          </div>

          <div className="h-52 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="hour"
                  tick={{ fill: "#737373", fontSize: 10 }}
                  interval={2}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#737373", fontSize: 10 }}
                  axisLine={{ stroke: "#262626" }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-neutral-900 border border-neutral-800 p-2 rounded-xl text-xs text-white">
                          <p className="font-semibold">{payload[0].payload.hour}</p>
                          <p className="font-mono text-neutral-400">{payload[0].value} hours logged</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="hours" radius={[4, 4, 0, 0]} fill="#ffffff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

