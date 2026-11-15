import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import connectToDatabase from "@/lib/mongodb";
import AIHistory from "@/models/AIHistory";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    await connectToDatabase();

    if (id) {
      const item = await AIHistory.findOne({ _id: id, userId: user._id });
      if (!item) {
        return NextResponse.json({ error: "History item not found" }, { status: 404 });
      }
      return NextResponse.json({ item });
    }

    const query: any = { userId: user._id };
    if (type && type !== "all") {
      query.type = type;
    }

    const items = await AIHistory.find(query)
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("GET /api/ai/history error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch AI history" }, { status: 500 });
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
    const { id, type, title, summary, data } = body;

    if (!type || !title || data === undefined) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await connectToDatabase();

    let item;
    if (id) {
      item = await AIHistory.findOneAndUpdate(
        { _id: id, userId: user._id },
        { title, summary: summary || "", data, updatedAt: new Date() },
        { new: true }
      );
    }

    if (!item) {
      item = await AIHistory.create({
        userId: user._id,
        type,
        title,
        summary: summary || "",
        data,
      });
    }

    return NextResponse.json({ item });
  } catch (error: any) {
    console.error("POST /api/ai/history error:", error);
    return NextResponse.json({ error: error.message || "Failed to save AI history" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const clearAll = searchParams.get("all") === "true";
    const type = searchParams.get("type");

    await connectToDatabase();

    if (id) {
      await AIHistory.findOneAndDelete({ _id: id, userId: user._id });
      return NextResponse.json({ success: true, deletedId: id });
    }

    if (clearAll) {
      const query: any = { userId: user._id };
      if (type && type !== "all") {
        query.type = type;
      }
      const res = await AIHistory.deleteMany(query);
      return NextResponse.json({ success: true, deletedCount: res.deletedCount });
    }

    return NextResponse.json({ error: "Specify id or all=true" }, { status: 400 });
  } catch (error: any) {
    console.error("DELETE /api/ai/history error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete AI history" }, { status: 500 });
  }
}
