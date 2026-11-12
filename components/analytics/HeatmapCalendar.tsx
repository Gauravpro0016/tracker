"use client";

import React, { useState } from "react";

interface HeatmapCalendarProps {
  historyMap: Record<string, number>; // date YYYY-MM-DD -> durationSeconds
  userTimezone?: string;
}

export default function HeatmapCalendar({
  historyMap = {},
  userTimezone = "UTC",
}: HeatmapCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; seconds: number } | null>(null);

  // Generate 52 weeks (364 days) leading up to today
  const today = new Date();
  const days: Array<{ dateStr: string; seconds: number; dayOfWeek: number }> = [];

  for (let i = 363; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toLocaleDateString("en-CA", { timeZone: userTimezone });
    const seconds = historyMap[dateStr] || 0;
    days.push({
      dateStr,
      seconds,
      dayOfWeek: d.getDay(),
    });
  }

  // Chunk into 52 weeks of 7 days
  const weeks: Array<typeof days> = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getColor = (seconds: number) => {
    if (seconds <= 0) return "bg-neutral-900 border-neutral-800/80";
    if (seconds < 1800) return "bg-neutral-700 border-neutral-600"; // < 30 mins
    if (seconds < 5400) return "bg-neutral-500 border-neutral-400"; // 30m - 1.5 hrs
    if (seconds < 10800) return "bg-neutral-300 border-neutral-200"; // 1.5h - 3 hrs
    return "bg-white border-white"; // 3+ hrs
  };

  const formatStudyTime = (seconds: number) => {
    if (seconds <= 0) return "0 min";
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.round(seconds / 60);
    if (mins < 60) return `${mins} min`;
    const hrs = (seconds / 3600).toFixed(1);
    return `${hrs}h (${mins}m)`;
  };

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="w-full overflow-x-auto pb-2 select-none">
      <div className="min-w-[700px]">
        {/* Months labels */}
        <div className="flex justify-between text-[10px] text-neutral-500 mb-2 px-1">
          {months.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </div>

        {/* Heatmap Grid */}
        <div className="flex gap-1">
          {weeks.map((week, wIndex) => (
            <div key={wIndex} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.dateStr}
                  onMouseEnter={() => setHoveredDay({ date: day.dateStr, seconds: day.seconds })}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-3 h-3 rounded-[3px] border transition-transform hover:scale-125 cursor-pointer ${getColor(
                    day.seconds
                  )}`}
                  title={`${day.dateStr}: ${formatStudyTime(day.seconds)}`}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legend & Hovered Detail */}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-3 px-1">
          <div>
            {hoveredDay ? (
              <span className="text-white font-mono">
                {hoveredDay.date}: <span className="font-bold text-white">{formatStudyTime(hoveredDay.seconds)}</span>
              </span>
            ) : (
              <span className="text-neutral-500">Hover over any day to view study hours</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-neutral-500">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-900 border border-neutral-800" title="0 min" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-700" title="< 30 min" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-500" title="30 min - 1.5 hrs" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-300" title="1.5 hrs - 3 hrs" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-white" title="3+ hrs" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
