"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar as CalendarIcon,
  Plus,
  Play,
  CheckCircle2,
  Trash2,
  Clock,
  Tag,
  AlertCircle,
  X,
  List,
  Grid3X3,
  Flame,
} from "lucide-react";
import { useTimerStore } from "@/store/timerStore";
import { toast } from "sonner";
import { getStorageItem, setStorageItem } from "@/lib/storage";

export default function PlannerPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { setSubjectId, setTask } = useTimerStore();

  const [viewMode, setViewMode] = useState<"list" | "week">("list");
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [showAddExam, setShowAddExam] = useState(false);

  // New Plan form state
  const [title, setTitle] = useState("");
  const [subjectId, setFormSubjectId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:30");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [recurring, setRecurring] = useState<"none" | "daily" | "weekly">("none");
  const [notes, setNotes] = useState("");

  // New Exam form state
  const [examTitle, setExamTitle] = useState("");
  const [examSubjectId, setExamSubjectId] = useState("");
  const [examDate, setExamDate] = useState("");
  const [targetScore, setTargetScore] = useState("");

  // Fetch Planner data
  const { data: plannerData = { items: [], exams: [] }, isLoading } = useQuery({
    queryKey: ["planner"],
    queryFn: async () => {
      if (!session?.user) {
        return getStorageItem("focusdesk-guest-planner", { items: [], exams: [] });
      }
      const res = await fetch("/api/planner");
      if (!res.ok) throw new Error("Failed to fetch planner items");
      return res.json();
    },
  });

  // Fetch subjects
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: async () => {
      if (!session?.user) return [];
      const res = await fetch("/api/subjects");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!session?.user,
  });

  // Mutations
  const createPlanMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (session?.user) {
        const res = await fetch("/api/planner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error("Failed to create study block");
        return res.json();
      } else {
        const local = getStorageItem<{ items: any[]; exams: any[] }>("focusdesk-guest-planner", { items: [], exams: [] });
        const newItem = { ...payload, _id: `local-plan-${Date.now()}` };
        local.items.push(newItem);
        setStorageItem("focusdesk-guest-planner", local);
        return newItem;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner"] });
      toast.success("Study block added");
      setShowAddPlan(false);
      setTitle("");
      setNotes("");
    },
  });

  const createExamMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (session?.user) {
        const res = await fetch("/api/planner", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, type: "exam" }),
        });
        if (!res.ok) throw new Error("Failed to add exam countdown");
        return res.json();
      } else {
        const local = getStorageItem<{ items: any[]; exams: any[] }>("focusdesk-guest-planner", { items: [], exams: [] });
        const newExam = { ...payload, _id: `local-exam-${Date.now()}` };
        local.exams.push(newExam);
        setStorageItem("focusdesk-guest-planner", local);
        return newExam;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner"] });
      toast.success("Exam countdown added");
      setShowAddExam(false);
      setExamTitle("");
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const nextStatus = currentStatus === "done" ? "pending" : "done";
      if (session?.user) {
        await fetch(`/api/planner/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: nextStatus }),
        });
      } else {
        const local = getStorageItem<{ items: any[]; exams: any[] }>("focusdesk-guest-planner", { items: [], exams: [] });
        local.items = local.items.map((it: any) => (it._id === id ? { ...it, status: nextStatus } : it));
        setStorageItem("focusdesk-guest-planner", local);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner"] });
    },
  });

  const deletePlanMutation = useMutation({
    mutationFn: async (id: string) => {
      if (session?.user) {
        await fetch(`/api/planner/${id}`, { method: "DELETE" });
      } else {
        const local = getStorageItem<{ items: any[]; exams: any[] }>("focusdesk-guest-planner", { items: [], exams: [] });
        local.items = local.items.filter((it: any) => it._id !== id);
        setStorageItem("focusdesk-guest-planner", local);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner"] });
    },
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: string) => {
      if (session?.user) {
        await fetch(`/api/planner/${id}?type=exam`, { method: "DELETE" });
      } else {
        const local = getStorageItem<{ items: any[]; exams: any[] }>("focusdesk-guest-planner", { items: [], exams: [] });
        local.exams = local.exams.filter((it: any) => it._id !== id);
        setStorageItem("focusdesk-guest-planner", local);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["planner"] });
    },
  });

  // Handler: Start timer from plan
  const handleStartTimerFromPlan = (item: any) => {
    if (item.subjectId?._id || item.subjectId) {
      setSubjectId(item.subjectId?._id || item.subjectId);
    }
    setTask(item.title);
    router.push("/");
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    createPlanMutation.mutate({
      title,
      subjectId: subjectId || null,
      date,
      startTime,
      endTime,
      priority,
      status: "pending",
      recurring,
      notes,
    });
  };

  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    createExamMutation.mutate({
      title: examTitle,
      subjectId: examSubjectId || null,
      examDate,
      targetScore,
    });
  };

  const items = plannerData.items || [];
  const exams = plannerData.exams || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16 animate-fade-in text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Study Planner</h1>
          <p className="text-xs text-neutral-400">Schedule your deep work blocks and track exam deadlines</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* View toggle */}
          <div className="flex items-center p-1 bg-neutral-900 border border-neutral-800 rounded-xl">
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "list" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode("week")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                viewMode === "week" ? "bg-white text-black" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Week</span>
            </button>
          </div>

          <button
            onClick={() => setShowAddExam(true)}
            className="px-3 py-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-colors shrink-0"
          >
            + Exam
          </button>

          <button
            onClick={() => setShowAddPlan(true)}
            className="px-3.5 sm:px-4 py-2 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Plan Block</span>
          </button>
        </div>
      </div>

      {/* Exam Countdown Cards Section */}
      {exams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {exams.map((exam: any) => {
            const diffTime = new Date(exam.examDate).getTime() - Date.now();
            const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const isUrgent = daysLeft <= 7;

            return (
              <div
                key={exam._id}
                className="p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        isUrgent ? "text-rose-400" : "text-amber-400"
                      }`}
                    >
                      Exam Countdown
                    </span>
                    <button
                      onClick={() => deleteExamMutation.mutate(exam._id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <h3 className="font-bold text-white text-sm mt-1">{exam.title}</h3>
                  <p className="text-[11px] text-neutral-400">
                    {new Date(exam.examDate).toLocaleDateString()}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-neutral-800/80 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black font-mono text-white">
                      {daysLeft > 0 ? daysLeft : 0}
                    </span>
                    <span className="text-xs text-neutral-400 font-sans ml-1">days left</span>
                  </div>
                  {exam.targetScore && (
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Goal: {exam.targetScore}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Study Plan View */}
      {viewMode === "list" ? (
        <div className="p-4 sm:p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-neutral-800">
            <h2 className="text-sm font-bold text-white">Scheduled Study Blocks</h2>
            <span className="text-xs text-neutral-500 font-mono">{items.length} items</span>
          </div>

          <div className="space-y-2.5">
            {items.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-500">
                No study blocks scheduled yet. Click "+ Plan Block" above to schedule!
              </div>
            ) : (
              items.map((item: any) => {
                const isDone = item.status === "done";
                return (
                  <div
                    key={item._id}
                    className="p-3 sm:p-3.5 rounded-2xl bg-neutral-900/40 hover:bg-neutral-900/80 border border-neutral-800/80 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() =>
                          toggleStatusMutation.mutate({
                            id: item._id,
                            currentStatus: item.status,
                          })
                        }
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                          isDone
                            ? "bg-white border-white text-black"
                            : "border-neutral-700 hover:border-neutral-500"
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-4 h-4" />}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-semibold text-xs sm:text-sm truncate ${
                              isDone ? "line-through text-neutral-500" : "text-white"
                            }`}
                          >
                            {item.title}
                          </span>
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-md uppercase font-bold tracking-wider shrink-0 ${
                              item.priority === "high"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : item.priority === "medium"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-neutral-800 text-neutral-400"
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 flex items-center gap-2 mt-0.5 flex-wrap">
                          <span>{item.date}</span>
                          <span>•</span>
                          <span className="font-mono">
                            {item.startTime} - {item.endTime}
                          </span>
                          {item.subjectId && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: item.subjectId.color || "#fff" }}
                                />
                                <span className="truncate max-w-[120px]">{item.subjectId.name}</span>
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                      <button
                        onClick={() => handleStartTimerFromPlan(item)}
                        className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shadow"
                        title="Start timer with this subject and task"
                      >
                        <Play className="w-3.5 h-3.5 fill-black shrink-0" />
                        <span className="hidden sm:inline">Start Timer</span>
                      </button>

                      <button
                        onClick={() => deletePlanMutation.mutate(item._id)}
                        className="p-1.5 text-neutral-500 hover:text-rose-400 rounded-lg transition-colors"
                        title="Delete plan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Week View Grid */
        <div className="p-4 sm:p-6 rounded-3xl bg-neutral-950/70 border border-neutral-800 backdrop-blur-md shadow-xl overflow-x-auto touch-pan-x overscroll-x-contain">
          <div className="grid grid-cols-7 gap-3 min-w-[700px]">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((dayName, idx) => (
              <div key={dayName} className="p-3 rounded-2xl bg-neutral-900/40 border border-neutral-800/60 min-h-[220px]">
                <div className="text-xs font-bold text-neutral-400 pb-2 border-b border-neutral-800/80 mb-2">
                  {dayName}
                </div>
                <div className="space-y-1.5">
                  {items.map((item: any) => (
                    <div
                      key={item._id}
                      onClick={() => handleStartTimerFromPlan(item)}
                      className="p-2 rounded-xl bg-neutral-800/60 hover:bg-neutral-800 text-xs cursor-pointer border border-neutral-700/60 transition-all"
                    >
                      <p className="font-semibold text-white truncate">{item.title}</p>
                      <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
                        {item.startTime}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Add Plan Block */}
      {showAddPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-base">Schedule Study Block</h3>
              <button onClick={() => setShowAddPlan(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Title / Focus Topic</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Physics Thermodynamics review"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setFormSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                >
                  <option value="">No Subject (General)</option>
                  {subjects.map((s: any) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Recurring</label>
                  <select
                    value={recurring}
                    onChange={(e: any) => setRecurring(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddPlan(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createPlanMutation.isPending}
                  className="px-5 py-2 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Exam */}
      {showAddExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <h3 className="font-bold text-base">Add Exam Deadline</h3>
              <button onClick={() => setShowAddExam(false)} className="text-neutral-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="mt-4 space-y-3.5">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder="e.g. MCAT / Final Exam"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Exam Date</label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Target Score (optional)</label>
                <input
                  type="text"
                  value={targetScore}
                  onChange={(e) => setTargetScore(e.target.value)}
                  placeholder="e.g. 95% or A+"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                />
              </div>

              <div className="pt-3 border-t border-neutral-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddExam(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createExamMutation.isPending}
                  className="px-5 py-2 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200"
                >
                  Save Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

