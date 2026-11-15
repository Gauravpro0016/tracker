"use client";

import React, { useState } from "react";
import { PlusCircle, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getStorageItem, setStorageItem } from "@/lib/storage";

interface Subject {
  _id?: string;
  name: string;
  color: string;
}

interface ManualSessionModalProps {
  subjects: Subject[];
}

function ManualSessionModal({ subjects }: ManualSessionModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [subjectId, setSubjectId] = useState<string>("");
  const [task, setTask] = useState("");
  const [notes, setNotes] = useState("");

  const manualSessionMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (session?.user) {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to log manual session");
        }
        return res.json();
      } else {
        // Save to localStorage for guest
        const existing = getStorageItem<any[]>("focusdesk-guest-sessions", []);
        existing.unshift({
          ...payload,
          id: `local-session-${Date.now()}`,
          createdAt: new Date().toISOString(),
        });
        setStorageItem("focusdesk-guest-sessions", existing);
        return payload;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
      toast.success("Study session logged successfully!");
      setIsOpen(false);
      setTask("");
      setNotes("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Could not log study session");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const durationSeconds = hours * 3600 + minutes * 60;
    if (durationSeconds <= 0) {
      toast.error("Please enter a valid study duration");
      return;
    }

    const startedAt = new Date(`${date}T10:00:00Z`);
    const endedAt = new Date(startedAt.getTime() + durationSeconds * 1000);

    manualSessionMutation.mutate({
      subjectId: subjectId || null,
      task: task || "Manual Study Session",
      mode: "stopwatch",
      durationSeconds,
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      notes,
    });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 text-xs font-medium transition-colors shrink-0"
        title="Log Offline Study"
      >
        <PlusCircle className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
        <span className="hidden sm:inline">Log Offline Study</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-neutral-950 border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-2xl relative text-white">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <h3 className="text-base font-bold tracking-tight">Log Manual Study Time</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Study Date</label>
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
                  <label className="text-xs text-neutral-400 block mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Subject / Label</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-white"
                >
                  <option value="">No Subject (General)</option>
                  {subjects.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1">Topic / Task Title</label>
                <input
                  type="text"
                  value={task}
                  onChange={(e) => setTask(e.target.value)}
                  placeholder="e.g. Calculus Derivatives practice"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={manualSessionMutation.isPending}
                  className="px-5 py-2 bg-white text-black font-bold text-xs rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  {manualSessionMutation.isPending ? "Saving..." : "Log Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default React.memo(ManualSessionModal);

