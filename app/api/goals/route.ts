import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import connectToDatabase from "@/lib/mongodb";
import Goal from "@/models/Goal";
import StudySession from "@/models/StudySession";
import Subject from "@/models/Subject";
import { goalSchema } from "@/lib/validators";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    void Subject;
    await connectToDatabase();
    const goals = await Goal.find({ userId: user._id.toString() })
      .sort({ createdAt: 1 })
      .populate("subjectId", "name color icon");

    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const userObjId = user._id as mongoose.Types.ObjectId;

    // Fetch all user sessions in the last 30 days for precise subject-based calculation
    const recentSessions = await StudySession.find(
      {
        userId: userObjId,
        startedAt: { $gte: monthStart },
      },
      { subjectId: 1, durationSeconds: 1, startedAt: 1 }
    ).lean();

    // Overall progress by period across all subjects
    let totalTodaySecs = 0;
    let totalWeekSecs = 0;
    let totalMonthSecs = 0;

    recentSessions.forEach((s) => {
      const sDate = new Date(s.startedAt);
      if (sDate >= todayStart) totalTodaySecs += s.durationSeconds || 0;
      if (sDate >= weekStart) totalWeekSecs += s.durationSeconds || 0;
      totalMonthSecs += s.durationSeconds || 0;
    });

    const progressByPeriod = {
      daily: Number((totalTodaySecs / 3600).toFixed(2)),
      weekly: Number((totalWeekSecs / 3600).toFixed(2)),
      monthly: Number((totalMonthSecs / 3600).toFixed(2)),
    };

    // Calculate individual progress for each goal synced with its subject
    const goalsWithProgress = goals.map((g) => {
      let sinceDate = todayStart;
      if (g.type === "weekly") sinceDate = weekStart;
      if (g.type === "monthly") sinceDate = monthStart;

      const targetSubjectId = g.subjectId
        ? ((g.subjectId as any)._id || g.subjectId).toString()
        : null;

      // Filter sessions for this specific goal
      const matching = recentSessions.filter((s) => {
        const sDate = new Date(s.startedAt);
        if (sDate < sinceDate) return false;

        // If goal is tied to a specific subject, require subject match
        if (targetSubjectId) {
          return s.subjectId && s.subjectId.toString() === targetSubjectId;
        }

        // If no subject assigned, all study sessions count toward this general goal
        return true;
      });

      const goalSeconds = matching.reduce((sum, s) => sum + (s.durationSeconds || 0), 0);
      const currentHours = Number((goalSeconds / 3600).toFixed(2));
      const percent = Math.min(100, Math.round((currentHours / g.targetHours) * 100));
      const remainingHours = Number(Math.max(0, g.targetHours - currentHours).toFixed(1));

      return {
        ...g.toObject(),
        currentHours,
        percent,
        remainingHours,
      };
    });

    return NextResponse.json({ goals: goalsWithProgress, progressByPeriod });
  } catch (error: any) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = goalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error", details: parsed.error.format() }, { status: 400 });
    }

    void Subject;
    await connectToDatabase();
    const goal = await Goal.create({
      userId: user._id.toString(),
      title: parsed.data.title,
      subjectId: parsed.data.subjectId || null,
      type: parsed.data.type,
      targetHours: parsed.data.targetHours,
      active: parsed.data.active ?? true,
    });

    const populated = await Goal.findById(goal._id).populate("subjectId", "name color icon");

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
