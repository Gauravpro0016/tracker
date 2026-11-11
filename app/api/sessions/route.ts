import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import connectToDatabase from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import Subject from "@/models/Subject";
import { createSessionSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const subjectId = searchParams.get("subjectId");

    void Subject;
    await connectToDatabase();

    const query: any = { userId: user._id.toString() };
    if (subjectId) {
      query.subjectId = subjectId;
    }

    const sessions = await StudySession.find(query)
      .sort({ startedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("subjectId", "name color icon");

    return NextResponse.json(sessions);
  } catch (error: any) {
    console.error("GET /api/sessions error:", error);
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
    const parsed = createSessionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    void Subject;
    await connectToDatabase();

    const newSession = await StudySession.create({
      userId: user._id.toString(),
      subjectId: parsed.data.subjectId || null,
      task: parsed.data.task,
      mode: parsed.data.mode,
      durationSeconds: parsed.data.durationSeconds,
      startedAt: new Date(parsed.data.startedAt),
      endedAt: new Date(parsed.data.endedAt),
      notes: parsed.data.notes || "",
    });

    const populated = await StudySession.findById(newSession._id).populate(
      "subjectId",
      "name color icon"
    );

    return NextResponse.json(populated, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/sessions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

