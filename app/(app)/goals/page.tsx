"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Plus, Trash2, X, Award, CheckCircle2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { getStorageItem, setStorageItem } from "@/lib/storage";

export default function GoalsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [targetHours, setTargetHours] = useState(2);

  // Fetch Goals
  const { data = { goals: [], progressByPeriod: { daily: 0, weekly: 0, monthly: 0 } }, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => {
      if (!session?.user) {
        const defaults = {
          goals: [
            { _id: "g1", title: "Daily Deep Work", type: "daily", targetHours: 3, currentHours: 2, percent: 67 },
            { _id: "g2", title: "Weekly Mastery", type: "weekly", targetHours: 18, currentHours: 12.5, percent: 69 },
            { _id: "g3", title: "Monthly Focus", type: "monthly", targetHours: 80, currentHours: 45, percent: 56 },
          ],
          progressByPeriod: { daily: 2, weekly: 12.5, monthly: 45 },
        };
        return getStorageItem("focusdesk-guest-goals", defaults);
      }
      const res = await fetch("/api/goals");
      if (!res.ok) throw new Error("Failed to load goals");
      return res.json();
    },
  });

  const createGoalMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (session?.user) {
        const res = await fetch("/api/goals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create goal");
        return res.json();
      } else {
        const local = getStorageItem<{ goals: any[] }>("focusdesk-guest-goals", { goals: [] });
        const newG = {
          ...payload,
          _id: `goal-${Date.now()}`,
          currentHours: 0,
          percent: 0,
        };
        local.goals.push(newG);
        setStorageItem("focusdesk-guest-goals", local);
        return newG;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal created!");
      setShowAddModal(false);
      setTitle("");
    },
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      if (session?.user) {
        await fetch(`/api/goals/${id}`, { method: "DELETE" });
      } else {
        const local = getStorageItem<{ goals: any[] }>("focusdesk-guest-goals", { goals: [] });
        local.goals = local.goals.filter((g: any) => g._id !== id);
        setStorageItem("focusdesk-guest-goals", local);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast.success("Goal removed");
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetHours <= 0) return;
    createGoalMutation.mutate({
      title: title.trim(),
      type,
      targetHours: Number(targetHours),
    });
  };

  const goals = data.goals || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Study Goals & Targets</h1>
          <p className="text-xs text-neutral-400">Set daily, weekly, and monthly hour targets to hold yourself accountable</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Target</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal: any) => {
          const isDone = (goal.percent || 0) >= 100;
          const strokeDashoffset = 251.2 - (251.2 * Math.min(100, goal.percent || 0)) / 100;

          return (
            <div
              key={goal._id}
              className="p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl flex flex-col justify-between relative group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] uppercase font-bold text-neutral-400 px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 tracking-wider">
                    {goal.type} Target
                  </span>
                  <button
                    onClick={() => deleteGoalMutation.mutate(goal._id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity"
                    title="Delete goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{goal.title}</h3>
                <p className="text-xs text-neutral-400">
                  Target: {goal.targetHours} hours per {goal.type === "daily" ? "day" : goal.type === "weekly" ? "week" : "month"}
                </p>
              </div>

              {/* Progress Ring */}
              <div className="my-6 flex items-center justify-center">
                <div className="relative w-36 h-36 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-neutral-900 stroke-current"
                      strokeWidth="8"
                      fill="transparent"
                    />
                    {/* Progress circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      className="text-white stroke-current transition-all duration-1000 ease-out"
                      strokeWidth="8"
                      strokeDasharray="251.2"
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-2xl font-black font-mono text-white">
                      {goal.percent || 0}%
                    </span>
                    <span className="text-[10px] text-neutral-400 uppercase tracking-wider">
                      Complete
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Details */}
              <div className="pt-3 border-t border-neutral-800/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-neutral-500 text-[11px] block">Current Progress</span>
                  <span className="font-mono font-bold text-white">
                    {goal.currentHours || 0} / {goal.targetHours} hrs
                  </span>
                </div>
                {isDone ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Achieved!
                  </span>
                ) : (
                  <span className="text-neutral-400 font-mono text-xs">
                    {Math.max(0, Number((goal.targetHours - (goal.currentHours || 0)).toFixed(1)))}h left
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {goals.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-neutral-500">
            No study goals set. Click "+ New Target" to define your study ambitions!
          </div>
        )}
      </div>

      {/* Modal: Add Goal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-base">Create Study Target</h3>
              <button onClick={() => setShowAddModal(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Daily Deep Work Sprint"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Time Horizon</label>
                <select
                  value={type}
                  onChange={(e: any) => setType(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                >
                  <option value="daily">Daily Target</option>
                  <option value="weekly">Weekly Target</option>
                  <option value="monthly">Monthly Target</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Target Hours</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="300"
                  required
                  value={targetHours}
                  onChange={(e) => setTargetHours(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white font-mono"
                />
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
                  disabled={createGoalMutation.isPending}
                  className="px-5 py-2 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200"
                >
                  Save Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

