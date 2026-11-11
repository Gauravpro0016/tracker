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
    // Guest mode or offline fallback
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
  }

  const durationStr = formatDurationHuman(sessionData.durationSeconds);
  toast.success(`Study session saved! (+${durationStr} added to studied)`);
}

