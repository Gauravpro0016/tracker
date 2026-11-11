import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import connectToDatabase from "@/lib/mongodb";
import PlannerItem from "@/models/PlannerItem";
import Exam from "@/models/Exam";
import Subject from "@/models/Subject";
import { plannerItemSchema, examSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const [items, exams] = await Promise.all([
      PlannerItem.find({ userId: user._id.toString() })
        .sort({ date: 1, startTime: 1 })
        .populate("subjectId", "name color icon"),
      Exam.find({ userId: user._id.toString() })
        .sort({ examDate: 1 })
        .populate("subjectId", "name color icon"),
    ]);

    return NextResponse.json({ items, exams });
  } catch (error: any) {
    console.error("GET /api/planner error:", error);
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

    // Check if creating an exam or planner item
    if (body.type === "exam") {
      const parsed = examSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation error", details: parsed.error.format() },
          { status: 400 }
        );
      }
      const exam = await Exam.create({
        userId: user._id.toString(),
        title: parsed.data.title,
        subjectId: parsed.data.subjectId || null,
        examDate: new Date(parsed.data.examDate),
        targetScore: parsed.data.targetScore || "",
        notes: parsed.data.notes || "",
      });
      const populated = await Exam.findById(exam._id).populate("subjectId", "name color icon");
      return NextResponse.json(populated, { status: 201 });
    } else {
      const parsed = plannerItemSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Validation error", details: parsed.error.format() },
          { status: 400 }
        );
      }
      const item = await PlannerItem.create({
        userId: user._id.toString(),
        title: parsed.data.title,
        subjectId: parsed.data.subjectId || null,
        date: parsed.data.date,
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        priority: parsed.data.priority,
        status: parsed.data.status,
        recurring: parsed.data.recurring,
        notes: parsed.data.notes || "",
      });
      const populated = await PlannerItem.findById(item._id).populate("subjectId", "name color icon");
      return NextResponse.json(populated, { status: 201 });
    }
  } catch (error: any) {
    console.error("POST /api/planner error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
