import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, GeneratedStudyPlan, StudyPlanItem, runGeminiWithFallback } from "@/lib/ai-service";
import { auth } from "@/lib/auth";
import { getAuthenticatedUser } from "@/lib/auth-user";
import connectToDatabase from "@/lib/mongodb";
import PlannerItem from "@/models/PlannerItem";
import Exam from "@/models/Exam";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      examTitle = "Upcoming Exam",
      examDate, // YYYY-MM-DD
      topics = "",
      dailyHours = 3,
      preferredTime = "evening", // "morning" | "afternoon" | "evening" | "custom"
      saveToPlanner = false,
    } = body;

    const gemini = getGeminiClient();

    // Calculate dates
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const targetDate = examDate ? new Date(examDate) : new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const targetDateStr = targetDate.toISOString().split("T")[0];

    // Determine default start/end times based on preferredTime
    let defaultStart = "18:00";
    let defaultEnd = "21:00";
    if (preferredTime === "morning") {
      defaultStart = "08:00";
      defaultEnd = `${String(8 + Math.min(dailyHours, 6)).padStart(2, "0")}:00`;
    } else if (preferredTime === "afternoon") {
      defaultStart = "14:00";
      defaultEnd = `${String(14 + Math.min(dailyHours, 6)).padStart(2, "0")}:00`;
    } else {
      defaultStart = "18:00";
      const endHour = 18 + Math.min(dailyHours, 5);
      defaultEnd = `${String(endHour).padStart(2, "0")}:00`;
    }

    let generatedPlan: GeneratedStudyPlan;

    if (!gemini) {
      // High-quality fallback generator when no Gemini key is provided
      const topicList = topics
        .split(/[,;\n]+/)
        .map((t: string) => t.trim())
        .filter(Boolean);
      
      const safeTopics = topicList.length > 0 ? topicList : ["Core Foundations", "Problem Solving", "Advanced Topics", "Mock Exam & Review"];
      const daysDiff = Math.max(1, Math.min(30, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))));
      
      const blocks: StudyPlanItem[] = [];
      for (let i = 0; i < daysDiff; i++) {
        const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
        const dStr = d.toISOString().split("T")[0];
        const assignedTopic = safeTopics[i % safeTopics.length];
        const isLastTwoDays = i >= daysDiff - 2;

        blocks.push({
          title: isLastTwoDays ? `Mock Exam & Final Review: ${examTitle}` : `Study: ${assignedTopic}`,
          date: dStr,
          startTime: defaultStart,
          endTime: defaultEnd,
          priority: isLastTwoDays ? "high" : i % 2 === 0 ? "high" : "medium",
          notes: isLastTwoDays
            ? "Full timed practice test under exam conditions + review all missed questions."
            : `Deep dive into ${assignedTopic}. Active recall and solve at least 5 key problems.`,
          topic: assignedTopic,
        });
      }

      generatedPlan = {
        examTitle,
        strategySummary: `Auto-generated ${daysDiff}-day study roadmap prioritizing spaced repetition, active recall, and a dedicated mock test before ${targetDateStr}. (Add GEMINI_API_KEY for dynamic adaptive AI reasoning).`,
        totalStudyHours: daysDiff * dailyHours,
        studyBlocks: blocks,
        tips: [
          "Use 50/10 Pomodoro intervals during each study session.",
          "Spend the first 10 minutes recalling yesterday's material without checking notes.",
          "Keep sleep consistent (7-8 hours) so the brain consolidates learned material into long-term memory.",
        ],
      };
    } else {
      const prompt = `You are an expert cognitive scientist and elite academic coach.
Create an optimal, high-retention study schedule for this student.

Parameters:
- Exam Title: "${examTitle}"
- Today's Date: "${todayStr}"
- Exam Date: "${targetDateStr}"
- Syllabus / Topics: "${topics || "Comprehensive curriculum for " + examTitle}"
- Target Daily Hours: ${dailyHours} hours/day
- Preferred Time Window: ${preferredTime} (default around ${defaultStart} to ${defaultEnd})

Format the JSON response with EXACTLY this structure:
{
  "examTitle": "${examTitle}",
  "strategySummary": "A 2-3 sentence strategic overview of the phased plan (e.g. foundational phase, deep-dive problem solving, spaced repetition, mock exams).",
  "totalStudyHours": number,
  "studyBlocks": [
    {
      "title": "Clear action-oriented session title",
      "date": "YYYY-MM-DD",
      "startTime": "HH:MM",
      "endTime": "HH:MM",
      "priority": "low" | "medium" | "high",
      "notes": "Actionable instructions (e.g. chapters to read, exercises, flashcards, active recall questions)",
      "topic": "Topic name"
    }
  ],
  "tips": [
    "High-impact exam strategy tip 1",
    "High-impact exam strategy tip 2",
    "High-impact exam strategy tip 3"
  ]
}

Ensure dates range from "${todayStr}" up to the day before "${targetDateStr}".
All times must be 24-hour "HH:MM".
Only output the valid JSON.`;

      generatedPlan = await runGeminiWithFallback(
        gemini,
        { generationConfig: { responseMimeType: "application/json" } },
        async (model) => {
          const result = await model.generateContent(prompt);
          return JSON.parse(result.response.text());
        }
      );
    }

    // If requested to save directly into user's database:
    let savedToDb = false;
    let savedCount = 0;
    let examId: string | null = null;

    if (saveToPlanner) {
      const session = await auth();
      const user = await getAuthenticatedUser(session);
      if (user) {
        await connectToDatabase();

        // 1. Create or update the Exam entry
        const newExam = await Exam.create({
          userId: user._id,
          title: examTitle,
          examDate: targetDate,
          notes: generatedPlan.strategySummary,
        });
        examId = newExam._id.toString();

        // 2. Batch insert PlannerItems
        if (generatedPlan.studyBlocks && generatedPlan.studyBlocks.length > 0) {
          const itemsToInsert = generatedPlan.studyBlocks.map((b) => ({
            userId: user._id,
            title: b.title,
            date: b.date,
            startTime: b.startTime,
            endTime: b.endTime,
            priority: b.priority || "medium",
            status: "pending",
            recurring: "none",
            notes: b.notes ? `${b.notes}\n[AI Plan: ${examTitle}]` : `[AI Plan: ${examTitle}]`,
          }));

          const inserted = await PlannerItem.insertMany(itemsToInsert);
          savedCount = inserted.length;
          savedToDb = true;
        }
      }
    }

    return NextResponse.json({
      plan: generatedPlan,
      savedToDb,
      savedCount,
      examId,
      isDemo: !gemini,
    });
  } catch (error: any) {
    console.error("AI Planner Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate study plan" },
      { status: 500 }
    );
  }
}
