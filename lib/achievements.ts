export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: "hours" | "streak" | "sessions";
  target: number;
  unit: string;
  iconName: "Clock" | "Zap" | "Award" | "Trophy" | "Flame" | "Crown" | "Sparkles" | "Diamond" | "Play" | "CheckCircle2";
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  // 1. Hours Milestones (Step by Step: 1, 5, 10, 25, 50, 100, 250, 500, 1000)
  {
    id: "hours-1",
    title: "First Step",
    description: "Complete your first 1 hour of deep work.",
    category: "hours",
    target: 1,
    unit: "hrs",
    iconName: "Clock",
    tier: "bronze",
    badgeBg: "bg-amber-950/30",
    badgeBorder: "border-amber-700/50",
    badgeColor: "text-amber-500",
  },
  {
    id: "hours-5",
    title: "5-Hour Foundation",
    description: "Accumulate 5 total hours of deep work.",
    category: "hours",
    target: 5,
    unit: "hrs",
    iconName: "Zap",
    tier: "bronze",
    badgeBg: "bg-amber-900/30",
    badgeBorder: "border-amber-600/50",
    badgeColor: "text-amber-400",
  },
  {
    id: "hours-10",
    title: "Double Digits",
    description: "Cross 10 total hours of dedicated study time.",
    category: "hours",
    target: 10,
    unit: "hrs",
    iconName: "Award",
    tier: "silver",
    badgeBg: "bg-slate-900/60",
    badgeBorder: "border-slate-500/50",
    badgeColor: "text-slate-200",
  },
  {
    id: "hours-25",
    title: "Quarter Century",
    description: "Reach 25 total hours of focused concentration.",
    category: "hours",
    target: 25,
    unit: "hrs",
    iconName: "Trophy",
    tier: "silver",
    badgeBg: "bg-cyan-950/40",
    badgeBorder: "border-cyan-600/50",
    badgeColor: "text-cyan-400",
  },
  {
    id: "hours-50",
    title: "Half Century Scholar",
    description: "Achieve 50 hours of uninterrupted learning.",
    category: "hours",
    target: 50,
    unit: "hrs",
    iconName: "Flame",
    tier: "gold",
    badgeBg: "bg-amber-900/40",
    badgeBorder: "border-amber-500/60",
    badgeColor: "text-amber-300",
  },
  {
    id: "hours-100",
    title: "The Centurion",
    description: "Break the 100-hour barrier of deep intellectual work.",
    category: "hours",
    target: 100,
    unit: "hrs",
    iconName: "Crown",
    tier: "gold",
    badgeBg: "bg-yellow-950/50",
    badgeBorder: "border-yellow-500/70",
    badgeColor: "text-yellow-400",
  },
  {
    id: "hours-250",
    title: "Deep Work Sage",
    description: "Amass 250 hours of profound study mastery.",
    category: "hours",
    target: 250,
    unit: "hrs",
    iconName: "Sparkles",
    tier: "platinum",
    badgeBg: "bg-purple-950/50",
    badgeBorder: "border-purple-500/60",
    badgeColor: "text-purple-300",
  },
  {
    id: "hours-500",
    title: "Grandmaster Mind",
    description: "Accumulate 500 hours of peak scholarly dedication.",
    category: "hours",
    target: 500,
    unit: "hrs",
    iconName: "Award",
    tier: "platinum",
    badgeBg: "bg-indigo-950/50",
    badgeBorder: "border-indigo-400/60",
    badgeColor: "text-indigo-300",
  },
  {
    id: "hours-1000",
    title: "Legendary Scholar",
    description: "Enter the hall of fame with 1,000 lifetime study hours.",
    category: "hours",
    target: 1000,
    unit: "hrs",
    iconName: "Diamond",
    tier: "diamond",
    badgeBg: "bg-sky-950/50",
    badgeBorder: "border-sky-400/70",
    badgeColor: "text-sky-300",
  },

  // 2. Streaks Milestones (3, 7, 14, 30, 100 days)
  {
    id: "streak-3",
    title: "Hat Trick",
    description: "Maintain a study streak for 3 consecutive days.",
    category: "streak",
    target: 3,
    unit: "days",
    iconName: "Flame",
    tier: "bronze",
    badgeBg: "bg-amber-950/30",
    badgeBorder: "border-amber-700/50",
    badgeColor: "text-amber-500",
  },
  {
    id: "streak-7",
    title: "Weekly Habit",
    description: "Keep your daily study rhythm going for 7 straight days.",
    category: "streak",
    target: 7,
    unit: "days",
    iconName: "Flame",
    tier: "silver",
    badgeBg: "bg-slate-900/60",
    badgeBorder: "border-slate-500/50",
    badgeColor: "text-slate-200",
  },
  {
    id: "streak-14",
    title: "Fortnight Focus",
    description: "Stay consistent every day for 14 straight days.",
    category: "streak",
    target: 14,
    unit: "days",
    iconName: "Flame",
    tier: "gold",
    badgeBg: "bg-amber-900/40",
    badgeBorder: "border-amber-500/60",
    badgeColor: "text-amber-300",
  },
  {
    id: "streak-30",
    title: "Monthly Marathon",
    description: "Complete an unbroken 30-day streak of daily deep work.",
    category: "streak",
    target: 30,
    unit: "days",
    iconName: "Crown",
    tier: "platinum",
    badgeBg: "bg-purple-950/50",
    badgeBorder: "border-purple-500/60",
    badgeColor: "text-purple-300",
  },
  {
    id: "streak-100",
    title: "Century Flame",
    description: "Attain an unbroken 100-day daily study streak.",
    category: "streak",
    target: 100,
    unit: "days",
    iconName: "Diamond",
    tier: "diamond",
    badgeBg: "bg-sky-950/50",
    badgeBorder: "border-sky-400/70",
    badgeColor: "text-sky-300",
  },

  // 3. Sessions Count Milestones (1, 10, 50, 100)
  {
    id: "sessions-1",
    title: "Initiation",
    description: "Complete and log your very first study session.",
    category: "sessions",
    target: 1,
    unit: "sessions",
    iconName: "Play",
    tier: "bronze",
    badgeBg: "bg-amber-950/30",
    badgeBorder: "border-amber-700/50",
    badgeColor: "text-amber-500",
  },
  {
    id: "sessions-10",
    title: "Momentum",
    description: "Complete 10 focused study sessions.",
    category: "sessions",
    target: 10,
    unit: "sessions",
    iconName: "CheckCircle2",
    tier: "silver",
    badgeBg: "bg-slate-900/60",
    badgeBorder: "border-slate-500/50",
    badgeColor: "text-slate-200",
  },
  {
    id: "sessions-50",
    title: "Ritualist",
    description: "Complete 50 deep focus study sessions.",
    category: "sessions",
    target: 50,
    unit: "sessions",
    iconName: "Sparkles",
    tier: "gold",
    badgeBg: "bg-amber-900/40",
    badgeBorder: "border-amber-500/60",
    badgeColor: "text-amber-300",
  },
  {
    id: "sessions-100",
    title: "Master Practitioner",
    description: "Complete 100 deep focus study sessions.",
    category: "sessions",
    target: 100,
    unit: "sessions",
    iconName: "Trophy",
    tier: "diamond",
    badgeBg: "bg-sky-950/50",
    badgeBorder: "border-sky-400/70",
    badgeColor: "text-sky-300",
  },
];

export interface UserAchievementStatus extends Achievement {
  unlocked: boolean;
  currentValue: number;
  percent: number;
  remaining: number;
}

export function calculateAchievementsProgress(stats: {
  totalHours: number;
  currentStreak?: number;
  longestStreak?: number;
  totalSessions?: number;
}): {
  achievements: UserAchievementStatus[];
  totalUnlocked: number;
  totalAvailable: number;
  hoursUnlocked: number;
  totalHoursMilestones: number;
  nextMilestone: UserAchievementStatus | null;
} {
  const totalHours = stats.totalHours || 0;
  const bestStreak = Math.max(stats.currentStreak || 0, stats.longestStreak || 0);
  const totalSessions = stats.totalSessions || 0;

  const results: UserAchievementStatus[] = ACHIEVEMENTS_LIST.map((ach) => {
    let currentValue = 0;
    if (ach.category === "hours") {
      currentValue = totalHours;
    } else if (ach.category === "streak") {
      currentValue = bestStreak;
    } else if (ach.category === "sessions") {
      currentValue = totalSessions;
    }

    const unlocked = currentValue >= ach.target;
    const percent = Math.min(100, Math.round((currentValue / ach.target) * 100));
    const remaining = Math.max(0, Number((ach.target - currentValue).toFixed(1)));

    return {
      ...ach,
      unlocked,
      currentValue,
      percent,
      remaining,
    };
  });

  const totalUnlocked = results.filter((a) => a.unlocked).length;
  const hoursAchievements = results.filter((a) => a.category === "hours");
  const hoursUnlocked = hoursAchievements.filter((a) => a.unlocked).length;

  // The next nearest locked milestone (prioritizing hours)
  const nextMilestone =
    hoursAchievements.find((a) => !a.unlocked) ||
    results.find((a) => !a.unlocked) ||
    null;

  return {
    achievements: results,
    totalUnlocked,
    totalAvailable: results.length,
    hoursUnlocked,
    totalHoursMilestones: hoursAchievements.length,
    nextMilestone,
  };
}

