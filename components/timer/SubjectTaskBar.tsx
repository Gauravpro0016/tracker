"use client";

import React, { useState, useEffect } from "react";
import { Tag, Plus, Check, ChevronDown, BookOpen } from "lucide-react";
import { useTimerStore } from "@/store/timerStore";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getStorageItem, setStorageItem } from "@/lib/storage";

interface Subject {
  _id?: string;
  id?: string;
  name: string;
  color: string;
}

const DEFAULT_GUEST_SUBJECTS: Subject[] = [
  { id: "sub-1", name: "Deep Work", color: "#ffffff" },
  { id: "sub-2", name: "Coding", color: "#3b82f6" },
  { id: "sub-3", name: "Reading", color: "#10b981" },
  { id: "sub-4", name: "Math", color: "#f59e0b" },
];

export default function SubjectTaskBar() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { currentSubjectId, setSubjectId, currentTask, setTask } = useTimerStore();

  const [isOpen, setIsOpen] = useState(false);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectColor, setNewSubjectColor] = useState("#3b82f6");

  // Fetch subjects if logged in, otherwise localStorage
  const { data: serverSubjects = [] } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: async () => {
      if (!session?.user) return [];
      const res = await fetch("/api/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      return res.json();
    },
    enabled: !!session?.user,
  });

  const [localSubjects, setLocalSubjects] = useState<Subject[]>(DEFAULT_GUEST_SUBJECTS);

  useEffect(() => {
    if (!session?.user) {
      setLocalSubjects(getStorageItem("focusdesk-guest-subjects", DEFAULT_GUEST_SUBJECTS));
    }
  }, [session]);

  const subjects = session?.user ? serverSubjects : localSubjects;

  const createSubjectMutation = useMutation({
    mutationFn: async ({ name, color }: { name: string; color: string }) => {
      if (session?.user) {
        const res = await fetch("/api/subjects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, color }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create subject");
        }
        return res.json();
      } else {
        const newSub: Subject = { id: `sub-${Date.now()}`, name, color };
        const updated = [...localSubjects, newSub];
        setLocalSubjects(updated);
        setStorageItem("focusdesk-guest-subjects", updated);
        return newSub;
      }
    },
    onSuccess: (newSub) => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      setSubjectId(newSub._id || newSub.id || null);
      setNewSubjectName("");
      setShowAddSubject(false);
      setIsOpen(false);
      toast.success("Subject added");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to add subject");
    },
  });

  const activeSubject = subjects.find(
    (s) => (s._id || s.id) === currentSubjectId
  );

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    createSubjectMutation.mutate({ name: newSubjectName.trim(), color: newSubjectColor });
  };

  const presetColors = [
    "#ffffff",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ec4899",
    "#8b5cf6",
    "#06b6d4",
    "#ef4444",
  ];

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-2 mt-4 px-2">
      {/* Subject Dropdown */}
      <div className="relative w-full sm:w-auto shrink-0">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full sm:w-auto flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-800 text-xs font-semibold text-white transition-all shadow-sm"
        >
          <div className="flex items-center gap-2 truncate">
            {activeSubject ? (
              <>
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: activeSubject.color }}
                />
                <span className="truncate max-w-[120px]">{activeSubject.name}</span>
              </>
            ) : (
              <>
                <Tag className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-neutral-400">Select Subject</span>
              </>
            )}
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute left-0 mt-2 w-56 p-2 bg-neutral-950/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-2xl z-50 animate-fade-in text-white">
            <div className="text-[10px] uppercase font-bold text-neutral-500 px-2 py-1 tracking-wider">
              Subjects
            </div>

            <button
              onClick={() => {
                setSubjectId(null);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                currentSubjectId === null
                  ? "bg-neutral-800 text-white font-semibold"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-900"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-neutral-600" />
              <span>No Subject (General)</span>
            </button>

            <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
              {subjects.map((sub) => {
                const subId = sub._id || sub.id;
                const isSelected = currentSubjectId === subId;
                return (
                  <button
                    key={subId}
                    onClick={() => {
                      setSubjectId(subId || null);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors ${
                      isSelected
                        ? "bg-neutral-800 text-white font-semibold"
                        : "text-neutral-300 hover:text-white hover:bg-neutral-900"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: sub.color }}
                      />
                      <span className="truncate">{sub.name}</span>
                    </div>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-1 border-t border-neutral-800/80">
              <button
                onClick={() => setShowAddSubject(true)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs text-neutral-400 hover:text-white hover:bg-neutral-900 font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create New Subject</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task Input ("What are you studying?") */}
      <div className="w-full relative flex-1">
        <input
          type="text"
          value={currentTask}
          onChange={(e) => setTask(e.target.value)}
          placeholder="What are you studying right now?"
          className="w-full px-4 py-2.5 bg-neutral-900/60 hover:bg-neutral-900/80 focus:bg-neutral-900 border border-neutral-800 focus:border-neutral-500 rounded-2xl text-xs sm:text-sm text-white placeholder-neutral-500 transition-all focus:outline-none shadow-sm"
        />
      </div>

      {/* Modal: Create Subject */}
      {showAddSubject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xs bg-neutral-950 border border-neutral-800 rounded-2xl p-5 shadow-2xl text-white">
            <h4 className="text-sm font-bold mb-3">Add Study Subject</h4>
            <form onSubmit={handleCreateSubject} className="space-y-3">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Subject Name</label>
                <input
                  type="text"
                  required
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g. Organic Chemistry"
                  className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-white"
                />
              </div>

              <div>
                <label className="text-xs text-neutral-400 block mb-1.5">Color Tag</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {presetColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewSubjectColor(color)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        newSubjectColor === color ? "scale-110 border-white" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubjectMutation.isPending}
                  className="px-4 py-1.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-neutral-200"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

