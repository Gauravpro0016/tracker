"use client";

import React, { useState } from "react";

interface HeatmapCalendarProps {
  historyMap: Record<string, number>; // date YYYY-MM-DD -> durationSeconds
  userTimezone?: string;
}

export default function HeatmapCalendar({ historyMap, userTimezone = "UTC" }: HeatmapCalendarProps) {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; hours: number } | null>(null);

  // Generate 52 weeks (364 days) leading up to today
  const today = new Date();
  const days: Array<{ dateStr: string; hours: number; dayOfWeek: number }> = [];

  for (let i = 363; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toLocaleDateString("en-CA", { timeZone: userTimezone });
    const seconds = historyMap[dateStr] || 0;
    const hours = Number((seconds / 3600).toFixed(1));
    days.push({
      dateStr,
      hours,
      dayOfWeek: d.getDay(), // 0 = Sun, 6 = Sat
    });
  }

  // Chunk into 52 weeks of 7 days
  const weeks: Array<typeof days> = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getColor = (hours: number) => {
    if (hours === 0) return "bg-neutral-900 border-neutral-800/80";
    if (hours < 1) return "bg-neutral-700 border-neutral-600";
    if (hours < 2.5) return "bg-neutral-500 border-neutral-400";
    if (hours < 4) return "bg-neutral-300 border-neutral-200";
    return "bg-white border-white";
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
                  onMouseEnter={() => setHoveredDay({ date: day.dateStr, hours: day.hours })}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`w-3 h-3 rounded-[3px] border transition-transform hover:scale-125 cursor-pointer ${getColor(
                    day.hours
                  )}`}
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
                {hoveredDay.date}: <span className="font-bold">{hoveredDay.hours} hrs</span>
              </span>
            ) : (
              <span className="text-neutral-500">Hover over any day to view study hours</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-neutral-500">
            <span>Less</span>
            <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-900 border border-neutral-800" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-700" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-500" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-neutral-300" />
            <div className="w-2.5 h-2.5 rounded-[2px] bg-white" />
            <span>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

