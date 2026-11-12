"use client";

import React, { useState, useEffect } from "react";
import { Plus, Check, Trash2, ListTodo } from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getStorageItem, setStorageItem } from "@/lib/storage";

interface TodoTask {
  _id?: string;
  id?: string;
  text: string;
  completed: boolean;
}

function TimerTodoList() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState("");
  const [localTasks, setLocalTasks] = useState<TodoTask[]>([
    { id: "t1", text: "Read Chapter 4 summary", completed: false },
    { id: "t2", text: "Complete practice problem set 1-10", completed: true },
  ]);

  // Load guest tasks from localStorage
  useEffect(() => {
    if (!session?.user) {
      const stored = getStorageItem<TodoTask[]>("focusdesk-guest-tasks", localTasks);
      setLocalTasks(stored);
    }
  }, [session]);

  const saveLocalTasks = (tasks: TodoTask[]) => {
    setLocalTasks(tasks);
    setStorageItem("focusdesk-guest-tasks", tasks);
  };

  // Server tasks query
  const { data: serverTasks = [] } = useQuery<TodoTask[]>({
    queryKey: ["tasks"],
    queryFn: async () => {
      if (!session?.user) return [];
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
    enabled: !!session?.user,
    staleTime: 60 * 1000,
  });

  const tasks = session?.user ? serverTasks : localTasks;

  // Add Task
  const addTaskMutation = useMutation({
    mutationFn: async (text: string) => {
      if (session?.user) {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error("Failed to add task");
        return res.json();
      } else {
        const newTask: TodoTask = { id: `task-${Date.now()}`, text, completed: false };
        const updated = [newTask, ...localTasks];
        saveLocalTasks(updated);
        return newTask;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setInputText("");
    },
  });

  // Toggle Task
  const toggleTaskMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      if (session?.user) {
        const res = await fetch(`/api/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ completed: !completed }),
        });
        if (!res.ok) throw new Error("Failed to toggle task");
        return res.json();
      } else {
        const updated = localTasks.map((t) =>
          (t._id || t.id) === id ? { ...t, completed: !completed } : t
        );
        saveLocalTasks(updated);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Delete Task
  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      if (session?.user) {
        const res = await fetch(`/api/tasks/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete task");
        return res.json();
      } else {
        const updated = localTasks.filter((t) => (t._id || t.id) !== id);
        saveLocalTasks(updated);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    addTaskMutation.mutate(inputText.trim());
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-8 p-4 sm:p-5 rounded-3xl bg-neutral-950/60 backdrop-blur-md border border-neutral-800/80 shadow-xl text-white">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-800/80">
        <div className="flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-neutral-400" />
          <h3 className="text-xs sm:text-sm font-semibold tracking-tight">Today's Focus Tasks</h3>
        </div>
        <span className="text-[11px] text-neutral-500 font-mono">
          {tasks.filter((t) => t.completed).length} / {tasks.length} Done
        </span>
      </div>

      {/* Task input */}
      <form onSubmit={handleAdd} className="flex items-center gap-2 mb-3">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Add a study task and press enter..."
          className="flex-1 px-3.5 py-2 bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800 focus:border-neutral-500 rounded-xl text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none transition-all"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || addTaskMutation.isPending}
          className="p-2 sm:px-3 sm:py-2 bg-white text-black font-semibold rounded-xl text-xs hover:bg-neutral-200 transition-all disabled:opacity-40"
          title="Add task"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Task list */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {tasks.length === 0 ? (
          <p className="text-center py-4 text-xs text-neutral-500">
            No study tasks yet. Add one above!
          </p>
        ) : (
          tasks.map((task) => {
            const taskId = task._id || task.id || "";
            return (
              <div
                key={taskId}
                className="group flex items-center justify-between p-2 sm:px-3 rounded-xl bg-neutral-900/40 hover:bg-neutral-900/80 border border-neutral-800/60 transition-all text-xs sm:text-sm"
              >
                <button
                  onClick={() =>
                    toggleTaskMutation.mutate({ id: taskId, completed: task.completed })
                  }
                  className="flex items-center gap-2.5 flex-1 text-left min-w-0"
                >
                  <div
                    className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                      task.completed
                        ? "bg-white border-white text-black"
                        : "border-neutral-700 hover:border-neutral-500"
                    }`}
                  >
                    {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span
                    className={`truncate ${
                      task.completed ? "line-through text-neutral-500" : "text-neutral-200"
                    }`}
                  >
                    {task.text}
                  </span>
                </button>

                <button
                  onClick={() => deleteTaskMutation.mutate(taskId)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 rounded transition-all shrink-0 ml-2"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default React.memo(TimerTodoList);

