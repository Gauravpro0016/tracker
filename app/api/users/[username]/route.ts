import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import StudySession from "@/models/StudySession";
import Subject from "@/models/Subject";
import { calculateStreaks } from "@/lib/streak";
import { calculateAchievementsProgress } from "@/lib/achievements";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const rawUsername = params.username?.trim().toLowerCase();
    if (!rawUsername) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    await connectToDatabase();

    // 1. Fetch user (safe public projection only)
    const user = await User.findOne(
      { username: rawUsername },
      {
        name: 1,
        username: 1,
        avatar: 1,
        bio: 1,
        educationLevel: 1,
        targetExam: 1,
        timezone: 1,
        createdAt: 1,
      }
    ).lean();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Fetch all user sessions for streak & lifetime hours
    const sessions = await StudySession.find(
      { userId: user._id },
      { startedAt: 1, durationSeconds: 1, subjectId: 1 }
    ).lean();

    const userTimezone = user.timezone || "UTC";
    const streakInfo = calculateStreaks(sessions, userTimezone, 15);

    const totalSeconds = sessions.reduce(
      (sum: number, s: any) => sum + (s.durationSeconds || 0),
      0
    );
    const totalHours = Number((totalSeconds / 3600).toFixed(1));
    const totalSessions = sessions.length;
    const longestStreak = streakInfo.longestStreak || streakInfo.currentStreak || 0;

    // 3. Compute achievements
    const achievementsData = calculateAchievementsProgress({
      totalHours,
      currentStreak: streakInfo.currentStreak,
      longestStreak,
      totalSessions,
    });

    // 4. Calculate Top Subjects
    const subjectMap: Record<string, number> = {};
    sessions.forEach((s: any) => {
      const subId = s.subjectId ? s.subjectId.toString() : "general";
      subjectMap[subId] = (subjectMap[subId] || 0) + (s.durationSeconds || 0);
    });

    const subjectIds = Object.keys(subjectMap).filter((id) => id !== "general");
    const subjects = await Subject.find(
      { _id: { $in: subjectIds } },
      { name: 1, color: 1 }
    ).lean();

    const subjectDetailsMap = new Map(subjects.map((sub: any) => [sub._id.toString(), sub]));

    const topSubjects = Object.entries(subjectMap)
      .map(([id, seconds]) => {
        if (id === "general") {
          return {
            name: "General Study",
            color: "#ffffff",
            hours: Number((seconds / 3600).toFixed(1)),
          };
        }
        const sub = subjectDetailsMap.get(id);
        return {
          name: sub ? sub.name : "Other",
          color: sub ? sub.color : "#a3a3a3",
          hours: Number((seconds / 3600).toFixed(1)),
        };
      })
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);

    // Determine rank
    const rank =
      totalHours >= 200
        ? { title: "Grandmaster Scholar", level: 5, color: "text-amber-400" }
        : totalHours >= 100
        ? { title: "Deep Work Virtuoso", level: 4, color: "text-purple-400" }
        : totalHours >= 50
        ? { title: "Dedicated Scholar", level: 3, color: "text-sky-400" }
        : totalHours >= 20
        ? { title: "Consistent Learner", level: 2, color: "text-emerald-400" }
        : { title: "Focused Initiate", level: 1, color: "text-neutral-400" };

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        username: user.username,
        avatar: user.avatar || "",
        bio: user.bio || "",
        educationLevel: user.educationLevel || "",
        targetExam: user.targetExam || "",
        createdAt: user.createdAt,
      },
      stats: {
        totalHours,
        totalSessions,
        currentStreak: streakInfo.currentStreak,
        longestStreak,
        rank,
      },
      achievements: achievementsData,
      topSubjects,
    });
  } catch (error: any) {
    console.error("GET /api/users/[username] error:", error);
    return NextResponse.json({ error: "Failed to load public profile" }, { status: 500 });
  }
}

