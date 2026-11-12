import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import connectToDatabase from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import User from "@/models/User";
import { calculateStreaks } from "@/lib/streak";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "week"; // today, week, month, all
    const limit = Math.min(100, parseInt(searchParams.get("limit") || "50", 10));

    await connectToDatabase();

    const now = new Date();
    const matchFilter: any = {};

    if (range === "today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      matchFilter.startedAt = { $gte: todayStart };
    } else if (range === "week") {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchFilter.startedAt = { $gte: weekStart };
    } else if (range === "month") {
      const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchFilter.startedAt = { $gte: monthStart };
    }

    // Aggregate total focus time per user
    const userStats = await StudySession.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$userId",
          totalSeconds: { $sum: "$durationSeconds" },
          sessionsCount: { $sum: 1 },
          latestSessionAt: { $max: "$startedAt" },
        },
      },
      { $sort: { totalSeconds: -1 } },
      { $limit: limit },
    ]);

    const userIds = userStats.map((s) => s._id).filter(Boolean);

    // Fetch user profiles
    const users = await User.find(
      { _id: { $in: userIds } },
      { name: 1, username: 1, avatar: 1, timezone: 1, createdAt: 1 }
    ).lean();
    const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

    // Fetch sessions in the last 60 days to calculate live streaks for ranked scholars
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    const recentSessions = await StudySession.find(
      {
        userId: { $in: userIds },
        startedAt: { $gte: sixtyDaysAgo },
      },
      { userId: 1, startedAt: 1, durationSeconds: 1 }
    ).lean();

    const sessionsByUser = new Map<string, Array<{ startedAt: Date; durationSeconds: number }>>();
    recentSessions.forEach((s: any) => {
      const uid = s.userId.toString();
      if (!sessionsByUser.has(uid)) sessionsByUser.set(uid, []);
      sessionsByUser.get(uid)!.push({ startedAt: s.startedAt, durationSeconds: s.durationSeconds });
    });

    const getTierInfo = (hours: number) => {
      if (hours >= 250) return { tier: "Diamond Legend", badge: "👑", rankClass: "text-amber-300" };
      if (hours >= 100) return { tier: "Platinum Master", badge: "💎", rankClass: "text-cyan-300" };
      if (hours >= 50) return { tier: "Gold Scholar", badge: "🥇", rankClass: "text-yellow-400" };
      if (hours >= 20) return { tier: "Silver Scholar", badge: "🥈", rankClass: "text-neutral-300" };
      if (hours >= 5) return { tier: "Bronze Achiever", badge: "🥉", rankClass: "text-amber-600" };
      return { tier: "Focus Initiate", badge: "🎓", rankClass: "text-neutral-400" };
    };

    let leaderboard = userStats.map((stat, index) => {
      const userDoc: any = userMap.get(stat._id.toString());
      const userSessions = sessionsByUser.get(stat._id.toString()) || [];
      const streakInfo = calculateStreaks(userSessions, userDoc?.timezone || "UTC");
      const totalHours = Number((stat.totalSeconds / 3600).toFixed(1));
      const tierInfo = getTierInfo(totalHours);

      return {
        rank: index + 1,
        userId: stat._id.toString(),
        name: userDoc?.name || "Focus Scholar",
        username: userDoc?.username || `scholar_${stat._id.toString().slice(-4)}`,
        avatar: userDoc?.avatar || "",
        totalHours,
        totalSeconds: stat.totalSeconds,
        sessionsCount: stat.sessionsCount,
        streak: streakInfo.currentStreak,
        tier: tierInfo.tier,
        tierBadge: tierInfo.badge,
      };
    });

    // Provide default community scholars if fewer than 3 users exist (for vibrant UI)
    if (leaderboard.length < 3) {
      const communityPioneers = [
        {
          rank: 0,
          userId: "mock-pioneer-1",
          name: "Marcus Aurelius",
          username: "stoic_focus",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
          totalHours: 42.5,
          totalSeconds: 42.5 * 3600,
          sessionsCount: 38,
          streak: 14,
          tier: "Silver Scholar",
          tierBadge: "🥈",
        },
        {
          rank: 0,
          userId: "mock-pioneer-2",
          name: "Dr. Marie Curie",
          username: "rad_focus",
          avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80",
          totalHours: 36.8,
          totalSeconds: 36.8 * 3600,
          sessionsCount: 29,
          streak: 9,
          tier: "Silver Scholar",
          tierBadge: "🥈",
        },
        {
          rank: 0,
          userId: "mock-pioneer-3",
          name: "Nikola Tesla",
          username: "frequency369",
          avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80",
          totalHours: 28.2,
          totalSeconds: 28.2 * 3600,
          sessionsCount: 22,
          streak: 7,
          tier: "Silver Scholar",
          tierBadge: "🥈",
        },
      ];

      // Merge and re-rank
      const combined = [...leaderboard, ...communityPioneers.filter((cp) => !leaderboard.some((l) => l.name === cp.name))];
      combined.sort((a, b) => b.totalSeconds - a.totalSeconds);
      leaderboard = combined.map((item, idx) => ({ ...item, rank: idx + 1 }));
    }

    // Current user's ranking position
    let currentUserRank: any = null;

    if (user) {
      const currentUserIdStr = user._id.toString();
      const userIndex = leaderboard.findIndex((item) => item.userId === currentUserIdStr);

      if (userIndex !== -1) {
        currentUserRank = {
          ...leaderboard[userIndex],
          isCurrentUser: true,
          hoursToNextRank:
            userIndex > 0
              ? Number((leaderboard[userIndex - 1].totalHours - leaderboard[userIndex].totalHours + 0.1).toFixed(1))
              : 0,
        };
      } else {
        // User has not logged study sessions in this timeframe
        const userAllSessions = await StudySession.find(
          { userId: user._id as mongoose.Types.ObjectId },
          { startedAt: 1, durationSeconds: 1 }
        ).lean();

        const userStreak = calculateStreaks(userAllSessions, user.timezone || "UTC");
        const userTier = getTierInfo(0);

        currentUserRank = {
          rank: leaderboard.length + 1,
          userId: currentUserIdStr,
          name: user.name,
          username: user.username,
          avatar: user.avatar || "",
          totalHours: 0,
          totalSeconds: 0,
          sessionsCount: 0,
          streak: userStreak.currentStreak,
          tier: userTier.tier,
          tierBadge: userTier.badge,
          isCurrentUser: true,
          hoursToNextRank: leaderboard.length > 0 ? Number((leaderboard[leaderboard.length - 1].totalHours + 0.1).toFixed(1)) : 0.5,
        };
      }
    }

    return NextResponse.json({
      range,
      leaderboard,
      currentUserRank,
      totalScholars: leaderboard.length,
    });
  } catch (error: any) {
    console.error("GET /api/leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

