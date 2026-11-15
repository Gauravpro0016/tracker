import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, GeneratedQuiz, fileToGenerativePart, runGeminiWithFallback } from "@/lib/ai-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic = "General Science & Logic",
      difficulty = "medium",
      questionCount = 5,
      image,
    } = body;

    const gemini = getGeminiClient();

    let generatedQuiz: GeneratedQuiz;

    if (!gemini) {
      // Realistic fallback quiz based on topic
      generatedQuiz = {
        title: `${topic} Quick Mastery Quiz`,
        topic,
        difficulty,
        questions: [
          {
            id: 1,
            question: `In the study of ${topic}, which principle is most critical for long-term retention?`,
            options: [
              "Passive re-reading of highlighted text",
              "Active recall and spaced repetition testing",
              "Cramming 8 hours before the exam",
              "Copying verbatim notes from slides",
            ],
            correctAnswerIndex: 1,
            explanation:
              "Active recall forces the brain to retrieve information from neural pathways, which strengthens synaptic connections up to 5x more than passive reading.",
            studyTip: "Use the Feynman technique: explain this topic out loud to test yourself without notes.",
          },
          {
            id: 2,
            question: `When analyzing key concepts in ${topic}, what is the best strategy when hitting a complex blocker?`,
            options: [
              "Skip the topic permanently",
              "Deconstruct the problem into foundational first-principles",
              "Memorize the answer without understanding the steps",
              "Increase screen brightness and study late into the night",
            ],
            correctAnswerIndex: 1,
            explanation:
              "First-principles thinking breaks problems down to their most fundamental truths, allowing you to deduce the correct reasoning from the ground up.",
            studyTip: "Draw a concept map linking unknown terms to concepts you already understand.",
          },
          {
            id: 3,
            question: `Which cognitive technique prevents interference and mental burnout during multi-hour ${topic} study sessions?`,
            options: [
              "Studying 6 hours without breaks",
              "The Pomodoro Technique (e.g. 50 min focus / 10 min diffuse rest)",
              "Multitasking with social media and videos",
              "Consuming high sugar drinks continuously",
            ],
            correctAnswerIndex: 1,
            explanation:
              "Diffuse-mode thinking occurs during short breaks, allowing the brain's subconscious to consolidate concepts without cognitive overload.",
            studyTip: "Take true offline breaks (walk, hydrate, stretch) instead of scrolling feeds.",
          },
          {
            id: 4,
            question: `How does self-testing during preparation for ${topic} affect test anxiety?`,
            options: [
              "It increases anxiety exponentially",
              "It has no measurable psychological effect",
              "It substantially reduces test anxiety by habituating the mind to exam-like retrieval conditions",
              "It only helps with multiple-choice questions, not essay tests",
            ],
            correctAnswerIndex: 2,
            explanation:
              "Simulating test retrieval conditions desensitizes the amygdala to performance stress, giving you calm confidence on test day.",
            studyTip: "Time yourself strictly under simulated exam conditions.",
          },
          {
            id: 5,
            question: `What is the most effective post-study review cadence for ${topic}?`,
            options: [
              "Never review once the chapter is finished",
              "Review after 24 hours, 3 days, 1 week, and 1 month",
              "Only review 1 hour before the exam starts",
              "Review every 30 minutes every single day",
            ],
            correctAnswerIndex: 1,
            explanation:
              "The Ebbinghaus Forgetting Curve shows memory drops steeply after 24 hours. Interleaved reviews at increasing intervals flatten the decay curve.",
            studyTip: "Create flashcards for difficult formulas or definitions and review them during your morning routine.",
          },
        ],
      };
    } else {
      const prompt = `You are an elite academic test designer and professor.
Generate an engaging, rigorous ${questionCount}-question multiple-choice quiz on the topic: "${topic}".
Difficulty level: ${difficulty}.

Requirements:
- Each question must have exactly 4 plausible options.
- Only one option must be unambiguously correct.
- Provide a clear, educational explanation for why the correct option is right.
- Provide a concise practical study tip / mnemonic for that concept.
- correctAnswerIndex MUST be a 0-based integer (0, 1, 2, or 3) indicating the position in the options array.

Format the JSON response with EXACTLY this structure:
{
  "title": "Short catchy title for the quiz",
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": 1,
      "question": "Question text...",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Clear explanation of the solution...",
      "studyTip": "Memory trick or study tip..."
    }
  ]
}

Only return valid JSON.`;

      let parts: any[] = [prompt];
      if (image && image.base64 && image.mimeType) {
        parts.push(fileToGenerativePart(image.base64, image.mimeType));
      }

      generatedQuiz = await runGeminiWithFallback(
        gemini,
        { generationConfig: { responseMimeType: "application/json" } },
        async (model) => {
          const result = await model.generateContent(parts);
          return JSON.parse(result.response.text());
        }
      );
    }

    return NextResponse.json({
      quiz: generatedQuiz,
      isDemo: !gemini,
    });
  } catch (error: any) {
    console.error("AI Quiz Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate quiz" },
      { status: 500 }
    );
  }
}
