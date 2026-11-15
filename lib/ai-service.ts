import { GoogleGenerativeAI, Part } from "@google/generative-ai";

export function getGeminiClient(): GoogleGenerativeAI | null {
  const apiKey = (process.env.GEMINI_API_KEY || "").trim();
  if (!apiKey || apiKey === "your-gemini-api-key-here") {
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
}

export const GEMINI_PRIMARY_MODEL = "gemini-3.5-flash-lite";

// Prioritized list: fastest, most available first, with automatic failover on 503/429/404
export const GEMINI_FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.5-flash",
  "gemini-3.6-flash",
  "gemini-3.8-flash",
  "gemini-flash-latest",
  "gemini-2.5-flash",
];

export async function runGeminiWithFallback<T>(
  client: GoogleGenerativeAI,
  modelOptions: { systemInstruction?: string; generationConfig?: any },
  execute: (model: any) => Promise<T>
): Promise<T> {
  let lastError: any = null;
  for (const modelName of GEMINI_FALLBACK_MODELS) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        ...modelOptions,
      });
      return await execute(model);
    } catch (err: any) {
      lastError = err;
      console.warn(`[FocusDesk AI] Model ${modelName} encountered (${err?.status || err?.message}). Attempting next candidate...`);
      continue;
    }
  }
  throw lastError;
}

export interface CoachMessage {
  role: "user" | "model";
  content: string;
}

export interface ImageAttachment {
  base64: string;
  mimeType: string;
}

export interface StudyPlanItem {
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  priority: "low" | "medium" | "high";
  notes: string;
  topic: string;
}

export interface GeneratedStudyPlan {
  examTitle: string;
  strategySummary: string;
  totalStudyHours: number;
  studyBlocks: StudyPlanItem[];
  tips: string[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  studyTip: string;
}

export interface GeneratedQuiz {
  title: string;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questions: QuizQuestion[];
}

export interface AnalyticsInsight {
  scholarPersona: string;
  strengths: string[];
  improvements: string[];
  recommendedSchedule: string;
  weeklyAdvice: string;
}

/**
 * Format image or audio base64 into Gemini Part with strict canonical Base64 encoding
 */
export function fileToGenerativePart(base64Data: string, mimeType: string): Part {
  // Strip any data URI scheme header if present (e.g. data:audio/webm;codecs=opus;base64, or data:image/png;base64,)
  let cleanData = base64Data.includes(",") ? base64Data.split(",")[1] : base64Data;
  cleanData = cleanData.trim();

  // Canonicalize Base64 to guarantee strict RFC 4648 compliance (valid padding and valid trailing bits)
  if (typeof Buffer !== "undefined") {
    try {
      cleanData = Buffer.from(cleanData, "base64").toString("base64");
    } catch {
      // Keep original if Buffer fails
    }
  }

  // Clean mimeType if it contains codec parameters (e.g. "audio/webm;codecs=opus" -> "audio/webm")
  const cleanMime = mimeType ? mimeType.split(";")[0].trim() : mimeType;

  return {
    inlineData: {
      data: cleanData,
      mimeType: cleanMime,
    },
  };
}
