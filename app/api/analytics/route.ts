import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import connectToDatabase from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import User from "@/models/User";
import Subject from "@/models/Subject";
import mongoose from "mongoose";
import { calculateStreaks } from "@/lib/streak";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const user = await getAuthenticatedUser(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "week"; // today, week, month, year, all, custom
    const customFrom = searchParams.get("from");
    const customTo = searchParams.get("to");
    const exportCsv = searchParams.get("export") === "csv";

    await connectToDatabase();

    const userTimezone = user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    const dailyMinMinutes = user.settings?.dailyMinimumMinutes || 15;
    const userObjectId = user._id as mongoose.Types.ObjectId;

    // Fetch all sessions for streak calculation & heatmap (last 365 days)
    const allUserSessions = await StudySession.find(
      { userId: userObjectId },
      { startedAt: 1, durationSeconds: 1 }
    ).lean();

    const streakInfo = calculateStreaks(allUserSessions, userTimezone, dailyMinMinutes);

    // Determine date range for filtered charts
    const now = new Date();
    let startDate = new Date();

    if (range === "today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "week") {
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "month") {
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "year") {
      startDate.setDate(now.getDate() - 364);
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "custom" && customFrom && customTo) {
      startDate = new Date(customFrom);
      now.setTime(new Date(customTo).getTime());
    } else {
      startDate.setDate(now.getDate() - 6);
    }

    const matchFilter: any = {
      userId: userObjectId,
      startedAt: { $gte: startDate, $lte: now },
    };

    // If CSV export is requested:
    if (exportCsv) {
      const exportSessions = await StudySession.find(matchFilter)
        .sort({ startedAt: -1 })
        .populate("subjectId", "name")
        .lean();

      let csv = "Date,Started At,Ended At,Subject,Task,Duration (Minutes),Mode\n";
      exportSessions.forEach((s: any) => {
        const subName = s.subjectId?.name || "General";
        const mins = (s.durationSeconds / 60).toFixed(1);
        const taskSafe = (s.task || "").replace(/"/g, '""');
        csv += `"${new Date(s.startedAt).toLocaleDateString()}", "${new Date(s.startedAt).toLocaleTimeString()}", "${new Date(s.endedAt).toLocaleTimeString()}", "${subName}", "${taskSafe}", ${mins}, "${s.mode}"\n`;
      });

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="focusdesk-export-${range}.csv"`,
        },
      });
    }

    // 1. Daily Aggregation Pipeline
    const dailyAggregation = await StudySession.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$startedAt",
              timezone: userTimezone,
            },
          },
          totalSeconds: { $sum: "$durationSeconds" },
          sessionsCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days in range so charts look complete and continuous
    const dailyData: Array<{ date: string; hours: number; sessions: number }> = [];
    const dayMap = new Map<string, { totalSeconds: number; sessionsCount: number }>();
    dailyAggregation.forEach((item) => dayMap.set(item._id, item));

    const cursor = new Date(startDate);
    while (cursor <= now) {
      const dStr = cursor.toLocaleDateString("en-CA", { timeZone: userTimezone });
      const found = dayMap.get(dStr);
      dailyData.push({
        date: dStr,
        hours: found ? Number((found.totalSeconds / 3600).toFixed(2)) : 0,
        sessions: found ? found.sessionsCount : 0,
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    // 2. Subject Distribution Pipeline
    const subjectAggregation = await StudySession.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: "$subjectId",
          totalSeconds: { $sum: "$durationSeconds" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalSeconds: -1 } },
    ]);

    // Populate subject names & colors
    const subjectIds = subjectAggregation.map((s) => s._id).filter(Boolean);
    const subjects = await Subject.find({ _id: { $in: subjectIds } }).lean();
    const subjectMap = new Map(subjects.map((s: any) => [s._id.toString(), s]));

    const subjectData = subjectAggregation.map((s) => {
      const sub = s._id ? subjectMap.get(s._id.toString()) : null;
      return {
        id: s._id ? s._id.toString() : "unassigned",
        name: sub ? sub.name : "General / No Subject",
        color: sub ? sub.color : "#737373",
        hours: Number((s.totalSeconds / 3600).toFixed(2)),
        seconds: s.totalSeconds,
        count: s.count,
      };
    });

    // 3. Hourly Productivity Pipeline (0-23 hours)
    const hourlyAggregation = await StudySession.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            $hour: {
              date: "$startedAt",
              timezone: userTimezone,
            },
          },
          totalSeconds: { $sum: "$durationSeconds" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const hourlyMap = new Map(hourlyAggregation.map((h) => [h._id, h.totalSeconds]));
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour: `${hour.toString().padStart(2, "0")}:00`,
      hours: Number(((hourlyMap.get(hour) || 0) / 3600).toFixed(2)),
    }));

    // 4. Comparison: This Week vs Last Week
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [thisWeekSum, lastWeekSum] = await Promise.all([
      StudySession.aggregate([
        {
          $match: {
            userId: userObjectId,
            startedAt: { $gte: oneWeekAgo, $lte: now },
          },
        },
        { $group: { _id: null, total: { $sum: "$durationSeconds" } } },
      ]),
      StudySession.aggregate([
        {
          $match: {
            userId: userObjectId,
            startedAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo },
          },
        },
        { $group: { _id: null, total: { $sum: "$durationSeconds" } } },
      ]),
    ]);

    const thisWeekSeconds = thisWeekSum[0]?.total || 0;
    const lastWeekSeconds = lastWeekSum[0]?.total || 0;
    let weekPercentChange = 0;
    if (lastWeekSeconds > 0) {
      weekPercentChange = Math.round(
        ((thisWeekSeconds - lastWeekSeconds) / lastWeekSeconds) * 100
      );
    } else if (thisWeekSeconds > 0) {
      weekPercentChange = 100;
    }

    // 5. Stat cards calculation
    let totalSecondsInRange = 0;
    let totalSessionsInRange = 0;
    let longestSessionSeconds = 0;
    let bestDayObj = { date: "None", hours: 0 };

    dailyData.forEach((d) => {
      totalSecondsInRange += d.hours * 3600;
      totalSessionsInRange += d.sessions;
      if (d.hours > bestDayObj.hours) {
        bestDayObj = { date: d.date, hours: d.hours };
      }
    });

    // Fetch max single session in range
    const maxSession = await StudySession.findOne(matchFilter)
      .sort({ durationSeconds: -1 })
      .lean();
    if (maxSession) {
      longestSessionSeconds = maxSession.durationSeconds;
    }

    const totalHoursInRange = Number((totalSecondsInRange / 3600).toFixed(1));
    const avgHoursPerDay =
      dailyData.length > 0
        ? Number((totalHoursInRange / dailyData.length).toFixed(1))
        : 0;

    // Calculate lifetime stats from all sessions
    const lifetimeSeconds = allUserSessions.reduce(
      (sum, s) => sum + (s.durationSeconds || 0),
      0
    );
    const lifetimeHours = Number((lifetimeSeconds / 3600).toFixed(1));
    const lifetimeSessions = allUserSessions.length;

    return NextResponse.json({
      range,
      userTimezone,
      streak: streakInfo,
      stats: {
        totalHours: totalHoursInRange,
        totalSessions: totalSessionsInRange,
        lifetimeHours,
        lifetimeSessions,
        averageHoursPerDay: avgHoursPerDay,
        bestDay: bestDayObj,
        longestSessionSeconds,
        topSubject: subjectData[0] || null,
        thisWeekHours: Number((thisWeekSeconds / 3600).toFixed(1)),
        lastWeekHours: Number((lastWeekSeconds / 3600).toFixed(1)),
        weekPercentChange,
      },
      dailyData,
      subjectData,
      hourlyData,
    });
  } catch (error: any) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

