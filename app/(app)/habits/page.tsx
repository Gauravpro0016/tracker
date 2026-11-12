"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckSquare,
  Plus,
  Check,
  Trash2,
  X,
  Flame,
  Sparkles,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { getStorageItem, setStorageItem } from "@/lib/storage";

export default function HabitsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [habitName, setHabitName] = useState("");
  const [category, setCategory] = useState("Study");
  const [targetDays, setTargetDays] = useState(7);
  const [habitColor, setHabitColor] = useState("#ffffff");

  // Calculate current week dates (Monday to Sunday)
  const now = new Date();
  const currentDay = now.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = (currentDay + 6) % 7;
  const monday = new Date(now.getTime() - distanceToMonday * 24 * 60 * 60 * 1000);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
    return {
      name: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
      dateStr: d.toISOString().split("T")[0],
      dayNumber: d.getDate(),
      isToday: d.toISOString().split("T")[0] === now.toISOString().split("T")[0],
    };
  });

  const startDate = weekDays[0].dateStr;
  const endDate = weekDays[6].dateStr;

  // Query habits & logs
  const { data = { habits: [], logs: [] }, isLoading } = useQuery({
    queryKey: ["habits", startDate, endDate],
    queryFn: async () => {
      if (!session?.user) {
        const defaults = {
          habits: [
            { _id: "h1", name: "Read 20 pages", category: "Reading", targetDaysPerWeek: 7, color: "#3b82f6" },
            { _id: "h2", name: "Review Flashcards", category: "Memory", targetDaysPerWeek: 5, color: "#10b981" },
            { _id: "h3", name: "Solve 5 LeetCode problems", category: "Coding", targetDaysPerWeek: 6, color: "#f59e0b" },
          ],
          logs: [],
        };
        return getStorageItem("focusdesk-guest-habits", defaults);
      }
      const res = await fetch(`/api/habits?startDate=${startDate}&endDate=${endDate}`);
      if (!res.ok) throw new Error("Failed to fetch habits");
      return res.json();
    },
  });

  // Create Habit Mutation
  const createHabitMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (session?.user) {
        const res = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create habit");
        return res.json();
      } else {
        const currentData = getStorageItem<{ habits: any[]; logs: any[] }>("focusdesk-guest-habits", { habits: [], logs: [] });
        const newH = { ...payload, _id: `habit-${Date.now()}` };
        currentData.habits.push(newH);
        setStorageItem("focusdesk-guest-habits", currentData);
        return newH;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habit created!");
      setShowAddModal(false);
      setHabitName("");
    },
  });

  // Toggle Day Completion
  const toggleHabitMutation = useMutation({
    mutationFn: async ({ habitId, date, completed }: { habitId: string; date: string; completed: boolean }) => {
      if (session?.user) {
        await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "log", habitId, date, completed: !completed }),
        });
      } else {
        const currentData = getStorageItem<{ habits: any[]; logs: any[] }>("focusdesk-guest-habits", { habits: [], logs: [] });
        const existingIdx = currentData.logs.findIndex((l: any) => l.habitId === habitId && l.date === date);
        if (existingIdx >= 0) {
          currentData.logs[existingIdx].completed = !completed;
        } else {
          currentData.logs.push({ habitId, date, completed: true });
        }
        setStorageItem("focusdesk-guest-habits", currentData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
    },
  });

  // Delete Habit
  const deleteHabitMutation = useMutation({
    mutationFn: async (id: string) => {
      if (session?.user) {
        await fetch(`/api/habits/${id}`, { method: "DELETE" });
      } else {
        const currentData = getStorageItem<{ habits: any[]; logs: any[] }>("focusdesk-guest-habits", { habits: [], logs: [] });
        currentData.habits = currentData.habits.filter((h: any) => h._id !== id);
        currentData.logs = currentData.logs.filter((l: any) => l.habitId !== id);
        setStorageItem("focusdesk-guest-habits", currentData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits"] });
      toast.success("Habit removed");
    },
  });

  const habits = data.habits || [];
  const logs = data.logs || [];

  const isCompleted = (habitId: string, dateStr: string) => {
    return logs.some((l: any) => l.habitId === habitId && l.date === dateStr && l.completed);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    createHabitMutation.mutate({
      name: habitName.trim(),
      category,
      targetDaysPerWeek: Number(targetDays),
      color: habitColor,
    });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Habit Tracker</h1>
          <p className="text-xs text-neutral-400">Build daily learning rituals and maintain study streaks</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-center shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Habit Grid Card */}
      <div className="p-4 sm:p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl overflow-x-auto touch-pan-x overscroll-x-contain">
        <div className="min-w-[620px]">
          {/* Header row: Habit Title + Mon-Sun column headers */}
          <div className="grid grid-cols-12 gap-2 pb-3 mb-3 border-b border-neutral-800 text-xs font-bold text-neutral-400">
            <div className="col-span-5 uppercase tracking-wider text-[11px]">Habit Routine</div>
            {weekDays.map((d) => (
              <div
                key={d.dateStr}
                className={`col-span-1 text-center flex flex-col items-center ${
                  d.isToday ? "text-white" : ""
                }`}
              >
                <span className="text-[10px] uppercase">{d.name}</span>
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs mt-0.5 ${
                    d.isToday ? "bg-white text-black font-bold" : "text-neutral-400"
                  }`}
                >
                  {d.dayNumber}
                </span>
              </div>
            ))}
          </div>

          {/* Habit rows */}
          <div className="space-y-2.5">
            {habits.length === 0 ? (
              <div className="text-center py-12 text-xs text-neutral-500">
                No habits yet. Click "+ New Habit" to create your daily study routines!
              </div>
            ) : (
              habits.map((habit: any) => {
                const completedThisWeek = weekDays.filter((d) =>
                  isCompleted(habit._id, d.dateStr)
                ).length;
                const isTargetReached = completedThisWeek >= (habit.targetDaysPerWeek || 7);

                return (
                  <div
                    key={habit._id}
                    className="grid grid-cols-12 gap-2 items-center p-3 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900/70 border border-neutral-800/80 transition-all text-xs"
                  >
                    {/* Left details */}
                    <div className="col-span-5 flex items-center justify-between pr-3 group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: habit.color || "#ffffff" }}
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-white truncate text-xs sm:text-sm">
                            {habit.name}
                          </p>
                          <p className="text-[10px] text-neutral-500 truncate">
                            {habit.category} • {completedThisWeek}/{habit.targetDaysPerWeek || 7} days
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteHabitMutation.mutate(habit._id)}
                        className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity shrink-0"
                        title="Delete habit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 7 Checkbox days */}
                    {weekDays.map((d) => {
                      const done = isCompleted(habit._id, d.dateStr);
                      return (
                        <div key={d.dateStr} className="col-span-1 flex justify-center">
                          <button
                            onClick={() =>
                              toggleHabitMutation.mutate({
                                habitId: habit._id,
                                date: d.dateStr,
                                completed: done,
                              })
                            }
                            className={`w-7 h-7 rounded-xl border flex items-center justify-center transition-all active:scale-95 ${
                              done
                                ? "bg-white border-white text-black shadow-sm"
                                : "bg-neutral-950 border-neutral-800 hover:border-neutral-600 text-transparent"
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal: Add Habit */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-base">New Study Habit</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Habit Name</label>
                <input
                  type="text"
                  required
                  value={habitName}
                  onChange={(e) => setHabitName(e.target.value)}
                  placeholder="e.g. Solve 3 Practice Problems"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Category</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Mathematics, Reading, Coding"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Target Days Per Week</label>
                <select
                  value={targetDays}
                  onChange={(e) => setTargetDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                >
                  {[7, 6, 5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} days a week
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1.5">Color Accent</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {["#ffffff", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setHabitColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        habitColor === color ? "scale-110 border-white" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createHabitMutation.isPending}
                  className="px-5 py-2 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

