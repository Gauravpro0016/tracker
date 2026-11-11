import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import connectToDatabase from "@/lib/mongodb";
import Goal from "@/models/Goal";
import StudySession from "@/models/StudySession";
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

    await connectToDatabase();
    const goals = await Goal.find({ userId: user._id.toString() }).sort({ createdAt: 1 });

    // Calculate current progress for each active goal
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const userObjId = user._id as mongoose.Types.ObjectId;

    const [todaySecs, weekSecs, monthSecs] = await Promise.all([
      StudySession.aggregate([
        { $match: { userId: userObjId, startedAt: { $gte: todayStart } } },
        { $group: { _id: null, total: { $sum: "$durationSeconds" } } },
      ]),
      StudySession.aggregate([
        { $match: { userId: userObjId, startedAt: { $gte: weekStart } } },
        { $group: { _id: null, total: { $sum: "$durationSeconds" } } },
      ]),
      StudySession.aggregate([
        { $match: { userId: userObjId, startedAt: { $gte: monthStart } } },
        { $group: { _id: null, total: { $sum: "$durationSeconds" } } },
      ]),
    ]);

    const progressByPeriod = {
      daily: Number(((todaySecs[0]?.total || 0) / 3600).toFixed(2)),
      weekly: Number(((weekSecs[0]?.total || 0) / 3600).toFixed(2)),
      monthly: Number(((monthSecs[0]?.total || 0) / 3600).toFixed(2)),
    };

    const goalsWithProgress = goals.map((g) => {
      const currentHours = progressByPeriod[g.type] || 0;
      const percent = Math.min(100, Math.round((currentHours / g.targetHours) * 100));
      return {
        ...g.toObject(),
        currentHours,
        percent,
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
      return NextResponse.json({ error: "Validation error" }, { status: 400 });
    }

    await connectToDatabase();
    const goal = await Goal.create({
      userId: user._id.toString(),
      title: parsed.data.title,
      type: parsed.data.type,
      targetHours: parsed.data.targetHours,
      active: parsed.data.active ?? true,
    });

    return NextResponse.json(goal, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
