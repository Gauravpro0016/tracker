import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import User from "@/models/User";
import StudySession from "@/models/StudySession";
import Task from "@/models/Task";
import Subject from "@/models/Subject";
import Habit from "@/models/Habit";
import HabitLog from "@/models/HabitLog";
import Goal from "@/models/Goal";
import PlannerItem from "@/models/PlannerItem";
import Exam from "@/models/Exam";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userData = user.toObject();
    delete userData.passwordHash;
    return NextResponse.json(userData);
  } catch (error: any) {
    console.error("GET /api/user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body.name !== undefined) user.name = body.name;
    if (body.bio !== undefined) user.bio = body.bio;
    if (body.avatar !== undefined) user.avatar = body.avatar;
    if (body.timezone !== undefined) user.timezone = body.timezone;
    if (body.educationLevel !== undefined) user.educationLevel = body.educationLevel;
    if (body.targetExam !== undefined) user.targetExam = body.targetExam;
    if (body.theme !== undefined) user.theme = { ...user.theme, ...body.theme };
    if (body.wallpaper !== undefined) user.wallpaper = { ...user.wallpaper, ...body.wallpaper };
    if (body.settings !== undefined) user.settings = { ...user.settings, ...body.settings };

    await user.save();

    const userData = user.toObject();
    delete userData.passwordHash;
    return NextResponse.json(userData);
  } catch (error: any) {
    console.error("PATCH /api/user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const uid = user._id.toString();

    await Promise.all([
      User.findByIdAndDelete(uid),
      StudySession.deleteMany({ userId: uid }),
      Task.deleteMany({ userId: uid }),
      Subject.deleteMany({ userId: uid }),
      Habit.deleteMany({ userId: uid }),
      HabitLog.deleteMany({ userId: uid }),
      Goal.deleteMany({ userId: uid }),
      PlannerItem.deleteMany({ userId: uid }),
      Exam.deleteMany({ userId: uid }),
    ]);

    return NextResponse.json({ message: "Account deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
