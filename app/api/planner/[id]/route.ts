import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import connectToDatabase from "@/lib/mongodb";
import PlannerItem from "@/models/PlannerItem";
import Exam from "@/models/Exam";
import Subject from "@/models/Subject";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectToDatabase();

    const isExam = body.isExam;
    if (isExam) {
      const exam = await Exam.findOneAndUpdate(
        { _id: params.id, userId: user._id.toString() },
        { $set: body },
        { new: true }
      ).populate("subjectId", "name color icon");
      return NextResponse.json(exam);
    } else {
      const item = await PlannerItem.findOneAndUpdate(
        { _id: params.id, userId: user._id.toString() },
        { $set: body },
        { new: true }
      ).populate("subjectId", "name color icon");
      return NextResponse.json(item);
    }
  } catch (error: any) {
    console.error("PATCH /api/planner/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const isExam = searchParams.get("type") === "exam";

    await connectToDatabase();

    if (isExam) {
      await Exam.findOneAndDelete({ _id: params.id, userId: user._id.toString() });
    } else {
      await PlannerItem.findOneAndDelete({ _id: params.id, userId: user._id.toString() });
    }

    return NextResponse.json({ message: "Item deleted" });
  } catch (error: any) {
    console.error("DELETE /api/planner/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
