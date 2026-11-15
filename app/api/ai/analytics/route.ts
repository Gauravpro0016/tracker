import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, AnalyticsInsight, runGeminiWithFallback } from "@/lib/ai-service";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import connectToDatabase from "@/lib/mongodb";
import StudySession from "@/models/StudySession";
import { calculateStreaks } from "@/lib/streak";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { clientMetrics } = body;

    const gemini = getGeminiClient();

    // Fetch user study statistics from DB if logged in, otherwise use clientMetrics
    let totalSeconds = 0;
    let sessionCount = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let subjectBreakdown: Record<string, number> = {};

    const session = await auth();
    const user = await getAuthenticatedUser(session);

    if (user) {
      await connectToDatabase();
      const userTimezone = user.timezone || "UTC";
      const dailyMin = user.settings?.dailyMinimumMinutes || 15;

      const sessions = await StudySession.find({ userId: user._id })
        .populate("subjectId", "name")
        .lean();

      sessionCount = sessions.length;
      totalSeconds = sessions.reduce((acc, s) => acc + (s.durationSeconds || 0), 0);

      sessions.forEach((s: any) => {
        const subjName = s.subjectId?.name || "General Study";
        subjectBreakdown[subjName] = (subjectBreakdown[subjName] || 0) + (s.durationSeconds || 0);
      });

      const streaks = calculateStreaks(sessions, userTimezone, dailyMin);
      currentStreak = streaks.currentStreak;
      bestStreak = streaks.longestStreak;
    } else if (clientMetrics) {
      totalSeconds = clientMetrics.totalSeconds || 0;
      sessionCount = clientMetrics.sessionCount || 0;
      currentStreak = clientMetrics.currentStreak || 0;
      bestStreak = clientMetrics.bestStreak || 0;
      subjectBreakdown = clientMetrics.subjectBreakdown || {};
    }

    const totalHours = Math.round((totalSeconds / 3600) * 10) / 10;

    let insights: AnalyticsInsight;

    if (!gemini) {
      // Fallback demo insights
      const persona =
        totalHours > 20
          ? "The Deep Work Architect"
          : currentStreak >= 3
          ? "The Disciplined Sprinter"
          : "The Emerging Scholar";

      insights = {
        scholarPersona: persona,
        strengths: [
          `Logged ${totalHours} hours across ${sessionCount} dedicated focus sessions.`,
          currentStreak > 0
            ? `Active study momentum with a ${currentStreak}-day streak.`
            : "Strong intent to build disciplined daily study rituals.",
          "Balanced session pacing using FocusDesk timer modes.",
        ],
        improvements: [
          "Incorporate 5-minute active recall quizzes at the end of each session.",
          "Maintain weekend momentum with at least one 25-minute minimum review block.",
          "Distribute heavy problem-solving into morning or early afternoon peak focus windows.",
        ],
        recommendedSchedule:
          "Daily: 2x 50-minute Deep Work blocks in the morning/afternoon, followed by a 20-minute Spaced Repetition flashcard session in the evening.",
        weeklyAdvice:
          "Consistency beats intensity every time. Studying 2 hours every day yields 3x higher retention than a 14-hour weekend cram session. Protect your daily minimum streak!",
      };
    } else {
      const prompt = `You are an elite academic performance analyst and cognitive scientist.
Analyze this student's actual study data and give personalized, encouraging, and scientifically sound coaching.

Student Data:
- Total Study Hours: ${totalHours} hours
- Completed Sessions: ${sessionCount}
- Current Streak: ${currentStreak} days
- Best Streak: ${bestStreak} days
- Subject Breakdown (seconds): ${JSON.stringify(subjectBreakdown)}

Format the response with EXACTLY this JSON structure:
{
  "scholarPersona": "A creative title describing their learning style (e.g. 'The Deep Work Architect', 'The Midnight Polymath', 'The Agile Strategist')",
  "strengths": [
    "Specific analytical observation 1 based on their data",
    "Specific analytical observation 2 based on their data",
    "Specific analytical observation 3 based on their data"
  ],
  "improvements": [
    "Constructive scientific suggestion 1",
    "Constructive scientific suggestion 2",
    "Constructive scientific suggestion 3"
  ],
  "recommendedSchedule": "A concrete daily/weekly schedule recommendation tailored to their subject balance and energy curves.",
  "weeklyAdvice": "A 2-3 sentence inspiring, high-impact paragraph summarizing what they should focus on this week to maximize exam performance."
}

Only return valid JSON.`;

      insights = await runGeminiWithFallback(
        gemini,
        { generationConfig: { responseMimeType: "application/json" } },
        async (model) => {
          const result = await model.generateContent(prompt);
          return JSON.parse(result.response.text());
        }
      );
    }

    return NextResponse.json({
      insights,
      metrics: {
        totalHours,
        sessionCount,
        currentStreak,
        bestStreak,
        subjectBreakdown,
      },
      isDemo: !gemini,
    });
  } catch (error: any) {
    console.error("AI Analytics Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate AI analytics" },
      { status: 500 }
    );
  }
}
