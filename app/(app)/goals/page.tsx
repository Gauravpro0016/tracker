"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Target, Plus, Trash2, X, Award, CheckCircle2, TrendingUp, BookOpen, Layers } from "lucide-react";
import { toast } from "sonner";
import { getStorageItem, setStorageItem } from "@/lib/storage";

export default function GoalsPage() {
  const { data: session, status: authStatus } = useSession();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [type, setType] = useState<"daily" | "weekly" | "monthly">("daily");
  const [targetHours, setTargetHours] = useState(2);
  const [filterSubjectId, setFilterSubjectId] = useState<string>("all");

  // Fetch Subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects", session?.user?.email || (authStatus === "loading" ? "loading" : "guest")],
    enabled: authStatus !== "loading",
    queryFn: async () => {
      if (!session?.user) {
        return getStorageItem<any[]>("focusdesk-guest-subjects", [
          { _id: "s1", name: "Deep Work", color: "#ffffff", icon: "book" },
          { _id: "s2", name: "Coding", color: "#3b82f6", icon: "code" },
          { _id: "s3", name: "Reading", color: "#10b981", icon: "book" },
        ]);
      }
      const res = await fetch("/api/subjects");
      if (!res.ok) return [];
      return res.json();
    },
  });

  // Fetch Goals with Subject Progress
  const { data = { goals: [], progressByPeriod: { daily: 0, weekly: 0, monthly: 0 } }, isLoading } = useQuery({
    queryKey: ["goals", session?.user?.email || (authStatus === "loading" ? "loading" : "guest")],
    enabled: authStatus !== "loading",
    queryFn: async () => {
      if (!session?.user) {
        const guestSessions = getStorageItem<any[]>("focusdesk-guest-sessions", []);
        const defaults = {
          goals: [
            { _id: "g1", title: "Daily Deep Work", subjectId: null, type: "daily", targetHours: 3 },
            { _id: "g2", title: "Weekly Coding Sprint", subjectId: "s2", type: "weekly", targetHours: 10 },
            { _id: "g3", title: "Monthly Focus", subjectId: null, type: "monthly", targetHours: 60 },
          ],
        };
        const local = getStorageItem("focusdesk-guest-goals", defaults);

        const now = new Date();
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Dynamically calculate progress from guest sessions
        const goalsWithProgress = (local.goals || []).map((g: any) => {
          let since = todayStart;
          if (g.type === "weekly") since = weekStart;
          if (g.type === "monthly") since = monthStart;

          const matching = guestSessions.filter((s: any) => {
            const sDate = new Date(s.startedAt || s.createdAt);
            if (sDate < since) return false;
            if (g.subjectId) {
              const subId = typeof g.subjectId === "object" ? g.subjectId?._id : g.subjectId;
              return s.subjectId && s.subjectId === subId;
            }
            return true;
          });

          const totalSeconds = matching.reduce((sum: number, s: any) => sum + (s.durationSeconds || 0), 0);
          const currentHours = Number((totalSeconds / 3600).toFixed(2));
          const percent = Math.min(100, Math.round((currentHours / g.targetHours) * 100));
          const remainingHours = Number(Math.max(0, g.targetHours - currentHours).toFixed(1));

          return {
            ...g,
            currentHours,
            percent,
            remainingHours,
          };
        });

        return { goals: goalsWithProgress, progressByPeriod: { daily: 0, weekly: 0, monthly: 0 } };
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
      toast.success("Goal created and synced with subject!");
      setShowAddModal(false);
      setTitle("");
      setSelectedSubjectId(null);
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
      subjectId: selectedSubjectId || null,
      type,
      targetHours: Number(targetHours),
    });
  };

  const rawGoals = data.goals || [];
  const filteredGoals = rawGoals.filter((g: any) => {
    if (filterSubjectId === "all") return true;
    if (filterSubjectId === "general") return !g.subjectId;
    const subId = typeof g.subjectId === "object" ? g.subjectId?._id : g.subjectId;
    return subId === filterSubjectId;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Study Goals & Targets</h1>
          <p className="text-xs text-neutral-400">
            Set hour targets synced directly with your subjects to track your study ambitions
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all shadow-md flex items-center gap-1.5 self-start sm:self-center shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Target</span>
        </button>
      </div>

      {/* Subject Filter Pills */}
      {subjects.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto touch-pan-x overscroll-x-contain pb-1 select-none text-xs">
          <span className="text-neutral-500 font-medium text-[11px] uppercase tracking-wider mr-1 shrink-0">Filter:</span>
          <button
            onClick={() => setFilterSubjectId("all")}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
              filterSubjectId === "all"
                ? "bg-white text-black border-white font-bold"
                : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            All Targets ({rawGoals.length})
          </button>
          <button
            onClick={() => setFilterSubjectId("general")}
            className={`px-3 py-1.5 rounded-xl border transition-all shrink-0 ${
              filterSubjectId === "general"
                ? "bg-white text-black border-white font-bold"
                : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            General / All Subjects
          </button>
          {subjects.map((s: any) => {
            const count = rawGoals.filter((g: any) => {
              const subId = typeof g.subjectId === "object" ? g.subjectId?._id : g.subjectId;
              return subId === s._id;
            }).length;

            return (
              <button
                key={s._id}
                onClick={() => setFilterSubjectId(s._id)}
                className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 shrink-0 ${
                  filterSubjectId === s._id
                    ? "bg-white text-black border-white font-bold"
                    : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: s.color || "#ffffff" }}
                />
                <span>{s.name}</span>
                {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGoals.map((goal: any) => {
          const isDone = (goal.percent || 0) >= 100;
          const strokeDashoffset = 251.2 - (251.2 * Math.min(100, goal.percent || 0)) / 100;

          // Resolve subject info
          const subject =
            typeof goal.subjectId === "object" && goal.subjectId !== null
              ? goal.subjectId
              : subjects.find((s: any) => s._id === goal.subjectId);

          return (
            <div
              key={goal._id}
              className="p-5 sm:p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl flex flex-col justify-between relative group hover:border-neutral-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Time Horizon Pill */}
                    <span className="text-[10px] uppercase font-bold text-neutral-400 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 tracking-wider">
                      {goal.type}
                    </span>

                    {/* Subject Sync Badge */}
                    {subject ? (
                      <span
                        className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5"
                        style={{
                          backgroundColor: `${subject.color || "#ffffff"}15`,
                          color: subject.color || "#ffffff",
                          border: `1px solid ${subject.color || "#ffffff"}30`,
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: subject.color || "#ffffff" }}
                        />
                        <span className="truncate max-w-[120px]">{subject.name}</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-neutral-500 px-2 py-0.5 rounded-full bg-neutral-900/60 border border-neutral-800/80">
                        All Subjects
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => deleteGoalMutation.mutate(goal._id)}
                    className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 transition-opacity shrink-0"
                    title="Delete target"
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
                      className="stroke-current transition-all duration-1000 ease-out"
                      style={{ color: subject?.color || "#ffffff" }}
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
                    {goal.remainingHours !== undefined ? goal.remainingHours : Math.max(0, Number((goal.targetHours - (goal.currentHours || 0)).toFixed(1)))}h left
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredGoals.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-neutral-500 bg-neutral-950/40 border border-dashed border-neutral-800 rounded-3xl">
            {filterSubjectId === "all"
              ? 'No study goals set. Click "+ New Target" to define your study targets!'
              : "No targets created for this subject yet."}
          </div>
        )}
      </div>

      {/* Modal: Add Goal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
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
                  placeholder="e.g. Master Calculus Limits"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              {/* Sync With Subject */}
              <div>
                <label className="text-xs text-neutral-400 block mb-1 flex items-center justify-between">
                  <span>Sync with Subject</span>
                  <span className="text-[10px] text-neutral-500">Auto-tracks matching study sessions</span>
                </label>
                <select
                  value={selectedSubjectId || ""}
                  onChange={(e) => setSelectedSubjectId(e.target.value ? e.target.value : null)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                >
                  <option value="">All Subjects (General Focus)</option>
                  {subjects.map((s: any) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
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
