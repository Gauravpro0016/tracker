import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import Subject from "@/models/Subject";
import { registerSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation error", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, username, email, password } = parsed.data;

    await connectToDatabase();

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const existingUsername = await User.findOne({ username: username.toLowerCase() });
    if (existingUsername) {
      return NextResponse.json(
        { error: "This username is already taken" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      passwordHash,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      theme: {
        preset: "black-white",
        backgroundColor: "#000000",
        textColor: "#ffffff",
        accentColor: "#ffffff",
        borderColor: "#262626",
        cardColor: "#0a0a0a",
        fontChoice: "Inter",
        timerFontSize: "7rem",
        borderRadius: 12,
        showSeconds: true,
        clockFormat: "24h",
        digitStyle: "normal",
      },
      wallpaper: {
        type: "preset",
        url: "preset-minimal-1",
        overlayOpacity: 0.5,
        blurAmount: 0,
      },
      settings: {
        pomodoro: {
          focusMinutes: 25,
          shortBreakMinutes: 5,
          longBreakMinutes: 15,
          sessionsBeforeLongBreak: 4,
          autoStartBreaks: false,
          autoStartFocus: false,
        },
        sound: {
          enabled: true,
          soundType: "bell",
          volume: 0.7,
        },
        dailyMinimumMinutes: 15,
      },
    });

    // Create default subjects
    await Subject.insertMany([
      { userId: user._id, name: "Deep Work", color: "#ffffff", icon: "zap" },
      { userId: user._id, name: "Coding", color: "#3b82f6", icon: "code" },
      { userId: user._id, name: "Reading", color: "#10b981", icon: "book" },
      { userId: user._id, name: "Mathematics", color: "#f59e0b", icon: "sigma" },
    ]);

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user._id.toString(),
          name: user.name,
          username: user.username,
          email: user.email,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Register error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to register user" },
      { status: 500 }
    );
  }
}

