import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, fileToGenerativePart, runGeminiWithFallback } from "@/lib/ai-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages = [], image, audio, userContext } = body;

    const gemini = getGeminiClient();

    // If no API key is provided, return simulated coach reply
    if (!gemini) {
      const lastUserMsg = messages[messages.length - 1]?.content || "Hello!";
      return NextResponse.json({
        reply: `Hello! I'm your FocusDesk AI Study Coach. 🎓\n\nI can help you break down complex concepts, quiz you on topics, solve textbook problems from photos, and keep your focus sharp.\n\n💡 **Tip**: To enable live AI reasoning with Google Gemini, ensure your **GEMINI_API_KEY** is configured in your server environment (\`.env.local\`).\n\nRegarding: *"${lastUserMsg.slice(0, 80)}"* — Remember the Feynman Technique: try explaining this concept in simple terms without technical jargon to verify your true mastery!`,
        isDemo: true,
      });
    }

    const lastMessage = messages[messages.length - 1];
    let promptText = lastMessage?.content || "";

    if ((!promptText.trim() || promptText.includes("[Spoken Voice Question]")) && audio) {
      promptText = "Listen carefully to this student's recorded voice question. Answer it step-by-step with simple analogies, structured explanations, and actionable academic advice.";
    } else if (!promptText.trim()) {
      promptText = "Help me study this concept.";
    }

    let contentParts: any[] = [promptText];

    if (image && image.base64 && image.mimeType) {
      contentParts.push(fileToGenerativePart(image.base64, image.mimeType));
    }

    if (audio && audio.base64 && audio.mimeType) {
      contentParts.push(fileToGenerativePart(audio.base64, audio.mimeType));
    }

    const systemInstruction = `You are the FocusDesk AI Study Coach and Academic Mentor.
Your goal is to help students, scholars, and researchers learn effectively, conquer difficult concepts, prepare for exams, and maintain healthy deep-work habits.
Guidelines:
- Explain complex concepts simply using analogies and the Feynman technique.
- If an image (math problem, diagram, textbook note) is provided, explain it step-by-step and show the full solution clearly.
- If audio or a voice recording is provided, answer the spoken question directly and thoroughly.
- Be encouraging, concise, structured, and use Markdown (bullet points, bold text, code blocks or formulas).
- When appropriate, recommend Pomodoro pacing or active recall.
- Context about this student: ${JSON.stringify(userContext || {})}`;

    // Clean history for Gemini API:
    // 1. Must NEVER start with 'model' (removes any welcome greetings)
    // 2. Must alternate: user -> model -> user -> model
    // 3. Last message in history must be 'model' (since current user prompt is sent to sendMessage)
    const rawHistory = messages.slice(0, -1);
    const firstUserIndex = rawHistory.findIndex((m: any) => m.role === "user");

    const validHistory: any[] = [];
    if (firstUserIndex !== -1) {
      const conversationTurns = rawHistory.slice(firstUserIndex);
      for (const turn of conversationTurns) {
        if (!turn.content?.trim()) continue;
        const role = turn.role === "user" ? "user" : "model";

        // Prevent consecutive turns of the same role
        if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === role) {
          continue;
        }
        validHistory.push({
          role,
          parts: [{ text: turn.content }],
        });
      }

      // Gemini requires the last turn in history before a new user message to be 'model'
      if (validHistory.length > 0 && validHistory[validHistory.length - 1].role === "user") {
        validHistory.pop();
      }
    }

    const reply = await runGeminiWithFallback(
      gemini,
      { systemInstruction },
      async (model) => {
        if (validHistory.length > 0) {
          const chat = model.startChat({ history: validHistory });
          const result = await chat.sendMessage(contentParts);
          return result.response.text();
        } else {
          const result = await model.generateContent(contentParts);
          return result.response.text();
        }
      }
    );

    return NextResponse.json({ reply, isDemo: false });
  } catch (error: any) {
    console.error("AI Coach Error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to generate AI response",
        reply: `I encountered an error processing your request: ${error.message || "Unknown error"}.`,
      },
      { status: 500 }
    );
  }
}
