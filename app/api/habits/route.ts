import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import connectToDatabase from "@/lib/mongodb";
import Habit from "@/models/Habit";
import HabitLog from "@/models/HabitLog";
import { habitSchema, habitLogSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate"); // YYYY-MM-DD
    const endDate = searchParams.get("endDate");     // YYYY-MM-DD

    await connectToDatabase();

    const habits = await Habit.find({ userId: user._id.toString() }).sort({ createdAt: 1 });

    const logQuery: any = { userId: user._id.toString() };
    if (startDate && endDate) {
      logQuery.date = { $gte: startDate, $lte: endDate };
    }

    const logs = await HabitLog.find(logQuery).lean();

    return NextResponse.json({ habits, logs });
  } catch (error: any) {
    console.error("GET /api/habits error:", error);
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
    await connectToDatabase();

    // Check if this is a log toggle or habit creation
    if (body.type === "log") {
      const parsed = habitLogSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Validation error" }, { status: 400 });
      }

      const log = await HabitLog.findOneAndUpdate(
        {
          userId: user._id.toString(),
          habitId: parsed.data.habitId,
          date: parsed.data.date,
        },
        {
          $set: { completed: parsed.data.completed },
        },
        { upsert: true, new: true }
      );

      return NextResponse.json(log);
    } else {
      const parsed = habitSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: "Validation error" }, { status: 400 });
      }

      const habit = await Habit.create({
        userId: user._id.toString(),
        name: parsed.data.name,
        category: parsed.data.category || "General",
        targetDaysPerWeek: parsed.data.targetDaysPerWeek || 7,
        color: parsed.data.color || "#ffffff",
      });

      return NextResponse.json(habit, { status: 201 });
    }
  } catch (error: any) {
    console.error("POST /api/habits error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
