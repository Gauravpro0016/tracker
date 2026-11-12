import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import ContactMessage from "@/models/ContactMessage";
import { contactMessageSchema } from "@/lib/validators";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = contactMessageSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || "Invalid input data";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    await connectToDatabase();

    // Check if user is authenticated (optional)
    let userId = null;
    try {
      const session = await auth();
      const user = await getAuthenticatedUser(session);
      if (user?._id) {
        userId = user._id;
      }
    } catch {
      // Guest or unauthenticated submitter
    }

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "";
    const userAgent = req.headers.get("user-agent") || "";

    const newContactMessage = await ContactMessage.create({
      name: parsed.data.name.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      subject: parsed.data.subject?.trim() || "General Support",
      message: parsed.data.message.trim(),
      userId,
      ipAddress,
      userAgent,
      status: "unread",
    });

    console.log(`[Contact Support] New message received from ${newContactMessage.email}: "${newContactMessage.subject}"`);

    return NextResponse.json({
      success: true,
      message: "Thank you for reaching out! We have received your message and will respond to your email as soon as possible.",
      id: newContactMessage._id.toString(),
    });
  } catch (error: any) {
    console.error("POST /api/contact error:", error);
    return NextResponse.json(
      { error: "Failed to send message. Please try again later." },
      { status: 500 }
    );
  }
}

