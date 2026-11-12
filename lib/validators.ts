import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  username: z.string().min(3).max(30).optional(),
  bio: z.string().max(250).optional(),
  timezone: z.string().optional(),
  avatar: z.string().url().or(z.literal("")).optional(),
  educationLevel: z.string().max(100).optional(),
  targetExam: z.string().max(100).optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const themeSchema = z.object({
  preset: z.string().default("black-white"),
  backgroundColor: z.string().default("#000000"),
  textColor: z.string().default("#ffffff"),
  accentColor: z.string().default("#ffffff"),
  borderColor: z.string().default("#262626"),
  cardColor: z.string().default("#0a0a0a"),
  fontChoice: z.string().default("Inter"),
  timerFontSize: z.string().default("7rem"),
  borderRadius: z.number().default(12),
  showSeconds: z.boolean().default(true),
  clockFormat: z.enum(["12h", "24h"]).default("24h"),
  digitStyle: z.enum(["normal", "flip"]).default("normal"),
});

export const wallpaperSchema = z.object({
  type: z.enum(["color", "gradient", "preset", "image", "video", "youtube"]).default("preset"),
  url: z.string().default(""),
  overlayOpacity: z.number().min(0).max(1).default(0.5),
  blurAmount: z.number().min(0).max(20).default(0),
});

export const settingsSchema = z.object({
  pomodoro: z.object({
    focusMinutes: z.number().min(1).max(180).default(25),
    shortBreakMinutes: z.number().min(1).max(60).default(5),
    longBreakMinutes: z.number().min(1).max(60).default(15),
    sessionsBeforeLongBreak: z.number().min(1).max(12).default(4),
    autoStartBreaks: z.boolean().default(false),
    autoStartFocus: z.boolean().default(false),
  }),
  sound: z.object({
    enabled: z.boolean().default(true),
    soundType: z.enum(["bell", "digital", "chime", "marimba"]).default("bell"),
    volume: z.number().min(0).max(1).default(0.7),
  }),
  dailyMinimumMinutes: z.number().min(1).max(1440).default(15),
});

export const createSessionSchema = z.object({
  subjectId: z.string().nullable().optional(),
  task: z.string().max(200).default(""),
  mode: z.enum(["stopwatch", "countdown", "pomodoro"]).default("stopwatch"),
  durationSeconds: z.number().min(1, "Session duration must be at least 1 second"),
  startedAt: z.string().or(z.date()),
  endedAt: z.string().or(z.date()),
  notes: z.string().max(1000).optional(),
});

export const manualSessionSchema = z.object({
  subjectId: z.string().nullable().optional(),
  task: z.string().max(200).default("Manual Session"),
  mode: z.enum(["stopwatch", "countdown", "pomodoro"]).default("stopwatch"),
  durationSeconds: z.number().min(60, "Duration must be at least 1 minute"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  notes: z.string().max(1000).optional(),
});

export const subjectSchema = z.object({
  name: z.string().min(1, "Subject name is required").max(50),
  color: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Valid hex color required"),
  icon: z.string().optional(),
});

export const taskSchema = z.object({
  text: z.string().min(1, "Task description is required").max(300),
  completed: z.boolean().default(false),
  subjectId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export const plannerItemSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  subjectId: z.string().nullable().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Time must be HH:MM"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["pending", "done"]).default("pending"),
  recurring: z.enum(["none", "daily", "weekly"]).default("none"),
  notes: z.string().max(1000).optional(),
});

export const habitSchema = z.object({
  name: z.string().min(1, "Habit name is required").max(200, "Habit name must be 200 characters or less"),
  category: z.string().max(100).optional().or(z.literal("")).default("General"),
  targetDaysPerWeek: z.coerce.number().min(1).max(7).default(7),
  color: z.string().default("#ffffff"),
});

export const habitLogSchema = z.object({
  habitId: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  completed: z.boolean(),
});

export const goalSchema = z.object({
  title: z.string().min(1, "Goal title is required").max(200),
  subjectId: z.string().nullable().optional(),
  type: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  targetHours: z.number().min(0.1).max(1000),
  active: z.boolean().default(true),
});

export const examSchema = z.object({
  title: z.string().min(1, "Exam title is required").max(200),
  subjectId: z.string().nullable().optional(),
  examDate: z.string(),
  targetScore: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

export const contactMessageSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name cannot exceed 100 characters"),
  email: z.string().email("Please provide a valid email address"),
  subject: z.string().max(150, "Subject cannot exceed 150 characters").optional().default("General Support"),
  message: z.string().min(10, "Message must be at least 10 characters").max(3000, "Message cannot exceed 3000 characters"),
});

