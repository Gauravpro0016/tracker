import { getStorageItem, setStorageItem } from "@/lib/storage";
import { formatDurationHuman } from "@/lib/utils";
import { toast } from "sonner";

export interface StudySessionPayload {
  subjectId?: string | null;
  task: string;
  mode: "stopwatch" | "countdown" | "pomodoro";
  durationSeconds: number;
  startedAt: string;
  endedAt: string;
  notes?: string;
}

export async function saveStudySession(
  sessionData: StudySessionPayload,
  queryClient?: any
): Promise<void> {
  let savedToServer = false;

  try {
    const res = await fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sessionData),
    });

    if (res.ok) {
      savedToServer = true;
    }
  } catch (err) {
    // Guest mode, offline, or network error
  }

  if (!savedToServer) {
    const existing = getStorageItem<any[]>("focusdesk-guest-sessions", []);
    existing.unshift({
      ...sessionData,
      id: `local-session-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    setStorageItem("focusdesk-guest-sessions", existing);
  }

  if (queryClient) {
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    queryClient.invalidateQueries({ queryKey: ["streak"] });
    queryClient.refetchQueries({ queryKey: ["streak"] });
    queryClient.refetchQueries({ queryKey: ["analytics"] });
  }

  const durationStr = formatDurationHuman(sessionData.durationSeconds);
  toast.success(`Study session saved! (+${durationStr} added to studied)`);
}

/**
 * Uploads any offline/guest sessions to MongoDB Atlas once the user is authenticated.
 */
export async function syncGuestSessionsToServer(queryClient?: any): Promise<number> {
  if (typeof window === "undefined") return 0;
  const guestSessions = getStorageItem<any[]>("focusdesk-guest-sessions", []);
  if (!guestSessions || guestSessions.length === 0) return 0;

  let syncedCount = 0;
  const remaining: any[] = [];

  for (const session of guestSessions) {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: session.subjectId || null,
          task: session.task || "Study Session",
          mode: session.mode || "stopwatch",
          durationSeconds: session.durationSeconds || 60,
          startedAt: session.startedAt || new Date().toISOString(),
          endedAt: session.endedAt || new Date().toISOString(),
          notes: session.notes || "",
        }),
      });

      if (res.ok) {
        syncedCount++;
      } else {
        remaining.push(session);
      }
    } catch {
      remaining.push(session);
    }
  }

  setStorageItem("focusdesk-guest-sessions", remaining);

  if (syncedCount > 0 && queryClient) {
    queryClient.invalidateQueries({ queryKey: ["sessions"] });
    queryClient.invalidateQueries({ queryKey: ["analytics"] });
    queryClient.invalidateQueries({ queryKey: ["streak"] });
    queryClient.refetchQueries({ queryKey: ["streak"] });
    queryClient.refetchQueries({ queryKey: ["analytics"] });
  }

  return syncedCount;
}
