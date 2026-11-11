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

  // Filter qualifying dates
  const qualifyingDates = Object.keys(historyMap)
    .filter((dateStr) => historyMap[dateStr] >= dailyMinimumSeconds)
    .sort(); // ascending order: e.g. "2026-11-01", "2026-11-02"

  const qualifyingSet = new Set(qualifyingDates);
  const totalStudyDays = qualifyingDates.length;

  // Calculate current streak
  let currentStreak = 0;
  let checkDate = new Date(now);

  // If today is qualified, start from today. If not, check if yesterday was qualified
  if (todayQualified) {
    currentStreak = 1;
    // Check backwards from yesterday
    let prev = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    while (true) {
      const prevStr = prev.toLocaleDateString("en-CA", { timeZone: userTimezone });
      if (qualifyingSet.has(prevStr)) {
        currentStreak++;
        prev = new Date(prev.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  } else if (qualifyingSet.has(yesterdayStr)) {
    // Yesterday was qualified, streak is still active today
    currentStreak = 1;
    let prev = new Date(yesterdayDate.getTime() - 24 * 60 * 60 * 1000);
    while (true) {
      const prevStr = prev.toLocaleDateString("en-CA", { timeZone: userTimezone });
      if (qualifyingSet.has(prevStr)) {
        currentStreak++;
        prev = new Date(prev.getTime() - 24 * 60 * 60 * 1000);
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  if (qualifyingDates.length > 0) {
    let currentRun = 1;
    longestStreak = 1;

    for (let i = 1; i < qualifyingDates.length; i++) {
      const prevDate = new Date(qualifyingDates[i - 1]);
      const currDate = new Date(qualifyingDates[i]);
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

