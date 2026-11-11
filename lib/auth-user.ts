import mongoose from "mongoose";
import connectToDatabase from "@/lib/mongodb";
import User, { IUser } from "@/models/User";

/**
 * Robustly resolves the authenticated MongoDB user from a NextAuth session.
 * Checks session.user.id first, then falls back to session.user.email,
 * and auto-provisions if the user logged in via OAuth or if the DB record is missing.
 */
export async function getAuthenticatedUser(session: any): Promise<IUser | null> {
  if (!session?.user) return null;
  await connectToDatabase();

  let user: IUser | null = null;

  // 1. Check by session.user.id if it is a valid MongoDB ObjectId
  if (session.user.id && mongoose.Types.ObjectId.isValid(session.user.id)) {
    user = await User.findById(session.user.id);
  }

  // 2. Fallback to session.user.email
  if (!user && session.user.email) {
    user = await User.findOne({ email: session.user.email.toLowerCase() });
  }

  // 3. Auto-provision if authenticated (e.g. Google OAuth or fresh user) but record not in DB yet
  if (!user && session.user.email) {
    const baseName = session.user.name || "Focus User";
    const username =
      baseName.toLowerCase().replace(/[^a-z0-9]/g, "") +
      Math.floor(1000 + Math.random() * 9000);
    user = await User.create({
      name: baseName,
      email: session.user.email.toLowerCase(),
      username,
      avatar: session.user.image || "",
    });
  }

  return user;
}

