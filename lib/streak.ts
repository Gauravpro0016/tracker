// Timezone-aware streak calculation helper
export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  todayStudiedSeconds: number;
  todayQualified: boolean;
  dailyMinimumMinutes: number;
  historyMap: Record<string, number>; // dateString -> totalSeconds
}

export function calculateStreaks(
  sessions: Array<{ startedAt: Date | string; durationSeconds: number }>,
  userTimezone: string = "UTC",
  dailyMinimumMinutes: number = 15
): StreakResult {
  const dailyMinimumSeconds = dailyMinimumMinutes * 60;
  const historyMap: Record<string, number> = {};

  // Group seconds by date string (YYYY-MM-DD) according to timezone
  sessions.forEach((session) => {
    const d = new Date(session.startedAt);
    if (isNaN(d.getTime())) return;

    // Format date in specified timezone
    const dateStr = d.toLocaleDateString("en-CA", { timeZone: userTimezone }); // YYYY-MM-DD
    historyMap[dateStr] = (historyMap[dateStr] || 0) + (session.durationSeconds || 0);
  });

  // Determine today and yesterday in user's timezone
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-CA", { timeZone: userTimezone });

  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = yesterdayDate.toLocaleDateString("en-CA", { timeZone: userTimezone });

  const todayStudiedSeconds = historyMap[todayStr] || 0;
  const todayQualified = todayStudiedSeconds >= dailyMinimumSeconds;

  // Active study dates: any day where user logged at least 5 seconds of focus
  const studyDates = Object.keys(historyMap)
    .filter((dateStr) => historyMap[dateStr] >= 5)
    .sort(); // ascending order: e.g. "2026-11-01", "2026-11-02"

  const studySet = new Set(studyDates);
  const totalStudyDays = studyDates.length;

  const hasStudiedToday = studySet.has(todayStr);
  const hasStudiedYesterday = studySet.has(yesterdayStr);

  let currentStreak = 0;

  if (hasStudiedToday) {
    // Today counts towards active streak!
    currentStreak = 1;
    // Walk back day by day from yesterday
    let prev = new Date(yesterdayDate);
    while (true) {
      const prevStr = prev.toLocaleDateString("en-CA", { timeZone: userTimezone });
      if (studySet.has(prevStr)) {
        currentStreak++;
        prev = new Date(prev.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  } else if (hasStudiedYesterday) {
    // Yesterday was a study day, today is currently in progress (grace period)
    currentStreak = 1;
    let prev = new Date(yesterdayDate.getTime() - 24 * 60 * 60 * 1000);
    while (true) {
      const prevStr = prev.toLocaleDateString("en-CA", { timeZone: userTimezone });
      if (studySet.has(prevStr)) {
        currentStreak++;
        prev = new Date(prev.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak across history
  let longestStreak = 0;
  if (studyDates.length > 0) {
    let currentRun = 1;
    longestStreak = 1;

    for (let i = 1; i < studyDates.length; i++) {
      const prevDate = new Date(studyDates[i - 1] + "T00:00:00Z");
      const currDate = new Date(studyDates[i] + "T00:00:00Z");
      const diffDays = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentRun++;
        if (currentRun > longestStreak) {
          longestStreak = currentRun;
        }
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  return {
    currentStreak,
    longestStreak,
    totalStudyDays,
    todayStudiedSeconds,
    todayQualified,
    dailyMinimumMinutes,
    historyMap,
  };
}
