import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import { updatePasswordSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const authUser = await getAuthenticatedUser(session);
    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = updatePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation error" }, { status: 400 });
    }

    await connectToDatabase();
    const user = await User.findById(authUser._id).select("+passwordHash");
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "User password not set or user not found" }, { status: 404 });
    }

    const isMatch = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ error: "Current password does not match" }, { status: 400 });
    }

    user.passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
    await user.save();

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error: any) {
    console.error("POST /api/user/change-password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
